import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** merge conditional + tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
