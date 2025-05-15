import { pgTable, serial, numeric, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const submersibleMotorChart = pgTable('submersible_motor_chart', {
  id: serial('id').primaryKey(),
  hpMin: numeric('hp_min', { precision: 5, scale: 2 }), // Minimum HP of the applicable range from "Horsepower range"
  hpMax: numeric('hp_max', { precision: 5, scale: 2 }), // Maximum HP of the applicable range from "Horsepower range"
  hpRating: numeric('hp_rating', { precision: 5, scale: 1 }).notNull(), // Actual HP rating of the motor (e.g., 5, 7.5, 10.0) from "Submersible motor" column
  ourCost: numeric('our_cost', { precision: 10, scale: 2 }), // Cost to the company
  salesPrice: numeric('sales_price', { precision: 10, scale: 2 }), // Price to customer
  itemDescription: text('item_description'), // Full description of the motor
  // Add other relevant fields like phase, model number, brand, etc. if needed
});

export const insertSubmersibleMotorChartSchema = createInsertSchema(submersibleMotorChart);
export const selectSubmersibleMotorChartSchema = createSelectSchema(submersibleMotorChart); 