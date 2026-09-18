import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Receipt, CreditCard, FileSpreadsheet, Menu, CalendarDays, UserCheck, QrCode, Users } from 'lucide-react';

export function BottomMobileNav({ onOpenMenu, onQuickAction }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isMember = user?.role === 'member';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl no-print">
      {/* 1. Home */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-extrabold transition-all ${
            isActive ? 'text-amber-500 scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>{t('nav.dashboard', 'डॅशबोर्ड')}</span>
      </NavLink>

      {/* 2. Vargani / Events */}
      {isMember ? (
        <NavLink
          to="/events"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-extrabold transition-all ${
              isActive ? 'text-amber-500 scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <CalendarDays className="w-5 h-5" />
          <span>कार्यक्रम</span>
        </NavLink>
      ) : (
        <NavLink
          to="/vargani"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-extrabold transition-all ${
              isActive ? 'text-amber-500 scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <div className="relative p-1 rounded-xl bg-amber-500/20 text-amber-500">
            <Receipt className="w-5 h-5" />
          </div>
          <span>{t('nav.vargani', 'वर्गणी')}</span>
        </NavLink>
      )}

      {/* 3. Donors Directory (3rd position) */}
      <NavLink
        to="/donors"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-extrabold transition-all ${
            isActive ? 'text-amber-500 scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`
        }
      >
        <Users className="w-5 h-5" />
        <span>देणगीदार</span>
      </NavLink>

      {/* 4. Action 4 */}
      {isMember ? (
        <NavLink
          to="/digital-payments"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-extrabold transition-all ${
              isActive ? 'text-amber-500 scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <QrCode className="w-5 h-5" />
          <span>देणगी / UPI</span>
        </NavLink>
      ) : (
        <NavLink
          to="/expenses"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-extrabold transition-all ${
              isActive ? 'text-amber-500 scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <CreditCard className="w-5 h-5" />
          <span>{t('nav.expenses', 'खर्च व्यवस्थापन')}</span>
        </NavLink>
      )}

      {/* 5. More Menu */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center gap-1 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 hover:text-amber-500 transition-all"
      >
        <Menu className="w-5 h-5" />
        <span>मेनू</span>
      </button>
    </div>
  );
}

export default BottomMobileNav;
