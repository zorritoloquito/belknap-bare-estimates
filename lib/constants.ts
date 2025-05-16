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

// Placeholder: Actual text for the sales tax exemption note should be obtained
// from page 2 of the sample PDF or other official company documents.
export const PDF_REDUCED_SALES_TAX_EXEMPTION_NOTE = 
  "If Reduced Sales Tax Rate is shown, a completed California Resale Certificate (BOE-230), or other valid exemption certificate, must be provided. Customer certifies that the property is used for exempt agricultural purposes.";

// Add other application-wide constants here as needed 