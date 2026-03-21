export interface Room {
  id: string;
  name: string;
  capacity: number; // Capacidad máxima de personas
}

export interface SeasonRate {
  id: string;
  type: string; // Baja, Alta, Navidad, etc.
  startDate: string;
  endDate: string;
  roomPrices: Record<string, number>; // Mapping: roomId -> price
  childPrice?: number; // Precio por niño (se usa para calcular 50% del precio base de 2 pax)
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
  logo?: string;
  photos: string[]; // Max 5
  rooms: Room[];
  seasons: SeasonRate[];
  type: 'hotel' | 'package' | 'full-day';
  email?: string;
  whatsapp?: string;
  mealPlan?: string; // Solo Desayuno, Todo Incluido, etc.
  plan?: 'TODO INCLUIDO' | 'SOLO DESAYUNO';
  hotelId?: string; // Para paquetes
  transferId?: string; // Para paquetes
  includeTransfer?: boolean; // Para paquetes
  childAgeLimit?: number; // Edad límite para pagar tarifa de niño (ej: 10, 11, 12). Niños mayores pagan como adultos
}

export interface Transfer {
  id: string;
  operator: string;
  netCost: number;
  salePrice: number;
  route: string;
  email?: string;
  whatsapp?: string;
}

export interface Quote {
  id: string;      // Correlativo C000001XXX
  date: string;
  clientName: string;
  clientEmail: string;
  clientWhatsapp: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  pax: number;
  children: number;
  infants: number;
  roomType: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'voucher';
}

export const LOCATIONS = [
  'Playa el Agua',
  'Pedro Gonzalez',
  'El Tirano',
  'Isla Coche',
  'Pampatar',
  'La Asunción', 
  'Playa El Yaque',
  'Playa Guacuco',
  'Isla Margarita'
];

export const SEASON_TYPES = [
  'Baja',
  'Alta',
  'Navidad',
  'Fin de Año',
  'Carnaval',
  'Semana Santa', 
  'Temporada Especial', 
  'Promo'
];

export const TRANSFER_ROUTES = [
  'Aeropuerto/Hotel',
  'Ferry/Hotel',
  'Aeropuerto/Hotel/Aeropuerto',
  'Ferry/Hotel/Ferry'
];

export const INITIAL_HOTELS: Hotel[] = [];

export const HOTELS = INITIAL_HOTELS;
