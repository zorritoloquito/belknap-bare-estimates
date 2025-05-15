import { pgTable, serial, numeric, integer, text, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Schema for 240V Voltage Wire Size Chart
export const voltageWireSizeChart240v = pgTable('voltage_wire_size_chart_240v', {
  id: serial('id').primaryKey(),
  motorHp: numeric('motor_hp', { precision: 5, scale: 1 }).notNull(), // Motor Horsepower
  // The original spec often has wire sizes for various distances (e.g. 0-50ft, 51-100ft etc.)
  // For simplicity here, using max_distance. This might need to be more granular.
  maxDistanceFeet: integer('max_distance_feet').notNull(), 
  wireSizeAwg: varchar('wire_size_awg', { length: 10 }).notNull(), // e.g., "10", "8", "1/0"
});

export const insertVoltageWireSizeChart240vSchema = createInsertSchema(voltageWireSizeChart240v);
export const selectVoltageWireSizeChart240vSchema = createSelectSchema(voltageWireSizeChart240v);

// Schema for 480V Voltage Wire Size Chart
export const voltageWireSizeChart480v = pgTable('voltage_wire_size_chart_480v', {
  id: serial('id').primaryKey(),
  motorHp: numeric('motor_hp', { precision: 5, scale: 1 }).notNull(), // Motor Horsepower
  maxDistanceFeet: integer('max_distance_feet').notNull(),
  wireSizeAwg: varchar('wire_size_awg', { length: 10 }).notNull(), // e.g., "12", "10", "8"
});

export const insertVoltageWireSizeChart480vSchema = createInsertSchema(voltageWireSizeChart480v);
export const selectVoltageWireSizeChart480vSchema = createSelectSchema(voltageWireSizeChart480v); 