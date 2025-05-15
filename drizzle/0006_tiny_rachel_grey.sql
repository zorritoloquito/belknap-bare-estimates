ALTER TABLE "pump_selection_table" RENAME COLUMN "pump_description" TO "submersible_pump_description";--> statement-breakpoint
ALTER TABLE "pump_selection_table" ALTER COLUMN "gpm" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "pump_selection_table" ALTER COLUMN "tdh" SET DATA TYPE integer;