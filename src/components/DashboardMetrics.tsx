import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, IndianRupee, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Bill, PaymentRecord } from '../types/bill';
import { formatCurrency, getDaysDifference, calculatePotentialLateFee } from '../utils/dateUtils';

interface DashboardMetricsProps {
  bills: Bill[];
  paymentRecords: PaymentRecord[];
  monthlyBudget: number;
  onOpenPayModal: (bill: Bill) => void;
  onNavigateToOverdue: () => void;
  onNavigateToAnalytics?: () => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  bills,
  paymentRecords,
  monthlyBudget,
  onOpenPayModal,
  onNavigateToOverdue,
  onNavigateToAnalytics,
}) => {
  // Pending bills
  const pendingBills = bills.filter((b) => b.status !== 'paid');
  const overdueBills = pendingBills.filter((b) => getDaysDifference(b.dueDate) < 0);

  const totalOutstanding = pendingBills.reduce((acc, b) => acc + b.amount, 0);
  const totalLateFees = overdueBills.reduce((acc, b) => acc + calculatePotentialLateFee(b), 0);

  // Paid this month (Oct 2026)
  const currentMonthPaid = paymentRecords
    .filter((r) => {
      const d = new Date(r.paidDate);
      return d.getFullYear() === 2026 && d.getMonth() === 9; // October is 9
    })
    .reduce((acc, r) => acc + r.amountPaid, 0);

  const budgetUsagePercent = Math.min(100, Math.round((currentMonthPaid / (monthlyBudget || 1)) * 100));

  // Frequency upcoming stats
  const monthlyCount = bills.filter((b) => b.billingFrequency === 'monthly').length;
  const quarterlyCount = bills.filter((b) => b.billingFrequency === 'quarterly').length;
  const halfYearlyCount = bills.filter((b) => b.billingFrequency === 'half-yearly').length;

  return (
    <div className="space-y-6">
      {/* High-Priority Overdue Alert Banner if missed payments exist */}
      {overdueBills.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 sm:p-5 text-slate-900 transition-all shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-rose-900">
                    {overdueBills.length} Missed Payment{overdueBills.length > 1 ? 's' : ''} Detected
                  </h4>
                  <span className="text-xs text-rose-700 font-mono tabular-nums">
                    · {formatCurrency(totalLateFees)} accumulated penalty
                  </span>
                </div>
                <p className="text-xs text-rose-800 mt-1 max-w-2xl">
                  {overdueBills.map((b) => b.title).join(', ')} past due date. Settle via UPI immediately to avoid utility service disconnection and escalating late fee charges.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => onOpenPayModal(overdueBills[0])}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
              >
                Pay {overdueBills[0].title.split(' ')[0]} Now
              </button>
              {overdueBills.length > 1 && (
                <button
                  onClick={onNavigateToOverdue}
                  className="px-3 py-1.5 text-xs font-medium text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  View All ({overdueBills.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Outstanding Balance */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Dues</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span>{pendingBills.length} bills payable</span>
            <span aria-hidden="true">·</span>
            <span>All UPI apps accepted</span>
          </div>
        </div>

        {/* KPI 2: Overdue & Late Fees */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Overdue & Penalties</span>
            <AlertTriangle className={`w-4 h-4 ${overdueBills.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${overdueBills.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatCurrency(totalLateFees)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className={overdueBills.length > 0 ? 'text-rose-600 font-medium' : ''}>
              {overdueBills.length} missed deadline{overdueBills.length === 1 ? '' : 's'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Grace periods active</span>
          </div>
        </div>

        {/* KPI 3: Settled This Month */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Paid This Month</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(currentMonthPaid)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span>October 2026</span>
            <span aria-hidden="true">·</span>
            <span>Receipts verified</span>
          </div>
        </div>

        {/* KPI 4: Monthly Budget Meter */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Monthly Budget Plan</span>
            {monthlyBudget > 0 ? (
              <span className="text-xs font-mono text-slate-700 font-medium">
                {budgetUsagePercent}% used
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">Not set</span>
            )}
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {monthlyBudget > 0 ? formatCurrency(monthlyBudget) : '₹0'}
          </div>
          <div className="mt-2">
            {monthlyBudget > 0 ? (
              <>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      budgetUsagePercent > 90 ? 'bg-rose-500' : budgetUsagePercent > 70 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${budgetUsagePercent}%` }}
                  />
                </div>
                <div className="mt-1.5 text-xs text-slate-500 flex justify-between">
                  <span>Remaining: {formatCurrency(Math.max(0, monthlyBudget - currentMonthPaid))}</span>
                  <span>{pendingBills.length} dues remaining</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Target limit not set</span>
                {onNavigateToAnalytics && (
                  <button
                    type="button"
                    onClick={onNavigateToAnalytics}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Set Budget →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recurrence Cadence Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 shadow-xs">
        <div className="flex items-center gap-2 font-medium text-slate-900">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>Automated Billing Cadence:</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Monthly bills:</span>
            <span className="font-semibold text-slate-900 font-mono tabular-nums">{monthlyCount}</span>
          </div>
          <span aria-hidden="true" className="text-slate-200">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Quarterly dues:</span>
            <span className="font-semibold text-slate-900 font-mono tabular-nums">{quarterlyCount}</span>
          </div>
          <span aria-hidden="true" className="text-slate-200">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Half-yearly commitments:</span>
            <span className="font-semibold text-slate-900 font-mono tabular-nums">{halfYearlyCount}</span>
          </div>
        </div>
        <div className="text-slate-400 hidden lg:block">
          Auto-reminder triggers: 7d, 3d, 1d & due date
        </div>
      </div>
    </div>
  );
};
