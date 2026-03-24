import type { Log } from '../entities/Log.js';

export interface ILogRepository {
  create(log: Log): Promise<Log>;
  findAll(): Promise<Log[]>;
}
