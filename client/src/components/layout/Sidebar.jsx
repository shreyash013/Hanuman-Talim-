import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useMandal } from '../../context/MandalContext';
import { useNotification } from '../../context/NotificationContext';
import { performCloudSync, getSyncStatus } from '../../services/api';
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
  Landmark,
  RefreshCw,
  CloudUpload
} from 'lucide-react';

export function Sidebar({ onCloseMobile }) {
  const { t } = useLanguage();
  const { user, logout, isAdmin, isTreasurer, isSecretary, isVolunteer, isMember } = useAuth();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncInfo, setSyncInfo] = useState({ lastSyncedAt: null, hasUnsynced: false });

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

  const handleSidebarSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await performCloudSync();
      if (res && res.success) {
        setSyncInfo(getSyncStatus());
        showToast(res.message || 'सर्व डेटा थेट क्लाउड सर्व्हरशी (Supabase & Render) यशस्वीरित्या सिंक झाला!', 'success');
      } else {
        showToast(res.message || 'क्लाउड सिंक करताना अडचण आली.', 'warning');
      }
    } catch {
      showToast('क्लाउड सिंक करताना अडचण आली. इंटरनेट तपासा.', 'error');
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isPrivileged = isAdmin || isTreasurer || isSecretary || isVolunteer;

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard', 'डॅशबोर्ड'), icon: LayoutDashboard, exact: true },
    ...(isPrivileged ? [
      { to: '/vargani', label: t('nav.vargani', 'वर्गणी व्यवस्थापन'), icon: Receipt, highlight: true }
    ] : []),
    { to: '/donors', label: t('nav.donors', 'देणगीदार यादी (Donors)'), icon: Users, highlight: true },
    ...(isPrivileged ? [
      { to: '/income', label: t('nav.income', 'जमा रक्कम'), icon: HandCoins },
      { to: '/expenses', label: t('nav.expenses', 'खर्च व्यवस्थापन'), icon: CreditCard }
    ] : []),
    ...(isAdmin || isTreasurer ? [{ to: '/approvals', label: t('nav.approvals', 'खर्च मंजुरी'), icon: CheckSquare }] : []),
    ...(isPrivileged ? [
      { to: '/transactions', label: t('nav.transactions', 'व्यवहार इतिहास'), icon: History },
      { to: '/loans', label: 'उधारी व्यवस्थापन (Loans)', icon: Landmark }
    ] : []),
    { to: '/digital-payments', label: t('nav.digitalPayments', 'UPI व पेमेंट QR'), icon: QrCode },
    { to: '/members', label: t('nav.members', 'मंडळ कार्यकर्ते'), icon: UserCheck },
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
    <aside className="w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-full select-none shadow-md">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-3 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
        <GanpatiLogo size="md" />
        <div className="overflow-hidden">
          <h2 className="font-black text-sm text-slate-900 dark:text-white truncate font-marathi tracking-tight">
            {mandal?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ'}
          </h2>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold tracking-wider uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {mandal?.festival_year ? `उत्सव ${mandal.festival_year}` : 'व्यवस्थापन प्रणाली'}
          </p>
        </div>
      </div>

      {/* User Role Card */}
      {user && (
        <div className="mx-3 mt-3 p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/90 border border-amber-500/20 dark:border-amber-500/30 flex items-center justify-between shadow-sm">
          <div className="overflow-hidden pr-2">
            <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
              {user.name}
            </p>
            <span className="inline-block mt-0.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
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
                `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-glow-amber font-extrabold scale-[1.01]'
                    : item.highlight
                    ? 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 dark:hover:bg-amber-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Live Cloud Sync Card */}
      <div className="mx-3 my-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${syncInfo.hasUnsynced ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {syncInfo.hasUnsynced ? 'क्लाउड बदल प्रलंबित' : 'क्लाउड सिंक'}
            </span>
          </div>
          <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
            {syncInfo.lastSyncedAt ? 'क्लाउड सुरक्षित ✓' : 'Render Live'}
          </span>
        </div>
        <button
          onClick={handleSidebarSync}
          disabled={isSyncing}
          className={`w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black shadow-xs active:scale-95 transition-all ${
            isSyncing
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 cursor-wait'
              : syncInfo.hasUnsynced
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black shadow-glow-amber'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
          }`}
          title="सर्व स्थानिक डेटा थेट क्लाउड डेटाबेसवर (Render/Supabase) पाठवून इतर उपकरणांशी सिंक करा"
        >
          <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
          <span>
            {isSyncing ? 'क्लाउड सिंक चालू आहे...' : syncInfo.hasUnsynced ? 'क्लाउडवर सिंक करा' : 'क्लाउड सिंक (Cloud Sync)'}
          </span>
        </button>
      </div>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors border border-rose-500/10"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout', 'बाहेर पडा')}</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
