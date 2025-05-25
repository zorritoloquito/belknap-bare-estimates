'use server';

import { db } from '@/db/db';
import { estimates, customers, jobs, estimateLineItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type ExportEstimatesCsvResult = 
  | { success: true; csv: string }
  | { success: false; error: string };

export async function exportEstimatesAsCsv(): Promise<ExportEstimatesCsvResult> {
  try {
    // Fetch all estimates with related data
    const estimatesData = await db
      .select({
        // Estimate fields
        id: estimates.id,
        estimateNumber: estimates.estimateNumber,
        estimateDate: estimates.estimateDate,
        terms: estimates.terms,
        status: estimates.status,
        salesTaxRateType: estimates.salesTaxRateType,
        salesTaxRatePercentage: estimates.salesTaxRatePercentage,
        includeTermsAndConditions: estimates.includeTermsAndConditions,
        // Customer fields
        customerName: customers.name,
        customerAddressStreet: customers.addressStreet,
        customerAddressCity: customers.addressCity,
        customerAddressState: customers.addressState,
        customerAddressZip: customers.addressZip,
        // Job fields
        jobNameLocation: jobs.nameLocation,
      })
      .from(estimates)
      .innerJoin(customers, eq(estimates.customerId, customers.id))
      .innerJoin(jobs, eq(estimates.jobId, jobs.id))
      .orderBy(estimates.estimateDate);

    if (!estimatesData.length) {
      return { success: false, error: 'No estimates found to export' };
    }

    // Get line items for all estimates to calculate totals
    const allLineItems = await db
      .select()
      .from(estimateLineItems)
      .orderBy(estimateLineItems.estimateId, estimateLineItems.id);

    // Group line items by estimate ID
    const lineItemsByEstimate = allLineItems.reduce((acc, item) => {
      if (!acc[item.estimateId]) {
        acc[item.estimateId] = [];
      }
      acc[item.estimateId].push(item);
      return acc;
    }, {} as Record<number, typeof allLineItems>);

    // CSV Headers
    const headers = [
      'Estimate Number',
      'Date',
      'Status',
      'Customer Name',
      'Customer Address',
      'Job Location',
      'Terms',
      'Subtotal',
      'Sales Tax Rate',
      'Sales Tax Amount',
      'Total Amount',
      'Include Terms & Conditions'
    ];

    // Build CSV rows
    const rows = estimatesData.map(estimate => {
      const lineItems = lineItemsByEstimate[estimate.id] || [];
      
      // Calculate totals
      const subtotal = lineItems.reduce((sum, item) => {
        return sum + parseFloat(item.total || '0');
      }, 0);

      const salesTaxRate = parseFloat(estimate.salesTaxRatePercentage || '0') / 100;
      const salesTax = subtotal * salesTaxRate;
      const totalAmount = subtotal + salesTax;

      // Format customer address
      const customerAddress = [
        estimate.customerAddressStreet,
        estimate.customerAddressCity,
        estimate.customerAddressState,
        estimate.customerAddressZip
      ].filter(Boolean).join(', ');

      // Format date
      const formattedDate = estimate.estimateDate ? 
        new Date(estimate.estimateDate).toLocaleDateString('en-US') : '';

      return [
        estimate.estimateNumber || '',
        formattedDate,
        estimate.status || '',
        estimate.customerName || '',
        customerAddress,
        estimate.jobNameLocation || '',
        estimate.terms || '',
        subtotal.toFixed(2),
        `${estimate.salesTaxRatePercentage || 0}%`,
        salesTax.toFixed(2),
        totalAmount.toFixed(2),
        estimate.includeTermsAndConditions ? 'Yes' : 'No'
      ];
    });

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(field => {
          // Escape fields that contain commas, quotes, or newlines
          if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        }).join(',')
      )
    ].join('\n');

    return { success: true, csv: csvContent };

  } catch (error: unknown) {
    console.error('Error exporting CSV:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: `Failed to export CSV: ${errorMessage}` };
  }
}

export type ExportEstimateLineItemsCsvResult = 
  | { success: true; csv: string }
  | { success: false; error: string };

export async function exportEstimateLineItemsAsCsv(estimateId: number): Promise<ExportEstimateLineItemsCsvResult> {
  try {
    // Fetch estimate data
    const estimateData = await db
      .select({
        estimateNumber: estimates.estimateNumber,
        customerName: customers.name,
        jobNameLocation: jobs.nameLocation,
      })
      .from(estimates)
      .innerJoin(customers, eq(estimates.customerId, customers.id))
      .innerJoin(jobs, eq(estimates.jobId, jobs.id))
      .where(eq(estimates.id, estimateId))
      .limit(1);

    if (!estimateData.length) {
      return { success: false, error: 'Estimate not found' };
    }

    const estimate = estimateData[0];

    // Fetch line items for this estimate
    const lineItems = await db
      .select()
      .from(estimateLineItems)
      .where(eq(estimateLineItems.estimateId, estimateId))
      .orderBy(estimateLineItems.id);

    if (!lineItems.length) {
      return { success: false, error: 'No line items found for this estimate' };
    }

    // CSV Headers
    const headers = [
      'Estimate Number',
      'Customer',
      'Job Location',
      'Line Item Description',
      'Quantity',
      'Rate',
      'Total'
    ];

    // Build CSV rows
    const rows = lineItems.map(item => [
      estimate.estimateNumber || '',
      estimate.customerName || '',
      estimate.jobNameLocation || '',
      item.description || '',
      item.quantity || '',
      item.rate || '',
      item.total || ''
    ]);

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(field => {
          // Escape fields that contain commas, quotes, or newlines
          if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        }).join(',')
      )
    ].join('\n');

    return { success: true, csv: csvContent };

  } catch (error: unknown) {
    console.error('Error exporting line items CSV:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: `Failed to export line items CSV: ${errorMessage}` };
  }
} 