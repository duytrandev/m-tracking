import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Session } from '../entities/session.entity'
import * as crypto from 'crypto'

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name)

  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>
  ) {}

  /**
   * Create new session
   */
  async createSession(
    userId: string,
    refreshToken: string,
    deviceInfo:
      | string
      | Record<string, string | string[] | number | boolean | null | undefined>,
    ipAddress: string
  ): Promise<Session> {
    const tokenHash = this.hashToken(refreshToken)

    const deviceInfoObj =
      typeof deviceInfo === 'string' ? { userAgent: deviceInfo } : deviceInfo
    const session = this.sessionRepository.create({
      userId,
      refreshTokenHash: tokenHash,
      deviceInfo: deviceInfoObj,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      lastActiveAt: new Date(),
    })

    const savedSession = await this.sessionRepository.save(session)
    this.logger.log(
      `Session created for user: ${userId}, session: ${savedSession.id}`
    )

    return savedSession
  }

  /**
   * Find session by refresh token
   */
  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    const tokenHash = this.hashToken(refreshToken)
    return this.sessionRepository.findOne({
      where: { refreshTokenHash: tokenHash },
      relations: ['user'],
    })
  }

  /**
   * Find session by ID
   */
  async findById(sessionId: string): Promise<Session | null> {
    return this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user'],
    })
  }

  /**
   * Update session last active timestamp
   */
  async updateLastActive(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      lastActiveAt: new Date(),
    })
    this.logger.log(`Session last active updated: ${sessionId}`)
  }

  /**
   * Update session refresh token
   */
  async updateRefreshToken(
    sessionId: string,
    newRefreshToken: string
  ): Promise<void> {
    const tokenHash = this.hashToken(newRefreshToken)
    await this.sessionRepository.update(sessionId, {
      refreshTokenHash: tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Extend 7 days
      lastActiveAt: new Date(),
    })
    this.logger.log(`Session refresh token updated: ${sessionId}`)
  }

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete(sessionId)
    this.logger.log(`Session revoked: ${sessionId}`)
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    const result = await this.sessionRepository.delete({ userId })
    this.logger.log(
      `All sessions revoked for user: ${userId}, count: ${result.affected}`
    )
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { lastActiveAt: 'DESC' },
    })
  }

  /**
   * Clean up expired sessions (can be called by a cron job)
   */
  async cleanupExpiredSessions(): Promise<void> {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute()

    this.logger.log(`Expired sessions cleaned up, count: ${result.affected}`)
  }

  /**
   * Hash token using SHA-256
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}
