import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Receipt,
  Download,
  Calendar,
  ExternalLink,
  ShieldCheck,
  X,
  RotateCcw,
} from 'lucide-react';
import { PaymentRecord, BillCategory } from '../types/bill';
import { CATEGORIES } from '../data/seedData';
import { formatCurrency, formatDateTime } from '../utils/dateUtils';
import { getCategoryIcon } from './BillCard';

interface PaymentHistoryViewProps {
  paymentRecords: PaymentRecord[];
  onMarkUnpaid?: (billId: string) => void;
}

export const PaymentHistoryView: React.FC<PaymentHistoryViewProps> = ({
  paymentRecords,
  onMarkUnpaid,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  const filteredRecords = paymentRecords.filter((rec) => {
    const matchesCategory = categoryFilter === 'all' || rec.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      rec.billTitle.toLowerCase().includes(q) ||
      rec.consumerNumber.toLowerCase().includes(q) ||
      rec.upiRef.toLowerCase().includes(q) ||
      rec.provider.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by bill, consumer ID or UTR..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
          >
            <option value="all">All Utility Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-5 py-3">Paid Date & Time</th>
                <th className="px-5 py-3">Bill & Provider</th>
                <th className="px-5 py-3">Consumer ID</th>
                <th className="px-5 py-3">UPI App & Method</th>
                <th className="px-5 py-3">Bank UTR / Reference</th>
                <th className="px-5 py-3 text-right">Amount Paid</th>
                <th className="px-5 py-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No payment records match your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {formatDateTime(rec.paidDate)}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                          {getCategoryIcon(rec.category, 'w-3.5 h-3.5')}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            {rec.billTitle}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {rec.provider}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 font-mono">
                      {rec.consumerNumber}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-700 capitalize font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-mono">
                        {rec.upiAppUsed.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                      {rec.upiRef}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(rec.amountPaid)}
                      {rec.lateFeePaid > 0 && (
                        <span className="block text-[10px] text-rose-600 font-normal">
                          (inc. {formatCurrency(rec.lateFeePaid)} fee)
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <button
                        onClick={() => setSelectedReceipt(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Official Payment Receipt
              </span>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Payment Successful
                </h4>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                  {formatCurrency(selectedReceipt.amountPaid)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {formatDateTime(selectedReceipt.paidDate)}
                </div>
              </div>

              <div className="border-t border-b border-slate-100 py-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bill Title</span>
                  <span className="font-semibold text-slate-800">{selectedReceipt.billTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Biller / Board</span>
                  <span className="font-semibold text-slate-800">{selectedReceipt.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consumer Account</span>
                  <span className="font-mono text-slate-800">{selectedReceipt.consumerNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Channel</span>
                  <span className="font-semibold text-slate-800 uppercase">{selectedReceipt.upiAppUsed} (UPI)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank UTR / Ref ID</span>
                  <span className="font-mono text-slate-800">{selectedReceipt.upiRef}</span>
                </div>
                {selectedReceipt.lateFeePaid > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Late Fee Penalties</span>
                    <span className="font-mono">+{formatCurrency(selectedReceipt.lateFeePaid)}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified through NPCI Unified Payments Interface network.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Print Receipt
                </button>
                {onMarkUnpaid && (
                  <button
                    onClick={() => {
                      onMarkUnpaid(selectedReceipt.billId);
                      setSelectedReceipt(null);
                    }}
                    className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Undo this settlement and return bill to pending/overdue"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Mark Unpaid</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
