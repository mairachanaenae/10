import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(n: number, currency = "NOK", dec = 2) {
  return (
    currency +
    " " +
    n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })
  );
}

export function pct(n: number, dec = 2) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(dec)}%`;
}
