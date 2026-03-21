import express from 'express';
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
import { CalculateQuotePrice } from './application/use-cases/CalculateQuotePrice.js';
import { QuoteController } from './infrastructure/webserver/controllers/QuoteController.js';
import { AdminController } from './infrastructure/webserver/controllers/AdminController.js';
import { AuthController } from './infrastructure/webserver/controllers/AuthController.js';
import { createRouter } from './infrastructure/webserver/routes/api.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Inyección de Dependencias
const env = process.env.DB_TYPE || 'local';
const dbConfig = knexConfig[env];
if (!dbConfig) throw new Error(`Database configuration for "${env}" not found`);
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

// Casos de Uso
const calculateQuotePrice = new CalculateQuotePrice(seasonRepository);

// Controladores
const quoteController = new QuoteController(calculateQuotePrice, quoteRepository);
const adminController = new AdminController(
  hotelRepository, 
  roomRepository, 
  auditRepository,
  transferRepository,
  quoteRepository,
  configRepository,
  operationRepository,
  reservationRepository
);
const authController = new AuthController(userRepository);

// Rutas
app.use('/api', createRouter(quoteController, adminController, authController));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Margarita Viajes Backend corriendo en http://localhost:${PORT}`);
  try {
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
