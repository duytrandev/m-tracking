import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  Index,
} from 'typeorm'
import { Role } from './role.entity'

@Entity('permissions')
@Index(['name'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true, length: 100 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @ManyToMany(() => Role, role => role.permissions)
  roles!: Role[]
}
