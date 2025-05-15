import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// This table assumes that Supabase's auth.users table is the source of truth for authentication.
// We store the user ID from Supabase auth here.
// You can add other profile-specific fields if your application needs them
// beyond what Supabase auth.users and auth.user_metadata provide.
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // This ID should correspond to the Supabase auth.users.id
  email: text('email'), // Optionally store email here for quick access, though it's in auth.users
  fullName: text('full_name'),
  // Add any other profile fields you want to store locally
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// Note: Actual foreign key constraint to auth.users.id might be managed by Supabase's setup
// or you might add it manually via SQL if Drizzle doesn't directly support cross-schema FKs
// to Supabase's internal auth schema in a simple way.
// For Drizzle's perspective, other tables will reference this public.users.id. 