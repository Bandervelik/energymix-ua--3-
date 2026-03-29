import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPayback(years: number): string {
  if (years <= 0 || years > 20) return '> 20 років';
  
  const y = Math.floor(years);
  const m = Math.round((years - y) * 12);
  
  let finalY = y;
  let finalM = m;
  if (finalM === 12) {
    finalY += 1;
    finalM = 0;
  }

  const getYearWord = (num: number) => {
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'років';
    if (lastDigit === 1) return 'рік';
    if (lastDigit >= 2 && lastDigit <= 4) return 'роки';
    return 'років';
  };

  const getMonthWord = (num: number) => {
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'місяців';
    if (lastDigit === 1) return 'місяць';
    if (lastDigit >= 2 && lastDigit <= 4) return 'місяці';
    return 'місяців';
  };

  const parts = [];
  if (finalY > 0) parts.push(`${finalY} ${getYearWord(finalY)}`);
  if (finalM > 0) parts.push(`${finalM} ${getMonthWord(finalM)}`);
  
  return parts.length > 0 ? parts.join(' ') : '0 місяців';
}
