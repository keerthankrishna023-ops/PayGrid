import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  RefreshCw,
  Receipt,
  ShieldCheck,
  Zap,
  Crown,
  Smartphone,
} from 'lucide-react';
import { Bill, PaymentRecord, BillCategory, BillingFrequency } from './types/bill';
import { INITIAL_BILLS, INITIAL_PAYMENT_RECORDS, CATEGORIES } from './data/seedData';
import { UserProfile, SubscriptionCadence } from './types/auth';
import { Header } from './components/Header';
import { DashboardMetrics } from './components/DashboardMetrics';
import { BillCard } from './components/BillCard';
import { UpiPaymentModal } from './components/UpiPaymentModal';
import { BillModal } from './components/BillModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { ExpenseAnalytics } from './components/ExpenseAnalytics';
import { PaymentHistoryView } from './components/PaymentHistoryView';
import { PrintableReport } from './components/PrintableReport';
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { ProfileDrawer } from './components/ProfileDrawer';
import { PlayStoreReadyModal } from './components/PlayStoreReadyModal';
import { generateNotifications } from './utils/notificationUtils';
import { getDaysDifference, getNextDueDate, formatCurrency } from './utils/dateUtils';
import { generateMockUtr } from './utils/upi';

const INITIAL_USER: UserProfile = {
  id: 'user-keerthan-506',
  name: 'Keerthan K',
  email: 'keerthank506@gmail.com',
  photoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Keerthan%20K&backgroundColor=4f46e5&textColor=ffffff',
  provider: 'gmail',
  createdAt: '2026-09-01T00:00:00.000Z',
  subscription: {
    tier: 'free',
    autoRenew: false,
    trialStartDate: '2026-09-01T00:00:00.000Z',
    trialEndDate: '2026-11-30T00:00:00.000Z',
  },
};

// Key for permanent accounts database in localStorage
const ACCOUNTS_STORAGE_KEY = 'paygrid_accounts_store';
const TEST_EMAILS_TO_PRUNE = ['keerthan.bills@gmail.com', 'keerthan.family@gmail.com'];

function getAccountsStore(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      let changed = false;
      TEST_EMAILS_TO_PRUNE.forEach((testEmail) => {
        if (parsed[testEmail]) {
          delete parsed[testEmail];
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(parsed));
      }
      if (!parsed['keerthank506@gmail.com']) parsed['keerthank506@gmail.com'] = INITIAL_USER;
      return parsed;
    }
  } catch {}
  return {
    'keerthank506@gmail.com': INITIAL_USER,
  };
}

function saveAccountToStore(user: UserProfile) {
  try {
    const store = getAccountsStore();
    const key = (user.email || user.phone || user.id).toLowerCase();
    store[key] = user;
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

const DEMO_BILL_IDS = new Set([
  'bill-1', 'bill-2', 'bill-3', 'bill-4', 'bill-5', 'bill-6',
  'bill-bescom', 'bill-bwssb', 'bill-airtel', 'bill-igl', 'bill-tata', 'bill-hdfc',
]);

const DEMO_PAYMENT_IDS = new Set([
  'pay-rec-1', 'pay-rec-2', 'pay-rec-3', 'pay-rec-4', 'pay-rec-5', 'demo-rec-1',
]);

function isDemoBill(b: any): boolean {
  if (!b || typeof b !== 'object') return true;
  if (DEMO_BILL_IDS.has(b.id)) return true;
  if (typeof b.id === 'string' && (b.id.startsWith('bill-bescom') || b.id.startsWith('bill-bwssb') || b.id.startsWith('demo-'))) return true;
  if (b.consumerNumber === '1048293751' || b.consumerNumber === 'BWSSB-9920148' || b.consumerNumber === '08044928172' || b.consumerNumber === '4001928472') return true;
  return false;
}

function isDemoPayment(r: any): boolean {
  if (!r || typeof r !== 'object') return true;
  if (DEMO_PAYMENT_IDS.has(r.id)) return true;
  if (typeof r.id === 'string' && r.id.startsWith('demo-')) return true;
  return false;
}

export default function App() {
  // Load state from localStorage or empty production start
  const [bills, setBills] = useState<Bill[]>(() => {
    try {
      const saved = localStorage.getItem('paygrid_bills');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const realBills = parsed.filter((b) => !isDemoBill(b));
          if (realBills.length !== parsed.length) {
            localStorage.setItem('paygrid_bills', JSON.stringify(realBills));
          }
          return realBills;
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('paygrid_payments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const realRecords = parsed.filter((r) => !isDemoPayment(r));
          if (realRecords.length !== parsed.length) {
            localStorage.setItem('paygrid_payments', JSON.stringify(realRecords));
          }
          return realRecords;
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('paygrid_budget');
      if (saved) {
        const num = Number(saved);
        // Legacy demo values were 35000 and 30000; reset to 0 so real users can set their own target
        if (num === 35000 || num === 30000) {
          localStorage.removeItem('paygrid_budget');
          return 0;
        }
        return num > 0 ? num : 0;
      }
    } catch {
      // fallback
    }
    return 0;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      // If user explicitly signed out, do not auto-login
      if (localStorage.getItem('paygrid_logged_out') === 'true') {
        return null;
      }
      const saved = localStorage.getItem('paygrid_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bills' | 'analytics' | 'history'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isPlayStoreModalOpen, setIsPlayStoreModalOpen] = useState(false);

  // 3-Month (90 Days) Free Trial Logic
  const isPro = currentUser?.subscription.tier === 'pro';
  const trialStartDate = new Date(
    currentUser?.subscription.trialStartDate || currentUser?.createdAt || '2026-09-01T00:00:00.000Z'
  );
  const trialDurationMs = 90 * 24 * 60 * 60 * 1000; // 90 days = 3 months
  const trialEndDate = new Date(trialStartDate.getTime() + trialDurationMs);
  const now = new Date();
  const naturalExpired = now.getTime() > trialEndDate.getTime();
  const simulatedExpired = currentUser?.subscription.forcedUpgrade === true;
  const isTrialExpired = Boolean(!isPro && currentUser && (simulatedExpired || naturalExpired));
  const trialDaysRemaining = Math.max(
    0,
    Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const handleToggleSimulateTrialExpired = () => {
    if (!currentUser) return;
    const willBeForced = !(currentUser.subscription.forcedUpgrade ?? false);
    const updatedUser: UserProfile = {
      ...currentUser,
      subscription: {
        ...currentUser.subscription,
        forcedUpgrade: willBeForced,
      },
    };
    setCurrentUser(updatedUser);
  };

  // Filters for All Bills view
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('all');

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('paygrid_bills', JSON.stringify(bills));
    } catch {}
  }, [bills]);

  useEffect(() => {
    try {
      localStorage.setItem('paygrid_payments', JSON.stringify(paymentRecords));
    } catch {}
  }, [paymentRecords]);

  useEffect(() => {
    try {
      if (monthlyBudget > 0) {
        localStorage.setItem('paygrid_budget', monthlyBudget.toString());
      } else {
        localStorage.removeItem('paygrid_budget');
      }
    } catch {}
  }, [monthlyBudget]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('paygrid_user', JSON.stringify(currentUser));
        localStorage.removeItem('paygrid_logged_out');
        saveAccountToStore(currentUser);
      } else {
        localStorage.removeItem('paygrid_user');
      }
    } catch {}
  }, [currentUser]);

  // Notifications calculation
  const notifications = generateNotifications(bills);
  const unreadCount = notifications.length;
  const hasOverdue = bills.some((b) => b.status !== 'paid' && getDaysDifference(b.dueDate) < 0);

  // Handlers
  const handleSaveBill = (billData: Omit<Bill, 'id' | 'createdAt'>, billId?: string) => {
    if (billId) {
      // Edit
      setBills((prev) =>
        prev.map((b) => (b.id === billId ? { ...b, ...billData } : b))
      );
    } else {
      // Create new
      const newBill: Bill = {
        ...billData,
        id: `bill-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setBills((prev) => [newBill, ...prev]);
    }
    setEditingBill(null);
  };

  const handleDeleteBill = (billId: string) => {
    if (window.confirm('Are you sure you want to remove this utility bill from tracking?')) {
      setBills((prev) => prev.filter((b) => b.id !== billId));
    }
  };

  const handleOpenEdit = (bill: Bill) => {
    setEditingBill(bill);
    setIsAddModalOpen(true);
  };

  const handlePaymentSuccess = (params: {
    billId: string;
    amountPaid: number;
    principalAmount: number;
    lateFeePaid: number;
    upiRef: string;
    upiAppUsed: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'cred' | 'amazonpay' | 'other';
    notes?: string;
  }) => {
    const targetBill = bills.find((b) => b.id === params.billId);
    if (!targetBill) return;

    // 1. Record in payment history
    const newRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      billId: targetBill.id,
      billTitle: targetBill.title,
      category: targetBill.category,
      provider: targetBill.provider,
      consumerNumber: targetBill.consumerNumber,
      amountPaid: params.amountPaid,
      principalAmount: params.principalAmount,
      lateFeePaid: params.lateFeePaid,
      paidDate: new Date().toISOString(),
      upiRef: params.upiRef,
      upiAppUsed: params.upiAppUsed,
      billingCycle: 'Oct 2026',
      notes: params.notes,
    };
    setPaymentRecords((prev) => [newRecord, ...prev]);

    // 2. Update Bill Status to 'paid' (enables immediate Mark as Unpaid reversal)
    setBills((prev) =>
      prev.map((b) => {
        if (b.id !== params.billId) return b;
        return {
          ...b,
          status: 'paid',
          lastPaidDate: new Date().toISOString().slice(0, 10),
          lastTransactionRef: params.upiRef,
        };
      })
    );
  };

  const handleLoginSuccess = (incomingUser: UserProfile) => {
    const store = getAccountsStore();
    const key = (incomingUser.email || incomingUser.phone || incomingUser.id).toLowerCase();
    const existing = store[key];

    let finalUser: UserProfile;
    if (existing) {
      // Restore previous user and preserve their trialStartDate, tier, cadence, and forcedUpgrade!
      finalUser = {
        ...existing,
        name: incomingUser.name || existing.name,
        photoUrl: incomingUser.photoUrl || existing.photoUrl,
        provider: incomingUser.provider,
        subscription: {
          ...existing.subscription,
        },
      };
    } else {
      // New account - initialize with original trial period
      const startIso = incomingUser.subscription?.trialStartDate || new Date().toISOString();
      const endIso =
        incomingUser.subscription?.trialEndDate ||
        new Date(new Date(startIso).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
      finalUser = {
        ...incomingUser,
        subscription: {
          ...incomingUser.subscription,
          trialStartDate: startIso,
          trialEndDate: endIso,
          forcedUpgrade: incomingUser.subscription?.forcedUpgrade || false,
        },
      };
    }

    localStorage.removeItem('paygrid_logged_out');
    saveAccountToStore(finalUser);
    setCurrentUser(finalUser);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    if (currentUser) {
      saveAccountToStore(currentUser);
    }
    localStorage.removeItem('paygrid_user');
    localStorage.setItem('paygrid_logged_out', 'true');
    setCurrentUser(null);
  };

  const handleUpgradeSuccess = (cadence: SubscriptionCadence, price: number, utr: string) => {
    if (!currentUser) return;
    const now = new Date();
    const expiry = new Date(now);
    if (cadence === 'yearly') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }
    const updated: UserProfile = {
      ...currentUser,
      subscription: {
        tier: 'pro',
        cadence,
        validUntil: expiry.toISOString().slice(0, 10),
        autoRenew: true,
        lastPaymentUtr: utr,
        pricePaid: price,
      },
    };
    setCurrentUser(updated);
  };

  const handleMarkPaidQuick = (bill: Bill) => {
    const mockUtr = generateMockUtr();
    handlePaymentSuccess({
      billId: bill.id,
      amountPaid: bill.amount,
      principalAmount: bill.amount,
      lateFeePaid: 0,
      upiRef: mockUtr,
      upiAppUsed: 'gpay',
      notes: 'Manually verified settlement',
    });
  };

  const handleMarkUnpaid = (billId: string) => {
    setBills((prev) =>
      prev.map((b) => {
        if (b.id !== billId) return b;
        const daysDiff = getDaysDifference(b.dueDate);
        const restoredStatus = daysDiff < 0 ? 'overdue' : 'pending';
        return {
          ...b,
          status: restoredStatus,
          lastPaidDate: undefined,
          lastTransactionRef: undefined,
        };
      })
    );

    setPaymentRecords((prev) => prev.filter((p) => p.billId !== billId));
  };

  const handleActionGuarded = (action: () => void) => {
    if (isTrialExpired) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    action();
  };

  // Filtered Bills for the list view
  const filteredBills = bills.filter((b) => {
    const matchesCategory = selectedCategory === 'all' || b.category === selectedCategory;
    const matchesFrequency = selectedFrequency === 'all' || b.billingFrequency === selectedFrequency;
    const isOverdue = b.status !== 'paid' && getDaysDifference(b.dueDate) < 0;

    let matchesStatus = true;
    if (selectedStatus === 'paid') {
      matchesStatus = b.status === 'paid';
    } else if (selectedStatus === 'overdue') {
      matchesStatus = isOverdue;
    } else if (selectedStatus === 'pending') {
      matchesStatus = b.status === 'pending' && !isOverdue;
    }

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.provider.toLowerCase().includes(q) ||
      b.consumerNumber.toLowerCase().includes(q) ||
      b.billerVpa.toLowerCase().includes(q);

    return matchesCategory && matchesFrequency && matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          handleActionGuarded(() => {
            setEditingBill(null);
            setIsAddModalOpen(true);
          });
        }}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        unreadNotificationCount={unreadCount}
        hasOverdue={hasOverdue}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileDrawerOpen(true)}
        onLogout={handleLogout}
        onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
        onOpenPlayStoreModal={() => setIsPlayStoreModalOpen(true)}
        trialDaysRemaining={trialDaysRemaining}
        isTrialExpired={isTrialExpired}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Trial Expired Alert Banner (Forced Upgrade) */}
        {isTrialExpired && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">
                  3-Month Free Trial Expired — Upgrade to Continue
                </h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  Your 90-day free trial has completed. To continue managing utility bills, receiving automated reminders, and executing 1-tap UPI payments, please upgrade to Pro.
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-rose-900">
                  <span>Annual Pro: <strong className="font-mono font-bold">₹899/year</strong> (Save 25%, ₹74.9/mo)</span>
                  <span>·</span>
                  <span>Monthly Pro: <strong className="font-mono font-bold">₹99/month</strong></span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap flex-1 sm:flex-none"
              >
                <Crown className="w-4 h-4" />
                <span>Upgrade to Pro Now</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Top Metrics, Alert Banner & Recurrence stats */}
            <DashboardMetrics
              bills={bills}
              paymentRecords={paymentRecords}
              monthlyBudget={monthlyBudget}
              onOpenPayModal={(b) => handleActionGuarded(() => setSelectedBillForPayment(b))}
              onNavigateToOverdue={() => {
                setActiveTab('bills');
                setSelectedStatus('overdue');
              }}
              onNavigateToAnalytics={() => setActiveTab('analytics')}
            />

            {/* Urgent & Due Soon Bills Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Active Utility Bills & Deadlines
                  </h2>
                  <p className="text-xs text-slate-500">
                    Payable instantly with Google Pay, PhonePe, Paytm, BHIM, CRED or scan-to-pay
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('bills')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    View All {bills.length} Bills →
                  </button>
                </div>
              </div>

              {bills.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center shadow-xs">
                  <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">No Utility Bills Added Yet</h3>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                    Start tracking your electricity, water, gas, broadband, DTH, or credit card bills. You will receive due date reminders and can pay directly via PhonePe, Google Pay, Paytm, or scan QR.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        handleActionGuarded(() => {
                          setEditingBill(null);
                          setIsAddModalOpen(true);
                        });
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add / Scan Your First Bill</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bills.slice(0, 6).map((bill) => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      onPay={(b) => handleActionGuarded(() => setSelectedBillForPayment(b))}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteBill}
                      onMarkPaidQuick={(b) => handleActionGuarded(() => handleMarkPaidQuick(b))}
                      onMarkUnpaid={handleMarkUnpaid}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* PayGrid Pro Subscription Banner */}
            {currentUser?.subscription.tier !== 'pro' ? (
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white/20 text-white shrink-0">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        Upgrade to PayGrid Pro
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                        Monthly or Annual
                      </span>
                    </div>
                    <p className="text-xs text-amber-50 mt-1 max-w-xl">
                      Automated WhatsApp bill deadline alerts, unlimited utility subscriptions, late penalty protection, and official exportable tax reports for ₹99/month or ₹899/year.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-xs whitespace-nowrap self-stretch sm:self-auto text-center"
                >
                  View Subscription Plans
                </button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
                <div className="flex items-center gap-2 font-medium">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>
                    <strong>PayGrid Pro Member:</strong> Active {currentUser.subscription.cadence} subscription. All premium utility automation unlocked.
                  </span>
                </div>
                <button
                  onClick={() => setIsProfileDrawerOpen(true)}
                  className="text-amber-800 underline font-semibold hover:text-amber-950 whitespace-nowrap"
                >
                  Manage Membership
                </button>
              </div>
            )}

            {/* Quick Tools & Reports Teaser */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Payment History & Verification Ledger
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      View all settled bills, 12-digit UPI UTR audit references, app breakdown, and download official receipts.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-mono">
                    {paymentRecords.length} Settled Record{paymentRecords.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    View History Ledger →
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Personal Expense Budgeting & Tax Reports
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Download categorized CSV spreadsheets or generate printable PDF payment statements.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Monthly & lifetime ledger
                  </span>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Open Analytics →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: All Utility Bills with High-Density Filters */}
        {activeTab === 'bills' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  All Utility Bills
                </h1>
                <p className="text-xs text-slate-500">
                  Manage electricity, water, gas, broadband, society maintenance, taxes, and cards
                </p>
              </div>

              <button
                onClick={() => {
                  handleActionGuarded(() => {
                    setEditingBill(null);
                    setIsAddModalOpen(true);
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Utility Bill</span>
              </button>
            </div>

            {/* High-density Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search bill, provider or ID..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Category dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Categories ({CATEGORIES.length})</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Status dropdown */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="overdue">Overdue (Missed Payments)</option>
                  <option value="pending">Upcoming & Pending</option>
                  <option value="paid">Paid & Settled</option>
                </select>

                {/* Frequency dropdown */}
                <select
                  value={selectedFrequency}
                  onChange={(e) => setSelectedFrequency(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Frequencies</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half-yearly">Half-Yearly</option>
                  <option value="annual">Annual</option>
                  <option value="one-time">One-Time</option>
                </select>
              </div>

              {/* Active filter summary & reset */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>
                  Showing {filteredBills.length} of {bills.length} bills
                </span>
                {(selectedCategory !== 'all' || selectedStatus !== 'all' || selectedFrequency !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedStatus('all');
                      setSelectedFrequency('all');
                      setSearchQuery('');
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>

            {/* Bill Cards Grid */}
            {filteredBills.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900">No Bills Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No utility bills match the selected filters. Add a new bill or clear filters to view your subscriptions.
                </p>
                <button
                  onClick={() => {
                    handleActionGuarded(() => {
                      setEditingBill(null);
                      setIsAddModalOpen(true);
                    });
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Add First Utility Bill
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBills.map((bill) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    onPay={(b) => handleActionGuarded(() => setSelectedBillForPayment(b))}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteBill}
                    onMarkPaidQuick={(b) => handleActionGuarded(() => handleMarkPaidQuick(b))}
                    onMarkUnpaid={handleMarkUnpaid}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: Analytics & Budget */}
        {activeTab === 'analytics' && (
          <ExpenseAnalytics
            bills={bills}
            paymentRecords={paymentRecords}
            monthlyBudget={monthlyBudget}
            onUpdateMonthlyBudget={setMonthlyBudget}
            onImportBackup={(b, r, bud) => {
              setBills(b);
              setPaymentRecords(r);
              setMonthlyBudget(bud);
            }}
          />
        )}

        {/* VIEW 4: Payment History Ledger */}
        {activeTab === 'history' && (
          <PaymentHistoryView paymentRecords={paymentRecords} onMarkUnpaid={handleMarkUnpaid} />
        )}
      </main>

      {/* Printable Report (rendered when browser print is triggered) */}
      <PrintableReport
        bills={bills}
        paymentRecords={paymentRecords}
        monthlyBudget={monthlyBudget}
      />

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">PayGrid</span>
            <span>· All-in-One Utility Bill & UPI Expense Manager</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlayStoreModalOpen(true)}
              className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <span>Play Store APK & PWA Test</span>
            </button>
            <span aria-hidden="true">·</span>
            <span>NPCI Unified Payments Interface Protocol</span>
          </div>
        </div>
      </footer>

      {/* Interactive UPI Payment Modal */}
      {selectedBillForPayment && (
        <UpiPaymentModal
          bill={selectedBillForPayment}
          isOpen={!!selectedBillForPayment}
          onClose={() => setSelectedBillForPayment(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Add / Edit Bill Modal */}
      {isAddModalOpen && (
        <BillModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingBill(null);
          }}
          onSave={handleSaveBill}
          editingBill={editingBill}
        />
      )}

      {/* Deadline & Notification Drawer */}
      {isNotificationDrawerOpen && (
        <NotificationDrawer
          isOpen={isNotificationDrawerOpen}
          onClose={() => setIsNotificationDrawerOpen(false)}
          bills={bills}
          onPayBill={(b) => handleActionGuarded(() => setSelectedBillForPayment(b))}
        />
      )}

      {/* Auth Modal (Gmail & WhatsApp OTP Login) */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Subscription Modal (Monthly / Yearly Pro Subscriptions) */}
      {isSubscriptionModalOpen && (
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          currentUser={currentUser}
          onUpgradeSuccess={handleUpgradeSuccess}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          isTrialExpired={isTrialExpired}
        />
      )}

      {/* Profile Drawer */}
      {currentUser && isProfileDrawerOpen && (
        <ProfileDrawer
          isOpen={isProfileDrawerOpen}
          onClose={() => setIsProfileDrawerOpen(false)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
          trialDaysRemaining={trialDaysRemaining}
          isTrialExpired={isTrialExpired}
          onToggleSimulateTrialExpired={handleToggleSimulateTrialExpired}
        />
      )}

      {/* Play Store Ready & Android Sideloading Test Modal */}
      {isPlayStoreModalOpen && (
        <PlayStoreReadyModal
          isOpen={isPlayStoreModalOpen}
          onClose={() => setIsPlayStoreModalOpen(false)}
        />
      )}
    </div>
  );
}
