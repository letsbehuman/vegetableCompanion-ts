import Queue, { Job } from 'bull';
import Logger from 'bunyan';
import { BullAdapter, createBullBoard } from '@bull-board/express';
import { ExpressAdapter } from '@bull-board/express';
import { config } from '@root/config';
import { IAuthJob } from '@auth/interfaces/auth.interface';

type IBaseJobData = IAuthJob;

let bullAdapter: BullAdapter[] = [];

export let serverAdapter: ExpressAdapter;
export abstract class BaseQueue {
  queue: Queue.Queue;
  log: Logger;
  constructor(queueName: string) {
    this.queue = new Queue(queueName, `${config.REDIS_HOST}`);
    bullAdapter.push(new BullAdapter(this.queue));
    bullAdapter = [...new Set(bullAdapter)];
    serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/queues');
    //BullDashbaord to see in the browser the status of the jobs, http://localhost:5000/queues/
    createBullBoard({
      queues: bullAdapter,
      serverAdapter
    });
    this.log = config.createLogger(`${queueName}Queue`);
    this.queue.on('completed', (job: Job) => {
      job.remove();
    });
    this.queue.on('global:completed', (jobId: string) => {
      this.log.info(`Job ${jobId} completed`);
    });
    this.queue.on('global:stalled', (jobId: Job) => {
      this.log.info(`Job ${jobId} is sstalled`);
    });
  }
  protected addJob(name: string, data: IBaseJobData): void {
    this.queue.add(name, data, { attempts: 3, backoff: { type: 'fixed', delay: 5000 } });
  }
  //concurrency means the amount of jobs that will work on it at the certain time
  protected processJob(name: string, concurrency: number, callback: Queue.ProcessCallbackFunction<void>): void {
    this.queue.process(name, concurrency, callback);
  }
}
