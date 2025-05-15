import { pgTable, serial, numeric, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const pumpSelectionTable = pgTable('pump_selection_table', {
  id: serial('id').primaryKey(),
  gpm: numeric('gpm', { precision: 10, scale: 2 }).notNull(), // Gallons Per Minute
  tdh: numeric('tdh', { precision: 10, scale: 2 }).notNull(), // Total Dynamic Head
  pumpDescription: text('pump_description').notNull(), // Description of the selected pump
  // Optional: Could include model numbers, brand, or even costs/prices if specific to the GPM/TDH match
  // ourCost: numeric('our_cost', { precision: 10, scale: 2 }),
  // salesPrice: numeric('sales_price', { precision: 10, scale: 2 }),
});

export const insertPumpSelectionTableSchema = createInsertSchema(pumpSelectionTable);
export const selectPumpSelectionTableSchema = createSelectSchema(pumpSelectionTable); 