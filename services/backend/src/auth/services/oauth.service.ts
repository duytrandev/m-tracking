import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { OAuthAccount } from '../entities/oauth-account.entity';
import { Role } from '../entities/role.entity';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { EncryptionUtil } from '../utils/encryption.util';

export interface OAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatar: string | null;
  accessToken: string;
  refreshToken: string | null;
}

export interface OAuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
  };
}

/**
 * OAuth Service
 * Handles OAuth account linking, user creation, and authentication
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OAuthAccount)
    private oauthAccountRepository: Repository<OAuthAccount>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private tokenService: TokenService,
    private sessionService: SessionService,
  ) {}

  /**
   * Handle OAuth callback - link or create account
   * @param profile OAuth profile from provider
   * @param req Request object with IP and user agent
   */
  async handleOAuthCallback(
    profile: OAuthProfile,
    req: any,
  ): Promise<OAuthLoginResponse> {
    this.logger.log(
      `OAuth callback: ${profile.provider} - ${profile.email} (ID: ${profile.providerId})`,
    );

    // Check if OAuth account already linked
    let oauthAccount = await this.oauthAccountRepository.findOne({
      where: {
        provider: profile.provider,
        providerId: profile.providerId,
      },
      relations: ['user'],
    });

    let user: User;

    if (oauthAccount) {
      // Existing OAuth account - update tokens
      user = oauthAccount.user;
      await this.updateOAuthTokens(oauthAccount, profile);
      this.logger.log(`Existing OAuth account found for user: ${user.id}`);
    } else {
      // New OAuth account - link or create user
      user = await this.linkOrCreateUser(profile);
      oauthAccount = await this.createOAuthAccount(user.id, profile);
      this.logger.log(`New OAuth account created for user: ${user.id}`);
    }

    // Create session first
    const session = await this.sessionService.createSession(
      user.id,
      '', // Temporary, will update with refresh token
      req.headers['user-agent'] || 'Unknown',
      req.ip || req.connection.remoteAddress || 'Unknown',
    );

    // Generate JWT tokens
    const accessToken = this.tokenService.generateAccessToken(user, session.id);
    const refreshToken = this.tokenService.generateRefreshToken(user.id, session.id, 1);

    // Update session with refresh token
    await this.sessionService.updateRefreshToken(session.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  /**
   * Link OAuth account to existing user or create new user
   */
  private async linkOrCreateUser(profile: OAuthProfile): Promise<User> {
    // Try to find existing user by email (auto-link if verified)
    if (profile.email && profile.emailVerified) {
      const existingUser = await this.userRepository.findOne({
        where: { email: profile.email },
      });

      if (existingUser) {
        this.logger.log(
          `Auto-linking OAuth account to existing user: ${existingUser.id}`,
        );
        // Update avatar if not set
        if (!existingUser.avatar && profile.avatar) {
          existingUser.avatar = profile.avatar;
          await this.userRepository.save(existingUser);
        }
        return existingUser;
      }
    }

    // Create new user
    return await this.createUserFromOAuth(profile);
  }

  /**
   * Create new user from OAuth profile
   */
  private async createUserFromOAuth(profile: OAuthProfile): Promise<User> {
    // Get default user role
    let userRole = await this.roleRepository.findOne({
      where: { name: 'user' },
    });

    if (!userRole) {
      this.logger.warn('User role not found, creating default role');
      userRole = this.roleRepository.create({
        name: 'user',
        description: 'Standard user role',
        permissions: [],
      });
      await this.roleRepository.save(userRole);
    }

    const user = new User();
    user.email = profile.email;
    user.name = profile.name;
    user.avatar = profile.avatar || '';
    user.emailVerified = profile.emailVerified;
    user.password = ''; // OAuth users don't have passwords
    user.roles = [userRole];

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`Created new user from OAuth: ${savedUser.id}`);
    return savedUser;
  }

  /**
   * Create OAuth account record
   */
  private async createOAuthAccount(
    userId: string,
    profile: OAuthProfile,
  ): Promise<OAuthAccount> {
    // Check if OAuth account already exists for this provider
    const existing = await this.oauthAccountRepository.findOne({
      where: {
        userId,
        provider: profile.provider,
      },
    });

    if (existing) {
      throw new ConflictException(
        `${profile.provider} account already linked to this user`,
      );
    }

    const oauthAccount = new OAuthAccount();
    oauthAccount.userId = userId;
    oauthAccount.provider = profile.provider;
    oauthAccount.providerId = profile.providerId;
    oauthAccount.providerEmail = profile.email;
    oauthAccount.accessToken = EncryptionUtil.encrypt(profile.accessToken);
    oauthAccount.refreshToken = profile.refreshToken
      ? EncryptionUtil.encrypt(profile.refreshToken)
      : '';

    return await this.oauthAccountRepository.save(oauthAccount);
  }

  /**
   * Update OAuth tokens for existing account
   */
  private async updateOAuthTokens(
    oauthAccount: OAuthAccount,
    profile: OAuthProfile,
  ): Promise<void> {
    oauthAccount.accessToken = EncryptionUtil.encrypt(profile.accessToken);
    if (profile.refreshToken) {
      oauthAccount.refreshToken = EncryptionUtil.encrypt(profile.refreshToken);
    }
    oauthAccount.providerEmail = profile.email;
    await this.oauthAccountRepository.save(oauthAccount);
  }

  /**
   * Unlink OAuth account from user
   */
  async unlinkOAuthAccount(userId: string, provider: string): Promise<void> {
    const oauthAccount = await this.oauthAccountRepository.findOne({
      where: { userId, provider },
    });

    if (!oauthAccount) {
      throw new UnauthorizedException('OAuth account not found');
    }

    // Ensure user has password or other OAuth account
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['oauthAccounts'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user has password authentication
    if (!user.password && user.oauthAccounts.length === 1) {
      throw new ConflictException(
        'Cannot unlink last authentication method. Set a password first.',
      );
    }

    await this.oauthAccountRepository.remove(oauthAccount);
    this.logger.log(`Unlinked ${provider} account for user: ${userId}`);
  }

  /**
   * Get linked OAuth accounts for user
   */
  async getLinkedAccounts(userId: string): Promise<OAuthAccount[]> {
    return await this.oauthAccountRepository.find({
      where: { userId },
      select: ['id', 'provider', 'providerEmail', 'createdAt', 'updatedAt'],
    });
  }
}
