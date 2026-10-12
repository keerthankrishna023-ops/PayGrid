export type AuthProvider = 'gmail' | 'whatsapp';

export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionCadence = 'monthly' | 'yearly';

export interface UserSubscription {
  tier: SubscriptionTier;
  cadence?: SubscriptionCadence;
  validUntil?: string;
  autoRenew: boolean;
  lastPaymentUtr?: string;
  pricePaid?: number;
  trialStartDate?: string;
  trialEndDate?: string;
  forcedUpgrade?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl: string;
  provider: AuthProvider;
  createdAt: string;
  subscription: UserSubscription;
}

export interface SubscriptionPlan {
  id: string;
  cadence: SubscriptionCadence;
  name: string;
  price: number;
  periodText: string;
  billingText: string;
  savingsBadge?: string;
  features: string[];
}
