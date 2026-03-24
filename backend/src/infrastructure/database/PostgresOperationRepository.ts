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
      transferId: row.transfer_id,
      itinerary: row.itinerary,
      transferProvider: row.transfer_provider,
      hotelLogo: row.hotel_logo,
      itineraryDetails: row.itinerary_details
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
      transfer_id: operation.transferId,
      itinerary: operation.itinerary,
      transfer_provider: operation.transferProvider,
      hotel_logo: operation.hotelLogo,
      itinerary_details: operation.itineraryDetails
    }).returning('*');
    return result;
  }

  async update(id: string, operation: any): Promise<any> {
    const updateData: any = {};
    if (operation.status !== undefined) updateData.status = operation.status;
    if (operation.assignedTo !== undefined) updateData.assigned_to = operation.assignedTo;
    if (operation.itinerary !== undefined) updateData.itinerary = operation.itinerary;
    if (operation.transferProvider !== undefined) updateData.transfer_provider = operation.transferProvider;
    if (operation.hotelResponseImage !== undefined) updateData.hotel_response_image = operation.hotelResponseImage;
    if (operation.paymentProofImage !== undefined) updateData.payment_proof_image = operation.paymentProofImage;
    if (operation.hotelLogo !== undefined) updateData.hotel_logo = operation.hotelLogo;
    if (operation.itineraryDetails !== undefined) updateData.itinerary_details = operation.itineraryDetails;

    const [result] = await this.db('operations')
      .where('id', id)
      .update(updateData)
      .returning('*');
    
    // Mapeo simple para retornar el objeto formateado
    return {
      ...result,
      quoteId: result.quote_id,
      clientName: result.client_name,
      itinerary: result.itinerary,
      transferProvider: result.transfer_provider
    };
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
