import { pgTable, serial, integer, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const pumpSelectionTable = pgTable('pump_selection_table', {
  id: serial('id').primaryKey(),
  gpm: integer('gpm').notNull(),
  tdh: integer('tdh').notNull(),
  submersiblePumpDescription: text('submersible_pump_description').notNull(),
  // Optional: Could include model numbers, brand, or even costs/prices if specific to the GPM/TDH match
  // ourCost: numeric('our_cost', { precision: 10, scale: 2 }),
  // salesPrice: numeric('sales_price', { precision: 10, scale: 2 }),
});

export const insertPumpSelectionTableSchema = createInsertSchema(pumpSelectionTable);
export const selectPumpSelectionTableSchema = createSelectSchema(pumpSelectionTable); 