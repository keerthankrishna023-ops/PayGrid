import React, { useState } from 'react';
import {
  Download,
  Printer,
  PieChart,
  Wallet,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Database,
  Upload,
} from 'lucide-react';
import { Bill, PaymentRecord } from '../types/bill';
import { CATEGORIES } from '../data/seedData';
import { formatCurrency } from '../utils/dateUtils';
import { exportExpensesToCsv, exportBackupJson, triggerPrintReport } from '../utils/exportUtils';
import { getCategoryIcon } from './BillCard';

interface ExpenseAnalyticsProps {
  bills: Bill[];
  paymentRecords: PaymentRecord[];
  monthlyBudget: number;
  onUpdateMonthlyBudget: (limit: number) => void;
  onImportBackup?: (bills: Bill[], records: PaymentRecord[], budget: number) => void;
}

export const ExpenseAnalytics: React.FC<ExpenseAnalyticsProps> = ({
  bills,
  paymentRecords,
  monthlyBudget,
  onUpdateMonthlyBudget,
  onImportBackup,
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetValue, setBudgetValue] = useState(monthlyBudget);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'monthly' | 'quarterly'>('all');

  // Total paid historical
  const totalPaidAllTime = paymentRecords.reduce((acc, r) => acc + r.amountPaid, 0);
  const totalLateFeesPaid = paymentRecords.reduce((acc, r) => acc + r.lateFeePaid, 0);

  // Group paid expenses by category
  const categorySpending = CATEGORIES.map((cat) => {
    const total = paymentRecords
      .filter((r) => r.category === cat.id)
      .reduce((acc, r) => acc + r.amountPaid, 0);

    const pendingTotal = bills
      .filter((b) => b.category === cat.id && b.status !== 'paid')
      .reduce((acc, b) => acc + b.amount, 0);

    return {
      category: cat,
      paidAmount: total,
      pendingAmount: pendingTotal,
      totalCommitted: total + pendingTotal,
    };
  }).filter((c) => c.paidAmount > 0 || c.pendingAmount > 0);

  const grandCommitted = categorySpending.reduce((acc, c) => acc + c.totalCommitted, 0) || 1;

  // Commitments by billing frequency
  const frequencyStats = {
    monthly: bills
      .filter((b) => b.billingFrequency === 'monthly')
      .reduce((acc, b) => acc + b.amount, 0),
    quarterly: bills
      .filter((b) => b.billingFrequency === 'quarterly')
      .reduce((acc, b) => acc + b.amount, 0),
    halfYearly: bills
      .filter((b) => b.billingFrequency === 'half-yearly')
      .reduce((acc, b) => acc + b.amount, 0),
    annual: bills
      .filter((b) => b.billingFrequency === 'annual')
      .reduce((acc, b) => acc + b.amount, 0),
  };

  const handleSaveBudget = () => {
    onUpdateMonthlyBudget(Math.max(0, Number(budgetValue) || 0));
    setIsEditingBudget(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.bills && parsed.paymentRecords && onImportBackup) {
          onImportBackup(parsed.bills, parsed.paymentRecords, parsed.budgetLimit || monthlyBudget);
          alert('Backup restored successfully!');
        }
      } catch {
        alert('Invalid backup JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Export & Report Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Personal Budgeting & Expense Reports
          </h2>
          <p className="text-xs text-slate-500">
            Export tax and budgeting statements, evaluate utility distribution and recurring commitments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => exportExpensesToCsv(paymentRecords, bills)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={triggerPrintReport}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Printable Statement (PDF)</span>
          </button>

          <button
            onClick={() => exportBackupJson(bills, paymentRecords, monthlyBudget)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            title="Download JSON Backup"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Backup JSON</span>
          </button>

          <label className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors shadow-2xs whitespace-nowrap">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Budget Goal Configuration Strip */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Wallet className="w-4 h-4 text-indigo-400" />
              <span>Target Monthly Utility Spending Budget</span>
            </div>
            {isEditingBudget ? (
              <div className="flex items-center gap-2 mt-2">
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    value={budgetValue}
                    onChange={(e) => setBudgetValue(Number(e.target.value))}
                    className="w-36 pl-6 pr-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={handleSaveBudget}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingBudget(false)}
                  className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-2xl font-bold font-mono tabular-nums">
                  {formatCurrency(monthlyBudget)}
                </span>
                <button
                  onClick={() => setIsEditingBudget(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                >
                  Adjust Budget Goal
                </button>
              </div>
            )}
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800 w-full sm:w-auto">
            <span className="text-xs text-slate-400 block">Total Lifetime Utilities Paid</span>
            <span className="text-xl font-bold font-mono tabular-nums text-emerald-400">
              {formatCurrency(totalPaidAllTime)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
              Saved penalties: 100% on-time tracking
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Cadence Breakdown & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Recurrence Commitments */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Commitment by Billing Cadence
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {bills.length} Total Subscribed Bills
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Monthly Bills (Every Month)
                </span>
                <span className="text-[11px] text-slate-500">
                  Electricity, Broadband, Water, Postpaid Mobile
                </span>
              </div>
              <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                {formatCurrency(frequencyStats.monthly)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Quarterly Bills (Every 3 Months)
                </span>
                <span className="text-[11px] text-slate-500">
                  Apartment Society Maintenance, Quarterly Tuition
                </span>
              </div>
              <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                {formatCurrency(frequencyStats.quarterly)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Half-Yearly Bills (Every 6 Months)
                </span>
                <span className="text-[11px] text-slate-500">
                  Insurance Premiums, Municipal Taxes
                </span>
              </div>
              <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                {formatCurrency(frequencyStats.halfYearly)}
              </span>
            </div>

            {frequencyStats.annual > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    Annual / One-Time Commitments
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Yearly municipal property tax & vehicle insurance
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                  {formatCurrency(frequencyStats.annual)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Category Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Utility Category Allocation
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Paid + Active Dues
            </span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {categorySpending.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No categorized bills yet.
              </p>
            ) : (
              categorySpending.map((item) => {
                const percent = Math.round((item.totalCommitted / grandCommitted) * 100);
                return (
                  <div key={item.category.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-slate-100 text-slate-700">
                          {getCategoryIcon(item.category.id, 'w-3.5 h-3.5')}
                        </div>
                        <span className="font-semibold text-slate-800">
                          {item.category.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span className="text-slate-900 font-medium">
                          {formatCurrency(item.totalCommitted)}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          ({percent}%)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
