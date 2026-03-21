import { Knex } from 'knex';
import { IWebConfigRepository } from '../../domain/repositories/IWebConfigRepository.js';

export class PostgresWebConfigRepository implements IWebConfigRepository {
  constructor(private db: Knex) {}

  async getConfig(): Promise<Record<string, string>> {
    const rows = await this.db('web_config').select('key', 'value');
    const config: Record<string, string> = {};
    rows.forEach(row => {
      config[row.key] = row.value;
    });
    return config;
  }

  async updateConfig(key: string, value: string): Promise<void> {
    await this.db('web_config')
      .insert({ key, value })
      .onConflict('key')
      .merge();
  }
}
