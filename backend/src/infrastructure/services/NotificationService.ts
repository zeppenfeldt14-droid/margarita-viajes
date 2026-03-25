import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import twilio from 'twilio';

export class NotificationService {
  private transporter: any;
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
      // 1. Enviar por Email (el PDF ahora es opcional como adjunto, se prioriza el link)
      let pdfBuffer: Buffer | undefined = undefined;
      if (pdfBase64) {
        const base64Data = pdfBase64.includes(';base64,') 
          ? pdfBase64.split(';base64,')[1] 
          : pdfBase64;
        pdfBuffer = Buffer.from(base64Data, 'base64');
      }

      await this.sendQuoteEmail(quote, pdfBuffer);

      // 2. Enviar por WhatsApp
      await this.sendQuoteWhatsApp(quote);

      console.log(`[NotificationService] Proceso completado para ${quote.id || quote.folio}`);
    } catch (error) {
      console.error('[NotificationService] Error en el proceso global:', error);
    }
  }
  async sendQuoteEmail(quote: any, pdfBuffer?: Buffer) {
    const email = quote.clientEmail || quote.client_email || quote.email;
    console.log(`[NotificationService] Intentando enviar email a: ${email} para cotización ${quote.id || quote.folio}`);
    
    if (!email) {
      console.warn('[NotificationService] No se puede enviar email: campo "email" está vacío');
      return;
    }

    if (!process.env.SMTP_PASS) {
      console.error('[NotificationService] ERROR CRÍTICO: SMTP_PASS no está configurado. El correo NO se enviará.');
      return;
    }

    const mailOptions: any = {
      from: process.env.SMTP_USER || 'margaritaviaje@gmail.com',
      to: email,
      cc: 'margaritaviaje@gmail.com',
      bcc: 'margaritaviajegerenciaop@gmail.com',
      subject: `Cotización Margarita Viajes - ${quote.hotelName || quote.hotel_name || quote.hotel}`,
      text: `Hola ${quote.clientName || quote.client_name || 'Cliente'},\n\nAdjuntamos la cotización solicitada para tu viaje a ${quote.hotelName || quote.hotel_name || quote.hotel}.\n\nPuedes descargarla directamente desde este enlace: ${process.env.APP_URL || 'https://margarita-viajes.onrender.com'}/api/public/quotes/${quote.id || quote.folio}/pdf\n\nSaludos,\nEquipo Margarita Viajes`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #0B132B;">
          <h2 style="color: #ea580c;">¡Hola ${quote.clientName || quote.client_name || 'Cliente'}!</h2>
          <p>Adjuntamos la cotización solicitada para tu viaje a <strong>${quote.hotelName || quote.hotel_name || quote.hotel}</strong>.</p>
          <p>También puedes descargarla o verla directamente haciendo clic en el siguiente botón:</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://margarita-viajes.onrender.com'}/api/public/quotes/${quote.id || quote.folio}/pdf" 
               style="background-color: #0B132B; color: white; padding: 15px 25px; text-decoration: none; border-radius: 10px; font-weight: bold;">
               Descargar Cotización en PDF
            </a>
          </div>
          <p>Saludos,<br><strong>Equipo Margarita Viajes</strong></p>
        </div>
      `
    };

    if (pdfBuffer) {
      mailOptions.attachments = [
        {
          filename: `Cotizacion_${quote.id || quote.folio || 'Margarita'}.pdf`,
          content: pdfBuffer
        }
      ];
    }

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[NotificationService] Email enviado con éxito a ${email}`);
    } catch (error: any) {
      console.error('[NotificationService] FALLO AL ENVIAR EMAIL:', error.message);
    }
  }

  async sendQuoteWhatsApp(quote: any) {
    const phoneNumber = quote.clientPhone || quote.client_phone || quote.whatsapp;
    console.log(`[NotificationService] Intentando enviar WhatsApp a: ${phoneNumber}`);
    
    if (!phoneNumber) {
      console.warn('[NotificationService] No se puede enviar WhatsApp: campo "phone" está vacío');
      return;
    }

    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    if (!this.twilioClient || !fromPhone) {
      console.warn('[NotificationService] Twilio no configurado. Ignorando envío de WhatsApp automático.');
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

  async sendVoucherEmail(operation: any, pdfBuffer?: Buffer) {
    const email = operation.email || operation.clientEmail || operation.client_email;
    if (!email) return console.warn('[NotificationService] No hay email para enviar el voucher');

    const mailOptions: any = {
      from: process.env.SMTP_USER || 'margaritaviaje@gmail.com',
      to: email,
      cc: 'margaritaviaje@gmail.com',
      subject: `Voucher de Viaje Margarita Viajes - ${operation.clientName || 'Cliente'}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #0B132B;">
          <h2 style="color: #0ea5e9;">¡Tu voucher está listo!</h2>
          <p>Hola <strong>${operation.clientName}</strong>, adjuntamos tu comprobante oficial para tu estadía en <strong>${operation.hotelName}</strong>.</p>
          <p>Puedes acceder a tu voucher digital en cualquier momento desde este enlace:</p>
          <div style="margin: 30px 0;">
            <a href="https://margarita-viajes.onrender.com/api/public/vouchers/${operation.id}" 
               style="background-color: #0ea5e9; color: white; padding: 15px 25px; text-decoration: none; border-radius: 10px; font-weight: bold;">
               Ver Voucher Digital
            </a>
          </div>
          <p>¡Feliz viaje!<br><strong>Equipo Margarita Viajes</strong></p>
        </div>
      `
    };

    if (pdfBuffer) {
      mailOptions.attachments = [{ filename: `Voucher_${operation.id}.pdf`, content: pdfBuffer }];
    }

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[NotificationService] Voucher enviado a ${email}`);
    } catch (error) {
      console.error('[NotificationService] Error enviando voucher:', error);
    }
  }

  async sendReservationEmail(reservation: any, pdfBuffer?: Buffer) {
    const email = reservation.email || reservation.clientEmail;
    if (!email) return;

    const mailOptions: any = {
      from: process.env.SMTP_USER || 'margaritaviaje@gmail.com',
      to: email,
      subject: `Confirmación de Reserva Margarita Viajes - ${reservation.id}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #0B132B;">
          <h2 style="color: #10b981;">Reserva Confirmada</h2>
          <p>Hola <strong>${reservation.clientName}</strong>, te re-enviamos los detalles de tu reservación para <strong>${reservation.hotelName}</strong>.</p>
          <p><strong>Folio:</strong> ${reservation.id}</p>
          <p><strong>Check-in:</strong> ${reservation.checkIn}</p>
          <p>Saludos,<br><strong>Equipo Margarita Viajes</strong></p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[NotificationService] Confirmación re-enviada a ${email}`);
    } catch (error) {
      console.error('[NotificationService] Error re-enviando reserva:', error);
    }
  }
}
