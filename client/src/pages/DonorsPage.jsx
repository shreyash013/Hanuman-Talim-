import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
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
  AlertCircle
} from 'lucide-react';

export function DonorsPage() {
  const { t } = useLanguage();
  const { showToast } = useNotification();

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
  const [singleAmount, setSingleAmount] = useState('500');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Add Donors Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFixedAmount, setBulkFixedAmount] = useState('500');
  const [bulkDefaultArea, setBulkDefaultArea] = useState('नदीवेस शिरोळ');
  const [bulkInputText, setBulkInputText] = useState('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Edit Individual Amount Modal
  const [showEditAmountModal, setShowEditAmountModal] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);
  const [editAmountValue, setEditAmountValue] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Profile CRM Modal
  const [selectedDonorProfile, setSelectedDonorProfile] = useState(null);

  const upiId = 'sarveshkharoshe8-2@okaxis';
  const upiName = 'Shri Hanuman Talim Mandal Shirol';

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

  // Open Edit Target Amount Modal
  const openEditAmountModal = (donor) => {
    setEditingDonor(donor);
    setEditAmountValue(donor.target_amount || donor.total_donated || 500);
    setShowEditAmountModal(true);
  };

  // Save Edit Target Amount
  const handleSaveIndividualAmount = async (e) => {
    e.preventDefault();
    if (!editingDonor) return;
    const newAmt = Number(editAmountValue);
    if (isNaN(newAmt) || newAmt < 0) {
      showToast('कृपया वैध रक्कम टाका.', 'warning');
      return;
    }

    try {
      setIsSavingEdit(true);
      const res = await api.put(`/donors/${editingDonor.id}`, {
        id: editingDonor.id,
        name: editingDonor.name,
        target_amount: newAmt
      });

      if (res.success) {
        showToast(`'${editingDonor.name}' यांची नक्की केलेली वर्गणी ₹${newAmt} अद्ययावत केली!`, 'success');
        setShowEditAmountModal(false);
        setEditingDonor(null);
        fetchDonors();
      }
    } catch (err) {
      showToast(err.message || 'रक्कम बदलताना त्रुटी.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredDonors = donors.filter((d) => {
    if (areaFilter !== 'all' && (d.area || 'शिरोळ') !== areaFilter) return false;
    if (statusFilter !== 'all' && (d.status || 'unpaid') !== statusFilter) return false;
    return true;
  });

  // WhatsApp Thank You Message
  const sendWhatsAppThankYou = (donor) => {
    const text = `नमस्कार *${donor.name}* जी! 🚩\n\nश्री हनुमान तालीम मंडळ शिरोळ (वर्ष ६२ वे) गणेशोत्सवासाठी दिलेल्या ₹${donor.paid_amount || donor.target_amount || 500} वर्गणीबद्दल मंडळ आपले मनःपूर्वक आभार मानत आहे! 🙏\n\n- श्री हनुमान तालीम मंडळ शिरोळ (नदीवेस चा राजा)`;
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-slate-400 block mb-1 font-semibold">एकूण देणगीदार</span>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span className="text-xl font-black text-white">{summary.totalDonors} जण</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-slate-400 block mb-1 font-semibold">नक्की केलेली वर्गणी (Target)</span>
          <div className="flex items-center space-x-1 font-black text-xl text-amber-400">
            <span>₹{(summary.totalTarget || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl bg-emerald-950/20">
          <span className="text-emerald-400 block mb-1 font-semibold">एकूण जमा वर्गणी (Paid)</span>
          <div className="flex items-center space-x-1 font-black text-xl text-emerald-400">
            <span>₹{(summary.totalPaid || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 p-4 rounded-2xl bg-rose-950/20">
          <span className="text-rose-400 block mb-1 font-semibold">एकूण शिल्लक बाकी (Pending)</span>
          <div className="flex items-center space-x-1 font-black text-xl text-rose-400">
            <span>₹{(summary.totalPending || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Search & Area & Status Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="नावाने किंवा मोबाईलने शोधा..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-4 text-xs flex-wrap gap-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">स्थिती (Status):</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
            >
              <option value="all">सर्व</option>
              <option value="paid">✓ पूर्ण जमा</option>
              <option value="partial">⏳ अंशतः जमा</option>
              <option value="unpaid">❌ जमा बाकी</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">भाग (Area):</span>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
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

      {/* Donors & Vargani Calculation Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60">
              {filteredDonors.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-bold text-white">
                    {d.name}
                    {d.address && <span className="block text-[11px] font-normal text-slate-400">{d.address}</span>}
                  </td>
                  <td className="p-4 text-slate-300 font-mono">{d.mobile || '-'}</td>
                  <td className="p-4 text-slate-300">{d.area || 'शिरोळ'}</td>

                  {/* Target Amount */}
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center space-x-1 font-extrabold text-amber-400">
                      <span>₹{(d.target_amount || d.total_donated || 500).toLocaleString('en-IN')}</span>
                      <button
                        onClick={() => openEditAmountModal(d)}
                        className="p-1 text-slate-400 hover:text-amber-300 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition"
                        title="नक्की केलेली वर्गणी बदला"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Paid Amount */}
                  <td className="p-4 text-right font-black text-emerald-400">
                    ₹{(d.paid_amount || 0).toLocaleString('en-IN')}
                    {d.donations_count > 0 && (
                      <span className="block text-[10px] text-slate-400 font-normal">
                        ({d.donations_count} पावत्या)
                      </span>
                    )}
                  </td>

                  {/* Pending Amount */}
                  <td className="p-4 text-right font-black text-rose-400">
                    ₹{(d.pending_amount || 0).toLocaleString('en-IN')}
                  </td>

                  {/* Status Badge */}
                  <td className="p-4 text-center">
                    {d.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" /> पूर्ण जमा
                      </span>
                    ) : d.status === 'partial' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3 h-3" /> अंशतः जमा
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <AlertCircle className="w-3 h-3" /> जमा बाकी
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right space-x-1.5">
                    {/* Edit Target Amount Button */}
                    <button
                      onClick={() => openEditAmountModal(d)}
                      className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-bold border border-amber-500/40"
                      title="या देणगीदाराची वर्गणी रक्कम बदला"
                    >
                      ✏️ वर्गणी
                    </button>

                    {/* WhatsApp Reminder */}
                    <button
                      onClick={() => sendWhatsAppReminder(d)}
                      className="px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-lg text-[11px] font-bold border border-sky-500/30"
                      title="बाकी वर्गणी भरण्यासाठी रिमाइंडर मेसेज व लिंक पाठवा"
                    >
                      🔔 रिमाइंडर
                    </button>

                    {/* Thank you button */}
                    <button
                      onClick={() => sendWhatsAppThankYou(d)}
                      className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-bold border border-emerald-500/30"
                      title="व्हॉट्सअ‍ॅप आभार संदेश"
                    >
                      आभार 🙏
                    </button>

                    {/* Profile CRM */}
                    <button
                      onClick={() => setSelectedDonorProfile(d)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold border border-slate-700"
                    >
                      प्रोफाईल
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDonors.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">
                    कोणतेही देणगीदार आढळले नाहीत.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 1. EDIT INDIVIDUAL AMOUNT MODAL                             */}
      {/* ========================================================== */}
      <Modal
        isOpen={showEditAmountModal}
        onClose={() => setShowEditAmountModal(false)}
        title="✏️ देणगीदाराची नक्की वर्गणी रक्कम बदला (Change Target Amount)"
        subtitle={`${editingDonor?.name || ''} यांची नक्की वर्गणी अद्ययावत करा`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveIndividualAmount} className="space-y-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[11px]">देणगीदाराचे नाव:</span>
            <h3 className="text-lg font-black text-white">{editingDonor?.name}</h3>
            <p className="text-amber-400 text-xs font-bold">{editingDonor?.area || 'शिरोळ'} • {editingDonor?.mobile}</p>
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
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[2000, 3000, 4000, 5000, 7000].map((preset) => (
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
                onClick={() => setEditAmountValue('')}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all border ${
                  ![2000, 3000, 4000, 5000, 7000].includes(Number(editAmountValue))
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
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
              {isSavingEdit ? 'जतन होत आहे...' : 'रक्कम जतन करा (Save)'}
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
                  placeholder="500"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-extrabold focus:outline-none focus:border-amber-500 text-base"
                />
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
              placeholder="500"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500 font-extrabold"
            />
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
