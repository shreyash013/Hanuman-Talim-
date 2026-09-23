import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMandal } from '../../context/MandalContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Menu,
  Sun,
  Moon,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  Cloud,
  CloudUpload
} from 'lucide-react';
import { GanpatiLogo } from '../common/GanpatiLogo';
import { performFullLiveSync, getSyncStatus } from '../../services/api';

export function TopNavbar({ onOpenMobileMenu }) {
  const { lang, setLang, t } = useLanguage();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { mandal } = useMandal();
  const { showToast } = useNotification();

  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncInfo, setSyncInfo] = useState({ lastSyncedAt: null, hasUnsynced: false });

  // Load and listen for local sync changes
  useEffect(() => {
    const updateSyncState = () => {
      setSyncInfo(getSyncStatus());
    };

    updateSyncState();
    window.addEventListener('shirol_data_updated', updateSyncState);
    window.addEventListener('storage', updateSyncState);

    return () => {
      window.removeEventListener('shirol_data_updated', updateSyncState);
      window.removeEventListener('storage', updateSyncState);
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await performFullLiveSync();
      if (res && res.success) {
        setSyncInfo(getSyncStatus());
        showToast(
          res.message || 'सर्व डेटा थेट लाईव्ह सर्व्हरवर सेव्ह झाला आणि इतर सर्व डिव्हाइसेसवर उपलब्ध झाला आहे!',
          'success'
        );
      } else {
        showToast(
          res.message || 'सर्व्हरशी संपर्क होऊ शकला नाही. डेटा स्थानिकरित्या (Local Storage) सुरक्षित आहे.',
          'warning'
        );
      }
    } catch (err) {
      showToast('सिंक करताना अडचण आली. डेटा स्थानिकरित्या सुरक्षित आहे.', 'error');
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  const languages = [
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  const currentLang = languages.find(l => l.code === lang) || languages[0];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 flex items-center justify-between shadow-sm no-print">
      {/* Left Menu Button (Mobile) & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <GanpatiLogo size="sm" className="hidden sm:inline-flex flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-black text-slate-900 dark:text-white font-marathi tracking-tight truncate">
              {mandal?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ'}
            </h1>
            <p className="text-[9px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-semibold truncate">
              {mandal?.tagline_mr || 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा महाराजा ॥ 🔱'}
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* Dedicated Live Cloud Sync Button (Local Storage -> Live Supabase Server) */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-black select-none shadow-xs active:scale-95 transition-all duration-200 ${
            isSyncing
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 cursor-wait'
              : syncInfo.hasUnsynced
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black shadow-glow-amber border-amber-400 ring-2 ring-amber-400/40 animate-pulse'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
          }`}
          title={
            syncInfo.hasUnsynced
              ? 'स्थानिक डेटा साठवला आहे - सर्व्हरवर हलवण्यासाठी व इतर डिव्हाइसेसवर उपलब्ध करण्यासाठी क्लिक करा'
              : syncInfo.lastSyncedAt
              ? `शेवटचा सिंक: ${new Date(syncInfo.lastSyncedAt).toLocaleTimeString('mr-IN')} (डेटा सर्व उपकरणांवर उपलब्ध आहे)`
              : 'सर्व डेटा थेट क्लाउड डेटाबेसवर सेव्ह करा (Live Sync)'
          }
        >
          <RefreshCw
            className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
              isSyncing ? 'animate-spin text-amber-600 dark:text-amber-400' : syncInfo.hasUnsynced ? 'text-slate-950' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          />
          <span className="font-extrabold">
            {isSyncing
              ? 'सिंक चालू...'
              : syncInfo.hasUnsynced
              ? 'थेट सिंक करा'
              : 'थेट सिंक'}
          </span>
          {/* Status Dot */}
          <span className="relative flex h-2 w-2 ml-0.5">
            {syncInfo.hasUnsynced ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            )}
          </span>
        </button>

        {/* Language Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span>{currentLang.flag}</span>
            <span>{currentLang.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold transition-colors ${
                    lang === l.code
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* User Pill */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-inner select-none flex-shrink-0">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[140px]">
                {user.name}
              </p>
              <span className="inline-block text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                {t(`roles.${user.role}`, user.role)}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopNavbar;
