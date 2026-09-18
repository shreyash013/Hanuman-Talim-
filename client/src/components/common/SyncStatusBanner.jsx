import React, { useState, useEffect } from 'react';
import { Cloud, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { forceSyncNow } from '../../services/api';

export function SyncStatusBanner() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [donorsCount, setDonorsCount] = useState(0);
  const [incomeCount, setIncomeCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const checkLocalCounts = () => {
    try {
      const rawDonors = localStorage.getItem('shirol_donors');
      const rawIncome = localStorage.getItem('shirol_income');
      const donors = rawDonors ? JSON.parse(rawDonors) : [];
      const income = rawIncome ? JSON.parse(rawIncome) : [];
      setDonorsCount(Array.isArray(donors) ? donors.length : 0);
      setIncomeCount(Array.isArray(income) ? income.length : 0);
      const last = localStorage.getItem('shirol_last_auto_synced');
      if (last) setLastSyncTime(new Date(last).toLocaleTimeString('mr-IN'));
    } catch (e) {
      console.warn('Sync banner count check note:', e);
    }
  };

  useEffect(() => {
    checkLocalCounts();

    const handleSyncStatus = (e) => {
      const detail = e.detail || {};
      if (detail.status) setStatus(detail.status);
      checkLocalCounts();
    };

    const handleDataUpdate = () => {
      checkLocalCounts();
    };

    window.addEventListener('shirol_sync_status_changed', handleSyncStatus);
    window.addEventListener('shirol_data_updated', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);

    return () => {
      window.removeEventListener('shirol_sync_status_changed', handleSyncStatus);
      window.removeEventListener('shirol_data_updated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
    };
  }, []);

  const handleForceSync = async () => {
    setIsManualSyncing(true);
    setStatus('syncing');
    try {
      const res = await forceSyncNow();
      if (res && res.success) {
        setStatus('synced');
        checkLocalCounts();
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleCopyBackup = () => {
    try {
      const rawDonors = localStorage.getItem('shirol_donors') || '[]';
      const rawIncome = localStorage.getItem('shirol_income') || '[]';
      const rawExpenses = localStorage.getItem('shirol_expenses') || '[]';
      const rawLoans = localStorage.getItem('shirol_loans') || '[]';
      const backupData = {
        mandal: 'श्री हनुमान तालीम मंडळ शिरोळ',
        timestamp: new Date().toISOString(),
        donors: JSON.parse(rawDonors),
        income: JSON.parse(rawIncome),
        expenses: JSON.parse(rawExpenses),
        loans: JSON.parse(rawLoans)
      };

      navigator.clipboard.writeText(JSON.stringify(backupData, null, 2)).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    } catch (e) {
      alert('डेटा कॉपी करताना अडचण आली: ' + e.message);
    }
  };

  // If there are zero donors, no banner needed
  if (donorsCount === 0 && incomeCount === 0) {
    return null;
  }

  return (
    <aside aria-label="Cloud Sync Alert" className="w-full bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 border-b border-amber-200 dark:border-amber-800/40 px-3 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Status Text */}
        <div className="flex items-center gap-2">
          {status === 'syncing' || isManualSyncing ? (
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              <span>क्लाउड सर्व्हरवर सिंक होत आहे... ({donorsCount} देणगीदार)</span>
            </span>
          ) : status === 'synced' ? (
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>सर्व नोंदी लाईव्ह सर्व्हरवर सुरक्षित आहेत ({donorsCount} देणगीदार, {incomeCount} पावती नोंदी) {lastSyncTime ? `• ${lastSyncTime}` : ''}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold">
              <Database className="w-4 h-4 text-amber-500" />
              <span>या डिव्हाइसवर {donorsCount} देणगीदार व {incomeCount} वर्गणी नोंदी आहेत.</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleForceSync}
            disabled={isManualSyncing || status === 'syncing'}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-[11px] shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isManualSyncing ? 'animate-spin' : ''}`} />
            <span>{isManualSyncing ? 'सिंक होत आहे...' : 'आता सिंक करा'}</span>
          </button>

          <button
            onClick={handleCopyBackup}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="सर्व स्थानिक डेटा JSON स्वरूपात कॉपी करा (Backup)"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-500" />}
            <span>{copied ? 'कॉपी झाले!' : 'बॅकअप कॉपी'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default SyncStatusBanner;
