import knex from 'knex';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const dbConfig = {
  client: 'postgresql',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }
};

const db = knex(dbConfig);

async function diagnose() {
  try {
    console.log('--- Database Diagnosis ---');
    await db.raw('SELECT 1');
    console.log('✅ Connection successful');

    const hasUsers = await db.schema.hasTable('users');
    console.log(`Table "users" exists: ${hasUsers}`);

    if (hasUsers) {
      const columns = await db('users').columnInfo();
      console.log('Columns in "users":', Object.keys(columns));

      const users = await db('users').select('id', 'email', 'full_name', 'role');
      console.log(`Total users: ${users.length}`);
      console.log('Users list:', JSON.stringify(users, null, 2));
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await db.destroy();
  }
}

diagnose();
