import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'

/**
 * Events module
 *
 * Configures the event emitter for domain events.
 * Import this module to enable event-driven communication.
 *
 * @example
 * // Emit events
 * this.eventEmitter.emit('user.created', new UserCreatedEvent(...))
 *
 * // Listen to events
 * @OnEvent('user.created')
 * handleUserCreated(payload: UserCreatedEvent) { }
 */
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use this instance across the application
      global: true,
      // Set this to `true` to use wildcards
      wildcard: false,
      // The delimiter used to segment namespaces
      delimiter: '.',
      // Maximum number of listeners per event
      maxListeners: 10,
    }),
  ],
  exports: [EventEmitterModule],
})
export class EventsModule {}
