export interface Room {
  id?: string;
  hotelId: string;
  name: string;
  capacity: number;
}

export interface IRoomRepository {
  findByHotelId(hotelId: string): Promise<Room[]>;
  create(room: Room): Promise<Room>;
  delete(id: string): Promise<void>;
}
