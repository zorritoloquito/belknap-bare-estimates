import { pgTable, serial, numeric, integer, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const submersibleMotorChart = pgTable('submersible_motor_chart', {
  id: serial('id').primaryKey(),
  hpRating: numeric('hp_rating', { precision: 5, scale: 1 }).notNull(), // Horsepower rating (e.g., 7.5, 10, 15.0)
  voltage: integer('voltage').notNull(), // e.g., 240 or 480
  ourCost: numeric('our_cost', { precision: 10, scale: 2 }), // Cost to the company
  salesPrice: numeric('sales_price', { precision: 10, scale: 2 }), // Price to customer
  itemDescription: text('item_description'), // Full description of the motor
  // Add other relevant fields like phase, model number, brand, etc. if needed
});

export const insertSubmersibleMotorChartSchema = createInsertSchema(submersibleMotorChart);
export const selectSubmersibleMotorChartSchema = createSelectSchema(submersibleMotorChart); 