export interface Operation {
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
  children: string;
  infants: string;
  totalAmount: number;
  companions?: { name: string; type: string }[];
  technicalSheet?: any;
  status: string;
  hotelResponseImage?: string;
  paymentProofImage?: string;
  createdAt?: string;
}

export interface OperationSequence {
  nextId: string;
}

export interface IOperationRepository {
  findAll(): Promise<Operation[]>;
  findById(id: string): Promise<Operation | null>;
  create(operation: Operation): Promise<Operation>;
  getNextSequence(): Promise<OperationSequence>;
}
