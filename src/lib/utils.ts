import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes (house pattern from FavFan `src/lib/utils.ts`). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
