export interface Season {
  id: string;
  roomId: string;
  pricePerNight: number;
  childPrice?: number;
  basePriceForChild?: number; // Precio base para calcular tarifa de niño (habitación 2 pax)
  roomPrices?: Record<string, number>;
  period: {
    contains: (date: string) => boolean;
  };
}

export interface ISeasonRepository {
  findIntersecting(roomId: string, checkIn: string, checkOut: string): Promise<Season[]>;
}
