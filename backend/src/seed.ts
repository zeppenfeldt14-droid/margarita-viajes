import knex from 'knex';
import knexConfig from '../knexfile.js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: 'backend/.env' });

// @ts-ignore
const db = (knex.default || knex)(knexConfig.production);

async function seed() {
  console.log('--- Iniciando Seeding de Datos para Cotización ---');
  console.log('DATABASE_URL cargada:', process.env.DATABASE_URL ? 'SÍ (Obfuscado: ' + process.env.DATABASE_URL.substring(0, 15) + '...)' : 'NO');
  console.log('Knex Config Connection:', JSON.stringify(knexConfig.production.connection, null, 2));
  
  try {
    const hotelId = uuidv4();
    const roomId = uuidv4();
    const seasonId = uuidv4();

    // 1. Limpiar datos previos si existen
    await db('seasons').del();
    await db('rooms').del();
    await db('hotels').del();

    // 2. Insertar Hotel
    await db('hotels').insert({
      id: hotelId,
      name: 'MARGARITA REAL',
      location: 'Playa el Agua',
      description: 'Hermoso hotel resort con todas las comodidades.',
      type: 'hotel',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1571011234236-0563b78516fb']),
      logo: 'https://via.placeholder.com/150'
    });
    console.log('✅ Hotel "MARGARITA REAL" insertado.');

    // 3. Insertar Habitación
    await db('rooms').insert({
      id: roomId,
      hotel_id: hotelId,
      name: 'HABITACIÓN DOBLE ESTÁNDAR',
      capacity: 2
    });
    console.log('✅ Habitación "DOBLE ESTÁNDAR" insertada.');

    // 4. Insertar Temporada y Tarifas
    await db('seasons').insert({
      id: seasonId,
      hotel_id: hotelId,
      type: 'Baja',
      start_date: '2024-01-01',
      end_date: '2026-12-31',
      room_prices: JSON.stringify({ [roomId]: 80 })
    });
    console.log('✅ Temporada "Baja" con tarifa de $80 insertada.');

    console.log('--- Seeding Completado con Éxito ---');
  } catch (error) {
    console.error('❌ Error en seeding:', error);
  } finally {
    await db.destroy();
  }
}

seed();
