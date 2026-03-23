import type { IAuditRepository, AuditLog } from '../../domain/repositories/IAuditRepository.js';
import { type Knex } from 'knex';

export class PostgresAuditRepository implements IAuditRepository {
  constructor(private db: Knex) {}

  async log(audit: AuditLog): Promise<void> {
    await this.db('audit_trail').insert({
      user_id: audit.userId,
      action: audit.action,
      table_name: audit.tableName,
      record_id: audit.recordId,
      old_data: audit.oldValue,
      new_data: audit.newValue
    });
  }
}
