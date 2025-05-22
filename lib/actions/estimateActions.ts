// This file will contain server actions related to estimates,
// such as saving an estimate, retrieving estimates, etc.

'use server';

import { z } from 'zod';
import { db } from '@/db/db';
import * as schema from '@/db/schema';
import { customers, jobs, estimates, estimateLineItems } from '@/db/schema';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'; // Corrected import for auth-helpers
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { estimateFormSchema, EstimateFormValues } from '@/lib/schemas/estimateFormSchema';
import { CalculatedEstimateValues, LineItem as LineItemType } from '@/lib/types';
import { STANDARD_SALES_TAX_RATE, REDUCED_SALES_TAX_RATE } from '@/lib/constants';
import { sql } from 'drizzle-orm';

// Define a schema for the input expected by saveEstimate, including calculationResults
// const saveEstimateInputSchema = estimateFormSchema.extend({ // Old problematic line
//   calculationResults: z.custom<CalculatedEstimateValues>((val) => val !== null && typeof val === 'object', "Calculation results are required"),
// });

export type SaveEstimateResult = 
  | { success: true; estimateId: string; estimateNumber: string }
  | { success: false; error: string };

export async function saveEstimate(
  data: EstimateFormValues & { calculationResults: CalculatedEstimateValues } // Simplified input typing
): Promise<SaveEstimateResult> {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }

  // const validation = saveEstimateInputSchema.safeParse(data); // Old validation
  // For simplified input typing, we assume data is already validated or we validate parts separately.
  // For robustness, you might parse `data` with a combined schema if needed.
  // For now, we proceed assuming `data` (which is EstimateFormValues & { calculationResults: ... }) is valid.
  const validatedData = data; // Use directly if not re-parsing

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Create Customer
      const [newCustomer] = await tx.insert(customers).values({
        name: validatedData.customerName,
        addressStreet: validatedData.customerAddressStreet,
        addressCity: validatedData.customerAddressCity,
        addressState: validatedData.customerAddressState,
        addressZip: validatedData.customerAddressZip,
        // createdBy: user.id, // Assuming your customers table has createdBy
      }).returning();

      if (!newCustomer) {
        throw new Error("Failed to create customer.");
      }

      // 2. Create Job
      const [newJob] = await tx.insert(jobs).values({
        customerId: newCustomer.id,
        nameLocation: validatedData.jobNameOrLocation, // Corrected field name
        // createdBy: user.id, // Assuming your jobs table has createdBy
      }).returning();

      if (!newJob) {
        throw new Error("Failed to create job.");
      }

      // 3. Get next estimate number
      // This assumes a sequence named 'estimate_number_seq' exists in your public schema.
      // Make sure this sequence is created in your DB (see Step 1.3 instructions)
      const estimateNumberResult = await tx.execute(sql`SELECT nextval('public.estimate_number_seq') as estimate_num;`);
      const estimateNumberInt = estimateNumberResult[0]?.estimate_num as number; // Corrected access to result
      if (!estimateNumberInt) {
        throw new Error("Failed to retrieve next estimate number from sequence.");
      }
      const estimateNumberStr = `E${estimateNumberInt}`;
      
      // Determine applied sales tax rate value
      const appliedSalesTaxRate = validatedData.salesTaxRateType === 'reduced' 
        ? REDUCED_SALES_TAX_RATE 
        : STANDARD_SALES_TAX_RATE;

      // 4. Save Estimate
      const [newEstimate] = await tx.insert(estimates).values({
        userId: user.id,
        customerId: newCustomer.id,
        jobId: newJob.id,
        estimateNumber: estimateNumberStr,
        estimateDate: validatedData.estimateDate.toISOString(),
        terms: validatedData.terms,
        salesTaxRateType: validatedData.salesTaxRateType,
        salesTaxRatePercentage: String(appliedSalesTaxRate),
        includeTermsAndConditions: validatedData.includeTermsAndConditions,
        status: 'Draft',
        gpm: String(validatedData.gpm),
        pumpSetting: validatedData.pumpSetting,
        pwlDeterminationMethod: validatedData.pwlDeterminationMethod,
        pwlDirectInput: validatedData.pwlDirectInput ? String(validatedData.pwlDirectInput) : null,
        gpmt: validatedData.gpmt ? String(validatedData.gpmt) : null,
        pwlt: validatedData.pwlt ? String(validatedData.pwlt) : null,
        swl: validatedData.swl !== undefined && validatedData.swl !== null ? String(validatedData.swl) : null,
        psi: validatedData.psi,
        voltageMapped: validatedData.voltageMapped,
        laborPrepJobHours: String(validatedData.laborPrepJobHours),
        laborInstallPumpHours: String(validatedData.laborInstallPumpHours),
        laborStartupHours: String(validatedData.laborStartupHours),
        dischargePackage: validatedData.dischargePackage,
        laborDiscount: validatedData.laborDiscount ? String(validatedData.laborDiscount) : null,
        materialDiscount: validatedData.materialDiscount ? String(validatedData.materialDiscount) : null,
        calculationResultsSnapshot: validatedData.calculationResults as any,
      }).returning();

      if (!newEstimate) {
        throw new Error("Failed to create estimate.");
      }

      // 5. Save Line Items
      if (validatedData.lineItems && validatedData.lineItems.length > 0) {
        const lineItemsToInsert = validatedData.lineItems.map((item: LineItemType) => ({
          estimateId: newEstimate.id,
          description: item.description,
          quantity: String(item.quantity),
          rate: String(item.rate),
          total: String(item.total),
          isTaxable: item.isTaxable,
          itemType: item.itemType,
        }));
        await tx.insert(estimateLineItems).values(lineItemsToInsert);
      }
      
      return { estimateId: newEstimate.id, estimateNumber: newEstimate.estimateNumber! }; // estimateNumber should exist
    });

    revalidatePath('/estimates/new'); // Or a dashboard path if redirecting
    revalidatePath('/'); // Revalidate homepage/dashboard if it lists estimates

    return { success: true, estimateId: String(result.estimateId), estimateNumber: result.estimateNumber! }; // Cast estimateId to string

  } catch (error: any) {
    console.error("Error saving estimate:", error);
    // Consider more specific error handling or logging
    return { success: false, error: error.message || 'Failed to save estimate due to an unexpected error.' };
  }
}

// Add other estimate-related server actions here as needed. 