import knexPkg from 'knex';
type Knex = knexPkg.Knex;
import type { IUserRepository, User } from '../../domain/repositories/IUserRepository.js';

export class PostgresUserRepository implements IUserRepository {
  constructor(private db: Knex) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db('users').where('email', email).first();
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      fullName: row.full_name
    };
  }

  async findAll(): Promise<User[]> {
    const rows = await this.db('users').select('*');
    return rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      fullName: row.full_name
    }));
  }

  async create(user: User): Promise<User> {
    const [row] = await this.db('users').insert({
      email: user.email,
      password_hash: user.passwordHash,
      role: user.role,
      full_name: user.fullName
    }).returning('*');
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      fullName: row.full_name
    };
  }
}
