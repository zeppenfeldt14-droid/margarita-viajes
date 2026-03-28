import type { IRoomRepository, Room } from '../../domain/repositories/IRoomRepository.js';
import knex from 'knex';
type Knex = any;
import crypto from 'crypto';

export class PostgresRoomRepository implements IRoomRepository {
  constructor(private db: Knex) {}

  async findByHotelId(hotelId: string): Promise<Room[]> {
    return await this.db('rooms').where('hotel_id', hotelId).select('*');
  }

  async create(room: Room): Promise<Room> {
    const [result] = await this.db('rooms').insert({
      id: room.id || crypto.randomUUID(),
      hotel_id: room.hotelId,
      name: room.name,
      capacity: room.capacity
    }).returning('*');
    return result;
  }

  async update(id: string, data: Partial<Room>): Promise<Room> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;

    const [updated] = await this.db('rooms')
      .where('id', id)
      .update(updateData)
      .returning('*');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db('rooms').where('id', id).del();
  }
}
