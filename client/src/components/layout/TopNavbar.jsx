import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMandal } from '../../context/MandalContext';
import {
  Menu,
  Moon,
  Sun,
  ChevronDown,
  Bot
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { GanpatiLogo } from '../common/GanpatiLogo';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { AiFinancialAssistantModal } from '../ai/AiFinancialAssistantModal';

export function TopNavbar({ onOpenMobileMenu }) {
  const { lang, setLang, t } = useLanguage();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { mandal } = useMandal();

  const [showAiModal, setShowAiModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const languages = [
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  const currentLang = languages.find(l => l.code === lang) || languages[0];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shadow-sm">
      {/* Left Menu Button (Mobile) & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <GanpatiLogo size="sm" className="hidden sm:inline-flex" />
          <div>
            <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-marathi tracking-tight line-clamp-1">
              {mandal?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ'}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-semibold line-clamp-1">
              {mandal?.tagline_mr || 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा राजा ॥ 🔱'}
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* AI Assistant Button */}
        <button
          onClick={() => setShowAiModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-md transition"
          title="AI Financial Assistant"
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>

        {/* Notification Bell Dropdown */}
        <NotificationDropdown />

        {/* AI Assistant Modal */}
        <AiFinancialAssistantModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />

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
