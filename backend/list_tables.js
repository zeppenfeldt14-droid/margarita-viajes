import knex from 'knex';
import config from './knexfile.ts';

const dbConfig = config.local;
const db = knex(dbConfig);

async function listTables() {
  try {
    const result = await db.raw("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in dev.sqlite3:');
    result.forEach(row => console.log(`- ${row.name}`));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await db.destroy();
  }
}

listTables();
