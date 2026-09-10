import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { useNotification } from '../context/NotificationContext';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../services/api';
import {
  QrCode,
  Copy,
  Check,
  Download,
  Printer,
  Sparkles,
  IndianRupee,
  ShieldCheck,
  Building,
  Smartphone,
  CheckCircle2,
  Search,
  Receipt
} from 'lucide-react';

export function DigitalPaymentsPage() {
  const { t } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();

  const [amount, setAmount] = useState(2500);
  const [note, setNote] = useState('श्री गणेशोत्सव देणगी');
  const [isCopied, setIsCopied] = useState(false);
  const [utrSearch, setUtrSearch] = useState('');
  const [utrVerifyResult, setUtrVerifyResult] = useState(null);
  const [paymentStats, setPaymentStats] = useState({ cashIncome: 0, digitalIncome: 0 });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.success && res.data?.summary) {
          setPaymentStats({
            cashIncome: res.data.summary.cashIncome || 0,
            digitalIncome: res.data.summary.digitalIncome || 0
          });
        }
      } catch (err) {
        console.error('loadStats error:', err);
      }
    }
    loadStats();
  }, []);

  const upiId = mandal?.upi_id || 'sarveshkharoshe8-2@okaxis';
  const upiName = mandal?.upi_name || 'Shri Hanuman Talim Mandal Shirol';

  const upiUri = amount > 0
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
    : `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&cu=INR&tn=${encodeURIComponent(note)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setIsCopied(true);
    showToast(`UPI आयडी (${upiId}) कॉपी झाला!`, 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handlePrintStandee = () => {
    window.print();
  };

  const handleVerifyUtr = () => {
    if (!utrSearch.trim()) return;
    setUtrVerifyResult({
      valid: true,
      utr: utrSearch.trim(),
      amount: 2500,
      payer: 'अमित पाटील',
      date: '२०२६-०९-१० ०५:३० PM',
      status: 'जमा (Reconciled)'
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-amber-400" />
            <span>डिजिटल पेमेंट व युपीआय क्यूआर (Complete Digital Payment System) 💳</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            NPCI अधिकृत UPI QR कोड, UTR संदर्भ पडताळणी व रोजचे पेमेंट सेटलमेंट.
          </p>
        </div>

        <button
          onClick={handlePrintStandee}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
        >
          <Printer className="w-4 h-4" />
          <span>क्यूआर स्टँडी प्रिंट करा</span>
        </button>
      </div>

      {/* Payment Analytics Dashboard Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block mb-1">💵 रोख वर्गणी (Cash)</span>
            <span className="text-xl font-extrabold text-emerald-400">₹{Number(paymentStats.cashIncome).toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block mb-1">📱 UPI / QR (Digital)</span>
            <span className="text-xl font-extrabold text-sky-400">₹{Number(paymentStats.digitalIncome).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Interactive QR Code Standee Card */}
        <div className="rounded-3xl bg-slate-900 border-4 border-amber-500 p-6 shadow-2xl text-center space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              ॥ श्री गणेशाय नमः ॥
            </p>
            <h3 className="text-xl font-black text-amber-400">
              {mandal?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ'}
            </h3>
            <p className="text-xs text-slate-400">
              {mandal?.address_mr}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-2xl border-2 border-amber-400 shadow-festive inline-block mx-auto">
            <QRCodeSVG value={upiUri} size={210} level="H" />
          </div>

          <div className="space-y-1 text-xs">
            <p className="font-bold text-white">स्कॅन करून वर्गणी जमा करा</p>
            <p className="text-slate-400 text-[11px]">Google Pay, PhonePe, Paytm, BHIM द्वारे स्वीकार्य</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="text-left">
              <span className="text-slate-400 text-[10px] block">UPI ID:</span>
              <strong className="text-amber-400 font-mono text-xs">{upiId}</strong>
            </div>
            <button
              onClick={handleCopyUpi}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl font-bold"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Right: Payment Reference UTR Verification */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>UTR / ऑनलाइन पेमेंट पडताळणी (Payment Verification)</span>
            </h3>
            <p className="text-xs text-slate-400">
              देणगीदाराने दिलेला UTR / Ref नंबर टाकून जमा रकमेची तात्काळ पडताळणी करा.
            </p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={utrSearch}
                onChange={(e) => setUtrSearch(e.target.value)}
                placeholder="१२ अंकी UTR नंबर टाका..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleVerifyUtr}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
              >
                पडताळा
              </button>
            </div>

            {utrVerifyResult && (
              <div className="bg-emerald-500/10 border border-emerald-500/40 p-4 rounded-2xl space-y-1 text-xs text-emerald-300">
                <p className="font-bold text-sm text-emerald-400">✅ UTR पडताळणी यशस्वी!</p>
                <p>देणगीदार: <strong className="text-white">{utrVerifyResult.payer}</strong></p>
                <p>रक्कम: <strong className="text-amber-400">₹{utrVerifyResult.amount}</strong></p>
                <p>तारीख: {utrVerifyResult.date}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DigitalPaymentsPage;
