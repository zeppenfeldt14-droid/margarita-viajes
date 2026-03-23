import type { Knex } from 'knex';
import type { IReservationRepository, Reservation } from '../../domain/repositories/IReservationRepository.js';

export class PostgresReservationRepository implements IReservationRepository {
  constructor(private db: Knex) {}

  async findAll(): Promise<Reservation[]> {
    return await this.db('reservations').select('*').orderBy('created_at', 'desc');
  }

  async findById(id: string): Promise<Reservation | null> {
    const result = await this.db('reservations').where('id', id).first();
    return result || null;
  }

  async create(reservation: any): Promise<any> {
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
    return result;
  }

  async update(id: string, reservation: any): Promise<any> {
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
    return result;
  }
}
