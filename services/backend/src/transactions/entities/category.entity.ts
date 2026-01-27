import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm'
import { Transaction } from './transaction.entity'

@Entity('categories')
@Index(['userId'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string

  @Column({ length: 100 })
  name!: string

  @Column({ length: 7 })
  color!: string

  @Column({ length: 50 })
  icon!: string

  @Column({ type: 'text', nullable: true })
  description!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @OneToMany(() => Transaction, transaction => transaction.category)
  transactions!: Transaction[]
}
