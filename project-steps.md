# Implementation Plan

## Phase 0: Project Setup & Configuration
- [x] **Step 0.1: Environment Variable Setup**
  - **Task**: Create a `.env.local` file in the project root and add Supabase project URL and anon key. These will be used by Drizzle and Supabase client.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/.env.local`: Create this file.
  - **Step Dependencies**: None.
  - **User Instructions**:
    1.  Create a new Supabase project at [supabase.com](https://supabase.com).
    2.  Navigate to Project Settings > API.
    3.  Copy the Project URL and the `anon` public key.
    4.  Create a file named `.env.local` in the root of your project.
    5.  Add the following lines to `.env.local`, replacing `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual credentials:
        ```env
        NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        DATABASE_URL=YOUR_POSTGRES_CONNECTION_STRING_FROM_SUPABASE_SETTINGS_DATABASE
        # For email (Resend example - update if using another service)
        RESEND_API_KEY=YOUR_RESEND_API_KEY
        EMAIL_SENDER=your_default_sender@example.com
        ```
    6. Obtain your PostgreSQL connection string from Supabase (Project Settings > Database > Connection string > URI) and set it as `DATABASE_URL`. Ensure it's the one compatible with Drizzle/postgres.js.

- [x] **Step 0.2: Install Additional Dependencies**
  - **Task**: Install necessary libraries for forms, validation, Supabase auth, PDF generation, and email.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/package.json`: Update dependencies.
  - **Step Dependencies**: None.
  - **User Instructions**:
    Run the following command in your terminal:
    ```bash
    npm install zod react-hook-form @hookform/resolvers @supabase/supabase-js @supabase/ssr pdf-lib resend
    npm install -D @types/pdf-lib
    ```
    (shadcn/ui components will be added via `npx shadcn-ui@latest add ...` in later steps as needed.)

- [x] **Step 0.3: Update Supabase Client Initialization**
  - **Task**: Modify `db/db.ts` to correctly use `DATABASE_URL`. Create Supabase client utility files for client-side, server-side, and middleware usage.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/db/db.ts`: Update to correctly use `DATABASE_URL`.
    - `zorritoloquito-belknap-bare-estimates/lib/supabase/client.ts`: Create a client-side Supabase client.
    - `zorritoloquito-belknap-bare-estimates/lib/supabase/server.ts`: Create a server-side Supabase client (for Server Components and Route Handlers).
    - `zorritoloquito-belknap-bare-estimates/lib/supabase/middleware.ts`: Create Supabase middleware client.
  - **Step Dependencies**: Step 0.1.

## Phase 1: Database Schema (Drizzle ORM)

- [x] **Step 1.1: Define Core Drizzle Schemas (Users, Customers, Jobs, Estimates, Line Items)**
  - **Task**: Create Drizzle schema definitions for `users` (linking to Supabase auth), `customers`, `jobs`, `estimates`, and `estimate_line_items`. Define relations.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/db/schema/auth.ts`: Schema for users, linking to Supabase `auth.users`.
    - `zorritoloquito-belknap-bare-estimates/db/schema/customers.ts`: Schema for customers.
    - `zorritoloquito-belknap-bare-estimates/db/schema/jobs.ts`: Schema for jobs.
    - `zorritoloquito-belknap-bare-estimates/db/schema/estimates.ts`: Schema for estimates (linking to customers, jobs, users). Include fields for all inputs from Step 1 of the spec, plus generated values, status, estimate number, selected tax rate, and T&C inclusion flag.
    - `zorritoloquito-belknap-bare-estimates/db/schema/estimateLineItems.ts`: Schema for estimate line items (linking to estimates).
    - `zorritoloquito-belknap-bare-estimates/db/schema/index.ts`: Barrel file to export all schemas.
    - `zorritoloquito-belknap-bare-estimates/db/db.ts`: Update to import combined schema from `db/schema/index.ts`.
  - **Step Dependencies**: Step 0.1.

- [x] **Step 1.2: Define Drizzle Schemas for Lookup Tables**
  - **Task**: Create Drizzle schema definitions for `pipe_chart`, `submersible_motor_chart`, `voltage_wire_size_chart_240v`, `voltage_wire_size_chart_480v`, `wire_price_chart`, and `pump_selection_table`.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/db/schema/lookupPipeChart.ts`: Schema for Pipe Chart.
    - `zorritoloquito-belknap-bare-estimates/db/schema/lookupSubmersibleMotorChart.ts`: Schema for Submersible Motor Chart.
    - `zorritoloquito-belknap-bare-estimates/db/schema/lookupVoltageWireSizeCharts.ts`: Schemas for 240V and 480V Voltage Wire Size Charts.
    - `zorritoloquito-belknap-bare-estimates/db/schema/lookupWirePriceChart.ts`: Schema for Wire Price Chart.
    - `zorritoloquito-belknap-bare-estimates/db/schema/lookupPumpSelectionTable.ts`: Schema for Pump Selection Table.
    - `zorritoloquito-belknap-bare-estimates/db/schema/index.ts`: Update to export new lookup table schemas.
  - **Step Dependencies**: Step 1.1.

- [x] **Step 1.3: Generate and Apply Initial Database Migration**
  - **Task**: Use Drizzle Kit to generate SQL migration files based on the defined schemas and apply them to the Supabase database.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/drizzle.config.ts`: Create Drizzle Kit configuration file.
    - (Migration files will be generated by Drizzle Kit in a `drizzle` folder)
  - **Step Dependencies**: Step 1.2.
  - **User Instructions**:
    1.  Create `drizzle.config.ts` with content:
        ```typescript
        import type { Config } from 'drizzle-kit';
        import * as dotenv from 'dotenv';
        dotenv.config({ path: '.env.local' });

        export default {
          schema: './db/schema/index.ts',
          out: './drizzle',
          dialect: 'postgresql', // Or 'mysql2' or 'sqlite'
          dbCredentials: {
            url: process.env.DATABASE_URL!,
          },
        } satisfies Config;
        ```
    2.  Run `npm run db:generate` to create migration SQL files.
    3.  Review the generated SQL files.
    4.  Run `npm run db:migrate` to apply the migrations to your Supabase database.
    5.  **IMPORTANT**: After migration, manually populate the lookup tables (`pipe_chart`, `submersible_motor_chart`, `voltage_wire_size_chart_240v`, `voltage_wire_size_chart_480v`, `wire_price_chart`, `pump_selection_table`) in your Supabase database. You can do this via the Supabase Table Editor by importing CSVs or manually entering data.
    6.  **RLS Policies**: In the Supabase SQL editor, set up Row Level Security (RLS) policies for all new tables. Ensure authenticated users can only access/modify their own data, and that lookup tables are readable by authenticated users. Examples:
        ```sql
        -- For estimates table (example, adjust as needed, assuming user_id column exists)
        ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can manage their own estimates"
          ON estimates
          FOR ALL
          USING (auth.uid() = user_id) -- Ensure estimates table has a user_id column linked to auth.users.id
          WITH CHECK (auth.uid() = user_id);

        -- For estimate_line_items (assuming it has an estimate_id that links to an estimate owned by the user)
        ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can manage line items of their own estimates"
          ON estimate_line_items
          FOR ALL
          USING (
            (EXISTS ( SELECT 1
               FROM estimates
              WHERE ((estimates.id = estimate_line_items.estimate_id) AND (estimates.user_id = auth.uid()))))
          )
          WITH CHECK (
            (EXISTS ( SELECT 1
               FROM estimates
              WHERE ((estimates.id = estimate_line_items.estimate_id) AND (estimates.user_id = auth.uid()))))
          );


        -- For lookup tables (example, allow read for all authenticated users)
        ALTER TABLE pipe_chart ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Authenticated users can read pipe_chart" ON pipe_chart FOR SELECT USING (auth.role() = 'authenticated');
        -- Repeat for other lookup tables: submersible_motor_chart, etc.
        ```
    7. Create a PostgreSQL sequence for `estimate_number` in the `estimates` table. In Supabase SQL Editor:
        ```sql
        CREATE SEQUENCE public.estimate_number_seq START WITH 3701 INCREMENT BY 1;
        -- Then, when defining the estimates table schema or altering it:
        -- ALTER TABLE public.estimates ALTER COLUMN estimate_number SET DEFAULT nextval('public.estimate_number_seq');
        -- Ensure your Drizzle schema for estimates.estimate_number uses this default.
        ```

## Phase 2: Core Application Structure & UI Primitives

- [x] **Step 2.1: Update Main Layout and Add Company Header**
  - **Task**: Modify `app/layout.tsx` for proper application title and global styles. Create a `Header.tsx` component displaying the company logo and details extracted from the provided PDF sample.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/app/layout.tsx`: Update metadata, include `Header` component.
    - `zorritoloquito-belknap-bare-estimates/public/company-logo.png`: Placeholder for company logo.
    - `zorritoloquito-belknap-bare-estimates/components/layout/Header.tsx`: Create header with logo and company name.
    - `zorritoloquito-belknap-bare-estimates/lib/config.ts`: (New file) Store company details (Name, Address, Phone, Website from PDF).
  - **Step Dependencies**: None.
  - **User Instructions**:
    1.  Extract the logo from the upper left quadrant of the provided PDF sample (e.g., screenshot and crop).
    2.  Save the extracted logo as `public/company-logo.png`.
    3.  Populate `lib/config.ts` with:
        ```typescript
        export const companyDetails = {
          name: "SCOTT BELKNAP WELL DRILLING",
          addressLine1: "38193 Rd 76, Dinuba, CA 93618",
          phone: "(559) 591-Well (9355) Office",
          website: "www.sbwelldrilling.com",
          logoPath: "/company-logo.png",
          contractorsLicenseNo: "1007957",
          // Add other static company info if needed
        };
        ```

- [x] **Step 2.2: Define Core TypeScript Types and Constants**
  - **Task**: Create files for shared TypeScript types (form inputs, calculation outputs, line items) and application-wide constants (e.g., labor rates, tax rates, static PDF text).
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/lib/types.ts`: Define interfaces/types for `EstimateFormInputs`, `CalculatedEstimateValues`, `LineItem`, `Customer`, `Job`, `EstimateData`.
    - `zorritoloquito-belknap-bare-estimates/lib/constants.ts`: Define constants like `LABOR_PREP_JOB_RATE`, `LABOR_INSTALL_PUMP_RATE`, `LABOR_STARTUP_RATE`, `SOUNDING_TUBE_RATE`, `CONCRETE_PAD_RATE`, `DISCHARGE_BUNDLE_RATES`, `REDUCED_SALES_TAX_RATE` (2.75), `STANDARD_SALES_TAX_RATE` (7.75). Also add `PDF_TERMS_DEFAULT` ("Due on receipt"), `PDF_SALES_TAX_EXEMPTION_NOTE` (from page 2 of sample PDF).
  - **Step Dependencies**: Project Request.

- [x] **Step 2.3: Install shadcn/ui Base Components**
  - **Task**: Install commonly used shadcn/ui components: Button, Input, Label, RadioGroup, Select, Switch, Table, Card, Separator, Tooltip, Popover, Calendar, Alert, Dialog.
  - **Files**: None (shadcn/ui CLI modifies project files).
  - **Step Dependencies**: None.
  - **User Instructions**:
    Run the following commands:
    ```bash
    npx shadcn-ui@latest add button
    npx shadcn-ui@latest add input
    npx shadcn-ui@latest add label
    npx shadcn-ui@latest add radio-group
    npx shadcn-ui@latest add select
    npx shadcn-ui@latest add switch
    npx shadcn-ui@latest add table
    npx shadcn-ui@latest add card
    npx shadcn-ui@latest add separator
    npx shadcn-ui@latest add tooltip
    npx shadcn-ui@latest add popover
    npx shadcn-ui@latest add calendar
    npx shadcn-ui@latest add alert
    npx shadcn-ui@latest add dialog
    ```

- [x] **Step 2.4: Create DatePicker shadcn/ui Component**
  - **Task**: Implement a reusable DatePicker component using shadcn/ui's Popover and Calendar components.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/ui/date-picker.tsx`: Create the DatePicker component.
  - **Step Dependencies**: Step 2.3.

## Phase 3: Authentication

- [x] **Step 3.1: Setup Supabase Auth Middleware**
  - **Task**: Create and configure Next.js middleware to handle Supabase session refresh and protect routes.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/middleware.ts`: Create the middleware file using `@supabase/ssr`.
  - **Step Dependencies**: Step 0.3.

- [x] **Step 3.2: Create Login Page**
  - **Task**: Implement a login page using Supabase Auth email/password login.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/app/login/page.tsx`: Login form UI and logic.
    - `zorritoloquito-belknap-bare-estimates/app/auth/callback/route.ts`: Auth callback route handler for Supabase.
  - **Step Dependencies**: Step 3.1.
  - **User Instructions**:
    1.  In your Supabase project dashboard, go to Authentication > Providers and enable Email.
    2.  Go to Authentication > URL Configuration and set your Site URL (e.g., `http://localhost:3000` for local dev) and Additional Redirect URLs (e.g., `http://localhost:3000/auth/callback`).

- [x] **Step 3.3: Implement Logout Functionality and Protect Main Page**
  - **Task**: Add a logout button to the `Header.tsx`. Modify `app/page.tsx` to redirect to `/estimates/new` if authenticated, or `/login` if not. Create a placeholder for `/estimates/new`.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/layout/Header.tsx`: Add logout button and conditional display logic.
    - `zorritoloquito-belknap-bare-estimates/app/page.tsx`: Modify to handle redirection.
    - `zorritoloquito-belknap-bare-estimates/app/estimates/new/page.tsx`: Create a placeholder page for new estimates that requires authentication (will be built out in Phase 4).
  - **Step Dependencies**: Step 3.2, Step 2.1.

## Phase 4: Estimate Creation Form (Submersible Pump) - UI & Initial Logic

- [x] **Step 4.1: Setup Estimate Form Structure and State Management**
  - **Task**: Flesh out `app/estimates/new/page.tsx` to host the main estimate form. Create `EstimateForm.tsx`. Set up `react-hook-form` for managing form state and validation using Zod. Define the initial Zod schema for the estimate input form.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/app/estimates/new/page.tsx`: Main page component for creating a new estimate.
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: The core form component.
    - `zorritoloquito-belknap-bare-estimates/lib/schemas/estimateFormSchema.ts`: Zod schema for all input fields on the single page form.
    - `zorritoloquito-belknap-bare-estimates/lib/actions/estimateActions.ts`: Placeholder for server actions related to estimates.
  - **Step Dependencies**: Step 2.2, Step 2.3, Step 3.3.

- [x] **Step 4.2: Implement Customer & Job Information Fields**
  - **Task**: Add form fields for Customer Name, Customer Address (Street, City, State, Zip), Job Name/Location, Estimate Date (using `date-picker.tsx`), Estimate # (display only, system generated later), and Terms (editable, pre-filled with "Due on receipt").
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Add these fields using shadcn/ui Input, Label, DatePicker.
    - `zorritoloquito-belknap-bare-estimates/lib/schemas/estimateFormSchema.ts`: Update Zod schema with validation for these fields.
  - **Step Dependencies**: Step 2.4, Step 4.1, Step 2.2 (for default terms).

- [x] **Step 4.3: Implement Toggles for Sales Tax and Terms & Conditions**
  - **Task**: Add shadcn/ui Switch components for "Sales Tax Rate" (Reduced 2.75% / Standard 7.75%) and "Include Terms & Conditions on PDF" (Yes/No).
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Add Switch components.
    - `zorritoloquito-belknap-bare-estimates/lib/schemas/estimateFormSchema.ts`: Update Zod schema.
  - **Step Dependencies**: Step 4.2.

- [x] **Step 4.4: Implement GPM Input (1a)**
  - **Task**: Add GPM input field. Implement client-side logic for rounding to nearest higher multiple of 25 and validation (55-1500 post-rounding). Display real-time validation feedback.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Add GPM Input field and display rounded value.
    - `zorritoloquito-belknap-bare-estimates/lib/schemas/estimateFormSchema.ts`: Add Zod validation for GPM.
    - `zorritoloquito-belknap-bare-estimates/lib/utils.ts`: Add helper function for GPM rounding.
  - **Step Dependencies**: Step 4.1.

- [x] **Step 4.5: Implement Pump Setting (PS) Input (1b)**
  - **Task**: Add Pump Setting input field. Implement logic for rounding to the nearest integer and validation (positive integer).
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Add PS Input field.
    - `zorritoloquito-belknap-bare-estimates/lib/schemas/estimateFormSchema.ts`: Add Zod validation for PS.
  - **Step Dependencies**: Step 4.1.

- [x] **Step 4.6: Implement PWL Determination Toggle and "Input PWL directly" (1c)**
  - **Task**: Add a toggle (RadioGroup) for PWL input method. If "Input PWL directly" is selected, show PWL input field. Implement rounding and validation.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Add toggle and conditional PWL direct input field.
    - `zorritoloquito-belknap-bare-estimates/lib/schemas/estimateFormSchema.ts`: Update Zod schema for PWL method and direct PWL input.
  - **Step Dependencies**: Step 4.1.

- [x] **Step 4.7: Implement PWL "Calculate PWL from GPMt, PWLt, SWL" (1c)**
  - **Task**: If "Calculate PWL..." is selected, show fields for GPMt, PWLt, SWL. Implement client-side calculation logic for Y and PWL, including rounding. Implement validation for these inputs (positive, PWLt > SWL). The calculated PWL should update a field in the form state.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Add conditional fields and display calculated PWL.
    - `zorritoloquito-belknap-bare-estimates/lib/schemas/estimateFormSchema.ts`: Update Zod schema for GPMt, PWLt, SWL. Add refinement for PWLt > SWL.
  - **Step Dependencies**: Step 4.6, Step 4.4 (for GPM from 1a for calculation).

- [x] **Step 4.8: Implement PSI Input (1d)**
  - **Task**: Add PSI input field. Implement logic for rounding to the nearest integer and validation (zero or positive integer).
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Add PSI Input field.
    - `zorritoloquito-belknap-bare-estimates/lib/schemas/estimateFormSchema.ts`: Add Zod validation for PSI.
  - **Step Dependencies**: Step 4.1.

- [x] **Step 4.9: Implement Voltage Input (1e)**
  - **Task**: Add Voltage input field. Implement logic for mapping (220/230 to 240, 440/460 to 480) and validation (alert if input is not 220, 230, 240, 440, 460, or 480). Store the mapped value (240 or 480).
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Add Voltage Input field.
    - `zorritoloquito-belknap-bare-estimates/lib/schemas/estimateFormSchema.ts`: Add Zod validation for Voltage (for the raw input, and ensure mapped value is 240 or 480).
  - **Step Dependencies**: Step 4.1.

- [x] **Step 4.10: Implement Labor Hour Inputs (1f, 1g, 1h)**
  - **Task**: Add input fields for "Labor to prep job", "Labor to install pump", and "Labor to perform start up". Implement validation (non-negative number).
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Add these labor hour input fields.
    - `zorritoloquito-belknap-bare-estimates/lib/schemas/estimateFormSchema.ts`: Add Zod validation for labor hours.
  - **Step Dependencies**: Step 4.1.

- [x] **Step 4.11: Implement Discharge Package Input (1i)**
  - **Task**: Add Select component for "Discharge Package" (A, B, or C). Implement validation.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Add Discharge Package Select field.
    - `zorritoloquito-belknap-bare-estimates/lib/schemas/estimateFormSchema.ts`: Add Zod validation for Discharge Package.
  - **Step Dependencies**: Step 4.1.

## Phase 5: Calculation Engine (Server Actions / Utilities)

- [x] **Step 5.1: Implement TDH Calculation Logic (Step 2)**
  - **Task**: Create a server action that takes GPM (rounded, from 1a), PS (from 1b), PSI (from 1d), and PWL (from 1c) to calculate TDH. This involves:
    2a: Look up Pipe Size and Friction Loss (FL) from `pipe_chart` using rounded GPM.
    2b: Calculate TFL = FL * PS, round TFL.
    2c: Convert PSI to feet (PSI * 2.3), round. If PSI=0, pressure in feet=0.
    2d: Calculate TDH = PWL + TFL + Pressure in feet, round TDH to nearest higher multiple of 25.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/lib/actions/calculationActions.ts`: Add `calculateTdh` server action.
    - `zorritoloquito-belknap-bare-estimates/lib/utils.ts`: Add helper for rounding to higher multiple of 25.
  - **Step Dependencies**: Step 1.2 (schema for `pipe_chart`), All relevant Step 4.x inputs.
  - **User Instructions**: Ensure `pipe_chart` table is populated in Supabase.

- [x] **Step 5.2: Implement HP Calculation and Motor Match Logic (Step 3)**
  - **Task**: Create a server action:
    - 3a: Calculate HP = (GPM * TDH * 0.746) / (0.60 * 3960), round to one decimal. Validate HP (3.5-160).
    - 3b: Look up Submersible Motor (motor HP rating, our cost, sales price, item description) from `submersible_motor_chart` based on what range the calculated HP falls into.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/lib/actions/calculationActions.ts`: Add `calculateHpAndMatchMotor` server action.
  - **Step Dependencies**: Step 1.2 (schema for `submersible_motor_chart`), Step 5.1 (for TDH input).
  - **User Instructions**: Ensure `submersible_motor_chart` is populated.

- [x] **Step 5.3: Implement Wire Size Selection Logic (Step 4)**
  - **Task**: Create a server action:
    - Use Voltage (1e mapped), Pump Setting (1b), and selected Submersible Motor HP rating (3b) to look up Wire Size from the appropriate `voltage_wire_size_chart_240v` or `voltage_wire_size_chart_480v`.
    - Calculate Total Wire Length = PS (1b) + 20 feet.
    - Look up wire sales price per ft from `wire_price_chart` based on determined Wire Size.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/lib/actions/calculationActions.ts`: Add `selectWireSizeAndPrice` server action.
  - **Step Dependencies**: Step 1.2 (schemas for wire charts), Step 4.5, Step 4.9, Step 5.2 (for Motor HP rating).
  - **User Instructions**: Ensure voltage wire size charts and wire price chart are populated.

- [x] **Step 5.4: Implement Submersible Pump Selection Logic (Step 5)**
  - **Task**: Create a server action:
    - Use rounded GPM (1a) and rounded TDH (2d) to look up "Submersible pump description" from `pump_selection_table`.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/lib/actions/calculationActions.ts`: Add `selectSubmersiblePump` server action.
  - **Step Dependencies**: Step 1.2 (schema for `pump_selection_table`), Step 4.4, Step 5.1.
  - **User Instructions**: Ensure `pump_selection_table` is populated.

- [x] **Step 5.5: Integrate Calculations into Form Workflow**
  - **Task**: Add a "Calculate Details" button to `EstimateForm.tsx`. On click, this button will:
    1. Trigger form validation for Step 1 inputs.
    2. If valid, call the calculation server actions (Steps 5.1-5.4) sequentially using validated form data.
    3. Store the results (TDH, Motor details, Wire details, Pump description) in a client-side state (e.g., React state within `EstimateForm.tsx` or a context).
    4. Display key calculated values (e.g., Calculated TDH, Selected Motor HP, Wire Size) to the user.
    5. Automatically trigger Line Item generation (Phase 6) based on these results.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Add button, state for calculation results, display logic, and calls to server actions.
  - **Step Dependencies**: Steps 5.1-5.4, All relevant Step 4.x inputs.


## Phase 6: Line Item Generation and Management

- [x] **Step 6.1: Line Item Generation Logic (Step 6)**
  - **Task**: Create a client-side function that takes all validated form inputs (Phase 4) and calculation results (Phase 5 state) to generate the 11 default line items as specified. Each line item should have Description, Qty, Rate, and calculated Total. This function will be called after calculations in Step 5.5 complete. The generated line items should be managed using `react-hook-form`'s `useFieldArray`.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/lib/estimateUtils.ts`: Add `generateInitialLineItems` function. Use constants from `lib/constants.ts` and `lib/config.ts` for fixed rates and company details.
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Integrate `useFieldArray` for line items and call `generateInitialLineItems` to populate it.
    - `zorritoloquito-belknap-bare-estimates/lib/schemas/estimateFormSchema.ts`: Add schema for line items array.
  - **Step Dependencies**: Step 2.2, Step 5.5.

- [x] **Step 6.2: Display Line Items in Editable Table**
  - **Task**: Create `LineItemsTable.tsx` to display the line items (managed by `useFieldArray`) in a shadcn/ui Table. Description, Qty, and Rate fields for each line item must be editable. Total should auto-recalculate client-side on Qty/Rate change for that line.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/LineItemsTable.tsx`: New component for the table, using `useFieldArray` context.
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Integrate `LineItemsTable.tsx`.
  - **Step Dependencies**: Step 6.1.

- [x] **Step 6.3: Manual Line Item Addition and Removal**
  - **Task**: Implement functionality within `LineItemsTable.tsx` to:
    - Add a new blank line item to the table (using `append` from `useFieldArray`).
    - Remove any line item (using `remove` from `useFieldArray`).
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/LineItemsTable.tsx`: Add "Add Item" and "Remove" buttons and corresponding logic.
  - **Step Dependencies**: Step 6.2.

- [x] **Step 6.4: Implement Discount Line Items**
  - **Task**: Add input fields for "**Labor Discount" and "**Material Discount" in `EstimateForm.tsx`. If a value > 0 is entered, this should trigger adding/updating corresponding line items in the `useFieldArray` state with a negative Rate/Total. These should appear after other line items but before Subtotal calculations.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Add discount input fields and logic to update line items array.
    - `zorritoloquito-belknap-bare-estimates/lib/schemas/estimateFormSchema.ts`: Add fields for discounts.
  - **Step Dependencies**: Step 6.2.

- [x] **Step 6.5: Totals Calculation and Display**
  - **Task**: Implement client-side logic to calculate and display: Taxable Subtotal, Non-Taxable Subtotal, Subtotal (sum of all line item totals, including negative discounts), Sales Tax (based on selected rate and Taxable Subtotal), and Grand Total. These should update dynamically as line items or discounts change.
    - Material line items for Taxable Subtotal: Concrete Pad, Submersible Motor, Submersible Pump (if it has cost), Pipe, FJ Wire, Sounding Tube, Discharge Bundle.
    - Labor/Service line items for Non-Taxable Subtotal: Labor to Prep, Labor to Install, Ag Sub Pump Startup.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/TotalsDisplay.tsx`: New component to show all totals.
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Integrate `TotalsDisplay.tsx` and provide necessary data derived from line items array.
    - `zorritoloquito-belknap-bare-estimates/lib/estimateUtils.ts`: Add helper functions to categorize line items (e.g., based on description or a new 'type' field in LineItem) for taxable/non-taxable sums.
  - **Step Dependencies**: Step 6.2, Step 4.3 (for tax rate), Step 2.2 (for line item definitions).

## Phase 7: Estimate Data Persistence

- [x] **Step 7.1: Server Action to Save Estimate**
  - **Task**: Create a server action `saveEstimate` that accepts the complete validated estimate data from `react-hook-form`. This action will:
    1.  Use the next value from `estimate_number_seq` for the Estimate #.
    2.  Save customer and job information (create new for MVP).
    3.  Save the main estimate record to the `estimates` table (including all form inputs, calculated results used for generation, tax rate, T&C flag, user_id, status 'Draft').
    4.  Save all line items (including manual ones and discounts) to the `estimate_line_items` table, linked to the estimate.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/lib/actions/estimateActions.ts`: Implement `saveEstimate` server action.
  - **Step Dependencies**: Step 1.1, Step 1.3 (sequence), All form (Phase 4) and line item (Phase 6) logic.

- [x] **Step 7.2: Implement "Save Estimate" Button**
  - **Task**: Add a "Save Estimate" button to `EstimateForm.tsx`. On click, it should trigger `react-hook-form`'s `handleSubmit` which then calls the `saveEstimate` server action with the validated form data. Provide feedback (e.g., success/error message using shadcn/ui Alert or Toast if added).
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateForm.tsx`: Update form to call server action on submit.
  - **Step Dependencies**: Step 7.1.

## Phase 8: Output Generation (PDF & CSV)

- [x] **Step 8.1: PDF Generation - Structure and Basic Content**
  - **Task**: Create a server action `generateEstimatePdf` that takes an estimate ID. It will fetch the estimate data from the DB. Use `pdf-lib` to generate a PDF with:
    - Company Header (Logo from `public/company-logo.png`, Name, Address, etc. from `lib/config.ts`).
    - "Estimate" title, Date, Estimate # (from fetched data).
    - Customer Name/Address block.
    - Job Name/Location block.
    - P.O. No. (if added to schema/form), Terms (from estimate data).
    - Line items table (Description, Qty, Rate, Total).
    - Footer with Subtotal, Sales Tax (e.g., "Sales Tax (2.75%)" showing rate and amount), and Grand Total.
    - Signature lines, "Contractors State License Board #..." (from `lib/config.ts`), and "If Reduced Sales Tax Rate is shown..." note (from `lib/constants.ts` if applicable).
    - Page numbering (Page X of Y).
    The layout should aim to replicate the provided sample PDF.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/lib/actions/pdfActions.ts`: Create `generateEstimatePdf` server action.
    - `zorritoloquito-belknap-bare-estimates/assets/terms_and_conditions.md`: (or .txt) Placeholder for T&C text.
  - **Step Dependencies**: Step 7.1 (to have estimate data), `pdf-lib` installed, Step 2.1, Step 2.2.
  - **User Instructions**:
    1. Populate `assets/terms_and_conditions.md` with the full multi-page terms and conditions text, ideally from page 2 of the provided sample PDF. Format as markdown or plain text for easy parsing.
    2. The "pixel-perfect" replication of the sample PDF layout is a goal. This step will focus on structure and content. Fine-tuning might be needed in Step 10.2.

- [ ] **Step 8.2: Add "Download PDF" Button**
  - **Task**: Add a "Download PDF" button. This button will be active after an estimate is saved. It calls the `generateEstimatePdf` action (passing the saved estimate ID) and triggers a download of the returned PDF.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateActionsDisplay.tsx`: (New component) To show actions like Download PDF, Email, Approve, possibly shown after save or when viewing an estimate.
    - `zorritoloquito-belknap-bare-estimates/app/estimates/new/page.tsx` or `components/estimates/EstimateForm.tsx`: Integrate `EstimateActionsDisplay.tsx`.
  - **Step Dependencies**: Step 8.1, Step 7.2 (to have a saved estimate ID).

- [ ] **Step 8.3: Conditional Terms & Conditions in PDF**
  - **Task**: Modify `generateEstimatePdf` to append the static multi-page terms & conditions (from `assets/terms_and_conditions.md`) to the PDF if the "Include Terms & Conditions" flag for that estimate is true.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/lib/actions/pdfActions.ts`: Update PDF generation logic.
  - **Step Dependencies**: Step 8.1, Step 4.3.

- [ ] **Step 8.4: CSV Export Functionality**
  - **Task**: Create a server action `generateEstimateCsv` that takes an estimate ID, fetches data, and generates a CSV string. Include customer/job info, all form inputs, all line items (including discounts), subtotals, tax, and total. Add a "Download CSV" button to `EstimateActionsDisplay.tsx`.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/lib/actions/csvActions.ts`: Create `generateEstimateCsv` server action.
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateActionsDisplay.tsx`: Add CSV download button.
  - **Step Dependencies**: Step 7.1.

## Phase 9: Approval & Emailing

- [ ] **Step 9.1: Estimate Approval Mechanism**
  - **Task**: The `estimates` table schema already includes a `status` field (e.g., 'Draft', 'Approved', from Step 7.1, default to 'Draft'). Add an "Approve Estimate" button to `EstimateActionsDisplay.tsx` that calls a server action `approveEstimate(estimateId)` to update the estimate's status to "Approved".
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/lib/actions/estimateActions.ts`: Add/update `approveEstimate` server action.
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateActionsDisplay.tsx`: Add "Approve Estimate" button (visible if status is 'Draft').
  - **Step Dependencies**: Step 1.1 (status field in schema), Step 7.1.
  - **User Instructions**: If `status` field was not added in Step 1.1 or 7.1, ensure Drizzle schema for `estimates` is updated and migrations run.

- [ ] **Step 9.2: Email Estimate Functionality**
  - **Task**: Implement UI (e.g., in a shadcn/ui Dialog triggered from `EstimateActionsDisplay.tsx`) for entering recipient email(s), subject, and body (pre-fill with defaults). Create a server action `emailEstimate` that:
    1.  Takes estimate ID, recipient emails, subject, body.
    2.  Generates the PDF using `generateEstimatePdf`.
    3.  Sends an email with the PDF as an attachment using Resend.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EmailEstimateDialog.tsx`: New component for the email form.
    - `zorritoloquito-belknap-bare-estimates/components/estimates/EstimateActionsDisplay.tsx`: Add "Email Estimate" button (visible if status is 'Approved').
    - `zorritoloquito-belknap-bare-estimates/lib/actions/emailActions.ts`: Create `emailEstimate` server action.
  - **Step Dependencies**: Step 8.1 (PDF generation), Step 0.1 (for Resend API Key), Step 2.3 (Dialog).
  - **User Instructions**: Configure Resend (domain verification, API key in `.env.local`).

## Phase 10: Refinements and UI Polish

- [x] **Step 10.1: Estimate List/Dashboard (Basic)**
  - **Task**: Modify `app/page.tsx` (or create `/dashboard`) to list existing estimates for the logged-in user. Display key info (Estimate #, Customer, Date, Total, Status). Each item could link to `/estimates/[id]/view` (view page not in MVP scope, link can be disabled or go to a simple display).
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/app/page.tsx` (or `/dashboard/page.tsx`): Component to fetch and display estimates.
    - `zorritoloquito-belknap-bare-estimates/lib/actions/estimateActions.ts`: Add `getUserEstimates` server action.
  - **Step Dependencies**: Step 3.3, Step 7.1.

- [ ] **Step 10.2: Styling and Layout Improvements for PDF**
  - **Task**: Iteratively refine the PDF generation in `pdfActions.ts` to more closely match the provided sample PDF's layout, fonts (embed if necessary and licensed), and spacing. This involves careful coordinate placement, and table drawing with `pdf-lib`.
  - **Files**:
    - `zorritoloquito-belknap-bare-estimates/lib/actions/pdfActions.ts`: Refine PDF generation.
  - **Step Dependencies**: Step 8.1.
  - **User Instructions**: This step is highly dependent on the visual complexity of the sample PDF and may require significant trial and error. Refer to `pdf-lib` documentation for advanced features like font embedding and drawing functions.

- [ ] **Step 10.3: Final UI Review and Polish**
  - **Task**: Review all UI elements for consistency, usability, and adherence to shadcn/ui best practices. Ensure responsive design where appropriate. Check all form validations and user feedback messages thoroughly. Add company logo to the web UI header.
  - **Files**: Various component files across the application, `components/layout/Header.tsx`.
  - **Step Dependencies**: All preceding UI steps, Step 2.1.