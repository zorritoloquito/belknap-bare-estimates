import { z } from 'zod';
import { PDF_TERMS_DEFAULT } from '@/lib/constants';

// Base schema for customer and job info, aligned with EstimateFormInputs
export const baseEstimateFormSchema = z.object({
  customerName: z.string().min(1, { message: 'Customer name is required' }),
  customerStreet: z.string().min(1, { message: 'Street address is required' }),
  customerCity: z.string().min(1, { message: 'City is required' }),
  customerState: z.string().min(1, { message: 'State is required' }),
  customerZip: z.string().min(1, { message: 'ZIP code is required' }), // Basic validation, can be improved with regex
  jobNameOrLocation: z.string().min(1, { message: 'Job name/location is required' }),
  estimateDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date' }), // Or use z.date() if passing Date objects
  terms: z.string().default(PDF_TERMS_DEFAULT),
  salesTaxRateOption: z.enum(['reduced', 'standard'], { message: 'Sales tax option is required' }),
  includeTermsAndConditions: z.boolean().default(true),

  // Step 1a: GPM
  gpm: z.coerce
    .number({
      required_error: "GPM is required.",
      invalid_type_error: "GPM must be a number.",
    })
    .positive({ message: "GPM must be a positive number." })
    .refine((val) => {
      const rounded = val <= 55 ? 55 : Math.min(Math.ceil(val / 25) * 25, 1500);
      return rounded >= 55 && rounded <= 1500;
    }, { message: "GPM must result in a value between 55 and 1500 after rounding (up to nearest 25, min 55, max 1500)." }),

  // Step 1b: Pump Setting (PS)
  pumpSetting: z.coerce
    .number({
      required_error: "Pump Setting is required.",
      invalid_type_error: "Pump Setting must be a number.",
    })
    .positive({ message: "Pump Setting must be a positive number." })
    .int({ message: "Pump Setting must be a whole number." })
    .refine(val => Math.round(val) === val, { 
      message: "Pump Setting will be rounded to the nearest integer. Please ensure this is intended.",
      // This refine is more of a notification, actual rounding should happen in component if needed before saving.
      // Or, ensure the stored value is always an integer.
    }),

  // Step 1c: PWL Determination
  pwlDeterminationMethod: z.enum(["direct", "calculate"], {
    required_error: "PWL determination method is required.",
  }),
  pwlDirectInput: z.coerce
    .number({
      invalid_type_error: "Direct PWL input must be a number.",
    })
    .positive({ message: "Direct PWL input must be a positive number." })
    .int({ message: "Direct PWL input must be a whole number." })
    .optional(),

  // Fields for PWL Calculation
  gpmForPwlCalc: z.coerce // GPMt in spec
    .number({ invalid_type_error: "GPMt for PWL calculation must be a number." })
    .positive({ message: "GPMt must be positive." })
    .optional(),
  pwlHistoric: z.coerce // PWLt in spec
    .number({ invalid_type_error: "Historic PWL (PWLt) must be a number." })
    .positive({ message: "Historic PWL (PWLt) must be positive." })
    .int({ message: "Historic PWL (PWLt) must be a whole number." })
    .optional(),
  swl: z.coerce // SWL in spec
    .number({ invalid_type_error: "SWL must be a number." })
    .positive({ message: "SWL must be positive." })
    .int({ message: "SWL must be a whole number." })
    .optional(),

  // Step 1d: PSI
  psi: z.coerce
    .number({
      required_error: "PSI is required.",
      invalid_type_error: "PSI must be a number.",
    })
    .nonnegative({ message: "PSI must be zero or a positive number." })
    .int({ message: "PSI must be a whole number." })
    .refine(val => Math.round(val) === val, { 
      message: "PSI will be rounded to the nearest integer. Please ensure this is intended."
    }),

  // Step 1e: Voltage
  voltageInput: z.coerce
    .number({
      required_error: "Voltage is required.",
      invalid_type_error: "Voltage must be a number.",
    })
    .refine(val => [220, 230, 240, 440, 460, 480].includes(val), {
      message: "Invalid voltage. Accepted: 220, 230, 240, 440, 460, 480."
    }),
  // voltageMapped will be derived in the component or a useEffect, not directly part of the Zod schema for form input
  // but it will be part of the data saved. For now, let Zod only validate the input.

  // Step 1f, 1g, 1h: Labor Hours
  laborPrepJobHours: z.coerce
    .number({ invalid_type_error: "Prep job hours must be a number." })
    .nonnegative({ message: "Prep job hours must be non-negative." }),
  laborInstallPumpHours: z.coerce
    .number({ invalid_type_error: "Install pump hours must be a number." })
    .nonnegative({ message: "Install pump hours must be non-negative." }),
  laborPerformStartupHours: z.coerce
    .number({ invalid_type_error: "Perform startup hours must be a number." })
    .nonnegative({ message: "Perform startup hours must be non-negative." }),

  // Step 1i: Discharge Package
  dischargePackageOption: z.enum(["A", "B", "C"], {
    required_error: "Discharge package option is required.",
    invalid_type_error: "Invalid discharge package option. Must be A, B, or C."
  }),

  // Field to store the final PWL value (either direct or calculated client-side)
  // This can be used by calculation actions that need a single PWL input.
  finalPwlForCalc: z.number().optional(),

  // TODO: Add other fields as per steps 4.9 - 4.11

  // Discounts (Optional)
  laborDiscountAmount: z.coerce.number().nonnegative().optional(),
  materialDiscountAmount: z.coerce.number().nonnegative().optional(),

  // Line Items (Will be added in Phase 6)
  // lineItems: z.array(z.object({ ... })) // Placeholder
});

// Conditional validation for PWL calculation methods
export const estimateFormSchema = baseEstimateFormSchema.superRefine((data, ctx) => {
  if (data.pwlDeterminationMethod === 'direct') {
    if (data.pwlDirectInput === undefined || data.pwlDirectInput === null || isNaN(data.pwlDirectInput)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Direct PWL input is required and must be a valid number.',
        path: ['pwlDirectInput'],
      });
    }
  } else if (data.pwlDeterminationMethod === 'calculate') {
    if (data.gpmForPwlCalc === undefined || data.gpmForPwlCalc === null || isNaN(data.gpmForPwlCalc)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'GPMt is required for calculation and must be a valid number.', path: ['gpmForPwlCalc'] });
    }
    if (data.pwlHistoric === undefined || data.pwlHistoric === null || isNaN(data.pwlHistoric)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Historic PWL (PWLt) is required for calculation and must be a valid number.', path: ['pwlHistoric'] });
    }
    if (data.swl === undefined || data.swl === null || isNaN(data.swl)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'SWL is required for calculation and must be a valid number.', path: ['swl'] });
    }
    // Ensure pwlHistoric and swl are numbers before comparison
    if (typeof data.pwlHistoric === 'number' && typeof data.swl === 'number' && data.pwlHistoric <= data.swl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Historic PWL (PWLt) must be greater than SWL.',
        path: ['pwlHistoric'], // Or specific paths like ['pwlHistoric', 'swl']
      });
    }
  }
});

export type EstimateFormValues = z.infer<typeof estimateFormSchema>; 