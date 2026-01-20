/**
 * Transaction created domain event
 *
 * Emitted when a new transaction is recorded.
 * Subscribers can react to this event (e.g., update budget, send notification).
 */
export class TransactionCreatedEvent {
  constructor(
    public readonly transactionId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly type: 'income' | 'expense',
    public readonly categoryId: string,
  ) {}
}
