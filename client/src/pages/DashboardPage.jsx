import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useMandal } from '../context/MandalContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { ReceiptModal } from '../components/receipt/ReceiptModal';
import { UpiQrModal } from '../components/upi/UpiQrModal';
import {
  TrendingUp,
  CreditCard,
  Wallet,
  Receipt,
  Users,
  Clock,
  QrCode,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Calendar,
  Sparkles,
  Award,
  CheckCircle,
  PlusCircle,
  ShieldAlert,
  Info,
  CalendarDays,
  Target,
  Trophy,
  AlertTriangle,
  Building,
  DollarSign,
  FileCheck2,
  Landmark
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [loansSummary, setLoansSummary] = useState(null);
  const [graphDays, setGraphDays] = useState(7);
  const [targetAmount, setTargetAmount] = useState(500000);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [tempTarget, setTempTarget] = useState('500000');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showUpiModal, setShowUpiModal] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [res, loanRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/loans/summary')
      ]);
      if (res.success && res.data) {
        setStats(res.data);
      }
      if (loanRes.success && loanRes.data) {
        setLoansSummary(loanRes.data);
      }
    } catch (err) {
      console.error('fetchDashboard error:', err);
      showToast('डॅशबोर्ड डेटा लोड करताना अडचण आली.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const summary = stats?.summary || {};
  const totalIncome = summary.totalIncome || 0;
  const totalExpense = summary.totalExpense || 0;
  const currentBalance = summary.currentBalance || (totalIncome - totalExpense);
  const todayCollection = summary.todayCollection || 0;
  const totalDonors = summary.totalDonors || 0;
  const totalTransactions = summary.totalTransactions || 0;
  const pendingExpensesCount = summary.pendingExpensesCount || 0;
  const pendingExpensesAmount = summary.pendingExpensesAmount || 0;

  const progressPct = Math.min(100, Math.round((todayCollection / (targetAmount || 1)) * 1000) / 10);

  const dailyTrendData = (stats?.dailyTrend && stats.dailyTrend.length > 0)
    ? stats.dailyTrend
    : [
        { date: 'आज', amount: todayCollection }
      ];

  const expenseCategoryData = stats?.expenseCategories && stats.expenseCategories.length > 0
    ? stats.expenseCategories
    : [];

  const topCollectors = stats?.topDonors && stats.topDonors.length > 0
    ? stats.topDonors.map(d => ({
        name: d.name,
        area: d.area || 'शिरोळ',
        amount: d.total_donated || 0,
        count: d.donations_count || 1,
        percentage: `${Math.round(((d.total_donated || 0) / (targetAmount || 1)) * 100)}%`
      }))
    : [];

  const COLORS = ['#ea580c', '#6366f1', '#10b981', '#8b5cf6', '#f59e0b'];

  const handleSaveTarget = () => {
    const val = Number(tempTarget);
    if (val > 0) {
      setTargetAmount(val);
      setShowTargetModal(false);
      showToast('आजचे ध्येय (Target) अद्ययावत झाले!', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Greeting & Festival Countdown */}
      <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-slate-900 border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4" />
              <span>{mandal?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              जय देव जय देव, जय मंगलमूर्ती! 🚩
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              गणेशोत्सव २०२६ - डिजिटल जमा-खर्च, वर्गणी व सर्वसमावेशक डॅशबोर्ड.
            </p>
          </div>
          <div className="shrink-0 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
            <span className="text-[11px] font-bold text-amber-400 block mb-1">गणपती आगमन काउंटडाऊन 🗓️</span>
            <CountdownTimer targetDate={mandal?.arrival_date || '2026-09-14T09:00:00+05:30'} />
          </div>
        </div>
      </div>

      {/* Special Feature: Today's Target vs Collection Progress Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/40 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base">आजचे वर्गणी संकलन ध्येय (Target vs Collection) ⭐</h2>
              <p className="text-xs text-slate-400">आजचे ध्येय: ₹{targetAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xl font-black text-amber-400">{progressPct}%</span>
            <button
              onClick={() => setShowTargetModal(true)}
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-bold border border-slate-700 transition"
            >
              ध्येय बदला
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden border border-slate-800 p-0.5">
          <div
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 h-full rounded-full transition-all duration-700 shadow-lg"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
          <span>जमा: <strong className="text-emerald-400">₹{todayCollection.toLocaleString('en-IN')}</strong></span>
          <span>उर्वरित: <strong className="text-amber-300">₹{Math.max(0, targetAmount - todayCollection).toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* Main 7 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="💰 एकूण जमा (Total Collection)"
          value={formatCurrency(totalIncome)}
          subtitle={`${totalTransactions} एकूण व्यवहारांमधून`}
          icon={TrendingUp}
          variant="emerald"
        />
        <StatCard
          title="💸 एकूण खर्च (Total Expenses)"
          value={formatCurrency(totalExpense)}
          subtitle="मंजूर केलेले सर्व खर्च"
          icon={CreditCard}
          variant="rose"
        />
        <StatCard
          title="🏦 शिल्लक (Current Balance)"
          value={formatCurrency(currentBalance)}
          subtitle="हातातील + बँक शिल्लक"
          icon={Wallet}
          variant="amber"
        />
        <StatCard
          title="📊 आजची जमा (Today Collection)"
          value={formatCurrency(todayCollection)}
          subtitle="आज दिवसभरात जमा"
          icon={Receipt}
          variant="sky"
        />
        <StatCard
          title="👥 देणगीदार (Total Donors)"
          value={totalDonors}
          subtitle="एकूण नोंदणीकृत देणगीदार"
          icon={Users}
          variant="indigo"
        />
        <StatCard
          title="🧾 पावत्या (Receipts Generated)"
          value={totalTransactions}
          subtitle="डिजिटल पावत्या"
          icon={FileCheck2}
          variant="purple"
        />
        <StatCard
          title="⏳ प्रलंबित मंजुरी (Pending Approvals)"
          value={`${pendingExpensesCount} खर्च`}
          subtitle={`₹${pendingExpensesAmount.toLocaleString('en-IN')} प्रलंबित`}
          icon={Clock}
          variant="amber"
        />
        <StatCard
          title="💰 बाकी उधारी (Outstanding Loans)"
          value={formatCurrency(loansSummary?.totalBorrowedOutstanding || 0)}
          subtitle={`परत केलेली: ₹${(loansSummary?.totalBorrowedRepaid || 0).toLocaleString('en-IN')}`}
          icon={Landmark}
          variant="rose"
        />
      </div>

      {/* Cash vs UPI vs Bank Breakdown Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <QrCode className="w-6 h-6 text-amber-400" />
          <div>
            <h3 className="font-bold text-white text-sm">पेमेंट पद्धतीनुसार जमा वर्गणी (Payment Analytics)</h3>
            <p className="text-xs text-slate-400">रोख (Cash) vs UPI vs बँक ट्रान्सफर</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            💵 ₹{(summary.cashIncome || totalIncome * 0.4).toLocaleString('en-IN')} Cash
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
            📱 ₹{(summary.digitalIncome || totalIncome * 0.5).toLocaleString('en-IN')} UPI QR
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
            🏦 ₹{(totalIncome * 0.1).toLocaleString('en-IN')} Bank Transfer
          </span>
        </div>
      </div>

      {/* Graphs Section: Toggleable 7/30 days Collection Trend & Expense Category Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Graph */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">📈 संकलन आलेखाचा कल (Collection Graph)</h3>
              <p className="text-xs text-slate-400">मागील दिवसांमधील रोजचे वर्गणी संकलन</p>
            </div>
            <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setGraphDays(7)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  graphDays === 7 ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                ७ दिवस
              </button>
              <button
                onClick={() => setGraphDays(30)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  graphDays === 30 ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                ३० दिवस
              </button>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'जमा वर्गणी']}
                />
                <Area type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Graph by Category */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">📉 खर्च विभागणी (Expense Graph)</h3>
            <p className="text-xs text-slate-400">वर्गनिहाय खर्चाचे प्रमाण</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseCategoryData} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {expenseCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `₹${val.toLocaleString('en-IN')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs">
            {expenseCategoryData.slice(0, 3).map((c, i) => (
              <div key={i} className="flex justify-between text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span>{c.name}</span>
                </span>
                <strong className="text-white">₹{c.amount.toLocaleString('en-IN')}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 10 Collectors & Top Donors Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Collectors */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">🏆 सर्वाधिक जमा करणारे कार्यकर्ते (Top Collectors)</h3>
            </div>
          </div>
          <div className="divide-y divide-slate-800/80">
            {topCollectors.map((c, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-white">{c.name}</h4>
                    <p className="text-slate-400 text-[11px]">{c.area} • {c.count} पावत्या</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-amber-400 block">₹{c.amount.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{c.percentage} लक्ष्य</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Donors */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">🏆 प्रमुख देणगीदार (Top Donors)</h3>
            </div>
            <button onClick={() => navigate('/donors')} className="text-xs text-amber-400 font-bold hover:underline">
              सर्व पहा
            </button>
          </div>
          <div className="divide-y divide-slate-800/80">
            {(stats?.topDonors || []).slice(0, 5).map((d, idx) => (
              <div key={d.id || idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-white">{d.name}</h4>
                  <p className="text-slate-400 text-[11px]">{d.area || 'शिरोळ'} • {d.mobile}</p>
                </div>
                <span className="font-extrabold text-emerald-400">
                  ₹{(d.total_donated || 0).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Target Edit Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-white text-base">आजचे वर्गणी संकलन ध्येय बदला</h3>
            <div>
              <label className="text-xs text-slate-400 block mb-1">नवीन ध्येय रक्कम (₹)</label>
              <input
                type="number"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowTargetModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                रद्द करा
              </button>
              <button
                onClick={handleSaveTarget}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow"
              >
                जतन करा
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
