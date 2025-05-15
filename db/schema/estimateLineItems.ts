import { pgTable, serial, integer, text, numeric, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { estimates } from './estimates'; // Line items belong to an estimate

export const estimateLineItems = pgTable('estimate_line_items', {
  id: serial('id').primaryKey(),
  estimateId: integer('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }).notNull(),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(), // Assuming quantity can be decimal (e.g., 0.5 hours)
  rate: numeric('rate', { precision: 10, scale: 2 }).notNull(), // Price per unit
  // Total can be calculated (quantity * rate) or stored. Storing might be simpler for querying.
  // If calculated, ensure consistency. For now, let's assume it's stored, calculated before insert/update.
  total: numeric('total', { precision: 10, scale: 2 }).notNull(), 
  
  // Optional: to help categorize for taxable/non-taxable sums (as per Step 6.5)
  itemType: varchar('item_type', { length: 50 }), // e.g., 'Material', 'Labor', 'Discount'

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Zod schemas for validation
export const insertEstimateLineItemSchema = createInsertSchema(estimateLineItems);
export const selectEstimateLineItemSchema = createSelectSchema(estimateLineItems);

// Example of how relations might be defined later:
// import { relations } from 'drizzle-orm';
// export const estimateLineItemsRelations = relations(estimateLineItems, ({ one }) => ({
//   estimate: one(estimates, {
//     fields: [estimateLineItems.estimateId],
//     references: [estimates.id],
//   }),
// })); 