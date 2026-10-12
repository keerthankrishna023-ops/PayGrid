import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Plus,
  ShieldCheck,
  Crown,
  User,
  LogIn,
  LogOut,
  Smartphone,
  Sparkles,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { UserProfile } from '../types/auth';
import { PayGridAppLogo } from './BrandLogos';

interface HeaderProps {
  activeTab: 'dashboard' | 'bills' | 'analytics' | 'history';
  setActiveTab: (tab: 'dashboard' | 'bills' | 'analytics' | 'history') => void;
  onOpenAddModal: () => void;
  onOpenNotifications: () => void;
  unreadNotificationCount: number;
  hasOverdue: boolean;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onLogout?: () => void;
  onOpenSubscription: () => void;
  onOpenPlayStoreModal: () => void;
  trialDaysRemaining?: number;
  isTrialExpired?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenNotifications,
  unreadNotificationCount,
  hasOverdue,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  onOpenSubscription,
  onOpenPlayStoreModal,
  trialDaysRemaining = 90,
  isTrialExpired = false,
}) => {
  const isPro = currentUser?.subscription.tier === 'pro';
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-6 h-16 w-full">
          {/* Zone 1: Authentic Wordmark & PayGrid Logo */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none cursor-pointer shrink-0"
            title="PayGrid Dashboard"
          >
            <PayGridAppLogo size={32} />
            <div className="flex items-center">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 whitespace-nowrap group-hover:text-indigo-600 transition-colors">
                PayGrid
              </span>
              <span className="hidden md:inline-block ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                UPI Manager
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links (Visible on large screens) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-8 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap pb-1 border-b-2 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'border-indigo-600 text-slate-950 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap pb-1 border-b-2 cursor-pointer ${
                activeTab === 'bills'
                  ? 'border-indigo-600 text-slate-950 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Utility Bills
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap pb-1 border-b-2 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'border-indigo-600 text-slate-950 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Budget & Analytics
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap pb-1 border-b-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'border-indigo-600 text-slate-950 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Payment History
            </button>
          </nav>

          {/* Zone 3: Notification Bell, Profile / Sign In / Sign Out, & Add Bill (Always fits inside screen) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Play Store App Test Button (hidden on small mobile to preserve space) */}
            <button
              onClick={onOpenPlayStoreModal}
              className="hidden sm:inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
              title="Test Android APK package & PWA Install"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Play Store App</span>
              <span className="xl:hidden">APK</span>
            </button>

            {/* Subscription / Trial Status Badges */}
            {currentUser && (
              isPro ? (
                <button
                  onClick={onOpenProfile}
                  className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs hover:bg-amber-200 transition-colors cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span className="capitalize">{currentUser?.subscription.cadence} Pro</span>
                </button>
              ) : isTrialExpired ? (
                <button
                  onClick={onOpenSubscription}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors animate-pulse cursor-pointer"
                  title="Your 3-Month Free Trial has expired. Upgrade to continue."
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Expired · Upgrade</span>
                </button>
              ) : (
                <div className="hidden md:flex items-center gap-1.5">
                  <button
                    onClick={onOpenSubscription}
                    className="hidden 2xl:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                    title="3-Month Free Trial is active"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Free Trial: {trialDaysRemaining}d left</span>
                  </button>
                  <button
                    onClick={onOpenSubscription}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-colors cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Upgrade</span>
                  </button>
                </div>
              )
            )}

            {/* Notification Bell (Always Visible) */}
            <button
              onClick={onOpenNotifications}
              className="relative p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              title="View bill reminders & overdue alerts"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span
                  className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                    hasOverdue ? 'bg-rose-600' : 'bg-amber-500'
                  }`}
                />
              )}
            </button>

            {/* Profile Avatar & Interactive Dropdown OR Sign In Button */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1 p-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  title={`${currentUser.name} - Click for Profile, Settings & Sign Out`}
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="relative">
                    <img
                      src={currentUser.photoUrl}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full border border-slate-300 object-cover bg-slate-200"
                    />
                    {isPro && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-bold">
                        ★
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-500 hidden sm:block" />
                </button>

                {/* Dropdown Menu with Profile Details & Instant Sign Out */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                        {currentUser.email || currentUser.phone}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isPro
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isPro ? `${currentUser.subscription.cadence} Pro` : `Trial (${trialDaysRemaining}d)`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {currentUser.provider === 'gmail' ? 'Google' : 'WhatsApp'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1 text-xs">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenProfile();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>View Profile & Security</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenSubscription();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span>Manage Subscription</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onLogout) {
                            onLogout();
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
                title="Sign in to save and sync utility bills"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign In</span>
              </button>
            )}

            {/* Add / Scan Bill Primary Action (Always Visible) */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
              title="Add a new bill or scan with AI"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              <span className="hidden sm:inline">Add / Scan Bill</span>
              <span className="sm:hidden font-medium">Add Bill</span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Navigation Strip (Always within view on screens < 1024px) */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-slate-100 text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-1 px-2.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'text-indigo-600 font-bold bg-indigo-50/70' : 'hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`py-1 px-2.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'bills' ? 'text-indigo-600 font-bold bg-indigo-50/70' : 'hover:text-slate-900'
            }`}
          >
            Utility Bills
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-1 px-2.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'analytics' ? 'text-indigo-600 font-bold bg-indigo-50/70' : 'hover:text-slate-900'
            }`}
          >
            Budget & Analytics
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-1 px-2.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'history' ? 'text-indigo-600 font-bold bg-indigo-50/70' : 'hover:text-slate-900'
            }`}
          >
            Payment History
          </button>
        </div>
      </div>
    </header>
  );
};


