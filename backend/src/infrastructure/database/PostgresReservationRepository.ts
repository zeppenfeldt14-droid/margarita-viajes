import knex from 'knex';
type Knex = any;
import type { IReservationRepository, Reservation } from '../../domain/repositories/IReservationRepository.js';

export class PostgresReservationRepository implements IReservationRepository {
  constructor(private db: Knex) {}

  private mapRowToReservation(row: any): Reservation {
    return {
      id: String(row.id),
      quoteId: row.quote_id,
      clientName: row.client_name,
      email: row.email,
      whatsapp: row.whatsapp,
      hotelId: row.hotel_id,
      hotelName: row.hotel_name,
      hotelEmail: row.hotel_email,
      checkIn: row.check_in,
      checkOut: row.check_out,
      roomType: row.room_type,
      pax: row.pax,
      children: row.children,
      infants: row.infants,
      totalAmount: Number(row.total_amount),
      companions: typeof row.companions === 'string' ? JSON.parse(row.companions) : (row.companions || []),
      technicalSheet: typeof row.technical_sheet === 'string' ? JSON.parse(row.technical_sheet) : (row.technical_sheet || {}),
      hotelResponseImage: row.hotel_response_image,
      paymentProofImage: row.payment_proof_image,
      status: row.status,
      createdAt: row.created_at
    };
  }

  async findAll(): Promise<Reservation[]> {
    const rows = await this.db('reservations').select('*').orderBy('created_at', 'desc');
    return rows.map(row => this.mapRowToReservation(row));
  }

  async findById(id: string): Promise<Reservation | null> {
    const row = await this.db('reservations').where('id', id).first();
    if (!row) return null;
    return this.mapRowToReservation(row);
  }

  async create(reservation: any): Promise<Reservation> {
    const [result] = await this.db('reservations').insert({
      quote_id: reservation.quoteId,
      client_name: reservation.clientName,
      email: reservation.email,
      whatsapp: reservation.whatsapp,
      hotel_id: reservation.hotelId,
      hotel_name: reservation.hotelName,
      hotel_email: reservation.hotelEmail,
      check_in: reservation.checkIn,
      check_out: reservation.checkOut,
      room_type: reservation.roomType,
      pax: reservation.pax,
      children: reservation.children,
      infants: reservation.infants,
      total_amount: reservation.totalAmount,
      companions: JSON.stringify(reservation.companions || []),
      technical_sheet: JSON.stringify(reservation.technicalSheet || {}),
      hotel_response_image: reservation.hotelResponseImage,
      payment_proof_image: reservation.paymentProofImage,
      status: reservation.status || 'Confirmada'
    }).returning('*');
    return this.mapRowToReservation(result);
  }

  async update(id: string, reservation: any): Promise<Reservation> {
    const updateData: any = {};

    if (reservation.status !== undefined) updateData.status = reservation.status;
    if (reservation.companions !== undefined) updateData.companions = JSON.stringify(reservation.companions);
    if (reservation.technicalSheet !== undefined) updateData.technical_sheet = JSON.stringify(reservation.technicalSheet);
    if (reservation.hotelResponseImage !== undefined) updateData.hotel_response_image = reservation.hotelResponseImage;
    if (reservation.paymentProofImage !== undefined) updateData.payment_proof_image = reservation.paymentProofImage;
    if (reservation.totalAmount !== undefined) updateData.total_amount = reservation.totalAmount;

    const [result] = await this.db('reservations')
      .where('id', id)
      .update(updateData)
      .returning('*');
    return this.mapRowToReservation(result);
  }
}
