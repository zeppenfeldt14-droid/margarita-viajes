import { Request, Response } from 'express';
import { CalculateQuotePrice } from '../../../application/use-cases/CalculateQuotePrice.js';
import { QuoteRequestDTO } from '../../../application/dtos/QuoteRequestDTO.js';
import { IQuoteRepository } from '../../../domain/repositories/IQuoteRepository.js';

export class QuoteController {
  constructor(
    private calculateQuotePrice: CalculateQuotePrice,
    private quoteRepo: IQuoteRepository
  ) {}

  async calculatePrice(req: Request, res: Response) {
    try {
      const dto: QuoteRequestDTO = req.body;
      
      // Validaciones básicas
      if (!dto.roomId || !dto.checkIn || !dto.checkOut || !dto.totalPax) {
        return res.status(400).json({ error: 'Faltan parámetros obligatorios.' });
      }

      const totalPrice = await this.calculateQuotePrice.execute(dto);
      
      return res.json({
        totalAmount: totalPrice,
        currency: 'USD'
      });
    } catch (error: any) {
      console.error('Error al calcular precio:', error);
      return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }

  async saveQuote(req: Request, res: Response) {
    try {
      const quote = await this.quoteRepo.create(req.body);
      return res.status(201).json(quote);
    } catch (error: any) {
      console.error('Error al guardar cotización:', error);
      return res.status(500).json({ error: error.message || 'Error interno al guardar' });
    }
  }

  async checkDuplicate(req: Request, res: Response) {
    try {
      const { client, hotel, checkIn } = req.query;
      
      if (!client || !hotel || !checkIn) {
        return res.status(400).json({ error: 'Faltan parámetros' });
      }

      const quotes = await this.quoteRepo.findByClientAndHotel(client as string, hotel as string, checkIn as string);
      return res.json(quotes || []);
    } catch (error: any) {
      console.error('Error verificando duplicados:', error);
      return res.status(500).json([]);
    }
  }
}
