import { pgTable, serial, numeric, text, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const pipeChart = pgTable('pipe_chart', {
  id: serial('id').primaryKey(),
  pipeSize: text('pipe_size').notNull(),                     // e.g., "2\"", "2.5\"", "3\""
  gpmMin: integer('gpm_min').notNull(),                     // Minimum GPM for the range (e.g., 55 from "55-70")
  gpmMax: integer('gpm_max').notNull(),                     // Maximum GPM for the range (e.g., 70 from "55-70")
  frictionLossPerFt: numeric('friction_loss_per_ft', { precision: 10, scale: 4 }).notNull(), // Friction loss per foot (e.g., 0.01, 0.075, 0.0175)
  ourCost: numeric('our_cost', { precision: 10, scale: 2 }),     // e.g., 0.00, 5.54. Nullable if some rows have no cost.
  salesPrice: numeric('sales_price', { precision: 10, scale: 2 }), // e.g., 0.00, 11.08. Nullable if some rows have no sales price.
});

export const insertPipeChartSchema = createInsertSchema(pipeChart);
export const selectPipeChartSchema = createSelectSchema(pipeChart); 