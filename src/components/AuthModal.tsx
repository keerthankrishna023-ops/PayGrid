import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Phone,
  User,
  Plus,
  Check,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, AuthProvider } from '../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

interface SavedGoogleAccount {
  name: string;
  email: string;
  photoUrl: string;
  badge?: string;
  isPrimary?: boolean;
}

const DEFAULT_ACCOUNTS: SavedGoogleAccount[] = [
  {
    name: 'Keerthan K',
    email: 'keerthank506@gmail.com',
    photoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Keerthan%20K&backgroundColor=4f46e5&textColor=ffffff',
    badge: '3-Month Free Trial Active',
    isPrimary: true,
  },
];

const TEST_EMAILS_TO_PRUNE = new Set(['keerthan.bills@gmail.com', 'keerthan.family@gmail.com']);

function getMergedGoogleAccounts(): SavedGoogleAccount[] {
  const map = new Map<string, SavedGoogleAccount>();
  DEFAULT_ACCOUNTS.forEach((acc) => map.set(acc.email.toLowerCase(), acc));

  try {
    const rawStore = localStorage.getItem('paygrid_accounts_store');
    if (rawStore) {
      const store = JSON.parse(rawStore);
      let cleaned = false;
      Object.keys(store).forEach((key) => {
        if (TEST_EMAILS_TO_PRUNE.has(key.toLowerCase())) {
          delete store[key];
          cleaned = true;
        }
      });
      if (cleaned) {
        localStorage.setItem('paygrid_accounts_store', JSON.stringify(store));
      }

      Object.values(store).forEach((acc: any) => {
        if (acc && acc.email && !TEST_EMAILS_TO_PRUNE.has(acc.email.toLowerCase())) {
          const emailLower = acc.email.toLowerCase();
          const existing = map.get(emailLower);
          map.set(emailLower, {
            name: acc.name || existing?.name || 'Google User',
            email: acc.email,
            photoUrl: acc.photoUrl || existing?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(acc.name || 'User')}&backgroundColor=4f46e5&textColor=ffffff`,
            badge: acc.email === 'keerthank506@gmail.com' ? '3-Month Free Trial Active' : existing?.badge || 'Google Account',
            isPrimary: acc.email === 'keerthank506@gmail.com',
          });
        }
      });
    }
  } catch {}

  return Array.from(map.values());
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<AuthProvider>('gmail');

  // Load known Google accounts from merged defaults and localStorage store
  const [googleAccounts, setGoogleAccounts] = useState<SavedGoogleAccount[]>(() => {
    return getMergedGoogleAccounts();
  });

  const [selectedAccountEmail, setSelectedAccountEmail] = useState<string>('keerthank506@gmail.com');
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [newGmailEmail, setNewGmailEmail] = useState('');
  const [newGmailName, setNewGmailName] = useState('');
  const [isLoggingInGmail, setIsLoggingInGmail] = useState(false);

  // WhatsApp Login State
  const [phoneCountry, setPhoneCountry] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [waName, setWaName] = useState('');
  const [waStep, setWaStep] = useState<'input_phone' | 'verify_otp'>('input_phone');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(30);

  // Sync Google accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      setGoogleAccounts(getMergedGoogleAccounts());
    }
  }, [isOpen]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any;
    if (waStep === 'verify_otp' && resendCountdown > 0) {
      timer = setInterval(() => setResendCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [waStep, resendCountdown]);

  // Handle Sign-in with a specific Google account from the list
  const handleSelectAccount = (account: SavedGoogleAccount) => {
    setSelectedAccountEmail(account.email);
    setIsLoggingInGmail(true);

    setTimeout(() => {
      let finalUser: UserProfile;

      try {
        const rawStore = localStorage.getItem('paygrid_accounts_store');
        const store = rawStore ? JSON.parse(rawStore) : {};
        const match: UserProfile | undefined = store[account.email.toLowerCase()];

        if (match) {
          // Exact preservation of previous user, subscription, trial days, and forced upgrade
          finalUser = {
            ...match,
            name: account.name || match.name,
            photoUrl: account.photoUrl || match.photoUrl,
            provider: 'gmail',
          };
        } else {
          // Initialize for newly chosen default or custom account
          const isPrimaryKeerthan = account.email.toLowerCase() === 'keerthank506@gmail.com';
          const startIso = isPrimaryKeerthan ? '2026-09-01T00:00:00.000Z' : new Date().toISOString();
          const endIso = isPrimaryKeerthan
            ? '2026-11-30T00:00:00.000Z'
            : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

          finalUser = {
            id: `user-gmail-${account.email.replace(/[^a-zA-Z0-9]/g, '')}`,
            name: account.name,
            email: account.email,
            photoUrl: account.photoUrl,
            provider: 'gmail',
            createdAt: startIso,
            subscription: {
              tier: 'free',
              autoRenew: false,
              trialStartDate: startIso,
              trialEndDate: endIso,
              forcedUpgrade: false,
            },
          };
          store[account.email.toLowerCase()] = finalUser;
          localStorage.setItem('paygrid_accounts_store', JSON.stringify(store));
        }
      } catch {
        finalUser = {
          id: `user-gmail-${account.email.replace(/[^a-zA-Z0-9]/g, '')}`,
          name: account.name,
          email: account.email,
          photoUrl: account.photoUrl,
          provider: 'gmail',
          createdAt: '2026-09-01T00:00:00.000Z',
          subscription: {
            tier: 'free',
            autoRenew: false,
            trialStartDate: '2026-09-01T00:00:00.000Z',
            trialEndDate: '2026-11-30T00:00:00.000Z',
            forcedUpgrade: false,
          },
        };
      }

      try {
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      } catch {}

      setIsLoggingInGmail(false);
      onLoginSuccess(finalUser);
      onClose();
    }, 400);
  };

  // Handle adding and signing in with a new Google Account
  const handleAddNewGmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGmailEmail.trim()) return;

    const email = newGmailEmail.trim();
    const name = newGmailName.trim() || email.split('@')[0];
    const photoUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=4f46e5&textColor=ffffff`;

    const newAcc: SavedGoogleAccount = {
      name,
      email,
      photoUrl,
      badge: 'Google Account',
      isPrimary: false,
    };

    setGoogleAccounts((prev) => [newAcc, ...prev.filter((a) => a.email !== email)]);
    handleSelectAccount(newAcc);
  };

  // Handle WhatsApp OTP Send
  const handleSendWaOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 7) {
      setOtpError('Please enter a valid phone number');
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setEnteredOtp(['', '', '', '', '', '']);
    setWaStep('verify_otp');
    setResendCountdown(30);
    setOtpError('');
  };

  // Focus first OTP field when entering verify step
  useEffect(() => {
    if (waStep === 'verify_otp') {
      const timer = setTimeout(() => {
        document.getElementById('wa-otp-0')?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [waStep]);

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');

    // Handle multiple digits (paste or autofill)
    if (clean.length > 1) {
      const digits = clean.slice(0, 6).split('');
      const newOtp = [...enteredOtp];
      digits.forEach((d, i) => {
        if (index + i < 6) {
          newOtp[index + i] = d;
        }
      });
      setEnteredOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, 5);
      document.getElementById(`wa-otp-${nextIdx}`)?.focus();
      return;
    }

    const newOtp = [...enteredOtp];
    newOtp[index] = clean;
    setEnteredOtp(newOtp);

    // If a digit was entered, move forward
    if (clean && index < 5) {
      const nextInput = document.getElementById(`wa-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (enteredOtp[index]) {
        // Clear current cell
        const newOtp = [...enteredOtp];
        newOtp[index] = '';
        setEnteredOtp(newOtp);
      } else if (index > 0) {
        // Current cell is already empty: backspace into previous cell and clear it
        e.preventDefault();
        const newOtp = [...enteredOtp];
        newOtp[index - 1] = '';
        setEnteredOtp(newOtp);
        const prevInput = document.getElementById(`wa-otp-${index - 1}`);
        prevInput?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      document.getElementById(`wa-otp-${index - 1}`)?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      document.getElementById(`wa-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>, startIndex: number) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;
    const digits = pasteData.split('');
    const newOtp = [...enteredOtp];
    digits.forEach((d, i) => {
      if (startIndex + i < 6) {
        newOtp[startIndex + i] = d;
      }
    });
    setEnteredOtp(newOtp);
    const nextIdx = Math.min(startIndex + digits.length, 5);
    document.getElementById(`wa-otp-${nextIdx}`)?.focus();
  };

  const handleVerifyWaOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const joined = enteredOtp.join('');
    if (joined !== generatedOtp) {
      setOtpError('Invalid OTP code. Please check the WhatsApp message code.');
      return;
    }

    const name = waName.trim() || 'WhatsApp User';
    const fullPhone = `${phoneCountry} ${phoneNumber}`;
    const accountKey = `user-wa-${phoneNumber.replace(/\D/g, '')}`.toLowerCase();
    const photoUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=059669`;

    let finalUser: UserProfile;
    try {
      const rawStore = localStorage.getItem('paygrid_accounts_store');
      const store = rawStore ? JSON.parse(rawStore) : {};
      const match = store[accountKey] || store[fullPhone.toLowerCase()];

      if (match) {
        finalUser = {
          ...match,
          name: name || match.name,
          phone: fullPhone,
          provider: 'whatsapp',
        };
      } else {
        const startIso = '2026-09-01T00:00:00.000Z';
        const endIso = '2026-11-30T00:00:00.000Z';
        finalUser = {
          id: accountKey,
          name,
          phone: fullPhone,
          photoUrl,
          provider: 'whatsapp',
          createdAt: startIso,
          subscription: {
            tier: 'free',
            autoRenew: false,
            trialStartDate: startIso,
            trialEndDate: endIso,
            forcedUpgrade: false,
          },
        };
        store[accountKey] = finalUser;
        localStorage.setItem('paygrid_accounts_store', JSON.stringify(store));
      }
    } catch {
      finalUser = {
        id: accountKey,
        name,
        phone: fullPhone,
        photoUrl,
        provider: 'whatsapp',
        createdAt: '2026-09-01T00:00:00.000Z',
        subscription: {
          tier: 'free',
          autoRenew: false,
          trialStartDate: '2026-09-01T00:00:00.000Z',
          trialEndDate: '2026-11-30T00:00:00.000Z',
          forcedUpgrade: false,
        },
      };
    }

    try {
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
    } catch {}

    onLoginSuccess(finalUser);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Sign In to PayGrid
            </h3>
            <p className="text-[11px] text-slate-500">
              Access your bills, payment history & 3-month free trial
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector: Gmail vs WhatsApp */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('gmail');
                setOtpError('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'gmail'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>Google / Gmail Accounts</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('whatsapp');
                setOtpError('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp OTP</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Gmail Account Chooser */}
        {activeTab === 'gmail' && (
          <div className="p-5 space-y-4">
            
            {/* Authentic Google Account Chooser Banner */}
            <div className="flex items-center gap-3 pb-1 border-b border-slate-100">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Choose a Google Account
                </h4>
                <p className="text-[11px] text-slate-500">
                  Select an available account to continue to PayGrid
                </p>
              </div>
            </div>

            {/* List of Available Google Accounts */}
            <div className="space-y-2">
              {googleAccounts.map((account) => {
                const isSelected = selectedAccountEmail.toLowerCase() === account.email.toLowerCase();
                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleSelectAccount(account)}
                    disabled={isLoggingInGmail}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={account.photoUrl}
                          alt={account.name}
                          className="w-10 h-10 rounded-full border border-slate-200 bg-indigo-600 object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full shadow-xs border border-slate-200 flex items-center justify-center p-0.5">
                          <svg className="w-full h-full" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                          </svg>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {account.name}
                          </span>
                          {account.isPrimary && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.2 rounded shrink-0">
                              Primary
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono truncate block">
                          {account.email}
                        </span>
                        {account.badge && (
                          <span className="text-[10px] text-emerald-600 font-medium block">
                            ✓ {account.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center text-indigo-600">
                      {isLoggingInGmail && isSelected ? (
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Use Another Google Account Toggle */}
            {!showAddAccountForm ? (
              <button
                type="button"
                onClick={() => setShowAddAccountForm(true)}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-500" />
                <span>Use another Google account</span>
              </button>
            ) : (
              <form onSubmit={handleAddNewGmail} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Add Google / Gmail Account
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddAccountForm(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Gmail Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="email"
                      required
                      value={newGmailEmail}
                      onChange={(e) => setNewGmailEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Full Name (optional)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={newGmailName}
                      onChange={(e) => setNewGmailName(e.target.value)}
                      placeholder="e.g. Keerthan K"
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Sign In with This Account</span>
                </button>
              </form>
            )}

            {/* Trial Guarantee note */}
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Persistent 3-Month Free Trial:</strong> Logging out and logging back in will safely preserve your exact trial countdown and bills.
              </span>
            </div>

          </div>
        )}

        {/* Tab 2: WhatsApp OTP Login */}
        {activeTab === 'whatsapp' && (
          <div className="p-5 space-y-4">
            {waStep === 'input_phone' ? (
              <form onSubmit={handleSendWaOtp} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    WhatsApp Mobile Number *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={phoneCountry}
                      onChange={(e) => setPhoneCountry(e.target.value)}
                      className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-24 shrink-0"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+65">🇸🇬 +65</option>
                    </select>
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Your Name (WhatsApp Profile Name)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={waName}
                      onChange={(e) => setWaName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {otpError && (
                  <p className="text-xs text-rose-600 font-medium">{otpError}</p>
                )}

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    A 6-digit verification code will be sent to your WhatsApp account for instant sign-in.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsApp Verification Code</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyWaOtp} className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp Code Generated</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-mono">Just Now</span>
                  </div>
                  <p className="text-xs text-emerald-900">
                    Your verification code is: <strong className="font-mono text-sm tracking-widest text-emerald-950 bg-emerald-200/80 px-1.5 py-0.5 rounded">{generatedOtp}</strong>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-800">
                      Enter 6-Digit WhatsApp Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setWaStep('input_phone')}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <input
                        key={idx}
                        id={`wa-otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={enteredOtp[idx]}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={(e) => handleOtpPaste(e, idx)}
                        onFocus={(e) => e.target.select()}
                        className="w-10 sm:w-12 h-12 text-center text-lg font-bold font-mono rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 transition-all"
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p className="text-xs text-rose-600 font-medium mt-1.5">{otpError}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Sent to {phoneCountry} {phoneNumber}</span>
                  {resendCountdown > 0 ? (
                    <span className="font-mono">Resend in {resendCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const code = Math.floor(100000 + Math.random() * 900000).toString();
                        setGeneratedOtp(code);
                        setResendCountdown(30);
                      }}
                      className="text-emerald-700 font-semibold underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Sign In</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

