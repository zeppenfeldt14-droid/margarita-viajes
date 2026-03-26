import express from 'express';
import type { Request, Response } from 'express';
import { QuoteController } from '../controllers/QuoteController.js';
import { AdminController } from '../controllers/AdminController.js';
import { AuthController } from '../controllers/AuthController.js';
import { LogController } from '../controllers/LogController.js';
import { CommunicationController } from '../controllers/CommunicationController.js';
import { authMiddleware } from '../middlewares/auth.js';

export function createRouter(
  quoteController: QuoteController, 
  adminController: AdminController,
  authController: AuthController,
  logController: LogController,
  communicationController: CommunicationController
) {
  const router = express.Router();

  // Auth
  router.post('/auth/login', (req: Request, res: Response) => authController.login(req, res));



  // Public Endpoints
  router.get('/hotels', (req: Request, res: Response) => adminController.getHotels(req, res));
  router.get('/public/hotels', (req: Request, res: Response) => adminController.getHotels(req, res));
  router.get('/transfers', (req: Request, res: Response) => adminController.getTransfers(req, res));
  router.get('/public/transfers', (req: Request, res: Response) => adminController.getTransfers(req, res));
  router.get('/config', (req: Request, res: Response) => adminController.getConfig(req, res));
  router.get('/public/config', (req: Request, res: Response) => adminController.getConfig(req, res));
  router.get('/public/quotes/next-folio', (req: Request, res: Response) => quoteController.getNextFolio(req, res));
  router.get('/public/quotes/:id/pdf', (req: Request, res: Response) => quoteController.getQuotePdfOnDemand(req, res));
  router.post('/quotes/calculate', (req: Request, res: Response) => quoteController.calculatePrice(req, res));
  router.post('/quotes', (req: Request, res: Response) => quoteController.saveQuote(req, res));
  router.post('/public/analytics/track', (req: Request, res: Response) => adminController.trackMarketingEvent(req, res));

  // Admin Endpoints (Protected)
  router.use('/admin', authMiddleware(['LEVEL_1', 'LEVEL_2', 'LEVEL_3']));
  
  // SOLAMENTE NIVEL 1 (GERENTES)
  const masterAuth = authMiddleware(['LEVEL_1']);

  router.get('/admin/hotels', (req: Request, res: Response) => adminController.getHotels(req, res));
  router.post('/admin/hotels', (req: Request, res: Response) => adminController.createHotel(req, res));
  router.put('/admin/hotels/:id', (req: Request, res: Response) => adminController.updateHotel(req, res));
  router.delete('/admin/hotels/:id', (req: Request, res: Response) => adminController.deleteHotel(req, res));
  router.get('/admin/hotels/:hotelId/rooms', (req: Request, res: Response) => adminController.getRoomsByHotel(req, res));
  router.post('/admin/rooms', (req: Request, res: Response) => adminController.createRoom(req, res));
  
  // Usuarios: Lectura permitida para Niveles 2 y 3 (para selectores de reasignación)
  router.get('/admin/users', (req: Request, res: Response) => adminController.getUsers(req, res));
  router.post('/admin/users', masterAuth, (req: Request, res: Response) => adminController.createUser(req, res));
  router.put('/admin/users/:id', masterAuth, (req: Request, res: Response) => adminController.updateUser(req, res));
  router.delete('/admin/users/:id', masterAuth, (req: Request, res: Response) => adminController.deleteUser(req, res));

  // Transfers
  router.get('/admin/transfers', (req: Request, res: Response) => adminController.getTransfers(req, res));
  router.post('/admin/transfers', (req: Request, res: Response) => adminController.createTransfer(req, res));
  router.put('/admin/transfers/:id', (req: Request, res: Response) => adminController.updateTransfer(req, res));
  router.delete('/admin/transfers/:id', (req: Request, res: Response) => adminController.deleteTransfer(req, res));

  // Quotes
  router.get('/admin/quotes', (req: Request, res: Response) => adminController.getQuotes(req, res));
  router.get('/quotes/next-folio', (req: Request, res: Response) => quoteController.getNextFolio(req, res));
  router.get('/quotes/check', (req: Request, res: Response) => quoteController.checkDuplicate(req, res));
  router.put('/admin/quotes/:id', (req: Request, res: Response) => adminController.updateQuote(req, res));

  // Config (NIVEL 1 SOLAMENTE)
  router.get('/admin/config', masterAuth, (req: Request, res: Response) => adminController.getConfig(req, res));
  router.post('/admin/config', masterAuth, (req: Request, res: Response) => adminController.updateConfig(req, res));

  // Operations
  router.get('/admin/operation', (req: Request, res: Response) => adminController.getOperationSequence(req, res));
  router.get('/admin/operations', (req: Request, res: Response) => adminController.getOperations(req, res));
  router.post('/admin/operation', (req: Request, res: Response) => adminController.createOperation(req, res));
  router.post('/admin/operations', (req: Request, res: Response) => adminController.createOperation(req, res));
  router.put('/admin/operations/:id', (req: Request, res: Response) => adminController.updateOperation(req, res));
  router.get('/admin/operations/:id/voucher', (req: Request, res: Response) => quoteController.getVoucherPdfOnDemand(req, res));
  router.get('/public/vouchers/:id', (req: Request, res: Response) => quoteController.getVoucherPdfOnDemand(req, res));

  // Reservations
  router.get('/admin/reservations', (req: Request, res: Response) => adminController.getReservations(req, res));
  router.post('/admin/reservations', (req: Request, res: Response) => adminController.createReservation(req, res));
  router.put('/admin/reservations/:id', (req: Request, res: Response) => adminController.updateReservation(req, res));

  // Coupons
  router.get('/coupons', (req: Request, res: Response) => adminController.getCoupons(req, res));
  router.get('/public/coupons', (req: Request, res: Response) => adminController.getCoupons(req, res));
  router.get('/admin/coupons', (req: Request, res: Response) => adminController.getCoupons(req, res));
  router.post('/admin/coupons', (req: Request, res: Response) => adminController.createCoupon(req, res));
  router.put('/admin/coupons/:id', (req: Request, res: Response) => adminController.updateCoupon(req, res));
  router.delete('/admin/coupons/:id', (req: Request, res: Response) => adminController.deleteCoupon(req, res));
  router.get('/admin/analytics/marketing', (req: Request, res: Response) => adminController.getMarketingAnalytics(req, res));

  // Logs: Lectura solo Master (Nivel 1), Escritura para TODOS (Nivel 1, 2, 3)
  router.get('/admin/logs', masterAuth, (req: Request, res: Response) => logController.getLogs(req, res));
  router.post('/admin/logs', (req: Request, res: Response) => logController.createLog(req, res));

  // Communications (NUEVO v33)
  router.post('/communications/dispatch', (req: Request, res: Response) => communicationController.dispatch(req, res));

  return router;
}
