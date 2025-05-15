import { pgTable, serial, numeric, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const wirePriceChart = pgTable('wire_price_chart', {
  id: serial('id').primaryKey(),
  wireSizeAwg: varchar('wire_size_awg', { length: 10 }).notNull().unique(), // e.g., "10", "8", "1/0" - should be unique
  pricePerFoot: numeric('price_per_foot', { precision: 10, scale: 2 }).notNull(), // Sales price per foot
  // You might also add 'our_cost_per_foot' if needed for margin calculations
});

export const insertWirePriceChartSchema = createInsertSchema(wirePriceChart);
export const selectWirePriceChartSchema = createSelectSchema(wirePriceChart); 