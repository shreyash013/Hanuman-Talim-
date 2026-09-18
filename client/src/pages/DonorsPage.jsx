import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useMandal } from '../context/MandalContext';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { Modal } from '../components/common/Modal';
import {
  Users,
  Search,
  PlusCircle,
  Layers,
  CheckCircle2,
  Send,
  HeartHandshake,
  Pencil,
  IndianRupee,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';

export function DonorsPage() {
  const { t } = useLanguage();
  const { showToast } = useNotification();
  const { mandal } = useMandal();

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [summary, setSummary] = useState({ totalDonors: 0, totalTarget: 0, totalPaid: 0, totalPending: 0, grandTotal: 0 });

  // Single Add Donor Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [singleAmount, setSingleAmount] = useState('2000');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Add Donors Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFixedAmount, setBulkFixedAmount] = useState('2000');
  const [bulkDefaultArea, setBulkDefaultArea] = useState('नदीवेस शिरोळ');
  const [bulkInputText, setBulkInputText] = useState('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Edit Donor Modal
  const [showEditAmountModal, setShowEditAmountModal] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAmountValue, setEditAmountValue] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Profile CRM Modal
  const [selectedDonorProfile, setSelectedDonorProfile] = useState(null);

  const upiId = mandal?.upi_id || '9699572617@ibl';
  const upiName = mandal?.upi_name || 'SUMEDH SHAHAJI GAVADE';

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/donors', { search });
      if (res.success) {
        setDonors(res.data || []);
        setSummary(res.summary || { totalDonors: 0, totalTarget: 0, totalPaid: 0, totalPending: 0, grandTotal: 0 });
      }
    } catch (err) {
      console.error('fetchDonors error:', err);
      showToast('देणगीदार यादी लोड करताना त्रुटी.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();

    const handleUpdate = () => {
      fetchDonors();
    };

    window.addEventListener('focus', handleUpdate);
    window.addEventListener('shirol_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('shirol_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [search]);

  // Single Add Donor submit handler
  const handleAddDonor = async (e) => {
    e.preventDefault();
    if (!donorName.trim() || !mobile.trim()) {
      showToast('कृपया नाव आणि मोबाईल क्रमांक भरा.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/donors', {
        name: donorName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        address: address.trim(),
        area: area.trim() || 'शिरोळ',
        target_amount: Number(singleAmount) || 500,
        notes: notes.trim()
      });

      if (res.success) {
        showToast('देणगीदार यशस्वीरित्या जोडला!', 'success');
        setShowAddModal(false);
        setDonorName('');
        setMobile('');
        setEmail('');
        setAddress('');
        setArea('');
        setNotes('');
        setSingleAmount('500');
        fetchDonors();
      }
    } catch (err) {
      showToast(err.message || 'नोंदणी करताना त्रुटी.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Donors parser
  const getParsedBulkDonors = () => {
    if (!bulkInputText.trim()) return [];
    const lines = bulkInputText.split('\n');
    const result = [];

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      let name = cleanLine;
      let phone = '';

      // Try splitting by comma, hyphen, or tab
      const parts = cleanLine.split(/[,;\-\t]+/);
      if (parts.length >= 2) {
        name = parts[0].trim();
        const possiblePhone = parts[1].replace(/[^0-9]/g, '');
        if (possiblePhone.length >= 10) {
          phone = possiblePhone;
        }
      } else {
        // Extract 10 digit number via regex if present anywhere in line
        const phoneMatch = cleanLine.match(/\b\d{10}\b/);
        if (phoneMatch) {
          phone = phoneMatch[0];
          name = cleanLine.replace(phone, '').replace(/[,;\-\t]/g, '').trim();
        }
      }

      if (name) {
        result.push({
          name,
          mobile: phone,
          area: bulkDefaultArea || 'नदीवेस शिरोळ',
          target_amount: Number(bulkFixedAmount) || 500
        });
      }
    });

    return result;
  };

  // Submit Bulk Donors
  const handleBulkAddDonors = async () => {
    const parsedDonors = getParsedBulkDonors();
    if (parsedDonors.length === 0) {
      showToast('कृपया किमान एका देणगीदाराचे नाव टाका.', 'warning');
      return;
    }

    try {
      setIsBulkSubmitting(true);
      const res = await api.post('/donors', { donors: parsedDonors });
      if (res.success) {
        showToast(`🎉 ${parsedDonors.length} देणगीदार यशस्वीरित्या एकाच वेळी जोडले!`, 'success');
        setShowBulkModal(false);
        setBulkInputText('');
        fetchDonors();
      }
    } catch (err) {
      showToast(err.message || 'बल्क नोंदणी करताना त्रुटी.', 'error');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditAmountModal = (donor) => {
    setEditingDonor(donor);
    setEditName(donor.name || '');
    setEditMobile(donor.mobile || '');
    setEditArea(donor.area || 'नदीवेस शिरोळ');
    setEditAddress(donor.address || '');
    setEditAmountValue(donor.target_amount || donor.total_donated || 500);
    setShowEditAmountModal(true);
  };

  // Save Edit Donor
  const handleSaveIndividualAmount = async (e) => {
    e.preventDefault();
    if (!editingDonor) return;
    if (!editName.trim()) {
      showToast('कृपया देणगीदाराचे नाव टाका.', 'warning');
      return;
    }
    const newAmt = Number(editAmountValue);
    if (isNaN(newAmt) || newAmt < 0) {
      showToast('कृपया वैध रक्कम टाका.', 'warning');
      return;
    }

    try {
      setIsSavingEdit(true);
      const res = await api.put(`/donors/${editingDonor.id}`, {
        id: editingDonor.id,
        name: editName.trim(),
        mobile: editMobile.trim(),
        area: editArea.trim(),
        address: editAddress.trim(),
        target_amount: newAmt
      });

      if (res.success) {
        showToast(`'${editName}' यांची माहिती यशस्वीरित्या अद्ययावत केली!`, 'success');
        setShowEditAmountModal(false);
        setEditingDonor(null);
        fetchDonors();
      }
    } catch (err) {
      showToast(err.message || 'माहिती बदलताना त्रुटी.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Donor handler
  const handleDeleteDonor = async (donor) => {
    if (!window.confirm(`नक्की "${donor.name}" यांना देणगीदार यादीतून हटवायचे आहे का?\n(या देणगीदाराच्या सर्व जमा नोंदी देखील हटवल्या जातील आणि एकूण रकमेतून वजा होतील)`)) {
      return;
    }

    try {
      const res = await api.delete(`/donors/${donor.id}`, { name: donor.name, mobile: donor.mobile });
      if (res.success) {
        showToast(`'${donor.name}' देणगीदार व संबंधित सर्व जमा नोंदी यशस्वीरित्या हटवल्या!`, 'success');
        if (selectedDonorProfile && selectedDonorProfile.id === donor.id) {
          setSelectedDonorProfile(null);
        }
        fetchDonors();
      }
    } catch (err) {
      showToast(err.message || 'देणगीदार हटवताना त्रुटी.', 'error');
    }
  };

  const filteredDonors = donors.filter((d) => {
    if (areaFilter !== 'all' && (d.area || 'शिरोळ') !== areaFilter) return false;
    if (statusFilter !== 'all' && (d.status || 'unpaid') !== statusFilter) return false;
    return true;
  });

  // WhatsApp Thank You Message
  const sendWhatsAppThankYou = (donor) => {
    const text = `नमस्कार *${donor.name}* जी! 🚩\n\nश्री हनुमान तालीम मंडळ शिरोळ (वर्ष ६२ वे) गणेशोत्सवासाठी दिलेल्या ₹${donor.paid_amount || donor.target_amount || 500} वर्गणीबद्दल मंडळ आपले मनःपूर्वक आभार मानत आहे! 🙏\n\n- श्री हनुमान तालीम मंडळ शिरोळ (नदीवेस चा महाराजा)`;
    const phone = (donor.mobile || '').replace(/[^0-9]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${phone.length === 10 ? '91' + phone : phone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // WhatsApp Reminder Message with Target, Paid, Pending and Direct Payment Link
  const sendWhatsAppReminder = (donor) => {
    const payAmount = donor.pending_amount > 0 ? donor.pending_amount : (donor.target_amount || 500);
    const upiPayLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${payAmount}&cu=INR&tn=${encodeURIComponent('Ganesh Festival Vargani ' + payAmount)}`;

    const text = `🚩 *सस्नेह नमस्कार ${donor.name} जी!* 🚩\n\nश्री हनुमान तालीम मंडळ शिरोळ (६२ वा गणेशोत्सव) साठी आपली नक्की केलेली वर्गणी रक्कम:\n• नक्की केलेली वर्गणी: *₹${(donor.target_amount || 500).toLocaleString('en-IN')}*\n• जमा वर्गणी: *₹${(donor.paid_amount || 0).toLocaleString('en-IN')}*\n• शिल्लक बाकी: *₹${(donor.pending_amount || 0).toLocaleString('en-IN')}* 🙏\n\nगूगल पे (GPay) / फोनपे (PhonePe) / पेटीएम (Paytm) वरून १-क्लिकमध्ये शिल्लक वर्गणी जमा करण्यासाठी खालील लिंकवर क्लिक करा:\n${upiPayLink}\n\nकिंवा मंडळ UPI ID: *${upiId}*\n\nआपल्या सहकार्याची अपेक्षा आहे!\nसंपर्क: +91 9356997428\n- श्री हनुमान तालीम मंडळ शिरोळ 🚩`;

    const phone = (donor.mobile || '').replace(/[^0-9]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${phone.length === 10 ? '91' + phone : phone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Toggle single donor selection
  const toggleSelectDonor = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all filtered donors
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDonors.length && filteredDonors.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDonors.map((d) => d.id));
    }
  };

  // Bulk delete selected handler
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      showToast('कृपया हटवण्यासाठी किमान एक देणगीदार निवडा.', 'warning');
      return;
    }

    const selectedDonors = filteredDonors.filter((d) => selectedIds.includes(d.id));
    const selectedNames = selectedDonors.map((d) => d.name);

    if (!window.confirm(`नक्की निवडलेले ${selectedIds.length} देणगीदार यादीतून हटवायचे आहेत का?`)) {
      return;
    }

    try {
      let res;
      try {
        res = await api.delete('/donors/bulk', { ids: selectedIds, names: selectedNames });
      } catch (err) {
        await Promise.all(selectedIds.map((id) => api.delete(`/donors/${id}`)));
        res = { success: true };
      }

      if (res.success) {
        showToast(`🎉 ${selectedIds.length} देणगीदार यशस्वीरित्या हटवले!`, 'success');
        setSelectedIds([]);
        fetchDonors();
      }
    } catch (err) {
      showToast(err.message || 'देणगीदार हटवताना त्रुटी.', 'error');
    }
  };

  // Dynamic Background & Text Color helper based on payment status & amount
  const getDonorRowStyles = (d) => {
    const target = Number(d.target_amount || d.total_donated || 500);
    const paid = Number(d.paid_amount || 0);
    const ratio = target > 0 ? paid / target : 0;

    // 1. Full Amount Paid -> High Density Rich Vibrant Green
    if (paid >= target || d.status === 'paid' || ratio >= 1.0) {
      return {
        rowClass: 'bg-emerald-700 text-white hover:bg-emerald-600 border-b border-emerald-800 shadow-sm',
        nameClass: 'font-extrabold text-white text-sm',
        subTextClass: 'text-emerald-100',
        targetClass: 'text-white font-extrabold',
        paidClass: 'text-white font-black',
        pendingClass: 'text-emerald-200 font-bold',
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-900 text-emerald-100 border border-emerald-400 shadow">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> पूर्ण जमा
          </span>
        )
      };
    }

    // 2. Unpaid / Initial -> White Background ("for all donor first take background colour white")
    if (paid === 0 || d.status === 'unpaid') {
      return {
        rowClass: 'bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800',
        nameClass: 'font-extrabold text-slate-900 dark:text-white text-sm',
        subTextClass: 'text-slate-500 dark:text-slate-400',
        targetClass: 'text-amber-600 dark:text-amber-400 font-extrabold',
        paidClass: 'text-slate-500 dark:text-slate-400 font-black',
        pendingClass: 'text-rose-600 dark:text-rose-400 font-black',
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <AlertCircle className="w-3 h-3 text-slate-500 dark:text-slate-400" /> जमा बाकी
          </span>
        )
      };
    }

    // 3. Paid Less -> Accordingly Red, Orange, Yellow based on payment percentage
    if (ratio < 0.35) {
      // Red (< 35% paid)
      return {
        rowClass: 'bg-red-600 text-white hover:bg-red-700 border-b border-red-700',
        nameClass: 'font-extrabold text-white text-sm',
        subTextClass: 'text-red-100',
        targetClass: 'text-white font-extrabold',
        paidClass: 'text-red-100 font-black',
        pendingClass: 'text-yellow-200 font-black',
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-900 text-red-100 border border-red-400">
            <Clock className="w-3 h-3" /> अंशतः (कमी जमा)
          </span>
        )
      };
    } else if (ratio < 0.70) {
      // Orange (35% to 69% paid)
      return {
        rowClass: 'bg-orange-500 text-white hover:bg-orange-600 border-b border-orange-600',
        nameClass: 'font-extrabold text-white text-sm',
        subTextClass: 'text-orange-100',
        targetClass: 'text-white font-extrabold',
        paidClass: 'text-orange-100 font-black',
        pendingClass: 'text-yellow-100 font-black',
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-950 text-orange-200 border border-orange-400">
            <Clock className="w-3 h-3" /> अंशतः (मध्यम)
          </span>
        )
      };
    } else {
      // Yellow (70% to 99% paid)
      return {
        rowClass: 'bg-yellow-400 text-slate-950 hover:bg-yellow-300 border-b border-yellow-500',
        nameClass: 'font-black text-slate-950 text-sm',
        subTextClass: 'text-slate-800',
        targetClass: 'text-slate-900 font-extrabold',
        paidClass: 'text-slate-950 font-black',
        pendingClass: 'text-red-800 font-black',
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-yellow-100 text-slate-900 border border-yellow-600">
            <Clock className="w-3 h-3" /> जवळपास पूर्ण
          </span>
        )
      };
    }
  };

  const parsedBulkList = getParsedBulkDonors();

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs mb-1">
            <HeartHandshake className="w-4 h-4" />
            <span>देणगीदार व्यवस्थापन (Donor CRM & Auto Vargani Reconcilation)</span>
          </div>
          <h1 className="text-2xl font-black text-white">देणगीदार व वर्गणी यादी (Donors & Vargani Tracker)</h1>
          <p className="text-xs text-slate-400 mt-1">
            नावाच्या जुळवणीनुसार (Name Matching) आपोआप जमा व बाकी वर्गणीचे गणनापत्र
          </p>
        </div>
        <div className="flex items-center space-x-2.5 flex-wrap">
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl font-extrabold text-xs shadow-lg transition flex items-center space-x-1.5"
          >
            <Layers className="w-4 h-4" />
            <span>⚡ बल्क देणगीदार (Bulk Add)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ एक देणगीदार</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-amber-500/20 p-5 rounded-2xl shadow-sm transition">
          <span className="text-slate-500 dark:text-slate-400 block mb-1 font-extrabold uppercase tracking-wider text-[11px]">एकूण देणगीदार</span>
          <div className="flex items-center space-x-2.5 mt-1">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-sans">{summary.totalDonors} जण</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-amber-500/30 p-5 rounded-2xl shadow-sm transition">
          <span className="text-amber-600 dark:text-amber-400/90 block mb-1 font-extrabold uppercase tracking-wider text-[11px]">नक्की केलेली वर्गणी (Target)</span>
          <div className="flex items-center space-x-1 font-black text-2xl sm:text-3xl text-amber-600 dark:text-amber-400 font-sans mt-1">
            <span>₹{(summary.totalTarget || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 p-5 rounded-2xl shadow-sm transition">
          <span className="text-emerald-700 dark:text-emerald-400 block mb-1 font-extrabold uppercase tracking-wider text-[11px]">एकूण जमा वर्गणी (Paid)</span>
          <div className="flex items-center space-x-1 font-black text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400 font-sans mt-1">
            <span>₹{(summary.totalPaid || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 p-5 rounded-2xl shadow-sm transition">
          <span className="text-rose-700 dark:text-rose-400 block mb-1 font-extrabold uppercase tracking-wider text-[11px]">एकूण शिल्लक बाकी (Pending)</span>
          <div className="flex items-center space-x-1 font-black text-2xl sm:text-3xl text-rose-600 dark:text-rose-400 font-sans mt-1">
            <span>₹{(summary.totalPending || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Search & Area & Status Filter Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="नावाने किंवा मोबाईलने शोधा..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-4 text-xs flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-slate-700 dark:text-slate-300 font-bold">स्थिती:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-bold"
            >
              <option value="all">सर्व</option>
              <option value="paid">✓ पूर्ण जमा</option>
              <option value="partial">⏳ अंशतः जमा</option>
              <option value="unpaid">❌ जमा बाकी</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-700 dark:text-slate-300 font-bold">भाग:</span>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-bold"
            >
              <option value="all">सर्व भाग</option>
              <option value="नदीवेस शिरोळ">नदीवेस शिरोळ</option>
              <option value="गावभाग">गावभाग</option>
              <option value="तालीम गल्ली">तालीम गल्ली</option>
              <option value="स्टँड रोड">स्टँड रोड</option>
              <option value="इतर">इतर</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Selection Delete Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-950/90 border border-rose-600/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl animate-fadeIn">
          <div className="flex items-center space-x-2 text-rose-200 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-rose-400" />
            <span>एकूण <strong className="text-white text-base font-black underline">{selectedIds.length}</strong> देणगीदार निवडले आहेत</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
            >
              निवड रद्द करा
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 border border-rose-400"
            >
              <Trash2 className="w-4 h-4" />
              <span>🗑️ निवडलेले ({selectedIds.length}) हटवा (Delete Selected)</span>
            </button>
          </div>
        </div>
      )}

      {/* Donors & Vargani Calculation Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredDonors.length > 0 && selectedIds.length === filteredDonors.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded cursor-pointer accent-amber-500"
                    title="सर्व देणगीदार निवडा / निवड रद्द करा"
                  />
                </th>
                <th className="p-4">देणगीदाराचे नाव</th>
                <th className="p-4">मोबाईल</th>
                <th className="p-4">भाग (Area)</th>
                <th className="p-4 text-right">नक्की वर्गणी (Target)</th>
                <th className="p-4 text-right">जमा वर्गणी (Paid)</th>
                <th className="p-4 text-right">बाकी (Pending)</th>
                <th className="p-4 text-center">स्थिती (Status)</th>
                <th className="p-4 text-right">कृती (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/20">
              {filteredDonors.map((d) => {
                const styles = getDonorRowStyles(d);
                const isSelected = selectedIds.includes(d.id);
                return (
                  <tr key={d.id} className={`transition-all ${styles.rowClass} ${isSelected ? 'ring-2 ring-amber-400/80' : ''}`}>
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectDonor(d.id)}
                        className="w-4 h-4 rounded cursor-pointer accent-amber-500"
                      />
                    </td>
                    <td className={`p-4 ${styles.nameClass}`}>
                      {d.name}
                      {d.address && <span className={`block text-[11px] font-normal ${styles.subTextClass}`}>{d.address}</span>}
                    </td>
                    <td className={`p-4 font-mono ${styles.subTextClass}`}>{d.mobile || '-'}</td>
                    <td className={`p-4 ${styles.subTextClass}`}>{d.area || 'शिरोळ'}</td>

                    {/* Target Amount */}
                    <td className="p-4 text-right">
                      <span className={styles.targetClass}>₹{(d.target_amount || d.total_donated || 500).toLocaleString('en-IN')}</span>
                    </td>

                    {/* Paid Amount */}
                    <td className={`p-4 text-right ${styles.paidClass}`}>
                      ₹{(d.paid_amount || 0).toLocaleString('en-IN')}
                      {d.donations_count > 0 && (
                        <span className={`block text-[10px] font-normal ${styles.subTextClass}`}>
                          ({d.donations_count} पावत्या)
                        </span>
                      )}
                    </td>

                    {/* Pending Amount */}
                    <td className={`p-4 text-right ${styles.pendingClass}`}>
                      ₹{(d.pending_amount || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 text-center">
                      {styles.badge}
                    </td>

                    {/* Actions Column: EDIT & DELETE */}
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          onClick={() => openEditAmountModal(d)}
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow transition inline-flex items-center space-x-1 border border-amber-400"
                          title="माहिती व वर्गणी बदला"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>एडिट</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDonor(d)}
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs shadow transition inline-flex items-center space-x-1 border border-rose-500"
                          title="देणगीदार व जमा व्यवहार हटवा"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>हटवा</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredDonors.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500 bg-slate-900">
                    कोणतेही देणगीदार आढळले नाहीत.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 1. EDIT DONOR MODAL                                        */}
      {/* ========================================================== */}
      <Modal
        isOpen={showEditAmountModal}
        onClose={() => setShowEditAmountModal(false)}
        title="✏️ देणगीदार माहिती व नक्की वर्गणी बदला (Edit Donor)"
        subtitle={`${editingDonor?.name || ''} यांची माहिती अद्ययावत करा`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveIndividualAmount} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-bold block mb-1">
              👤 देणगीदाराचे नाव (Donor Name) *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="नाव टाका"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">
              📱 मोबाईल क्रमांक (Mobile Number)
            </label>
            <input
              type="text"
              value={editMobile}
              onChange={(e) => setEditMobile(e.target.value)}
              placeholder="98220XXXXX"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-300 font-bold block mb-1">
                📍 भाग (Area)
              </label>
              <select
                value={editArea}
                onChange={(e) => setEditArea(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="नदीवेस शिरोळ">नदीवेस शिरोळ</option>
                <option value="गावभाग">गावभाग</option>
                <option value="तालीम गल्ली">तालीम गल्ली</option>
                <option value="स्टँड रोड">स्टँड रोड</option>
                <option value="इतर">इतर</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">
                🏠 पत्ता (Address)
              </label>
              <input
                type="text"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="पत्ता"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">
              💰 नक्की वर्गणी रक्कम (Target Vargani Amount in ₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-amber-400 font-extrabold text-base">₹</span>
              <input
                type="number"
                required
                value={editAmountValue}
                onChange={(e) => setEditAmountValue(e.target.value)}
                placeholder="500"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-white font-black text-lg focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Quick Preset Amount Buttons */}
          <div>
            <label className="text-slate-400 text-[11px] block mb-1">त्वरीत निवडा (Presets):</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[2000, 3000, 5000, 7000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setEditAmountValue(preset)}
                  className={`py-1.5 px-1 rounded-lg text-xs font-extrabold transition-all border ${
                    Number(editAmountValue) === preset
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  if ([2000, 3000, 5000, 7000].includes(Number(editAmountValue))) {
                    setEditAmountValue('');
                  }
                }}
                className={`py-1.5 px-1 rounded-lg text-xs font-extrabold transition-all border ${
                  ![2000, 3000, 5000, 7000].includes(Number(editAmountValue)) && editAmountValue !== ''
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                सानुकूल
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowEditAmountModal(false)}
              className="px-4 py-2 font-bold text-slate-400 hover:text-white"
            >
              रद्द करा
            </button>
            <button
              type="submit"
              disabled={isSavingEdit}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow transition"
            >
              {isSavingEdit ? 'जतन होत आहे...' : 'माहिती जतन करा (Save)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================== */}
      {/* 2. BULK DONOR ADDITION MODAL                                */}
      {/* ========================================================== */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="⚡ एकाच वेळी अनेक देणगीदार जोडा (Bulk Donors Import)"
        subtitle="सर्वांसाठी एकच ठरवलेली वर्गणी (उदा. ₹५००) सेट करा व नावांची यादी पेस्ट करा"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="text-amber-400 font-bold block mb-1">
                💰 नक्की वर्गणी रक्कम (Target Amount per Donor) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={bulkFixedAmount}
                  onChange={(e) => setBulkFixedAmount(e.target.value)}
                  placeholder="2000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-extrabold focus:outline-none focus:border-amber-500 text-base"
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {[2000, 3000, 5000, 7000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBulkFixedAmount(preset)}
                    className={`py-1 px-2 rounded text-[11px] font-bold border transition ${
                      Number(bulkFixedAmount) === preset
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    if ([2000, 3000, 5000, 7000].includes(Number(bulkFixedAmount))) {
                      setBulkFixedAmount('');
                    }
                  }}
                  className={`py-1 px-2 rounded text-[11px] font-bold border transition ${
                    ![2000, 3000, 5000, 7000].includes(Number(bulkFixedAmount)) && bulkFixedAmount !== ''
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  सानुकूल
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">
                📍 मुख्य भाग / परिसर (Default Area)
              </label>
              <select
                value={bulkDefaultArea}
                onChange={(e) => setBulkDefaultArea(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="नदीवेस शिरोळ">नदीवेस शिरोळ</option>
                <option value="गावभाग">गावभाग</option>
                <option value="तालीम गल्ली">तालीम गल्ली</option>
                <option value="स्टँड रोड">स्टँड रोड</option>
                <option value="इतर">इतर</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-bold">
                📝 देणगीदारांची यादी (Name & Mobile list - Copy & Paste here):
              </label>
              <span className="text-[11px] text-amber-400 font-mono">
                एक ओळ = एक देणगीदार
              </span>
            </div>
            <textarea
              rows={6}
              value={bulkInputText}
              onChange={(e) => setBulkInputText(e.target.value)}
              placeholder={`उदा. \nराहुल संभाजी चव्हाण, 9822012345\nसंजय आप्पा पाटील, 9822054321\nसुरेश रामचंद्र गवडे\nरमेश बापू सूर्यवंशी, 9423011223`}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-white font-mono text-xs focus:outline-none focus:border-amber-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              💡 टीप: तुम्ही Excel किंवा WhatsApp मधील नावांची यादी जशीच्या तशी येथे पेस्ट करू शकता.
            </p>
          </div>

          {/* Parsed Live Preview Table */}
          {parsedBulkList.length > 0 && (
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2">
                <span>✓ एकूण ओळखलेले देणगीदार: {parsedBulkList.length} जण</span>
                <span>प्रत्येकाची नक्की वर्गणी: ₹{bulkFixedAmount || 500}</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] font-mono">
                {parsedBulkList.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-900/80 px-2.5 py-1 rounded-lg text-slate-300">
                    <span className="font-bold text-white">{idx + 1}. {item.name}</span>
                    <span className="text-slate-400">{item.mobile || 'मोबाईल नाही'} • {item.area}</span>
                    <span className="text-amber-400 font-bold">₹{item.target_amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowBulkModal(false)}
              className="px-4 py-2 font-bold text-slate-400 hover:text-white"
            >
              रद्द करा
            </button>
            <button
              type="button"
              onClick={handleBulkAddDonors}
              disabled={isBulkSubmitting || parsedBulkList.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow transition flex items-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isBulkSubmitting
                  ? 'जतन होत आहे...'
                  : `सर्व ${parsedBulkList.length} देणगीदार जतन करा (एकूण ₹${(parsedBulkList.length * (Number(bulkFixedAmount) || 500)).toLocaleString('en-IN')})`}
              </span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================== */}
      {/* 3. DONOR PROFILE CRM MODAL                                  */}
      {/* ========================================================== */}
      {selectedDonorProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-lg">{selectedDonorProfile.name}</h3>
                <p className="text-xs text-amber-400 font-medium">
                  {selectedDonorProfile.area || 'शिरोळ'} • {selectedDonorProfile.mobile}
                </p>
              </div>
              <button
                onClick={() => setSelectedDonorProfile(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                बंद करा ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">नक्की वर्गणी (Target)</span>
                <span className="text-base font-black text-amber-400">
                  ₹{(selectedDonorProfile.target_amount || selectedDonorProfile.total_donated || 500).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-emerald-400 block mb-0.5">जमा वर्गणी (Paid)</span>
                <span className="text-base font-black text-emerald-400">
                  ₹{(selectedDonorProfile.paid_amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-rose-400 block mb-0.5">बाकी (Pending)</span>
                <span className="text-base font-black text-rose-400">
                  ₹{(selectedDonorProfile.pending_amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
              <h4 className="font-bold text-white">इतिहास व पावती माहिती:</h4>
              <p className="text-slate-300">पत्ता: {selectedDonorProfile.address || 'नाही'}</p>
              <p className="text-slate-300">जमा पावत्या: {selectedDonorProfile.donations_count || 0} पावत्या</p>
              <p className="text-slate-300">
                शेवटची वर्गणी तारीख: {selectedDonorProfile.last_donated_at ? formatDate(selectedDonorProfile.last_donated_at) : 'अलीकडे'}
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => handleDeleteDonor(selectedDonorProfile)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>हटवा</span>
              </button>
              <button
                onClick={() => {
                  setSelectedDonorProfile(null);
                  openEditAmountModal(selectedDonorProfile);
                }}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow"
              >
                ✏️ नक्की वर्गणी बदला
              </button>
              <button
                onClick={() => sendWhatsAppReminder(selectedDonorProfile)}
                className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-bold text-xs shadow"
              >
                🔔 रिमाइंडर पाठवा
              </button>
              <button
                onClick={() => sendWhatsAppThankYou(selectedDonorProfile)}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs shadow"
              >
                व्हॉट्सअ‍ॅप आभार पाठवा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 4. SINGLE DONOR ADD MODAL                                  */}
      {/* ========================================================== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="➕ नवीन देणगीदार / नागरिक नोंदणी (Add New Donor)"
        subtitle="देणगीदाराची वैयक्तिक माहिती व मोबाईल क्रमांक नोंदवा"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddDonor} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">पूर्ण नाव (Full Name) *</label>
            <input
              type="text"
              required
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="उदा. श्री राहुल संभाजी चव्हाण"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">मोबाईल क्रमांक (Mobile) *</label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="उदा. 9822012345"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">भाग / परिसर (Area)</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="नदीवेस शिरोळ">नदीवेस शिरोळ</option>
                <option value="गावभाग">गावभाग</option>
                <option value="तालीम गल्ली">तालीम गल्ली</option>
                <option value="स्टँड रोड">स्टँड रोड</option>
                <option value="इतर">इतर</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-amber-400 block mb-1 font-bold">नक्की केलेली वर्गणी रक्कम (Target Amount)</label>
            <input
              type="number"
              value={singleAmount}
              onChange={(e) => setSingleAmount(e.target.value)}
              placeholder="2000"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500 font-extrabold"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[2000, 3000, 5000, 7000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSingleAmount(preset)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-bold border transition ${
                    Number(singleAmount) === preset
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  if ([2000, 3000, 5000, 7000].includes(Number(singleAmount))) {
                    setSingleAmount('');
                  }
                }}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold border transition ${
                  ![2000, 3000, 5000, 7000].includes(Number(singleAmount)) && singleAmount !== ''
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                सानुकूल
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">ईमेल पत्ता (Email - ऐच्छिक)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="उदा. donor@gmail.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">पत्ता (Address - ऐच्छिक)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="उदा. घर क्र. ४२, नदीवेस, शिरोळ"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">विशेष शेरा / टीप (Notes)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="उदा. दरवर्षी मुख्य देणगीदार, महाप्रसाद प्रायोजक"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
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
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition"
            >
              {isSubmitting ? 'जतन होत आहे...' : 'देणगीदार जतन करा'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DonorsPage;
