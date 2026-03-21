export interface AuditLog {
  userId?: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValue?: string;
  newValue?: string;
}

export interface IAuditRepository {
  log(audit: AuditLog): Promise<void>;
}
