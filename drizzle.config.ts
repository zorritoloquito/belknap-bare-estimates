import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local at the project root
dotenv.config({ path: './.env.local' }); // Adjusted path to be explicit

export default {
  schema: './db/schema/index.ts', // Path to your Drizzle schema entry point
  out: './drizzle', // Directory where migration files will be generated
  dialect: 'postgresql', // Specify PostgreSQL dialect
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Ensures that Drizzle Kit uses the 'public' schema by default unless specified otherwise in table definitions
  // schemaFilter: ['public'], // Usually not needed if tables are in 'public' by default
} satisfies Config; 