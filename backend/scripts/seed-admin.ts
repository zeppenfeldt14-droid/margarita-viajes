import knex from 'knex';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

console.log(`Conectando a DB: ${process.env.DB_NAME} en ${process.env.DB_HOST}:${process.env.DB_PORT || 5432} con usuario ${process.env.DB_USER}`);

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'margarita_viajes',
  },
});

async function main() {
  try {
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    // Check if table exists
    const hasTable = await db.schema.hasTable('users');
    if (!hasTable) {
        console.log("Table 'users' does not exist. Please run init.sql first.");
        process.exit(1);
    }

    const user = await db('users').where('email', 'admin').first();
    if (!user) {
      await db('users').insert({
        email: 'admin',
        password_hash: passwordHash,
        full_name: 'Administrador Sistema',
        role: 'LEVEL_1'
      });
      console.log('✅ Usuario admin creado con éxito.');
    } else {
      console.log('ℹ️ El usuario admin ya existe.');
      // Update password just in case
      await db('users').where('email', 'admin').update({
        password_hash: passwordHash,
        role: 'LEVEL_1'
      });
      console.log('✅ Password de admin actualizado.');
    }
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await db.destroy();
  }
}

main();
