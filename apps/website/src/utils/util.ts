import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3000";
export const createConfig = (accessToken: string | null) => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  }
})

