import { format, formatDistanceToNow, differenceInDays, addDays } from "date-fns";

export const formatMoney = (amount: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export const formatNumber = (n: number): string => new Intl.NumberFormat("en-US").format(n);

export const formatDate = (date: string | Date, fmt = "MMM d, yyyy"): string =>
  format(typeof date === "string" ? new Date(date) : date, fmt);

export const formatDateTime = (date: string | Date): string =>
  format(typeof date === "string" ? new Date(date) : date, "MMM d, yyyy 'at' h:mm a");

export const fromNow = (date: string | Date): string =>
  formatDistanceToNow(typeof date === "string" ? new Date(date) : date, { addSuffix: true });

export const daysUntil = (date: string | Date): number =>
  differenceInDays(typeof date === "string" ? new Date(date) : date, new Date());

export const addBusinessDays = (date: Date, days: number): Date => addDays(date, days);

export const truncate = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, max - 1)}…`;

export const initials = (name: string): string =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const isOnline = (lastSeen: string | null): boolean => {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
};

export const formatOrderNumber = (n: number): string => {
  const year = new Date().getFullYear();
  return `SB-${year}-${String(n).padStart(5, "0")}`;
};

export const countryFlag = (country: string): string => {
  const flags: Record<string, string> = {
    Pakistan: "🇵🇰",
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    India: "🇮🇳",
    Canada: "🇨🇦",
    Australia: "🇦🇺",
    Germany: "🇩🇪",
    France: "🇫🇷",
    Spain: "🇪🇸",
    Brazil: "🇧🇷",
    "United Arab Emirates": "🇦🇪",
    "Saudi Arabia": "🇸🇦",
  };
  return flags[country] || "🌍";
};
