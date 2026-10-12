export type BillCategory =
  | 'electricity'
  | 'water'
  | 'gas'
  | 'broadband'
  | 'mobile'
  | 'dth'
  | 'society'
  | 'property_tax'
  | 'fastag'
  | 'credit_card'
  | 'insurance'
  | 'education'
  | 'subscription';

export type BillingFrequency = 'monthly' | 'quarterly' | 'half-yearly' | 'annual' | 'one-time';

export type BillStatus = 'pending' | 'paid' | 'overdue';

export interface LateFeeRule {
  type: 'fixed' | 'percentage_monthly' | 'daily_slab';
  amount: number; // e.g., ₹100 or 2% per month
  graceDays: number; // grace period in days
}

export interface Bill {
  id: string;
  title: string;
  category: BillCategory;
  provider: string;
  consumerNumber: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  billingFrequency: BillingFrequency;
  billerVpa: string; // UPI ID / VPA
  payeeName: string;
  notes?: string;
  status: BillStatus;
  lastPaidDate?: string;
  lastTransactionRef?: string;
  lateFeeRule: LateFeeRule;
  remindDaysBefore: number[]; // e.g. [7, 3, 1, 0]
  autoRecur: boolean;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  billId: string;
  billTitle: string;
  category: BillCategory;
  provider: string;
  consumerNumber: string;
  amountPaid: number;
  principalAmount: number;
  lateFeePaid: number;
  paidDate: string; // ISO string
  upiRef: string; // UTR number
  upiAppUsed: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'cred' | 'amazonpay' | 'other';
  billingCycle: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  billId: string;
  type: 'overdue' | 'due_today' | 'due_soon' | 'paid';
  title: string;
  message: string;
  daysRemainingOrOverdue: number;
  potentialLateFee?: number;
  date: string;
  isRead: boolean;
}

export interface BudgetConfig {
  monthlyLimit: number;
  currency: string;
}
