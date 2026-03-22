import nodemailer from 'nodemailer';
import twilio from 'twilio';

export class NotificationService {
  private transporter: nodemailer.Transporter;
  private twilioClient?: twilio.Twilio;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'margaritaviaje@gmail.com',
        pass: process.env.SMTP_PASS // Se requiere App Password de Google
      }
    });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (accountSid && authToken) {
      this.twilioClient = twilio(accountSid, authToken);
    }
  }

  async processAndSend(quote: any, pdfBase64?: string) {
    console.log(`[NotificationService] Procesando notificación para cotización ${quote.id || quote.folio}`);
    
    try {
      // 1. Enviar por Email (si hay PDF)
      if (pdfBase64) {
        // El frontend envía el base64 con o sin el prefijo "data:application/pdf;base64,"
        const base64Data = pdfBase64.includes(';base64,') 
          ? pdfBase64.split(';base64,')[1] 
          : pdfBase64;
          
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        await this.sendQuoteEmail(quote, pdfBuffer);
      } else {
        console.warn('[NotificationService] No se recibió PDF en base64');
      }

      // 2. Enviar por WhatsApp
      await this.sendQuoteWhatsApp(quote);

      console.log(`[NotificationService] Proceso completado para ${quote.id || quote.folio}`);
    } catch (error) {
      console.error('[NotificationService] Error en el proceso global:', error);
    }
  }

  async sendQuoteEmail(quote: any, pdfBuffer: Buffer) {
    const email = quote.clientEmail || quote.client_email || quote.email;
    if (!email) {
      console.warn('[NotificationService] No hay email para enviar la cotización');
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_USER || 'margaritaviaje@gmail.com',
      to: email,
      cc: 'margaritaviaje@gmail.com',
      subject: `Cotización Margarita Viajes - ${quote.hotelName || quote.hotel_name}`,
      text: `Hola ${quote.clientName || quote.client_name},\n\nAdjuntamos la cotización solicitada para tu viaje a ${quote.hotelName || quote.hotel_name}.\n\nSaludos,\nEquipo Margarita Viajes`,
      attachments: [
        {
          filename: `Cotizacion_${quote.id || quote.folio || 'Margarita'}.pdf`,
          content: pdfBuffer
        }
      ]
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[NotificationService] Email enviado con éxito a ${email}`);
    } catch (error) {
      console.error('[NotificationService] Error enviando email:', error);
    }
  }

  async sendQuoteWhatsApp(quote: any) {
    const phoneNumber = quote.clientPhone || quote.client_phone || quote.whatsapp;
    if (!phoneNumber) return;

    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    if (!this.twilioClient || !fromPhone) {
      console.warn('[NotificationService] Twilio WhatsApp no configurado');
      return;
    }

    // Formatear el teléfono para Twilio (Ej. +584241234567)
    let clientPhone = phoneNumber.replace(/[^\d+]/g, '');
    if (!clientPhone.startsWith('+')) {
      // Si el usuario proporcionó 0424... lo convertimos a +58424...
      clientPhone = clientPhone.startsWith('0') ? `+58${clientPhone.slice(1)}` : `+58${clientPhone}`;
    }

    const pdfLink = `${process.env.BACKEND_URL || 'https://margarita-viajes.onrender.com'}/api/public/quotes/${quote.id || quote.folio}/pdf`;
    const message = `Hola ${quote.clientName || quote.client_name}! Te enviamos tu cotización para *${quote.hotelName || quote.hotel_name}*.\n\nPuedes descargar el PDF aquí: ${pdfLink}\n\nQuedamos atentos ante cualquier duda. 🌴☀️`;

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: `whatsapp:${fromPhone}`,
        to: `whatsapp:${clientPhone}`
      });
      console.log(`[NotificationService] WhatsApp enviado con éxito a ${clientPhone} con link: ${pdfLink}`);
    } catch (error) {
      console.error('[NotificationService] Error enviando WhatsApp:', error);
    }
  }
}

