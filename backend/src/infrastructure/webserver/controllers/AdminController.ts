import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import type { IHotelRepository } from '../../../domain/repositories/IHotelRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { IRoomRepository } from '../../../domain/repositories/IRoomRepository.js';
import type { IAuditRepository } from '../../../domain/repositories/IAuditRepository.js';
import type { ITransferRepository } from '../../../domain/repositories/ITransferRepository.js';
import type { IQuoteRepository } from '../../../domain/repositories/IQuoteRepository.js';
import type { IWebConfigRepository } from '../../../domain/repositories/IWebConfigRepository.js';
import type { IOperationRepository } from '../../../domain/repositories/IOperationRepository.js';
import type { IReservationRepository } from '../../../domain/repositories/IReservationRepository.js';
import type { ICouponRepository } from '../../../domain/repositories/ICouponRepository.js';
import { NotificationService } from '../../services/NotificationService.js';

export class AdminController {
  constructor(
    private hotelRepo: IHotelRepository,
    private roomRepo: IRoomRepository,
    private auditRepo: IAuditRepository,
    private transferRepo: ITransferRepository,
    private quoteRepo: IQuoteRepository,
    private configRepo: IWebConfigRepository,
    private operationRepo: IOperationRepository,
    private reservationRepo: IReservationRepository,
    private couponRepo: ICouponRepository,
    private userRepo: IUserRepository,
    private notificationService: NotificationService
  ) {}

  private cleanForAudit(data: any): string {
    if (!data) return '';
    if (typeof data === 'string') return data;
    const clean = { ...data };
    const blackList = ['hotelResponseImage', 'paymentProofImage', 'pdfBase64', 'hotelLogo', 'photos', 'logo', 'image'];
    blackList.forEach(key => { if (clean[key]) clean[key] = '[OMITIDO_POR_PESO]'; });
    return JSON.stringify(clean);
  }

  async getUsers(req: Request, res: Response) {
    try {
      const users = await this.userRepo.findAll();
      // No devolver hashes de password
      const safeUsers = users.map(u => {
        const { passwordHash, ...rest } = u;
        return {
          ...rest,
          name: u.fullName // Frontend compat
        };
      });
      return res.json(safeUsers);
    } catch (error: any) {
      console.error('[AdminController] Error en getUsers:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const { name, alias, email, password, role, dailyQuota, active, level, photo, inRoulette, modules } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ message: 'Nombre, Email y Password son obligatorios' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      
      const user = await this.userRepo.create({
        fullName: name,
        alias,
        email,
        passwordHash,
        role: role || 'Vendedor 1',
        dailyQuota: dailyQuota || 20,
        active: active !== false,
        level: level || 3,
        photo,
        inRoulette: inRoulette !== false,
        modules: modules || {}
      });

      const { passwordHash: _, ...safeUser } = user;
      return res.status(201).json(safeUser);
    } catch (error: any) {
      console.error('[AdminController] Error en createUser:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      const { name, alias, email, password, role, dailyQuota, active, level, photo, inRoulette, modules } = req.body;
      
      const updateData: any = {};
      if (name) updateData.fullName = name;
      if (alias !== undefined) updateData.alias = alias;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (dailyQuota !== undefined) updateData.dailyQuota = dailyQuota;
      if (active !== undefined) updateData.active = active;
      if (level !== undefined) updateData.level = level;
      if (photo !== undefined) updateData.photo = photo;
      if (inRoulette !== undefined) updateData.inRoulette = inRoulette;
      if (modules !== undefined) updateData.modules = modules;

      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      const user = await this.userRepo.update(id, updateData);
      const { passwordHash: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error: any) {
      console.error('[AdminController] Error en updateUser:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      await this.userRepo.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getHotels(req: Request, res: Response) {
    try {
      const hotels = await this.hotelRepo.findAll();
      return res.json(hotels);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async createHotel(req: Request, res: Response) {
    try {
      const { name, type } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'El nombre del hotel/servicio es obligatorio.' });
      }
      if (!type) {
        return res.status(400).json({ message: 'El tipo de inventario es obligatorio.' });
      }

      const hotel = await this.hotelRepo.create(req.body);
      
      await this.auditRepo.log({
        action: 'CREATE',
        tableName: 'hotels',
        recordId: hotel.id,
        newValue: this.cleanForAudit(hotel)
      });

      return res.status(201).json(hotel);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async deleteHotel(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      await this.hotelRepo.delete(id);

      await this.auditRepo.log({
        action: 'DELETE',
        tableName: 'hotels',
        recordId: id
      });

      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async updateHotel(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      if (!id) throw new Error('ID de hotel no proporcionado');

      await this.hotelRepo.update(id, req.body);
      
      await this.auditRepo.log({
        action: 'UPDATE',
        tableName: 'hotels',
        recordId: id,
        newValue: this.cleanForAudit(req.body)
      });

      return res.status(200).json({ message: 'Hotel updated' });
    } catch (error: any) {
      console.error('[AdminController] Error en updateHotel:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  async getRoomsByHotel(req: Request, res: Response) {
    try {
      const rooms = await this.roomRepo.findByHotelId(req.params['hotelId'] as string);
      return res.json(rooms);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async createRoom(req: Request, res: Response) {
    try {
      const room = await this.roomRepo.create(req.body);
      return res.status(201).json(room);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // --- TRANSFERS ---
  async getTransfers(req: Request, res: Response) {
    try {
      const transfers = await this.transferRepo.findAll();
      return res.json(transfers);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async createTransfer(req: Request, res: Response) {
    try {
      const transfer = await this.transferRepo.create(req.body);
      await this.auditRepo.log({ action: 'CREATE', tableName: 'transfers', recordId: transfer.id, newValue: this.cleanForAudit(transfer) });
      return res.status(201).json(transfer);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async deleteTransfer(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      await this.transferRepo.delete(id);
      await this.auditRepo.log({ action: 'DELETE', tableName: 'transfers', recordId: id });
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async updateTransfer(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      await this.transferRepo.update(id, req.body);
      return res.status(200).json({ message: 'Transfer updated' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // --- QUOTES ---
  async getQuotes(req: Request, res: Response) {
    try {
      const quotes = await this.quoteRepo.findAll();
      return res.json(quotes);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async updateQuote(req: Request, res: Response) {
    try {
      const quote = await this.quoteRepo.update(req.params['id'] as string, req.body);
      const pdfBase64 = req.body.pdfBase64;
      
      // Lanzar proceso de notificación en segundo plano
      this.processQuoteNotifications(quote, pdfBase64).catch(err => 
        console.error('[AdminController] Error en notificación de fondo:', err)
      );

      return res.json(quote);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async processQuoteNotifications(quote: any, pdfBase64?: string) {
    console.log(`[AdminController] Iniciando proceso de notificación para cotización ${quote.id}`);
    await this.notificationService.processAndSend(quote, pdfBase64);
  }

  // --- CONFIG ---
  async getConfig(req: Request, res: Response) {
    try {
      const config = await this.configRepo.getConfig();
      return res.json(config);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async updateConfig(req: Request, res: Response) {
    try {
      const configData = req.body;
      
      // Si es un objeto con múltiples claves, guardarlas todas
      if (typeof configData === 'object' && !configData.key) {
        for (const [key, value] of Object.entries(configData)) {
          if (value !== undefined && value !== null) {
            await this.configRepo.updateConfig(key, String(value));
          }
        }
      } else {
        // Si es el formato antiguo { key, value }
        const { key, value } = configData;
        await this.configRepo.updateConfig(key, value);
      }
      
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // --- OPERATIONS ---
  async getOperations(req: Request, res: Response) {
    try {
      const operations = await this.operationRepo.findAll();
      return res.json(operations);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getOperationSequence(req: Request, res: Response) {
    try {
      const seq = await this.operationRepo.getNextSequence();
      return res.json(seq);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async createOperation(req: Request, res: Response) {
    try {
      const operation = await this.operationRepo.create(req.body);
      await this.auditRepo.log({
        action: 'CREATE',
        tableName: 'operations',
        recordId: operation.id,
        newValue: this.cleanForAudit(operation)
      });
      return res.status(201).json(operation);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async updateOperation(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      const op = await this.operationRepo.findById(id);

      if (op && op.includeTransfer) {
        const targetStatus = req.body.status;
        if (['Confirmada', 'Venta Cerrada', 'Venta Concretada'].includes(targetStatus)) {
          const itinerary = req.body.itinerary || op.itinerary;
          const transferProvider = req.body.transferProvider || op.transferProvider;
          
          if (!itinerary || itinerary === '') {
            return res.status(400).json({ message: '❌ DEBE COMPLETAR ITINERARIO PARA ACTIVAR' });
          }
          if (!transferProvider || transferProvider === '') {
            return res.status(400).json({ message: '❌ DEBE COMPLETAR PROVEEDOR PARA ACTIVAR' });
          }
        }
      }

      const operation = await this.operationRepo.update(id, req.body);
      
      await this.auditRepo.log({
        action: 'UPDATE',
        tableName: 'operations',
        recordId: id,
        newValue: this.cleanForAudit(req.body)
      });

      return res.json(operation);
    } catch (error: any) {
      console.error('[AdminController] Error en updateOperation:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  // --- RESERVATIONS ---
  async getReservations(req: Request, res: Response) {
    try {
      const reservations = await this.reservationRepo.findAll();
      return res.json(reservations);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async createReservation(req: Request, res: Response) {
    try {
      const reservation = await this.reservationRepo.create(req.body);
      
      // Sincronización v24: Auto-generar Operación
      await this.syncOperationFromReservation(reservation);

      await this.auditRepo.log({
        action: 'CREATE',
        tableName: 'reservations',
        recordId: reservation.id,
        newValue: this.cleanForAudit(reservation)
      });
      return res.status(201).json(reservation);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async updateReservation(req: Request, res: Response) {
    try {
      const reservation = await this.reservationRepo.update(req.params['id'] as string, req.body);
      
      // Sincronización v24: Auto-generar Operación
      await this.syncOperationFromReservation(reservation);

      await this.auditRepo.log({
        action: 'UPDATE',
        tableName: 'reservations',
        recordId: req.params['id'] as string,
        newValue: this.cleanForAudit(req.body)
      });

      return res.json(reservation);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async syncOperationFromReservation(reservation: any) {
    const activeStatuses = ['Confirmada', 'Venta Cerrada', 'Venta Concretada'];
    if (activeStatuses.includes(reservation.status)) {
      const existingOps = await this.operationRepo.findAll();
      const alreadyExists = existingOps.find(op => op.quoteId === reservation.quoteId);
      
      if (!alreadyExists) {
        const sequence = await this.operationRepo.getNextSequence();
        await this.operationRepo.create({
          id: sequence.nextId,
          quoteId: reservation.quoteId,
          clientName: reservation.clientName,
          email: reservation.email,
          whatsapp: reservation.whatsapp,
          hotelId: reservation.hotelId,
          hotelName: reservation.hotelName,
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
          roomType: reservation.roomType,
          pax: reservation.pax,
          children: reservation.children,
          infants: reservation.infants,
          totalAmount: Number(reservation.totalAmount),
          companions: reservation.companions,
          technicalSheet: reservation.technicalSheet,
          plan: reservation.plan,
          status: 'Pendiente',
          includeTransfer: reservation.includeTransfer,
          transferId: reservation.transferId,
          hotelLogo: reservation.hotelLogo,
          hotelResponseImage: reservation.hotelResponseImage,
          originalQuoteId: reservation.originalQuoteId || reservation.quoteId
        });

        await this.auditRepo.log({
          action: 'CREATE',
          tableName: 'operations',
          recordId: sequence.nextId,
          newValue: `Auto-generated from Reservation ${reservation.id}`
        });
      } else if (reservation.status === 'Venta Cerrada') {
        // Regla v36: Si cambia a VENTA, forzar Pendiente en Operaciones para ingreso a bandeja
        await this.operationRepo.update(alreadyExists.id, { status: 'Pendiente' });
        
        await this.auditRepo.log({
          action: 'UPDATE',
          tableName: 'operations',
          recordId: alreadyExists.id,
          newValue: `Status forced to Pendiente from Reservation VENTA (${reservation.id})`
        });
      }
    }
  }

  // --- COUPONS ---
  async getCoupons(req: Request, res: Response) {
    try {
      const coupons = await this.couponRepo.findAll();
      return res.json(coupons);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async createCoupon(req: Request, res: Response) {
    try {
      const coupon = await this.couponRepo.create(req.body);
      await this.auditRepo.log({
        action: 'CREATE',
        tableName: 'coupons',
        recordId: coupon.id?.toString() || '',
        newValue: JSON.stringify(coupon)
      });
      return res.status(201).json(coupon);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async updateCoupon(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      await this.couponRepo.update(id, req.body);
      await this.auditRepo.log({
        action: 'UPDATE',
        tableName: 'coupons',
        recordId: id,
        newValue: JSON.stringify(req.body)
      });
      return res.status(200).json({ message: 'Coupon updated' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async deleteCoupon(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      await this.couponRepo.delete(id);
      await this.auditRepo.log({
        action: 'DELETE',
        tableName: 'coupons',
        recordId: id
      });
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async trackMarketingEvent(req: Request, res: Response) {
    try {
      const eventData = req.body;
      console.log('[Analytics] Track Event:', JSON.stringify(eventData));
      return res.status(200).json({ status: 'tracked', msg: 'Data received' });
    } catch (err: any) {
      console.error('[Analytics] Error:', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async getMarketingAnalytics(req: Request, res: Response) {
    try {
      // Mock estructurado v56 para prevenir colapso y 404
      const mockData = {
        totalTraffic: 12540,
        mobilePercent: 68,
        dropOffRate: 24,
        conversionFunnel: [
          { name: 'Leads', value: 500 },
          { name: 'Atendidos', value: 350 },
          { name: 'Reservas', value: 120 },
          { name: 'Cierres', value: 45 }
        ],
        trafficBySource: [
          { name: 'Google', value: 45 },
          { name: 'Instagram', value: 30 },
          { name: 'Directo', value: 15 },
          { name: 'Otros', value: 10 }
        ]
      };
      return res.status(200).json(mockData);
    } catch (error: any) {
      console.error('[AdminController] Error en getMarketingAnalytics:', error);
      return res.status(500).json({ message: error.message });
    }
  }
}
