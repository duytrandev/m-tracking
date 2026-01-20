/**
 * Budget exceeded domain event
 *
 * Emitted when a budget limit is exceeded.
 * Subscribers can react to this event (e.g., send alert notification).
 */
export class BudgetExceededEvent {
  constructor(
    public readonly budgetId: string,
    public readonly userId: string,
    public readonly categoryId: string,
    public readonly limit: number,
    public readonly currentAmount: number,
    public readonly percentage: number,
  ) {}
}
