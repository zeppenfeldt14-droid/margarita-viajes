import type { IAuditRepository, AuditLog } from '../../domain/repositories/IAuditRepository.js';
import knex from 'knex';
type Knex = any;

export class PostgresAuditRepository implements IAuditRepository {
  constructor(private db: Knex) {}

  async log(audit: AuditLog): Promise<void> {
    await this.db('audit_trail').insert({
      user_id: audit.userId,
      action: audit.action,
      table_name: audit.tableName,
      record_id: audit.recordId,
      old_data: typeof audit.oldValue === 'object' ? JSON.stringify(audit.oldValue) : audit.oldValue,
      new_data: typeof audit.newValue === 'object' ? JSON.stringify(audit.newValue) : audit.newValue
    });
  }
}
