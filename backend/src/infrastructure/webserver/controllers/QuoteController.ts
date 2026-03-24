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
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Cotizacion_${id}.pdf`);

      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(res);

      // --- ENCABEZADO ---
      try {
        const logoUrl = config.logoImage;
        if (logoUrl && logoUrl.startsWith('http')) {
          const response = await fetch(logoUrl);
          if (response.ok) {
            const logoBuffer = Buffer.from(await response.arrayBuffer());
            doc.image(logoBuffer, 50, 45, { width: 100 });
          }
        }
      } catch (err) {
        console.error('[PDF] Error al cargar logo:', err);
      }

      doc.fillColor('#0B132B')
         .fontSize(20)
         .font('Helvetica-Bold')
         .text(config.agencyName || 'MARGARITA VIAJES', 160, 50, { align: 'center' });

      doc.fontSize(10)
         .font('Helvetica')
         .text(`RIF: ${config.rif || 'J-40156646-4'} | RTN: ${config.rtn || '13314'}`, 160, 75, { align: 'center' })
         .text(config.direccion || 'Calle La Ceiba, Sector El Otro Lado del Río, La Asunción, Edo. Nueva Esparta', 160, 90, { align: 'center', width: 350 });

      doc.moveTo(50, 130).lineTo(550, 130).stroke('#EEEEEE');

      // --- DATOS DEL CLIENTE ---
      doc.moveDown(2);
      doc.fillColor('#999999').fontSize(8).font('Helvetica-Bold').text('ESTIMADO SR./A:', 50, 150);
      doc.fillColor('#0B132B').fontSize(14).text((quote.clientName || 'CLIENTE').toUpperCase(), 50, 160);

      doc.fillColor('#999999').fontSize(8).text('FECHA DE EMISIÓN:', 400, 150, { align: 'right' });
      doc.fillColor('#0B132B').fontSize(10).text(new Date(quote.date || (quote as any).createdAt || new Date()).toLocaleDateString(), 400, 160, { align: 'right' });

      // --- DETALLE DEL VIAJE ---
      doc.moveDown(3);
      // --- CUADRÍCULA DE DATOS ---
      const gridY = 180;
      const colWidth = 240;
      const rowHeight = 35;
      const brandColor = '#0B132B';
      const accentColor = '#ea580c';
      const lightTextColor = '#999999';

      const drawGridItem = (label: string, value: string, x: number, y: number) => {
        doc.fillColor(lightTextColor).fontSize(7).font('Helvetica-Bold').text(label.toUpperCase(), x, y);
        doc.fillColor(brandColor).fontSize(10).font('Helvetica-Bold').text(value?.toUpperCase() || '-', x, y + 10, { width: colWidth - 20, height: 15 });
        doc.moveTo(x, y + 25).lineTo(x + colWidth - 10, y + 25).stroke('#F9F9F9');
      };

      // Fila 1
      drawGridItem('CLIENTE', quote.clientName || 'CLIENTE', 50, gridY);
      drawGridItem('FECHA DE EMISIÓN', new Date(quote.date || new Date()).toLocaleDateString(), 50 + colWidth + 10, gridY);

      // Fila 2
      drawGridItem('HOTEL / PAQUETE', quote.hotelName || '-', 50, gridY + rowHeight);
      drawGridItem('TEMPORADA', quote.season || (quote as any).temp || 'ESTÁNDAR', 50 + colWidth + 10, gridY + rowHeight);

      // Fila 3
      drawGridItem('TIPO DE HABITACIÓN', quote.roomType || '-', 50, gridY + rowHeight * 2);
      drawGridItem('PLAN DE COMIDAS', quote.plan || 'NO ESPECIFICADO', 50 + colWidth + 10, gridY + rowHeight * 2);

      // Fila 4
      drawGridItem('FECHA DE ENTRADA', new Date(quote.checkIn).toLocaleDateString(), 50, gridY + rowHeight * 3);
      drawGridItem('FECHA DE SALIDA', new Date(quote.checkOut).toLocaleDateString(), 50 + colWidth + 10, gridY + rowHeight * 3);

      // Fila 5
      const paxDetails = `${quote.pax} ADULTOS${quote.children ? `, ${quote.children} NIÑOS` : ''}${quote.infants ? `, ${quote.infants} INF` : ''}`;
      drawGridItem('PASAJEROS', paxDetails, 50, gridY + rowHeight * 4);
      
      const diffDays = Math.max(1, Math.ceil((new Date(quote.checkOut).getTime() - new Date(quote.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
      drawGridItem('ESTADÍA', `${diffDays} NOCHE${diffDays > 1 ? 'S' : ''}`, 50 + colWidth + 10, gridY + rowHeight * 4);

      // --- BLOQUE DE TOTAL DESTACADO ---
      doc.moveDown(4);
      const totalSectionY = doc.y + 40;
      
      // Caja de fondo
      doc.rect(50, totalSectionY, 495, 60).fill(brandColor);
      
      doc.fillColor(accentColor).fontSize(9).font('Helvetica-Bold').text('TOTAL NETO A PAGAR', 70, totalSectionY + 15);
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica').text('Precios expresados en Dólares Americanos ($)', 70, totalSectionY + 30);
      
      const finalPrice = Number(quote.finalAmount || quote.totalAmount || 0);
      doc.fillColor('#FFFFFF').fontSize(26).font('Helvetica-Bold').text(`$ ${finalPrice.toLocaleString()}`, 70, totalSectionY + 18, { align: 'right', width: 450 });

      // --- PIE DE PÁGINA / ASESOR ---
      const footerY = 680;
      doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#EEEEEE');
      
      doc.fillColor(lightTextColor).fontSize(8).font('Helvetica').text('Quedamos atentos a su requerimiento:', 50, footerY + 15);
      
      const seller = quote.assignedTo || 'Equipo Margarita Viajes';
      doc.fillColor(brandColor).fontSize(10).font('Helvetica-Bold').text(`Asesor de Viajes: ${seller}`, 50, footerY + 30);
      
      doc.fillColor(lightTextColor).fontSize(8).text(`WhatsApp: ${config.telefono || '+58 424 0000000'}`, 400, footerY + 30, { align: 'right' });
      doc.text(`Correo: ${config.correo || 'ventas@margaritaviajes.com'}`, 400, footerY + 45, { align: 'right' });

      doc.fillColor(accentColor).fontSize(7).text('PRECIOS Y DISPONIBILIDAD SUJETOS A CAMBIOS AL MOMENTO DE RESERVA Y EMISIÓN.', 50, footerY + 80, { align: 'center', width: 500 });

      doc.end();
    } catch (error: any) {
      console.error('[QuoteController] Error in getQuotePdfOnDemand:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  }
}
