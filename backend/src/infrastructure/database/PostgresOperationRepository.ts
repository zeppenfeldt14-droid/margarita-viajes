import knex from 'knex';
type Knex = any;
import type { IOperationRepository, Operation, OperationSequence } from '../../domain/repositories/IOperationRepository.js';

export class PostgresOperationRepository implements IOperationRepository {
  constructor(private db: Knex) {}

  async findAll(): Promise<Operation[]> {
    const rows = await this.db('operations').select('*').orderBy('created_at', 'desc');
    return rows.map((row: any) => ({
      ...row,
      quoteId: row.quote_id,
      clientName: row.client_name,
      hotelId: row.hotel_id,
      hotelName: row.hotel_name,
      hotelEmail: row.hotel_email,
      checkIn: row.check_in,
      checkOut: row.check_out,
      roomType: row.room_type,
      totalAmount: Number(row.total_amount),
      companions: typeof row.companions === 'string' ? JSON.parse(row.companions) : row.companions,
      technicalSheet: typeof row.technical_sheet === 'string' ? JSON.parse(row.technical_sheet) : row.technical_sheet,
      hotelResponseImage: row.hotel_response_image,
      paymentProofImage: row.payment_proof_image,
      previousId: row.previous_id,
      originalQuoteId: row.original_quote_id,
      includeTransfer: row.include_transfer,
      transferId: row.transfer_id
    }));
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
      hotel_response_image: operation.hotelResponseImage,
      payment_proof_image: operation.paymentProofImage,
      previous_id: operation.previousId,
      original_quote_id: operation.originalQuoteId,
      plan: operation.plan,
      status: operation.status,
      include_transfer: operation.includeTransfer || false,
      transfer_id: operation.transferId
    }).returning('*');
    return result;
  }

  async getNextSequence(): Promise<OperationSequence> {
    const result = await this.db('operations')
      .where('id', 'LIKE', 'V%')
      .orderBy('id', 'desc')
      .first();

    let nextNum = 1001;
    if (result) {
      const numPart = parseInt(result.id.replace(/\D/g, '')) || 0;
      nextNum = numPart + 1;
    }

    return { nextId: 'V' + nextNum.toString().padStart(6, '0') };
  }
}
