import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { Modal } from '../components/common/Modal';
import { StatCard } from '../components/common/StatCard';
import {
  HandCoins,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  FileSpreadsheet,
  Trash2,
  BookOpen,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export function LoansPage() {
  const { t } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState('borrowed'); // 'borrowed' or 'lent'
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState({
    totalBorrowed: 0,
    totalBorrowedRepaid: 0,
    totalBorrowedOutstanding: 0,
    totalLent: 0,
    totalLentRepaid: 0,
    totalLentOutstanding: 0
  });
  const [loading, setLoading] = useState(true);

  // New Loan Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    person_name: '',
    mobile: '',
    type: 'borrowed',
    amount: '',
    payment_method: 'cash',
    purpose: '',
    due_date: '',
    interest_rate: '0',
    notes: ''
  });

  // Repayment Modal State
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayData, setRepayData] = useState({
    amount: '',
    payment_method: 'cash',
    notes: ''
  });

  // Ledger Modal State
  const [ledgerLoan, setLedgerLoan] = useState(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState(null);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const [listRes, summaryRes] = await Promise.all([
        api.get('/loans'),
        api.get('/loans/summary')
      ]);

      if (listRes.success && listRes.data) {
        setLoans(listRes.data);
      }
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err) {
      console.error('fetchLoans error:', err);
      showToast('उधारी माहिती लोड करताना त्रुटी आली.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (!formData.person_name.trim() || !formData.amount || Number(formData.amount) <= 0) {
      showToast('कृपया व्यक्तीचे नाव आणि वैध रक्कम भरा.', 'warning');
      return;
    }

    try {
      const res = await api.post('/loans', formData);
      if (res.success) {
        showToast(res.message || 'उधारीची नोंद जतन झाली!', 'success');
        setShowAddModal(false);
        setFormData({
          person_name: '',
          mobile: '',
          type: activeTab,
          amount: '',
          payment_method: 'cash',
          purpose: '',
          due_date: '',
          interest_rate: '0',
          notes: ''
        });
        fetchLoans();
      } else {
        showToast(res.message || 'नोंद जतन करताना त्रुटी.', 'error');
      }
    } catch {
      showToast('सर्व्हर त्रुटी निर्माण झाली.', 'error');
    }
  };

  const handleRepaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoan || !repayData.amount || Number(repayData.amount) <= 0) {
      showToast('कृपया वैध परतफेड रक्कम भरा.', 'warning');
      return;
    }

    try {
      const res = await api.post(`/loans/${selectedLoan.id}/repay`, repayData);
      if (res.success) {
        showToast(res.message || 'परतफेड नोंदवली!', 'success');
        setShowRepayModal(false);
        setSelectedLoan(null);
        setRepayData({ amount: '', payment_method: 'cash', notes: '' });
        fetchLoans();
      } else {
        showToast(res.message || 'परतफेड करताना त्रुटी.', 'error');
      }
    } catch {
      showToast('सर्व्हर त्रुटी निर्माण झाली.', 'error');
    }
  };

  const handleConfirmDeleteLoan = async () => {
    if (!loanToDelete) return;
    try {
      const res = await api.delete(`/loans/${loanToDelete.id}`);
      if (res.success) {
        showToast('उधारी नोंद हटवली.', 'info');
        setLoanToDelete(null);
        fetchLoans();
      }
    } catch {
      showToast('हटवताना त्रुटी.', 'error');
    }
  };

  const handleSendWhatsAppReminder = (loan) => {
    const mandalName = mandal?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ';
    const remaining = Number(loan.remaining_amount).toLocaleString('en-IN');
    const total = Number(loan.amount).toLocaleString('en-IN');
    const dueDate = loan.due_date ? new Date(loan.due_date).toLocaleDateString('mr-IN') : 'लवकरच';

    const msg = `🙏 *उधारी परतफेड स्मरणपत्र - ${mandalName}*

नमस्कार *${loan.person_name}*,

आपल्या मंडळामधील उधारी खात्याची नोंद खालीलप्रमाणे आहे:

💰 *एकूण रक्कम:* ₹${total}
Remaining *बाकी रक्कम:* ₹${remaining}
🗓️ *परतफेड मुदत तारीख:* ${dueDate}

कृपया मुदतीत परतफेड करून सहकार्य करावे. धन्यवाद!

🚩 *गणपती बाप्पा मोरया!* 🙏`;

    const cleanMobile = (loan.mobile || '').replace(/[^0-9]/g, '');
    const mobileNo = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : '';
    const url = mobileNo
      ? `https://wa.me/91${mobileNo}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
    showToast('व्हॉट्सॲप स्मरणपत्र उघडत आहे...', 'success');
  };

  const filteredLoans = loans.filter((l) => l.type === activeTab);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-slate-900 border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs mb-1">
              <HandCoins className="w-4 h-4" />
              <span>आर्थिक उधारी व्यवस्थापन (Borrowing & Lending Management)</span>
            </div>
            <h1 className="text-2xl font-black text-white">उधारी व कर्ज नोंदवही 💰</h1>
            <p className="text-xs text-slate-300 mt-1">
              मंडळासाठी घेतलेली उधारी, परतफेड, बाकी रक्कम, व्यक्तीनिहाय लेजर व व्हॉट्सॲप स्मरणपत्रे.
            </p>
          </div>

          <button
            onClick={() => {
              setFormData({ ...formData, type: activeTab });
              setShowAddModal(true);
            }}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl font-extrabold text-xs shadow-lg transition transform active:scale-95 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ नवीन उधारी नोंदवा</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="📥 एकूण घेतलेली उधारी (Total Borrowed)"
          value={formatCurrency(summary.totalBorrowed || 0)}
          subtitle="मंडळाने घेतलेली एकूण रक्कम"
          icon={TrendingDown}
          variant="amber"
        />
        <StatCard
          title="↩️ परतफेड केलेली (Total Repaid)"
          value={formatCurrency(summary.totalBorrowedRepaid || 0)}
          subtitle="परत केलेली एकूण रक्कम"
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          title="⚠️ बाकी उधारी (Outstanding Borrowed)"
          value={formatCurrency(summary.totalBorrowedOutstanding || 0)}
          subtitle="मंडळाने द्यायची बाकी रक्कम"
          icon={AlertCircle}
          variant="rose"
        />
        <StatCard
          title="📤 दिलेली उधारी बाकी (Outstanding Lent)"
          value={formatCurrency(summary.totalLentOutstanding || 0)}
          subtitle="इतरांकडून यायची बाकी रक्कम"
          icon={TrendingUp}
          variant="sky"
        />
      </div>

      {/* Tabs & Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex space-x-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('borrowed')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                activeTab === 'borrowed'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📥 घेतलेली उधारी (Borrowed)
            </button>
            <button
              onClick={() => setActiveTab('lent')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                activeTab === 'lent'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📤 दिलेली उधारी (Lent)
            </button>
          </div>

          <span className="text-xs font-bold text-slate-400">
            एकूण नोंदी: {filteredLoans.length}
          </span>
        </div>

        {/* Loans Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">दिनांक</th>
                <th className="pb-3">व्यक्तीचे नाव</th>
                <th className="pb-3">मोबाईल</th>
                <th className="pb-3">उद्देश / खर्च प्रकार</th>
                <th className="pb-3 text-right">एकूण रक्कम</th>
                <th className="pb-3 text-right">परतफेड</th>
                <th className="pb-3 text-right">बाकी रक्कम</th>
                <th className="pb-3 text-center">स्थिती (Status)</th>
                <th className="pb-3 text-center">कृती (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                    कोणतीही उधारी नोंद आढळली नाही. नवीन उधारी जोडण्यासाठी + बटणावर क्लिक करा.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const isFullyPaid = loan.status === 'fully_paid' || Number(loan.remaining_amount) <= 0;
                  const isPartiallyPaid = loan.status === 'partially_paid' && !isFullyPaid;

                  return (
                    <tr key={loan.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 text-slate-300">
                        {loan.created_at ? new Date(loan.created_at).toLocaleDateString('mr-IN') : '-'}
                      </td>
                      <td className="py-3.5 font-extrabold text-white">{loan.person_name}</td>
                      <td className="py-3.5 font-mono text-slate-400">{loan.mobile || '-'}</td>
                      <td className="py-3.5 text-slate-300">{loan.purpose || 'सामान / खर्च मदत'}</td>
                      <td className="py-3.5 text-right font-bold text-slate-200">
                        {formatCurrency(loan.amount)}
                      </td>
                      <td className="py-3.5 text-right font-bold text-emerald-400">
                        {formatCurrency(loan.paid_amount || 0)}
                      </td>
                      <td className="py-3.5 text-right font-black text-amber-400">
                        {formatCurrency(loan.remaining_amount || 0)}
                      </td>
                      <td className="py-3.5 text-center">
                        {isFullyPaid ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[10px]">
                            Fully Paid ✅
                          </span>
                        ) : isPartiallyPaid ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[10px]">
                            Partially Paid ⏳
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 text-[10px]">
                            Pending ⚠️
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Repay Button */}
                          {!isFullyPaid && (
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setRepayData({ amount: `${loan.remaining_amount}`, payment_method: 'cash', notes: '' });
                                setShowRepayModal(true);
                              }}
                              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold rounded-lg transition text-[11px] flex items-center space-x-1"
                              title="परतफेड नोंदवा"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>परतफेड</span>
                            </button>
                          )}

                          {/* Person Ledger View */}
                          <button
                            onClick={() => {
                              setLedgerLoan(loan);
                              setShowLedgerModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition"
                            title="खातेवही पहा"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp Reminder */}
                          <button
                            onClick={() => handleSendWhatsAppReminder(loan)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 rounded-lg hover:bg-emerald-900/60 transition"
                            title="WhatsApp स्मरणपत्र पाठवा"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setLoanToDelete(loan)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-950/40 rounded-lg hover:bg-rose-900/60 transition"
                            title="हटवा"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add New Loan Entry */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={formData.type === 'borrowed' ? '📥 नवीन उधारी नोंदवा (Add Borrowed Loan)' : '📤 नवीन दिलेली उधारी नोंदवा'}
      >
        <form onSubmit={handleCreateLoan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">व्यक्तीचे नाव *</label>
              <input
                type="text"
                required
                value={formData.person_name}
                onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                placeholder="उदा. अमोल पाटील"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">मोबाईल क्रमांक</label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="उदा. 9822012345"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">रक्कम (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="उदा. 10000"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">पेमेंट पद्धत</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="cash">रोख (Cash)</option>
                <option value="upi">UPI / PhonePe / GooglePay</option>
                <option value="bank">बँक ट्रान्सफर (Bank Transfer)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">कशासाठी घेतले / कोणत्या खर्चासाठी?</label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="उदा. मांडव व रोषणाई पेमेंट"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">परत करण्याची तारीख (Due Date)</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">टीप / Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="अतिरिक्त माहिती..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition"
          >
            उधारी नोंदवा (Save Loan)
          </button>
        </form>
      </Modal>

      {/* Modal 2: Repayment Form */}
      {selectedLoan && (
        <Modal
          isOpen={showRepayModal}
          onClose={() => setShowRepayModal(false)}
          title={`↩️ उधारी परतफेड नोंदणी (${selectedLoan.person_name})`}
        >
          <form onSubmit={handleRepaySubmit} className="space-y-4">
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">एकूण उधारी:</span>
                <strong className="text-white">₹{Number(selectedLoan.amount).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">आधी दिलेली परतफेड:</span>
                <strong className="text-emerald-400">₹{Number(selectedLoan.paid_amount || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">एकूण बाकी:</span>
                <strong className="text-amber-400">₹{Number(selectedLoan.remaining_amount).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">आज परत केलेली रक्कम (₹) *</label>
              <input
                type="number"
                required
                min={1}
                max={selectedLoan.remaining_amount}
                value={repayData.amount}
                onChange={(e) => setRepayData({ ...repayData, amount: e.target.value })}
                className="w-full bg-slate-950 border border-amber-500/60 rounded-xl px-3 py-2.5 text-base font-bold text-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">परतफेड पद्धत</label>
              <select
                value={repayData.payment_method}
                onChange={(e) => setRepayData({ ...repayData, payment_method: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="cash">रोख (Cash)</option>
                <option value="upi">UPI / PhonePe / GooglePay</option>
                <option value="bank">बँक ट्रान्सफर (Bank Transfer)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">टीप / Notes</label>
              <input
                type="text"
                value={repayData.notes}
                onChange={(e) => setRepayData({ ...repayData, notes: e.target.value })}
                placeholder="उदा. हप्ता १ दिला"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition"
            >
              परतफेड जतन करा (Record Repayment)
            </button>
          </form>
        </Modal>
      )}

      {/* Modal 3: Person Ledger Statement View */}
      {ledgerLoan && (
        <Modal
          isOpen={showLedgerModal}
          onClose={() => setShowLedgerModal(false)}
          title={`📖 उधारी खातेवही (Ledger Statement) - ${ledgerLoan.person_name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-white text-sm">{ledgerLoan.person_name}</h4>
                <p className="text-slate-400">मोबाईल: {ledgerLoan.mobile || '-'}</p>
                <p className="text-slate-400 mt-0.5">उद्देश: {ledgerLoan.purpose || 'खर्च मदत'}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">बाकी शिल्लक</span>
                <span className="text-xl font-black text-amber-400">
                  ₹{Number(ledgerLoan.remaining_amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2">तारीख</th>
                    <th className="pb-2">तपशील (Description)</th>
                    <th className="pb-2 text-right">घेतलेले (+)</th>
                    <th className="pb-2 text-right">दिलेले (-)</th>
                    <th className="pb-2 text-right">बाकी (Balance)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-2.5 text-slate-300">
                      {ledgerLoan.created_at ? new Date(ledgerLoan.created_at).toLocaleDateString('mr-IN') : '-'}
                    </td>
                    <td className="py-2.5 font-bold text-white">मूळ उधारी (Original Loan)</td>
                    <td className="py-2.5 text-right font-bold text-rose-400">₹{Number(ledgerLoan.amount).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-right text-slate-500">-</td>
                    <td className="py-2.5 text-right font-bold text-amber-400">₹{Number(ledgerLoan.amount).toLocaleString('en-IN')}</td>
                  </tr>

                  {(ledgerLoan.repayments || []).map((rep, idx) => {
                    return (
                      <tr key={rep.id || idx}>
                        <td className="py-2.5 text-slate-300">
                          {rep.date ? new Date(rep.date).toLocaleDateString('mr-IN') : '-'}
                        </td>
                        <td className="py-2.5 text-emerald-300 font-bold">
                          परतफेड ({rep.payment_method}) {rep.notes ? `- ${rep.notes}` : ''}
                        </td>
                        <td className="py-2.5 text-right text-slate-500">-</td>
                        <td className="py-2.5 text-right font-bold text-emerald-400">₹{Number(rep.amount).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 text-right font-bold text-slate-200">
                          ₹{Math.max(0, Number(ledgerLoan.amount) - (rep.amount || 0)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">स्थिती: <strong className="text-white capitalize">{ledgerLoan.status}</strong></span>
              <button
                onClick={() => handleSendWhatsAppReminder(ledgerLoan)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center space-x-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>व्हॉट्सॲप पाठवा</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Loan In-App Confirmation Modal */}
      {loanToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">उधारी नोंद हटवायची आहे का?</h3>
                <p className="text-xs text-slate-400">ही नोंद खात्यातून काढून टाकली जाईल.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">व्यक्तीचे नाव:</span>
                <span className="font-bold text-white text-right">{loanToDelete.person_name}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">रक्कम:</span>
                <span className="font-extrabold text-rose-400 text-sm">₹{Number(loanToDelete.amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">प्रकार:</span>
                <span className="text-amber-400 font-bold">{loanToDelete.type === 'borrowed' ? 'घेतलेली उधारी (देणे)' : 'दिलेली उधारी (येणे)'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setLoanToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                रद्द करा (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLoan}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-rose-900/30"
              >
                <Trash2 className="w-4 h-4" />
                <span>होय, हटवा</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoansPage;
