import { Transaction } from '../entities/transaction.entity'

export class PaginatedTransactionResponse {
  transactions!: Transaction[]
  total!: number
  page!: number
  limit!: number
  totalPages!: number
}
