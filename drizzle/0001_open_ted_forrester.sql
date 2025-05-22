ALTER TABLE "estimates" RENAME COLUMN "pwl_input_method" TO "pwl_determination_method";--> statement-breakpoint
ALTER TABLE "estimates" RENAME COLUMN "pwl_direct" TO "pwl_direct_input";--> statement-breakpoint
ALTER TABLE "estimates" RENAME COLUMN "voltage" TO "voltage_mapped";--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "sales_tax_rate_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "labor_discount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "material_discount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "estimate_line_items" ADD COLUMN "is_taxable" boolean DEFAULT true NOT NULL;