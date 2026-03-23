import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import knex from 'knex';
import knexConfig from '../knexfile.js';
import { PostgresSeasonRepository } from './infrastructure/database/PostgresSeasonRepository.js';
import { PostgresHotelRepository } from './infrastructure/database/PostgresHotelRepository.js';
import { PostgresRoomRepository } from './infrastructure/database/PostgresRoomRepository.js';
import { PostgresAuditRepository } from './infrastructure/database/PostgresAuditRepository.js';
import { PostgresTransferRepository } from './infrastructure/database/PostgresTransferRepository.js';
import { PostgresQuoteRepository } from './infrastructure/database/PostgresQuoteRepository.js';
import { PostgresWebConfigRepository } from './infrastructure/database/PostgresWebConfigRepository.js';
import { PostgresUserRepository } from './infrastructure/database/PostgresUserRepository.js';
import { PostgresOperationRepository } from './infrastructure/database/PostgresOperationRepository.js';
import { PostgresReservationRepository } from './infrastructure/database/PostgresReservationRepository.js';
import { PostgresCouponRepository } from './infrastructure/database/PostgresCouponRepository.js';
import { initDatabase } from './infrastructure/database/initDb.js';
import { CalculateQuotePrice } from './application/use-cases/CalculateQuotePrice.js';
import { QuoteController } from './infrastructure/webserver/controllers/QuoteController.js';
import { AdminController } from './infrastructure/webserver/controllers/AdminController.js';
import { AuthController } from './infrastructure/webserver/controllers/AuthController.js';
import dotenv from 'dotenv';
import { createRouter } from './infrastructure/webserver/routes/api.js';
import { NotificationService } from './infrastructure/services/NotificationService.js';

dotenv.config();

const app = express();
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CORS configurable y unificado
app.use(cors({
  origin: '*', // Permitir todos los orígenes en esta etapa para asegurar acceso desde Vercel
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false // Cambiado a false para permitir origin '*'
}));

app.use(express.json({ limit: '50mb' }));

// Health check para monitorear el backend en Render
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Configuración Estricta de Base de Datos para Persistencia Real
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('❌ ERROR CRÍTICO: La variable DATABASE_URL es necesaria para la persistencia real.');
}

const env = 'production';
const dbConfig = knexConfig[env];
const db = knex(dbConfig);

// Repositorios
const seasonRepository = new PostgresSeasonRepository(db);
const hotelRepository = new PostgresHotelRepository(db);
const roomRepository = new PostgresRoomRepository(db);
const auditRepository = new PostgresAuditRepository(db);
const transferRepository = new PostgresTransferRepository(db);
const quoteRepository = new PostgresQuoteRepository(db);
const configRepository = new PostgresWebConfigRepository(db);
const userRepository = new PostgresUserRepository(db);
const operationRepository = new PostgresOperationRepository(db);
const reservationRepository = new PostgresReservationRepository(db);
const couponRepository = new PostgresCouponRepository(db);

// Casos de Uso
const calculateQuotePrice = new CalculateQuotePrice(seasonRepository);

// Servicios
const notificationService = new NotificationService();

// Controladores
const quoteController = new QuoteController(
  calculateQuotePrice,
  quoteRepository,
  configRepository,
  hotelRepository,
  notificationService
);
const adminController = new AdminController(
  hotelRepository,
  roomRepository,
  auditRepository,
  transferRepository,
  quoteRepository,
  configRepository,
  operationRepository,
  reservationRepository,
  couponRepository,
  userRepository,
  notificationService
);
const authController = new AuthController(userRepository);

// --- RUTAS DE LA API ---
// IMPORTANTE: Registrar las rutas ANTES de cualquier manejador general de 404
app.use('/api', createRouter(quoteController, adminController, authController));

// Manejador global de 404 para la API  ...
// Debe ir AL FINAL de todas las definiciones de ruta de la API
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: `Ruta API no encontrada: ${req.originalUrl}` });
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Margarita Viajes Backend corriendo en http://localhost:${PORT}`);
  try {
    // Inicializar tablas y esquema
    await initDatabase(db);
    
    await db.raw('SELECT 1');
    console.log(`✅ Base de Datos [${env.toUpperCase()}] conectada correctamente.`);
  } catch (err: any) {
    console.error(`❌ Error conectando a la DB: ${err.message}`);
    const conn: any = dbConfig.connection;
    if (conn && typeof conn === 'object') {
      console.error(`Host/File: ${conn.host || conn.filename}, DB: ${conn.database || 'N/A'}`);
    }
  }
});
