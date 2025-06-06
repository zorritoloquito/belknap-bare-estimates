// This file will contain server actions related to estimates,
// such as saving an estimate, retrieving estimates, etc.

'use server';

import { db } from '@/db/db';
import { customers, jobs, estimates, estimateLineItems } from '@/db/schema';
import { createServerClient } from '@supabase/ssr'; // Use createServerClient instead
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { EstimateFormValues } from '@/lib/schemas/estimateFormSchema';
import { CalculatedEstimateValues, LineItem as LineItemType } from '@/lib/types';
import { STANDARD_SALES_TAX_RATE, REDUCED_SALES_TAX_RATE } from '@/lib/constants';
import { sql, eq, desc } from 'drizzle-orm';

// Define a schema for the input expected by saveEstimate, including calculationResults
// const saveEstimateInputSchema = estimateFormSchema.extend({ // Old problematic line
//   calculationResults: z.custom<CalculatedEstimateValues>((val) => val !== null && typeof val === 'object', "Calculation results are required"),
// });

export type SaveEstimateResult = 
  | { success: true; estimateId: string; estimateNumber: string }
  | { success: false; error: string };

export type EstimateListItem = {
  id: number;
  estimateNumber: string;
  customerName: string;
  estimateDate: string;
  status: string;
  totalAmount: number; // This will be calculated client-side for now, but could be stored
};

export type GetUserEstimatesResult = 
  | { success: true; estimates: EstimateListItem[] }
  | { success: false; error: string };

export async function getUserEstimates(): Promise<GetUserEstimatesResult> {
  // Create Supabase client with Next.js 15 compatible cookies handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookies()).get(name)?.value;
        },
        async set(name: string, value: string, options: Record<string, unknown>) {
          (await cookies()).set({ name, value, ...options });
        },
        async remove(name: string, options: Record<string, unknown>) {
          (await cookies()).set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    // Fetch estimates with customer information
    const estimatesWithCustomers = await db
      .select({
        id: estimates.id,
        estimateNumber: estimates.estimateNumber,
        estimateDate: estimates.estimateDate,
        status: estimates.status,
        customerName: customers.name,
      })
      .from(estimates)
      .innerJoin(customers, eq(estimates.customerId, customers.id))
      .where(eq(estimates.userId, user.id))
      .orderBy(desc(estimates.createdAt));

    // For now, we'll set totalAmount to 0 since we'd need to calculate it from line items
    // This could be optimized by storing the total in the estimates table or calculating it here
    const estimatesList: EstimateListItem[] = estimatesWithCustomers.map(estimate => ({
      id: estimate.id,
      estimateNumber: estimate.estimateNumber || '',
      customerName: estimate.customerName,
      estimateDate: estimate.estimateDate || '',
      status: estimate.status || 'Draft',
      totalAmount: 0, // TODO: Calculate from line items or store in estimates table
    }));

    return { success: true, estimates: estimatesList };

  } catch (error: unknown) {
    console.error("Error fetching user estimates:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage || 'Failed to fetch estimates due to an unexpected error.' };
  }
}

export async function saveEstimate(
  data: EstimateFormValues & { calculationResults: CalculatedEstimateValues } // Simplified input typing
): Promise<SaveEstimateResult> {
  // Create Supabase client with Next.js 15 compatible cookies handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookies()).get(name)?.value;
        },
        async set(name: string, value: string, options: Record<string, unknown>) {
          (await cookies()).set({ name, value, ...options });
        },
        async remove(name: string, options: Record<string, unknown>) {
          (await cookies()).set({ name, value: '', ...options });
        },
      },
    }
  );

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
        calculationResultsSnapshot: validatedData.calculationResults,
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

  } catch (error: unknown) {
    console.error("Error saving estimate:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage || 'Failed to save estimate due to an unexpected error.' };
  }
}

export type ApproveEstimateResult = 
  | { success: true }
  | { success: false; error: string };

export async function approveEstimate(estimateId: number): Promise<ApproveEstimateResult> {
  // Create Supabase client with Next.js 15 compatible cookies handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookies()).get(name)?.value;
        },
        async set(name: string, value: string, options: Record<string, unknown>) {
          (await cookies()).set({ name, value, ...options });
        },
        async remove(name: string, options: Record<string, unknown>) {
          (await cookies()).set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    // First, verify that the estimate belongs to the current user and is in Draft status
    const existingEstimate = await db
      .select({
        id: estimates.id,
        status: estimates.status,
        userId: estimates.userId,
      })
      .from(estimates)
      .where(eq(estimates.id, estimateId))
      .limit(1);

    if (!existingEstimate.length) {
      return { success: false, error: 'Estimate not found.' };
    }

    const estimate = existingEstimate[0];

    // Check if the estimate belongs to the current user
    if (estimate.userId !== user.id) {
      return { success: false, error: 'You do not have permission to approve this estimate.' };
    }

    // Check if the estimate is in Draft status
    if (estimate.status !== 'Draft') {
      return { success: false, error: `Cannot approve estimate. Current status is '${estimate.status}'. Only estimates with 'Draft' status can be approved.` };
    }

    // Update the estimate status to 'Approved'
    await db
      .update(estimates)
      .set({ 
        status: 'Approved',
        updatedAt: new Date() // Assuming you have an updatedAt field
      })
      .where(eq(estimates.id, estimateId));

    // Revalidate the estimate detail page and dashboard
    revalidatePath(`/estimates/${estimateId}`);
    revalidatePath('/');

    return { success: true };

  } catch (error: unknown) {
    console.error("Error approving estimate:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: `Failed to approve estimate: ${errorMessage}` };
  }
}

// Add other estimate-related server actions here as needed. 