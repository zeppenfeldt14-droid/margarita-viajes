export interface Quote {
  id?: string;
  folio?: string;
  date?: string;
  month: string;
  clientName: string;
  email: string;
  whatsapp?: string;
  hotelId?: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  totalAmount: number;
  status: 'Nuevo' | 'Atendido' | 'Venta Concretada';
  discount?: number;
  discountAmount?: number;
  finalAmount?: number;
  pax: string;
  children?: string;
  infants?: string;
  companions?: any;
  technicalSheet?: any;
}

export interface IQuoteRepository {
  findAll(): Promise<Quote[]>;
  findById(id: string): Promise<Quote | null>;
  create(quote: Quote): Promise<Quote>;
  update(id: string, quote: Partial<Quote>): Promise<Quote>;
  findByClientAndHotel(client: string, hotel: string, checkIn: string): Promise<Quote[]>;
}
