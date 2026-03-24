export interface Reservation {
  id: string;
  quoteId: string;
  clientName: string;
  email: string;
  whatsapp?: string;
  hotelId: string;
  hotelName: string;
  hotelEmail?: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  pax: string;
  children?: string;
  infants?: string;
  totalAmount: number;
  companions?: { name: string; type: string }[];
  technicalSheet?: any;
  hotelResponseImage?: string;
  paymentProofImage?: string;
  status: string;
  previousId?: string;
  originalQuoteId?: string;
  plan?: string;
  createdAt?: string;
}

export interface IReservationRepository {
  findAll(): Promise<Reservation[]>;
  findById(id: string): Promise<Reservation | null>;
  create(reservation: Reservation): Promise<Reservation>;
  update(id: string, reservation: Partial<Reservation>): Promise<Reservation>;
}
