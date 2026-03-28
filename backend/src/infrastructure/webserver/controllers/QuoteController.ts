import type { Request, Response } from 'express';
// @ts-ignore
import PDFDocument from 'pdfkit';
import type { CalculateQuotePrice } from '../../../application/use-cases/CalculateQuotePrice.js';
import type { QuoteRequestDTO } from '../../../application/dtos/QuoteRequestDTO.js';
import type { IQuoteRepository } from '../../../domain/repositories/IQuoteRepository.js';
import type { IWebConfigRepository } from '../../../domain/repositories/IWebConfigRepository.js';
import type { IHotelRepository } from '../../../domain/repositories/IHotelRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { IOperationRepository } from '../../../domain/repositories/IOperationRepository.js';
import { NotificationService } from '../../services/NotificationService.js';

export class QuoteController {
  private static lastAssignedIndex = -1;

  constructor(
    private calculateQuotePrice: CalculateQuotePrice,
    private quoteRepo: IQuoteRepository,
    private configRepo: IWebConfigRepository,
    private hotelRepo: IHotelRepository,
    private userRepo: IUserRepository,
    private operationRepo: IOperationRepository,
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
      res.setHeader('Content-Disposition', `inline; filename=Cotizacion_${id}.pdf`);
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
      res.setHeader('Content-Disposition', `inline; filename=Cotizacion_${id}.pdf`);

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.pipe(res);

      const brandColor = '#0B132B';
      const labelColor = '#999999';
      const borderColor = '#EEEEEE';

      const drawWebImage = async (url: string, x: number, y: number, width: number) => {
        try {
          if (!url || url.trim() === '') return;
          
          let buf: Buffer;
          if (url.startsWith('data:image')) {
            const base64Data = url.split(',')[1];
            if (!base64Data) return;
            buf = Buffer.from(base64Data, 'base64');
          } else if (url.startsWith('http://') || url.startsWith('https://')) {
            const resp = await fetch(url, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              signal: AbortSignal.timeout(5000)
            });
            if (!resp.ok) { console.warn(`[PDF] Logo HTTP ${resp.status}: ${url}`); return; }
            buf = Buffer.from(await resp.arrayBuffer());
          } else {
            console.warn(`[PDF] Logo URL no soportado (requiere http/https o data:image): "${url.substring(0, 80)}"`);
            return;
          }
          
          doc.image(buf, x, y, { width, fit: [width, width] });
        } catch (err) { 
          console.error(`[PDF] Error cargando imagen ${url}:`, err); 
        }
      };

      // --- ENCABEZADO TRIPLE (ESTÁNDAR) ---
      await drawWebImage(config.logoImage, 50, 40, 80);
      await drawWebImage(hotelLogoUrl, 465, 40, 80);

      doc.fillColor(brandColor).fontSize(14).font('Helvetica-Bold').text(config.agencyName?.toUpperCase() || 'MARGARITA VIAJES', 150, 45, { align: 'center', width: 295 });
      doc.fontSize(8).font('Helvetica').text(`RIF: ${config.rif || 'J-40156646-4'} | RTN: ${config.rtn || '13314'}`, 150, 62, { align: 'center', width: 295 });
      doc.fontSize(7).fillColor(labelColor).text(config.direccion || '-', 150, 72, { align: 'center', width: 295 });

      doc.moveTo(50, 110).lineTo(545, 110).lineWidth(2).stroke(brandColor);

      // --- CUADRO COTIZACIÓN / FECHA ---
      doc.fillColor(labelColor).fontSize(8).font('Helvetica-Bold').text('ESTIMADO SR./A:', 50, 130);
      doc.fillColor(brandColor).fontSize(12).text((quote.clientName || 'CLIENTE').toUpperCase(), 50, 142);

      doc.fillColor(labelColor).fontSize(8).text('FECHA DE EMISIÓN:', 400, 130, { align: 'right' });
      doc.fillColor(brandColor).fontSize(10).text(new Date(quote.date || new Date()).toLocaleDateString() || 'S/F', 400, 142, { align: 'right' });

      // --- GRILLA DE DETALLES ---
      const gridY = 185;
      const rowH = 35;
      const colW = 240;

      const drawItem = (label: string, value: string, x: number, y: number) => {
        doc.fillColor(labelColor).fontSize(8).font('Helvetica-Bold').text(label.toUpperCase(), x, y);
        doc.fillColor(brandColor).fontSize(9).font('Helvetica-Bold').text(value?.toUpperCase() || '-', x + 85, y, { width: 155, align: 'right' });
        doc.moveTo(x, y + 20).lineTo(x + colW, y + 20).lineWidth(0.5).stroke(borderColor);
      };

      drawItem('HOTEL:', quote.hotelName, 50, gridY);
      drawItem('TEMPORADA:', quote.season || '-', 305, gridY);
      drawItem('HABITACIÓN:', quote.roomType, 50, gridY + rowH);
      drawItem('UBICACIÓN:', hotelLocation || '-', 305, gridY + rowH);
      drawItem('ENTRADA:', new Date(quote.checkIn).toLocaleDateString(), 50, gridY + rowH * 2);
      drawItem('SALIDA:', new Date(quote.checkOut).toLocaleDateString(), 305, gridY + rowH * 2);
      drawItem('ADULTOS:', quote.pax, 50, gridY + rowH * 3);
      drawItem('NIÑOS/INF.:', (parseInt(quote.children || '0') + parseInt(quote.infants || '0')).toString(), 305, gridY + rowH * 3);
      
      // TRASLADO (v19)
      if (quote.includeTransfer || quote.transferId) {
        drawItem('TRASLADO:', 'SOLICITADO', 50, gridY + rowH * 4);
      }

      // --- TOTAL ---
      const totalY = gridY + rowH * 5 + 10;
      doc.rect(50, totalY, 495, 50).fill('#F8F9FA');
      doc.fillColor(brandColor).fontSize(10).font('Helvetica-Bold').text('TOTAL A PAGAR', 70, totalY + 20);
      doc.fontSize(24).text(`$ ${(quote.finalAmount || 0).toLocaleString()}`, 300, totalY + 14, { align: 'right', width: 220 });

      // --- FOOTER ---
      const footerY = totalY + 70;
      doc.fillColor(brandColor).fontSize(9).font('Helvetica-Bold').text('QUEDAMOS ATENTOS A SU REQUERIMIENTO:', 50, footerY);
      doc.fontSize(8).text(`ASESOR: ${quote.assignedTo || 'MARGARITA VIAJES'}`, 50, footerY + 20);
      doc.text(`WHATSAPP: ${config.telefono || '+58 424 6861748'}`, 50, footerY + 35);
      doc.text(`CORREO: ${config.correo || 'margaritaviaje@gmail.com'}`, 50, footerY + 50);

      doc.fillColor('#FF0000').fontSize(7).text('PRECIOS Y DISPONIBILIDAD SUJETOS A CAMBIOS AL MOMENTO DE RESERVA Y EMISIÓN.', 50, footerY + 80, { align: 'center', width: 495 });

      doc.end();
    } catch (error: any) {
      console.error('[PDF] Error:', error);
      if (!res.headersSent) res.status(500).json({ error: error.message });
    }
  }

  async getVoucherPdfOnDemand(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      const op = await this.operationRepo.findById(id);
      
      if (!op) {
        return res.status(404).json({ error: 'Operación no encontrada' });
      }

      const config = await this.configRepo.getConfig();
      let hotelLogoUrl = '';
      let hotelLocation = '';
      
      try {
        if (op.hotelId) {
          const hotel = await this.hotelRepo.findById(op.hotelId);
          if (hotel) {
            hotelLogoUrl = hotel.logo || '';
            hotelLocation = hotel.location || '';
          }
        }
      } catch (e) { console.error('[PDF] Hotel fetch error:', e); }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=Voucher_${id}.pdf`);

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.pipe(res);

      const brandColor = '#0B132B';
      const successColor = '#10b981';
      const labelColor = '#999999';
      const borderColor = '#EEEEEE';

      const drawWebImage = async (url: string, x: number, y: number, width: number) => {
        try {
          if (!url) return;
          
          let buf: Buffer;
          if (url.startsWith('data:image')) {
            const base64Data = url.split(',')[1];
            buf = Buffer.from(base64Data, 'base64');
          } else if (url.startsWith('http')) {
            const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (!resp.ok) throw new Error(`HTTP Error ${resp.status}`);
            buf = Buffer.from(await resp.arrayBuffer());
          } else {
            return;
          }
          
          doc.image(buf, x, y, { width });
        } catch (err) { 
          console.error(`[PDF] Error loading image:`, err); 
        }
      };

      // --- ENCABEZADO TRIPLE (ESTÁNDAR) ---
      await drawWebImage(config.logoImage, 50, 40, 80);
      await drawWebImage(hotelLogoUrl, 465, 40, 80);

      doc.fillColor(brandColor).fontSize(14).font('Helvetica-Bold').text('VOUCHER DE SERVICIO', 150, 45, { align: 'center', width: 295 });
      doc.fontSize(8).font('Helvetica').text(`RIF: ${config.rif || 'J-40156646-4'} | RTN: ${config.rtn || '13314'}`, 150, 62, { align: 'center', width: 295 });
      doc.fontSize(7).fillColor(labelColor).text(config.direccion || '-', 150, 72, { align: 'center', width: 295 });

      doc.moveTo(50, 110).lineTo(545, 110).lineWidth(2).stroke(brandColor);

      // --- DATOS TITULAR ---
      doc.fillColor(labelColor).fontSize(8).font('Helvetica-Bold').text('TITULAR:', 50, 130);
      doc.fillColor(brandColor).fontSize(12).text((op.clientName || 'CLIENTE').toUpperCase(), 50, 142);
      doc.fillColor(labelColor).fontSize(8).text('FOLIO VENTA:', 400, 130, { align: 'right' });
      doc.fillColor(brandColor).fontSize(10).text(op.id || '-', 400, 142, { align: 'right' });

      // --- DETALLES ---
      let currentY = 180;
      const drawBlockHeader = (title: string, y: number) => {
        doc.rect(50, y, 495, 18).fill(brandColor);
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text(title.toUpperCase(), 60, y + 5);
      };

      drawBlockHeader('Información del Servicio', currentY);
      currentY += 25;

      const drawOpRow = (label: string, value: string, y: number) => {
        doc.fillColor(labelColor).fontSize(8).text(label.toUpperCase(), 60, y);
        doc.fillColor(brandColor).fontSize(9).font('Helvetica-Bold').text(value?.toUpperCase() || '-', 250, y, { align: 'right', width: 280 });
        doc.moveTo(50, y + 15).lineTo(545, y + 15).lineWidth(0.5).stroke(borderColor);
      };

      drawOpRow('Hotel', op.hotelName, currentY); currentY += 20;
      drawOpRow('Llegada (Check-in)', new Date(op.checkIn).toLocaleDateString(), currentY); currentY += 20;
      drawOpRow('Salida (Check-out)', new Date(op.checkOut).toLocaleDateString(), currentY); currentY += 20;
      drawOpRow('Habitación', op.roomType, currentY); currentY += 20;
      drawOpRow('Plan', op.plan || 'No especificado', currentY); currentY += 20;

      currentY += 10;
      drawBlockHeader('Pasajeros Registrados', currentY);
      currentY += 25;
      if (op.companions && op.companions.length > 0) {
        op.companions.forEach((p: any) => {
          doc.fillColor(brandColor).fontSize(8).text(p.name.toUpperCase(), 60, currentY);
          doc.fillColor(labelColor).fontSize(8).text(p.type || 'Adulto', 350, currentY);
          currentY += 15;
        });
      }

      // --- STATUS PAGO ---
      doc.rect(50, 750, 495, 25).fill(successColor);
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold').text('ESTATUS DE PAGO: PAGADO TOTALMENTE', 50, 758, { align: 'center', width: 495 });

      doc.end();
    } catch (error: any) {
      console.error('[PDF] Voucher Error:', error);
      if (!res.headersSent) res.status(500).json({ error: error.message });
    }
  }
}
