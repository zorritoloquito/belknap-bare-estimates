export const LABOR_PREP_JOB_RATE_PER_HOUR = 175.00;
export const LABOR_INSTALL_PUMP_RATE_PER_HOUR = 395.00;
export const LABOR_AG_PUMP_STARTUP_RATE_PER_HOUR = 175.00;

export const CONCRETE_PAD_RATE = 900.00;
export const SOUNDING_TUBE_RATE_PER_FOOT = 1.00;

export const DISCHARGE_BUNDLE_RATES = {
  A: 1700.00,
  B: 1450.00,
  C: 700.00,
} as const;

export const REDUCED_SALES_TAX_RATE = 0.0275; // 2.75%
export const STANDARD_SALES_TAX_RATE = 0.0775; // 7.75%

export const PDF_TERMS_DEFAULT = "Due on receipt";

// Sales tax exemption note from the actual company estimate
export const PDF_REDUCED_SALES_TAX_EXEMPTION_NOTE = 
  "If Reduced Sales Tax Rate is shown, Customer must provide a completed CA Farm Equipment and Machinery Partial Sales Tax Exemption Certificate (BOE-230-D Form.) In the absence of such form, Full Sales Tax Rate shall be charged/paid by Customer.";

// Add other application-wide constants here as needed

// New constants for Step 6.1
export const PIPE_PRICE_PER_FOOT_BY_SIZE: { [key: string]: number } = {
  '1"': 3.50,    // Example price for 1 inch pipe. Key should match `calculationResults.pipeSize` (e.g., '1"' or '1')
  '1.25"': 4.75, // Example price for 1.25 inch pipe
  '1.5"': 5.90,
  '2"': 7.50,
  '3"': 12.00,
  '4"': 18.00,
  // Add other common pipe sizes and their prices as needed
};

export const WELL_SEAL_RATE = 75.00; // Example rate for a standard well seal

// Placeholder for pump price if not derived from calculations (e.g., from pump_selection_table).
// Used if calculationResults.pumpDetails.price is not available.
export const DEFAULT_PUMP_PRICE = 0.00; // Consider if a more realistic default is appropriate, or ensure pump price is always supplied. 