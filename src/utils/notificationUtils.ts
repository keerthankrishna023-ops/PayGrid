import { Bill, AppNotification } from '../types/bill';
import { getDaysDifference, calculatePotentialLateFee, formatCurrency, formatDisplayDate } from './dateUtils';

export function generateNotifications(bills: Bill[]): AppNotification[] {
  const notifications: AppNotification[] = [];

  bills.forEach((bill) => {
    if (bill.status === 'paid') return;

    const daysDiff = getDaysDifference(bill.dueDate);

    if (daysDiff < 0) {
      // Overdue / Missed payment
      const overdueDays = Math.abs(daysDiff);
      const lateFee = calculatePotentialLateFee(bill);
      notifications.push({
        id: `notif-overdue-${bill.id}`,
        billId: bill.id,
        type: 'overdue',
        title: `Missed Payment: ${bill.title}`,
        message: `${bill.title} was due on ${formatDisplayDate(bill.dueDate)} (${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue). Potential late fee: ${formatCurrency(lateFee)}.`,
        daysRemainingOrOverdue: overdueDays,
        potentialLateFee: lateFee,
        date: new Date().toISOString(),
        isRead: false,
      });
    } else if (daysDiff === 0) {
      // Due today!
      notifications.push({
        id: `notif-today-${bill.id}`,
        billId: bill.id,
        type: 'due_today',
        title: `Due Today: ${bill.title}`,
        message: `${bill.title} is due today! Pay ${formatCurrency(bill.amount)} via UPI to prevent late fee penalties.`,
        daysRemainingOrOverdue: 0,
        potentialLateFee: 0,
        date: new Date().toISOString(),
        isRead: false,
      });
    } else if (daysDiff <= 3) {
      // Due very soon
      notifications.push({
        id: `notif-soon-${bill.id}`,
        billId: bill.id,
        type: 'due_soon',
        title: `Upcoming Deadline: ${bill.title}`,
        message: `${bill.title} is due in ${daysDiff} days (${formatDisplayDate(bill.dueDate)}). Amount: ${formatCurrency(bill.amount)}.`,
        daysRemainingOrOverdue: daysDiff,
        potentialLateFee: 0,
        date: new Date().toISOString(),
        isRead: false,
      });
    } else if (daysDiff <= 7) {
      notifications.push({
        id: `notif-week-${bill.id}`,
        billId: bill.id,
        type: 'due_soon',
        title: `Upcoming Bill: ${bill.title}`,
        message: `${bill.title} due in ${daysDiff} days (${formatDisplayDate(bill.dueDate)}).`,
        daysRemainingOrOverdue: daysDiff,
        potentialLateFee: 0,
        date: new Date().toISOString(),
        isRead: false,
      });
    }
  });

  return notifications;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}

export function sendBrowserNotification(title: string, body: string): void {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    } catch {
      // fallback in sandbox if not supported
    }
  }
}

export function generateWhatsAppReminderText(bills: Bill[]): string {
  const pendingBills = bills.filter((b) => b.status !== 'paid');
  if (pendingBills.length === 0) {
    return 'All utility bills are settled! No pending dues.';
  }

  let text = `⚡ *PayGrid Utility Bill Reminder*\n\n`;
  let totalDues = 0;

  pendingBills.forEach((b) => {
    const daysDiff = getDaysDifference(b.dueDate);
    const lateFee = calculatePotentialLateFee(b);
    totalDues += b.amount + lateFee;

    if (daysDiff < 0) {
      text += `🚨 *OVERDUE*: ${b.title}\n   Amount: ₹${b.amount} + ₹${lateFee} late fee\n   Due: ${formatDisplayDate(b.dueDate)} (UPI: ${b.billerVpa})\n\n`;
    } else {
      text += `📅 *${b.title}*\n   Amount: ₹${b.amount}\n   Due: ${formatDisplayDate(b.dueDate)} (${daysDiff} days left)\n   UPI: ${b.billerVpa}\n\n`;
    }
  });

  text += `*Total Outstanding:* ₹${totalDues.toLocaleString('en-IN')}\nPay immediately using any UPI app.`;
  return text;
}
