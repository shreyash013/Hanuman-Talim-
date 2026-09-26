import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { downloadCsvReport } from '../utils/exportCsv';
import {
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  Download,
  Image as ImageIcon,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertTriangle,
  FileCheck,
  Building,
  Target,
  Sparkles,
  Loader2,
  FileText,
  Clock,
  Paperclip,
  Eye,
  EyeOff,
  Edit,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';

export function ExpensesPage() {
  const { t, lang } = useLanguage();
  const { user, isAdmin, isTreasurer } = useAuth();
  const { showToast } = useNotification();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Active View Tab: 'approved' (Main List) or 'pending' (Approval Queue)
  const [activeTab, setActiveTab] = useState('approved');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditBudgetModal, setShowEditBudgetModal] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null); // { url, type, title }
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  // Show / Hide Budget Cards State
  const [showBudgetCards, setShowBudgetCards] = useState(() => {
    const saved = localStorage.getItem('showBudgetCards');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Default Budget Category Config
  const defaultBudgets = [
    { category: 'mandap', name: 'मांडव व विद्युत रोषणाई', budget: 50000, color: '#f59e0b' },
    { category: 'sound', name: 'ध्वनी व वाद्य (Sound)', budget: 30000, color: '#ec4899' },
    { category: 'prasad', name: 'प्रसाद व महाप्रसाद', budget: 40000, color: '#10b981' },
    { category: 'cultural', name: 'सांस्कृतिक कार्यक्रम', budget: 20000, color: '#6366f1' }
  ];

  // Budget vs Actual limits configuration with live spending calculations
  const [rawBudgets, setRawBudgets] = useState(() => {
    const saved = localStorage.getItem('mandalCategoryBudgets');
    return saved ? JSON.parse(saved) : defaultBudgets;
  });

  const [editingBudgets, setEditingBudgets] = useState([]);

  // New Category Modal State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudget, setNewCatBudget] = useState('');
  const [newCatColor, setNewCatColor] = useState('#f59e0b');

  // Form State
  const [expenseCategory, setExpenseCategory] = useState('mandap');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidTo, setPaidTo] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [requestedStatus, setRequestedStatus] = useState('approved');
  
  // File Attachment State
  const [fileAttachment, setFileAttachment] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [fileType, setFileType] = useState(null); // 'image' or 'pdf'

  const [duplicateBillWarning, setDuplicateBillWarning] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionProcessing, setActionProcessing] = useState(false);

  const toggleBudgetCards = () => {
    const nextVal = !showBudgetCards;
    setShowBudgetCards(nextVal);
    localStorage.setItem('showBudgetCards', JSON.stringify(nextVal));
    showToast(nextVal ? 'बजेट कार्ड्स दाखवले आहेत.' : 'बजेट कार्ड्स लपवले आहेत.', 'info');
  };

  const handleOpenEditBudget = () => {
    setEditingBudgets(JSON.parse(JSON.stringify(rawBudgets)));
    setShowEditBudgetModal(true);
  };

  const handleSaveBudgets = (e) => {
    e.preventDefault();
    setRawBudgets(editingBudgets);
    localStorage.setItem('mandalCategoryBudgets', JSON.stringify(editingBudgets));
    setShowEditBudgetModal(false);
    showToast('बजेट मर्यादा यशस्वीरित्या जतन झाली! 📊', 'success');
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('कृपया वर्गवारीचे नाव भरा.', 'warning');
      return;
    }
    const parsedBudget = Number(newCatBudget) || 0;
    const catSlug = 'cat_' + Date.now().toString(36);
    const newCategoryItem = {
      category: catSlug,
      name: newCatName.trim(),
      budget: parsedBudget,
      color: newCatColor || '#f59e0b'
    };
    const updated = [...rawBudgets, newCategoryItem];
    setRawBudgets(updated);
    localStorage.setItem('mandalCategoryBudgets', JSON.stringify(updated));
    setEditingBudgets(updated);
    setShowAddCategoryModal(false);
    setNewCatName('');
    setNewCatBudget('');
    showToast(`नवीन बजेट वर्गवारी "${newCatName.trim()}" जोडली! 🎯`, 'success');
  };

  const handleDeleteSingleBudget = (categoryKey, categoryName) => {
    if (!window.confirm(`तुम्हाला नक्की "${categoryName}" ही बजेट वर्गवारी हटवायची आहे का?`)) {
      return;
    }
    const updated = rawBudgets.filter(b => b.category !== categoryKey);
    setRawBudgets(updated);
    localStorage.setItem('mandalCategoryBudgets', JSON.stringify(updated));
    showToast(`बजेट वर्गवारी "${categoryName}" हटवली.`, 'info');
  };

  const handleDeleteFromEditing = (idx) => {
    setEditingBudgets(prev => prev.filter((_, i) => i !== idx));
  };


  const fetchExpenses = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/expenses');
      if (res.success) {
        setExpenses(res.data || []);
      }
    } catch (err) {
      console.error('fetchExpenses error:', err);
      if (!silent) showToast('खर्च यादी लोड करताना त्रुटी.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    const handleSilentUpdate = () => fetchExpenses(true);
    window.addEventListener('shirol_data_updated', handleSilentUpdate);
    window.addEventListener('storage', handleSilentUpdate);
    return () => {
      window.removeEventListener('shirol_data_updated', handleSilentUpdate);
      window.removeEventListener('storage', handleSilentUpdate);
    };
  }, []);

  // Approved Expenses (Main List)
  const approvedExpenses = expenses.filter(e => ['approved', 'paid'].includes(e.status) || !e.status);
  // Pending Expenses (Waiting Queue)
  const pendingExpenses = expenses.filter(e => e.status === 'pending');

  const categoryBudgets = rawBudgets.map(b => {
    const used = approvedExpenses
      .filter(e => e.category === b.category)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { ...b, used };
  });

  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    const target = expenseToDelete;
    setIsDeletingExpense(true);
    try {
      // Optimistically remove from state immediately
      setExpenses(prev => prev.filter(e => {
        if (!e) return false;
        if (target.id && String(e.id) === String(target.id)) return false;
        if (target.expense_id && String(e.expense_id) === String(target.expense_id)) return false;
        return true;
      }));

      const deleteUrl = `/expenses/${encodeURIComponent(target.id || target.expense_id)}${target.expense_id ? `?expense_id=${encodeURIComponent(target.expense_id)}` : ''}`;
      const res = await api.delete(deleteUrl);
      if (res.success) {
        showToast(`खर्च "${target.description || ''}" यशस्वीरित्या कायमचा हटवला! 🗑️`, 'success');
        setExpenseToDelete(null);
        await fetchExpenses(true);
      } else {
        showToast(res.message || 'खर्च हटवताना त्रुटी.', 'error');
        fetchExpenses();
      }
    } catch (err) {
      showToast(err.message || 'खर्च हटवताना त्रुटी.', 'error');
      fetchExpenses();
    } finally {
      setIsDeletingExpense(false);
    }
  };

  const handleApproveExpense = async (id, expId) => {
    try {
      setActionProcessing(true);
      const res = await api.put(`/expenses/${id}/approve`, {});
      if (res.success) {
        showToast(`खर्च ${expId || id} मुख्य यादीत मंजूर झाला!`, 'success');
        setExpenses(prev => prev.map(e =>
          (String(e.id) === String(id) || String(e.expense_id) === String(expId))
            ? { ...e, status: 'approved', approved_at: new Date().toISOString() }
            : e
        ));
        fetchExpenses();
      } else {
        showToast(res.message || 'खर्च मंजूर करताना त्रुटी आली.', 'error');
      }
    } catch (err) {
      console.error('handleApproveExpense error:', err);
      showToast(err?.message || 'खर्च मंजूर करताना त्रुटी आली.', 'error');
    } finally {
      setActionProcessing(false);
    }
  };

  const handleRejectExpense = async (id, expId) => {
    const reason = window.prompt('नामंजूर करण्याचे कारण लिहा:', 'कागदपत्र किंवा बिल अपूर्ण');
    if (reason === null) return;
    try {
      setActionProcessing(true);
      const res = await api.put(`/expenses/${id}/reject`, { reason });
      if (res.success) {
        showToast('खर्च नामंजूर करण्यात आला.', 'info');
        setExpenses(prev => prev.map(e =>
          (String(e.id) === String(id) || String(e.expense_id) === String(expId))
            ? { ...e, status: 'rejected' }
            : e
        ));
        fetchExpenses();
      } else {
        showToast(res.message || 'नामंजूर करताना त्रुटी आली.', 'error');
      }
    } catch (err) {
      console.error('handleRejectExpense error:', err);
      showToast(err?.message || 'नामंजूर करताना त्रुटी आली.', 'error');
    } finally {
      setActionProcessing(false);
    }
  };

  // Select list based on active tab
  const currentTabExpenses = activeTab === 'approved' ? approvedExpenses : pendingExpenses;

  const filteredExpenses = currentTabExpenses.filter(e => {
    const matchesSearch = !search ||
      (e.description && e.description.toLowerCase().includes(search.toLowerCase())) ||
      (e.paid_to && e.paid_to.toLowerCase().includes(search.toLowerCase())) ||
      (e.bill_number && e.bill_number.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Duplicate bill check
  useEffect(() => {
    if (billNumber.trim().length > 2) {
      const match = expenses.find((e) => e.bill_number && e.bill_number.trim().toLowerCase() === billNumber.trim().toLowerCase());
      setDuplicateBillWarning(match || null);
    } else {
      setDuplicateBillWarning(null);
    }
  }, [billNumber, expenses]);

  // Handle File Input Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileAttachment(null);
      setFilePreviewUrl('');
      setFileType(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('फाईलचा आकार १० MB पेक्षा कमी असणे आवश्यक आहे.', 'warning');
      return;
    }

    setFileAttachment(file);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setFileType(isPdf ? 'pdf' : 'image');

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!description.trim() || !paidTo.trim() || !amount || Number(amount) <= 0) {
      showToast('कृपया आवश्यक माहिती (वर्णन, कोणाला दिले, वैध रक्कम) भरा.', 'warning');
      return;
    }

    if (expenseCategory === 'custom' && !customCategoryName.trim()) {
      showToast('कृपया सानुकूल वर्गवारीचे नाव टाका.', 'warning');
      return;
    }

    const finalCategory = expenseCategory === 'custom' ? (customCategoryName.trim() || 'इतर सानुकूल खर्च') : expenseCategory;
    const now = new Date().toISOString();
    const tempId = Date.now();

    // --- OPTIMISTIC UPDATE: add to UI state instantly (0 second delay) ---
    const optimisticExpense = {
      id: tempId,
      expense_id: `EXP-2026-TEMP-${tempId}`,
      description: description.trim(),
      amount: Number(amount),
      category: finalCategory,
      payment_method: paymentMethod,
      paid_to: paidTo.trim(),
      bill_number: billNumber.trim(),
      bill_attachment_url: filePreviewUrl || '',
      status: 'pending',
      requested_by_name: user?.name || 'श्रेयश गावडे (खजिनदार)',
      approved_by_name: null,
      notes: notes.trim(),
      created_at: now,
    };

    setExpenses(prev => [optimisticExpense, ...prev]);
    setActiveTab('pending');
    setShowAddModal(false);
    showToast('नवीन खर्च मंजुरीच्या रांगेत यशस्वीरित्या जोडला गेला! (Pending Approval) ⏳', 'success');
    resetForm();

    // --- BACKGROUND: persist to localStorage + cloud (non-blocking) ---
    const formData = new FormData();
    formData.append('description', optimisticExpense.description);
    formData.append('amount', optimisticExpense.amount);
    formData.append('category', finalCategory);
    formData.append('payment_method', paymentMethod);
    formData.append('paid_to', optimisticExpense.paid_to);
    formData.append('bill_number', optimisticExpense.bill_number);
    formData.append('notes', optimisticExpense.notes);
    formData.append('status', 'pending');
    if (fileAttachment) formData.append('bill_attachment', fileAttachment);
    if (filePreviewUrl) formData.append('bill_attachment_url', filePreviewUrl);

    api.post('/expenses', formData)
      .then(res => {
        if (res.success && res.data) {
          // Replace temp optimistic entry with the real saved record
          setExpenses(prev => prev.map(exp =>
            exp.id === tempId ? { ...optimisticExpense, ...res.data } : exp
          ));
        }
        fetchExpenses(true);
        window.dispatchEvent(new Event('shirol_data_updated'));
      })
      .catch(err => {
        // Rollback: remove optimistic entry on failure
        setExpenses(prev => prev.filter(exp => exp.id !== tempId));
        showToast(err.message || 'खर्च नोंदवताना त्रुटी. कृपया पुन्हा प्रयत्न करा.', 'error');
      });
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setPaidTo('');
    setBillNumber('');
    setNotes('');
    setExpenseCategory('mandap');
    setCustomCategoryName('');
    setFileAttachment(null);
    setFilePreviewUrl('');
    setFileType(null);
    setRequestedStatus('pending');
    setDuplicateBillWarning(null);
  };

  const openAttachmentPreview = (url, title = 'बिल / पावती') => {
    if (!url) return;
    const isPdf = url.toLowerCase().includes('.pdf') || url.startsWith('data:application/pdf');
    setPreviewAttachment({
      url,
      type: isPdf ? 'pdf' : 'image',
      title
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs mb-1">
            <CreditCard className="w-4 h-4" />
            <span>स्मार्ट खर्च व्यवस्थापन (Smart Expense Management)</span>
          </div>
          <h1 className="text-2xl font-black text-white">खर्च व बजेट नियंत्रण (Expenses & Budgets)</h1>
          <p className="text-xs text-slate-400 mt-1">
            फोटो/PDF बिल अपलोड, बजेट मर्यादा, आणि ॲडमिन मंजुरी रांग व्यवस्थापन.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={async () => {
              try {
                showToast('सर्व खर्च डाऊनलोड होत आहे...', 'info');
                await downloadCsvReport('expenses');
                showToast('सर्व खर्च यशस्वीरित्या डाऊनलोड झाला! 📥', 'success');
              } catch (err) {
                showToast(err.message || 'डाऊनलोड करताना त्रुटी.', 'error');
              }
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-1.5"
            title="सर्व खर्च एक्सेल/CSV फाइल डाऊनलोड करा (Download All Expenses)"
          >
            <Download className="w-4 h-4" />
            <span>सर्व खर्च डाऊनलोड (Download All)</span>
          </button>
          <button
            onClick={toggleBudgetCards}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs border border-slate-700 transition flex items-center space-x-1.5"
            title={showBudgetCards ? "बजेट कार्ड्स लपवा" : "बजेट कार्ड्स दाखवा"}
          >
            {showBudgetCards ? <EyeOff className="w-4 h-4 text-rose-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">{showBudgetCards ? 'बजेट लपवा' : 'बजेट दाखवा'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-lg transition flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>नवीन खर्च जोडा</span>
          </button>
        </div>
      </div>

      {/* Budget vs Actual Category Progress Cards */}
      {showBudgetCards && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4" />
              <span>वर्गवारीनुसार बजेट मर्यादा व खर्च (Category Budget Limits)</span>
            </h3>
            <div className="flex items-center space-x-2">
              {(isAdmin || isTreasurer) && (
                <>
                  <button
                    onClick={() => setShowAddCategoryModal(true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition flex items-center space-x-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ नवीन वर्गवारी (Add Category)</span>
                  </button>
                  <button
                    onClick={handleOpenEditBudget}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition flex items-center space-x-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>बजेट संपादित करा (Edit Budgets)</span>
                  </button>
                </>
              )}
              <button
                onClick={toggleBudgetCards}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] font-bold transition flex items-center space-x-1"
              >
                <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                <span>लपवा (Remove All)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryBudgets.map((b, idx) => {
              const remaining = b.budget - b.used;
              const pct = Math.min(100, Math.round((b.used / (b.budget || 1)) * 100));
              return (
                <div key={b.category || idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white pr-2 truncate">{b.name}</span>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-amber-400">{pct}% वापरले</span>
                      {(isAdmin || isTreasurer) && (
                        <button
                          onClick={() => handleDeleteSingleBudget(b.category, b.name)}
                          className="opacity-60 hover:opacity-100 p-1 text-rose-400 hover:text-rose-300 transition rounded-md hover:bg-rose-500/20"
                          title={`"${b.name}" वर्गवारी हटवा (Delete)`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: b.color || '#f59e0b' }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>खर्च: <strong>₹{b.used.toLocaleString('en-IN')}</strong></span>
                    <span>मर्यादा: <strong>₹{b.budget.toLocaleString('en-IN')}</strong></span>
                  </div>
                  <div className="text-right text-[10px]">
                    <span className={remaining >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {remaining >= 0 ? `शिल्लक: ₹${remaining.toLocaleString('en-IN')}` : `मर्यादा ओलांडली: ₹${Math.abs(remaining).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Navigation: Main Approved List vs Pending Approval Queue */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
              activeTab === 'approved'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>मुख्य खर्च यादी ({approvedExpenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 relative ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>मंजुरीच्या प्रतीक्षेत रांग (Queue)</span>
            {pendingExpenses.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white animate-pulse">
                {pendingExpenses.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'pending' && (
          <div className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>टीप: ॲडमिनने मंजूर करेपर्यंत हे खर्च मुख्य खर्चाच्या यादीत समाविष्ट होणार नाहीत.</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="खर्च, नाव किंवा बिल क्र. शोधा..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">सर्व वर्गवारी (All Categories)</option>
              {rawBudgets.map(b => (
                <option key={b.category} value={b.category}>{b.name}</option>
              ))}
              <option value="other">इतर खर्च (Other)</option>
              {Array.from(new Set(currentTabExpenses.map(e => e.category).filter(c => c && !rawBudgets.some(b => b.category === c) && c !== 'other'))).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            onClick={async () => {
              try {
                showToast('सर्व खर्च CSV डाऊनलोड होत आहे...', 'info');
                await downloadCsvReport('expenses');
                showToast('सर्व खर्च यशस्वीरित्या डाऊनलोड झाला! 📥', 'success');
              } catch (err) {
                showToast(err.message || 'डाऊनलोड करताना त्रुटी.', 'error');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-700/50 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 text-xs font-bold transition shadow-sm"
            title="सर्व खर्च एक्सेल/CSV फाइल डाऊनलोड करा (Download All Expenses)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>सर्व खर्च डाऊनलोड (CSV)</span>
          </button>
          <span className="text-xs text-slate-400 font-medium">
            एकूण: <strong className="text-white">{filteredExpenses.length}</strong> {activeTab === 'approved' ? 'मंजूर खर्च' : 'प्रलंबित खर्च'}
          </span>
        </div>
      </div>

      {/* Mobile Card View (Visible on small & mobile screens) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
            खर्च यादी लोड होत आहे...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
            {activeTab === 'approved'
              ? 'कोणतेही मंजूर खर्च सापडले नाहीत.'
              : 'सध्या मंजुरीच्या प्रतीक्षेत कोणताही खर्च नाही.'}
          </div>
        ) : (
          filteredExpenses.map((e, idx) => (
            <div key={e.id || e.expense_id || idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-500">#{idx + 1}</span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 capitalize">
                    {e.category || 'इतर खर्च'}
                  </span>
                  {e.status === 'pending' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      मंजुरी बाकी
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      मंजूर
                    </span>
                  )}
                </div>
                <span className="text-base font-black text-rose-400">
                  ₹{(Number(e.amount) || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">{e.description}</h4>
                <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  <span>कोणाला दिले: <strong className="text-slate-200">{e.paid_to || '-'}</strong></span>
                  {e.bill_number && <span>• बिल क्र: {e.bill_number}</span>}
                  {e.payment_method && <span>• {e.payment_method === 'cash' ? '💵 रोख' : '📱 ऑनलाइन'}</span>}
                </div>
              </div>

              {e.bill_attachment_url && (
                <div>
                  <button
                    onClick={() => openAttachmentPreview(e.bill_attachment_url, e.description)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition text-xs font-bold"
                  >
                    {e.bill_attachment_url.toLowerCase().includes('.pdf') || e.bill_attachment_url.startsWith('data:application/pdf') ? (
                      <>
                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                        <span>PDF बिल पहा</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span>फोटो बिल पहा</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                {activeTab === 'pending' && (isAdmin || isTreasurer) && (
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={actionProcessing}
                      onClick={() => handleApproveExpense(e.id, e.expense_id)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-1 shadow"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>मंजूर करा</span>
                    </button>
                    <button
                      disabled={actionProcessing}
                      onClick={() => handleRejectExpense(e.id, e.expense_id)}
                      className="flex-1 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold border border-rose-500/30 transition flex items-center justify-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>नामंजूर करा</span>
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setExpenseToDelete(e)}
                  className="w-full py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>हा खर्च कायमचा हटवा (Delete Expense)</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Expenses Table (Visible on medium & large screens) */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <th className="p-4 w-14 text-center font-black text-xs text-slate-400 uppercase tracking-wider">अ.क्र.</th>
                <th className="p-4">खर्च तपशील (Description)</th>
                <th className="p-4">कोणाला दिले (Paid To)</th>
                <th className="p-4">वर्गवारी (Category)</th>
                <th className="p-4">पावती / बिल (Attachment)</th>
                <th className="p-4 text-right">रक्कम (Amount)</th>
                <th className="p-4 text-center">स्थिती व कृती (Status & Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                    खर्च यादी लोड होत आहे...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    {activeTab === 'approved'
                      ? 'कोणतेही मंजूर खर्च सापडले नाहीत.'
                      : 'सध्या मंजुरीच्या प्रतीक्षेत कोणताही खर्च नाही.'}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e, idx) => (
                  <tr key={e.id || e.expense_id || idx} className="hover:bg-slate-800/40 transition group">
                    <td className="p-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="p-4 font-bold text-white">
                      {e.description}
                      <div className="flex items-center space-x-2 text-[10px] font-normal text-slate-400 mt-0.5">
                        {e.bill_number && <span>बिल क्र: {e.bill_number}</span>}
                        {e.requested_by_name && <span>• नोंदणी: {e.requested_by_name.replace(/मयुर बागल/g, 'श्रेयश गावडे').replace(/Mayur Bagal/gi, 'श्रेयश गावडे').replace(/श्रेयश गवडे/g, 'श्रेयश गावडे')}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{e.paid_to}</td>
                    <td className="p-4 text-slate-400 capitalize">{e.category}</td>

                    {/* Attachment Column */}
                    <td className="p-4">
                      {e.bill_attachment_url ? (
                        <button
                          onClick={() => openAttachmentPreview(e.bill_attachment_url, e.description)}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition text-[11px] font-bold"
                        >
                          {e.bill_attachment_url.toLowerCase().includes('.pdf') || e.bill_attachment_url.startsWith('data:application/pdf') ? (
                            <>
                              <FileText className="w-3.5 h-3.5 text-rose-400" />
                              <span>PDF बिल पहा</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                              <span>फोटो बिल पहा</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">अपलोड नाही</span>
                      )}
                    </td>

                    <td className="p-4 text-right font-extrabold text-rose-400">
                      ₹{(Number(e.amount) || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Status & Actions Column */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {activeTab === 'approved' ? (
                          <>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              मंजूर
                            </span>
                            <button
                              onClick={() => setExpenseToDelete(e)}
                              title="खर्च कायमचा हटवा (Delete Expense)"
                              className="p-1.5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              मंजुरी बाकी
                            </span>
                            {(isAdmin || isTreasurer) && (
                              <div className="flex items-center space-x-1 ml-1">
                                <button
                                  disabled={actionProcessing}
                                  onClick={() => handleApproveExpense(e.id, e.expense_id)}
                                  title="मंजूर करा (Approve)"
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-extrabold transition flex items-center space-x-1 shadow"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>मंजूर</span>
                                </button>
                                <button
                                  disabled={actionProcessing}
                                  onClick={() => handleRejectExpense(e.id, e.expense_id)}
                                  title="नामंजूर करा (Reject)"
                                  className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-[10px] font-bold border border-rose-500/30 transition flex items-center space-x-1"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>नामंजूर</span>
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => setExpenseToDelete(e)}
                              title="खर्च कायमचा हटवा (Delete Expense)"
                              className="p-1.5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition ml-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="font-extrabold text-white text-base flex items-center justify-between">
              <span>नवीन खर्च नोंदवा (Add Expense)</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>थेट मंजूर खर्च</span>
              </span>
            </h3>

            {duplicateBillWarning && (
              <div className="bg-rose-500/10 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>⚠️ इशारा: या क्रमांकाचे बिल ({billNumber}) आधीच नोंदवले गेले आहे!</span>
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">खर्चाचे वर्णन (Description) *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="उदा. मंडप रोषणाई ॲडव्हान्स बिल"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">कोणाला दिले (Paid To) *</label>
                  <input
                    type="text"
                    required
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    placeholder="उदा. श्री स्वामी समर्थ डेकोरेटर्स"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">रक्कम (₹) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500 font-bold text-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">वर्गवारी (Category)</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    {rawBudgets.map(b => (
                      <option key={b.category} value={b.category}>{b.name}</option>
                    ))}
                    <option value="other">इतर खर्च (Other Expense)</option>
                    <option value="custom">✏️ सानुकूल वर्गवारी (Custom Category)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">बिल क्रमांक (Bill No)</label>
                  <input
                    type="text"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    placeholder="उदा. BILL-102"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {expenseCategory === 'custom' && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl space-y-1">
                  <label className="text-amber-400 block font-bold text-xs">
                    ✏️ सानुकूल वर्गवारीचे नाव व तपशील (Custom Category Name / Description) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="उदा. स्वागत कमान, हार तुरे, ध्वज, किंवा इतर सानुकूल खर्च..."
                    className="w-full bg-slate-950 border border-amber-500/60 rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* File Attachment Upload Input (Image or PDF) */}
              <div>
                <label className="text-slate-400 block mb-1 flex items-center justify-between">
                  <span>बिल / पावती फाईल जोडणी (Image or PDF Attachment)</span>
                  <span className="text-[10px] text-amber-400">JPG, PNG, PDF (Max 10MB)</span>
                </label>
                <div className="border border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-3 bg-slate-950 text-center relative transition">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {fileAttachment ? (
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg text-left">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        {fileType === 'pdf' ? (
                          <FileText className="w-5 h-5 text-rose-400 shrink-0" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-amber-400 shrink-0" />
                        )}
                        <span className="truncate text-white font-medium text-xs">{fileAttachment.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFileAttachment(null);
                          setFilePreviewUrl('');
                          setFileType(null);
                        }}
                        className="text-rose-400 hover:text-rose-300 text-xs font-bold px-2 py-1"
                      >
                        हटवा
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 py-1">
                      <Paperclip className="w-5 h-5 text-slate-400 mx-auto" />
                      <p className="text-slate-300 font-medium">बिलाचा फोटो किंवा PDF निवडा</p>
                      <p className="text-[10px] text-slate-500">क्लिक करा किंवा फाईल ड्रॅग करा</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>हा खर्च थेट मुख्य मंजूर यादीमध्ये समाविष्ट होईल आणि मंडळाच्या थेट हिशोबात जोडला जाईल.</span>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-400 hover:text-white"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  {isSubmitting ? 'जतन होत आहे...' : 'खर्च जतन करा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal (Image & PDF) */}
      <Modal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        title={previewAttachment?.title || 'बिल जोडणी (Bill Attachment)'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 p-2">
          {previewAttachment?.type === 'pdf' ? (
            <div className="space-y-3 text-center">
              <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
                <FileText className="w-12 h-12 text-rose-400 mx-auto mb-2" />
                <h4 className="font-bold text-white text-sm mb-1">PDF दस्तऐवज (PDF Document)</h4>
                <p className="text-xs text-slate-400 mb-3">तुम्ही हे PDF बिल थेट ब्राउझरमध्ये पाहू किंवा डाउनलोड करू शकता.</p>
                <div className="flex justify-center space-x-3">
                  <a
                    href={previewAttachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition inline-flex items-center space-x-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>नवीन टॅबमध्ये उघडा</span>
                  </a>
                  <a
                    href={previewAttachment.url}
                    download="bill_attachment.pdf"
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition inline-flex items-center space-x-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>डाउनलोड PDF</span>
                  </a>
                </div>
              </div>
              <iframe
                src={previewAttachment.url}
                title="PDF Preview"
                className="w-full h-[50vh] rounded-xl border border-slate-800"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <img
                src={previewAttachment?.url}
                alt="Bill Attachment"
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-md border border-slate-800"
              />
              <a
                href={previewAttachment?.url}
                download="bill_image.jpg"
                className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl transition inline-flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>फोटो डाउनलोड करा</span>
              </a>
            </div>
          )}
        </div>
      </Modal>

      {/* Edit Budget Modal */}
      <Modal
        isOpen={showEditBudgetModal}
        onClose={() => setShowEditBudgetModal(false)}
        title="📊 बजेट मर्यादा संपादित करा (Edit Budget Limits)"
        subtitle="वर्गवारीनुसार गणेशोत्सव खर्चासाठी बजेट मर्यादा सेट करा"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveBudgets} className="space-y-4">
          <div className="space-y-3">
            {editingBudgets.map((b, idx) => (
              <div key={b.category || idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{b.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color || '#f59e0b' }} />
                    <button
                      type="button"
                      onClick={() => handleDeleteFromEditing(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/20 rounded-md transition"
                      title="ही वर्गवारी हटवा (Delete)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-bold">मंजूर बजेट Limit (₹):</span>
                  <input
                    type="number"
                    min={0}
                    required
                    value={b.budget}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setEditingBudgets((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, budget: val } : item))
                      );
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-extrabold outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setEditingBudgets(defaultBudgets);
                }}
                className="text-[11px] text-slate-400 hover:text-white underline font-medium"
              >
                डिफॉल्ट रीसेट करा
              </button>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(true)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ नवीन जोड (Add)</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowEditBudgetModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                बजेट जतन करा
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Add New Budget Category Modal */}
      <Modal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        title="➕ नवीन बजेट वर्गवारी जोडा (Add New Budget Category)"
        subtitle="गणेशोत्सव खर्चासाठी नवीन कस्टम वर्गवारी व तिची बजेट मर्यादा निश्चित करा"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">वर्गवारीचे नाव (Category Name) *</label>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="उदा. स्वयंसेवक भोजन / सुरक्षा व नियोजन"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500 text-xs font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">मंजूर बजेट मर्यादा (Budget Limit ₹) *</label>
            <input
              type="number"
              min={0}
              required
              value={newCatBudget}
              onChange={(e) => setNewCatBudget(e.target.value)}
              placeholder="उदा. 25000"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-amber-400 font-extrabold focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">कार्ड रंग थीम (Card Color Theme)</label>
            <div className="flex items-center space-x-2">
              {['#f59e0b', '#ec4899', '#10b981', '#6366f1', '#8b5cf6', '#3b82f6', '#ef4444', '#14b8a6'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCatColor(color)}
                  className={`w-6 h-6 rounded-full transition transform hover:scale-110 ${newCatColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-80'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddCategoryModal(false)}
              className="px-4 py-2 font-bold text-slate-400 hover:text-white"
            >
              रद्द करा
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>वर्गवारी जतन करा</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Expense In-App Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">खर्च कायमचा हटवायचा आहे का?</h3>
                <p className="text-xs text-slate-400">हा खर्च मुख्य यादी व सर्व्हरवरून पूर्णपणे काढून टाकला जाईल.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">खर्च तपशील:</span>
                <span className="font-bold text-white text-right max-w-[200px] truncate">{expenseToDelete.description}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">रक्कम:</span>
                <span className="font-extrabold text-rose-400 text-sm">₹{Number(expenseToDelete.amount || 0).toLocaleString('en-IN')}</span>
              </div>
              {expenseToDelete.paid_to && (
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">कोणाला दिले:</span>
                  <span className="text-slate-200">{expenseToDelete.paid_to}</span>
                </div>
              )}
              {expenseToDelete.category && (
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">वर्गवारी:</span>
                  <span className="text-amber-400 font-medium capitalize">{expenseToDelete.category}</span>
                </div>
              )}
              {expenseToDelete.expense_id && (
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">क्रमांक:</span>
                  <span className="font-mono text-[11px] text-slate-400">{expenseToDelete.expense_id}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={isDeletingExpense}
                onClick={() => setExpenseToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                रद्द करा (Cancel)
              </button>
              <button
                type="button"
                disabled={isDeletingExpense}
                onClick={handleConfirmDeleteExpense}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-rose-900/30 disabled:opacity-50"
              >
                {isDeletingExpense ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>हटवत आहे...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>होय, कायमचा हटवा</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpensesPage;

