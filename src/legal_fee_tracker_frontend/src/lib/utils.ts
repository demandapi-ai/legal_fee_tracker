import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount / 1000000); // Convert from smallest units
}

export function formatDate(timestamp: number): string {
  return format(new Date(timestamp / 1000000), "MMM dd, yyyy");
}

export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp / 1000000), "MMM dd, yyyy 'at' h:mm a");
}

export function formatTimeAgo(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp / 1000000), { addSuffix: true });
}

export function generateMockPrincipal(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz234567";
  let result = "";
  for (let i = 0; i < 63; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function truncatePrincipal(principal: string): string {
  if (principal.length <= 12) return principal;
  return `${principal.slice(0, 6)}...${principal.slice(-6)}`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
