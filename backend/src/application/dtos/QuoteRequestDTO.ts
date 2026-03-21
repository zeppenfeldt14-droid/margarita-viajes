export interface QuoteRequestDTO {
  roomId: string;
  checkIn: string; // ISO Date string
  checkOut: string; // ISO Date string
  adults: number;
  children: number;
  childAges: number[];
  childAgeLimit?: number;
  totalPax: number;
}
