import { LineItem, CalculatedEstimateValues, EstimateFormInputs } from './types';
import {
  LABOR_PREP_JOB_RATE_PER_HOUR,
  LABOR_INSTALL_PUMP_RATE_PER_HOUR,
  LABOR_AG_PUMP_STARTUP_RATE_PER_HOUR,
  CONCRETE_PAD_RATE,
  PIPE_PRICE_PER_FOOT_BY_SIZE,
  SOUNDING_TUBE_RATE_PER_FOOT,
  DISCHARGE_BUNDLE_RATES,
  WELL_SEAL_RATE,
  DEFAULT_PUMP_PRICE
} from './constants';

export function generateInitialLineItems(
  formInputs: EstimateFormInputs,
  calculationResults: CalculatedEstimateValues
): LineItem[] {
  const lineItems: LineItem[] = [];

  // 1. Labor to Prep Job Site (Non-Taxable)
  lineItems.push({
    description: "Labor to Prep Job Site",
    quantity: formInputs.laborPrepJobHours,
    rate: LABOR_PREP_JOB_RATE_PER_HOUR,
    total: formInputs.laborPrepJobHours * LABOR_PREP_JOB_RATE_PER_HOUR,
    isTaxable: false,
  });

  // 2. Labor to Install Pump (Non-Taxable)
  lineItems.push({
    description: "Labor to Install Pump",
    quantity: formInputs.laborInstallPumpHours,
    rate: LABOR_INSTALL_PUMP_RATE_PER_HOUR,
    total: formInputs.laborInstallPumpHours * LABOR_INSTALL_PUMP_RATE_PER_HOUR,
    isTaxable: false,
  });

  // 3. Ag Sub Pump Start Up/Test (Non-Taxable)
  lineItems.push({
    description: "Ag Sub Pump Start Up/Test",
    quantity: formInputs.laborStartupHours,
    rate: LABOR_AG_PUMP_STARTUP_RATE_PER_HOUR,
    total: formInputs.laborStartupHours * LABOR_AG_PUMP_STARTUP_RATE_PER_HOUR,
    isTaxable: false,
  });

  // 4. Concrete Pad 4'x4'x4" (Taxable)
  lineItems.push({
    description: "Concrete Pad 4'x4'x4\"",
    quantity: 1,
    rate: CONCRETE_PAD_RATE,
    total: CONCRETE_PAD_RATE,
    isTaxable: true,
  });

  // 5. Submersible Motor (Taxable)
  lineItems.push({
    description: calculationResults.motorDetails.itemDescription || 'Submersible Motor',
    quantity: 1,
    rate: calculationResults.motorDetails.salesPrice,
    total: calculationResults.motorDetails.salesPrice,
    isTaxable: true,
  });

  // 6. Submersible Pump (Taxable)
  const pumpPrice = calculationResults.pumpDetails.price ?? DEFAULT_PUMP_PRICE; // Use price from results, fallback to default
  lineItems.push({
    description: calculationResults.pumpDetails.description || 'Submersible Pump',
    quantity: 1,
    rate: pumpPrice, 
    total: pumpPrice,
    isTaxable: true,
  });

  // 7. Column Pipe (Taxable)
  const pipeSizeKey = calculationResults.pipeSize; // e.g., "2\""
  const pipeRate = PIPE_PRICE_PER_FOOT_BY_SIZE[pipeSizeKey] || 0; // Fallback to 0 if size not in map
  lineItems.push({
    description: `${pipeSizeKey} Column Pipe`,
    quantity: formInputs.pumpSetting, // PS
    rate: pipeRate,
    total: formInputs.pumpSetting * pipeRate,
    isTaxable: true,
  });

  // 8. F&J Wire (Taxable)
  lineItems.push({
    description: `${calculationResults.wireDetails.size} F&J Wire`,
    quantity: calculationResults.wireDetails.totalLength,
    rate: calculationResults.wireDetails.salesPricePerFt,
    total: calculationResults.wireDetails.totalLength * calculationResults.wireDetails.salesPricePerFt,
    isTaxable: true,
  });

  // 9. Sounding Tube (Taxable)
  lineItems.push({
    description: '1/2" Poly Sounding Tube',
    quantity: formInputs.pumpSetting, // PS
    rate: SOUNDING_TUBE_RATE_PER_FOOT,
    total: formInputs.pumpSetting * SOUNDING_TUBE_RATE_PER_FOOT,
    isTaxable: true,
  });

  // 10. Discharge Bundle (Taxable)
  const dischargePackageKey = formInputs.dischargePackage as keyof typeof DISCHARGE_BUNDLE_RATES;
  const dischargeRate = DISCHARGE_BUNDLE_RATES[dischargePackageKey] || 0;
  lineItems.push({
    description: `Discharge Package ${formInputs.dischargePackage}`,
    quantity: 1,
    rate: dischargeRate,
    total: dischargeRate,
    isTaxable: true,
  });

  // 11. Well Seal (Taxable)
  lineItems.push({
    description: "Well Seal",
    quantity: 1,
    rate: WELL_SEAL_RATE,
    total: WELL_SEAL_RATE,
    isTaxable: true,
  });

  return lineItems.map(item => ({ ...item, id: crypto.randomUUID() }));
}

// Utility to round to a specified number of decimal places
export const roundToDecimal = (value: number, decimals: number): number => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
};

// Ensure all totals are rounded to 2 decimal places
export function generateAndRoundInitialLineItems(
    formInputs: EstimateFormInputs,
    calculationResults: CalculatedEstimateValues
  ): LineItem[] {
    const rawLineItems = generateInitialLineItems(formInputs, calculationResults);
    return rawLineItems.map(item => ({
        ...item,
        quantity: roundToDecimal(item.quantity, 2),
        rate: roundToDecimal(item.rate, 2),
        total: roundToDecimal(item.quantity * item.rate, 2) // Recalculate total with rounded q/r
    }));
  } 