import { pgTable, serial, numeric, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const pipeChart = pgTable('pipe_chart', {
  id: serial('id').primaryKey(),
  gpm: numeric('gpm', { precision: 10, scale: 2 }).notNull(), // Gallons Per Minute
  pipeSizeInches: numeric('pipe_size_inches', { precision: 5, scale: 2 }).notNull(), // Nominal pipe size in inches
  frictionLossPer100ft: numeric('friction_loss_per_100ft', { precision: 10, scale: 2 }).notNull(), // Friction loss in feet per 100ft of pipe
  // You might add other relevant fields like pipe material if it affects friction loss
});

export const insertPipeChartSchema = createInsertSchema(pipeChart);
export const selectPipeChartSchema = createSelectSchema(pipeChart); 