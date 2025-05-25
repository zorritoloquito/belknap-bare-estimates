import { z } from 'zod';
// import { PDF_TERMS_DEFAULT } from '@/lib/constants'; // PDF_TERMS_DEFAULT is used in the schema, ensure it's imported if not already.

// Corresponds to lib/types.ts LineItem
const lineItemSchema = z.object({
  id: z.string().optional(), // For useFieldArray key
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  rate: z.number(), // Allows negative for discounts
  total: z.number(),
  isTaxable: z.boolean(),
  itemType: z.string().optional(), // Added itemType
});

export const estimateFormSchema = z.object({
  // --- Customer & Job Information (Step 4.2) ---
  customerName: z.string().min(1, { message: "Customer name is required." }),
  customerAddressStreet: z.string().min(1, { message: "Street address is required." }),
  customerAddressCity: z.string().min(1, { message: "City is required." }),
  customerAddressState: z.string().min(1, { message: "State is required." }),
  customerAddressZip: z.string().min(1, { message: "ZIP code is required." }), // Consider more specific zip validation
  jobNameOrLocation: z.string().min(1, { message: "Job name/location is required." }),
  estimateDate: z.date({ required_error: "Estimate date is required." }),
  terms: z.string().min(1, { message: "Terms are required." }), // Default was PDF_TERMS_DEFAULT from the old base schema. Re-add if needed or handle in component.

  // --- Toggles (Step 4.3) ---
  salesTaxRateType: z.enum(['reduced', 'standard'], { message: "Invalid sales tax type" }),
  includeTermsAndConditions: z.boolean(),

  // --- Main Inputs (Steps 4.4 - 4.11) ---
  gpm: z.coerce.number().positive("GPM must be a positive number."), // Raw GPM
  gpmRounded: z.coerce.number(), // store the rounded GPM for calculation use

  pumpSetting: z.coerce.number().int().positive("Pump Setting (PS) must be a positive integer."),

  pwlDeterminationMethod: z.enum(['direct', 'calculate'], { message: "Invalid PWL determination method" }),
  pwlDirectInput: z.coerce.number().positive("Direct PWL input must be a positive number.").int("Direct PWL input must be an integer.").optional(), // Made int and positive based on common usage.
  gpmt: z.coerce.number().positive("GPMt must be positive.").optional(),
  pwlt: z.coerce.number().positive("PWLt must be positive.").int("PWLt must be an integer.").optional(), // Made int based on common usage.
  swl: z.coerce.number().nonnegative("SWL must be non-negative.").int("SWL must be an integer.").optional(), // Made int and non-negative.
  finalPwl: z.coerce.number().positive("Final PWL must be a positive number."), //This will hold the value to be used

  psi: z.coerce.number().int().nonnegative("PSI must be a non-negative integer."),

  voltageInput: z.string().min(1, "Voltage input is required"), // Raw voltage input
  voltageMapped: z.number().refine(val => val === 240 || val === 480, {
    message: "Mapped voltage must be exactly 240 or 480"
  }), // Mapped voltage (240 or 480)

  laborPrepJobHours: z.coerce.number().nonnegative("Labor hours must be non-negative."),
  laborInstallPumpHours: z.coerce.number().nonnegative("Labor hours must be non-negative."),
  laborStartupHours: z.coerce.number().nonnegative("Labor hours must be non-negative."),

  dischargePackage: z.enum(['A', 'B', 'C'], { message: "Invalid discharge package." }),

  // --- Line Items (Step 6.1) ---
  lineItems: z.array(lineItemSchema).default([]),

  // --- Discounts (Step 6.4) ---
  laborDiscount: z.coerce.number().nonnegative("Labor discount must be non-negative").optional(),
  materialDiscount: z.coerce.number().nonnegative("Material discount must be non-negative").optional(),
}).refine(data => {
  // Conditional validation for PWL calculation inputs
  if (data.pwlDeterminationMethod === 'calculate') {
    if (!(data.gpmt && data.pwlt && data.swl !== undefined)) return false;
    return data.pwlt > data.swl;
  }
  return true;
}, {
  message: "For calculated PWL, GPMt, PWLt, and SWL are required, and PWLt must be greater than SWL.",
  path: ['pwlDeterminationMethod'], // Or a more specific path like ['gpmt'] or ['pwlt'] or ['swl']
}).refine(data => {
    if (data.pwlDeterminationMethod === 'direct') {
        return data.pwlDirectInput !== undefined && data.pwlDirectInput > 0;
    }
    return true;
}, {
    message: "Direct PWL input must be a positive number.",
    path: ['pwlDirectInput'],
});

export type EstimateFormValues = z.infer<typeof estimateFormSchema>;