export interface Room {
  id?: string;
  hotel_id?: string;
  name: string;
  capacity: number;
}

export interface SeasonRate {
  id?: string;
  hotel_id?: string;
  type: string;
  startDate: string;
  endDate: string;
  roomPrices: Record<string, number>; // Mapping: roomId -> price
}

export interface Hotel {
  id?: string;
  name: string;
  location: string;
  description: string;
  logo?: string;
  photos?: string[];
  type: 'hotel' | 'package' | 'full-day';
  rooms?: Room[];
  seasons?: SeasonRate[];
  createdAt?: Date;
}

export interface IHotelRepository {
  findAll(): Promise<Hotel[]>;
  findById(id: string): Promise<Hotel | null>;
  create(hotel: Hotel): Promise<Hotel>;
  update(id: string, hotel: Partial<Hotel>): Promise<void>;
  delete(id: string): Promise<void>;
}
