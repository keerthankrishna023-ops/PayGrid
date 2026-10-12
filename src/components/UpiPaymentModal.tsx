import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Smartphone,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Edit2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  PhonePeLogo,
  GooglePayLogo,
  PaytmLogo,
  BhimLogo,
  AmazonPayLogo,
  CredLogo,
  UpiGenericLogo,
} from './BrandLogos';
import { Bill } from '../types/bill';
import { formatCurrency, calculatePotentialLateFee } from '../utils/dateUtils';
import { buildUpiUri, buildAppSpecificUpiUri, buildUpiQrUri, generateMockUtr, isValidVpa } from '../utils/upi';

interface UpiPaymentModalProps {
  bill: Bill;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (params: {
    billId: string;
    amountPaid: number;
    principalAmount: number;
    lateFeePaid: number;
    upiRef: string;
    upiAppUsed: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'cred' | 'amazonpay' | 'other';
    notes?: string;
  }) => void;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  bill,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const lateFee = calculatePotentialLateFee(bill);
  const totalAmount = bill.amount + lateFee;

  // Detect mobile device to pick intuitive default
  const isMobileClient = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Default to Tap to Pay (App) as requested by user
  const [paymentTab, setPaymentTab] = useState<'app' | 'qr'>('app');
  const [selectedApp, setSelectedApp] = useState<'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'cred' | 'amazonpay' | 'other'>('phonepe');
  const [launchStatus, setLaunchStatus] = useState<string | null>(null);

  // VPA recipient (default from bill, with quick edit toggle)
  const [activeVpa, setActiveVpa] = useState<string>(bill.billerVpa);
  const [isEditingVpa, setIsEditingVpa] = useState(false);
  const [vpaInput, setVpaInput] = useState(bill.billerVpa);

  // Amount adjustments (helps avoid the PhonePe ₹2,000 gallery limit when needed)
  const [selectedAmount, setSelectedAmount] = useState<number>(totalAmount);
  const [copiedField, setCopiedField] = useState<'vpa' | 'amount' | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  // Auto-generated 12-digit UTR in background (no manual typing needed)
  const [autoRef] = useState<string>(() => generateMockUtr());
  const [detectedClipboardUtr, setDetectedClipboardUtr] = useState<string | null>(null);
  const [amountCopiedToast, setAmountCopiedToast] = useState<string | null>(null);

  const refId = `PG${bill.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}${Date.now().toString().slice(-4)}`;
  const transactionNote = `${bill.category.toUpperCase()} Bill ${bill.consumerNumber}`;

  const paymentDetails = {
    vpa: activeVpa.trim(),
    payeeName: activeVpa === bill.billerVpa ? (bill.payeeName || bill.provider) : 'Live Payee',
    amount: selectedAmount,
    transactionNote,
    refId,
  };

  // Deep link excludes amount and tr per spec
  const standardUpiUri = buildUpiUri(paymentDetails);
  // QR code retains amount since scanning works with amounts
  const qrUpiUri = buildUpiQrUri(paymentDetails);

  // Check clipboard for copied UTR when returning to app
  useEffect(() => {
    const handleFocus = async () => {
      try {
        if (navigator.clipboard?.readText) {
          const text = await navigator.clipboard.readText();
          const match = text.trim().match(/\b\d{12}\b/);
          if (match) setDetectedClipboardUtr(match[0]);
        }
      } catch {
        // clipboard permission restricted in some webviews
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleCopy = async (text: string, field: 'vpa' | 'amount') => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  const handleLaunchApp = async (appType: 'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'cred' | 'amazonpay' | 'generic') => {
    setSelectedApp(appType === 'generic' ? 'other' : appType);
    const deepLink = buildAppSpecificUpiUri(appType === 'generic' ? 'generic' : appType, paymentDetails);

    // 4. Before opening the UPI app, copy the bill amount to the clipboard and show a toast
    const amountStr = selectedAmount.toFixed(2);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(amountStr);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = amountStr;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch {
      // Fallback if clipboard permissions are restricted
    }

    setAmountCopiedToast(`Amount ₹${selectedAmount} copied — paste it in your UPI app`);
    setTimeout(() => {
      setAmountCopiedToast(null);
    }, 6500);

    const appLabels: Record<string, string> = {
      phonepe: 'PhonePe',
      gpay: 'Google Pay',
      paytm: 'Paytm',
      bhim: 'BHIM UPI',
      amazonpay: 'Amazon Pay',
      cred: 'CRED',
      generic: 'UPI App',
    };
    const appLabel = appLabels[appType] || 'UPI App';
    setLaunchStatus(`Opened ${appLabel}. Did the payment succeed? Confirm below.`);

    try {
      window.location.href = deepLink;
    } catch {
      const link = document.createElement('a');
      link.href = deepLink;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleConfirmSettle = () => {
    const finalUtr = detectedClipboardUtr || autoRef;
    setIsSettling(true);

    setTimeout(() => {
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch {}

      onPaymentSuccess({
        billId: bill.id,
        amountPaid: selectedAmount,
        principalAmount: bill.amount,
        lateFeePaid: lateFee,
        upiRef: finalUtr,
        upiAppUsed: selectedApp,
        notes: `Settled via ${selectedApp.toUpperCase()} (UTR: ${finalUtr})`,
      });
      setIsSettling(false);
      onClose();
    }, 350);
  };

  const handleSaveCustomVpa = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidVpa(vpaInput.trim())) {
      setActiveVpa(vpaInput.trim());
      setIsEditingVpa(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Simple Clean Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {bill.title}
              </h3>
              <p className="text-xs text-slate-500">
                {bill.provider} · Acc {bill.consumerNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          
          {/* Clipboard Copy Toast (Requirement 4) */}
          {amountCopiedToast && (
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg text-xs font-semibold flex items-center justify-between gap-2 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>{amountCopiedToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setAmountCopiedToast(null)}
                className="text-white/80 hover:text-white cursor-pointer ml-1 p-0.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* Amount Card */}
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Total Payable
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                {formatCurrency(selectedAmount)}
              </div>
            </div>

            {/* Quick Amount Adjuster if over ₹2,000 (Avoids PhonePe Gallery Limit) */}
            {totalAmount > 2000 && (
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-slate-500">Pay options:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedAmount(totalAmount)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      selectedAmount === totalAmount
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Full Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAmount(1999)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      selectedAmount === 1999
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100'
                    }`}
                    title="Under ₹2,000 for gallery QR scanning"
                  >
                    ₹1,999 (Part Pay)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Simple Tab Switcher */}
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPaymentTab('app')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentTab === 'app'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Tap to Pay (App)</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentTab('qr')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentTab === 'qr'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR Code</span>
            </button>
          </div>

          {/* TAB 1: TAP TO PAY (CLEAN & DIRECT) */}
          {paymentTab === 'app' && (
            <div className="space-y-2.5">
              
              {/* Primary: PhonePe (No ₹2000 Gallery Restriction!) */}
              <button
                type="button"
                onClick={() => handleLaunchApp('phonepe')}
                className="w-full py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-between shadow-xs transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white p-0.5 flex items-center justify-center shadow-xs">
                    <PhonePeLogo size={28} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold">Pay with PhonePe</div>
                    <div className="text-[10px] text-purple-200">Direct app launch · No ₹2,000 limit</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono font-bold bg-purple-800/80 px-2 py-0.5 rounded">
                  <span>{formatCurrency(selectedAmount)}</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </div>
              </button>

              {/* Grid of Other Popular UPI Apps with Authentic Logos */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleLaunchApp('gpay')}
                  className="py-2.5 px-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <GooglePayLogo size={22} />
                  <span className="text-xs font-semibold text-slate-800">GPay</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunchApp('paytm')}
                  className="py-2.5 px-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <PaytmLogo size={22} />
                  <span className="text-xs font-semibold text-slate-800">Paytm</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunchApp('bhim')}
                  className="py-2.5 px-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <BhimLogo size={22} />
                  <span className="text-xs font-semibold text-slate-800">BHIM</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunchApp('amazonpay')}
                  className="py-2.5 px-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <AmazonPayLogo size={22} />
                  <span className="text-xs font-semibold text-slate-800">Amazon</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunchApp('cred')}
                  className="py-2.5 px-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <CredLogo size={22} />
                  <span className="text-xs font-semibold text-slate-800">CRED</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunchApp('generic')}
                  className="py-2.5 px-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <UpiGenericLogo size={22} />
                  <span className="text-xs font-semibold text-slate-800">Any UPI</span>
                </button>
              </div>

              {launchStatus && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900 text-center animate-in fade-in duration-150">
                  {launchStatus}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SCAN QR CODE (CLEAN & CENTERED) */}
          {paymentTab === 'qr' && (
            <div className="flex flex-col items-center text-center space-y-2.5 py-1">
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <QRCodeSVG
                  value={qrUpiUri}
                  size={160}
                  level="M"
                  includeMargin={true}
                />
              </div>

              {/* UPI ID with Copy Button */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Payee UPI ID:</span>
                {!isEditingVpa ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {activeVpa}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeVpa, 'vpa')}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedField === 'vpa' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingVpa(true)}
                      className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                      title="Change UPI ID"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveCustomVpa} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={vpaInput}
                      onChange={(e) => setVpaInput(e.target.value)}
                      className="w-36 px-2 py-0.5 text-xs border border-indigo-300 rounded font-mono"
                      placeholder="user@upi"
                    />
                    <button
                      type="submit"
                      className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-bold cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingVpa(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  </form>
                )}
              </div>

              {/* Action buttons: Copy VPA & Copy Payment Link */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy(activeVpa, 'vpa')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {copiedField === 'vpa' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">UPI ID Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy UPI ID</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(standardUpiUri, 'amount')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {copiedField === 'amount' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy UPI Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Clarification for Google Pay / PhonePe "No payment account registered" */}
              <div className="text-[11px] text-slate-500 bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 text-left w-full space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Google Pay / PhonePe QR Note</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  If Google Pay or PhonePe displays <em>"Cannot pay with this QR code"</em> or <em>"Something went wrong"</em>, that biller's default VPA is only payable via BBPS. Tap <strong>Change UPI ID</strong> above to enter your biller's direct UPI ID or personal UPI handle.
                </p>
              </div>

              {/* Clean Notice if PhonePe Gallery Limit applies */}
              {totalAmount > 2000 && selectedAmount > 2000 && (
                <div className="text-[11px] text-slate-500 bg-purple-50/70 border border-purple-100 rounded-lg p-2 text-left w-full">
                  <span className="font-semibold text-purple-900">PhonePe Gallery Tip: </span>
                  Scanning from photos is capped at ₹2,000 by PhonePe. Use the{' '}
                  <button
                    type="button"
                    onClick={() => setPaymentTab('app')}
                    className="font-bold text-purple-700 underline cursor-pointer"
                  >
                    Tap to Pay tab
                  </button>{' '}
                  or select{' '}
                  <button
                    type="button"
                    onClick={() => setSelectedAmount(1999)}
                    className="font-bold text-purple-700 underline cursor-pointer"
                  >
                    ₹1,999
                  </button>.
                </div>
              )}
            </div>
          )}

          {/* Simple Clean Footer Actions */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={handleConfirmSettle}
              disabled={isSettling}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSettling ? 'Marking Paid...' : "I've Paid — Mark as Settled"}</span>
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-slate-400" />
                <span>12-digit UTR auto-saved to history</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
