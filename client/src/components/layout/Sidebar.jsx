import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useMandal } from '../../context/MandalContext';
import { GanpatiLogo } from '../common/GanpatiLogo';
import {
  LayoutDashboard,
  Receipt,
  HandCoins,
  CreditCard,
  CheckSquare,
  History,
  Wallet,
  QrCode,
  Users,
  UserCheck,
  CalendarDays,
  FileSpreadsheet,
  ShieldAlert,
  ShieldCheck,
  Settings,
  LogOut,
  HeartHandshake,
  Award,
  Landmark
} from 'lucide-react';

export function Sidebar({ onCloseMobile }) {
  const { t } = useLanguage();
  const { user, logout, isAdmin, isTreasurer, isSecretary, isVolunteer, isMember } = useAuth();
  const { mandal } = useMandal();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isPrivileged = isAdmin || isTreasurer || isSecretary || isVolunteer;

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard', 'डॅशबोर्ड'), icon: LayoutDashboard, exact: true },
    ...(isPrivileged ? [
      { to: '/vargani', label: t('nav.vargani', 'वर्गणी व्यवस्थापन'), icon: Receipt, highlight: true },
      { to: '/income', label: t('nav.income', 'जमा रक्कम'), icon: HandCoins },
      { to: '/expenses', label: t('nav.expenses', 'खर्च व्यवस्थापन'), icon: CreditCard }
    ] : []),
    ...(isAdmin || isTreasurer ? [{ to: '/approvals', label: t('nav.approvals', 'खर्च मंजुरी'), icon: CheckSquare }] : []),
    ...(isPrivileged ? [
      { to: '/transactions', label: t('nav.transactions', 'व्यवहार इतिहास'), icon: History },
      { to: '/cash-management', label: t('nav.cashManagement', 'रोख व्यवस्थापन'), icon: Wallet },
      { to: '/loans', label: 'उधारी व्यवस्थापन (Loans)', icon: Landmark }
    ] : []),
    { to: '/digital-payments', label: t('nav.digitalPayments', 'UPI व पेमेंट QR'), icon: QrCode },
    { to: '/donors', label: t('nav.donors', 'देणगीदार CRM'), icon: Users },
    { to: '/members', label: t('nav.members', 'मंडळ कार्यकर्ते'), icon: UserCheck },
    { to: '/festival-planner', label: 'उत्सव प्लॅनर (Festival Planner)', icon: CalendarDays, highlight: true },
    { to: '/volunteers', label: 'कार्यकर्ते लीडरबोर्ड (Volunteers)', icon: Award },
    { to: '/events', label: t('nav.events', 'उत्सव कार्यक्रम'), icon: CalendarDays },
    ...(isPrivileged ? [{ to: '/reports', label: t('nav.reports', 'आर्थिक अहवाल'), icon: FileSpreadsheet }] : []),
    ...(isAdmin ? [
      { to: '/users', label: t('nav.users', 'वापरकर्ते व अधिकार'), icon: ShieldCheck },
      { to: '/audit-logs', label: t('nav.auditLogs', 'ऑडिट नोंदी'), icon: ShieldAlert },
      { to: '/settings', label: t('nav.settings', 'मंडळ सेटिंग्ज'), icon: Settings }
    ] : []),
    { to: '/public', label: 'सार्वजनिक भाविक पोर्टल (/public)', icon: HeartHandshake, public: true },
    { to: '/donate', label: t('nav.publicDonation', 'सार्वजनिक देणगी पेज'), icon: HeartHandshake, public: true }
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full select-none shadow-sm">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-amber-500/5 dark:bg-amber-500/10">
        <GanpatiLogo size="md" />
        <div className="overflow-hidden">
          <h2 className="font-extrabold text-sm text-slate-900 dark:text-white truncate font-marathi">
            {mandal?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ'}
          </h2>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold tracking-wider uppercase">
            {mandal?.festival_year ? `उत्सव ${mandal.festival_year}` : 'व्यवस्थापन प्रणाली'}
          </p>
        </div>
      </div>

      {/* User Role Card */}
      {user && (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="overflow-hidden pr-2">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {user.name}
            </p>
            <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              {t(`roles.${user.role}`, user.role)}
            </span>
          </div>
        </div>
      )}

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-festive'
                    : item.highlight
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout', 'बाहेर पडा')}</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
