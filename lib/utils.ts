import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function roundGpm(gpm: number): number {
  if (gpm <= 50) return 50; // Minimum GPM
  if (gpm >= 1500) return 1500; // Maximum GPM
  return Math.ceil(gpm / 25) * 25;
}

// Helper function for PWL calculation Y = ( (GPMt * 0.4085)^2 ) / (Pipe ID^5)
export function calculateY(gpmT: number, pipeId: number): number {
  if (pipeId === 0) return 0; // Avoid division by zero
  const y = Math.pow(gpmT * 0.4085, 2) / Math.pow(pipeId, 5);
  return parseFloat(y.toFixed(2)); // Round to two decimal places
}

// Helper function to calculate PWL = PWLt + (Y * (SWL - PWLt))
export function calculatePwlFromComponents(pwlt: number, swl: number, y: number): number {
  const pwl = pwlt + (y * (swl - pwlt));
  return Math.round(pwl); // Round to nearest integer
}

export function mapVoltage(voltage: number): 240 | 480 | null {
  if ([220, 230, 240].includes(voltage)) return 240;
  if ([440, 460, 480].includes(voltage)) return 480;
  return null; // Or throw an error, or return original if handling elsewhere
}

export function roundToHigherMultipleOf25(value: number): number {
  return Math.ceil(value / 25) * 25;
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) {
    return "$0.00";
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
