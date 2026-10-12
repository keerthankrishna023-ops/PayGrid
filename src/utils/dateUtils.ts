import { Bill, BillingFrequency } from '../types/bill';

// Standard reference date matching local system time: 2026-10-09
export const CURRENT_DATE_STRING = '2026-10-09';
export const CURRENT_DATE = new Date(CURRENT_DATE_STRING);

export function getToday(): Date {
  return new Date(CURRENT_DATE_STRING);
}

export function parseDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateStr);
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getDaysDifference(targetDateStr: string): number {
  const target = parseDate(targetDateStr);
  const today = getToday();
  // normalize to midnight
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function isBillOverdue(bill: Bill): boolean {
  if (bill.status === 'paid') return false;
  return getDaysDifference(bill.dueDate) < 0;
}

export function calculatePotentialLateFee(bill: Bill): number {
  if (bill.status === 'paid') return 0;
  const daysDiff = getDaysDifference(bill.dueDate);
  if (daysDiff >= 0) return 0; // Not overdue yet

  const overdueDays = Math.abs(daysDiff);
  const { type, amount, graceDays } = bill.lateFeeRule;

  if (overdueDays <= graceDays) {
    return 0; // Within grace period
  }

  const billableOverdueDays = overdueDays - graceDays;

  if (type === 'fixed') {
    return amount;
  }

  if (type === 'percentage_monthly') {
    // percentage monthly rate, pro-rated by months or flat monthly rate
    const monthsOverdue = Math.max(1, Math.ceil(billableOverdueDays / 30));
    return Math.round((bill.amount * (amount / 100)) * monthsOverdue);
  }

  if (type === 'daily_slab') {
    // e.g. amount per day overdue
    return Math.round(amount * billableOverdueDays);
  }

  return 0;
}

export function getNextDueDate(currentDueDateStr: string, frequency: BillingFrequency): string {
  const d = parseDate(currentDueDateStr);
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  let nextDate: Date;
  switch (frequency) {
    case 'monthly':
      nextDate = new Date(year, month + 1, day);
      break;
    case 'quarterly':
      nextDate = new Date(year, month + 3, day);
      break;
    case 'half-yearly':
      nextDate = new Date(year, month + 6, day);
      break;
    case 'annual':
      nextDate = new Date(year + 1, month, day);
      break;
    case 'one-time':
    default:
      return currentDueDateStr;
  }

  const yyyy = nextDate.getFullYear();
  const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
  const dd = String(nextDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
