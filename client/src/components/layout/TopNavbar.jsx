import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMandal } from '../../context/MandalContext';
import {
  Menu,
  Sun,
  Moon,
  ChevronDown,
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GanpatiLogo } from '../common/GanpatiLogo';
import { forceSyncNow } from '../../services/api';

export function TopNavbar({ onOpenMobileMenu }) {
  const { lang, setLang, t } = useLanguage();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { mandal } = useMandal();

  const [showLangMenu, setShowLangMenu] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [isSyncing, setIsSyncing] = useState(false);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    const handleStatus = (e) => {
      if (e.detail?.status) {
        setSyncStatus(e.detail.status);
        if (e.detail.status === 'synced') {
          if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
          resetTimerRef.current = setTimeout(() => {
            setSyncStatus('idle');
          }, 3000);
        } else if (e.detail.status === 'error') {
          if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
          resetTimerRef.current = setTimeout(() => {
            setSyncStatus('idle');
          }, 4000);
        }
      }
    };
    window.addEventListener('shirol_sync_status_changed', handleStatus);
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      window.removeEventListener('shirol_sync_status_changed', handleStatus);
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      const res = await forceSyncNow();
      if (res && res.success) {
        setSyncStatus('synced');
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      } else {
        setSyncStatus('error');
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => {
          setSyncStatus('idle');
        }, 4000);
      }
    } catch (e) {
      setSyncStatus('error');
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setSyncStatus('idle');
      }, 4000);
    } finally {
      setIsSyncing(false);
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
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Live Cloud Auto-Sync Indicator & Button */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border text-[11px] font-bold select-none shadow-xs active:scale-95 transition-all ${
            syncStatus === 'syncing' || isSyncing
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
              : syncStatus === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              : syncStatus === 'synced'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400'
              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
          title="लाईव्ह क्लाउड ऑटो-सिंक (क्लिक करून लगेच सिंक करा)"
        >
          {syncStatus === 'syncing' || isSyncing ? (
            <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-amber-600" />
          ) : syncStatus === 'synced' ? (
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
          ) : syncStatus === 'error' ? (
            <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600" />
          ) : (
            <Cloud className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
          )}
          <span className="text-[10px] sm:text-[11px] font-bold">
            {syncStatus === 'syncing' || isSyncing
              ? 'सिंक...'
              : syncStatus === 'synced'
              ? 'सिंक पूर्ण ✓'
              : syncStatus === 'error'
              ? 'त्रुटी'
              : 'लाईव्ह सिंक'}
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
