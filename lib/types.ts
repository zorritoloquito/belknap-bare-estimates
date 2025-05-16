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
  id: string; // For React key, field array management
  description: string;
  quantity: number;
  rate: number;
  total: number;
  type: LineItemType;
  isTaxable: boolean; // To help with totals calculation
}

export type PWLCalculationMethod = 'direct' | 'calculate';
export type DischargePackageOption = 'A' | 'B' | 'C';
export type SalesTaxRateOption = 'reduced' | 'standard';

export interface EstimateFormInputs {
  // Customer & Job Information
  customerName: string;
  customerStreet: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  jobNameOrLocation: string;
  estimateDate: string; // Store as ISO string, can be converted to Date object
  terms: string;
  salesTaxRateOption: SalesTaxRateOption;
  includeTermsAndConditions: boolean;

  // Step 1: Initial Input Collection
  gpmInput: number; // Raw GPM input
  pumpSettingInput: number;
  pwlCalculationMethod: PWLCalculationMethod;
  pwlDirectInput?: number; // Optional, if method is 'direct'
  gpmtInput?: number; // Optional, if method is 'calculate'
  pwltInput?: number; // Optional, if method is 'calculate'
  swlInput?: number; // Optional, if method is 'calculate'
  psiInput: number;
  voltageInput: number; // Raw voltage input
  laborPrepJobHours: number;
  laborInstallPumpHours: number;
  laborPerformStartupHours: number;
  dischargePackageOption: DischargePackageOption;

  // Discounts (Optional)
  laborDiscountAmount?: number;
  materialDiscountAmount?: number;

  // Line Items will be managed by useFieldArray, but the form schema might include them
  lineItems?: LineItem[];
}

export interface CalculatedEstimateValues {
  roundedGpm: number;
  roundedPumpSetting: number;
  finalPwl: number;
  mappedVoltage: 240 | 480;
  pipeSize: string;
  frictionLossPerFoot: number;
  totalFrictionLoss: number;
  pressureInFeet: number;
  tdh: number;
  calculatedHp: number;
  motorHpRating: string | number; // Can be string like "7.5 HP" or number
  motorOurCost: number;
  motorSalesPrice: number;
  motorItemDescription: string;
  wireSize: string;
  totalWireLength: number;
  wireSalesPricePerFoot: number;
  submersiblePumpDescription: string;

  // Totals from line items
  taxableSubtotal: number;
  nonTaxableSubtotal: number;
  subtotalBeforeTax: number;
  salesTaxAmount: number;
  grandTotal: number;
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