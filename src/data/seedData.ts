import { Bill, BillCategory, PaymentRecord } from '../types/bill';

export interface CategoryMeta {
  id: BillCategory;
  name: string;
  iconName: string;
  defaultVpa: string;
  description: string;
  popularProviders: { name: string; vpa: string }[];
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'electricity',
    name: 'Electricity',
    iconName: 'Zap',
    defaultVpa: 'bescom.billdesk@icici',
    description: 'State power distribution companies & electricity boards',
    popularProviders: [
      { name: 'BESCOM (Bangalore)', vpa: 'bescom.billdesk@icici' },
      { name: 'Tata Power (Mumbai/Delhi)', vpa: 'tatapower@billdesk' },
      { name: 'Adani Electricity (Mumbai)', vpa: 'adanielectricity@billdesk' },
      { name: 'BSES Rajdhani (Delhi)', vpa: 'bsesrajdhani@sbi' },
      { name: 'MSEDCL (Maharashtra)', vpa: 'msedcl.bbps@icici' },
      { name: 'UPPCL (Uttar Pradesh)', vpa: 'uppcl.urban@hdfcbank' },
      { name: 'TANGEDCO (Tamil Nadu)', vpa: 'tangedco@billdesk' },
    ],
  },
  {
    id: 'water',
    name: 'Water Supply',
    iconName: 'Droplets',
    defaultVpa: 'bwssb.billdesk@sbi',
    description: 'Municipal water & sewerage boards',
    popularProviders: [
      { name: 'BWSSB (Bangalore)', vpa: 'bwssb.billdesk@sbi' },
      { name: 'Delhi Jal Board (DJB)', vpa: 'delhijalboard@billdesk' },
      { name: 'MCGM Water (Mumbai)', vpa: 'mcgmwater@icici' },
      { name: 'HMWSSB (Hyderabad)', vpa: 'hmwssb@sbi' },
      { name: 'CMWSSB (Chennai)', vpa: 'cmwssb@billdesk' },
    ],
  },
  {
    id: 'gas',
    name: 'Piped Gas & LPG',
    iconName: 'Flame',
    defaultVpa: 'igl.billdesk@hdfcbank',
    description: 'Piped natural gas & domestic LPG cylinder booking',
    popularProviders: [
      { name: 'Indane LPG (IOCL)', vpa: 'indane.lpg@sbi' },
      { name: 'Bharat Gas (BPCL)', vpa: 'bharatgas@icici' },
      { name: 'HP Gas (HPCL)', vpa: 'hpgas@billdesk' },
      { name: 'Indraprastha Gas (IGL)', vpa: 'igl.billdesk@hdfcbank' },
      { name: 'Mahanagar Gas (MGL)', vpa: 'mgl@billdesk' },
      { name: 'Adani Total Gas', vpa: 'adanigas@hdfcbank' },
    ],
  },
  {
    id: 'broadband',
    name: 'Broadband & Fiber',
    iconName: 'Wifi',
    defaultVpa: 'airteltelecom@airtel',
    description: 'High-speed home fiber internet & landlines',
    popularProviders: [
      { name: 'Airtel Xstream Fiber', vpa: 'airteltelecom@airtel' },
      { name: 'JioFiber Broadband', vpa: 'jiofiber@jio' },
      { name: 'ACT Fibernet', vpa: 'actfibernet@icici' },
      { name: 'BSNL Bharat Fiber', vpa: 'bsnl.fiber@sbi' },
      { name: 'Hathway Broadband', vpa: 'hathway@billdesk' },
    ],
  },
  {
    id: 'mobile',
    name: 'Mobile Postpaid',
    iconName: 'Smartphone',
    defaultVpa: 'jio.postpaid@jio',
    description: 'Postpaid telecom bills & monthly recurring plans',
    popularProviders: [
      { name: 'Jio Postpaid Plus', vpa: 'jio.postpaid@jio' },
      { name: 'Airtel Postpaid', vpa: 'airtelpostpaid@airtel' },
      { name: 'Vi (Vodafone Idea) Postpaid', vpa: 'vipostpaid@icici' },
      { name: 'BSNL Mobile Postpaid', vpa: 'bsnlpostpaid@sbi' },
    ],
  },
  {
    id: 'dth',
    name: 'DTH & Cable TV',
    iconName: 'Tv',
    defaultVpa: 'tataplay@billdesk',
    description: 'Direct-to-Home satellite TV subscriptions',
    popularProviders: [
      { name: 'Tata Play', vpa: 'tataplay@billdesk' },
      { name: 'Airtel Digital TV', vpa: 'airteldth@airtel' },
      { name: 'Dish TV', vpa: 'dishtv@icici' },
      { name: 'Sun Direct DTH', vpa: 'sundirect@billdesk' },
    ],
  },
  {
    id: 'society',
    name: 'Housing Society & Rent',
    iconName: 'Building',
    defaultVpa: 'society.maintenance@icici',
    description: 'Monthly/quarterly maintenance, HOA dues & apartment rent',
    popularProviders: [
      { name: 'MyGate Society Dues', vpa: 'mygate.society@icici' },
      { name: 'NoBrokerHOA Maintenance', vpa: 'nobroker.hoa@axisbank' },
      { name: 'Apartment Owners Association', vpa: 'society.maintenance@icici' },
      { name: 'Landlord House Rent (UPI)', vpa: 'landlord.rent@okhdfcbank' },
    ],
  },
  {
    id: 'property_tax',
    name: 'Municipal Property Tax',
    iconName: 'Landmark',
    defaultVpa: 'propertytax@sbi',
    description: 'City municipal corporation property & civic taxes',
    popularProviders: [
      { name: 'BBMP Property Tax (Bengaluru)', vpa: 'bbmptax@sbi' },
      { name: 'MCD Property Tax (Delhi)', vpa: 'mcdtax@icici' },
      { name: 'BMC Property Tax (Mumbai)', vpa: 'bmctax@billdesk' },
      { name: 'GHMC Property Tax (Hyderabad)', vpa: 'ghmctax@sbi' },
    ],
  },
  {
    id: 'fastag',
    name: 'FASTag & Toll',
    iconName: 'Car',
    defaultVpa: 'paytmfastag@paytm',
    description: 'National highway toll tags & vehicle parking balance',
    popularProviders: [
      { name: 'Paytm Payments FASTag', vpa: 'paytmfastag@paytm' },
      { name: 'ICICI Bank FASTag', vpa: 'icicifastag@icici' },
      { name: 'HDFC Bank FASTag', vpa: 'hdfcfastag@hdfcbank' },
      { name: 'SBI FASTag', vpa: 'sbifastag@sbi' },
    ],
  },
  {
    id: 'credit_card',
    name: 'Credit Card Bill',
    iconName: 'CreditCard',
    defaultVpa: 'hdfcbankcard@hdfcbank',
    description: 'Monthly credit card statement dues payable via UPI',
    popularProviders: [
      { name: 'HDFC Bank Credit Card', vpa: 'hdfcbankcard@hdfcbank' },
      { name: 'SBI Card', vpa: 'sbicard@sbi' },
      { name: 'ICICI Bank Credit Card', vpa: 'icicicard@icici' },
      { name: 'Axis Bank Credit Card', vpa: 'axiscard@axisbank' },
    ],
  },
  {
    id: 'insurance',
    name: 'Insurance Premium',
    iconName: 'ShieldCheck',
    defaultVpa: 'licindia@sbi',
    description: 'Life, health, and vehicle policy renewal premiums',
    popularProviders: [
      { name: 'Life Insurance Corp (LIC)', vpa: 'licindia@sbi' },
      { name: 'HDFC Life Insurance', vpa: 'hdfclife@hdfcbank' },
      { name: 'ICICI Prudential Life', vpa: 'icicipru@icici' },
      { name: 'Star Health & Allied', vpa: 'starhealth@icici' },
    ],
  },
  {
    id: 'education',
    name: 'Education & Tuition',
    iconName: 'GraduationCap',
    defaultVpa: 'schoolfees@sbi',
    description: 'Quarterly/half-yearly school, college and coaching fees',
    popularProviders: [
      { name: 'School Term Fee Account', vpa: 'schoolfees@sbi' },
      { name: 'College Tuition Portal', vpa: 'collegetuition@hdfcbank' },
      { name: 'After-School Coaching Academy', vpa: 'coachingdues@icici' },
    ],
  },
  {
    id: 'subscription',
    name: 'Subscriptions & OTT',
    iconName: 'Tv',
    defaultVpa: 'netflix@icici',
    description: 'Netflix, Amazon Prime, Amazon Pay Later, Spotify, Disney+ Hotstar',
    popularProviders: [
      { name: 'Netflix India', vpa: 'netflix@icici' },
      { name: 'Amazon Prime Video', vpa: 'amazonprime@apl' },
      { name: 'Amazon Pay Later / EMI', vpa: 'amazonpaylater@axisbank' },
      { name: 'Disney+ Hotstar', vpa: 'hotstar@icici' },
      { name: 'Spotify Premium', vpa: 'spotify@icici' },
      { name: 'YouTube Premium', vpa: 'google.subscriptions@icici' },
    ],
  },
];

// Current benchmark date: 2026-10-09
export const INITIAL_BILLS: Bill[] = [];

export const INITIAL_PAYMENT_RECORDS: PaymentRecord[] = [];
