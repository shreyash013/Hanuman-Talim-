import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { GanpatiLogo } from '../components/common/GanpatiLogo';
import { ReceiptModal } from '../components/receipt/ReceiptModal';
import { formatCurrency } from '../utils/formatCurrency';
import { API_BASE_URL } from '../services/api';
import {
  HeartHandshake,
  QrCode,
  IndianRupee,
  Copy,
  Check,
  Calendar,
  MapPin,
  Phone,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';

export function PublicDonationPage() {
  const [mandalInfo, setMandalInfo] = useState(null);
  const [events, setEvents] = useState([]);
  const [amount, setAmount] = useState(501);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [purpose, setPurpose] = useState('गणेशोत्सव वर्गणी / देणगी');
  const [utrNumber, setUtrNumber] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);


  useEffect(() => {
    async function fetchPublicData() {
      try {
        const res = await fetch(`${API_BASE_URL}/public/donation-info`);
        const json = await res.json();
        if (json.success && json.data) {
          setMandalInfo(json.data.mandal);
          setEvents(json.data.upcomingEvents || []);
        }
      } catch (err) {
        console.error('Failed to load donation info:', err);
      }
    }
    fetchPublicData();
  }, []);

  const upiId = mandalInfo?.upi_id || 'ganeshmandal@sbi';
  const upiName = mandalInfo?.upi_name || 'Shree Ganesh Mitra Mandal Trust';

  const upiUri = amount > 0
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(purpose)}`
    : `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&cu=INR&tn=${encodeURIComponent(purpose)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleOnlineIntent = async (e) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !amount || Number(amount) <= 0) {
      alert('कृपया नाव, मोबाईल आणि वैध रक्कम भरा.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/public/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          amount: Number(amount),
          purpose: purpose.trim(),
          utr_number: utrNumber.trim()
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsSubmitted(true);
        const receiptObj = json.data?.receipt || {
          receipt_number: `DONATE-${Date.now().toString().slice(-6)}`,
          donor_name: name.trim(),
          mobile: mobile.trim(),
          amount: Number(amount),
          purpose: purpose.trim() || 'गणेशोत्सव वर्गणी / देणगी',
          payment_method: 'upi',
          created_at: new Date().toISOString()
        };
        setGeneratedReceipt(receiptObj);
        // Auto open WhatsApp confirmation message to treasurer (Shreyash Gavade)
        const text = encodeURIComponent(`🚩 *श्री हनुमान तालीम मंडळ शिरोळ* 🚩\nऑनलाइन देणगी / वर्गणी पावती नोंदणी:\n\n👤 नाव: ${name}\n📱 मोबाईल: ${mobile}\n💰 रक्कम: ₹${amount}\n🔢 UTR / Txn ID: ${utrNumber || 'N/A'}\n🎯 संकल्प: ${purpose || 'गणेशोत्सव देणगी'}\n\nकृपया पावती कन्फर्म करून पाठवावी. 🙏`);
        window.open(`https://wa.me/919356997428?text=${text}`, '_blank');
      } else {
        alert(json.message || 'नोंदणी करताना त्रुटी आली.');
      }
    } catch {
      alert('तांत्रिक त्रुटी निर्माण झाली.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetAmounts = [101, 251, 501, 1001, 2100, 5001];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Bar */}
      <div className="max-w-5xl mx-auto flex items-center justify-between py-2 border-b border-white/10 pb-4 mb-6">
        <Link to="/" className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>मुख्य डॅशबोर्ड / लॉगिन</span>
        </Link>
        <span className="text-xs font-bold text-slate-400">
          ऑनलाइन गणेशोत्सव देणगी पोर्टल
        </span>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Mandal Hero Banner */}
        <div className="text-center space-y-3">
          <div className="inline-block mx-auto mb-1">
            <GanpatiLogo size="xl" />
          </div>
          <p className="text-sm font-bold text-amber-400">॥ श्री गणेशाय नमः ॥</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-marathi">
            {mandalInfo?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            {mandalInfo?.address_mr} • नोंदणी क्र: {mandalInfo?.registration_no}
          </p>
        </div>

        {/* Main Grid: QR Code & Payment Confirmation Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left: Live UPI Payment QR Code */}
          <div className="rounded-3xl bg-slate-900/90 backdrop-blur-xl border-2 border-amber-500/40 p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <QrCode className="w-4 h-4" />
              <span>थेट UPI द्वारे देणगी जमा करा</span>
            </div>

            {/* Quick Amount Chips */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-400">रक्कम निवडा:</label>
              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                      amount === amt
                        ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    ₹ {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* QR Box */}
            <div className="p-4 bg-white rounded-2xl border-2 border-amber-400 shadow-festive inline-block mx-auto">
              <QRCodeSVG value={upiUri} size={200} level="H" />
            </div>

            <div className="inline-block px-4 py-1 rounded-full bg-emerald-950 text-emerald-300 font-black text-sm border border-emerald-500/40">
              देय देणगी रक्कम: ₹ {Number(amount).toLocaleString('en-IN')}
            </div>

            {/* UPI ID Info */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-left text-xs space-y-1">
              <div className="text-slate-400">
                खाते: <span className="font-bold text-white">{upiName}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  UPI ID: <span className="font-mono font-bold text-amber-400">{upiId}</span>
                </div>
                <button
                  onClick={handleCopyUpi}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                >
                  {isCopied ? 'कॉपी झाले!' : 'कॉपी करा'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Payment Confirmation / Receipt Request Form */}
          <div className="rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 p-6 sm:p-8 shadow-2xl space-y-5">
            {isSubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/50 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white font-marathi">
                  आपली देणगी माहिती यशस्वीरित्या प्राप्त झाली! 🕉️
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  आपली अधिकृत डिजिटल पावती तयार झाली आहे. आपण खालील बटणावरून **PDF** किंवा **Image** डाऊनलोड करू शकता.
                </p>
                {generatedReceipt && (
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition"
                  >
                    📄 अधिकृत पावती (PDF / PNG) पहा व डाऊनलोड करा
                  </button>
                )}
                <p className="text-sm font-black text-amber-400 pt-2">
                  🚩 गणपती बाप्पा मोरया! मंगलमूर्ती मोरया! 🚩
                </p>
              </div>
            ) : (
              <form onSubmit={handleOnlineIntent} className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white font-marathi">
                    पावतीसाठी आपली माहिती नोंदवा
                  </h3>
                  <p className="text-xs text-slate-400">
                    पेमेंट केल्यानंतर डिजिटल पावती WhatsApp वर मिळवण्यासाठी खालील माहिती भरा
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">आपले पूर्ण नाव *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="उदा. अमोल पाटील"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">WhatsApp मोबाईल क्रमांक *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="98230XXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">देणगी रक्कम (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-extrabold text-base outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">UPI व्यवहार संदर्भ क्र. / UTR Number (पर्यायी)</label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="उदा. UPI Ref 48928192..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm shadow-festive flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'पाठवत आहे...' : 'पावतीसाठी माहिती पाठवा (Submit)'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Digital Receipt Export Modal */}
      {generatedReceipt && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          receipt={generatedReceipt}
        />
      )}
    </div>
  );
}

export default PublicDonationPage;

