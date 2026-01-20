import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job, QueueOptions, WorkerOptions } from 'bullmq';
import { QueueName, DEFAULT_JOB_OPTIONS } from './queue.constants';
import { JobData, JobResult } from './queue.types';

/**
 * Queue Service
 * Manages BullMQ queues and workers for background job processing
 * Provides methods to add jobs, create workers, and manage lifecycle
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();
  private readonly connection: QueueOptions['connection'];

  constructor(private readonly configService: ConfigService) {
    this.connection = {
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
    };
  }

  /**
   * Get or create a queue by name
   * Queues are cached in memory for reuse
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
   * @param queueName - Name of the queue
   * @param jobName - Name/type of the job
   * @param data - Job payload data
   * @param options - Optional job options (overrides defaults)
   * @returns Created job instance
   */
  async addJob<T extends JobData = JobData>(
    queueName: QueueName | string,
    jobName: string,
    data: T,
    options?: any,
  ): Promise<Job<T>> {
    const queue = this.getQueue<T>(queueName);
    const job = await (queue as any).add(jobName, data, {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    });
    this.logger.debug(`Job "${jobName}" added to "${queueName}"`, { jobId: job.id });
    return job;
  }

  /**
   * Create a worker for processing jobs
   * Workers are cached per queue to prevent duplicates
   * @param queueName - Name of the queue to process
   * @param processor - Async function to process jobs
   * @param options - Optional worker options
   * @returns Worker instance
   */
  createWorker<T extends JobData>(
    queueName: QueueName | string,
    processor: (job: Job<T>) => Promise<JobResult>,
    options?: Partial<WorkerOptions>,
  ): Worker<T> {
    const workerKey = `${queueName}:worker`;

    if (this.workers.has(workerKey)) {
      this.logger.warn(`Worker for "${queueName}" already exists, returning existing instance`);
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

    worker.on('error', (err) => {
      this.logger.error(`Worker error in "${queueName}": ${err.message}`, err.stack);
    });

    this.workers.set(workerKey, worker);
    this.logger.log(`Worker for "${queueName}" started`);
    return worker;
  }

  /**
   * Get job by ID from a specific queue
   */
  async getJob<T extends JobData>(
    queueName: QueueName | string,
    jobId: string,
  ): Promise<Job<T> | undefined> {
    const queue = this.getQueue<T>(queueName);
    return queue.getJob(jobId);
  }

  /**
   * Remove a job from the queue
   */
  async removeJob(queueName: QueueName | string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      this.logger.debug(`Job ${jobId} removed from "${queueName}"`);
    }
  }

  /**
   * Graceful shutdown - closes all workers and queues
   * Called automatically when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down queues and workers...');

    // Close workers first (stop processing)
    for (const [name, worker] of this.workers) {
      await worker.close();
      this.logger.debug(`Worker "${name}" closed`);
    }

    // Then close queues (disconnect from Redis)
    for (const [name, queue] of this.queues) {
      await queue.close();
      this.logger.debug(`Queue "${name}" closed`);
    }

    this.logger.log('All queues and workers shut down successfully');
  }
}
