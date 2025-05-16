'use client';

import { useForm, FormProvider, useFormContext, Controller } from 'react-hook-form';
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

// Import calculation actions
import {
  calculateTdh,
  calculateHpAndMatchMotor,
  selectWireSizeAndPrice,
  selectSubmersiblePump
} from "@/lib/actions/calculationActions";

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
          <Label htmlFor="customerStreet">Street Address</Label>
          <Input id="customerStreet" {...register('customerStreet')} />
          {errors.customerStreet && <p className="text-sm text-destructive">{errors.customerStreet.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="customerCity">City</Label>
            <Input id="customerCity" {...register('customerCity')} />
            {errors.customerCity && <p className="text-sm text-destructive">{errors.customerCity.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="customerState">State</Label>
            <Input id="customerState" {...register('customerState')} />
            {errors.customerState && <p className="text-sm text-destructive">{errors.customerState.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="customerZip">ZIP Code</Label>
            <Input id="customerZip" {...register('customerZip')} />
            {errors.customerZip && <p className="text-sm text-destructive">{errors.customerZip.message}</p>}
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
                  date={field.value ? new Date(field.value + 'T00:00:00') : undefined} // Ensure correct Date object conversion from YYYY-MM-DD string
                  setDate={(dateValue) => field.onChange(dateValue ? dateValue.toISOString().split('T')[0] : '')} 
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
            name="salesTaxRateOption"
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
          {errors.salesTaxRateOption && <p className="text-sm text-destructive">{errors.salesTaxRateOption.message}</p>}
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
  customerStreet: "",
  customerCity: "",
  customerState: "",
  customerZip: "",
  jobNameOrLocation: "",
  estimateDate: new Date().toISOString().split("T")[0], // Today's date YYYY-MM-DD
  terms: PDF_TERMS_DEFAULT,
  salesTaxRateOption: "standard",
  includeTermsAndConditions: true,
  gpm: 0,
  pumpSetting: 0, // Initialize pumpSetting
  pwlDeterminationMethod: "direct", // Default to direct input
  pwlDirectInput: undefined, // Optional, so can be undefined initially
  gpmForPwlCalc: undefined,
  pwlHistoric: undefined,
  swl: undefined,
  psi: 0, // Initialize PSI
  voltageInput: 240, // Changed from 0 to a valid initial value like 240
  laborPrepJobHours: 0,
  laborInstallPumpHours: 0,
  laborPerformStartupHours: 0,
  dischargePackageOption: "A", // Initialize dischargePackageOption
  laborDiscountAmount: undefined,
  materialDiscountAmount: undefined,
};

function PwlSection() {
  const { control, watch, setValue, formState: { errors } } = useFormContext<EstimateFormValues>();
  const pwlMethod = watch("pwlDeterminationMethod");
  const gpmt = watch("gpmForPwlCalc");
  const pwlt = watch("pwlHistoric");
  const swl = watch("swl");
  const directPwl = watch("pwlDirectInput");

  // State for calculated PWL if you want to display it within this section
  const [calculatedPwlDisplay, setCalculatedPwlDisplay] = useState<number | null>(null);

  useEffect(() => {
    if (pwlMethod === 'calculate' && gpmt && pwlt && swl && pwlt > swl) {
      // NOTE: The 'pipeId' for calculateY is missing from form inputs.
      // This calculation will not work correctly without pipeId.
      // For now, let's assume a placeholder pipeId or that this logic needs to be revisited based on Step 1c spec for form inputs.
      const placeholderPipeId = 2; // Placeholder - THIS NEEDS TO BE ADDRESSED
      const y = calculateY(gpmt, placeholderPipeId);
      const finalPwl = calculatePwlFromComponents(pwlt, swl, y);
      setCalculatedPwlDisplay(finalPwl);
      // IMPORTANT: Store this finalPwl in the form state so handleCalculateDetails can access it.
      // Option 1: Add 'finalPwl' to EstimateFormValues and schema (preferred)
      // Option 2: Use a temporary field or rely on this component's state (less clean for central handler)
      setValue('finalPwlForCalc', finalPwl, { shouldValidate: true });
    } else if (pwlMethod === 'direct' && directPwl !== undefined) {
        setValue('finalPwlForCalc', directPwl, { shouldValidate: true });
        setCalculatedPwlDisplay(null); // Clear if switched to direct
    } else {
        setValue('finalPwlForCalc', undefined);
        setCalculatedPwlDisplay(null);
    }
  }, [pwlMethod, gpmt, pwlt, swl, directPwl, setValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>PWL (Pumping Water Level)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="pwlDeterminationMethod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>PWL Determination Method</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2">
                    <FormControl><RadioGroupItem value="direct" /></FormControl>
                    <FormLabel className="font-normal">Input PWL Directly</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                    <FormControl><RadioGroupItem value="calculate" /></FormControl>
                    <FormLabel className="font-normal">Calculate PWL</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {pwlMethod === 'direct' && (
          <FormField
            control={control}
            name="pwlDirectInput"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Direct PWL Input (ft)</FormLabel>
                <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {pwlMethod === 'calculate' && (
          <div className="space-y-4 p-4 border rounded-md">
            <FormField control={control} name="gpmForPwlCalc" render={({ field }) => (<FormItem><FormLabel>GPMt (Test GPM)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={control} name="pwlHistoric" render={({ field }) => (<FormItem><FormLabel>PWLt (Historic PWL, ft)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={control} name="swl" render={({ field }) => (<FormItem><FormLabel>SWL (Static Water Level, ft)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
            {calculatedPwlDisplay !== null && <p className="text-sm font-medium">Calculated PWL for TDH: {calculatedPwlDisplay} ft</p>}
             <p className="text-xs text-muted-foreground">Note: Pipe ID for PWL calculation (Y factor) is currently using a placeholder. This needs to be addressed for accurate PWL calculation.</p>
          </div>
        )}
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
  tdhResult,
  hpMotorResult,
  wireDetailsResult,
  pumpSelectionResult,
  error
}: {
  tdhResult: TdhCalculationResult | null;
  hpMotorResult: HpAndMotorResult | null;
  wireDetailsResult: WireDetailsResult | null;
  pumpSelectionResult: PumpSelectionResult | null;
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

  if (!tdhResult && !hpMotorResult && !wireDetailsResult && !pumpSelectionResult) {
    return null; // Don't display anything if no results yet (and no error)
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Calculation Results</CardTitle>
        <CardDescription>Review the calculated system parameters below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tdhResult && (
          <div className="space-y-1 p-2 border rounded-md">
            <h4 className="font-medium">TDH Details:</h4>
            <p>Calculated TDH: {tdhResult.tdh ?? 'N/A'} ft</p>
            <p>Pipe Size: {tdhResult.pipeSize ?? 'N/A'}</p>
            <p>Friction Loss per Ft: {tdhResult.frictionLossPerFt ?? 'N/A'}</p>
            <p>Total Friction Loss (TFL): {tdhResult.tfl ?? 'N/A'} ft</p>
            <p>Pressure in Feet (from PSI): {tdhResult.pressureInFeet ?? 'N/A'} ft</p>
            {tdhResult.error && <p className="text-sm text-destructive">TDH Error: {tdhResult.error}</p>}
          </div>
        )}
        {hpMotorResult && (
          <div className="space-y-1 p-2 border rounded-md mt-2">
            <h4 className="font-medium">Motor Details:</h4>
            <p>Calculated HP: {hpMotorResult.calculatedHp ?? 'N/A'}</p>
            <p>Selected Motor HP: {hpMotorResult.motorHpRating ?? 'N/A'} HP</p>
            <p>Motor Description: {hpMotorResult.itemDescription ?? 'N/A'}</p>
            <p>Motor Sales Price: ${hpMotorResult.salesPrice?.toFixed(2) ?? 'N/A'}</p>
            {hpMotorResult.error && <p className="text-sm text-destructive">Motor Error: {hpMotorResult.error}</p>}
          </div>
        )}
        {wireDetailsResult && (
          <div className="space-y-1 p-2 border rounded-md mt-2">
            <h4 className="font-medium">Wire Details:</h4>
            <p>Selected Wire Size: {wireDetailsResult.wireSize ?? 'N/A'}</p>
            <p>Total Wire Length: {wireDetailsResult.totalWireLength ?? 'N/A'} ft</p>
            <p>Wire Sales Price per Ft: ${wireDetailsResult.wireSalesPricePerFt?.toFixed(2) ?? 'N/A'}</p>
            {wireDetailsResult.error && <p className="text-sm text-destructive">Wire Error: {wireDetailsResult.error}</p>}
          </div>
        )}
        {pumpSelectionResult && (
          <div className="space-y-1 p-2 border rounded-md mt-2">
            <h4 className="font-medium">Pump Selection:</h4>
            <p>Pump Description: {pumpSelectionResult.submersiblePumpDescription ?? 'N/A'}</p>
            {pumpSelectionResult.error && <p className="text-sm text-destructive">Pump Error: {pumpSelectionResult.error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EstimateForm() {
  const methods = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    // Add 'finalPwlForCalc' to defaultValues if it's added to schema or used as an untyped field
    defaultValues: { ...initialFormValues, finalPwlForCalc: undefined }, 
  });

  const [clientMappedVoltage, setClientMappedVoltage] = useState<240 | 480 | null>(null);
  // const [voltageWarning, setVoltageWarning] = useState<string | null>(null); // Already declared in snippet before

  const watchedGpm = methods.watch("gpm");
  const watchedVoltageInput = methods.watch("voltageInput");
  const form = methods; // Alias for convenience if needed in handler

  // Calculation results state
  const [tdhResult, setTdhResult] = useState<TdhCalculationResult | null>(null);
  const [hpMotorResult, setHpMotorResult] = useState<HpAndMotorResult | null>(null);
  const [wireDetailsResult, setWireDetailsResult] = useState<WireDetailsResult | null>(null);
  const [pumpSelectionResult, setPumpSelectionResult] = useState<PumpSelectionResult | null>(null);
  const [isLoadingCalculations, setIsLoadingCalculations] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  useEffect(() => {
    if (watchedVoltageInput === undefined || watchedVoltageInput === null || isNaN(watchedVoltageInput)) {
      setClientMappedVoltage(null);
      // setVoltageWarning(null); // voltageWarning state is from original code
      return;
    }
    const rawVoltage = Number(watchedVoltageInput);
    const mapped = mapVoltageUtil(rawVoltage); // Use the imported utility
    setClientMappedVoltage(mapped);
    // if (!mapped) {
    //   setVoltageWarning("Invalid voltage. Accepted values: 220, 230, 240, 440, 460, 480. Mapped value will be null.");
    // } else {
    //   setVoltageWarning(null);
    // }
  }, [watchedVoltageInput]);

  const handleCalculateDetails = async () => {
    setIsLoadingCalculations(true);
    setCalculationError(null);
    setTdhResult(null); // Reset previous results
    setHpMotorResult(null);
    setWireDetailsResult(null);
    setPumpSelectionResult(null);

    // Trigger validation for fields required by calculations
    // GPM, PumpSetting, PWL relevant fields, PSI, VoltageInput
    const fieldsToValidate: (keyof EstimateFormValues)[] = [
        'gpm', 'pumpSetting', 'pwlDeterminationMethod', 'psi', 'voltageInput'
    ];
    if (form.getValues("pwlDeterminationMethod") === 'direct') {
        fieldsToValidate.push('pwlDirectInput');
    } else {
        fieldsToValidate.push('gpmForPwlCalc', 'pwlHistoric', 'swl');
    }
    const isValid = await form.trigger(fieldsToValidate);

    if (!isValid) {
      setCalculationError("Please correct the errors in the form inputs above before calculating.");
      setIsLoadingCalculations(false);
      return;
    }

    const formData = form.getValues();
    
    // Determine PWL for TDH calculation
    let pwlForTdh: number | undefined;
    if (formData.pwlDeterminationMethod === 'direct') {
      pwlForTdh = formData.pwlDirectInput;
    } else {
      // This relies on the PwlSection having updated 'finalPwlForCalc' in the form state
      pwlForTdh = formData.finalPwlForCalc;
      if (pwlForTdh === undefined || isNaN(pwlForTdh)){
        setCalculationError("Calculated PWL is not available. Ensure GPMt, PWLt, SWL are valid and PWLt > SWL. Pipe ID for Y calculation is also a placeholder.");
        setIsLoadingCalculations(false);
        return;
      }
    }

    if (pwlForTdh === undefined || isNaN(pwlForTdh)) {
      setCalculationError("PWL could not be determined. Please check PWL inputs.");
      setIsLoadingCalculations(false);
      return;
    }

    if (!clientMappedVoltage) {
        setCalculationError("Voltage is not correctly mapped. Please check voltage input.");
        setIsLoadingCalculations(false);
        return;
    }

    try {
      // Step 1: Calculate TDH
      const tdhInput = {
        gpm: formData.gpm,
        ps: formData.pumpSetting,
        psi: formData.psi,
        pwl: pwlForTdh,
      };
      const tdhResponse = await calculateTdh(tdhInput);
      setTdhResult(tdhResponse);
      if (tdhResponse.error || !tdhResponse.tdh) {
        setCalculationError(tdhResponse.error || "Failed to calculate TDH or TDH is zero.");
        setIsLoadingCalculations(false);
        return;
      }

      // Step 2: Calculate HP and Match Motor
      const hpMotorInput = {
        gpm: formData.gpm,
        tdh: tdhResponse.tdh,
      };
      const hpMotorResponse = await calculateHpAndMatchMotor(hpMotorInput);
      setHpMotorResult(hpMotorResponse);
      if (hpMotorResponse.error || !hpMotorResponse.motorHpRating) {
        setCalculationError(hpMotorResponse.error || "Failed to calculate HP or match motor, or motor HP rating is missing.");
        setIsLoadingCalculations(false);
        return;
      }

      // Step 3: Select Wire Size and Price
      const wireDetailsInput = {
        voltage: clientMappedVoltage, // Use the mapped voltage from state
        pumpSetting: formData.pumpSetting,
        motorHpRating: hpMotorResponse.motorHpRating,
      };
      const wireDetailsResponse = await selectWireSizeAndPrice(wireDetailsInput);
      setWireDetailsResult(wireDetailsResponse);
      if (wireDetailsResponse.error) {
        setCalculationError(wireDetailsResponse.error);
        // Allow continuing to pump selection even if wire fails, but show error
      }
      
      // Step 4: Select Submersible Pump
      const pumpSelectionInput = {
        gpm: formData.gpm,
        tdh: tdhResponse.tdh,
      };
      const pumpSelectionResponse = await selectSubmersiblePump(pumpSelectionInput);
      setPumpSelectionResult(pumpSelectionResponse);
      if (pumpSelectionResponse.error) {
        // Prepend to existing error if wire error also occurred
        const currentError = calculationError ? calculationError + "; " : "";
        setCalculationError(currentError + (pumpSelectionResponse.error || "Failed to select submersible pump."));
      }

    } catch (err: any) {
      console.error("Calculation process failed:", err);
      setCalculationError(err.message || "An unexpected error occurred during the calculation process.");
    }
    setIsLoadingCalculations(false);
  };

  const onSubmit = (data: EstimateFormValues) => {
    console.log('Form Submitted:', data);
    // TODO: Implement actual submission logic (e.g., call server action)
    // This will involve calling calculation engine (Phase 5) then saving (Phase 7)
  };

  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
          <CustomerJobInfoSection />
          <TogglesSection />
          
          {/* Placeholder: All other input sections (GPM, PS, PWL, PSI, Voltage, Labor, Discharge) go here */}
          {/* For example: <GPMInputSection /> ... <VoltageInputSection /> ... */}
          {/* For this step, I'll add the conceptual PWL section to show its role */}
          <PwlSection /> 

          {/* Add other specific input sections if they exist as separate components */}
          {/* Example: If GPM, PS, PSI, Voltage are not in PwlSection or CustomerJobInfoSection */}
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
                    {/* Display mapped voltage and warning if any */}
                    {clientMappedVoltage !== null && <FormDescription>Mapped Voltage: {clientMappedVoltage}V</FormDescription>}
                    {/* {voltageWarning && <p className="text-sm text-destructive">{voltageWarning}</p>} - Assuming original voltageWarning state still exists */}
                    <FormMessage />
                  </FormItem>
                )} />
            </CardContent>
          </Card>
          
          <CalculationTriggerSection 
            isLoading={isLoadingCalculations}
            onCalculate={handleCalculateDetails}
          />

          <CalculationResultsDisplay 
            tdhResult={tdhResult}
            hpMotorResult={hpMotorResult}
            wireDetailsResult={wireDetailsResult}
            pumpSelectionResult={pumpSelectionResult}
            error={calculationError}
          />

          {/* LineItemsTable and TotalsDisplay will be added in Phase 6 */}
          
          <Button type="submit" disabled={methods.formState.isSubmitting || isLoadingCalculations}>
            {methods.formState.isSubmitting ? "Saving..." : "Save Estimate (Placeholder)"}
          </Button>
        </form>
      </Form>
    </FormProvider>
  );
} 