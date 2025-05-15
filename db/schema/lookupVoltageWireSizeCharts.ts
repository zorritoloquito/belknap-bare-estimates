import { pgTable, serial, numeric, integer, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Schema for 240V Voltage Wire Size Chart
export const voltageWireSizeChart240v = pgTable('voltage_wire_size_chart_240v', {
  id: serial('id').primaryKey(),
  motorHp: numeric('motor_hp', { precision: 5, scale: 1 }).notNull(), // Motor Horsepower (e.g., 5, 7.5)
  pumpSettingMinFt: integer('pump_setting_min_ft').notNull(),      // Minimum pump setting in feet for this wire size
  pumpSettingMaxFt: integer('pump_setting_max_ft').notNull(),      // Maximum pump setting in feet for this wire size
  wireSizeAwg: varchar('wire_size_awg', { length: 10 }).notNull(), // e.g., "#10", "1/0"
});

export const insertVoltageWireSizeChart240vSchema = createInsertSchema(voltageWireSizeChart240v);
export const selectVoltageWireSizeChart240vSchema = createSelectSchema(voltageWireSizeChart240v);

// Schema for 480V Voltage Wire Size Chart
export const voltageWireSizeChart480v = pgTable('voltage_wire_size_chart_480v', {
  id: serial('id').primaryKey(),
  motorHp: numeric('motor_hp', { precision: 5, scale: 1 }).notNull(), // Motor Horsepower (e.g., 5, 7.5)
  pumpSettingMinFt: integer('pump_setting_min_ft').notNull(),      // Minimum pump setting in feet for this wire size
  pumpSettingMaxFt: integer('pump_setting_max_ft').notNull(),      // Maximum pump setting in feet for this wire size
  wireSizeAwg: varchar('wire_size_awg', { length: 20 }).notNull(), // e.g., "#12", "250 MCM" (increased length for MCM)
});

export const insertVoltageWireSizeChart480vSchema = createInsertSchema(voltageWireSizeChart480v);
export const selectVoltageWireSizeChart480vSchema = createSelectSchema(voltageWireSizeChart480v); 