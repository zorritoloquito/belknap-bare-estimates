'use client';

import { useForm, FormProvider, useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { estimateFormSchema, type EstimateFormValues } from '@/lib/schemas/estimateFormSchema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PDF_TERMS_DEFAULT } from '@/lib/constants'; // Import PDF_TERMS_DEFAULT
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker'; // Make sure this path is correct
import { Switch } from "@/components/ui/switch"; // Added Switch import
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Added RadioGroup for Sales Tax
import { roundGpm, calculateY, calculatePwlFromComponents, mapVoltage as mapVoltageUtil, roundToHigherMultipleOf25 } from "@/lib/utils"; // Added mapVoltageUtil and other utils
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"; // Added missing import for Form components
import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Added Select imports
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert imports
import { Loader2 } from "lucide-react"; // For loading spinner
import { CalculatedEstimateValues, LineItem, EstimateFormInputs } from "@/lib/types";

// Import calculation actions
import {
  calculateTdh,
  calculateHpAndMatchMotor,
  selectWireSizeAndPrice,
  selectSubmersiblePump
} from "@/lib/actions/calculationActions";

// Import line item generation utility
import { generateAndRoundInitialLineItems } from "@/lib/estimateUtils";

// Import the new LineItemsTable component
import { LineItemsTable } from './LineItemsTable';

// Import the TotalsDisplay component
import { TotalsDisplay } from './TotalsDisplay';

// Import saveEstimate and useRouter
import { saveEstimate, type SaveEstimateResult } from '@/lib/actions/estimateActions';
import { useRouter } from 'next/navigation';

// Import result types (assuming they are exported or defined in calculationActions.ts or a types file)
// For now, let's define them inline if not exported from actions, or use `any` as placeholder
type TdhCalculationResult = NonNullable<Awaited<ReturnType<typeof calculateTdh>>>;
type HpAndMotorResult = NonNullable<Awaited<ReturnType<typeof calculateHpAndMatchMotor>>>;
type WireDetailsResult = NonNullable<Awaited<ReturnType<typeof selectWireSizeAndPrice>>>;
type PumpSelectionResult = NonNullable<Awaited<ReturnType<typeof selectSubmersiblePump>>>;

// Placeholder for individual form sections/fields that will be created in subsequent steps
// For example: import CustomerInfoSection from './form-sections/CustomerInfoSection';

// This is a new component for the customer/job section
function CustomerJobInfoSection() {
  const { control, register, formState: { errors } } = useFormContext<EstimateFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer & Job Information</CardTitle>
        <CardDescription>Enter details about the customer and job site.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input id="customerName" {...register('customerName')} />
            {errors.customerName && <p className="text-sm text-destructive">{errors.customerName.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="jobNameOrLocation">Job Name / Location</Label>
            <Input id="jobNameOrLocation" {...register('jobNameOrLocation')} />
            {errors.jobNameOrLocation && <p className="text-sm text-destructive">{errors.jobNameOrLocation.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="customerAddressStreet">Street Address</Label>
          <Input id="customerAddressStreet" {...register('customerAddressStreet')} />
          {errors.customerAddressStreet && <p className="text-sm text-destructive">{errors.customerAddressStreet.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="customerAddressCity">City</Label>
            <Input id="customerAddressCity" {...register('customerAddressCity')} />
            {errors.customerAddressCity && <p className="text-sm text-destructive">{errors.customerAddressCity.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="customerAddressState">State</Label>
            <Input id="customerAddressState" {...register('customerAddressState')} />
            {errors.customerAddressState && <p className="text-sm text-destructive">{errors.customerAddressState.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="customerAddressZip">ZIP Code</Label>
            <Input id="customerAddressZip" {...register('customerAddressZip')} />
            {errors.customerAddressZip && <p className="text-sm text-destructive">{errors.customerAddressZip.message}</p>}
          </div>
        </div>
        
        <Separator className="my-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1">
            <Label htmlFor="estimateDate">Estimate Date</Label>
            <Controller
              name="estimateDate"
              control={control}
              render={({ field }) => (
                <DatePicker 
                  date={field.value instanceof Date ? field.value : (field.value ? new Date(field.value + 'T00:00:00') : undefined)}
                  setDate={(dateValue) => field.onChange(dateValue)}
                  placeholder="Select estimate date"
                />
              )}
            />
            {errors.estimateDate && <p className="text-sm text-destructive">{errors.estimateDate.message}</p>}
          </div>
          
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="terms">Terms</Label>
            <Input id="terms" {...register('terms')} />
            {errors.terms && <p className="text-sm text-destructive">{errors.terms.message}</p>}
          </div>
        </div>
        
        {/* Estimate # would be displayed here, not editable by user initially */}
        {/* <div className="space-y-1">
          <Label>Estimate #</Label>
          <Input value="System Generated" disabled />
        </div> */}

      </CardContent>
    </Card>
  );
}

// This is a new component for Toggles
function TogglesSection() {
  const { control, formState: { errors } } = useFormContext<EstimateFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Options</CardTitle>
        <CardDescription>Configure sales tax and PDF options.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base">Sales Tax Rate</Label>
          <Controller
            name="salesTaxRateType"
            control={control}
            render={({ field }) => (
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reduced" id="taxReduced" />
                  <Label htmlFor="taxReduced">Reduced (2.75%)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="taxStandard" />
                  <Label htmlFor="taxStandard">Standard (7.75%)</Label>
                </div>
              </RadioGroup>
            )}
          />
          {errors.salesTaxRateType && <p className="text-sm text-destructive">{errors.salesTaxRateType.message}</p>}
        </div>

        <Separator />

        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="includeTermsAndConditions" className="text-base">
              Include Terms & Conditions on PDF
            </Label>
            <p className="text-sm text-muted-foreground">
              Select whether to append the standard multi-page T&Cs to the generated PDF estimate.
            </p>
          </div>
          <Controller
            name="includeTermsAndConditions"
            control={control}
            render={({ field }) => (
              <Switch
                id="includeTermsAndConditions"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
        {errors.includeTermsAndConditions && <p className="text-sm text-destructive">{errors.includeTermsAndConditions.message}</p>}
      </CardContent>
    </Card>
  );
}

// Helper to ensure all keys from the schema are present in defaultValues
const initialFormValues: EstimateFormValues = {
  customerName: "",
  customerAddressStreet: "",
  customerAddressCity: "",
  customerAddressState: "",
  customerAddressZip: "",
  jobNameOrLocation: "",
  estimateDate: new Date(),
  terms: PDF_TERMS_DEFAULT,
  salesTaxRateType: "standard",
  includeTermsAndConditions: true,
  gpm: 0,
  gpmRounded: 0,
  pumpSetting: 0,
  pwlDeterminationMethod: "direct",
  pwlDirectInput: undefined,
  gpmt: undefined,
  pwlt: undefined,
  swl: undefined,
  finalPwl: 0,
  psi: 0,
  voltageInput: "",
  voltageMapped: 240,
  laborPrepJobHours: 0,
  laborInstallPumpHours: 0,
  laborStartupHours: 0,
  dischargePackage: "A",
  lineItems: [],
  laborDiscount: undefined,
  materialDiscount: undefined,
};

function PwlSection() {
  const { control, watch, setValue, formState: { errors } } = useFormContext<EstimateFormValues>();
  const pwlMethod = watch("pwlDeterminationMethod");
  const gpmt_watched = watch("gpmt");
  const pwlt_watched = watch("pwlt");
  const swl_watched = watch("swl");
  const directPwl_watched = watch("pwlDirectInput");

  const [calculatedPwlDisplay, setCalculatedPwlDisplay] = useState<number | null>(null);

  useEffect(() => {
    if (pwlMethod === 'calculate' && gpmt_watched && pwlt_watched && swl_watched && pwlt_watched > swl_watched) {
      // Assuming calculateY and calculatePwlFromComponents are correctly defined in utils
      // const yValue = calculateY(gpmt_watched, 2); // Example: pipeId assumed as 2, adjust if needed
      // const { pwl: finalCalcPwl } = calculatePwlFromComponents(pwlt_watched, swl_watched, yValue);
      // setValue('finalPwl', roundToHigherMultipleOf25(finalCalcPwl));
      // setCalculatedPwlDisplay(roundToHigherMultipleOf25(finalCalcPwl));
      // For now, simplified setValue for finalPwl, actual calculation in handleCalculateDetails or main form useEffect
    } else if (pwlMethod === 'direct' && directPwl_watched) {
      // setValue('finalPwl', roundToHigherMultipleOf25(directPwl_watched));
      // setCalculatedPwlDisplay(null);
    }
  }, [pwlMethod, gpmt_watched, pwlt_watched, swl_watched, directPwl_watched, setValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pumping Water Level (PWL)</CardTitle>
        <CardDescription>Specify how PWL will be determined.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="pwlDeterminationMethod"
          render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
              <FormItem className="flex items-center space-x-3">
                <FormControl><RadioGroupItem value="calculate" /></FormControl>
                <FormLabel>Calculate PWL from GPMt, PWLt, SWL</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-3">
                <FormControl><RadioGroupItem value="direct" /></FormControl>
                <FormLabel>Input PWL directly</FormLabel>
              </FormItem>
            </RadioGroup>
          )}
        />
        {errors.pwlDeterminationMethod && <p className="text-sm text-destructive">{errors.pwlDeterminationMethod.message}</p>}

        {pwlMethod === 'calculate' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t mt-4">
            <FormField control={control} name="gpmt" render={({ field }) => (<FormItem><FormLabel>GPMt (Test GPM)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={control} name="pwlt" render={({ field }) => (<FormItem><FormLabel>PWLt (Test PWL ft)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={control} name="swl" render={({ field }) => (<FormItem><FormLabel>SWL (Static WL ft)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
          </div>
        )}
        {pwlMethod === 'direct' && (
          <div className="pt-4 border-t mt-4">
            <FormField control={control} name="pwlDirectInput" render={({ field }) => (<FormItem><FormLabel>Direct PWL Input (ft)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
          </div>
        )}
        {/* Display calculated PWL if needed, or finalPwl from main form state */}
        {/* {calculatedPwlDisplay !== null && <p>Calculated PWL for display: {calculatedPwlDisplay} ft</p>} */}
      </CardContent>
    </Card>
  );
}

function CalculationTriggerSection({ 
    isLoading, 
    onCalculate 
}: { 
    isLoading: boolean;
    onCalculate: () => Promise<void>;
 }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculate Pump System Details</CardTitle>
        <CardDescription>Based on the inputs above, calculate the system parameters.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" onClick={onCalculate} disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Calculate Details
        </Button>
      </CardContent>
    </Card>
  );
}

function CalculationResultsDisplay({
  results,
  error
}: {
  results: CalculatedEstimateValues | null;
  error: string | null;
}) {
  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTitle>Calculation Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!results) {
    return null; 
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Calculation Results</CardTitle>
        <CardDescription>Review the calculated system parameters below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Display from the single 'results' object */}
        <div className="space-y-1 p-2 border rounded-md">
          <h4 className="font-medium">System Details:</h4>
          <p>Calculated TDH: {results.tdh ?? 'N/A'} ft</p>
          <p>Pipe Size: {results.pipeSize ?? 'N/A'}</p>
        </div>
        <div className="space-y-1 p-2 border rounded-md mt-2">
          <h4 className="font-medium">Motor Details:</h4>
          <p>Selected Motor HP: {results.motorDetails?.hpRating ?? 'N/A'} HP</p>
          <p>Motor Description: {results.motorDetails?.itemDescription ?? 'N/A'}</p>
          <p>Motor Sales Price: ${results.motorDetails?.salesPrice?.toFixed(2) ?? 'N/A'}</p>
        </div>
        <div className="space-y-1 p-2 border rounded-md mt-2">
          <h4 className="font-medium">Wire Details:</h4>
          <p>Selected Wire Size: {results.wireDetails?.size ?? 'N/A'}</p>
          <p>Total Wire Length: {results.wireDetails?.totalLength ?? 'N/A'} ft</p>
          <p>Wire Sales Price per Ft: ${results.wireDetails?.salesPricePerFt?.toFixed(2) ?? 'N/A'}</p>
        </div>
        <div className="space-y-1 p-2 border rounded-md mt-2">
          <h4 className="font-medium">Pump Selection:</h4>
          <p>Pump Description: {results.pumpDetails?.description ?? 'N/A'}</p>
          {/* If pump price is consistently available in results.pumpDetails.price */}
          {results.pumpDetails?.price !== undefined && <p>Pump Sales Price: ${results.pumpDetails.price.toFixed(2)}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// New component for Discount Inputs
function DiscountSection() {
  const { control, formState: { errors } } = useFormContext<EstimateFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discounts</CardTitle>
        <CardDescription>Enter any applicable labor or material discounts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="laborDiscount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Labor Discount ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  {...field} 
                  onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} 
                />
              </FormControl>
              <FormDescription>Enter the total amount for labor discount.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="materialDiscount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material Discount ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  {...field} 
                  onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                />
              </FormControl>
              <FormDescription>Enter the total amount for material discount.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

export default function EstimateForm() {
  const [calculationResults, setCalculationResults] = useState<CalculatedEstimateValues | null>(null);
  const [isLoadingCalculations, setIsLoadingCalculations] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const methods = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: initialFormValues,
    mode: 'onBlur', // Or 'onChange' for more immediate feedback
  });

  const { handleSubmit, control, watch, setValue, reset, formState: { errors, isValid, isDirty, isSubmitting }, register, getValues } = methods;

  const { fields, append, remove, replace } = useFieldArray({
    control: methods.control,
    name: "lineItems",
  });

  const [clientMappedVoltage, setClientMappedVoltage] = useState<240 | 480 | null>(null);

  const watchedGpm = methods.watch("gpm");
  const watchedVoltageInput = methods.watch("voltageInput");
  const watchedLaborDiscount = methods.watch("laborDiscount");
  const watchedMaterialDiscount = methods.watch("materialDiscount");

  useEffect(() => {
    const voltageNum = parseFloat(watchedVoltageInput);
    if (watchedVoltageInput.trim() === "" || isNaN(voltageNum)) { 
      setClientMappedVoltage(null);
      return;
    }
    const mapped = mapVoltageUtil(voltageNum);
    setClientMappedVoltage(mapped);
  }, [watchedVoltageInput]);

  // Watch GPM input for rounding
  const gpmInput = methods.watch("gpm");
  useEffect(() => {
    methods.setValue("gpmRounded", roundGpm(gpmInput));
  }, [gpmInput, methods]);

  const pumpSettingInput = methods.watch("pumpSetting");
  useEffect(() => {
    methods.setValue("pumpSetting", roundToHigherMultipleOf25(pumpSettingInput));
  }, [pumpSettingInput, methods]);

  const psiInput = methods.watch("psi");
  useEffect(() => {
    methods.setValue("psi", roundToHigherMultipleOf25(psiInput));
  }, [psiInput, methods]);
  
  const voltageRawInput = methods.watch("voltageInput");
  useEffect(() => {
    const numValue = parseFloat(voltageRawInput);
    if (voltageRawInput.trim() === "" || isNaN(numValue)) {
        return;
    }
    const mapped = mapVoltageUtil(numValue);
    if (mapped) {
      methods.setValue("voltageMapped", mapped, { shouldValidate: true });
    } else {
      methods.setError("voltageInput", { type: "manual", message: "Invalid voltage for mapping." });
    }
  }, [voltageRawInput, methods]);

  const pwlMethod = methods.watch("pwlDeterminationMethod");
  const gpmForPwlCalc = methods.watch("gpmRounded");
  const pwltInput = methods.watch("pwlt");
  const swlInput = methods.watch("swl");
  const pwlDirect = methods.watch("pwlDirectInput");

  useEffect(() => {
    if (pwlMethod === 'calculate' && gpmForPwlCalc && pwltInput && swlInput !== undefined && pwltInput > swlInput) {
      // calculateY might need a valid pipe ID, using 2 as placeholder from previous context.
      // This should ideally come from form state or constants if variable.
      const yFactor = calculateY(gpmForPwlCalc, 2); 
      const calculatedPwlValue = calculatePwlFromComponents(pwltInput, swlInput, yFactor);
      methods.setValue("finalPwl", roundToHigherMultipleOf25(calculatedPwlValue)); // Use the direct value
    } else if (pwlMethod === 'direct' && pwlDirect) {
      methods.setValue("finalPwl", roundToHigherMultipleOf25(pwlDirect));
    } else {
      // methods.setValue("finalPwl", 0); // Or some other default/reset, ensure it doesn't violate schema (e.g. positive())
    }
  }, [pwlMethod, gpmForPwlCalc, pwltInput, swlInput, pwlDirect, methods, calculateY]); // Added calculateY to dependency array

  // Effect to generate line items when calculationResults are available
  useEffect(() => {
    if (calculationResults) {
      const formValues = getValues(); // Get current form values

      // Runtime check for voltageMapped before creating inputsForLineItems
      if (formValues.voltageMapped !== 240 && formValues.voltageMapped !== 480) {
        console.error(
          `generateAndRoundInitialLineItems cannot proceed: formValues.voltageMapped is not 240 or 480. Value: ${formValues.voltageMapped}`
        );
        setValue("lineItems", [], { shouldValidate: true, shouldDirty: true });
        return;
      }

      // Explicitly construct inputsForLineItems to match EstimateFormInputs type
      const inputsForLineItems: EstimateFormInputs = {
        customerName: formValues.customerName,
        customerAddressStreet: formValues.customerAddressStreet,
        customerAddressCity: formValues.customerAddressCity,
        customerAddressState: formValues.customerAddressState,
        customerAddressZip: formValues.customerAddressZip,
        jobNameOrLocation: formValues.jobNameOrLocation,
        estimateDate: formValues.estimateDate,
        terms: formValues.terms,
        salesTaxRateType: formValues.salesTaxRateType,
        includeTermsAndConditions: formValues.includeTermsAndConditions,
        gpm: formValues.gpm,
        gpmRounded: formValues.gpmRounded,
        pumpSetting: formValues.pumpSetting,
        pwlDeterminationMethod: formValues.pwlDeterminationMethod,
        pwlDirectInput: formValues.pwlDirectInput,
        gpmt: formValues.gpmt,
        pwlt: formValues.pwlt,
        swl: formValues.swl,
        finalPwl: formValues.finalPwl,
        psi: formValues.psi,
        voltageInput: formValues.voltageInput,
        voltageMapped: formValues.voltageMapped, // TypeScript should now infer this correctly due to the runtime check
        laborPrepJobHours: formValues.laborPrepJobHours,
        laborInstallPumpHours: formValues.laborInstallPumpHours,
        laborStartupHours: formValues.laborStartupHours,
        dischargePackage: formValues.dischargePackage,
        // lineItems is usually not part of inputs for generating line items itself
        // laborDiscount and materialDiscount will be handled by their own logic later
      };

      const newLineItems = generateAndRoundInitialLineItems(
        inputsForLineItems,
        calculationResults
      );
      setValue("lineItems", newLineItems, { shouldValidate: true, shouldDirty: true });
    }
  }, [calculationResults, setValue, getValues]);

  // Effect to manage Labor Discount line item
  useEffect(() => {
    const laborDiscountAmount = watchedLaborDiscount || 0;
    const lineItems = getValues("lineItems") || [];
    const existingDiscountIndex = lineItems.findIndex(item => item.description === "System Discount: Labor");

    if (laborDiscountAmount > 0) {
      const discountLineItem: LineItem = {
        description: "System Discount: Labor",
        quantity: 1,
        rate: -laborDiscountAmount,
        total: -laborDiscountAmount,
        isTaxable: false, // Discounts are typically not taxable
      };
      if (existingDiscountIndex !== -1) {
        // Update existing discount line item
        setValue(`lineItems.${existingDiscountIndex}`, discountLineItem, { shouldValidate: true, shouldDirty: true });
      } else {
        // Add new discount line item
        append(discountLineItem, { shouldFocus: false });
      }
    } else {
      // If discount is 0 or undefined, remove the discount line item if it exists
      if (existingDiscountIndex !== -1) {
        remove(existingDiscountIndex);
      }
    }
  }, [watchedLaborDiscount, setValue, getValues, append, remove]);

  // Effect to manage Material Discount line item
  useEffect(() => {
    const materialDiscountAmount = watchedMaterialDiscount || 0;
    const lineItems = getValues("lineItems") || [];
    const existingDiscountIndex = lineItems.findIndex(item => item.description === "System Discount: Material");

    if (materialDiscountAmount > 0) {
      const discountLineItem: LineItem = {
        description: "System Discount: Material",
        quantity: 1,
        rate: -materialDiscountAmount,
        total: -materialDiscountAmount,
        isTaxable: false, // Discounts on materials might affect taxable total, but the line item itself is a reduction
      };
      if (existingDiscountIndex !== -1) {
        // Update existing discount line item
        setValue(`lineItems.${existingDiscountIndex}`, discountLineItem, { shouldValidate: true, shouldDirty: true });
      } else {
        // Add new discount line item
        append(discountLineItem, { shouldFocus: false });
      }
    } else {
      // If discount is 0 or undefined, remove the discount line item if it exists
      if (existingDiscountIndex !== -1) {
        remove(existingDiscountIndex);
      }
    }
  }, [watchedMaterialDiscount, setValue, getValues, append, remove]);

  const handleCalculateDetails = async () => {
    const relevantFields: Array<keyof EstimateFormValues> = [
      "gpm", "gpmRounded", "pumpSetting", "pwlDeterminationMethod", "finalPwl", 
      "psi", "voltageInput", "voltageMapped"
    ];
    if (methods.getValues("pwlDeterminationMethod") === 'direct') {
      relevantFields.push("pwlDirectInput");
    } else {
      relevantFields.push("gpmt", "pwlt", "swl");
    }
    const isValid = await methods.trigger(relevantFields);

    if (!isValid) {
      setCalculationError("Please correct validation errors before calculating.");
      return;
    }
    
    setIsLoadingCalculations(true);
    setCalculationError(null);
    setCalculationResults(null);

    try {
      const formData = methods.getValues();
      
      const currentVoltageMapped = formData.voltageMapped;
      if (currentVoltageMapped !== 240 && currentVoltageMapped !== 480) {
        throw new Error("Internal error: voltageMapped is not a valid value (240 or 480) before calculation.");
      }

      const tdhResultAction = await calculateTdh({
        gpm: formData.gpmRounded,
        ps: formData.pumpSetting,
        psi: formData.psi,
        pwl: formData.finalPwl,
      });
      if (tdhResultAction.error) throw new Error(tdhResultAction.error);
      const { tdh, pipeSize } = tdhResultAction; // Corrected: Access properties directly
      const roundedTdh = roundToHigherMultipleOf25(tdh);

      const motorResultAction = await calculateHpAndMatchMotor({
        gpm: formData.gpmRounded,
        tdh: roundedTdh,
      });
      if (motorResultAction.error) throw new Error(motorResultAction.error);
      const motorDetails = motorResultAction; // Corrected: motorResultAction is the result object

      const wireResultAction = await selectWireSizeAndPrice({
        voltage: currentVoltageMapped, 
        pumpSetting: formData.pumpSetting,
        motorHpRating: motorDetails.motorHpRating!, // Corrected property name and added non-null assertion
      });
      if (wireResultAction.error) throw new Error(wireResultAction.error);
      const wireDetails = wireResultAction; // Corrected: wireResultAction is the result object

      const pumpResultAction = await selectSubmersiblePump({
        gpm: formData.gpmRounded,
        tdh: roundedTdh,
      });
      if (pumpResultAction.error || !pumpResultAction.data) { // Ensured robust check
        throw new Error(pumpResultAction.error || "Pump selection data is missing.");
      }
      const pumpDesc = pumpResultAction.data.pumpDescription;
      // const pumpPrice = pumpResultAction.data.salesPrice; // This line should be effectively removed or remain commented
      
      const results: CalculatedEstimateValues = {
        tdh: roundedTdh,
        pipeSize: pipeSize || "", // Handle potentially null pipeSize
        motorDetails: { // Ensure motorDetails structure matches CalculatedEstimateValues
            hpRating: motorDetails.motorHpRating || 0,
            ourCost: motorDetails.ourCost || 0,
            salesPrice: motorDetails.salesPrice || 0,
            itemDescription: motorDetails.itemDescription || "",
        },
        wireDetails: { // Ensure wireDetails structure matches CalculatedEstimateValues
            size: wireDetails.wireSize || "",
            totalLength: wireDetails.totalWireLength || 0, // Corrected: Source from action is totalWireLength
            salesPricePerFt: wireDetails.wireSalesPricePerFt || 0,
        },
        pumpDetails: { description: pumpDesc ?? "N/A", price: undefined }, // Ensure pumpDesc has a fallback and price is undefined
      };
      setCalculationResults(results);

      const formValuesForLineItems: EstimateFormInputs = {
          customerName: formData.customerName,
          customerAddressStreet: formData.customerAddressStreet,
          customerAddressCity: formData.customerAddressCity,
          customerAddressState: formData.customerAddressState,
          customerAddressZip: formData.customerAddressZip,
          jobNameOrLocation: formData.jobNameOrLocation,
          estimateDate: formData.estimateDate,
          terms: formData.terms,
          salesTaxRateType: formData.salesTaxRateType,
          includeTermsAndConditions: formData.includeTermsAndConditions,
          gpm: formData.gpm,
          gpmRounded: formData.gpmRounded,
          pumpSetting: formData.pumpSetting,
          pwlDeterminationMethod: formData.pwlDeterminationMethod,
          pwlDirectInput: formData.pwlDirectInput,
          gpmt: formData.gpmt,
          pwlt: formData.pwlt,
          swl: formData.swl,
          finalPwl: formData.finalPwl,
          psi: formData.psi,
          voltageInput: formData.voltageInput,
          voltageMapped: currentVoltageMapped as (240 | 480),
          laborPrepJobHours: formData.laborPrepJobHours,
          laborInstallPumpHours: formData.laborInstallPumpHours,
          laborStartupHours: formData.laborStartupHours,
          dischargePackage: formData.dischargePackage,
          laborDiscount: formData.laborDiscount,
          materialDiscount: formData.materialDiscount,
          // lineItems is intentionally omitted as it's generated
      };

      const initialLineItems = generateAndRoundInitialLineItems(formValuesForLineItems, results);
      replace(initialLineItems);

    } catch (error: any) {
      setCalculationError(error.message || "An unexpected error occurred during calculations.");
      setCalculationResults(null);
      replace([]);
    } finally {
      setIsLoadingCalculations(false);
    }
  };

  async function onSubmit(data: EstimateFormValues) {
    setSubmissionStatus(null);
    if (!calculationResults) {
      setSubmissionStatus({ message: 'Cannot save estimate without prior successful calculation.', type: 'error' });
      console.error("Attempted to save estimate without calculation results.");
      return;
    }

    console.log("Form Submitted for saving:", data);
    console.log("Calculation results for saving:", calculationResults);

    try {
      const payload = { ...data, calculationResults };
      const result = await saveEstimate(payload);

      if (result.success) {
        setSubmissionStatus({ 
          message: `Estimate ${result.estimateNumber} saved successfully! ID: ${result.estimateId}`,
          type: 'success' 
        });
        console.log("Estimate saved successfully:", result);
        router.push('/');
      } else {
        setSubmissionStatus({ message: `Error saving estimate: ${result.error}`, type: 'error' });
        console.error("Error saving estimate:", result.error);
      }
    } catch (error: any) {
      setSubmissionStatus({ message: `An unexpected error occurred: ${error.message}`, type: 'error' });
      console.error("Unexpected error during submission:", error);
    }
  }

  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <CustomerJobInfoSection />
          <TogglesSection />
          
          <PwlSection /> 

          <Card>
            <CardHeader><CardTitle>Pump System Inputs (Simplified Example)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={methods.control} name="gpm" render={({ field }) => (<FormItem><FormLabel>GPM (Rounded: {roundGpm(field.value || 0)})</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={methods.control} name="pumpSetting" render={({ field }) => (<FormItem><FormLabel>Pump Setting (ft)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={methods.control} name="psi" render={({ field }) => (<FormItem><FormLabel>PSI</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={methods.control} name="voltageInput" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voltage Input</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl>
                    {clientMappedVoltage !== null && <FormDescription>Mapped Voltage: {clientMappedVoltage}V</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )} />
            </CardContent>
          </Card>
          
          <CalculationTriggerSection 
            isLoading={isLoadingCalculations}
            onCalculate={handleCalculateDetails}
          />

          {/* Display Calculation Results */}
          {calculationError && (
            <Alert variant="destructive" className="mt-6">
              <AlertTitle>Calculation Error</AlertTitle>
              <AlertDescription>{calculationError}</AlertDescription>
            </Alert>
          )}
          {calculationResults && !calculationError && (
            <CalculationResultsDisplay results={calculationResults} error={null} />
          )}

          {/* Line Items Table - Display after calculations are done */}
          {calculationResults && !calculationError && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>Review and edit the generated line items.</CardDescription>
              </CardHeader>
              <CardContent>
                <LineItemsTable 
                  control={control} 
                  register={register} 
                  watch={watch} 
                  setValue={setValue} 
                />
              </CardContent>
            </Card>
          )}

          {/* Discount Section */}
          <DiscountSection />

          {/* Totals Display Section */}
          <TotalsDisplay />

          {/* Submission Status Feedback */}
          {submissionStatus && (
            <Alert variant={submissionStatus.type === 'error' ? 'destructive' : 'default'} className="mt-6">
              <AlertTitle>{submissionStatus.type === 'error' ? 'Save Failed' : 'Save Successful'}</AlertTitle>
              <AlertDescription>{submissionStatus.message}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isSubmitting || isLoadingCalculations}>
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              "Save Estimate"
            )}
          </Button>
        </form>
      </Form>
    </FormProvider>
  );
} 