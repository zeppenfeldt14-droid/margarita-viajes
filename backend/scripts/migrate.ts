import knex from 'knex';
import knexConfig from '../knexfile.js';

// Datos estáticos que estaban en localStorage/inventory.ts
// Aquí podríamos importar de inventory.ts si el entorno lo permite, 
// pero para asegurar la ejecución crearemos el mapeo base.

const db = knex(process.env.DATABASE_URL ? knexConfig.production : knexConfig.development);

async function migrateData() {
  console.log('--- Iniciando Migración de Datos ---');

  // 1. Limpiar tablas (Opcional, precaución)
  // await db('room_seasons').del();
  // await db('rooms').del();
  // await db('hotels').del();

  const mockHotels = [
    {
      name: 'Sunray Beach Resort',
      location: 'Playa el Agua',
      description: 'Hermoso resort frente al mar con todo incluido.',
      rooms: [
        { name: 'Standard', capacity: 2, price: 80 },
        { name: 'Suite', capacity: 3, price: 150 }
      ]
    },
    {
      name: 'Margarita Village',
      location: 'Pampatar',
      description: 'Villas familiares con ambiente caribeño.',
      rooms: [
        { name: 'Villa Doble', capacity: 4, price: 120 }
      ]
    }
  ];

  for (const h of mockHotels) {
    const [hotel] = await db('hotels').insert({
      name: h.name,
      location: h.location,
      description: h.description,
      type: 'hotel'
    }).returning('*');

    console.log(`Hotel insertado: ${hotel.name}`);

    for (const r of h.rooms) {
      const [room] = await db('rooms').insert({
        hotel_id: hotel.id,
        name: r.name,
        capacity: r.capacity
      }).returning('*');

      // Crear temporada base para todo el año
      await db('room_seasons').insert({
        room_id: room.id,
        season_name: 'Tarifa Base 2026',
        price_per_night: r.price,
        period: '[2026-01-01, 2026-12-31]'
      });
      
      console.log(`  Habitación: ${room.name} con tarifa base $${r.price}`);
    }
  }

  console.log('--- Migración Finalizada con Éxito ---');
  process.exit(0);
}

migrateData().catch(err => {
  console.error('Error migrando datos:', err);
  process.exit(1);
});
