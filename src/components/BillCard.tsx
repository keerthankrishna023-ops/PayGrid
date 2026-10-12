import React from 'react';
import {
  Zap,
  Droplets,
  Flame,
  Wifi,
  Smartphone,
  Tv,
  Building,
  Landmark,
  Car,
  CreditCard,
  ShieldCheck,
  GraduationCap,
  Calendar,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Edit2,
  Trash2,
  Film,
  RotateCcw,
} from 'lucide-react';
import { Bill, BillCategory } from '../types/bill';
import { formatCurrency, formatDisplayDate, getDaysDifference, calculatePotentialLateFee } from '../utils/dateUtils';

interface BillCardProps {
  bill: Bill;
  onPay: (bill: Bill) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (billId: string) => void;
  onMarkPaidQuick: (bill: Bill) => void;
  onMarkUnpaid?: (billId: string) => void;
}

export const getCategoryIcon = (category: BillCategory, className: string = 'w-4 h-4') => {
  switch (category) {
    case 'electricity':
      return <Zap className={className} />;
    case 'water':
      return <Droplets className={className} />;
    case 'gas':
      return <Flame className={className} />;
    case 'broadband':
      return <Wifi className={className} />;
    case 'mobile':
      return <Smartphone className={className} />;
    case 'dth':
      return <Tv className={className} />;
    case 'society':
      return <Building className={className} />;
    case 'property_tax':
      return <Landmark className={className} />;
    case 'fastag':
      return <Car className={className} />;
    case 'credit_card':
      return <CreditCard className={className} />;
    case 'insurance':
      return <ShieldCheck className={className} />;
    case 'education':
      return <GraduationCap className={className} />;
    case 'subscription':
      return <Film className={className} />;
    default:
      return <CreditCard className={className} />;
  }
};

export const BillCard: React.FC<BillCardProps> = ({
  bill,
  onPay,
  onEdit,
  onDelete,
  onMarkPaidQuick,
  onMarkUnpaid,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const daysDiff = getDaysDifference(bill.dueDate);
  const isPaid = bill.status === 'paid';
  const isOverdue = !isPaid && daysDiff < 0;
  const isDueToday = !isPaid && daysDiff === 0;
  const isDueSoon = !isPaid && daysDiff > 0 && daysDiff <= 5;
  const lateFee = calculatePotentialLateFee(bill);
  const totalPayable = bill.amount + lateFee;

  // Close dropdown on click outside
  const menuRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`bg-white border rounded-xl p-5 transition-all shadow-xs hover:border-slate-300 relative flex flex-col justify-between ${
        isOverdue
          ? 'border-rose-300 bg-rose-50/20'
          : isPaid
          ? 'border-emerald-200'
          : 'border-slate-200'
      }`}
    >
      <div>
        {/* Header Row: Category, Metadata & Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isOverdue
                  ? 'bg-rose-100 text-rose-700'
                  : isPaid
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-indigo-50 text-indigo-700'
              }`}
            >
              {getCategoryIcon(bill.category, 'w-5 h-5')}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                {bill.title}
              </h3>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>{bill.provider}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{bill.consumerNumber}</span>
              </div>
            </div>
          </div>

          {/* Context Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 text-xs text-slate-700">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(bill);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Bill Details</span>
                </button>
                {!isPaid ? (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onMarkPaidQuick(bill);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-emerald-700 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mark as Paid Manually</span>
                  </button>
                ) : (
                  onMarkUnpaid && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onMarkUnpaid(bill.id);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-amber-50 flex items-center gap-2 text-amber-700 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>Mark as Unpaid</span>
                    </button>
                  )
                )}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(bill.id);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Bill</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Amount & Late Fee Display */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatCurrency(bill.amount)}
            </div>
            {isOverdue && lateFee > 0 && (
              <div className="text-xs text-rose-600 font-medium font-mono tabular-nums mt-0.5">
                + {formatCurrency(lateFee)} late penalty (Total: {formatCurrency(totalPayable)})
              </div>
            )}
          </div>

          <div className="text-right text-xs text-slate-500">
            <span className="capitalize">{bill.billingFrequency}</span>
            <div className="text-slate-400 font-mono text-[11px] truncate max-w-[140px]" title={bill.billerVpa}>
              UPI: {bill.billerVpa}
            </div>
          </div>
        </div>

        {/* Due Date & Status Strip */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Due {formatDisplayDate(bill.dueDate)}</span>
          </div>

          <div>
            {isPaid ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Paid</span>
              </span>
            ) : isOverdue ? (
              <span className="text-rose-700 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>{Math.abs(daysDiff)} days overdue</span>
              </span>
            ) : isDueToday ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Due Today</span>
              </span>
            ) : isDueSoon ? (
              <span className="text-amber-600 font-medium">
                Due in {daysDiff} days
              </span>
            ) : (
              <span className="text-slate-500">
                In {daysDiff} days
              </span>
            )}
          </div>
        </div>

        {bill.notes && (
          <p className="mt-2 text-xs text-slate-500 line-clamp-1 italic">
            "{bill.notes}"
          </p>
        )}
      </div>

      {/* Primary CTA: Pay via UPI or Mark as Paid / Unpaid */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        {isPaid ? (
          <div className="w-full py-2 px-3 bg-emerald-50 border border-emerald-200/80 rounded-lg text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-800 truncate mr-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Settled {bill.lastPaidDate ? `(${formatDisplayDate(bill.lastPaidDate)})` : ''}</span>
              <span className="font-mono text-[11px] text-emerald-700 hidden sm:inline truncate max-w-[100px]">
                {bill.lastTransactionRef ? `· ${bill.lastTransactionRef}` : ''}
              </span>
            </div>
            {onMarkUnpaid && (
              <button
                type="button"
                onClick={() => onMarkUnpaid(bill.id)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100/90 hover:bg-amber-200 border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                title="Undo manual payment & mark this bill as unpaid"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Mark as Unpaid</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => onPay(bill)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
                isOverdue
                  ? 'bg-rose-700 hover:bg-rose-800 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Tap to Pay</span>
            </button>
            <button
              type="button"
              onClick={() => onMarkPaidQuick(bill)}
              className="py-2 px-2.5 rounded-lg text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
              title="Mark as paid manually"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Mark as Paid</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
