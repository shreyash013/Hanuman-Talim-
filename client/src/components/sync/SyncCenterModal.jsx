import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useNotification } from '../../context/NotificationContext';
import { QRCodeSVG } from 'qrcode.react';
import { API_BASE_URL, performFullLiveSync } from '../../services/api';
import {
  RefreshCw,
  Smartphone,
  Laptop,
  QrCode,
  Download,
  Upload,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Server,
  Database
} from 'lucide-react';

export function SyncCenterModal({ isOpen, onClose }) {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'server'
  const [isCopied, setIsCopied] = useState(false);
  const [syncToken, setSyncToken] = useState('');
  const [importTokenInput, setImportTokenInput] = useState('');
  const [customServerUrl, setCustomServerUrl] = useState(
    localStorage.getItem('shirol_custom_api_url') || ''
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({ income: 0, donors: 0, expenses: 0 });

  const handleCloudLiveSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await performFullLiveSync();
      if (res && res.success) {
        loadLocalStats();
        showToast(res.message || 'सर्व डेटा थेट लाईव्ह सर्व्हरवर सेव्ह झाला आणि सर्व डिव्हाइसेसवर उपलब्ध झाला!', 'success');
      } else {
        showToast(res.message || 'डेटा स्थानिकरित्या सुरक्षित आहे.', 'warning');
      }
    } catch {
      showToast('सिंक करताना अडचण आली.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLocalStats();
    }
  }, [isOpen]);

  const loadLocalStats = () => {
    try {
      const inc = JSON.parse(localStorage.getItem('shirol_income') || '[]');
      const don = JSON.parse(localStorage.getItem('shirol_donors') || '[]');
      const exp = JSON.parse(localStorage.getItem('shirol_expenses') || '[]');
      setStats({
        income: inc.length,
        donors: don.length,
        expenses: exp.length
      });

      // Generate lightweight sync token JSON string
      const payload = {
        app: 'HANUMAN_TALIM_SHIROL',
        timestamp: Date.now(),
        income: inc,
        donors: don,
        expenses: exp
      };
      setSyncToken(JSON.stringify(payload));
    } catch (e) {
      console.error('Error generating sync token:', e);
    }
  };

  // Export Sync JSON File
  const handleExportSyncFile = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(syncToken);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Shirol_Mandal_Sync_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('सिंक फाईल (.json) यशस्वीरित्या डाऊनलोड झाली!', 'success');
    } catch (e) {
      showToast('फाईल डाऊनलोड करताना अडचण आली.', 'error');
    }
  };

  // Import Sync JSON File
  const handleImportSyncFile = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        mergeData(parsed);
      } catch (err) {
        showToast('अवैध सिंक फाईल. कृपया बरोबर फाईल निवडा.', 'error');
      }
    };
  };

  // Import from Manual Token Input / QR Scan
  const handleImportToken = () => {
    if (!importTokenInput.trim()) {
      showToast('कृपया सिंक टोकन पेस्ट करा.', 'warning');
      return;
    }
    try {
      const parsed = JSON.parse(importTokenInput.trim());
      mergeData(parsed);
    } catch (err) {
      showToast('अवैध टोकन फॉरमॅट.', 'error');
    }
  };

  // Core Data Merger Engine
  const mergeData = (parsed) => {
    if (!parsed || parsed.app !== 'HANUMAN_TALIM_SHIROL') {
      showToast('हा डेटा हनुमान तालीम मंडळाचा नाही!', 'error');
      return;
    }

    try {
      let currentIncome = JSON.parse(localStorage.getItem('shirol_income') || '[]');
      let currentDonors = JSON.parse(localStorage.getItem('shirol_donors') || '[]');
      let currentExpenses = JSON.parse(localStorage.getItem('shirol_expenses') || '[]');

      let newIncomeCount = 0;
      let newDonorCount = 0;
      let newExpenseCount = 0;

      // Merge Income
      if (Array.isArray(parsed.income)) {
        parsed.income.forEach((inc) => {
          const exists = currentIncome.some(
            (item) => item.receipt_number === inc.receipt_number || String(item.id) === String(inc.id)
          );
          if (!exists) {
            currentIncome.push(inc);
            newIncomeCount++;
          }
        });
      }

      // Merge Donors
      if (Array.isArray(parsed.donors)) {
        parsed.donors.forEach((don) => {
          const exists = currentDonors.some(
            (item) => item.name === don.name || (don.mobile && item.mobile === don.mobile)
          );
          if (!exists) {
            currentDonors.push(don);
            newDonorCount++;
          }
        });
      }

      // Merge Expenses
      if (Array.isArray(parsed.expenses)) {
        parsed.expenses.forEach((exp) => {
          const exists = currentExpenses.some(
            (item) => item.expense_id === exp.expense_id || String(item.id) === String(exp.id)
          );
          if (!exists) {
            currentExpenses.push(exp);
            newExpenseCount++;
          }
        });
      }

      // Save Back to Local Storage
      localStorage.setItem('shirol_income', JSON.stringify(currentIncome));
      localStorage.setItem('shirol_donors', JSON.stringify(currentDonors));
      localStorage.setItem('shirol_expenses', JSON.stringify(currentExpenses));

      loadLocalStats();
      showToast(
        `सिंक पूर्ण! +${newIncomeCount} जमा, +${newDonorCount} देणगीदार जोडले गेले!`,
        'success'
      );
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (e) {
      console.error('Merge error:', e);
      showToast('डेटा जोडताना त्रुटी निर्माण झाली.', 'error');
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(syncToken);
    setIsCopied(true);
    showToast('सिंक टोकन कॉपी झाला! दुसऱ्या डिव्हाइसवर पेस्ट करा.', 'info');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSaveCustomServerUrl = () => {
    if (customServerUrl.trim()) {
      localStorage.setItem('shirol_custom_api_url', customServerUrl.trim());
      showToast('सर्व्हर IP यशस्वीरित्या जतन झाला! पेज रिफ्रेश होत आहे...', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      localStorage.removeItem('shirol_custom_api_url');
      showToast('डिफॉल्ट सर्व्हर रीसेट झाला.', 'info');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📱 💻 मोबाईल - लॅपटॉप डेटा सिंक केंद्र (Sync Devices)"
      subtitle="मोबाईल आणि लॅपटॉप मधील जमा, वर्गणी व पावत्यांचा डेटा एकमेकांशी जोडा"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('quick')}
            className={`py-2.5 px-4 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'quick'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <Laptop className="w-4 h-4" />
            <span>डायरेक्ट डिव्हाइस सिंक (Direct 1-Click Sync)</span>
          </button>
          <button
            onClick={() => setActiveTab('server')}
            className={`py-2.5 px-4 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'server'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>वाय-फाय / सर्व्हर IP सेटअप (Wi-Fi Local Sync)</span>
          </button>
        </div>

        {/* Supabase + Render Live Cloud Sync Card */}
        <div className="p-4 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border-2 border-emerald-500/30 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                थेट क्लाउड डेटाबेस सिंक (Supabase Live Server)
              </h3>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              🟢 Connected to Live DB
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            या डिव्हाईसवरील सर्व स्थानिक डेटा (देणगीदार, जमा पावत्या, खर्च) थेट लाईव्ह क्लाउड सर्व्हरवर पाठवा. एका क्लिकवर इतर सर्व मोबाईल व लॅपटॉपवर हा डेटा लगेच उपलब्ध होतो.
          </p>
          <button
            onClick={handleCloudLiveSync}
            disabled={isSyncing}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md active:scale-98 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'सिंक चालू आहे...' : '🔄 सर्व डेटा थेट क्लाउड सर्व्हरवर सिंक करा (Live Cloud Sync)'}</span>
          </button>
        </div>

        {/* Current Local Stats Pill */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-wrap items-center justify-between text-xs text-amber-900 dark:text-amber-300 font-medium">
          <span className="flex items-center gap-1.5 font-bold">
            <Database className="w-4 h-4 text-amber-500" />
            <span>या डिव्हाईसवरील सध्याचा डेटा:</span>
          </span>
          <div className="flex items-center gap-3 font-bold">
            <span>🧾 {stats.income} जमा नोंदी</span>
            <span>👥 {stats.donors} देणगीदार</span>
            <span>💸 {stats.expenses} खर्च नोंदी</span>
          </div>
        </div>

        {/* Tab 1: Direct 1-Click Sync */}
        {activeTab === 'quick' && (
          <div className="space-y-6">
            {/* Step 1: Export from Mobile */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">1</span>
                <span>मोबाईलवरून लॅपटॉपला डेटा पाठवा (Export / Share)</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                मोबाईलवरील सर्व नवीन वर्गणी/पावत्या लॅपटॉपमध्ये घेण्यासाठी खालील बटणावरून **सिंक फाईल डाऊनलोड करा** किंवा **टोकन कॉपी** करून लॅपटॉपवर टाका.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleExportSyncFile}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  <Download className="w-4 h-4" />
                  <span>मोबाईल डेटा फाईल (.json) डाऊनलोड करा</span>
                </button>
                <button
                  onClick={handleCopyToken}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-100 transition shadow-xs"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-amber-500" />}
                  <span>{isCopied ? 'कॉपी झाले!' : 'सिंक कोड कॉपी करा'}</span>
                </button>
              </div>
            </div>

            {/* Step 2: Import into Laptop */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">2</span>
                <span>लॅपटॉपमध्ये डेटा सिंक करा (Import into Laptop)</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                मोबाईलवरून पाठवलेली फाईल येथे अपलोड करा. लॅपटॉपवर सर्व नवीन पावत्या व देणगीदार आपोआप जोडले जातील.
              </p>

              <div className="space-y-3 pt-1">
                {/* File Upload Trigger */}
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>मोबाईल सिंक फाईल अपलोड करा (.json)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportSyncFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Or paste Token string */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                    किंवा कॉपी केलेला सिंक कोड पेस्ट करून सिंक करा:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={importTokenInput}
                      onChange={(e) => setImportTokenInput(e.target.value)}
                      placeholder="येथे कोड पेस्ट करा..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      onClick={handleImportToken}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition shrink-0"
                    >
                      सिंक करा
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Wi-Fi Local Network / Server Sync */}
        {activeTab === 'server' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-500" />
                <span>स्थानिक वाय-फाय / हॉटस्पॉट नेटवर्क ऑटो-सिंक</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                मोबाईल व लॅपटॉप एकाच Wi-Fi किंवा हॉटस्पॉटशी जोडलेले असल्यास, लॅपटॉपचा IP ॲड्रेस (उदा. <code>http://192.168.1.5:5000/api</code>) टाकून दोन्ही उपकरणे लाईव्ह कनेक्ट करा.
              </p>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  सर्व्हर API IP / URL:
                </label>
                <input
                  type="text"
                  value={customServerUrl}
                  onChange={(e) => setCustomServerUrl(e.target.value)}
                  placeholder="उदा. http://192.168.1.5:5000/api"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleSaveCustomServerUrl}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    IP जतन करा व कनेक्ट करा
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <span className="font-bold text-amber-600 dark:text-amber-400 block">💡 टीप:</span>
              <p>
                इंटरनेट उपलब्ध नसल्यास **"डायरेक्ट 1-Click Sync"** मधील `.json` फाईल वापरून एका सेकंदात मोबाईलवरील पावत्या लॅपटॉपवर आणता येतात.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default SyncCenterModal;
