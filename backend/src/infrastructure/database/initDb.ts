import { Knex } from 'knex';
import bcrypt from 'bcrypt';

export async function initDatabase(db: Knex) {
  const isProd = db.client.config.client === 'postgresql' || !!process.env.DATABASE_URL;
  console.log('[Database] Iniciando verificación de esquema...');

  // Tabla: audit_trail (Prioridad CRÍTICA para auditoría)
  if (!(await db.schema.hasTable('audit_trail'))) {
    await db.schema.createTable('audit_trail', (table: any) => {
      table.increments('id').primary();
      table.string('action');
      table.string('table_name');
      table.string('record_id');
      table.jsonb('old_data').nullable();
      table.jsonb('new_data').nullable();
      table.string('user_id').nullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[Database] Tabla "audit_trail" creada.');
  }

  // Tabla: web_config
  if (!(await db.schema.hasTable('web_config'))) {
    await db.schema.createTable('web_config', (table: any) => {
      table.string('key').primary();
      table.text('value');
    });
    console.log('[Database] Tabla "web_config" creada.');
  } else {
    // Saneamiento: Eliminar valores corruptos que causan invisibilidad en la web pública
    await db('web_config').where('value', '[object Object]').del();
    console.log('[Database] Saneamiento de "web_config" completado.');
  }

  // Tabla: users
  if (await db.schema.hasTable('users')) {
    const columnInfo: any = await db('users').columnInfo('id');
    const isInteger = columnInfo.type.includes('int') || columnInfo.type.includes('serial');
    if (isInteger) {
      console.log('[Database] Migrando tabla "users" a UUID...');
      await db.schema.dropTable('users');
    }
  }

  if (!(await db.schema.hasTable('users'))) {
    await db.schema.createTable('users', (table: any) => {
      table.uuid('id').primary().defaultTo(db.raw(isProd ? 'uuid_generate_v4()' : 'NULL')); // SQLite doesn't have uuid_generate_v4
      table.string('email').unique().notNullable();
      table.string('password_hash').notNullable();
      table.string('role').notNullable(); // LEVEL_1, LEVEL_2, LEVEL_3
      table.string('full_name').notNullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[Database] Tabla "users" creada con formato UUID.');

    // Seed admin user
    const hashedPass = await bcrypt.hash('admin123', 10);
    await db('users').insert({
      id: isProd ? undefined : '00000000-0000-0000-0000-000000000000', // Static UUID for admin in local
      email: 'margaritaviaje@gmail.com',
      password_hash: hashedPass,
      role: 'LEVEL_1',
      full_name: 'Administrador Margarita Viajes'
    });
    console.log('[Database] Usuario administrador inicial creado: margaritaviaje@gmail.com / admin123');
  }

  // Saneamiento de Inventario: Hotels, Rooms, Seasons (Deben ser UUID)
  const inventoryTables = ['hotels', 'rooms', 'seasons'];
  for (const t of inventoryTables) {
    if (await db.schema.hasTable(t)) {
      const info: any = await db(t).columnInfo('id');
      if (info.type.includes('int') || info.type.includes('serial')) {
        console.log(`[Database] Detectada tabla "${t}" con IDs enteros. Recreando para UUID...`);
        // Debemos soltar en orden inverso si hay FKs, o soltamos todos
        await db.schema.dropTableIfExists('seasons');
        await db.schema.dropTableIfExists('rooms');
        await db.schema.dropTableIfExists('hotels');
        break;
      }
    }
  }

  // Tabla: hotels
  if (!(await db.schema.hasTable('hotels'))) {
    await db.schema.createTable('hotels', (table: any) => {
      table.uuid('id').primary();
      table.string('name').notNullable();
      table.string('location');
      table.text('description');
      table.text('logo');
      table.text('photos'); // JSON string
      table.string('type').defaultTo('hotel');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[Database] Tabla "hotels" creada.');
  }

  // Tabla: rooms
  if (!(await db.schema.hasTable('rooms'))) {
    await db.schema.createTable('rooms', (table: any) => {
      table.uuid('id').primary();
      table.uuid('hotel_id').references('id').inTable('hotels').onDelete('CASCADE');
      table.string('name').notNullable();
      table.integer('capacity').notNullable();
    });
    console.log('[Database] Tabla "rooms" creada.');
  }

  // Tabla: seasons
  if (!(await db.schema.hasTable('seasons'))) {
    await db.schema.createTable('seasons', (table: any) => {
      table.uuid('id').primary();
      table.uuid('hotel_id').references('id').inTable('hotels').onDelete('CASCADE');
      table.string('type');
      table.string('start_date');
      table.string('end_date');
      table.text('room_prices'); // JSON string
    });
    console.log('[Database] Tabla "seasons" creada.');
  }

  // Tabla: transfers
  // Ajuste: Cambiado de increments a uuid para consistencia con el frontend y evitar fallas de tipado
  if (await db.schema.hasTable('transfers')) {
    const columnInfo: any = await db('transfers').columnInfo('id');
    const isInteger = columnInfo.type.includes('int') || columnInfo.type.includes('serial');
    if (isInteger) {
      console.log('[Database] Migrando tabla "transfers" a UUID para corregir error de tipos...');
      await db.schema.dropTable('transfers'); // Drop and recreate for schema alignment
    }
  }

  if (!(await db.schema.hasTable('transfers'))) {
    await db.schema.createTable('transfers', (table: any) => {
      table.uuid('id').primary();
      table.string('route');
      table.string('operator');
      table.decimal('net_cost');
      table.decimal('sale_price');
    });
    console.log('[Database] Tabla "transfers" creada con formato UUID.');
  }

  // Tabla: quotations
  if (!(await db.schema.hasTable('quotations'))) {
    await db.schema.createTable('quotations', (table: any) => {
      table.increments('id').primary();
      table.string('folio').unique();
      table.string('client_name');
      table.string('email');
      table.string('whatsapp');
      table.string('hotel_name');
      table.string('check_in');
      table.string('check_out');
      table.string('room_type');
      table.decimal('total_amount');
      table.string('status');
      table.string('pax');
      table.string('month');
      table.decimal('discount').defaultTo(0);
      table.decimal('discount_amount').defaultTo(0);
      table.decimal('final_amount').defaultTo(0);
      table.text('companions'); // JSON
      table.text('technical_sheet'); // JSON
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[Database] Tabla "quotations" creada.');
  }

  // Tabla: reservations
  if (!(await db.schema.hasTable('reservations'))) {
    await db.schema.createTable('reservations', (table: any) => {
      table.increments('id').primary();
      table.string('quote_id');
      table.string('client_name');
      table.string('email');
      table.string('whatsapp');
      table.uuid('hotel_id');
      table.string('hotel_name');
      table.string('hotel_email');
      table.string('check_in');
      table.string('check_out');
      table.string('room_type');
      table.string('pax');
      table.string('children');
      table.string('infants');
      table.decimal('total_amount');
      table.text('companions'); // JSON
      table.text('technical_sheet'); // JSON
      table.text('hotel_response_image');
      table.text('payment_proof_image');
      table.string('status');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[Database] Tabla "reservations" creada.');
  }

  // Tabla: operations
  if (!(await db.schema.hasTable('operations'))) {
    await db.schema.createTable('operations', (table: any) => {
      table.string('id').primary(); // V123...
      table.string('quote_id');
      table.string('client_name');
      table.string('email');
      table.string('whatsapp');
      table.uuid('hotel_id');
      table.string('hotel_name');
      table.string('hotel_email');
      table.string('check_in');
      table.string('check_out');
      table.string('room_type');
      table.string('pax');
      table.string('children');
      table.string('infants');
      table.decimal('total_amount');
      table.text('companions'); // JSON
      table.text('technical_sheet'); // JSON
      table.string('status');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[Database] Tabla "operations" creada.');
  }

  // Tabla: coupons
  if (!(await db.schema.hasTable('coupons'))) {
    await db.schema.createTable('coupons', (table: any) => {
      table.increments('id').primary();
      table.string('code').unique().notNullable();
      table.decimal('discount').notNullable();
      table.string('expiry').notNullable();
      table.boolean('active').defaultTo(true);
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[Database] Tabla "coupons" creada.');
  }


  console.log('[Database] Esquema verificado/creado con éxito.');
}
