import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  Repeat,
  Check,
  Calendar,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Camera,
  Upload,
  FileText,
  Loader2,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { Bill, BillCategory, BillingFrequency } from '../types/bill';
import { CATEGORIES } from '../data/seedData';
import { isValidVpa } from '../utils/upi';
import { getNextDueDate, formatDisplayDate } from '../utils/dateUtils';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (billData: Omit<Bill, 'id' | 'createdAt'>, billId?: string) => void;
  editingBill?: Bill | null;
}

export const BillModal: React.FC<BillModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBill,
}) => {
  const [category, setCategory] = useState<BillCategory>('electricity');
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('monthly');
  const [billerVpa, setBillerVpa] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [notes, setNotes] = useState('');
  const [lateFeeType, setLateFeeType] = useState<'fixed' | 'percentage_monthly'>('fixed');
  const [lateFeeAmount, setLateFeeAmount] = useState<number>(100);
  const [graceDays, setGraceDays] = useState<number>(3);
  const [autoRecur, setAutoRecur] = useState(true);
  const [showUpiHelp, setShowUpiHelp] = useState(false);
  const [error, setError] = useState('');

  // AI Scanner State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccessMsg, setScanSuccessMsg] = useState<string | null>(null);
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string | null>(null);

  // Selected category metadata
  const currentCategoryMeta = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  const handleScanFile = async (file: File) => {
    setIsScanning(true);
    setScanSuccessMsg(null);
    setError('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64String = e.target?.result as string;
      setScanPreviewUrl(base64String);

      try {
        const res = await fetch('/api/ai/scan-bill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64String,
            mimeType: file.type || 'image/jpeg',
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to scan bill');
        }

        const data = json.data;
        if (data.category && CATEGORIES.some((c) => c.id === data.category)) {
          setCategory(data.category);
        }
        if (data.provider) setProvider(data.provider);
        if (data.title) setTitle(data.title);
        if (data.consumerNumber) setConsumerNumber(data.consumerNumber);
        if (data.amount && !isNaN(Number(data.amount))) setAmount(Number(data.amount));
        if (data.dueDate) setDueDate(data.dueDate);
        if (data.billingFrequency) setBillingFrequency(data.billingFrequency);
        if (data.billerVpa) setBillerVpa(data.billerVpa);
        if (data.payeeName) setPayeeName(data.payeeName);
        if (data.notes) setNotes(data.notes);
        if (data.lateFeeAmount) setLateFeeAmount(Number(data.lateFeeAmount));
        if (data.lateFeeType) setLateFeeType(data.lateFeeType);

        setScanSuccessMsg(
          `AI Extracted: ${data.provider || 'Bill'} (₹${data.amount || '0'}, Due ${data.dueDate || 'date'}). Verified UPI & fields pre-filled!`
        );
      } catch (err: any) {
        console.error('Scan error:', err);
        setError(err?.message || 'Could not scan bill with AI. Please check server connection.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSampleScan = (sampleType: 'electricity' | 'broadband' | 'gas') => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 700);

    // Border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 580, 680);

    // Header based on bill type
    if (sampleType === 'electricity') {
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(10, 10, 580, 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('BESCOM - ELECTRICITY CONSUMPTION BILL', 30, 55);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('Consumer / Account ID: 1048293751', 30, 130);
      ctx.font = '14px Arial';
      ctx.fillText('Billing Month: October 2026', 30, 160);
      ctx.fillText('Meter No: BNG-EM-99214', 30, 185);
      ctx.fillText('Units Consumed: 218 kWh', 30, 210);

      ctx.font = 'bold 20px Arial';
      ctx.fillText('Total Amount Payable: Rs. 1,845.00', 30, 260);
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#b91c1c';
      ctx.fillText('Due Date: 2026-10-26 (Disconnection post grace period)', 30, 290);

      ctx.fillStyle = '#4338ca';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('Pay via UPI: bescom.billdesk@icici', 30, 340);
    } else if (sampleType === 'broadband') {
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(10, 10, 580, 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('Airtel Fiber - High Speed Broadband Bill', 30, 55);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('Account / Landline No: 08044928172', 30, 130);
      ctx.font = '14px Arial';
      ctx.fillText('Plan: 200 Mbps Unlimited Fiber Entertainment', 30, 160);
      ctx.fillText('Billing Cycle: 01-Oct-2026 to 31-Oct-2026', 30, 185);

      ctx.font = 'bold 20px Arial';
      ctx.fillText('Total Amount Payable: Rs. 1,178.00', 30, 260);
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#b91c1c';
      ctx.fillText('Due Date: 2026-10-24', 30, 290);

      ctx.fillStyle = '#4338ca';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('Pay via UPI: airtel.fiber@hdfcbank', 30, 340);
    } else {
      ctx.fillStyle = '#047857';
      ctx.fillRect(10, 10, 580, 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('IGL - Indraprastha Piped Natural Gas Bill', 30, 55);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('BP / Business Partner No: 4001928472', 30, 130);
      ctx.font = '14px Arial';
      ctx.fillText('PNG Domestic Meter Reading: 38.4 SCM', 30, 160);

      ctx.font = 'bold 20px Arial';
      ctx.fillText('Total Amount Payable: Rs. 920.00', 30, 260);
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#b91c1c';
      ctx.fillText('Due Date: 2026-10-29', 30, 290);

      ctx.fillStyle = '#4338ca';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('Pay via UPI: igl@icici', 30, 340);
    }

    // Convert canvas to blob file and process
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${sampleType}_sample_bill.png`, { type: 'image/png' });
        handleScanFile(file);
      }
    }, 'image/png');
  };

  useEffect(() => {
    if (editingBill) {
      setCategory(editingBill.category);
      setTitle(editingBill.title);
      setProvider(editingBill.provider);
      setConsumerNumber(editingBill.consumerNumber);
      setAmount(editingBill.amount);
      setDueDate(editingBill.dueDate);
      setBillingFrequency(editingBill.billingFrequency);
      setBillerVpa(editingBill.billerVpa);
      setPayeeName(editingBill.payeeName);
      setNotes(editingBill.notes || '');
      setLateFeeType(editingBill.lateFeeRule.type as any || 'fixed');
      setLateFeeAmount(editingBill.lateFeeRule.amount || 100);
      setGraceDays(editingBill.lateFeeRule.graceDays || 3);
      setAutoRecur(editingBill.autoRecur ?? true);
    } else {
      // Defaults for new bill
      setCategory('electricity');
      setTitle('Electricity Bill');
      setProvider(CATEGORIES[0].popularProviders[0].name);
      setBillerVpa(CATEGORIES[0].popularProviders[0].vpa);
      setPayeeName(CATEGORIES[0].popularProviders[0].name);
      setConsumerNumber('');
      setAmount('');
      setDueDate('2026-10-25');
      setBillingFrequency('monthly');
      setLateFeeType('fixed');
      setLateFeeAmount(100);
      setGraceDays(3);
      setNotes('');
      setAutoRecur(true);
    }
  }, [editingBill, isOpen]);

  const handleCategoryChange = (newCat: BillCategory) => {
    setCategory(newCat);
    const meta = CATEGORIES.find((c) => c.id === newCat);
    if (meta && meta.popularProviders.length > 0) {
      const defaultProvider = meta.popularProviders[0];
      setProvider(defaultProvider.name);
      setBillerVpa(defaultProvider.vpa);
      setPayeeName(defaultProvider.name);
      setTitle(`${meta.name} Bill`);
    }
  };

  const handleProviderSelect = (provName: string) => {
    setProvider(provName);
    const found = currentCategoryMeta.popularProviders.find((p) => p.name === provName);
    if (found) {
      setBillerVpa(found.vpa);
      setPayeeName(found.name);
      if (!title || title === `${currentCategoryMeta.name} Bill`) {
        setTitle(`${found.name.split(' ')[0]} ${currentCategoryMeta.name}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a bill title');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid bill amount in INR');
      return;
    }
    if (!dueDate) {
      setError('Please specify the due date');
      return;
    }
    if (!billerVpa.trim()) {
      setError('Please enter the biller UPI ID / VPA');
      return;
    }
    if (!isValidVpa(billerVpa.trim())) {
      setError('Invalid UPI ID format (must be username@bank e.g. bescom.billdesk@icici)');
      return;
    }

    onSave(
      {
        title: title.trim(),
        category,
        provider: provider.trim() || currentCategoryMeta.name,
        consumerNumber: consumerNumber.trim() || 'N/A',
        amount: Number(amount),
        dueDate,
        billingFrequency,
        billerVpa: billerVpa.trim(),
        payeeName: payeeName.trim() || provider.trim(),
        notes: notes.trim(),
        status: editingBill?.status || 'pending',
        lateFeeRule: {
          type: lateFeeType,
          amount: Number(lateFeeAmount) || 0,
          graceDays: Number(graceDays) || 0,
        },
        remindDaysBefore: [7, 3, 1, 0],
        autoRecur,
      },
      editingBill?.id
    );

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {editingBill ? 'Edit Utility Bill' : 'Add New Utility Bill'}
            </h3>
            <p className="text-xs text-slate-500">
              Payable via any UPI app with recurring schedule reminders
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Bill Scanner & Document Upload Card */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-indigo-50/80 border border-indigo-200/90 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>AI Bill Auto-Fill (Gemini Vision OCR)</span>
              </div>
              <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                Zero Manual Typing
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Snap a photo or upload your electricity, water, broadband, or gas bill PDF/image to automatically extract biller, consumer ID, amount, due date & UPI VPA.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleScanFile(file);
              }}
            />

            {/* Upload & Camera Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Bill with AI...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Snap / Upload Bill Document</span>
                  </>
                )}
              </button>
            </div>

            {/* Scanning Indicator */}
            {isScanning && (
              <div className="mt-3 p-3 bg-white/90 border border-indigo-200 rounded-lg flex items-center gap-3 animate-pulse">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="text-xs text-indigo-950">
                  <span className="font-bold block">Gemini 3.8 Flash Vision at work...</span>
                  Scanning bill text, extracting provider, CA number, total payable amount, due date & UPI VPA.
                </div>
              </div>
            )}

            {/* Scan Success Banner */}
            {scanSuccessMsg && !isScanning && (
              <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-900 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{scanSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Category Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1.5">
              1. Select Utility Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    category === cat.id
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-xs truncate">{cat.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Providers Quick Select */}
          {currentCategoryMeta.popularProviders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-800">
                  Popular Billers in {currentCategoryMeta.name}
                </label>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  ⚡ Tap to auto-fill verified UPI ID
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentCategoryMeta.popularProviders.map((prov) => (
                  <button
                    key={prov.name}
                    type="button"
                    onClick={() => handleProviderSelect(prov.name)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      provider === prov.name
                        ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title={`Auto-fills: ${prov.vpa}`}
                  >
                    {prov.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bill Title & Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Bill Nickname / Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Home BESCOM Power"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Consumer / Account ID
              </label>
              <input
                type="text"
                value={consumerNumber}
                onChange={(e) => setConsumerNumber(e.target.value)}
                placeholder="e.g. W1-94827419 or Flat B-402"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Bill Amount (₹ INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="2450"
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Current Cycle Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Biller UPI ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Biller UPI ID (VPA) for Instant Payment *
              </label>
              <button
                type="button"
                onClick={() => setShowUpiHelp(!showUpiHelp)}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>How to find biller's UPI ID?</span>
                {showUpiHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={billerVpa}
                onChange={(e) => setBillerVpa(e.target.value)}
                placeholder="e.g. bescom.billdesk@icici or 9876543210@paytm"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Validation & Auto-filled Status Badge */}
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              {(() => {
                const matchedProvider = currentCategoryMeta.popularProviders.find(
                  (p) => p.vpa.toLowerCase() === billerVpa.trim().toLowerCase()
                );

                if (matchedProvider) {
                  return (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Verified official UPI ID for <strong>{matchedProvider.name}</strong></span>
                    </span>
                  );
                }
                if (isValidVpa(billerVpa)) {
                  return (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Valid UPI format ({billerVpa.trim()})</span>
                    </span>
                  );
                }
                if (billerVpa.trim().length > 0) {
                  return (
                    <span className="text-amber-700 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Format: name@bank or 10digitmobile@upi (e.g. bescom@icici)</span>
                    </span>
                  );
                }
                return (
                  <span className="text-slate-400">
                    Select a biller above to auto-fill, or enter their UPI handle
                  </span>
                );
              })()}
            </div>

            {/* Explanatory Guide Box */}
            {showUpiHelp && (
              <div className="mt-2.5 p-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-xl space-y-2.5 text-xs text-slate-700 animate-in fade-in duration-200">
                <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>4 Simple Ways to Find Your Biller's UPI ID:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                    <div className="font-bold text-slate-900 text-[11px] mb-0.5">
                      ⚡ 1. One-Click Auto-Fill (Easiest)
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Tap any popular provider above (e.g. BESCOM, Tata Power, Jio, ACT, Indane). We auto-fill their verified official BBPS UPI ID instantly.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                    <div className="font-bold text-slate-900 text-[11px] mb-0.5">
                      📄 2. On Your Physical or PDF Bill
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Most utility bills (BESCOM, BSES, Mahanagar Gas, Airtel) have a Bharat BillPay (BBPS) QR code with the VPA printed beside it.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                    <div className="font-bold text-slate-900 text-[11px] mb-0.5">
                      📱 3. From Past Payments in GPay / PhonePe
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Open Google Pay, PhonePe, or Paytm &gt; <strong>History</strong> &gt; tap your previous bill payment &gt; look under <strong>'Paid To'</strong> for the exact UPI ID.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                    <div className="font-bold text-slate-900 text-[11px] mb-0.5">
                      🏠 4. Rent, Society, Tuition, or Maid
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Use their 10-digit registered mobile number or bank handle (e.g. <span className="font-mono bg-slate-100 px-1 rounded">9876543210@paytm</span> or <span className="font-mono bg-slate-100 px-1 rounded">society@icici</span>).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Auto-Recur & Recurrence Cadence Configuration Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${autoRecur ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Auto-Recur & Billing Cadence
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Automatically schedules the next deadline when this bill is settled
                  </p>
                </div>
              </div>

              {/* Clear Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={autoRecur}
                onClick={() => {
                  const nextState = !autoRecur;
                  setAutoRecur(nextState);
                  if (!nextState) {
                    setBillingFrequency('one-time');
                  } else if (billingFrequency === 'one-time') {
                    setBillingFrequency('monthly');
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  autoRecur ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoRecur ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {autoRecur ? (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                    Select How Often This Bill Repeats:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAutoRecur(true);
                        setBillingFrequency('monthly');
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        billingFrequency === 'monthly'
                          ? 'border-indigo-600 bg-white ring-1 ring-indigo-600 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Monthly</span>
                        {billingFrequency === 'monthly' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Every 1 month</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAutoRecur(true);
                        setBillingFrequency('quarterly');
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        billingFrequency === 'quarterly'
                          ? 'border-indigo-600 bg-white ring-1 ring-indigo-600 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Quarterly</span>
                        {billingFrequency === 'quarterly' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Every 3 months</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAutoRecur(true);
                        setBillingFrequency('half-yearly');
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        billingFrequency === 'half-yearly'
                          ? 'border-indigo-600 bg-white ring-1 ring-indigo-600 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Half-Yearly</span>
                        {billingFrequency === 'half-yearly' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Every 6 months</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAutoRecur(true);
                        setBillingFrequency('annual');
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        billingFrequency === 'annual'
                          ? 'border-indigo-600 bg-white ring-1 ring-indigo-600 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Annually</span>
                        {billingFrequency === 'annual' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Once a year</span>
                    </button>
                  </div>
                </div>

                {/* Live Rollover Preview Box */}
                {dueDate && (
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Next Rollover Cycle:</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono tabular-nums text-slate-900 font-semibold">
                      <span>{formatDisplayDate(dueDate)}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-indigo-600 font-bold">
                        {formatDisplayDate(getNextDueDate(dueDate, billingFrequency))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600">
                <span className="font-semibold text-slate-900">One-Time Bill (No Recurrence):</span> Once paid, this bill is archived in your history ledger and will not generate future cycle deadlines.
              </div>
            )}
          </div>

          {/* Late Fee & Penalty Configuration */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Missed Payment & Late Fee Rules
              </span>
              <span className="text-[11px] text-slate-500">
                Calculated automatically after due date
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">
                  Penalty Type
                </label>
                <select
                  value={lateFeeType}
                  onChange={(e) => setLateFeeType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="fixed">Fixed Penalty (₹)</option>
                  <option value="percentage_monthly">Monthly Interest (%)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">
                  Penalty Value {lateFeeType === 'fixed' ? '(₹)' : '(%)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={lateFeeAmount}
                  onChange={(e) => setLateFeeAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">
                  Grace Period (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={graceDays}
                  onChange={(e) => setGraceDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Personal Budget Note (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Split with roommate, meter reading 420 kWh"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              {editingBill ? 'Save Changes' : 'Create Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
