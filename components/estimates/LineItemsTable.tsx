"use client";

import { useEffect } from "react";
import { useFieldArray, Control, UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EstimateFormValues } from "@/lib/schemas/estimateFormSchema"; // Assuming this is where your main form values/schema is defined
import { formatCurrency } from "@/lib/utils"; // Assuming you have a currency formatting util

interface LineItemsTableProps {
  control: Control<EstimateFormValues>;
  register: UseFormRegister<EstimateFormValues>;
  watch: UseFormWatch<EstimateFormValues>;
  setValue: UseFormSetValue<EstimateFormValues>;
}

export function LineItemsTable({ control, register, watch, setValue }: LineItemsTableProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  // Watch for changes in individual line item quantities and rates to update totals
  // This can become complex. A more robust way might be to watch the entire lineItems array
  // or handle calculations within a useEffect hook or a dedicated function.
  // For now, we'll trigger re-renders and calculations based on field changes.

  // Function to update total for a specific line item
  const updateLineItemTotal = (index: number) => {
    const quantityValue = watch(`lineItems.${index}.quantity` as const);
    const rateValue = watch(`lineItems.${index}.rate` as const);
    const quantity = parseFloat(String(quantityValue) || "0");
    const rate = parseFloat(String(rateValue) || "0");
    const total = quantity * rate;
    setValue(`lineItems.${index}.total` as const, total, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Description</TableHead>
            <TableHead className="w-[15%] text-right">Qty</TableHead>
            <TableHead className="w-[15%] text-right">Rate</TableHead>
            <TableHead className="w-[15%] text-right">Total</TableHead>
            <TableHead className="w-[15%]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => {
            const itemPath = `lineItems.${index}` as const;
            const quantity = watch(`${itemPath}.quantity`);
            const rate = watch(`${itemPath}.rate`);
            const total = watch(`${itemPath}.total`);

            // Effect to recalculate total when quantity or rate changes for this specific item
            useEffect(() => {
                const currentQuantity = watch(`${itemPath}.quantity`);
                const currentRate = watch(`${itemPath}.rate`);
                
                const newQuantity = parseFloat(String(currentQuantity) || "0");
                const newRate = parseFloat(String(currentRate) || "0");

                const newTotal = newQuantity * newRate;
                
                if (watch(`${itemPath}.total`) !== newTotal) {
                    setValue(`${itemPath}.total`, newTotal, { shouldValidate: true, shouldDirty: true });
                }
            }, [watch(`${itemPath}.quantity`), watch(`${itemPath}.rate`), index, setValue, watch, itemPath]);


            return (
              <TableRow key={field.id}>
                <TableCell>
                  <Input
                    {...register(`lineItems.${index}.description` as const)}
                    placeholder="Line item description"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    {...register(`lineItems.${index}.quantity` as const , { valueAsNumber: true })}
                    placeholder="0"
                    className="text-right"
                    onChange={() => updateLineItemTotal(index)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`lineItems.${index}.rate` as const, { valueAsNumber: true })}
                    placeholder="0.00"
                    className="text-right"
                    onChange={() => updateLineItemTotal(index)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(total || 0)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1} // Optional: Prevent removing the last item
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Button
        type="button"
        onClick={() => append({ 
          description: "", 
          quantity: 1, 
          rate: 0, 
          total: 0, 
          isTaxable: false 
        })}
        className="mt-4"
        variant="outline"
      >
        Add Item
      </Button>
    </div>
  );
} 