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
import { roundGpm } from "@/lib/utils";
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

export default function EstimateForm() {
  const methods = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema as typeof estimateFormSchema),
    defaultValues: initialFormValues,
  });

  const [mappedVoltage, setMappedVoltage] = useState<240 | 480 | null>(null);
  const [voltageWarning, setVoltageWarning] = useState<string | null>(null);

  const watchedGpm = methods.watch("gpm");
  const watchedVoltageInput = methods.watch("voltageInput");

  useEffect(() => {
    if (watchedVoltageInput === undefined || watchedVoltageInput === null || isNaN(watchedVoltageInput)) {
      setMappedVoltage(null);
      setVoltageWarning(null);
      return;
    }
    const rawVoltage = Number(watchedVoltageInput);
    if ([220, 230, 240].includes(rawVoltage)) {
      setMappedVoltage(240);
      setVoltageWarning(null);
    } else if ([440, 460, 480].includes(rawVoltage)) {
      setMappedVoltage(480);
      setVoltageWarning(null);
    } else {
      setMappedVoltage(null);
      setVoltageWarning("Invalid voltage. Accepted values: 220, 230, 240, 440, 460, 480. Mapped value will be null.");
    }
  }, [watchedVoltageInput]);

  const onSubmit = (data: EstimateFormValues) => {
    console.log('Form Submitted:', data);
    // TODO: Implement actual submission logic (e.g., call server action)
    // This will involve calling calculation engine (Phase 5) then saving (Phase 7)
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
        <CustomerJobInfoSection />
        <TogglesSection /> {/* Added TogglesSection */}
        
        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Well & Pump Specifications</CardTitle>
            <CardDescription>
              Enter the specifications for the well and pump system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* GPM Input (1a) */}
            <FormField
              control={methods.control}
              name="gpm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GPM (Gallons Per Minute)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter GPM (e.g., 100)"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === "" ? Number.NaN : parseFloat(e.target.value);
                        field.onChange(value); // Pass NaN for Zod to handle empty string as invalid number
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Raw GPM: {watchedGpm || 0}. Rounded GPM for calculation: {watchedGpm ? roundGpm(watchedGpm) : 0}.
                    Will be rounded up to the nearest 25, min 55, max 1500.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pump Setting (PS) Input (1b) */}
            <FormField
              control={methods.control}
              name="pumpSetting"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pump Setting (PS) in feet</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter Pump Setting (e.g., 200)"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === "" ? Number.NaN : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                      onBlur={(e) => { // Round on blur
                        const rawValue = e.target.value;
                        if (rawValue === "") {
                          field.onChange(Number.NaN); // Allow Zod to catch empty required field
                        } else {
                          const numValue = parseFloat(rawValue);
                          if (!isNaN(numValue)) {
                            field.onChange(Math.round(numValue));
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Depth at which the pump will be set. Will be rounded to the nearest integer.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PWL Determination Toggle (1c) */}
            <FormField
              control={methods.control}
              name="pwlDeterminationMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>PWL (Pumping Water Level) Determination</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="direct" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Input PWL directly
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="calculate" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Calculate PWL from GPMt, PWLt, SWL (Static Water Level)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional PWL Direct Input (1c) */}
            {methods.watch("pwlDeterminationMethod") === "direct" && (
              <FormField
                control={methods.control}
                name="pwlDirectInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direct PWL Input (feet)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Enter PWL directly (e.g., 150)"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value === "" ? Number.NaN : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                        onBlur={(e) => { // Round on blur
                            const rawValue = e.target.value;
                            if (rawValue === "") {
                              field.onChange(Number.NaN); 
                            } else {
                              const numValue = parseFloat(rawValue);
                              if (!isNaN(numValue)) {
                                field.onChange(Math.round(numValue));
                              }
                            }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Pumping Water Level. Will be rounded to the nearest integer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Fields for PWL Calculation (1c) - shown if method is 'calculate' */}
            {methods.watch("pwlDeterminationMethod") === "calculate" && (
              <div className="space-y-4 pt-4 border-t mt-4">
                <h4 className="text-md font-medium">PWL Calculation Inputs</h4>
                <FormField
                  control={methods.control}
                  name="gpmForPwlCalc" // GPMt
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GPMt (Test GPM)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter Test GPM" {...field} 
                          onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Gallons per minute during test.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={methods.control}
                  name="pwlHistoric" // PWLt
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PWLt (Historic Pumping Water Level in feet)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter Historic PWL" {...field} 
                          onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : parseFloat(e.target.value))}
                          onBlur={(e) => { 
                            const rawValue = e.target.value;
                            if (rawValue === "") { field.onChange(Number.NaN); } 
                            else { const numValue = parseFloat(rawValue); if (!isNaN(numValue)) { field.onChange(Math.round(numValue)); }} 
                          }}
                        />
                      </FormControl>
                      <FormDescription>Rounded to nearest integer.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={methods.control}
                  name="swl" // SWL
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SWL (Static Water Level in feet)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter SWL" {...field} 
                          onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : parseFloat(e.target.value))}
                          onBlur={(e) => { 
                            const rawValue = e.target.value;
                            if (rawValue === "") { field.onChange(Number.NaN); } 
                            else { const numValue = parseFloat(rawValue); if (!isNaN(numValue)) { field.onChange(Math.round(numValue)); }}
                          }}
                        />
                      </FormControl>
                      <FormDescription>Rounded to nearest integer. Must be less than PWLt.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Placeholder for displaying calculated Y and PWL */}
                <div className="p-2 border rounded-md bg-muted">
                  <p className="text-sm text-muted-foreground">Calculated PWL will appear here.</p>
                  {/* Logic for Y and PWL calculation will be added later based on GPM (1a), GPMt, PWLt, SWL */}
                  {/* Y = (GPM from 1a / GPMt)^2 * PWLt */}
                  {/* PWL = Y + SWL, then round PWL */}
                </div>
              </div>
            )}
            
            {/* PSI Input (1d) */}
            <FormField
              control={methods.control}
              name="psi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PSI (Pressure Switch Setting)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="Enter PSI (e.g., 40)"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === "" ? Number.NaN : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                      onBlur={(e) => { // Round on blur
                          const rawValue = e.target.value;
                          if (rawValue === "") {
                            field.onChange(Number.NaN);
                          } else {
                            const numValue = parseFloat(rawValue);
                            if (!isNaN(numValue)) {
                              field.onChange(Math.round(numValue));
                            }
                          }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Pressure switch setting. Will be rounded to the nearest integer. (e.g. 30-50, 40-60)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Voltage Input (1e) */}
            <FormField
              control={methods.control}
              name="voltageInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voltage (Raw Input)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="Enter Voltage (e.g., 230 or 460)"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === "" ? Number.NaN : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter raw voltage (220, 230, 240, 440, 460, 480). Mapped: {mappedVoltage ?? 'N/A'}
                  </FormDescription>
                  {voltageWarning && <p className="text-sm text-amber-600">{voltageWarning}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>Specify additional system components.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Discharge Package Input (1i) */}
            <FormField
              control={methods.control}
              name="dischargePackageOption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discharge Package</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a discharge package" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">Package A</SelectItem>
                      <SelectItem value="B">Package B</SelectItem>
                      <SelectItem value="C">Package C</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the appropriate discharge package configuration.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estimate Details</CardTitle>
            <CardDescription>Provide the specific inputs for the submersible pump estimate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-muted-foreground">
                Estimate Input fields (GPM, PS, PWL, PSI, Voltage, Labor, Discharge) will appear here (Steps 4.4-4.11).
              </p>
            </div>
            {methods.formState.errors.root && (
              <p className="text-sm font-medium text-destructive">
                {methods.formState.errors.root.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Labor Inputs</CardTitle>
            <CardDescription>Enter the labor hours for the job.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Labor Hour Inputs (1f, 1g, 1h) */}
            <FormField
              control={methods.control}
              name="laborPrepJobHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Labor to Prep Job (Hours)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 2" {...field} 
                           onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : parseFloat(e.target.value))}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="laborInstallPumpHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Labor to Install Pump (Hours)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 4" {...field} 
                           onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : parseFloat(e.target.value))}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="laborPerformStartupHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Labor to Perform Start Up (Hours)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 1" {...field} 
                           onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : parseFloat(e.target.value))}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => methods.reset(initialFormValues)}>
            Reset Form
          </Button>
          <Button type="submit" disabled={methods.formState.isSubmitting}>
            {methods.formState.isSubmitting ? 'Calculating...' : 'Calculate & Review (Step 5.5)'}
          </Button>
        </div>
        
        {/* For debugging: display form values */}
        {/* <pre className="mt-4 p-4 border rounded bg-gray-100 dark:bg-gray-800 text-xs">
          {JSON.stringify(methods.watch(), null, 2)}
        </pre> */}
      </form>
    </FormProvider>
  );
} 