import { IRoomRepository, Room } from '../../domain/repositories/IRoomRepository.js';
import { Knex } from 'knex';

export class PostgresRoomRepository implements IRoomRepository {
  constructor(private db: Knex) {}

  async findByHotelId(hotelId: string): Promise<Room[]> {
    return await this.db('rooms').where('hotel_id', hotelId).select('*');
  }

  async create(room: Room): Promise<Room> {
    const [result] = await this.db('rooms').insert({
      hotel_id: room.hotelId,
      name: room.name,
      capacity: room.capacity
    }).returning('*');
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.db('rooms').where('id', id).del();
  }
}
