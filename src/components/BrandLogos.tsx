import React from 'react';

// Authentic PhonePe Logo SVG (Purple badge with official 'पे' symbol)
export const PhonePeLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <rect width="100" height="100" rx="50" fill="#5f259f" />
    <path
      d="M58.5 25H41.5C36.8 25 33 28.8 33 33.5V66.5C33 71.2 36.8 75 41.5 75H58.5C63.2 75 67 71.2 67 66.5V33.5C67 28.8 63.2 25 58.5 25Z"
      fill="#5f259f"
    />
    <path
      d="M66 41H46.5C44 41 42 39 42 36.5C42 34 44 32 46.5 32H62C63.1 32 64 31.1 64 30C64 28.9 63.1 28 62 28H46.5C41.8 28 38 31.8 38 36.5C38 41.2 41.8 45 46.5 45H66V41Z"
      fill="white"
    />
    <path
      d="M48 24V47C48 53.6 42.6 59 36 59H33V63H36C44.8 63 52 55.8 52 47V24H48Z"
      fill="white"
    />
    <path
      d="M54 44C54 41.8 55.8 40 58 40C60.2 40 62 41.8 62 44V73C62 74.1 61.1 75 60 75C58.9 75 58 74.1 58 73V52H54V44Z"
      fill="white"
    />
    <circle cx="50" cy="50" r="48" stroke="#7b3fa8" strokeWidth="2" strokeOpacity="0.4" />
  </svg>
);

// Authentic Google Pay Logo SVG (Official multi-color Google G / Pay ribbon)
export const GooglePayLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <rect width="48" height="48" rx="24" fill="#FFFFFF" />
    <circle cx="24" cy="24" r="23" stroke="#E2E8F0" strokeWidth="1" />
    <path
      d="M34.7 24.3c0-.7-.1-1.4-.2-2.1H24v4.2h6c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-5 3.4-8.3z"
      fill="#4285F4"
    />
    <path
      d="M24 35.2c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.8H13.8v2.9c1.9 3.8 5.8 6.4 10.2 6.4z"
      fill="#34A853"
    />
    <path
      d="M17.6 25.9c-.2-.7-.4-1.4-.4-2.2 0-.8.2-1.5.4-2.2v-2.9h-3.8C13.1 20 12.7 21.9 12.7 23.7c0 1.8.4 3.7 1.1 5.1l3.8-2.9z"
      fill="#FBBC05"
    />
    <path
      d="M24 16.5c1.7 0 3.2.6 4.4 1.7l3.3-3.3C29.7 13 27 12.2 24 12.2c-4.4 0-8.3 2.6-10.2 6.4l3.8 2.9c.9-2.7 3.4-5 6.4-5z"
      fill="#EA4335"
    />
  </svg>
);

// Authentic Paytm Logo SVG (Dark Blue & Cyan)
export const PaytmLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <rect width="100" height="100" rx="50" fill="#002E6E" />
    <path
      d="M20 38H33C37.4 38 41 41.6 41 46C41 50.4 37.4 54 33 54H27V66H20V38Z"
      fill="#00BAF2"
    />
    <path
      d="M27 44V48H33C34.1 48 35 47.1 35 46C35 44.9 34.1 44 33 44H27Z"
      fill="#FFFFFF"
    />
    <path
      d="M48 45H54V66H48V45Z"
      fill="#00BAF2"
    />
    <path
      d="M51 37C49.3 37 48 38.3 48 40C48 41.7 49.3 43 51 43C52.7 43 54 41.7 54 40C54 38.3 52.7 37 51 37Z"
      fill="#00BAF2"
    />
    <path
      d="M60 45H67V61C67 62.7 68.3 64 70 64H72V66H69C65.7 66 63 63.3 63 60V50H60V45Z"
      fill="#00BAF2"
    />
    <path
      d="M74 45H80V51C81.2 49 83.4 47.5 86 47.5C89.9 47.5 92 50.3 92 54.5V66H86V55C86 53.3 84.7 52 83 52C81.3 52 80 53.3 80 55V66H74V45Z"
      fill="#FFFFFF"
    />
  </svg>
);

// Authentic BHIM UPI Logo SVG (Saffron & Green Indian Tri-Color)
export const BhimLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <rect width="100" height="100" rx="50" fill="#0E2F56" />
    <path d="M48 20L72 48L48 76H32L56 48L32 20H48Z" fill="#00A859" />
    <path d="M60 20L84 48L60 76H44L68 48L44 20H60Z" fill="#F47920" />
    <path
      d="M24 35H38C41.3 35 44 37.7 44 41C44 43 43 44.7 41.5 45.6C43.5 46.5 45 48.6 45 51C45 54.9 41.9 58 38 58H24V35ZM30 43H36C37.1 43 38 42.1 38 41C38 39.9 37.1 39 36 39H30V43ZM30 54H37C38.1 54 39 53.1 39 52C39 50.9 38.1 50 37 50H30V54Z"
      fill="#FFFFFF"
    />
  </svg>
);

// Authentic Amazon Pay Logo SVG (Amazon Smile & 'a')
export const AmazonPayLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <rect width="100" height="100" rx="50" fill="#131921" />
    <path
      d="M48.2 46.5C44.7 46.5 41.3 47.7 39.1 50.2C37.5 51.9 36.8 54.3 36.8 57C36.8 62.4 40.5 65.5 46.2 65.5C49.3 65.5 52.4 64.2 54.4 62.1V64.8H59.5V41.8H54.4V46.6C52.6 47.1 50.4 46.5 48.2 46.5ZM48.6 61.2C44.7 61.2 42.1 59.4 42.1 56C42.1 52.6 44.9 50.8 48.8 50.8C51.1 50.8 53.2 51.6 54.4 52.8V59.2C53.1 60.5 51 61.2 48.6 61.2Z"
      fill="#FFFFFF"
    />
    <path
      d="M26 69C40.5 77 60 77 74 69"
      stroke="#FF9900"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <path
      d="M71 65L76 70L70 74"
      fill="#FF9900"
    />
  </svg>
);

// Authentic CRED Logo SVG (Dark geometric badge)
export const CredLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <rect width="100" height="100" rx="50" fill="#121212" />
    <rect x="26" y="24" width="48" height="52" rx="8" stroke="#FFFFFF" strokeWidth="4.5" fill="none" />
    <path d="M40 38H60M40 50H60M40 62H52" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
    <circle cx="68" cy="32" r="3" fill="#00D09C" />
  </svg>
);

// Authentic UPI Logo SVG (NPCI UPI Green / Orange Arrow badge)
export const UpiGenericLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <rect width="100" height="100" rx="50" fill="#002D62" />
    <path d="M30 30L55 50L30 70H45L70 50L45 30H30Z" fill="#00B259" />
    <path d="M45 30L70 50L45 70H60L85 50L60 30H45Z" fill="#F47920" />
    <text x="50" y="86" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold" fontFamily="sans-serif">
      UPI
    </text>
  </svg>
);

// PayGrid App Wordmark & Branded Logo Icon
export const PayGridAppLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 32 }) => (
  <div
    style={{ width: size, height: size }}
    className={`relative rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0 overflow-hidden ${className}`}
  >
    {/* Grid pattern backdrop */}
    <div className="absolute inset-0 opacity-20 pointer-events-none">
      <svg width="100%" height="100%" viewBox="0 0 40 40">
        <path d="M0 10h40M0 20h40M0 30h40M10 0v40M20 0v40M30 0v40" stroke="white" strokeWidth="0.8" />
      </svg>
    </div>
    <span className="relative font-black text-lg tracking-tight font-mono select-none drop-shadow-xs">
      ₹
    </span>
  </div>
);
