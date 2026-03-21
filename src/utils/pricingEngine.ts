export interface OccupancyDetails {
  roomCapacity: number;
  adults: number;
  payingChildren: number;
  childrenSharingRoom: number;
}

export const calculateOccupancyDetails = (
  paxStr: string,
  childrenStr: string,
  childAges: number[] = []
): OccupancyDetails => {
  const adults = parseInt(paxStr) || 0;
  const numChildren = parseInt(childrenStr) || 0;

  const roomCapacity = adults;
  let payingChildren = 0;

  if (numChildren > 0 && childAges.length === 0) {
    payingChildren = numChildren;
  } else {
    for (let i = 0; i < numChildren; i++) {
      const age = childAges[i];
      if (age >= 4 || age === undefined) payingChildren++;
    }
  }
  return { roomCapacity, adults, payingChildren, childrenSharingRoom: numChildren };
};

export interface PriceCalculationOptions {
  selectedHotel: any;
  checkIn: string;
  checkOut: string;
  roomType: string;
  transferId?: string;
  availableTransfers: any[];
  occupancy: OccupancyDetails;
}

export interface PricingResult {
  totalPrice: number;
  seasonError: boolean;
  priceInfo: any | null;
}

export const calculateTotalQuotePrice = ({
  selectedHotel,
  checkIn,
  checkOut,
  roomType,
  transferId,
  availableTransfers,
  occupancy
}: PriceCalculationOptions): PricingResult => {
  if (!selectedHotel || !checkIn || !roomType) {
    return { totalPrice: 0, seasonError: false, priceInfo: null };
  }
  
  if (selectedHotel.type !== 'full-day' && !checkOut) {
    return { totalPrice: 0, seasonError: false, priceInfo: null };
  }

  try {
    const checkInDate = new Date(checkIn);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrowLimit = new Date(today);
    tomorrowLimit.setDate(tomorrowLimit.getDate() + 1);

    if (checkInDate < tomorrowLimit) {
      return { totalPrice: 0, seasonError: true, priceInfo: null };
    }

    const adults = Number(occupancy.adults);
    const children = Number(occupancy.payingChildren);
    const roomId = roomType;

    const ci = new Date(checkIn);
    const co = new Date(checkOut || checkIn);

    let nights = 1;
    if (checkOut !== checkIn) {
      const diffTime = co.getTime() - ci.getTime();
      nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const activeSeason = selectedHotel.seasons?.find((season: any) => {
      const start = new Date(season.startDate);
      const end = new Date(season.endDate);
      return ci >= start && ci <= end;
    });

    if (!activeSeason) {
      return { totalPrice: 0, seasonError: true, priceInfo: null };
    }

    let pricePerNight = 0;
    if (activeSeason.roomPrices) {
      if (activeSeason.roomPrices[roomId]) {
        pricePerNight = activeSeason.roomPrices[roomId];
      } else {
        const room = selectedHotel.rooms?.find((r: any) => r.id === roomId || r.name === roomId);
        if (room && activeSeason.roomPrices[room.id]) pricePerNight = activeSeason.roomPrices[room.id];
      }
    }

    if (!pricePerNight && activeSeason.pricePerNight) pricePerNight = Number(activeSeason.pricePerNight);
    if (!pricePerNight && activeSeason.roomPrices) {
      const prices = Object.values(activeSeason.roomPrices);
      if (prices.length > 0) pricePerNight = Number(prices[0]);
    }

    if (!pricePerNight) {
      return { totalPrice: 0, seasonError: true, priceInfo: null };
    }

    let doubleRoomBase = 0;
    if (activeSeason.roomPrices) {
      const roomKeys = Object.keys(activeSeason.roomPrices);
      const doubleKey = roomKeys.find((k: string) => 
        k.toLowerCase().includes('doble') || 
        k.includes('2pax') || 
        k.includes('-2') ||
        k.toLowerCase().includes('double')
      );
      
      doubleRoomBase = doubleKey ? (activeSeason.roomPrices[doubleKey] as number) : pricePerNight * 2;
    } else {
      doubleRoomBase = pricePerNight * 2;
    }

    // El precio del niño es el 50% de la tarifa de una persona en Hab. Doble
    const childPrice = (doubleRoomBase / 2) * 0.5;
    const hotelTotal = (adults * pricePerNight) + (children * childPrice);

    let transferPrice = 0;
    if (transferId && availableTransfers.length > 0) {
      const selectedTransfer = availableTransfers.find(t => t.id === transferId);
      if (selectedTransfer) transferPrice = Number(selectedTransfer.salePrice) || 0;
    }

    const totalAmount = (hotelTotal * nights) + transferPrice;

    return {
      totalPrice: isNaN(totalAmount) ? 0 : totalAmount,
      seasonError: false,
      priceInfo: {
        pricePerUnit: pricePerNight,
        childPrice: childPrice,
        nights: nights,
        pax: adults + children,
        season: activeSeason.type,
        transferPrice: transferPrice
      }
    };
  } catch (error) {
    return { totalPrice: 0, seasonError: true, priceInfo: null };
  }
};

export const calculateDiscountedPrice = (totalPrice: number, discountPercent: number): number => {
  return totalPrice * (1 - discountPercent / 100);
};

export const calculateChildAgesArray = (currentAges: number[], newNumChildren: number): number[] => {
  if (newNumChildren > currentAges.length) {
    const newAges = [...currentAges];
    for (let i = currentAges.length; i < newNumChildren; i++) newAges.push(5);
    return newAges;
  } else if (newNumChildren < currentAges.length) {
    return currentAges.slice(0, newNumChildren);
  }
  return currentAges;
};
