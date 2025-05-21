"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { EstimateFormValues } from "@/lib/schemas/estimateFormSchema";
import { LineItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { REDUCED_SALES_TAX_RATE, STANDARD_SALES_TAX_RATE } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Totals {
  taxableSubtotal: number;
  nonTaxableSubtotal: number;
  subtotal: number;
  salesTaxAmount: number;
  grandTotal: number;
  appliedTaxRate: number;
}

export function TotalsDisplay() {
  const { control } = useFormContext<EstimateFormValues>();

  const lineItems = useWatch({
    control,
    name: "lineItems",
    defaultValue: [],
  });

  const salesTaxRateType = useWatch({
    control,
    name: "salesTaxRateType",
    defaultValue: "standard",
  });

  const calculateTotals = (items: LineItem[], taxType: 'reduced' | 'standard'): Totals => {
    let taxableSubtotal = 0;
    let nonTaxableSubtotal = 0;

    items.forEach(item => {
      const itemTotal = item.total || 0; // Ensure item.total is a number
      if (item.isTaxable) {
        taxableSubtotal += itemTotal;
      } else {
        nonTaxableSubtotal += itemTotal;
      }
    });

    const subtotal = taxableSubtotal + nonTaxableSubtotal;
    const appliedTaxRate = taxType === 'reduced' ? REDUCED_SALES_TAX_RATE : STANDARD_SALES_TAX_RATE;
    const salesTaxAmount = taxableSubtotal * appliedTaxRate;
    const grandTotal = subtotal + salesTaxAmount;

    return {
      taxableSubtotal,
      nonTaxableSubtotal,
      subtotal,
      salesTaxAmount,
      grandTotal,
      appliedTaxRate,
    };
  };

  const totals = calculateTotals(lineItems || [], salesTaxRateType);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Estimate Totals</CardTitle>
        <CardDescription>Summary of all costs and taxes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span>Taxable Subtotal:</span>
          <span>{formatCurrency(totals.taxableSubtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Non-Taxable Subtotal:</span>
          <span>{formatCurrency(totals.nonTaxableSubtotal)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Subtotal:</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Sales Tax ({ (totals.appliedTaxRate * 100).toFixed(2) }%):</span>
          <span>{formatCurrency(totals.salesTaxAmount)}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Grand Total:</span>
          <span>{formatCurrency(totals.grandTotal)}</span>
        </div>
      </CardContent>
    </Card>
  );
} 