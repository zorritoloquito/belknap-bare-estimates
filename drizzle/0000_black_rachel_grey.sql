CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"full_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"address_street" text,
	"address_city" text,
	"address_state" varchar(50),
	"address_zip" varchar(20),
	"phone" varchar(50),
	"email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"name_location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimates" (
	"id" serial PRIMARY KEY NOT NULL,
	"estimate_number" integer,
	"customer_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"user_id" uuid,
	"estimate_date" date DEFAULT now() NOT NULL,
	"terms" text DEFAULT 'Due on receipt',
	"gpm" numeric,
	"pump_setting" integer,
	"pwl_input_method" text,
	"pwl_direct" numeric,
	"gpmt" numeric,
	"pwlt" numeric,
	"swl" numeric,
	"psi" integer,
	"voltage" integer,
	"labor_prep_job_hours" numeric,
	"labor_install_pump_hours" numeric,
	"labor_startup_hours" numeric,
	"discharge_package" varchar(1),
	"calculated_tdh" numeric,
	"calculated_hp" numeric,
	"selected_motor_hp" numeric,
	"selected_wire_size" text,
	"selected_pump_description" text,
	"sales_tax_rate_percentage" numeric(5, 2) NOT NULL,
	"include_terms_and_conditions" boolean DEFAULT true NOT NULL,
	"status" varchar(50) DEFAULT 'Draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "estimates_estimate_number_unique" UNIQUE("estimate_number")
);
--> statement-breakpoint
CREATE TABLE "estimate_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"estimate_id" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"rate" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"item_type" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipe_chart" (
	"id" serial PRIMARY KEY NOT NULL,
	"gpm" numeric(10, 2) NOT NULL,
	"pipe_size_inches" numeric(5, 2) NOT NULL,
	"friction_loss_per_100ft" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submersible_motor_chart" (
	"id" serial PRIMARY KEY NOT NULL,
	"hp_rating" numeric(5, 1) NOT NULL,
	"voltage" integer NOT NULL,
	"our_cost" numeric(10, 2),
	"sales_price" numeric(10, 2),
	"item_description" text
);
--> statement-breakpoint
CREATE TABLE "voltage_wire_size_chart_240v" (
	"id" serial PRIMARY KEY NOT NULL,
	"motor_hp" numeric(5, 1) NOT NULL,
	"max_distance_feet" integer NOT NULL,
	"wire_size_awg" varchar(10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voltage_wire_size_chart_480v" (
	"id" serial PRIMARY KEY NOT NULL,
	"motor_hp" numeric(5, 1) NOT NULL,
	"max_distance_feet" integer NOT NULL,
	"wire_size_awg" varchar(10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wire_price_chart" (
	"id" serial PRIMARY KEY NOT NULL,
	"wire_size_awg" varchar(10) NOT NULL,
	"price_per_foot" numeric(10, 2) NOT NULL,
	CONSTRAINT "wire_price_chart_wire_size_awg_unique" UNIQUE("wire_size_awg")
);
--> statement-breakpoint
CREATE TABLE "pump_selection_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"gpm" numeric(10, 2) NOT NULL,
	"tdh" numeric(10, 2) NOT NULL,
	"pump_description" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_line_items" ADD CONSTRAINT "estimate_line_items_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;