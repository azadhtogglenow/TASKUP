/// <reference types="node" />
import 'dotenv/config'; 
import type { Config } from 'drizzle-kit';


const dbUrl = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

export default {
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
} satisfies Config;