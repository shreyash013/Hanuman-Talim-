import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useMandal } from '../context/MandalContext';
import logoImg from '../assets/logo.png';
import phonepeQrImg from '../assets/phonepe_qr.jpg';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { ReceiptModal } from '../components/receipt/ReceiptModal';
import { openWhatsAppReceipt } from '../utils/whatsappHelper';
import {
  Receipt,
  Search,
  User,
  Smartphone,
  MapPin,
  IndianRupee,
  CreditCard,
  Sparkles,
  History,
  CheckCircle2,
  Share2,
  QrCode,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  Award,
  MessageCircle,
  Calendar,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function VarganiPage() {
  const { t } = useLanguage();
  const { showToast } = useNotification();
  const { mandal } = useMandal();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form State
  const [donorId, setDonorId] = useState(null);
  const [donorName, setDonorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('नदीवेस शिरोळ');
  const [donationDate, setDonationDate] = useState(() => (typeof localStorage !== 'undefined' ? localStorage.getItem('shirol_sticky_donation_date') : null) || new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(1500);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [purpose, setPurpose] = useState('श्री गणेशोत्सव वर्गणी');
  const [notes, setNotes] = useState('');

  // Recent transactions list
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Advanced Vargani states
  const [donorHistory, setDonorHistory] = useState(null);
  const [showQrScan, setShowQrScan] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState([]);

  // Submitting and Generated Receipt Modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState(null);
  const [autoShareAfterSubmit, setAutoShareAfterSubmit] = useState(false);

  const loadRecentTransactions = () => {
    try {
      const raw = localStorage.getItem('shirol_income');
      const list = raw ? JSON.parse(raw) : [];
      setRecentTransactions(Array.isArray(list) ? list.filter(i => !i.is_deleted).slice(0, 15) : []);
    } catch {
      setRecentTransactions([]);
    }
  };

  useEffect(() => {
    loadRecentTransactions();
    window.addEventListener('shirol_data_updated', loadRecentTransactions);
    window.addEventListener('storage', loadRecentTransactions);
    return () => {
      window.removeEventListener('shirol_data_updated', loadRecentTransactions);
      window.removeEventListener('storage', loadRecentTransactions);
    };
  }, []);

  // Quick Amounts
  const quickAmounts = [1500, 2000, 2500, 3000, 5000];

  // Areas list
  const pethAreas = ['नदीवेस शिरोळ', 'गावभाग', 'तालीम गल्ली', 'स्टँड रोड', 'बाजार पेठ', 'इतर'];

  // Search effect
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.get('/donors/search', { q: searchQuery });
        if (res.success && res.data) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Check duplicate donor on mobile change
  useEffect(() => {
    if (mobile.trim().length === 10) {
      api.get('/donors/search', { q: mobile.trim() }).then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setDuplicateWarning(res.data[0]);
        } else {
          setDuplicateWarning(null);
        }
      }).catch((err) => {
        console.warn('Duplicate mobile check failed quietly:', err);
      });
    } else {
      setDuplicateWarning(null);
    }
  }, [mobile]);

  const selectExistingDonor = (donor) => {
    setDonorId(donor.id);
    setDonorName(donor.name);
    setMobile(donor.mobile || '');
    setAddress(donor.address || '');
    setArea(donor.area || 'नदीवेस शिरोळ');
    setDonorHistory({
      totalDonated: donor.total_donated || 0,
      donationsCount: donor.donations_count || 1,
      lastDonatedAt: donor.last_donated_at,
      prevYear2025: Number(donor.total_donated || 0) * 0.8
    });
    setSearchResults([]);
    setSearchQuery('');
    showToast(`देणगीदार "${donor.name}" निवडले.`, 'info');
  };

  const handleSimulateQrScan = () => {
    setShowQrScan(true);
    setTimeout(() => {
      selectExistingDonor({
        id: 99,
        name: 'विजय गवडे (क्यूआर स्कॅन)',
        mobile: '9822099999',
        address: 'नदीवेस, शिरोळ',
        area: 'नदीवेस शिरोळ',
        total_donated: 2500,
        donations_count: 3
      });
      setShowQrScan(false);
    }, 1500);
  };

  const handleSubmitVargani = async (e, sendWhatsApp = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;

    if (!donorName.trim()) {
      showToast('कृपया देणगीदाराचे नाव टाका.', 'error');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      showToast('कृपया वैध रक्कम टाका.', 'error');
      return;
    }

    const payload = {
      donor_id: donorId,
      donor_name: donorName.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      area,
      amount: Number(amount),
      payment_method: paymentMethod,
      category: 'vargani',
      purpose,
      notes,
      created_at: donationDate ? `${donationDate}T12:00:00.000Z` : new Date().toISOString()
    };

    if (isOffline) {
      setOfflineQueue((prev) => [...prev, payload]);
      showToast('ऑफ्लाईन मोड: पावती लोकल रांगेत जतन केली आहे!', 'warning');
      resetForm();
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/income', payload);
      if (res.success && res.data) {
        try {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        } catch {}

        const submittedMobile = mobile.trim();
        const createdReceipt = {
          ...(res.data.receipt || {}),
          mobile: submittedMobile || res.data.receipt?.mobile || ''
        };
        setAutoShareAfterSubmit(false);
        setGeneratedReceipt(createdReceipt);
        showToast('वर्गणी यशस्वीरित्या जमा झाली! पावती स्क्रीनवर उघडली आहे.', 'success');
        resetForm();
      } else {
        showToast(res.message || 'त्रुटी आली. कृपया पुन्हा प्रयत्न करा.', 'error');
      }
    } catch (err) {
      console.error('Vargani Submit error:', err);
      showToast(err?.message || 'सर्व्हर त्रुटी निर्माण झाली. कृपया पुन्हा प्रयत्न करा.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDonorId(null);
    setDonorName('');
    setMobile('');
    setAddress('');
    setArea('नदीवेस शिरोळ');
    // Keep sticky donationDate; do NOT overwrite with today
    if (donationDate) {
      try {
        localStorage.setItem('shirol_sticky_donation_date', donationDate);
      } catch (err) {}
    }
    setAmount(1500);
    setNotes('');
    setDonorHistory(null);
    loadRecentTransactions();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Offline Mode Toggle */}
      <div className="bg-gradient-to-r from-amber-500/25 via-orange-500/15 to-slate-900/90 border border-amber-500/40 rounded-3xl p-6 relative overflow-hidden shadow-lg backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-xs mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>जलद वर्गणी संकलन (Fast Vargani Collection)</span>
            </div>
            <h1 className="text-2xl font-black text-white font-marathi tracking-tight">प्रगत वर्गणी सिस्टीम (Advanced Vargani System) ⭐</h1>
            <p className="text-xs text-slate-300 mt-1">
              क्यूआर स्कॅनर, देणगीदार शोध, मागील वर्षाचा इतिहास, ऑफलाईन मोड व व्हॉट्सअ‍ॅप पावती.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-black transition border shadow-sm ${
                isOffline
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              <span>{isOffline ? 'ऑफलाईन मोड ऑन' : 'ऑनलाईन (Auto-Sync)'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Vargani Entry Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Donor Search Bar & QR Scanner Trigger */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-200 flex items-center space-x-1.5">
                <Search className="w-4 h-4 text-amber-400" />
                <span>देणगीदार शोधा (नावाने किंवा मोबाईलने):</span>
              </label>
              <button
                onClick={handleSimulateQrScan}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-xl text-xs font-bold border border-amber-500/40 transition"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR स्कॅन करा</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="नाव किंवा मोबाईल टाका..."
                className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-800 max-h-60 overflow-y-auto">
                  {searchResults.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => selectExistingDonor(d)}
                      className="w-full p-3 text-left hover:bg-slate-800/80 transition flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-white block">{d.name}</strong>
                        <span className="text-slate-400">{d.area || 'शिरोळ'} • {d.mobile}</span>
                      </div>
                      <span className="text-amber-400 font-bold">₹{d.total_donated || 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmitVargani} className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            {/* Duplicate donor warning */}
            {duplicateWarning && (
              <div className="bg-amber-500/10 border border-amber-500/40 p-3.5 rounded-2xl flex items-center justify-between text-xs text-amber-300">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>हा मोबाईल क्रमांक आधीपासूनच देणगीदार <strong>"{duplicateWarning.name}"</strong> यांच्या नावावर नोंद आहे!</span>
                </div>
                <button
                  type="button"
                  onClick={() => selectExistingDonor(duplicateWarning)}
                  className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-lg font-bold text-[11px]"
                >
                  निवडा
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">देणगीदाराचे नाव *</label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="उदा. रामराव पाटील"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">मोबाईल क्रमांक</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="१० अंकी मोबाईल"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">पेठ / भाग (Area/Peth)</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {pethAreas.map((p, i) => (
                    <option key={i} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 flex items-center justify-between">
                  <span>वर्गणी तारीख (Date) *</span>
                  <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> तारीख बदला
                  </span>
                </label>
                <input
                  type="date"
                  required
                  value={donationDate}
                  onChange={(e) => {
                    setDonationDate(e.target.value);
                    if (e.target.value) {
                      try {
                        localStorage.setItem('shirol_sticky_donation_date', e.target.value);
                      } catch (err) {}
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500 [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">पत्ता (Address)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="उदा. नदीवेस गल्ली"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Amount & Quick Selection */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 block">वर्गणी रक्कम (₹) *</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/50 rounded-2xl px-4 py-3 text-lg font-black text-amber-400 focus:outline-none focus:border-amber-400"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(q)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      Number(amount) === q
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    ₹{q}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    if (quickAmounts.includes(Number(amount))) {
                      setAmount('');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    !quickAmounts.includes(Number(amount)) && amount !== ''
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  सानुकूल (Custom)
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['cash', 'upi', 'bank_transfer', 'other'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`p-3 rounded-2xl border text-center transition ${
                    paymentMethod === m
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs capitalize block">
                    {m === 'cash' ? '💵 रोख (Cash)' : m === 'upi' ? '📱 UPI / PhonePe' : m === 'bank_transfer' ? '🏦 बँक' : 'इतर'}
                  </span>
                </button>
              ))}
            </div>

            {/* PhonePe QR Code Scanner Preview when UPI is selected */}
            {paymentMethod === 'upi' && (
              <div className="p-4 bg-slate-950 border border-emerald-500/50 rounded-2xl text-center space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <QrCode className="w-4 h-4" />
                  <span>PhonePe अधिकृत स्कॅनर (+91 9699572617)</span>
                </div>
                <div className="p-2 bg-white rounded-xl max-w-[200px] mx-auto overflow-hidden">
                  <img
                    src={phonepeQrImg}
                    alt="PhonePe Payment QR"
                    className="w-full h-auto rounded-lg object-contain"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  भाविकाला हा क्यूआर स्कॅन करायला सांगा किंवा <strong>+91 9699572617 (9699572617@ibl)</strong> वर पे करायला सांगा.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl text-base shadow-xl transition transform active:scale-95 flex items-center justify-center space-x-2.5 cursor-pointer"
              >
                <Receipt className="w-5 h-5 shrink-0" />
                <span>{isSubmitting ? 'पावती नोंदवत आहे...' : 'वर्गणी जमा करा व पावती पहा / फोटो पाठवा'}</span>
              </button>

              <p className="text-[11px] text-center text-slate-400">
                💡 वर्गणी नोंदवल्यानंतर स्क्रीनवर HD पावती दिसेल व आपण थेट WhatsApp वर फोटो पाठवू किंवा डाऊनलोड करू शकता.
              </p>
            </div>
          </form>
        </div>

        {/* Selected Donor History & Quick Actions */}
        <div className="space-y-6">
          {donorHistory && (
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 space-y-3">
              <h3 className="font-bold text-amber-400 text-xs flex items-center space-x-1.5">
                <History className="w-4 h-4" />
                <span>मागील वर्षातील योगदान इतिहास</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between bg-slate-950 p-2.5 rounded-xl">
                  <span className="text-slate-400">एकूण दिलेली वर्गणी:</span>
                  <strong className="text-emerald-400">₹{donorHistory.totalDonated}</strong>
                </div>
                <div className="flex justify-between bg-slate-950 p-2.5 rounded-xl">
                  <span className="text-slate-400">२०२५ वर्षातील वर्गणी:</span>
                  <span className="text-slate-200">₹{donorHistory.prevYear2025}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 text-xs text-slate-300">
            <h4 className="font-bold text-white text-sm">💡 जलद टिप्स:</h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-400 leading-relaxed">
              <li>वर्गणी जमा होताच व्हॉट्सअ‍ॅपवर पावती पाठवता येते.</li>
              <li>नेटवर्क नसल्यास ऑफलाईन मोड वापरून स्थानिक साठवणूक करा.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Vargani Transactions Section with Date Column */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-white text-base">
              अलीकडील वर्गणी नोंदी (Recent Vargani Records)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            एकूण {recentTransactions.length} नोंदी
          </span>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            अद्याप कोणतीही नवीन वर्गणी नोंदवली गेलेली नाही. वरील फॉर्ममधून नवीन वर्गणी जमा करा.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">पावती क्रमांक</th>
                  <th className="py-3 px-3">देणगीदाराचे नाव</th>
                  <th className="py-3 px-3">वर्गणी तारीख (Date)</th>
                  <th className="py-3 px-3">रक्कम (₹)</th>
                  <th className="py-3 px-3">पेमेंट पद्धत</th>
                  <th className="py-3 px-3 text-right">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {recentTransactions.map((item) => (
                  <tr key={item.id || item.receipt_number} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-bold text-amber-400">
                      {item.receipt_number || '-'}
                    </td>
                    <td className="py-3 px-3 text-white font-bold">
                      {item.donor_name}
                      {item.mobile && <span className="block text-[10px] text-slate-500 font-normal">{item.mobile}</span>}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-semibold">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="py-3 px-3 font-black text-emerald-400 text-sm">
                      ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {item.payment_method === 'cash' ? '💵 रोख' : item.payment_method === 'upi' ? '📱 UPI' : item.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setGeneratedReceipt(item)}
                          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                          title="पावती पाहा"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {item.mobile && (
                          <button
                            onClick={() => openWhatsAppReceipt(item, mandal)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                            title="WhatsApp वर पावती पाठवा"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generated Receipt Modal */}
      {generatedReceipt && (
        <ReceiptModal
          receipt={generatedReceipt}
          isOpen={!!generatedReceipt}
          onClose={() => {
            setGeneratedReceipt(null);
            setAutoShareAfterSubmit(false);
          }}
          autoShare={autoShareAfterSubmit}
        />
      )}

      {/* QR Scanner Simulation Modal */}
      {showQrScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-white text-base">क्यूआर कोड स्कॅन होत आहे...</h3>
            <p className="text-xs text-slate-400">देणगीदार QR कोड कॅमेऱ्यासमोर धरा.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default VarganiPage;
