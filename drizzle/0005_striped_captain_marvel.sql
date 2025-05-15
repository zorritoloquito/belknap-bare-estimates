ALTER TABLE "wire_price_chart" RENAME COLUMN "wire_size_awg" TO "wire_size";--> statement-breakpoint
ALTER TABLE "wire_price_chart" RENAME COLUMN "price_per_foot" TO "our_cost_per_ft";--> statement-breakpoint
ALTER TABLE "wire_price_chart" DROP CONSTRAINT "wire_price_chart_wire_size_awg_unique";--> statement-breakpoint
ALTER TABLE "wire_price_chart" ADD COLUMN "sales_price_per_ft" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "wire_price_chart" ADD COLUMN "item_description" text;--> statement-breakpoint
ALTER TABLE "wire_price_chart" ADD CONSTRAINT "wire_price_chart_wire_size_unique" UNIQUE("wire_size");