import type { Request, Response } from 'express';
import type { IReservationRepository } from '../../../domain/repositories/IReservationRepository.js';
import type { IOperationRepository } from '../../../domain/repositories/IOperationRepository.js';
import type { IQuoteRepository } from '../../../domain/repositories/IQuoteRepository.js';
import { NotificationService } from '../../services/NotificationService.js';

export class CommunicationController {
  constructor(
    private reservationRepo: IReservationRepository,
    private operationRepo: IOperationRepository,
    private quoteRepo: IQuoteRepository,
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
