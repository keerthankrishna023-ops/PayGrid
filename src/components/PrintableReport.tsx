import React from 'react';
import { Bill, PaymentRecord } from '../types/bill';
import { formatCurrency, formatDisplayDate, formatDateTime } from '../utils/dateUtils';

interface PrintableReportProps {
  bills: Bill[];
  paymentRecords: PaymentRecord[];
  monthlyBudget: number;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({
  bills,
  paymentRecords,
  monthlyBudget,
}) => {
  const totalPaid = paymentRecords.reduce((acc, r) => acc + r.amountPaid, 0);
  const totalLateFees = paymentRecords.reduce((acc, r) => acc + r.lateFeePaid, 0);
  const pendingDues = bills.filter((b) => b.status !== 'paid').reduce((acc, b) => acc + b.amount, 0);

  return (
    <div className="hidden print:block p-8 max-w-4xl mx-auto bg-white text-slate-900 font-sans">
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PayGrid</h1>
          <p className="text-xs text-slate-600 mt-1">
            Personal Utility & Recurring Expenses Statement
          </p>
        </div>
        <div className="text-right text-xs text-slate-500 font-mono">
          <div>Generated on: {new Date().toLocaleDateString('en-IN')}</div>
          <div>Period: October 2026 Fiscal Cycle</div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-4 gap-4 mb-6 border border-slate-200 rounded-lg p-4 bg-slate-50 text-xs">
        <div>
          <div className="text-slate-500">Monthly Budget Plan</div>
          <div className="text-base font-bold font-mono mt-0.5">{formatCurrency(monthlyBudget)}</div>
        </div>
        <div>
          <div className="text-slate-500">Total Settled</div>
          <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">{formatCurrency(totalPaid)}</div>
        </div>
        <div>
          <div className="text-slate-500">Active Pending Dues</div>
          <div className="text-base font-bold font-mono mt-0.5">{formatCurrency(pendingDues)}</div>
        </div>
        <div>
          <div className="text-slate-500">Late Penalties Paid</div>
          <div className="text-base font-bold font-mono text-rose-700 mt-0.5">{formatCurrency(totalLateFees)}</div>
        </div>
      </div>

      {/* Section 1: Completed Payments Ledger */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 border-b pb-1">
          1. Verified UPI Settlements & Receipts
        </h2>
        <table className="w-full text-left text-xs border border-slate-200">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Bill Name</th>
              <th className="p-2">Consumer ID</th>
              <th className="p-2">UPI App</th>
              <th className="p-2">Bank UTR</th>
              <th className="p-2 text-right">Amount (INR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paymentRecords.map((r) => (
              <tr key={r.id}>
                <td className="p-2 font-mono text-[11px]">{formatDisplayDate(r.paidDate)}</td>
                <td className="p-2 font-medium">{r.billTitle}</td>
                <td className="p-2 font-mono text-[11px]">{r.consumerNumber}</td>
                <td className="p-2 uppercase text-[11px] font-mono">{r.upiAppUsed}</td>
                <td className="p-2 font-mono text-[11px]">{r.upiRef}</td>
                <td className="p-2 text-right font-mono font-semibold">{formatCurrency(r.amountPaid)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 2: Active / Upcoming Bill Subscriptions */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 border-b pb-1">
          2. Active Utility Bill Schedules & Cadence
        </h2>
        <table className="w-full text-left text-xs border border-slate-200">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="p-2">Utility Category</th>
              <th className="p-2">Bill Title & Provider</th>
              <th className="p-2">Due Date</th>
              <th className="p-2">Cadence</th>
              <th className="p-2">Biller UPI VPA</th>
              <th className="p-2 text-right">Amount Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {bills.map((b) => (
              <tr key={b.id}>
                <td className="p-2 capitalize font-medium">{b.category}</td>
                <td className="p-2">{b.title}</td>
                <td className="p-2 font-mono text-[11px]">{formatDisplayDate(b.dueDate)}</td>
                <td className="p-2 capitalize text-[11px]">{b.billingFrequency}</td>
                <td className="p-2 font-mono text-[11px]">{b.billerVpa}</td>
                <td className="p-2 text-right font-mono font-semibold">{formatCurrency(b.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
        <div>PayGrid · All payments verified against NPCI UPI standards.</div>
        <div>Confidential · For Personal Financial Budgeting Only</div>
      </div>
    </div>
  );
};
