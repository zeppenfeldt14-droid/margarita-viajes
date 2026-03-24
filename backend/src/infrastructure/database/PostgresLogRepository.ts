type Knex = any;
import type { ILogRepository } from '../../domain/repositories/ILogRepository.js';
import type { Log } from '../../domain/entities/Log.js';

export class PostgresLogRepository implements ILogRepository {
  constructor(private db: Knex) {}

  async create(log: Log): Promise<Log> {
    const [row] = await this.db('logs').insert({
      user_id: log.user_id,
      user_name: log.user_name,
      action_type: log.action_type,
      details: log.details
    }).returning('*');
    return row;
  }

  async findAll(): Promise<Log[]> {
    return this.db('logs').select('*').orderBy('created_at', 'desc');
  }
}
