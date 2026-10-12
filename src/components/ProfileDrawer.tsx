import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Crown,
  LogOut,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { UserProfile } from '../types/auth';
import { formatDisplayDate } from '../utils/dateUtils';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLogout: () => void;
  onOpenSubscriptionModal: () => void;
  trialDaysRemaining?: number;
  isTrialExpired?: boolean;
  onToggleSimulateTrialExpired?: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onOpenSubscriptionModal,
  trialDaysRemaining = 90,
  isTrialExpired = false,
  onToggleSimulateTrialExpired,
}) => {
  if (!isOpen) return null;

  const isPro = currentUser.subscription.tier === 'pro';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            User Profile
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-6 text-center border-b border-slate-100 bg-white">
          <div className="relative inline-block mx-auto mb-3">
            <img
              src={currentUser.photoUrl}
              alt={currentUser.name}
              className="w-20 h-20 rounded-full border-2 border-slate-200 shadow-sm object-cover bg-slate-100"
            />
            {isPro && (
              <span className="absolute bottom-0 right-0 p-1 rounded-full bg-amber-500 text-white shadow-xs">
                <Crown className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900">
            {currentUser.name}
          </h3>

          <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            {currentUser.provider === 'gmail' ? (
              <>
                <Mail className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-mono text-[11px]">{currentUser.email}</span>
              </>
            ) : (
              <>
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-mono text-[11px]">{currentUser.phone}</span>
              </>
            )}
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            <span>Verified via {currentUser.provider === 'gmail' ? 'Google / Gmail' : 'WhatsApp OTP'}</span>
          </div>
        </div>

        {/* Subscription Status Card */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className={`p-4 rounded-xl border ${
            isPro
              ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-amber-950'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                Subscription Plan
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isPro ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {isPro ? `${currentUser.subscription.cadence} Pro` : 'Free Plan'}
              </span>
            </div>

            {isPro ? (
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-amber-900">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>Unlimited Utilities & WhatsApp Alerts Active</span>
                </div>
                {currentUser.subscription.validUntil && (
                  <p className="text-[11px] text-amber-800 font-mono">
                    Valid until: {formatDisplayDate(currentUser.subscription.validUntil)}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-2 space-y-3">
                {isTrialExpired ? (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                    <span className="font-bold block">3-Month Free Trial Ended</span>
                    To continue adding bills and using 1-tap UPI payments, please upgrade to PayGrid Pro.
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center justify-between">
                    <span>3-Month Free Trial:</span>
                    <span className="font-bold">{trialDaysRemaining} days remaining</span>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-700">Pro Upgrade Charges:</div>
                  <div className="flex justify-between">
                    <span>Annual Pro (Recommended):</span>
                    <span className="font-bold text-slate-900 font-mono">₹899/year (₹74.9/mo)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Pro:</span>
                    <span className="font-bold text-slate-900 font-mono">₹99/month</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenSubscriptionModal();
                  }}
                  className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{isTrialExpired ? 'Upgrade Required (from ₹99)' : 'Upgrade to Pro'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Account Details */}
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-700 block">Account Security</span>
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Account ID:</span>
                <span className="font-mono text-[11px] text-slate-800">{currentUser.id.slice(0, 16)}</span>
              </div>
              <div className="flex justify-between">
                <span>Member Since:</span>
                <span className="font-mono text-[11px] text-slate-800">{formatDisplayDate(currentUser.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Data Confidentiality:</span>
                <span className="text-emerald-700 font-medium">Encrypted Locally</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full py-2.5 px-3 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
