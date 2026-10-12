import { Bill, PaymentRecord } from '../types/bill';

export function exportExpensesToCsv(records: PaymentRecord[], bills: Bill[]): void {
  const headers = [
    'Date Paid',
    'Bill Title',
    'Category',
    'Provider',
    'Consumer / Account ID',
    'Billing Cycle',
    'Principal (INR)',
    'Late Fee (INR)',
    'Total Paid (INR)',
    'Payment Method (UPI)',
    'UPI UTR / Reference',
    'Notes',
  ];

  const rows = records.map((rec) => {
    return [
      `"${new Date(rec.paidDate).toLocaleDateString('en-IN')}"`,
      `"${rec.billTitle.replace(/"/g, '""')}"`,
      `"${rec.category.toUpperCase()}"`,
      `"${rec.provider.replace(/"/g, '""')}"`,
      `"${rec.consumerNumber.replace(/"/g, '""')}"`,
      `"${rec.billingCycle}"`,
      rec.principalAmount.toFixed(2),
      rec.lateFeePaid.toFixed(2),
      rec.amountPaid.toFixed(2),
      `"${rec.upiAppUsed.toUpperCase()}"`,
      `"${rec.upiRef}"`,
      `"${(rec.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `PayGrid_Expense_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBackupJson(bills: Bill[], records: PaymentRecord[], budgetLimit: number): void {
  const data = {
    exportDate: new Date().toISOString(),
    app: 'PayGrid Utility & UPI Expense Manager',
    version: '1.0',
    budgetLimit,
    bills,
    paymentRecords: records,
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `PayGrid_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function triggerPrintReport(): void {
  window.print();
}
