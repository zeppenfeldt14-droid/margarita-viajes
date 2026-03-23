import knex from 'knex';
type Knex = any;
import type { IOperationRepository, Operation, OperationSequence } from '../../domain/repositories/IOperationRepository.js';

export class PostgresOperationRepository implements IOperationRepository {
  constructor(private db: Knex) {}

  async findAll(): Promise<Operation[]> {
    return await this.db('operations').select('*').orderBy('created_at', 'desc');
  }

  async findById(id: string): Promise<Operation | null> {
    const result = await this.db('operations').where('id', id).first();
    return result || null;
  }

  async create(operation: any): Promise<any> {
    const [result] = await this.db('operations').insert({
      id: operation.id,
      quote_id: operation.quoteId,
      client_name: operation.clientName,
      email: operation.email,
      whatsapp: operation.whatsapp,
      hotel_id: operation.hotelId,
      hotel_name: operation.hotelName,
      hotel_email: operation.hotelEmail,
      check_in: operation.checkIn,
      check_out: operation.checkOut,
      room_type: operation.roomType,
      pax: operation.pax,
      children: operation.children,
      infants: operation.infants,
      total_amount: operation.totalAmount,
      companions: JSON.stringify(operation.companions || []),
      technical_sheet: JSON.stringify(operation.technicalSheet || {}),
      status: operation.status
    }).returning('*');
    return result;
  }

  async getNextSequence(): Promise<OperationSequence> {
    const result = await this.db('operations')
      .where('id', 'LIKE', 'V%')
      .orderBy('id', 'desc')
      .first();

    let nextNum = 100001;
    if (result) {
      const numPart = parseInt(result.id.replace(/\D/g, '')) || 0;
      nextNum = numPart + 1;
    }

    return { nextId: 'V' + nextNum.toString().padStart(10, '0') };
  }
}
