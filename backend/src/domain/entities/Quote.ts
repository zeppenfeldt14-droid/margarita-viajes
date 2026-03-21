export enum QuoteStatus {
  NUEVA = 'NUEVA',
  BLOQUEADA = 'BLOQUEADA',
  PAGADA = 'PAGADA',
  CONFIRMADA = 'CONFIRMADA'
}

export interface Quote {
  id?: number;
  folio: string;
  userId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  pax: number;
  totalAmount: number;
  status: QuoteStatus;
  createdAt: Date;
}
