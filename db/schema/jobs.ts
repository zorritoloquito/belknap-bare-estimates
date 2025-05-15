import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { customers } from './customers'; // Jobs are associated with customers

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(), // Each job must belong to a customer
  nameLocation: text('name_location'), // As per plan: "Job Name/Location"
  // Add any other job-specific fields here
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Zod schemas for validation
export const insertJobSchema = createInsertSchema(jobs);
export const selectJobSchema = createSelectSchema(jobs);

// Later, you might define relations here if using Drizzle's relational queries extensively
// import { relations } from 'drizzle-orm';
// export const jobsRelations = relations(jobs, ({ one }) => ({
//   customer: one(customers, {
//     fields: [jobs.customerId],
//     references: [customers.id],
//   }),
// })); 