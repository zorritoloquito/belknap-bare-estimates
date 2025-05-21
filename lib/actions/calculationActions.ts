"use server";

import { db } from "@/db/db";
import { pipeChart } from "@/db/schema/lookupPipeChart";
import { roundToHigherMultipleOf25 } from "@/lib/utils";
import { eq, and, lte, gte, asc, or } from "drizzle-orm";
import { z } from "zod";
import { submersibleMotorChart } from "@/db/schema/lookupSubmersibleMotorChart";
import { voltageWireSizeChart240v, voltageWireSizeChart480v } from "@/db/schema/lookupVoltageWireSizeCharts";
import { wirePriceChart } from "@/db/schema/lookupWirePriceChart";
import { pumpSelectionTable } from "@/db/schema/lookupPumpSelectionTable";

// Define the input schema for calculateTdh
const CalculateTdhInputSchema = z.object({
  gpm: z.number().min(50).max(1500), // Rounded GPM from step 1a
  ps: z.number().int().positive(), // Pump Setting from step 1b
  psi: z.number().int().nonnegative(), // PSI from step 1d
  pwl: z.number().int(), // PWL from step 1c (can be calculated or direct)
});

interface TdhCalculationResult {
  tdh: number;
  pipeSize?: string | null;
  frictionLossPerFt?: string | null;
  tfl: number;
  pressureInFeet: number;
  error?: string;
}

export async function calculateTdh(
  input: z.infer<typeof CalculateTdhInputSchema>
): Promise<TdhCalculationResult> {
  try {
    const validatedInput = CalculateTdhInputSchema.safeParse(input);
    if (!validatedInput.success) {
      return {
        tdh: 0,
        tfl: 0,
        pressureInFeet: 0,
        error: "Invalid input: " + JSON.stringify(validatedInput.error.flatten().fieldErrors),
      };
    }

    const { gpm, ps, psi, pwl } = validatedInput.data;

    // Step 2a: Look up Pipe Size and Friction Loss (FL) from pipe_chart using rounded GPM.
    const pipeData = await db
      .select({
        pipeSize: pipeChart.pipeSize,
        frictionLossPerFt: pipeChart.frictionLossPerFt,
      })
      .from(pipeChart)
      // GPM falls within [gpmMin, gpmMax] range
      .where(and(lte(pipeChart.gpmMin, gpm), gte(pipeChart.gpmMax, gpm)))
      .limit(1);

    if (!pipeData || pipeData.length === 0) {
      return {
        tdh: 0,
        tfl: 0,
        pressureInFeet: 0,
        error: `Pipe data not found for GPM: ${gpm}. Please ensure the pipe_chart table is populated correctly and covers this GPM range.`,
      };
    }

    const { pipeSize, frictionLossPerFt } = pipeData[0];

    if (frictionLossPerFt === null || frictionLossPerFt === undefined) {
        return {
            tdh: 0,
            tfl: 0,
            pressureInFeet: 0,
            pipeSize,
            error: `Friction loss data is missing for GPM: ${gpm} (Pipe Size: ${pipeSize}) in pipe_chart.`,
        };
    }
    const frictionLossPerFtNumeric = parseFloat(frictionLossPerFt);
    if (isNaN(frictionLossPerFtNumeric)) {
      return {
        tdh: 0,
        tfl: 0,
        pressureInFeet: 0,
        pipeSize,
        error: `Invalid friction loss data format for GPM: ${gpm} (Pipe Size: ${pipeSize}) in pipe_chart. Expected a number.`,
      };
    }


    // Step 2b: Calculate TFL = FL * PS, round TFL. (FL is per foot)
    const tfl = Math.round(frictionLossPerFtNumeric * ps);

    // Step 2c: Convert PSI to feet (PSI * 2.31), round. If PSI=0, pressure in feet=0.
    const pressureInFeet = psi === 0 ? 0 : Math.round(psi * 2.31);

    // Step 2d: Calculate TDH = PWL + TFL + Pressure in feet, round TDH to nearest higher multiple of 25.
    const calculatedTdh = pwl + tfl + pressureInFeet;
    const tdh = roundToHigherMultipleOf25(calculatedTdh);

    return {
      tdh,
      pipeSize,
      frictionLossPerFt,
      tfl,
      pressureInFeet,
    };
  } catch (error) {
    console.error("Error in calculateTdh:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
      tdh: 0,
      tfl: 0,
      pressureInFeet: 0,
      error: `An unexpected error occurred during TDH calculation: ${errorMessage}`,
    };
  }
}

// --- Step 5.2: HP Calculation and Motor Match Logic ---

const CalculateHpAndMatchMotorInputSchema = z.object({
  gpm: z.number().min(50).max(1500),
  tdh: z.number().positive(),
});

interface MotorDetails {
  motorHpRating: number | null;
  ourCost: number | null;
  salesPrice: number | null;
  itemDescription: string | null;
}

interface HpAndMotorResult extends MotorDetails {
  calculatedHp: number;
  error?: string;
}

export async function calculateHpAndMatchMotor(
  input: z.infer<typeof CalculateHpAndMatchMotorInputSchema>
): Promise<HpAndMotorResult> {
  try {
    const validatedInput = CalculateHpAndMatchMotorInputSchema.safeParse(input);
    if (!validatedInput.success) {
      return {
        calculatedHp: 0,
        motorHpRating: null,
        ourCost: null,
        salesPrice: null,
        itemDescription: null,
        error: "Invalid input: " + JSON.stringify(validatedInput.error.flatten().fieldErrors),
      };
    }

    const { gpm, tdh } = validatedInput.data;

    const rawHp = (gpm * tdh * 0.746) / (0.60 * 3960);
    const calculatedHp = parseFloat(rawHp.toFixed(1));

    if (calculatedHp < 3.5 || calculatedHp > 160) {
      return {
        calculatedHp,
        motorHpRating: null,
        ourCost: null,
        salesPrice: null,
        itemDescription: null,
        error: `Calculated HP (${calculatedHp}) is outside the valid range (3.5 - 160 HP).`,
      };
    }

    // Find motor where calculatedHp is between hpMin and hpMax
    const motorDataResult = await db
      .select({
        motorHpRating: submersibleMotorChart.hpRating,
        ourCost: submersibleMotorChart.ourCost,
        salesPrice: submersibleMotorChart.salesPrice,
        itemDescription: submersibleMotorChart.itemDescription,
      })
      .from(submersibleMotorChart)
      .where(
        and(
          lte(submersibleMotorChart.hpMin, calculatedHp.toString()),
          gte(submersibleMotorChart.hpMax, calculatedHp.toString())
        )
      )
      .limit(1);

    if (!motorDataResult || motorDataResult.length === 0) {
      return {
        calculatedHp,
        motorHpRating: null,
        ourCost: null,
        salesPrice: null,
        itemDescription: null,
        error: `No matching submersible motor found for calculated HP: ${calculatedHp}. Check submersible_motor_chart for a valid range (hpMin <= ${calculatedHp} <= hpMax).`,
      };
    }
    const motorData = motorDataResult[0];

    // Convert numeric fields from string (if they are) to number
    const motorHpRatingNum = motorData.motorHpRating ? parseFloat(motorData.motorHpRating) : null;
    const ourCostNum = motorData.ourCost ? parseFloat(motorData.ourCost) : null;
    const salesPriceNum = motorData.salesPrice ? parseFloat(motorData.salesPrice) : null;

    if (motorData.motorHpRating !== null && isNaN(motorHpRatingNum!)) {
       return { calculatedHp, motorHpRating: null, ourCost: null, salesPrice: null, itemDescription: null, error: "Motor HP rating from DB is not a valid number."};
    }


    return {
      calculatedHp,
      motorHpRating: motorHpRatingNum,
      ourCost: ourCostNum,
      salesPrice: salesPriceNum,
      itemDescription: motorData.itemDescription,
    };
  } catch (error) {
    console.error("Error in calculateHpAndMatchMotor:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
      calculatedHp: 0,
      motorHpRating: null,
      ourCost: null,
      salesPrice: null,
      itemDescription: null,
      error: `An unexpected error occurred during HP calculation: ${errorMessage}`,
    };
  }
}

// --- Step 5.3: Wire Size Selection Logic ---

const SelectWireSizeAndPriceInputSchema = z.object({
  voltage: z.union([z.literal(240), z.literal(480)]),
  pumpSetting: z.number().int().positive(),
  motorHpRating: z.number().positive(),
});

interface WireDetails {
  wireSize: string | null;
  totalWireLength: number;
  wireSalesPricePerFt: number | null;
  error?: string;
}

export async function selectWireSizeAndPrice(
  input: z.infer<typeof SelectWireSizeAndPriceInputSchema>
): Promise<WireDetails> {
  try {
    const validatedInput = SelectWireSizeAndPriceInputSchema.safeParse(input);
    if (!validatedInput.success) {
      return {
        wireSize: null,
        totalWireLength: 0,
        wireSalesPricePerFt: null,
        error: "Invalid input: " + JSON.stringify(validatedInput.error.flatten().fieldErrors),
      };
    }

    const { voltage, pumpSetting, motorHpRating } = validatedInput.data;

    const selectedVoltageChart = voltage === 240 ? voltageWireSizeChart240v : voltageWireSizeChart480v;

    // Lookup wire size:
    // motorHp in chart should match motorHpRating from input.
    // pumpSetting from input should be between pumpSettingMinFt and pumpSettingMaxFt.
    const wireSizeDataResult = await db
      .select({
        wireSizeAwg: selectedVoltageChart.wireSizeAwg,
      })
      .from(selectedVoltageChart)
      .where(
        and(
          eq(selectedVoltageChart.motorHp, motorHpRating.toString()),
          lte(selectedVoltageChart.pumpSettingMinFt, pumpSetting),
          gte(selectedVoltageChart.pumpSettingMaxFt, pumpSetting)
        )
      )
      .orderBy(asc(selectedVoltageChart.wireSizeAwg))
      .limit(1);

    if (!wireSizeDataResult || wireSizeDataResult.length === 0 || !wireSizeDataResult[0].wireSizeAwg) {
      return {
        wireSize: null,
        totalWireLength: 0,
        wireSalesPricePerFt: null,
        error: `Wire size not found for Voltage: ${voltage}V, Motor HP: ${motorHpRating}, Pump Setting: ${pumpSetting}ft. Check voltage_wire_size_charts. Ensure a record exists where motorHp matches and ${pumpSetting} is within pumpSettingMinFt and pumpSettingMaxFt.`,
      };
    }
    const determinedWireSize = wireSizeDataResult[0].wireSizeAwg;

    const totalWireLength = pumpSetting + 20;

    const priceDataResult = await db
      .select({ salesPricePerFt: wirePriceChart.salesPricePerFt })
      .from(wirePriceChart)
      .where(eq(wirePriceChart.wireSize, determinedWireSize))
      .limit(1);

    if (!priceDataResult || priceDataResult.length === 0 || priceDataResult[0].salesPricePerFt === null) {
      return {
        wireSize: determinedWireSize,
        totalWireLength,
        wireSalesPricePerFt: null,
        error: `Wire price not found for wire size: ${determinedWireSize}. Check wire_price_chart.`,
      };
    }
    
    const salesPricePerFtNum = parseFloat(priceDataResult[0].salesPricePerFt);
    if(isNaN(salesPricePerFtNum)) {
        return { wireSize: determinedWireSize, totalWireLength, wireSalesPricePerFt: null, error: `Wire price for ${determinedWireSize} is not a valid number.` };
    }

    return {
      wireSize: determinedWireSize,
      totalWireLength,
      wireSalesPricePerFt: salesPricePerFtNum,
    };
  } catch (error) {
    console.error("Error in selectWireSizeAndPrice:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
      wireSize: null,
      totalWireLength: 0,
      wireSalesPricePerFt: null,
      error: `An unexpected error occurred during wire selection: ${errorMessage}`,
    };
  }
}

// --- Step 5.4: Submersible Pump Selection Logic ---

const SelectSubmersiblePumpInputSchema = z.object({
  gpm: z.number().int().min(50).max(1500), // Rounded GPM from 1a
  tdh: z.number().int().positive(),      // Rounded TDH from 2d (Step 5.1)
});

interface PumpSelectionResult {
  submersiblePumpDescription: string | null;
  error?: string;
}

export async function selectSubmersiblePump(params: {
  gpm: number;
  tdh: number;
}): Promise<{
  data?: { pumpDescription: string; salesPrice: number };
  error?: string;
}> {
  if (!db) {
    return { error: "Database connection not available." };
  }
  try {
    const { gpm, tdh } = params;

    const result = await db
      .select({
        pumpDescription: pumpSelectionTable.pumpDescription,
        salesPrice: pumpSelectionTable.salesPrice, // Select the salesPrice
      })
      .from(pumpSelectionTable)
      .where(
        and(
          lte(pumpSelectionTable.gpmRangeStart, gpm),
          gte(pumpSelectionTable.gpmRangeEnd, gpm),
          lte(pumpSelectionTable.tdhRangeStart, tdh),
          gte(pumpSelectionTable.tdhRangeEnd, tdh)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return { error: "No matching submersible pump found in pump_selection_table." };
    }
    
    // Ensure salesPrice is a number, converting from string if necessary (Drizzle decimal might return string)
    const salesPriceNum = typeof result[0].salesPrice === 'string' ? parseFloat(result[0].salesPrice) : result[0].salesPrice;
    if (isNaN(salesPriceNum)) {
        return { error: "Sales price for pump is invalid." };
    }

    return { data: { pumpDescription: result[0].pumpDescription, salesPrice: salesPriceNum } };
  } catch (err) {
    console.error("Error in selectSubmersiblePump:", err);
    return { error: "Failed to select submersible pump due to a server error." };
  }
} 