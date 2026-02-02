import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  type Relation,
} from 'typeorm'
import type { User } from './user.entity'

@Entity('email_verification_tokens')
@Index(['tokenHash'])
@Index(['userId'])
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string

  @Column({ name: 'token_hash', type: 'varchar', length: 255 })
  tokenHash!: string

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date

  @Column({ type: 'boolean', default: false })
  used!: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @ManyToOne('User', 'emailVerificationTokens', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>
}
