export type QuoteStatus = 'Nuevo' | 'Atendido' | 'Reserva' | 'Venta Cerrada' | 'Venta Concretada' | 'Confirmada';
export type ReservationStatus = 'Confirmada' | 'Cancelada' | 'Completada' | 'Pendiente' | 'Liquidada' | 'Venta Cerrada' | 'Reserva';

export type Room = { id: string; name: string; capacity: number; }

export type SeasonRate = { id: string; type: string; startDate: string; endDate: string; roomPrices: Record<string, number>; childPrice?: number; }

export type Hotel = { 
  id: string; 
  name: string; 
  location: string; 
  description: string; 
  logo?: string; 
  photos: string[]; 
  rooms: Room[]; 
  seasons: SeasonRate[]; 
  type: 'hotel' | 'package' | 'full-day'; 
  email?: string; 
  whatsapp?: string; 
  plan?: 'TODO INCLUIDO' | 'SOLO DESAYUNO';
}

export type Transfer = { id: string; operator: string; netCost: number; salePrice: number; route: string; email?: string; whatsapp?: string; }

export type Quotation = { 
  id: string; 
  date: string; 
  month: string; 
  client_name?: string; 
  clientName?: string; 
  email: string; 
  whatsapp?: string; 
  hotel_id?: string; 
  hotelId?: string; 
  hotel_name?: string; 
  hotelName?: string; 
  check_in?: string; 
  checkIn?: string; 
  check_out?: string; 
  checkOut?: string; 
  room_type?: string; 
  roomType?: string; 
  total_amount?: number; 
  totalAmount?: number; 
  status: QuoteStatus; 
  discount?: number; 
  discountAmount?: number; 
  final_amount?: number; 
  finalAmount?: number; 
  pax: string; 
  children: string; 
  infants: string; 
  assignedTo?: string; 
  originalQuoteId?: string; 
  technicalSheet?: any; 
  companions?: any[]; 
  plan?: string;
}

export type Reservation = { id: string; quoteId: string; originalQuoteId?: string; assignedTo?: string; clientName: string; email: string; whatsapp?: string; hotelId: string; hotelName: string; checkIn: string; checkOut: string; roomType: string; pax: string; children: string; infants: string; totalAmount: number; status: ReservationStatus; createdAt: string; }

export type Operation = Reservation & { technicalSheet?: { passengers: any[]; savedAt: string; }; hotelResponseImage?: string; paymentProofImage?: string; companions?: any[]; }

export type StaffUser = { id: string; name: string; email: string; role: string; status: boolean; photo?: string; alias: string; password?: string; modules: { inventory: boolean; quotes: boolean; bookings: boolean; operations: boolean; users: boolean; customers: boolean; marketing: boolean; webconfig: boolean; }; targetHours: number; level: number; connectionLogs: { date: string; connectedHours: number }[]; actionLogs: { date: string; action: string; module: string }[]; }
