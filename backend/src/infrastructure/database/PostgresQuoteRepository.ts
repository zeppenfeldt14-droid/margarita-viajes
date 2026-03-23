import type { Knex } from 'knex';
import type { IQuoteRepository, Quote } from '../../domain/repositories/IQuoteRepository.js';

export class PostgresQuoteRepository implements IQuoteRepository {
  constructor(private db: Knex) {}

  private mapToDomain(dbQuote: any): Quote {
    if (!dbQuote) return dbQuote;
    return {
      ...dbQuote,
      id: dbQuote.folio, // El frontend espera que el folio sea el ID
      db_id: dbQuote.id, // Guardamos el ID real por si acaso
      clientName: dbQuote.client_name,
      hotelName: dbQuote.hotel_name,
      checkIn: dbQuote.check_in,
      checkOut: dbQuote.check_out,
      roomType: dbQuote.room_type,
      totalAmount: dbQuote.total_amount,
      discountAmount: dbQuote.discount_amount,
      finalAmount: dbQuote.final_amount,
      pdfBase64: dbQuote.pdf_base64,
      technicalSheet: typeof dbQuote.technical_sheet === 'string' ? JSON.parse(dbQuote.technical_sheet) : dbQuote.technical_sheet,
      companions: typeof dbQuote.companions === 'string' ? JSON.parse(dbQuote.companions) : dbQuote.companions,
      assignedTo: dbQuote.assigned_to
    };
  }

  async findAll(): Promise<Quote[]> {
    const results = await this.db('quotations').select('*').orderBy('created_at', 'desc');
    return results.map(r => this.mapToDomain(r));
  }

  async findById(id: string): Promise<Quote | null> {
    const result = await this.db('quotations').where('folio', id).orWhere('id', isNaN(Number(id)) ? -1 : Number(id)).first();
    return this.mapToDomain(result);
  }

  async create(quote: any): Promise<any> {
    const [result] = await this.db('quotations').insert({
      folio: quote.id || `Q-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      client_name: quote.clientName,
      email: quote.email,
      whatsapp: quote.whatsapp,
      hotel_name: quote.hotelName,
      hotel_id: quote.hotelId,
      check_in: quote.checkIn,
      check_out: quote.checkOut,
      room_type: quote.roomType,
      total_amount: quote.totalAmount,
      discount_amount: quote.discountAmount || 0,
      final_amount: quote.finalAmount || quote.totalAmount,
      status: quote.status || 'Nuevo',
      pax: quote.pax,
      children: quote.children,
      infants: quote.infants,
      month: quote.month,
      pdf_base64: quote.pdfBase64,
      assigned_to: quote.assignedTo,
      companions: quote.companions ? JSON.stringify(quote.companions) : null,
      technical_sheet: quote.technicalSheet ? JSON.stringify(quote.technicalSheet) : null
    }).returning('*');
    return this.mapToDomain(result);
  }

  async update(id: string, quote: any): Promise<any> {
    const updateData: any = {};
    
    if (quote.status !== undefined) updateData.status = quote.status;
    if (quote.discount !== undefined) updateData.discount = quote.discount;
    if (quote.discountAmount !== undefined) updateData.discount_amount = quote.discountAmount;
    if (quote.finalAmount !== undefined) updateData.final_amount = quote.finalAmount;
    if (quote.totalAmount !== undefined) updateData.total_amount = quote.totalAmount;
    if (quote.id !== undefined) updateData.folio = quote.id;
    if (quote.pdfBase64 !== undefined) updateData.pdf_base64 = quote.pdfBase64;
    if (quote.assignedTo !== undefined) updateData.assigned_to = quote.assignedTo;
    
    if (quote.companions !== undefined) {
      updateData.companions = typeof quote.companions === 'string' ? quote.companions : JSON.stringify(quote.companions);
    }
    if (quote.technicalSheet !== undefined) {
      updateData.technical_sheet = typeof quote.technicalSheet === 'string' ? quote.technicalSheet : JSON.stringify(quote.technicalSheet);
    }
    
    const [result] = await this.db('quotations')
      .where('folio', id)
      .update(updateData)
      .returning('*');
    return this.mapToDomain(result);
  }

  async findByClientAndHotel(client: string, hotel: string, checkIn: string): Promise<any[]> {
    const results = await this.db('quotations')
      .where('client_name', 'ilike', `%${client}%`)
      .where('hotel_name', 'ilike', `%${hotel}%`)
      .where('check_in', checkIn)
      .orderBy('created_at', 'desc')
      .limit(5);
    return results.map(r => this.mapToDomain(r));
  }
}
