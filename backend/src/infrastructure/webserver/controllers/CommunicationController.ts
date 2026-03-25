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
    const { type, id, method, target, recipient, subject, body, pdfBase64 } = req.body;
    console.log(`[CommunicationController] Recibida solicitud de despacho:`, { type, id, method, target, recipient });

    try {
      if (!type || !id || !method) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos: type, id, o method' });
      }

      let pdfBuffer: Buffer | undefined = undefined;
      if (pdfBase64) {
        const base64Data = pdfBase64.includes(';base64,') 
          ? pdfBase64.split(';base64,')[1] 
          : pdfBase64;
        pdfBuffer = Buffer.from(base64Data, 'base64');
      }

      if (type === 'quote') {
        const quote = await this.quoteRepo.findById(id);
        if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
        
        if (method === 'email') {
          await this.notificationService.sendQuoteEmail(quote, pdfBuffer);
        }
      } else if (type === 'reservation' || type === 'confirmacion') {
        const reservation = await this.reservationRepo.findById(id);
        if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' });

        if (method === 'email') {
          if (target === 'provider') {
            await this.notificationService.sendHotelRequestEmail(reservation, body || '', recipient);
          } else {
            await this.notificationService.sendReservationEmail(reservation);
          }
        }
      } else if (type === 'operation' || type === 'voucher') {
        const operation = await this.operationRepo.findById(id);
        if (!operation) return res.status(404).json({ error: 'Operación no encontrada' });

        if (method === 'email') {
          await this.notificationService.sendVoucherEmail(operation, pdfBuffer);
        }
      } else {
        return res.status(400).json({ error: `Tipo de documento desconocido: ${type}` });
      }

      return res.json({ success: true, message: `Despacho iniciado vía ${method} para ${type} ${id}` });
    } catch (error: any) {
      console.error('[CommunicationController] Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
