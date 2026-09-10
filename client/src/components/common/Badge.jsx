import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export function Badge({ value, type = 'status', className = '' }) {
  const { t } = useLanguage();

  const getStyleAndLabel = () => {
    switch (value) {
      // Statuses
      case 'approved':
      case 'completed':
      case 'reconciled':
      case 'paid':
        return {
          label: t(`expense.${value}`, 'मंजूर'),
          bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
        };
      case 'pending':
      case 'upcoming':
        return {
          label: t(`expense.${value}`, 'प्रलंबित'),
          bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800'
        };
      case 'rejected':
      case 'mismatch':
      case 'cancelled':
        return {
          label: t(`expense.${value}`, 'नामंजूर'),
          bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800'
        };

      // Payment Methods
      case 'cash':
        return {
          label: t('paymentMethods.cash', 'रोख (Cash)'),
          bg: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 border-green-300 dark:border-green-800'
        };
      case 'upi':
        return {
          label: t('paymentMethods.upi', 'UPI'),
          bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
        };
      case 'bank_transfer':
        return {
          label: t('paymentMethods.bank_transfer', 'बँक ट्रान्सफर'),
          bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800'
        };
      case 'cheque':
        return {
          label: t('paymentMethods.cheque', 'धनादेश (Cheque)'),
          bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800'
        };
      case 'pending_udhar':
        return {
          label: '🚩 उधार / जमा बाकी',
          bg: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border-amber-400 dark:border-amber-800'
        };

      // Categories
      default:
        return {
          label: t(`categories.${value}`, value),
          bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
        };
    }
  };

  const { label, bg } = getStyleAndLabel();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bg} ${className}`}
    >
      {label}
    </span>
  );
}

export default Badge;
