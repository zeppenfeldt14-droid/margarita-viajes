import { knex } from 'knex';
import bcrypt from 'bcrypt';
import path from 'path';

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './dev.sqlite3'
  },
  useNullAsDefault: true
});

async function main() {
  console.log('🚀 Iniciando base de datos SQLite para pruebas locales...');

  try {
    // 1. Usuarios
    await db.schema.dropTableIfExists('users');
    await db.schema.createTable('users', (table) => {
      table.string('id').primary();
      table.string('email').unique().notNullable();
      table.string('password_hash').notNullable();
      table.string('full_name').notNullable();
      table.string('role').defaultTo('LEVEL_3');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    // 2. Hoteles
    await db.schema.dropTableIfExists('hotels');
    await db.schema.createTable('hotels', (table) => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.string('location').notNullable();
      table.text('description');
      table.text('logo');
      table.text('photos');
      table.string('type').defaultTo('hotel');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    // 3. Habitaciones
    await db.schema.dropTableIfExists('rooms');
    await db.schema.createTable('rooms', (table) => {
      table.string('id').primary();
      table.string('hotel_id').references('id').inTable('hotels').onDelete('CASCADE');
      table.string('name').notNullable();
      table.integer('capacity').notNullable();
    });

    // 4. Temporadas
    await db.schema.dropTableIfExists('seasons');
    await db.schema.createTable('seasons', (table) => {
      table.string('id').primary();
      table.string('hotel_id').references('id').inTable('hotels').onDelete('CASCADE');
      table.string('type');
      table.string('start_date');
      table.string('end_date');
      table.text('room_prices'); // JSON: { roomId: price }
    });

    // 4. Traslados
    await db.schema.dropTableIfExists('transfers');
    await db.schema.createTable('transfers', (table) => {
      table.string('id').primary();
      table.string('route').notNullable();
      table.string('operator').notNullable();
      table.decimal('net_cost').notNullable();
      table.decimal('sale_price').notNullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    // 5. Configuración
    await db.schema.dropTableIfExists('web_config');
    await db.schema.createTable('web_config', (table) => {
      table.string('key').primary();
      table.text('value').notNullable();
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });

    // 6. Cotizaciones
    await db.schema.dropTableIfExists('quotations');
    await db.schema.createTable('quotations', (table) => {
      table.increments('id').primary();
      table.string('folio').unique().notNullable();
      table.string('user_id').references('id').inTable('users');
      table.string('room_id').references('id').inTable('rooms');
      table.date('check_in').notNullable();
      table.date('check_out').notNullable();
      table.integer('pax').notNullable();
      table.decimal('total_amount').notNullable();
      table.string('status').defaultTo('NUEVA');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    // 7. Bitácora (Audit Trail)
    await db.schema.dropTableIfExists('audit_trail');
    await db.schema.createTable('audit_trail', (table) => {
      table.string('id').primary();
      table.string('user_id');
      table.string('action').notNullable();
      table.string('table_name').notNullable();
      table.string('record_id');
      table.text('old_data');
      table.text('new_data');
      table.timestamp('executed_at').defaultTo(db.fn.now());
    });

    // Seed Admin
    const passHash = await bcrypt.hash('admin123', 10);
    await db('users').insert({
      id: 'admin-id',
      email: 'admin',
      password_hash: passHash,
      full_name: 'Admin Local Test',
      role: 'LEVEL_1'
    });

    // Seed dummy hotels
    await db('hotels').insert([
      { id: 'h1', name: 'Hesperia Isla Margarita', location: 'Isla Margarita', description: 'Lujo y confort frente al mar.' },
      { id: 'h2', name: 'Sunsol Ecoland', location: 'Isla Margarita', description: 'Un paraíso natural para la familia.' }
    ]);

    await db('rooms').insert([
      { id: 'r1', hotel_id: 'h1', name: 'Habitación Sencilla', capacity: 2 },
      { id: 'r2', hotel_id: 'h2', name: 'Suite Familiar', capacity: 4 }
    ]);

    await db('seasons').insert([
      { 
        id: 's1', 
        hotel_id: 'h1', 
        type: 'Baja', 
        start_date: '2024-01-01', 
        end_date: '2024-12-31', 
        room_prices: JSON.stringify({ 'r1': 50 }) 
      }
    ]);

    // Seed initial config
    await db('web_config').insert([
      { key: 'primary_color', value: '#ea580c' },
      { key: 'site_name', value: 'Margarita Viajes' },
      { key: 'bannerImage', value: 'https://images.unsplash.com/photo-1540202404-b7111424a412?auto=format&fit=crop&q=80&w=2000&h=800' },
      { key: 'hotelesTitulo', value: 'HOTELES' },
      { key: 'hotelesSubtitulo', value: 'Descanso & Estilo' }
    ]);

    console.log('✅ Base de datos SQLite inicializada con éxito.');
  } catch (err) {
    console.error('❌ Error inicializando SQLite:', err);
  } finally {
    await db.destroy();
  }
}

main();
