import { pgTable, serial, integer, text, decimal } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const pumpSelectionTable = pgTable('pump_selection_table', {
  id: serial('id').primaryKey(),
  gpmRangeStart: integer('gpm_range_start').notNull(),
  gpmRangeEnd: integer('gpm_range_end').notNull(),
  tdhRangeStart: integer('tdh_range_start').notNull(),
  tdhRangeEnd: integer('tdh_range_end').notNull(),
  pumpDescription: text('pump_description').notNull(),
  salesPrice: decimal('sales_price', { precision: 10, scale: 2 }).notNull().default('0.00'),
  // Optional: Could include model numbers, brand, or even costs/prices if specific to the GPM/TDH match
  // ourCost: numeric('our_cost', { precision: 10, scale: 2 }),
  // salesPrice: numeric('sales_price', { precision: 10, scale: 2 }),
});

export const insertPumpSelectionTableSchema = createInsertSchema(pumpSelectionTable);
export const selectPumpSelectionTableSchema = createSelectSchema(pumpSelectionTable);

export type PumpSelectionEntry = typeof pumpSelectionTable.$inferSelect; 