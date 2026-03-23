import type { ISeasonRepository, Season } from '../../domain/repositories/ISeasonRepository.js';
import type { Knex } from 'knex';

export class PostgresSeasonRepository implements ISeasonRepository {
  constructor(private db: Knex) {}

  async findIntersecting(roomId: string, checkIn: string, checkOut: string): Promise<Season[]> {
    // 1. Encontrar a qué hotel pertenece la habitación
    const room = await this.db('rooms').where('id', roomId).first();
    if (!room) return [];

    // 2. Buscar temporadas de ese hotel que solapen con el rango solicitado
    // Nota: Simplificamos la lógica de rango para SQLite/Postgres sin extensiones complejas
    const results = await this.db('seasons')
      .where('hotel_id', room.hotel_id)
      .where('start_date', '<=', checkOut)
      .where('end_date', '>=', checkIn);

    return results.map((row: any) => {
      let prices = row.room_prices;
      if (typeof prices === 'string') {
        try { prices = JSON.parse(prices); } catch (e) { prices = {}; }
      }

      return {
        id: row.id,
        roomId: roomId,
        pricePerNight: prices[roomId] || 0,
        period: {
          contains: (date: string) => {
            return date >= row.start_date && date <= row.end_date;
          }
        }
      };
    });
  }
}
