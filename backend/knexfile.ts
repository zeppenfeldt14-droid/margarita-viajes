import type * as KnexModule from "knex";
import dotenv from "dotenv";

dotenv.config();

const config: { [key: string]: KnexModule.Knex.Config } = {
  production: {
    client: "postgresql",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  }
};

export default config;
