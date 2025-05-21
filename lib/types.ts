export interface Customer {
  id?: string; // Optional: if retrieved from DB
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  // Add other customer-related fields if needed
}

export interface Job {
  id?: string; // Optional: if retrieved from DB
  nameOrLocation: string;
  // Add other job-related fields if needed
}

export type LineItemType = 'material' | 'labor' | 'service' | 'discount' | 'descriptive';

export interface LineItem {
  id?: string; // Optional: for useFieldArray key, React Hook Form might add it automatically
  description: string;
  quantity: number;
  rate: number;
  total: number;
  isTaxable: boolean;
}

export type PWLCalculationMethod = 'direct' | 'calculate';
export type DischargePackageOption = 'A' | 'B' | 'C';
export type SalesTaxRateOption = 'reduced' | 'standard';

export interface EstimateFormInputs {
  // From Step 4.1: Basic form fields like customer name, address etc.
  customerName: string;
  customerAddressStreet: string;
  customerAddressCity: string;
  customerAddressState: string;
  customerAddressZip: string;
  jobNameOrLocation: string;
  estimateDate: Date;
  terms: string;

  // From Step 4.3: Toggles
  salesTaxRateType: 'reduced' | 'standard'; // Assuming 'reduced' or 'standard'
  includeTermsAndConditions: boolean;

  // From Step 4.4: GPM
  gpm: number; // Raw input
  gpmRounded: number; // Rounded GPM

  // From Step 4.5: Pump Setting
  pumpSetting: number; // PS

  // From Step 4.6: PWL Determination
  pwlDeterminationMethod: 'direct' | 'calculate';
  pwlDirectInput?: number; // if method is 'direct'

  // From Step 4.7: PWL Calculation Inputs
  gpmt?: number;
  pwlt?: number;
  swl?: number;
  calculatedPwl?: number; // calculated PWL if method is 'calculate'
  finalPwl: number; // The PWL value to be used in calculations (either direct or calculated)

  // From Step 4.8: PSI
  psi: number;

  // From Step 4.9: Voltage
  voltageInput: string; // Raw voltage input
  voltageMapped: 240 | 480; // Mapped voltage

  // From Step 4.10: Labor Hours
  laborPrepJobHours: number;
  laborInstallPumpHours: number;
  laborStartupHours: number;

  // From Step 4.11: Discharge Package
  dischargePackage: 'A' | 'B' | 'C';

  // Will be extended in Step 6.1 for line items
  lineItems?: LineItem[];
  // Will be extended in Step 6.4 for discounts
  laborDiscount?: number;
  materialDiscount?: number;
}

export interface CalculatedEstimateValues {
  tdh: number;
  pipeSize: string; // e.g., "2" for 2 inch, or "2""
  motorDetails: {
    hpRating: number;
    ourCost: number; // Though not directly used in sales line items, good to have
    salesPrice: number;
    itemDescription: string;
  };
  wireDetails: {
    size: string; // e.g., "10/2"
    totalLength: number;
    salesPricePerFt: number;
  };
  // Step 5.5 only explicitly mentions "Pump description" being stored.
  // Price for the pump itself needs clarification. Will use a default from constants for now.
  pumpDetails: {
    description: string;
    price?: number; // Add price field, make it optional initially
  };
  // Any other values calculated in Phase 5 and needed for display or line items
}

// Represents the comprehensive data for an estimate, aligning with DB schema
export interface EstimateData {
  id: string; // UUID from database
  estimateNumber: string; // System-generated, e.g., "E3701"
  estimateDate: string; // ISO string
  userId: string; // Link to auth.users
  status: 'Draft' | 'Approved' | 'Sent' | 'Archived'; // Or other relevant statuses

  customerId: string; // Foreign key to customers table
  jobId: string; // Foreign key to jobs table

  // Form Inputs (denormalized or as a JSON object, depends on DB design)
  // For simplicity here, let's assume they are somewhat flattened or accessible
  customerName: string;
  customerStreet: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  jobNameOrLocation: string;
  terms: string;
  salesTaxRateApplied: number; // e.g., 0.0275 or 0.0775
  includeTermsAndConditions: boolean;
  gpmInput: number;
  pumpSettingInput: number;
  pwlCalculationMethod: PWLCalculationMethod;
  pwlDirectInput?: number;
  gpmtInput?: number;
  pwltInput?: number;
  swlInput?: number;
  psiInput: number;
  voltageInput: number;
  laborPrepJobHours: number;
  laborInstallPumpHours: number;
  laborPerformStartupHours: number;
  dischargePackageOption: DischargePackageOption;
  laborDiscountAmount?: number;
  materialDiscountAmount?: number;

  // Calculated Values (denormalized or as a JSON object)
  calculatedValues: CalculatedEstimateValues; // Store the whole block

  // Line Items
  lineItems: LineItem[];

  // Timestamps
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
} 