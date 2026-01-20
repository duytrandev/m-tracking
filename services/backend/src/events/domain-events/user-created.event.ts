/**
 * User created domain event
 *
 * Emitted when a new user registers in the system.
 * Subscribers can react to this event (e.g., send welcome email).
 */
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
  ) {}
}
