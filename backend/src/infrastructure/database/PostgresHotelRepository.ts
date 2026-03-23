import type { IHotelRepository, Hotel, Room, SeasonRate } from '../../domain/repositories/IHotelRepository.js';
import { type Knex } from 'knex';
import crypto from 'crypto';

export class PostgresHotelRepository implements IHotelRepository {
  constructor(private db: Knex) {}

  async findAll(): Promise<Hotel[]> {
    const hotels = await this.db('hotels').select('*').orderBy('name', 'asc');
    const result: Hotel[] = [];
    
    for (const hotel of hotels) {
      const rooms = await this.db('rooms').where('hotel_id', hotel.id);
      const seasons = await this.db('seasons').where('hotel_id', hotel.id);
      
      result.push({
        ...hotel,
        photos: hotel.photos ? JSON.parse(hotel.photos) : [],
        rooms: rooms,
        seasons: seasons.map(s => ({
          ...s,
          startDate: s.start_date,
          endDate: s.end_date,
          roomPrices: typeof s.room_prices === 'string' ? JSON.parse(s.room_prices) : s.room_prices
        }))
      });
    }
    return result;
  }

  async findById(id: string): Promise<Hotel | null> {
    const hotel = await this.db('hotels').where('id', id).first();
    if (!hotel) return null;

    const rooms = await this.db('rooms').where('hotel_id', id);
    const seasons = await this.db('seasons').where('hotel_id', id);

    return {
      ...hotel,
      photos: hotel.photos ? JSON.parse(hotel.photos) : [],
      rooms: rooms,
      seasons: seasons.map(s => ({
        ...s,
        startDate: s.start_date,
        endDate: s.end_date,
        roomPrices: typeof s.room_prices === 'string' ? JSON.parse(s.room_prices) : s.room_prices
      }))
    };
  }

  async create(hotel: Hotel): Promise<Hotel> {
    return await this.db.transaction(async trx => {
      const hotelId = hotel.id || crypto.randomUUID();
      
      const [newHotel] = await trx('hotels').insert({
        id: hotelId,
        name: hotel.name,
        location: hotel.location,
        description: hotel.description,
        logo: hotel.logo,
        photos: JSON.stringify(hotel.photos || []),
        type: hotel.type || 'hotel',
        email: hotel.email,
        plan: hotel.plan
      }).returning('*');

      const idMapping: Record<string, string> = {};

      if (hotel.rooms && hotel.rooms.length > 0) {
        const roomsToInsert = hotel.rooms.map((r: Room) => {
          const newRoomId = crypto.randomUUID();
          if (r.id) idMapping[r.id] = newRoomId;
          return {
            id: newRoomId,
            hotel_id: hotelId,
            name: r.name,
            capacity: r.capacity
          };
        });
        await trx('rooms').insert(roomsToInsert);
        newHotel.rooms = roomsToInsert;
      }

      if (hotel.seasons && hotel.seasons.length > 0) {
        const seasonsToInsert = hotel.seasons.map((s: SeasonRate) => {
          const newSeasonId = crypto.randomUUID();
          
          // Re-mapear precios con los nuevos IDs de habitaciones
          const newRoomPrices: Record<string, number> = {};
          if (s.roomPrices) {
            Object.entries(s.roomPrices).forEach(([oldId, price]) => {
              const targetId = idMapping[oldId] || oldId;
              newRoomPrices[targetId] = price;
            });
          }

          return {
            id: newSeasonId,
            hotel_id: hotelId,
            type: s.type,
            start_date: s.startDate,
            end_date: s.endDate,
            room_prices: JSON.stringify(newRoomPrices)
          };
        });
        await trx('seasons').insert(seasonsToInsert);
        newHotel.seasons = seasonsToInsert;
      }

      return newHotel;
    });
  }

  async update(id: string, hotel: Partial<Hotel>): Promise<void> {
    await this.db.transaction(async trx => {
      const { rooms, seasons, photos, id: _id, ...basicData } = hotel;

      // 1. Actualizar datos básicos
      const updateData: any = {};
      const validColumns = ['name', 'location', 'description', 'logo', 'type', 'email', 'plan'];
      for (const col of validColumns) {
        if (basicData[col as keyof typeof basicData] !== undefined) {
          updateData[col] = basicData[col as keyof typeof basicData];
        }
      }
      if (photos) updateData.photos = JSON.stringify(photos);
      
      if (Object.keys(updateData).length > 0) {
        await trx('hotels').where('id', id).update(updateData);
      }

      const idMapping: Record<string, string> = {};

      // 2. Sincronizar Habitaciones (SIEMPRE generar nuevos IDs para evitar pkey conflict con otros hoteles)
      if (rooms) {
        await trx('rooms').where('hotel_id', id).del();
        if (rooms.length > 0) {
          const roomsToInsert = rooms.map((r: Room) => {
            const newRoomId = crypto.randomUUID();
            if (r.id) idMapping[r.id] = newRoomId;
            return {
              id: newRoomId,
              hotel_id: id,
              name: r.name,
              capacity: r.capacity
            };
          });
          await trx('rooms').insert(roomsToInsert);
        }
      }

      // 3. Sincronizar Temporadas (SIEMPRE generar nuevos IDs)
      if (seasons) {
        await trx('seasons').where('hotel_id', id).del();
        if (seasons.length > 0) {
          const seasonsToInsert = seasons.map((s: SeasonRate) => {
            const newSeasonId = crypto.randomUUID();
            
            // Re-mapear precios con el mapeo de habitaciones
            const newRoomPrices: Record<string, number> = {};
            if (s.roomPrices) {
              Object.entries(s.roomPrices).forEach(([oldId, price]) => {
                const targetId = idMapping[oldId] || oldId;
                newRoomPrices[targetId] = price;
              });
            }

            return {
              id: newSeasonId,
              hotel_id: id,
              type: s.type,
              start_date: s.startDate,
              end_date: s.endDate,
              room_prices: JSON.stringify(newRoomPrices)
            };
          });
          await trx('seasons').insert(seasonsToInsert);
        }
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.db('hotels').where('id', id).del();
  }
}
