import knex from 'knex';
type Knex = any;
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

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
      table.uuid('id').primary(); 
      table.string('email').unique().notNullable();
      table.string('alias').unique().nullable();
      table.string('password_hash').notNullable();
      table.string('role').notNullable();
      table.string('full_name').notNullable();
      table.integer('daily_quota').defaultTo(20);
      table.boolean('active').defaultTo(true);
      table.integer('level').defaultTo(3);
      table.text('photo').nullable();
      table.boolean('in_roulette').defaultTo(true);
      table.text('modules').nullable(); // JSON string
      table.text('connection_logs').nullable(); // JSON string
      table.text('action_logs').nullable(); // JSON string
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[Database] Tabla "users" creada con formato extendido.');
  } else {
    // Verificar y agregar columnas faltantes
    const hasAlias = await db.schema.hasColumn('users', 'alias');
    const hasDailyQuota = await db.schema.hasColumn('users', 'daily_quota');
    const hasActive = await db.schema.hasColumn('users', 'active');
    const hasLevel = await db.schema.hasColumn('users', 'level');
    const hasPhoto = await db.schema.hasColumn('users', 'photo');
    const hasInRoulette = await db.schema.hasColumn('users', 'in_roulette');
    const hasModules = await db.schema.hasColumn('users', 'modules');
    const hasConnLogs = await db.schema.hasColumn('users', 'connection_logs');
    const hasActionLogs = await db.schema.hasColumn('users', 'action_logs');

    await db.schema.alterTable('users', (table: any) => {
      if (!hasAlias) table.string('alias').unique().nullable();
      if (!hasDailyQuota) table.integer('daily_quota').defaultTo(20);
      if (!hasActive) table.boolean('active').defaultTo(true);
      if (!hasLevel) table.integer('level').defaultTo(3);
      if (!hasPhoto) table.text('photo').nullable();
      if (!hasInRoulette) table.boolean('in_roulette').defaultTo(true);
      if (!hasModules) table.text('modules').nullable();
      if (!hasConnLogs) table.text('connection_logs').nullable();
      if (!hasActionLogs) table.text('action_logs').nullable();
    });
    console.log('[Database] Verificación de columnas en "users" completada.');
  }

  // Seed admin user if none exist (Robust check)
  const usersToSeed = [
    {
      email: 'margaritaviaje@gmail.com',
      full_name: 'Administrador Margarita Viaje',
      role: 'LEVEL_1'
    },
    {
      email: 'margaritaviajes@gmail.com',
      full_name: 'Administrador Margarita Viajes',
      role: 'LEVEL_1'
    }
  ];

  const hashedPass = await bcrypt.hash('admin123', 10);
  
  for (const userData of usersToSeed) {
    const existing = await db('users').where('email', userData.email).first();
    if (!existing) {
      await db('users').insert({
        id: uuidv4(),
        email: userData.email,
        password_hash: hashedPass,
        role: userData.role,
        full_name: userData.full_name
      });
      console.log(`[Database] Usuario ${userData.email} creado.`);
    }
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
      table.string('email');
      table.string('plan');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[Database] Tabla "hotels" creada.');
  } else {
    // Verificar y agregar columnas faltantes
    const hasEmail = await db.schema.hasColumn('hotels', 'email');
    const hasPlan = await db.schema.hasColumn('hotels', 'plan');

    await db.schema.alterTable('hotels', (table: any) => {
      if (!hasEmail) table.string('email').nullable();
      if (!hasPlan) table.string('plan').nullable();
    });
    console.log('[Database] Verificación de columnas en "hotels" completada.');
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
      table.string('email').nullable();
      table.string('whatsapp').nullable();
      table.decimal('net_cost');
      table.decimal('sale_price');
    });
    console.log('[Database] Tabla "transfers" creada con formato UUID.');
  } else {
    // Verificar y agregar columnas faltantes
    const hasEmail = await db.schema.hasColumn('transfers', 'email');
    const hasWhatsapp = await db.schema.hasColumn('transfers', 'whatsapp');

    await db.schema.alterTable('transfers', (table: any) => {
      if (!hasEmail) table.string('email').nullable();
      if (!hasWhatsapp) table.string('whatsapp').nullable();
    });
    console.log('[Database] Verificación de columnas en "transfers" completada.');
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
      table.uuid('hotel_id').nullable();
      table.string('check_in');
      table.string('check_out');
      table.string('room_type');
      table.decimal('total_amount');
      table.string('status');
      table.string('pax');
      table.string('children').nullable();
      table.string('infants').nullable();
      table.string('month');
      table.decimal('discount').defaultTo(0);
      table.decimal('discount_amount').defaultTo(0);
      table.decimal('final_amount').defaultTo(0);
      table.text('pdf_base64').nullable();
      table.string('assigned_to').nullable();
      table.text('companions'); // JSON
      table.text('technical_sheet'); // JSON
      table.string('plan').nullable();
      table.string('original_quote_id').nullable();
      table.string('previous_id').nullable();
      table.boolean('include_transfer').defaultTo(false);
      table.string('transfer_id').nullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[Database] Tabla "quotations" creada.');
  } else {
    // Verificar y agregar columnas faltantes
    const hasOriginal = await db.schema.hasColumn('quotations', 'original_quote_id');
    const hasPrevious = await db.schema.hasColumn('quotations', 'previous_id');
    const hasPlan = await db.schema.hasColumn('quotations', 'plan');
    const hasSeason = await db.schema.hasColumn('quotations', 'season');

    await db.schema.alterTable('quotations', (table: any) => {
      if (!hasOriginal) table.string('original_quote_id').nullable();
      if (!hasPrevious) table.string('previous_id').nullable();
      if (!hasPlan) table.string('plan').nullable();
      if (!hasSeason) table.string('season').nullable();
    });
    const hasHotelId = await db.schema.hasColumn('quotations', 'hotel_id');
    const hasChildren = await db.schema.hasColumn('quotations', 'children');
    const hasInfants = await db.schema.hasColumn('quotations', 'infants');
    const hasPdfBase64 = await db.schema.hasColumn('quotations', 'pdf_base64');
    const hasAssignedTo = await db.schema.hasColumn('quotations', 'assigned_to');
    const hasIncTransfer = await db.schema.hasColumn('quotations', 'include_transfer');
    const hasTransfId = await db.schema.hasColumn('quotations', 'transfer_id');

    await db.schema.alterTable('quotations', (table: any) => {
      if (!hasHotelId) table.uuid('hotel_id').nullable();
      if (!hasChildren) table.string('children').nullable();
      if (!hasInfants) table.string('infants').nullable();
      if (!hasPdfBase64) table.text('pdf_base64').nullable();
      if (!hasAssignedTo) table.string('assigned_to').nullable();
      if (!hasIncTransfer) table.boolean('include_transfer').defaultTo(false);
      if (!hasTransfId) table.string('transfer_id').nullable();
    });
    console.log('[Database] Verificación de columnas en "quotations" completada.');
  }

  // Tabla: reservations
  if (await db.schema.hasTable('reservations')) {
    const columnInfo: any = await db('reservations').columnInfo('id');
    const isInteger = columnInfo.type.includes('int') || columnInfo.type.includes('serial');
    if (isInteger) {
      console.log('[Database] Migrando tabla "reservations" a String ID para folios R00...');
      await db.schema.dropTable('reservations');
    }
  }

  if (!(await db.schema.hasTable('reservations'))) {
    await db.schema.createTable('reservations', (table: any) => {
      table.string('id').primary(); // Cambio a string para folios R00...
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
      table.string('original_quote_id').nullable();
      table.string('previous_id').nullable();
      table.string('plan').nullable();
      table.string('status');
      table.boolean('include_transfer').defaultTo(false);
      table.string('transfer_id').nullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[Database] Tabla "reservations" creada.');
  } else {
      const hasOriginal = await db.schema.hasColumn('reservations', 'original_quote_id');
      const hasPrevious = await db.schema.hasColumn('reservations', 'previous_id');
      const hasPlan = await db.schema.hasColumn('reservations', 'plan');

      const hasIncTransferRes = await db.schema.hasColumn('reservations', 'include_transfer');
      const hasTransfIdRes = await db.schema.hasColumn('reservations', 'transfer_id');

      await db.schema.alterTable('reservations', (table: any) => {
        if (!hasOriginal) table.string('original_quote_id').nullable();
        if (!hasPrevious) table.string('previous_id').nullable();
        if (!hasPlan) table.string('plan').nullable();
        if (!hasIncTransferRes) table.boolean('include_transfer').defaultTo(false);
        if (!hasTransfIdRes) table.string('transfer_id').nullable();
      });
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
      table.text('hotel_response_image').nullable();
      table.text('payment_proof_image').nullable();
      table.string('status');
      table.boolean('include_transfer').defaultTo(false);
      table.string('transfer_id').nullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[Database] Tabla "operations" creada.');
  } else {
    // Verificar y agregar columnas faltantes
    const hasHotelResponse = await db.schema.hasColumn('operations', 'hotel_response_image');
    const hasPaymentProof = await db.schema.hasColumn('operations', 'payment_proof_image');
    const hasOriginal = await db.schema.hasColumn('operations', 'original_quote_id');
    const hasPrevious = await db.schema.hasColumn('operations', 'previous_id');
    const hasPlan = await db.schema.hasColumn('operations', 'plan');
    const hasIncTransferOp = await db.schema.hasColumn('operations', 'include_transfer');
    const hasTransfIdOp = await db.schema.hasColumn('operations', 'transfer_id');
    
    await db.schema.alterTable('operations', (table: any) => {
      if (!hasHotelResponse) table.text('hotel_response_image').nullable();
      if (!hasPaymentProof) table.text('payment_proof_image').nullable();
      if (!hasOriginal) table.string('original_quote_id').nullable();
      if (!hasPrevious) table.string('previous_id').nullable();
      if (!hasPlan) table.string('plan').nullable();
      if (!hasIncTransferOp) table.boolean('include_transfer').defaultTo(false);
      if (!hasTransfIdOp) table.string('transfer_id').nullable();
    });
    console.log('[Database] Verificación de columnas en "operations" completada.');
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

  // Tabla: logs (Bitácora de actividad)
  if (!(await db.schema.hasTable('logs'))) {
    await db.schema.createTable('logs', (table: any) => {
      table.increments('id').primary();
      table.string('user_id').nullable();
      table.string('user_name').nullable();
      table.string('action_type').notNullable(); // LOGIN, UPDATE_QUOTE, etc.
      table.text('details').nullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[Database] Tabla "logs" creada.');
  }

  console.log('[Database] Esquema verificado/creado con éxito.');
}
