import type { Request, Response } from 'express';
import { ReservationRepository } from '../../domain/repositories/ReservationRepository.js';
import { OperationRepository } from '../../domain/repositories/OperationRepository.js';
import { QuoteRepository } from '../../domain/repositories/QuoteRepository.js';
import { NotificationService } from '../../services/NotificationService.js';

export class CommunicationController {
  constructor(
    private reservationRepo: ReservationRepository,
    private operationRepo: OperationRepository,
    private quoteRepo: QuoteRepository,
    private notificationService: NotificationService
  ) {}

  async dispatch(req: Request, res: Response) {
    const { type, id, method } = req.body;

    try {
      if (type === 'quote') {
        const quote = await this.quoteRepo.findById(id);
        if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
        
        if (method === 'email') {
          await this.notificationService.sendQuoteEmail(quote);
        }
      } else if (type === 'reservation') {
        const reservation = await this.reservationRepo.findById(id);
        if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' });

        if (method === 'email') {
          await this.notificationService.sendReservationEmail(reservation);
        }
      } else if (type === 'operation') {
        const operation = await this.operationRepo.findById(id);
        if (!operation) return res.status(404).json({ error: 'Operación no encontrada' });

        if (method === 'email') {
          await this.notificationService.sendVoucherEmail(operation);
        }
      }

      return res.json({ success: true, message: `Despacho iniciado vía ${method}` });
    } catch (error: any) {
      console.error('[CommunicationController] Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
