import { type Knex } from 'knex';
import type { IWebConfigRepository } from '../../domain/repositories/IWebConfigRepository.js';

export class PostgresWebConfigRepository implements IWebConfigRepository {
  constructor(private db: Knex) {}

  async getConfig(): Promise<any> {
    const rows = await this.db('web_config').select('*');
    const config: any = {};
    rows.forEach((row: any) => {
      config[row.key] = row.value;
    });
    return config;
  }

  async updateConfig(key: string, value: string): Promise<void> {
    const exists = await this.db('web_config').where('key', key).first();
    if (exists) {
      await this.db('web_config').where('key', key).update({ value });
    } else {
      await this.db('web_config').insert({ key, value });
    }
  }
}
