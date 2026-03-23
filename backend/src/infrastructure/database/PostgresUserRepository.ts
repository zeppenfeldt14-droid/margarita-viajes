import knex from 'knex';
type Knex = any;
import type { IUserRepository, User } from '../../domain/repositories/IUserRepository.js';
import { v4 as uuidv4 } from 'uuid';

export class PostgresUserRepository implements IUserRepository {
  constructor(private db: Knex) {}

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      alias: row.alias,
      passwordHash: row.password_hash,
      role: row.role,
      fullName: row.full_name,
      dailyQuota: row.daily_quota,
      active: Boolean(row.active),
      level: row.level,
      photo: row.photo,
      inRoulette: Boolean(row.in_roulette),
      modules: typeof row.modules === 'string' ? JSON.parse(row.modules) : (row.modules || {}),
      connectionLogs: typeof row.connection_logs === 'string' ? JSON.parse(row.connection_logs) : (row.connection_logs || []),
      actionLogs: typeof row.action_logs === 'string' ? JSON.parse(row.action_logs) : (row.action_logs || [])
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db('users').where('email', email).first();
    if (!row) return null;
    return this.mapRowToUser(row);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db('users').where('id', id).first();
    if (!row) return null;
    return this.mapRowToUser(row);
  }

  async findAll(): Promise<User[]> {
    const rows = await this.db('users').select('*');
    return rows.map((row: any) => this.mapRowToUser(row));
  }

  async create(user: User): Promise<User> {
    const id = user.id || uuidv4();
    const [row] = await this.db('users').insert({
      id: id,
      email: user.email,
      alias: user.alias === '' ? null : user.alias,
      password_hash: user.passwordHash,
      role: user.role,
      full_name: user.fullName,
      daily_quota: user.dailyQuota || 20,
      active: user.active !== false,
      level: user.level || 3,
      photo: user.photo,
      in_roulette: user.inRoulette !== false,
      modules: JSON.stringify(user.modules || {}),
      connection_logs: JSON.stringify(user.connectionLogs || []),
      action_logs: JSON.stringify(user.actionLogs || [])
    }).returning('*');
    return this.mapRowToUser(row);
  }

  async update(id: string, user: Partial<User>): Promise<User> {
    const updateData: any = {};
    if (user.email) updateData.email = user.email;
    if (user.alias !== undefined) updateData.alias = user.alias === '' ? null : user.alias;
    if (user.passwordHash) updateData.password_hash = user.passwordHash;
    if (user.role) updateData.role = user.role;
    if (user.fullName) updateData.full_name = user.fullName;
    if (user.dailyQuota !== undefined) updateData.daily_quota = user.dailyQuota;
    if (user.active !== undefined) updateData.active = user.active;
    if (user.level !== undefined) updateData.level = user.level;
    if (user.photo !== undefined) updateData.photo = user.photo;
    if (user.inRoulette !== undefined) updateData.in_roulette = user.inRoulette;
    if (user.modules !== undefined) updateData.modules = JSON.stringify(user.modules);
    if (user.connectionLogs !== undefined) updateData.connection_logs = JSON.stringify(user.connectionLogs);
    if (user.actionLogs !== undefined) updateData.action_logs = JSON.stringify(user.actionLogs);

    const [row] = await this.db('users')
      .where('id', id)
      .update(updateData)
      .returning('*');
    
    return this.mapRowToUser(row);
  }

  async delete(id: string): Promise<void> {
    await this.db('users').where('id', id).del();
  }
}
