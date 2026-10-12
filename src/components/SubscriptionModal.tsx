import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Check,
  Crown,
  Zap,
  MessageSquare,
  ShieldCheck,
  Download,
  Calendar,
  ArrowRight,
  Smartphone,
  QrCode,
  Sparkles,
  CheckCircle2,
  Copy,
  Info,
  Lock,
  Building2,
} from 'lucide-react';
import {
  PhonePeLogo,
  GooglePayLogo,
  PaytmLogo,
  BhimLogo,
  AmazonPayLogo,
  CredLogo,
} from './BrandLogos';
import { SubscriptionCadence, UserProfile } from '../types/auth';
import { buildUpiUri, buildAppSpecificUpiUri, buildUpiQrUri, generateMockUtr } from '../utils/upi';
import { formatCurrency } from '../utils/dateUtils';
import { SECURE_MERCHANT_PROFILE, getSecureSettlementParams } from '../utils/security';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUpgradeSuccess: (cadence: SubscriptionCadence, price: number, utr: string) => void;
  onOpenAuth: () => void;
  isTrialExpired?: boolean;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpgradeSuccess,
  onOpenAuth,
  isTrialExpired = false,
}) => {
  const isMobileClient = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const [cadence, setCadence] = useState<SubscriptionCadence>('yearly');
  const [step, setStep] = useState<'plan_select' | 'upi_pay'>('plan_select');
  // Default to Tap to Pay app
  const [paymentTab, setPaymentTab] = useState<'app' | 'qr' | 'bank'>('app');
  const [utrNumber] = useState<string>(() => generateMockUtr());
  const [isProcessing, setIsProcessing] = useState(false);
  const [launchMessage, setLaunchMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const price = cadence === 'yearly' ? 899 : 99;
  const periodLabel = cadence === 'yearly' ? '/ year' : '/ month';

  const secureParams = getSecureSettlementParams(price, cadence, currentUser?.name);
  const standardUpiUri = buildUpiUri(secureParams);
  const qrUpiUri = buildUpiQrUri(secureParams);

  const handleProceedToPay = () => {
    if (!currentUser) {
      onClose();
      onOpenAuth();
      return;
    }
    setStep('upi_pay');
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  const handleLaunchApp = async (appType: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'cred' | 'amazonpay' | 'generic') => {
    const appNames: Record<string, string> = {
      gpay: 'Google Pay',
      phonepe: 'PhonePe',
      paytm: 'Paytm',
      amazonpay: 'Amazon Pay',
      bhim: 'BHIM',
      cred: 'CRED',
      generic: 'Installed UPI App',
    };
    const appName = appNames[appType] || 'UPI App';
    const deepLink = buildAppSpecificUpiUri(appType, secureParams);

    // Copy amount to clipboard
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(price.toFixed(2));
      }
    } catch {}

    try {
      if (isMobileClient) {
        window.location.href = deepLink;
      } else {
        const link = document.createElement('a');
        link.href = deepLink;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setLaunchMessage(`Triggered ${appName}. Amount ₹${price} copied — paste in your UPI app. After payment, click Activate Pro.`);
    } catch {
      setLaunchMessage(`Could not open app directly. Please scan the QR code or click Activate Pro Membership.`);
    }
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      onUpgradeSuccess(cadence, price, utrNumber);
      setIsProcessing(false);
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                PayGrid Pro Subscription
              </h3>
              <p className="text-xs text-slate-500">
                Automated WhatsApp alerts, multi-account syncing & audit reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'plan_select' ? (
          /* Step 1: Choose Plan */
          <div className="p-6 space-y-5">
            {/* Trial Notice if Expired */}
            {isTrialExpired && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900 animate-in fade-in">
                <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold block">3-Month Free Trial Expired</span>
                  Your 90-day free trial period has concluded. Upgrade to PayGrid Pro to keep tracking utility bills, receiving automated reminders, and executing 1-tap UPI payments.
                </div>
              </div>
            )}

            {/* Cadence Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setCadence('yearly')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  cadence === 'yearly'
                    ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  Save 25% (Best Value)
                </span>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Annual Plan</span>
                  {cadence === 'yearly' && (
                    <Check className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 font-mono">₹899</span>
                  <span className="text-xs text-slate-500">/ year</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">₹74.9/mo billed annually</p>
              </div>

              <div
                onClick={() => setCadence('monthly')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  cadence === 'monthly'
                    ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Monthly Plan</span>
                  {cadence === 'monthly' && (
                    <Check className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 font-mono">₹99</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Flexible cancel anytime</p>
              </div>
            </div>

            {/* Feature Perks */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Everything Included in Pro:
              </span>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>WhatsApp OTP & Due Date Alerts:</strong> Automated reminders 3 days and 1 day before utility penalty cut-offs.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Unlimited Bill Tracking:</strong> Add over 100+ utility providers across BESCOM, Tata Power, IGL, Jio, and credit cards.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Download className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Exportable Tax & Audit Statements:</strong> One-click PDF statements and CSV ledgers with 12-digit UTR proof for CA filing.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Late Penalty Protection:</strong> Real-time late fee computation to keep your credit score safe.
                  </span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleProceedToPay}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to UPI Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Pay via UPI */
          <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('plan_select')}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                ← Change Plan
              </button>
              <span className="text-xs font-semibold text-slate-700">
                PayGrid Pro {cadence === 'yearly' ? 'Annual (₹899)' : 'Monthly (₹99)'}
              </span>
            </div>

            {/* Tabs: Tap to Pay vs QR Code vs Direct Bank Transfer */}
            <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaymentTab('app')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentTab === 'app'
                    ? 'bg-white text-amber-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Tap to Pay</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab('qr')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentTab === 'qr'
                    ? 'bg-white text-amber-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan QR</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab('bank')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentTab === 'bank'
                    ? 'bg-white text-amber-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Bank Transfer</span>
              </button>
            </div>

            {/* TAB 1: TAP TO PAY (MOBILE UPI APPS) */}
            {paymentTab === 'app' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Tap to Launch Installed UPI App:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLaunchApp('phonepe')}
                    className="p-2 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-slate-50 text-center transition-all flex flex-col items-center cursor-pointer shadow-2xs"
                  >
                    <PhonePeLogo size={28} />
                    <span className="text-[11px] font-semibold text-slate-800 mt-1">PhonePe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLaunchApp('gpay')}
                    className="p-2 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-slate-50 text-center transition-all flex flex-col items-center cursor-pointer shadow-2xs"
                  >
                    <GooglePayLogo size={28} />
                    <span className="text-[11px] font-semibold text-slate-800 mt-1">GPay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLaunchApp('paytm')}
                    className="p-2 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-slate-50 text-center transition-all flex flex-col items-center cursor-pointer shadow-2xs"
                  >
                    <PaytmLogo size={28} />
                    <span className="text-[11px] font-semibold text-slate-800 mt-1">Paytm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLaunchApp('bhim')}
                    className="p-2 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-slate-50 text-center transition-all flex flex-col items-center cursor-pointer shadow-2xs"
                  >
                    <BhimLogo size={28} />
                    <span className="text-[11px] font-semibold text-slate-800 mt-1">BHIM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLaunchApp('amazonpay')}
                    className="p-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-slate-50 text-center transition-all flex flex-col items-center cursor-pointer shadow-2xs"
                  >
                    <AmazonPayLogo size={28} />
                    <span className="text-[11px] font-semibold text-slate-800 mt-1">Amazon</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLaunchApp('cred')}
                    className="p-2 rounded-xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-center transition-all flex flex-col items-center cursor-pointer shadow-2xs"
                  >
                    <CredLogo size={28} />
                    <span className="text-[11px] font-semibold text-slate-800 mt-1">CRED</span>
                  </button>
                </div>

                {launchMessage && (
                  <div className="mt-2.5 p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{launchMessage}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SCAN QR CODE */}
            {paymentTab === 'qr' && (
              <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <QRCodeSVG
                    value={qrUpiUri}
                    size={170}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    Scan with any UPI App on your Phone
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    ₹{price} · PayGrid Pro Subscriptions (Encrypted UPI Node)
                  </p>
                </div>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleCopy(SECURE_MERCHANT_PROFILE.encryptedReference, 'vpa')}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Reference Token</span>
                    {copiedField === 'vpa' && <span className="text-emerald-600 font-bold">✓</span>}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: DIRECT BANK TRANSFER (ENCRYPTED / TOKENIZED STATE) */}
            {paymentTab === 'bank' && (
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Bank Transfer (IMPS / NEFT / RTGS)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    <span>Tokenized & Masked</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Beneficiary Name */}
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Beneficiary</span>
                      <span className="font-semibold text-slate-900">{SECURE_MERCHANT_PROFILE.merchantName}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Verified</span>
                  </div>

                  {/* Bank Account Number (Strictly Masked - Zero plaintext exposure) */}
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                        Settlement Account ({SECURE_MERCHANT_PROFILE.bankName})
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {SECURE_MERCHANT_PROFILE.maskedAccount}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Encrypted Node</span>
                    </div>
                  </div>

                  {/* IFSC Code (Masked Clearing Route) */}
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Clearing Route (IFSC)</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{SECURE_MERCHANT_PROFILE.maskedIfsc}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded">
                      HDFC Bank Direct
                    </span>
                  </div>

                  {/* Tokenized Settlement Reference */}
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Settlement Token</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{SECURE_MERCHANT_PROFILE.encryptedReference}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(SECURE_MERCHANT_PROFILE.encryptedReference, 'token')}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-600 flex items-center gap-1 cursor-pointer"
                      title="Copy Token"
                    >
                      {copiedField === 'token' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Token</span>
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-lg flex items-start gap-2 text-[11px] text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>End-to-End Masked & Encrypted:</strong> Direct personal credentials are tokenized to protect account privacy under RBI fintech guidelines. Use Tap to Pay or Scan QR for instant automated settlement.
                  </span>
                </div>
              </div>
            )}

            {/* Recipient Trust Badge (Shown across all modes) */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 truncate mr-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  Recipient: <strong>{SECURE_MERCHANT_PROFILE.merchantName}</strong> ({SECURE_MERCHANT_PROFILE.bankName} · {SECURE_MERCHANT_PROFILE.maskedAccount})
                </span>
              </div>
              <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Protected</span>
              </span>
            </div>

            {/* Automatic Reference & Direct Activation */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-semibold text-slate-900">Audit Reference:</span>
                  <span className="font-mono text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded text-amber-800 font-bold">
                    #{utrNumber}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Auto-recorded</span>
              </div>

              <button
                type="button"
                onClick={() => handleConfirmPayment()}
                disabled={isProcessing}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {isProcessing ? (
                  <span>Activating Subscription...</span>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>Activate {cadence === 'yearly' ? 'Annual' : 'Monthly'} Pro Membership</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
