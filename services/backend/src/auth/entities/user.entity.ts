import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
  type Relation,
} from 'typeorm'
import { Role } from './role.entity'
import type { Session } from './session.entity'
import type { OAuthAccount } from './oauth-account.entity'
import type { PasswordResetToken } from './password-reset-token.entity'
import type { EmailVerificationToken } from './email-verification-token.entity'
import { DEFAULT_USER_PREFERENCES } from '../interfaces/user-preferences.interface'
import type { UserPreferences } from '../interfaces/user-preferences.interface'

@Entity('users')
@Index(['email'])
@Index(['phone'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', unique: true, length: 255 })
  email!: string

  @Column({ type: 'varchar', nullable: true, unique: true, length: 30 })
  @Index('IDX_USERS_USERNAME')
  username?: string

  @Column({ type: 'varchar', nullable: true, select: false, length: 255 })
  password!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'varchar', nullable: true, length: 500 })
  avatar!: string

  @Column({ type: 'varchar', nullable: true, length: 50 })
  phone!: string

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified!: boolean

  @Column({ name: 'phone_verified', type: 'boolean', default: false })
  phoneVerified!: boolean

  @Column({ name: 'two_factor_enabled', type: 'boolean', default: false })
  twoFactorEnabled!: boolean

  @Column({
    name: 'two_factor_secret',
    type: 'varchar',
    nullable: true,
    select: false,
    length: 255,
  })
  twoFactorSecret!: string

  @Column({
    type: 'jsonb',
    default: () => `'${JSON.stringify(DEFAULT_USER_PREFERENCES)}'::jsonb`,
  })
  preferences!: UserPreferences

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @ManyToMany(() => Role, role => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[]

  @OneToMany('Session', 'user')
  sessions!: Relation<Session[]>

  @OneToMany('OAuthAccount', 'user')
  oauthAccounts!: Relation<OAuthAccount[]>

  @OneToMany('PasswordResetToken', 'user')
  passwordResetTokens!: Relation<PasswordResetToken[]>

  @OneToMany('EmailVerificationToken', 'user')
  emailVerificationTokens!: Relation<EmailVerificationToken[]>
}
