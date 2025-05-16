import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function roundGpm(gpm: number): number {
  if (gpm <= 55) return 55;
  const rounded = Math.ceil(gpm / 25) * 25;
  return Math.min(rounded, 1500); // Cap at 1500
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
