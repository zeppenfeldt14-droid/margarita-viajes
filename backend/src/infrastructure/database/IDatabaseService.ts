export interface IDatabaseService {
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  transaction<T>(work: (client: any) => Promise<T>): Promise<T>;
}
