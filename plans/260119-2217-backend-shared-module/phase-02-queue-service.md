# Phase 2: Queue Service (BullMQ)

## Context

- [System Architecture - Async Operations](../../docs/system-architecture.md)
- [PROJECT_STRUCTURE.md - Observer Pattern](../../PROJECT_STRUCTURE.md)
- Existing: `EventEmitterModule` for sync events, Redis for connections

## Overview

| Property | Value |
|----------|-------|
| Priority | P1 - Required for async job processing |
| Status | pending |
| Effort | 2.5h |

Implement background job processing using BullMQ with Redis. Enables async operations like bank sync, notifications, and report generation.

## Key Insights

1. **BullMQ already installed**: `bullmq: ^5.28.3` in package.json
2. **Redis available**: RedisService provides connection; BullMQ needs separate connection
3. **Event-driven**: Complement to EventEmitter for long-running tasks
4. **Use cases**: Bank transaction sync, email sending, report generation

## Requirements

### Functional
- F1: Create and manage named queues
- F2: Add jobs with payload and options
- F3: Process jobs with worker handlers
- F4: Retry failed jobs with exponential backoff
- F5: Job scheduling (delayed execution)
- F6: Job progress tracking
- F7: Graceful shutdown on module destroy

### Non-Functional
- NF1: Connection pooling for Redis
- NF2: Separate Redis connection from cache
- NF3: Circuit breaker for resilience
- NF4: Job visibility/monitoring ready

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     QueueService                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Queue Factory                                           ││
│  │ - getQueue(name): Queue                                 ││
│  │ - createWorker(name, processor): Worker                 ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ BullMQ Queues                                           ││
│  │ - bank-sync: Bank transaction sync jobs                 ││
│  │ - notifications: Email/push/telegram                    ││
│  │ - reports: Async report generation                      ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Redis Connection                                        ││
│  │ - Separate from cache (queue:* prefix)                  ││
│  │ - Connection options from config                        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files

### Files to Create
| File | Purpose | Lines |
|------|---------|-------|
| `shared/queue/queue.service.ts` | Main queue service | ~120 |
| `shared/queue/queue.constants.ts` | Queue names, defaults | ~40 |
| `shared/queue/queue.types.ts` | Job payload interfaces | ~50 |
| `shared/queue/index.ts` | Barrel export | ~5 |

### Files to Modify
| File | Change |
|------|--------|
| `shared/shared.module.ts` | Add QueueService provider/export |
| `.env.example` | Add REDIS_QUEUE_HOST (if separate) |

## Implementation Steps

### Step 1: Define Queue Constants

```typescript
// shared/queue/queue.constants.ts
export enum QueueName {
  BANK_SYNC = 'bank-sync',
  NOTIFICATIONS = 'notifications',
  REPORTS = 'reports',
  ANALYTICS = 'analytics',
}

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000, // 1s, 2s, 4s
  },
  removeOnComplete: {
    count: 100, // Keep last 100 completed
    age: 24 * 3600, // Keep for 24h
  },
  removeOnFail: {
    count: 500, // Keep last 500 failed for debugging
  },
};

export const QUEUE_CONNECTION_NAME = 'queue';
```

### Step 2: Define Job Types

```typescript
// shared/queue/queue.types.ts
export interface BankSyncJobData {
  userId: string;
  accountId: string;
  syncType: 'full' | 'incremental';
}

export interface NotificationJobData {
  userId: string;
  type: 'email' | 'push' | 'telegram';
  templateId: string;
  data: Record<string, unknown>;
}

export interface ReportJobData {
  userId: string;
  reportType: 'monthly' | 'annual' | 'custom';
  startDate: string;
  endDate: string;
}

export type JobData = BankSyncJobData | NotificationJobData | ReportJobData;

export interface JobResult {
  success: boolean;
  message?: string;
  data?: unknown;
}
```

### Step 3: Implement QueueService

```typescript
// shared/queue/queue.service.ts
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job, QueueOptions, WorkerOptions } from 'bullmq';
import { QueueName, DEFAULT_JOB_OPTIONS } from './queue.constants';
import { JobData, JobResult } from './queue.types';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();
  private readonly connection: QueueOptions['connection'];

  constructor(private configService: ConfigService) {
    this.connection = {
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
      password: configService.get('REDIS_PASSWORD'),
    };
  }

  /**
   * Get or create a queue by name
   */
  getQueue<T extends JobData = JobData>(name: QueueName | string): Queue<T> {
    if (!this.queues.has(name)) {
      const queue = new Queue<T>(name, {
        connection: this.connection,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      });
      this.queues.set(name, queue);
      this.logger.log(`Queue "${name}" initialized`);
    }
    return this.queues.get(name) as Queue<T>;
  }

  /**
   * Add a job to a queue
   */
  async addJob<T extends JobData>(
    queueName: QueueName | string,
    jobName: string,
    data: T,
    options?: Partial<typeof DEFAULT_JOB_OPTIONS>,
  ): Promise<Job<T>> {
    const queue = this.getQueue<T>(queueName);
    const job = await queue.add(jobName, data, {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    });
    this.logger.debug(`Job "${jobName}" added to "${queueName}"`, { jobId: job.id });
    return job;
  }

  /**
   * Create a worker for processing jobs
   */
  createWorker<T extends JobData>(
    queueName: QueueName | string,
    processor: (job: Job<T>) => Promise<JobResult>,
    options?: Partial<WorkerOptions>,
  ): Worker<T> {
    const workerKey = `${queueName}:worker`;

    if (this.workers.has(workerKey)) {
      return this.workers.get(workerKey) as Worker<T>;
    }

    const worker = new Worker<T>(queueName, processor, {
      connection: this.connection,
      concurrency: 5,
      ...options,
    });

    worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.id} completed`, { queue: queueName });
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`, err.stack, queueName);
    });

    this.workers.set(workerKey, worker);
    this.logger.log(`Worker for "${queueName}" started`);
    return worker;
  }

  /**
   * Get job by ID
   */
  async getJob<T extends JobData>(
    queueName: QueueName | string,
    jobId: string,
  ): Promise<Job<T> | undefined> {
    const queue = this.getQueue<T>(queueName);
    return queue.getJob(jobId);
  }

  /**
   * Graceful shutdown
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down queues and workers...');

    // Close workers first
    for (const [name, worker] of this.workers) {
      await worker.close();
      this.logger.debug(`Worker "${name}" closed`);
    }

    // Then close queues
    for (const [name, queue] of this.queues) {
      await queue.close();
      this.logger.debug(`Queue "${name}" closed`);
    }
  }
}
```

### Step 4: Create Barrel Export

```typescript
// shared/queue/index.ts
export * from './queue.service';
export * from './queue.constants';
export * from './queue.types';
```

### Step 5: Update SharedModule

```typescript
// shared/shared.module.ts (additions)
import { QueueService } from './queue/queue.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, LoggerService, QueueService],
  exports: [RedisService, LoggerService, QueueService],
})
export class SharedModule {}
```

## Todo List

- [ ] Create `shared/queue/queue.constants.ts`
- [ ] Create `shared/queue/queue.types.ts`
- [ ] Create `shared/queue/queue.service.ts`
- [ ] Create `shared/queue/index.ts`
- [ ] Update `shared/shared.module.ts` to register QueueService
- [ ] Write unit tests for QueueService
- [ ] Test job creation and processing
- [ ] Test retry mechanism
- [ ] Test graceful shutdown

## Success Criteria

- [ ] QueueService injectable in any service
- [ ] Jobs can be added to named queues
- [ ] Workers process jobs asynchronously
- [ ] Failed jobs retry with exponential backoff
- [ ] Graceful shutdown without job loss
- [ ] Unit tests pass with >80% coverage

## Testing Strategy

### Unit Tests
```typescript
describe('QueueService', () => {
  it('should create a queue')
  it('should add a job to queue')
  it('should process job with worker')
  it('should retry failed jobs')
  it('should handle graceful shutdown')
});
```

### Integration Test
- Add job, verify processing
- Simulate failure, verify retry
- Test delayed job execution

## Usage Examples

```typescript
// In a service
@Injectable()
export class BankingService {
  constructor(private queueService: QueueService) {}

  async syncBankAccount(userId: string, accountId: string): Promise<void> {
    await this.queueService.addJob(
      QueueName.BANK_SYNC,
      'sync-transactions',
      { userId, accountId, syncType: 'incremental' },
    );
  }
}

// In a worker module
@Injectable()
export class BankSyncWorker implements OnModuleInit {
  constructor(private queueService: QueueService) {}

  onModuleInit() {
    this.queueService.createWorker(
      QueueName.BANK_SYNC,
      async (job) => {
        const { userId, accountId } = job.data;
        // Process bank sync...
        return { success: true };
      },
    );
  }
}
```

## Security Considerations

- Job data should not contain sensitive tokens (use IDs, fetch from DB)
- Rate limit job additions per user
- Validate job payloads before processing

## Next Steps

After completion, proceed to [Phase 3: Utils Module](./phase-03-utils-module.md)
