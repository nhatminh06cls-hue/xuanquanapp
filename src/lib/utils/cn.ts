import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility để merge Tailwind class names, tránh conflict
 * Dùng thay cho className={clsx(...)} ở khắp project
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
