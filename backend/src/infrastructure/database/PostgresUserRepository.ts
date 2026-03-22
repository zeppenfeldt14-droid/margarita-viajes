import { Knex } from 'knex';
import { IUserRepository, User } from '../../domain/repositories/IUserRepository.js';

export class PostgresUserRepository implements IUserRepository {
  constructor(private db: Knex) {}

  async findByUsername(username: string): Promise<User | null> {
    const row = await this.db('users').where('email', username).first();
    if (!row) return null;
    return {
      id: row.id,
      username: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      fullName: row.full_name
    };
  }

  async findAll(): Promise<User[]> {
    const rows = await this.db('users').select('*');
    return rows.map(row => ({
      id: row.id,
      username: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      fullName: row.full_name
    }));
  }

  async create(user: User): Promise<User> {
    const [row] = await this.db('users').insert({
      email: user.username,
      password_hash: user.passwordHash,
      role: user.role,
      full_name: user.fullName
    }).returning('*');
    return {
      id: row.id,
      username: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      fullName: row.full_name
    };
  }
}
