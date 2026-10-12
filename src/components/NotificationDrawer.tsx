import React, { useState } from 'react';
import {
  X,
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Share2,
  Check,
  Send,
  Volume2,
} from 'lucide-react';
import { Bill, AppNotification } from '../types/bill';
import {
  generateNotifications,
  requestBrowserNotificationPermission,
  generateWhatsAppReminderText,
} from '../utils/notificationUtils';
import { formatCurrency } from '../utils/dateUtils';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bills: Bill[];
  onPayBill: (bill: Bill) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  bills,
  onPayBill,
}) => {
  const notifications = generateNotifications(bills);
  const [copiedShare, setCopiedShare] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const handleEnablePush = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPermission(res);
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppReminderText(bills);
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const overdueList = notifications.filter((n) => n.type === 'overdue');
  const dueTodayList = notifications.filter((n) => n.type === 'due_today');
  const upcomingList = notifications.filter((n) => n.type === 'due_soon');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Deadline & Late Fee Alerts
              </h3>
              <p className="text-xs text-slate-500">
                Monthly, quarterly & half-yearly schedules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Notification Controls */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Desktop Alerts:</span>
            {browserPermission === 'granted' ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            ) : (
              <button
                onClick={handleEnablePush}
                className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
              >
                Enable Notifications
              </button>
            )}
          </div>

          <button
            onClick={handleCopyWhatsApp}
            className="w-full py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Summary Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Due Bills Summary for WhatsApp / SMS</span>
              </>
            )}
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-800">All Bills are Up to Date</p>
              <p className="text-xs text-slate-500 mt-1">
                No overdue payments or pending deadlines in the next 7 days.
              </p>
            </div>
          ) : (
            <>
              {/* Overdue Section */}
              {overdueList.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Missed Payments & Late Fees ({overdueList.length})</span>
                  </div>
                  <div className="space-y-2">
                    {overdueList.map((item) => {
                      const bill = bills.find((b) => b.id === item.billId);
                      return (
                        <div
                          key={item.id}
                          className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-xs font-bold text-rose-950">
                              {item.title}
                            </span>
                            <span className="text-[11px] font-mono text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded">
                              {item.daysRemainingOrOverdue}d Overdue
                            </span>
                          </div>
                          <p className="text-xs text-rose-900 leading-relaxed">
                            {item.message}
                          </p>
                          {bill && (
                            <button
                              onClick={() => {
                                onClose();
                                onPayBill(bill);
                              }}
                              className="w-full mt-1 py-1.5 px-3 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                            >
                              <span>Tap to Pay with Installed App</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Due Today Section */}
              {dueTodayList.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Due Today ({dueTodayList.length})</span>
                  </div>
                  <div className="space-y-2">
                    {dueTodayList.map((item) => {
                      const bill = bills.find((b) => b.id === item.billId);
                      return (
                        <div
                          key={item.id}
                          className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2"
                        >
                          <span className="text-xs font-bold text-amber-950 block">
                            {item.title}
                          </span>
                          <p className="text-xs text-amber-900 leading-relaxed">
                            {item.message}
                          </p>
                          {bill && (
                            <button
                              onClick={() => {
                                onClose();
                                onPayBill(bill);
                              }}
                              className="w-full mt-1 py-1.5 px-3 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                            >
                              <span>Tap to Pay with Installed App</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upcoming Deadlines Section */}
              {upcomingList.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upcoming Deadlines ({upcomingList.length})</span>
                  </div>
                  <div className="space-y-2">
                    {upcomingList.map((item) => {
                      const bill = bills.find((b) => b.id === item.billId);
                      return (
                        <div
                          key={item.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-xs font-semibold text-slate-900">
                              {item.title}
                            </span>
                            <span className="text-[11px] font-mono text-slate-600">
                              In {item.daysRemainingOrOverdue} days
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.message}
                          </p>
                          {bill && (
                            <button
                              onClick={() => {
                                onClose();
                                onPayBill(bill);
                              }}
                              className="w-full mt-1 py-1 px-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-800 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                            >
                              <span>Tap to Pay with Installed App</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
