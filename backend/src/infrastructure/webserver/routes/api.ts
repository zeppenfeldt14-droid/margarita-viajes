import express from 'express';
import { QuoteController } from '../controllers/QuoteController.js';
import { AdminController } from '../controllers/AdminController.js';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middlewares/auth.js';

export function createRouter(
  quoteController: QuoteController, 
  adminController: AdminController,
  authController: AuthController
) {
  const router = express.Router();

  // Auth
  router.post('/auth/login', (req, res) => authController.login(req, res));

  // Public Endpoints
  router.get('/hotels', (req, res) => adminController.getHotels(req, res));
  router.get('/transfers', (req, res) => adminController.getTransfers(req, res));
  router.get('/config', (req, res) => adminController.getConfig(req, res));
  router.post('/quotes/calculate', (req, res) => quoteController.calculatePrice(req, res));
  router.post('/quotes', (req, res) => quoteController.saveQuote(req, res));

  // Admin Endpoints (Protected)
  router.use('/admin', authMiddleware(['LEVEL_1', 'LEVEL_2', 'LEVEL_3']));
  
  router.get('/admin/hotels', (req, res) => adminController.getHotels(req, res));
  router.post('/admin/hotels', (req, res) => adminController.createHotel(req, res));
  router.put('/admin/hotels/:id', (req, res) => adminController.updateHotel(req, res));
  router.delete('/admin/hotels/:id', (req, res) => adminController.deleteHotel(req, res));
  router.get('/admin/hotels/:hotelId/rooms', (req, res) => adminController.getRoomsByHotel(req, res));
  router.post('/admin/rooms', (req, res) => adminController.createRoom(req, res));

  // Transfers
  router.get('/admin/transfers', (req, res) => adminController.getTransfers(req, res));
  router.post('/admin/transfers', (req, res) => adminController.createTransfer(req, res));
  router.put('/admin/transfers/:id', (req, res) => adminController.updateTransfer(req, res));
  router.delete('/admin/transfers/:id', (req, res) => adminController.deleteTransfer(req, res));

  // Quotes
  router.get('/admin/quotes', (req, res) => adminController.getQuotes(req, res));
  router.get('/quotes/check', (req, res) => quoteController.checkDuplicate(req, res));
  router.put('/admin/quotes/:id', (req, res) => adminController.updateQuote(req, res));

  // Config
  router.get('/admin/config', (req, res) => adminController.getConfig(req, res));
  router.post('/admin/config', (req, res) => adminController.updateConfig(req, res));

  // Operations
  router.get('/admin/operation', (req, res) => adminController.getOperationSequence(req, res));
  router.get('/admin/operations', (req, res) => adminController.getOperations(req, res));
  router.post('/admin/operation', (req, res) => adminController.createOperation(req, res));

  // Reservations
  router.get('/admin/reservations', (req, res) => adminController.getReservations(req, res));
  router.post('/admin/reservations', (req, res) => adminController.createReservation(req, res));
  router.put('/admin/reservations/:id', (req, res) => adminController.updateReservation(req, res));

  // Coupons
  router.get('/coupons', (req, res) => adminController.getCoupons(req, res));
  router.get('/admin/coupons', (req, res) => adminController.getCoupons(req, res));
  router.post('/admin/coupons', (req, res) => adminController.createCoupon(req, res));
  router.put('/admin/coupons/:id', (req, res) => adminController.updateCoupon(req, res));
  router.delete('/admin/coupons/:id', (req, res) => adminController.deleteCoupon(req, res));

  return router;
}
