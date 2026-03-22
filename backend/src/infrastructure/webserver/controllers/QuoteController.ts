import { Request, Response } from 'express';
import { CalculateQuotePrice } from '../../../application/use-cases/CalculateQuotePrice.js';
import { QuoteRequestDTO } from '../../../application/dtos/QuoteRequestDTO.js';
import { IQuoteRepository } from '../../../domain/repositories/IQuoteRepository.js';
import { IWebConfigRepository } from '../../../domain/repositories/IWebConfigRepository.js';
import { IHotelRepository } from '../../../domain/repositories/IHotelRepository.js';
import { NotificationService } from '../../services/NotificationService.js';

export class QuoteController {
  constructor(
    private calculateQuotePrice: CalculateQuotePrice,
    private quoteRepo: IQuoteRepository,
    private configRepo: IWebConfigRepository,
    private hotelRepo: IHotelRepository,
    private notificationService: NotificationService
  ) {}

  async calculatePrice(req: Request, res: Response) {
    // ... (sin cambios)
  }

  async saveQuote(req: Request, res: Response) {
    try {
      const quote = await this.quoteRepo.create(req.body);
      const pdfBase64 = req.body.pdfBase64;

      // --- INICIO PROCESO EN SEGUNDO PLANO ---
      this.processQuoteNotifications(quote, pdfBase64).catch(err => 
        console.error('[QuoteController] Error en proceso de notificación background:', err)
      );

      return res.status(201).json(quote);
    } catch (error: any) {
      console.error('Error al guardar cotización:', error);
      return res.status(500).json({ error: error.message || 'Error interno al guardar' });
    }
  }

  private async processQuoteNotifications(quote: any, pdfBase64?: string) {
    console.log(`[QuoteController] Iniciando proceso de notificación para cotización ${quote.id}`);
    
    // El servicio centralizado ahora solo necesita el quote y el pdfBase64
    await this.notificationService.processAndSend(quote, pdfBase64);
    
    console.log(`[QuoteController] Proceso de notificación completado para cotización ${quote.id}`);
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

  async getQuotePdf(req: Request, res: Response) {
    try {
      const folio = req.params['folio'] as string;
      const quote = await this.quoteRepo.findById(folio);
      
      if (!quote || !quote.pdfBase64) {
        return res.status(404).json({ error: 'Cotización o PDF no encontrado' });
      }

      const base64Data = quote.pdfBase64.includes(';base64,') 
        ? quote.pdfBase64.split(';base64,')[1] 
        : quote.pdfBase64;
        
      const pdfBuffer = Buffer.from(base64Data, 'base64');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Cotizacion_${folio}.pdf"`);
      return res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error al obtener PDF:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  async updateQuote(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      const quote = await this.quoteRepo.update(id, req.body);
      
      if (req.body.pdfBase64) {
          this.processQuoteNotifications(quote, req.body.pdfBase64).catch(err => 
            console.error('[QuoteController] Error en notificación background:', err)
          );
      }

      return res.json(quote);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

