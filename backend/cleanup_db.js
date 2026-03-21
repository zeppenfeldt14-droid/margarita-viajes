import knex from 'knex';
import config from './knexfile.ts';

const dbConfig = config.local;
const db = knex(dbConfig);

async function cleanup() {
  console.log('--- Database Cleanup Started ---');
  const tables = ['operations', 'reservations', 'quotations'];
  
  try {
    for (const table of tables) {
      const exists = await db.schema.hasTable(table);
      if (exists) {
        await db(table).del();
        console.log(`✔ ${table} cleared`);
        if (table === 'quotations') {
            await db.raw("DELETE FROM sqlite_sequence WHERE name = 'quotations'");
            console.log('✔ Quotations sequence reset');
        }
      } else {
        console.log(`ℹ ${table} does not exist locally, skipping.`);
      }
    }
    console.log('--- Cleanup Finished ---');

  } catch (err) {
    console.error('✘ Error during cleanup:', err.message);
  } finally {
    await db.destroy();
  }
}

cleanup();
