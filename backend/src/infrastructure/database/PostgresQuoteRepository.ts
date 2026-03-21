import { Knex } from 'knex';
import { IQuoteRepository, Quote } from '../../domain/repositories/IQuoteRepository.js';

export class PostgresQuoteRepository implements IQuoteRepository {
  constructor(private db: Knex) {}

  async findAll(): Promise<Quote[]> {
    return await this.db('quotations').select('*').orderBy('created_at', 'desc');
  }

  async findById(id: string): Promise<Quote | null> {
    const result = await this.db('quotations').where('id', id).first();
    return result || null;
  }

  async create(quote: any): Promise<any> {
    const [result] = await this.db('quotations').insert({
      folio: quote.id || `Q-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      client_name: quote.clientName,
      email: quote.email,
      whatsapp: quote.whatsapp,
      hotel_name: quote.hotelName,
      check_in: quote.checkIn,
      check_out: quote.checkOut,
      room_type: quote.roomType,
      total_amount: quote.totalAmount,
      status: quote.status || 'NUEVA',
      pax: quote.pax,
      month: quote.month
    }).returning('*');
    return result;
  }

  async update(id: string, quote: any): Promise<any> {
    const updateData: any = {};
    
    if (quote.status !== undefined) {
      updateData.status = quote.status;
    }
    if (quote.discount !== undefined) {
      updateData.discount = quote.discount;
    }
    if (quote.discountAmount !== undefined) {
      updateData.discount_amount = quote.discountAmount;
    }
    if (quote.finalAmount !== undefined) {
      updateData.final_amount = quote.finalAmount;
    }
    if (quote.totalAmount !== undefined) {
      updateData.total_amount = quote.totalAmount;
    }
    if (quote.id !== undefined) {
      updateData.folio = quote.id;
    }
    if (quote.companions !== undefined) {
      updateData.companions = JSON.stringify(quote.companions);
    }
    if (quote.technicalSheet !== undefined) {
      updateData.technical_sheet = JSON.stringify(quote.technicalSheet);
    }
    
    const [result] = await this.db('quotations')
      .where('folio', id)
      .update(updateData)
      .returning('*');
    return result;
  }

  async findByClientAndHotel(client: string, hotel: string, checkIn: string): Promise<any[]> {
    return await this.db('quotations')
      .where('client_name', 'ilike', `%${client}%`)
      .where('hotel_name', 'ilike', `%${hotel}%`)
      .where('check_in', checkIn)
      .orderBy('created_at', 'desc')
      .limit(5);
  }
}
