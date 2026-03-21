import { QuoteRequestDTO } from '../dtos/QuoteRequestDTO.js';
import { ISeasonRepository, Season } from '../../domain/repositories/ISeasonRepository.js';

export class CalculateQuotePrice {
  constructor(private seasonRepository: ISeasonRepository) {}

  async execute(request: QuoteRequestDTO): Promise<number> {
    const { roomId, checkIn, checkOut, adults, children, childAges, childAgeLimit } = request;
    
    // Obtener todas las temporadas que intersectan con el rango solicitado
    const seasons = await this.seasonRepository.findIntersecting(roomId, checkIn, checkOut);
    
    // Calcular cuántos niños pagan vs no pagan
    // Niños menores de 4 años no pagan (infantes)
    // Niños de 4 años en adelante pagan
    let payingChildren = 0;
    
    if (childAges && childAges.length > 0) {
      for (const age of childAges) {
        if (age >= 4) {
          payingChildren++;
        }
      }
    } else {
      // Si no hay edades, asumir que todos los niños pagan
      payingChildren = children;
    }
    
    let total = 0;
    let currentDate = new Date(checkIn);
    let endDate = new Date(checkOut);

    // Si es Full Day (mismo día), forzamos al menos 1 iteración
    const isFullDay = checkIn === checkOut;
    
    let iterations = 0;

    while (currentDate < endDate || (isFullDay && iterations < 1)) {
      iterations++;
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Buscar el precio para esta fecha específica
      const activeSeason = seasons.find((s: Season) => s.period.contains(dateStr));
      
      if (!activeSeason) {
        throw new Error(`La fecha ${dateStr} no tiene una tarifa configurada para esta habitación.`);
      }

      // Precio de la habitación (para adultos)
      const roomPrice = Number(activeSeason.pricePerNight);
      
      // Precio por niño: SIEMPRE 50% del precio de habitación 2 pax
      // El usuario puede configurar basePriceForChild en la temporada
      // Si no existe, usar childPrice configurado, o si tampoco existe, usar precio de habitación 2 pax
      let basePriceForChild = 0;
      if (activeSeason.basePriceForChild) {
        basePriceForChild = Number(activeSeason.basePriceForChild);
      } else if (activeSeason.childPrice) {
        basePriceForChild = Number(activeSeason.childPrice) * 2;
      } else if (activeSeason.roomPrices) {
        // Buscar precio de habitación de 2 pax
        const roomKeys = Object.keys(activeSeason.roomPrices);
        const doubleRoomKey = roomKeys.find((k: string) => k.includes('2') || k.toLowerCase().includes('doble'));
        if (doubleRoomKey) {
          basePriceForChild = Number(activeSeason.roomPrices[doubleRoomKey]);
        } else {
          basePriceForChild = roomPrice * 2;
        }
      } else {
        basePriceForChild = roomPrice * 2;
      }
      
      const childPrice = basePriceForChild * 0.5;

      // Cálculo total:
      // Adultos: precio de habitación × número de adultos
      // Niños: precio por niño × número de niños que pagan
      const adultTotal = roomPrice * adults;
      const childrenTotal = childPrice * payingChildren;
      
      total += adultTotal + childrenTotal;
      
      // Incrementar un día
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return total;
  }
}
