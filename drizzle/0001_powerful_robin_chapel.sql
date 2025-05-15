ALTER TABLE "pipe_chart" RENAME COLUMN "pipe_size_inches" TO "pipe_size";--> statement-breakpoint
ALTER TABLE "pipe_chart" RENAME COLUMN "gpm" TO "gpm_min";--> statement-breakpoint
ALTER TABLE "pipe_chart" RENAME COLUMN "friction_loss_per_100ft" TO "friction_loss_per_ft";--> statement-breakpoint
ALTER TABLE "pipe_chart" ADD COLUMN "gpm_max" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pipe_chart" ADD COLUMN "our_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "pipe_chart" ADD COLUMN "sales_price" numeric(10, 2);