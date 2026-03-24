import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkOperations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- ÚLTIMAS 5 OPERACIONES ---');
    const res = await client.query('SELECT id, quote_id, client_name, created_at FROM operations ORDER BY created_at DESC LIMIT 5');
    console.table(res.rows);
    
    if (res.rows.length > 0) {
      console.log('Detalle de la primera fila:', JSON.stringify(res.rows[0], null, 2));
    } else {
      console.log('No hay operaciones en la tabla.');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkOperations();
