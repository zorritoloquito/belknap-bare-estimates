ALTER TABLE "voltage_wire_size_chart_240v" RENAME COLUMN "max_distance_feet" TO "pump_setting_min_ft";--> statement-breakpoint
ALTER TABLE "voltage_wire_size_chart_480v" RENAME COLUMN "max_distance_feet" TO "pump_setting_min_ft";--> statement-breakpoint
ALTER TABLE "voltage_wire_size_chart_480v" ALTER COLUMN "wire_size_awg" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "voltage_wire_size_chart_240v" ADD COLUMN "pump_setting_max_ft" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "voltage_wire_size_chart_480v" ADD COLUMN "pump_setting_max_ft" integer NOT NULL;