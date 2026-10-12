export interface UpiPaymentDetails {
  vpa: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
  refId?: string;
  includeRefId?: boolean;
}

/**
 * Builds the standard UPI query string for deep links:
 * - Omits 'am' (amount) and 'tr' (transaction ref).
 * - Manually encodes with encodeURIComponent so spaces become %20 (not +).
 * - Parameters included: pa, pn, cu=INR, tn
 */
export function buildUpiQueryString(details: UpiPaymentDetails): string {
  const pa = encodeURIComponent(details.vpa.trim());
  const pn = encodeURIComponent(details.payeeName.trim().slice(0, 50));
  const cu = 'INR';
  const tn = encodeURIComponent((details.transactionNote || 'Bill Payment').trim().slice(0, 50));

  return `pa=${pa}&pn=${pn}&cu=${cu}&tn=${tn}`;
}

/**
 * Standard UPI URI for deep links (amount and tr excluded).
 */
export function buildUpiUri(details: UpiPaymentDetails): string {
  return `upi://pay?${buildUpiQueryString(details)}`;
}

/**
 * App-specific deep links:
 * - GPay: tez://upi/pay?
 * - PhonePe: phonepe://pay?
 * - Paytm: paytmmp://pay?
 * - BHIM: bhim://pay?
 * - CRED: cred://pay?
 * - Generic: upi://pay?
 */
export function buildAppSpecificUpiUri(
  app: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'cred' | 'amazonpay' | 'generic',
  details: UpiPaymentDetails
): string {
  const queryPart = buildUpiQueryString(details);
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '');

  switch (app) {
    case 'gpay':
      return isAndroid
        ? `intent://pay?${queryPart}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`
        : `tez://upi/pay?${queryPart}`;
    case 'phonepe':
      return isAndroid
        ? `intent://pay?${queryPart}#Intent;scheme=upi;package=com.phonepe.app;end`
        : `phonepe://pay?${queryPart}`;
    case 'paytm':
      return isAndroid
        ? `intent://pay?${queryPart}#Intent;scheme=upi;package=net.one97.paytm;end`
        : `paytmmp://pay?${queryPart}`;
    case 'bhim':
      return isAndroid
        ? `intent://pay?${queryPart}#Intent;scheme=upi;package=in.org.npci.upiapp;end`
        : `bhim://pay?${queryPart}`;
    case 'cred':
      return isAndroid
        ? `intent://pay?${queryPart}#Intent;scheme=upi;package=com.dreamplug.androidapp;end`
        : `cred://pay?${queryPart}`;
    case 'amazonpay':
      return isAndroid
        ? `intent://pay?${queryPart}#Intent;scheme=upi;package=in.amazon.mShop.android.shopping;end`
        : `amazonpay://pay?${queryPart}`;
    case 'generic':
    default:
      return `upi://pay?${queryPart}`;
  }
}

/**
 * QR Code URI:
 * Keeps the amount ('am') parameter, since QR scanning works reliably with amount pre-filled.
 * Encoded manually with encodeURIComponent (%20 for spaces).
 */
export function buildUpiQrUri(details: UpiPaymentDetails): string {
  const pa = encodeURIComponent(details.vpa.trim());
  const pn = encodeURIComponent(details.payeeName.trim().slice(0, 50));
  const am = encodeURIComponent(Math.max(0.01, Number(details.amount) || 1).toFixed(2));
  const cu = 'INR';
  const tn = encodeURIComponent((details.transactionNote || 'Bill Payment').trim().slice(0, 50));

  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}`;
}

export function isValidVpa(vpa: string): boolean {
  // Typical UPI ID format: username@bank
  const regex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return regex.test(vpa.trim());
}

export function isValidUtr(utr: string): boolean {
  // UPI Reference numbers / UTR are typically 12 alphanumeric or numeric digits
  const clean = utr.trim();
  return clean.length >= 8 && clean.length <= 22;
}

export function generateMockUtr(): string {
  const prefix = '4281';
  const remaining8 = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${prefix}${remaining8}`;
}
