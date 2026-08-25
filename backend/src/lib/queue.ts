export type JobHandler<T = any> = (data: T) => Promise<void>;

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  handler: JobHandler<T>;
  attempts: number;
  maxRetries: number;
  createdAt: number;
  lastError?: string;
}

export interface QueueStats {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  totalProcessed: number;
}

class BackgroundQueue {
  private queue: Job[] = [];
  private activeJobs = new Set<string>();
  private concurrency: number;
  private stats: QueueStats = {
    pending: 0,
    active: 0,
    completed: 0,
    failed: 0,
    totalProcessed: 0,
  };
  private isProcessing = false;

  constructor(concurrency: number = 5) {
    this.concurrency = concurrency;
  }

  public add<T>(
    name: string,
    data: T,
    handler: JobHandler<T>,
    maxRetries: number = 3
  ): string {
    const id = `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const job: Job<T> = {
      id,
      name,
      data,
      handler,
      attempts: 0,
      maxRetries,
      createdAt: Date.now(),
    };

    this.queue.push(job);
    this.stats.pending = this.queue.length;

    // Trigger process loop asynchronously
    setImmediate(() => this.processNext());

    return id;
  }

  public getStats(): QueueStats {
    return {
      ...this.stats,
      pending: this.queue.length,
      active: this.activeJobs.size,
    };
  }

  private async processNext(): Promise<void> {
    if (this.activeJobs.size >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.activeJobs.add(job.id);
    this.stats.pending = this.queue.length;
    this.stats.active = this.activeJobs.size;

    job.attempts++;

    try {
      await job.handler(job.data);
      this.stats.completed++;
      this.stats.totalProcessed++;
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      job.lastError = errorMsg;
      console.error(`[Queue] Job ${job.name} (ID: ${job.id}) failed on attempt ${job.attempts}/${job.maxRetries}:`, errorMsg);

      if (job.attempts < job.maxRetries) {
        // Exponential backoff: 2s, 4s, 8s...
        const delayMs = Math.min(2000 * Math.pow(2, job.attempts - 1), 30000);
        setTimeout(() => {
          this.queue.push(job);
          this.stats.pending = this.queue.length;
          this.processNext();
        }, delayMs);
      } else {
        console.error(`[Queue] Job ${job.name} (ID: ${job.id}) permanently failed after ${job.maxRetries} attempts.`);
        this.stats.failed++;
        this.stats.totalProcessed++;
      }
    } finally {
      this.activeJobs.delete(job.id);
      this.stats.active = this.activeJobs.size;
      this.stats.pending = this.queue.length;

      // Continue processing next available job
      setImmediate(() => this.processNext());
    }
  }
}

export const backgroundQueue = new BackgroundQueue(5);
