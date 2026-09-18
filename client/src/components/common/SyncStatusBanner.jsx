import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, RefreshCw, X, AlertCircle } from 'lucide-react';
import { forceSyncNow } from '../../services/api';

export function SyncStatusBanner() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [donorsCount, setDonorsCount] = useState(0);
  const [incomeCount, setIncomeCount] = useState(0);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const autoDismissTimerRef = useRef(null);

  const checkLocalCounts = () => {
    try {
      const rawDonors = localStorage.getItem('shirol_donors');
      const rawIncome = localStorage.getItem('shirol_income');
      const donors = rawDonors ? JSON.parse(rawDonors) : [];
      const income = rawIncome ? JSON.parse(rawIncome) : [];
      setDonorsCount(Array.isArray(donors) ? donors.length : 0);
      setIncomeCount(Array.isArray(income) ? income.length : 0);
    } catch (e) {
      console.warn('Sync banner count check note:', e);
    }
  };

  const clearDismissTimer = () => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
  };

  const scheduleAutoDismiss = (delay = 3000) => {
    clearDismissTimer();
    autoDismissTimerRef.current = setTimeout(() => {
      setStatus('idle');
      autoDismissTimerRef.current = null;
    }, delay);
  };

  useEffect(() => {
    checkLocalCounts();

    const handleSyncStatus = (e) => {
      const detail = e.detail || {};
      if (detail.status) {
        if (detail.status === 'syncing') {
          clearDismissTimer();
          setStatus('syncing');
        } else if (detail.status === 'synced') {
          setStatus('synced');
          scheduleAutoDismiss(3000);
        } else if (detail.status === 'error') {
          setStatus('error');
          scheduleAutoDismiss(4000);
        }
      }
      checkLocalCounts();
    };

    const handleDataUpdate = () => {
      checkLocalCounts();
    };

    window.addEventListener('shirol_sync_status_changed', handleSyncStatus);
    window.addEventListener('shirol_data_updated', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);

    return () => {
      clearDismissTimer();
      window.removeEventListener('shirol_sync_status_changed', handleSyncStatus);
      window.removeEventListener('shirol_data_updated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
    };
  }, []);

  const handleDismiss = () => {
    clearDismissTimer();
    setStatus('idle');
  };

  // Do not show banner when idle
  if (status === 'idle') {
    return null;
  }

  return (
    <aside
      aria-label="Cloud Sync Alert"
      className={`w-full transition-all duration-300 border-b px-3 py-2 text-xs select-none ${
        status === 'synced'
          ? 'bg-emerald-500/15 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
          : status === 'error'
          ? 'bg-rose-500/15 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
          : 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-950 dark:text-amber-100'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Status Message */}
        <div className="flex items-center gap-2">
          {status === 'syncing' || isManualSyncing ? (
            <span className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              <span>क्लाउड सर्व्हरवर सिंक होत आहे... कृपया थांबा</span>
            </span>
          ) : status === 'synced' ? (
            <span className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>सर्व नोंदी लाईव्ह सर्व्हरवर यशस्वीरित्या सिंक झाल्या! ({donorsCount} देणगीदार, {incomeCount} वर्गणी नोंदी)</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>सिंक करताना समस्या आली. इंटरनेट कनेक्शन तपासा.</span>
            </span>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          title="बंद करा"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

export default SyncStatusBanner;
