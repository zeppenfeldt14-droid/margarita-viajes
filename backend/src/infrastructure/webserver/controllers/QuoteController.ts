import type { Request, Response } from 'express';
import type { CalculateQuotePrice } from '../../../application/use-cases/CalculateQuotePrice.js';
import type { QuoteRequestDTO } from '../../../application/dtos/QuoteRequestDTO.js';
import type { IQuoteRepository } from '../../../domain/repositories/IQuoteRepository.js';
import type { IWebConfigRepository } from '../../../domain/repositories/IWebConfigRepository.js';
import type { IHotelRepository } from '../../../domain/repositories/IHotelRepository.js';
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
    try {
      const dto = req.body as QuoteRequestDTO;
      const result = await this.calculateQuotePrice.execute(dto);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async saveQuote(req: Request, res: Response) {
    try {
      const quote = await this.quoteRepo.create(req.body);
      
      const pdfBase64 = req.body.pdfBase64;
      
      // Lanzar proceso de notificación en segundo plano
      this.processQuoteNotifications(quote, pdfBase64).catch(err => 
        console.error('[QuoteController] Error en notificación de fondo:', err)
      );

      return res.status(201).json(quote);
    } catch (error: any) {
      console.error('[QuoteController] Error en saveQuote:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  private async processQuoteNotifications(quote: any, pdfBase64?: string) {
    console.log(`[QuoteController] Iniciando proceso de notificación para cotización ${quote.id}`);
    await this.notificationService.processAndSend(quote, pdfBase64);
  }

  async getQuotePdf(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      const quote = await this.quoteRepo.findById(id);
      
      if (!quote || !quote.pdfBase64) {
        return res.status(404).send('PDF no encontrado');
      }

      const base64Data = quote.pdfBase64.includes(';base64,') 
        ? quote.pdfBase64.split(';base64,')[1] 
        : quote.pdfBase64;

      const pdfBuffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Cotizacion_${id}.pdf`);
      return res.send(pdfBuffer);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async checkDuplicate(req: Request, res: Response) {
    try {
      const { folio } = req.query;
      if (!folio) return res.json({ duplicate: false });
      
      const quote = await this.quoteRepo.findById(folio as string);
      return res.json({ duplicate: !!quote });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getNextFolio(req: Request, res: Response) {
    try {
      const quotes = await this.quoteRepo.findAll();
      let nextNum = 100001;
      
      if (Array.isArray(quotes) && quotes.length > 0) {
        const cIds = quotes
          .map((q: any) => q.id?.toString() || '')
          .filter((id: string) => id.startsWith('C') && !id.includes('-'))
          .map((id: string) => parseInt(id.replace(/\D/g, '')) || 0);
          
        if (cIds.length > 0) {
          nextNum = Math.max(...cIds) + 1;
        }
      }
      
      const nextFolio = 'C' + nextNum.toString().padStart(10, '0');
      return res.json({ nextFolio });
    } catch (error: any) {
      console.error('[QuoteController] Error generating next folio:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
