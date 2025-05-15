import { pgTable, serial, numeric, varchar, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const wirePriceChart = pgTable('wire_price_chart', {
  id: serial('id').primaryKey(),
  wireSize: varchar('wire_size', { length: 10 }).notNull().unique(), // e.g., "14", "12", "10", "2"
  ourCostPerFt: numeric('our_cost_per_ft', { precision: 10, scale: 2 }).notNull(),
  salesPricePerFt: numeric('sales_price_per_ft', { precision: 10, scale: 2 }).notNull(),
  itemDescription: text('item_description'),
});

export const insertWirePriceChartSchema = createInsertSchema(wirePriceChart);
export const selectWirePriceChartSchema = createSelectSchema(wirePriceChart); 