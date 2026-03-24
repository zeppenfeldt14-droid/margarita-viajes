import type { Request, Response } from 'express';
// @ts-ignore
import PDFDocument from 'pdfkit';
import type { CalculateQuotePrice } from '../../../application/use-cases/CalculateQuotePrice.js';
import type { QuoteRequestDTO } from '../../../application/dtos/QuoteRequestDTO.js';
import type { IQuoteRepository } from '../../../domain/repositories/IQuoteRepository.js';
import type { IWebConfigRepository } from '../../../domain/repositories/IWebConfigRepository.js';
import type { IHotelRepository } from '../../../domain/repositories/IHotelRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { NotificationService } from '../../services/NotificationService.js';

export class QuoteController {
  private static lastAssignedIndex = -1;

  constructor(
    private calculateQuotePrice: CalculateQuotePrice,
    private quoteRepo: IQuoteRepository,
    private configRepo: IWebConfigRepository,
    private hotelRepo: IHotelRepository,
    private userRepo: IUserRepository,
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
      // Registrar fecha y hora exacta si no viene en el body
      if (!req.body.date) {
        req.body.date = new Date().toISOString();
      }

      // Lógica de Asignación Round-Robin (Backend)
      try {
        const users = await this.userRepo.findAll();
        const sellers = (users || []).filter(u => u.level === 3);

        if (sellers.length > 0) {
          QuoteController.lastAssignedIndex = (QuoteController.lastAssignedIndex + 1) % sellers.length;
          const assignedSeller = sellers[QuoteController.lastAssignedIndex].alias || sellers[QuoteController.lastAssignedIndex].fullName;
          req.body.assignedTo = assignedSeller;
          console.log(`[QuoteController] Cotización asignada a: ${assignedSeller} (Turno: ${QuoteController.lastAssignedIndex})`);
        }
      } catch (err) {
        console.error('[QuoteController] Error en asignación Round-Robin:', err);
      }

      const quote = await this.quoteRepo.create(req.body);
      
      // Lanzar proceso de notificación en segundo plano
      this.processQuoteNotifications(quote).catch(err => 
        console.error('[QuoteController] Error en notificación de fondo:', err)
      );

      return res.status(201).json(quote);
    } catch (error: any) {
      console.error('[QuoteController] Error en saveQuote:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  private async processQuoteNotifications(quote: any) {
    console.log(`[QuoteController] Iniciando proceso de notificación para cotización ${quote.id}`);
    await this.notificationService.processAndSend(quote);
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

  async getQuotePdfOnDemand(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      const quote = await this.quoteRepo.findById(id);
      
      if (!quote) {
        return res.status(404).json({ error: 'Cotización no encontrada' });
      }

      const config = await this.configRepo.getConfig();
      let hotelLogoUrl = '';
      let hotelLocation = '';
      
      try {
        if (quote.hotelId) {
          const hotel = await this.hotelRepo.findById(quote.hotelId);
          if (hotel) {
            hotelLogoUrl = hotel.logo || '';
            hotelLocation = hotel.location || '';
          }
        }
      } catch (e) { console.error('[PDF] Hotel fetch error:', e); }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Cotizacion_${id}.pdf`);

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.pipe(res);

      const brandColor = '#0B132B';
      const accentColor = '#ea580c';
      const labelColor = '#999999';
      const borderColor = '#EEEEEE';

      // --- ENCABEZADO TRIPLE ---
      // Logo Agencia (Izquierda)
      try {
        const agencyLogo = config.logoImage;
        if (agencyLogo && agencyLogo.startsWith('http')) {
          const resp = await fetch(agencyLogo);
          if (resp.ok) doc.image(Buffer.from(await resp.arrayBuffer()), 50, 40, { width: 80 });
        }
      } catch (err) {}

      // Logo Hotel (Derecha)
      try {
        if (hotelLogoUrl && hotelLogoUrl.startsWith('http')) {
          const resp = await fetch(hotelLogoUrl);
          if (resp.ok) doc.image(Buffer.from(await resp.arrayBuffer()), 465, 40, { width: 80 });
        }
      } catch (err) {}

      // Centro: Datos Agencia
      doc.fillColor(brandColor).fontSize(14).font('Helvetica-Bold').text(config.agencyName || 'MARGARITA VIAJES', 150, 45, { align: 'center', width: 295 });
      doc.fontSize(8).font('Helvetica').text(`RIF: ${config.rif || 'J-40156646-4'} | RTN: ${config.rtn || '13314'}`, 150, 62, { align: 'center', width: 295 });
      doc.fontSize(7).fillColor(labelColor).text(config.direccion || '-', 150, 72, { align: 'center', width: 295 });

      doc.moveTo(50, 110).lineTo(545, 110).stroke(borderColor);

      // --- SECCIÓN CLIENTE / FECHA ---
      doc.fillColor(labelColor).fontSize(8).font('Helvetica-Bold').text('ESTIMADO SR./A:', 50, 130);
      doc.fillColor(brandColor).fontSize(12).text((quote.clientName || 'CLIENTE').toUpperCase(), 50, 142);

      doc.fillColor(labelColor).fontSize(8).text('FECHA DE EMISIÓN:', 400, 130, { align: 'right' });
      doc.fillColor(brandColor).fontSize(10).text(new Date(quote.date || new Date()).toLocaleDateString() || 'S/F', 400, 142, { align: 'right' });

      // --- CUADRÍCULA 2x4 ---
      const gridY = 180;
      const rowH = 35;
      const colW = 240;

      const drawItem = (label: string, value: string, x: number, y: number, isRight = false, valueColor = brandColor) => {
        doc.fillColor(labelColor).fontSize(8).font('Helvetica-Bold').text(label.toUpperCase(), x, y);
        const valX = x + 100;
        doc.fillColor(valueColor).fontSize(10).font('Helvetica-Bold').text(value?.toUpperCase() || 'NO ESPECIFICADO', valX, y, { width: 140, align: 'right' });
        doc.moveTo(x, y + 15).lineTo(x + colW, y + 15).stroke('#FAFAFA');
      };

      // Fila 1
      drawItem('HOTEL', quote.hotelName, 50, gridY);
      drawItem('PLAN', quote.plan, 305, gridY, true, (quote.plan?.toLowerCase().includes('no especificado') ? accentColor : brandColor));

      // Fila 2
      drawItem('HABITACIÓN:', quote.roomType, 50, gridY + rowH);
      drawItem('UBICACIÓN:', hotelLocation || 'PLAYA EL AGUA', 305, gridY + rowH);

      // Fila 3
      drawItem('ENTRADA:', new Date(quote.checkIn).toLocaleDateString(), 50, gridY + rowH * 2);
      drawItem('SALIDA:', new Date(quote.checkOut).toLocaleDateString(), 305, gridY + rowH * 2);

      // Fila 4
      drawItem('ADULTOS:', quote.pax, 50, gridY + rowH * 3);
      const childInfo = (parseInt(quote.children || '0') + parseInt(quote.infants || '0')).toString();
      drawItem('NIÑOS/INFANTES:', childInfo, 305, gridY + rowH * 3);

      // --- BLOQUE DE TOTAL (TARJETA CON SOMBRA) ---
      const totalY = gridY + rowH * 5;
      doc.save();
      doc.fillColor('#F8F9FA').roundedRect(50, totalY, 495, 65, 10).fill();
      doc.restore();

      doc.fillColor(brandColor).fontSize(10).font('Helvetica-Bold').text('TOTAL A PAGAR', 70, totalY + 25);
      const finalPrice = Number(quote.finalAmount || quote.totalAmount || 0);
      doc.fillColor(brandColor).fontSize(32).font('Helvetica-Bold').text(`$ ${finalPrice.toLocaleString()}`, 300, totalY + 15, { align: 'right', width: 220 });

      // --- FOOTER ---
      const footerY = 640;
      doc.fillColor(brandColor).fontSize(9).font('Helvetica-Bold').text('QUEDAMOS ATENTOS A SU REQUERIMIENTO:', 50, footerY);
      
      const drawFooterRow = (label: string, value: string, y: number, color = brandColor) => {
        doc.fillColor(brandColor).fontSize(8).font('Helvetica-Bold').text(label, 50, y);
        doc.fillColor(color).fontSize(8).font('Helvetica-Bold').text(value, 300, y, { align: 'right', width: 245 });
      };

      drawFooterRow('ASESOR DE VIAJES:', quote.assignedTo || 'Sin Asignar', footerY + 20);
      drawFooterRow('WHATSAPP:', config.telefono || '+58 424 6861748', footerY + 35, '#25D366');
      drawFooterRow('CORREO:', config.correo || 'margaritaviaje@gmail.com', footerY + 50, '#007bff');

      // Disclaimer Rojo
      doc.fillColor('#FF0000').fontSize(7).font('Helvetica-Bold').text('PRECIOS Y DISPONIBILIDAD SUJETOS A CAMBIOS AL MOMENTO DE RESERVA Y EMISIÓN | CONSULTAR SIEMPRE ANTES DE REALIZAR EL PAGO.', 50, 780, { align: 'center', width: 495 });

      doc.end();
    } catch (error: any) {
      console.error('[QuoteController] Error in getQuotePdfOnDemand:', error);
      if (!res.headersSent) res.status(500).json({ error: error.message });
    }
  }
}
