import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, Heart, QrCode, Search, ShieldCheck, MapPin, Phone, Award, Image } from 'lucide-react';
import api from '../services/api';

export function PublicDevoteePortal() {
  const [activeTab, setActiveTab] = useState('about');
  const [receiptSearch, setReceiptSearch] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  const handleVerify = async () => {
    if (!receiptSearch.trim()) return;
    try {
      const res = await api.get(`/public/verify-receipt/${encodeURIComponent(receiptSearch.trim())}`);
      setVerifyResult(res);
    } catch {
      setVerifyResult({ success: false, message: 'पडताळणी करताना त्रुटी आली.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Devotee Top Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg">
              🚩
            </div>
            <div>
              <h1 className="font-extrabold text-white text-sm sm:text-base">श्री हनुमान तालीम मंडळ शिरोळ</h1>
              <p className="text-[10px] text-amber-400 font-medium">स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा महाराजा ॥</p>
            </div>
          </div>
          <a
            href="/login"
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
          >
            अधिकारी लॉगिन
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-950 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-3 py-1 bg-slate-950/20 text-slate-950 font-bold text-xs rounded-full mb-2 backdrop-blur-sm">
              ॥ नदीवेस चा महाराजा २०२६ ॥
            </span>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight text-white drop-shadow-md">
              श्री गणेशोत्सव डिजिटल भाविक पोर्टल
            </h2>
            <p className="text-xs sm:text-sm font-medium text-amber-100 mt-2 leading-relaxed">
              श्री हनुमान तालीम मंडळ शिरोळ च्या ६२ व्या उत्सवाची आरती वेळ, उपक्रम, ऑनलाईन वर्गणी व पावती पडताळणी.
            </p>
          </div>
        </div>

        {/* Devotee Nav Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'about' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            मंडळ माहिती & दर्शन
          </button>
          <button
            onClick={() => setActiveTab('aarti')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'aarti' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            आरती वेळापत्रक
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'verify' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            पावती पडताळणी (Verify Receipt)
          </button>
          <a
            href="/donate"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition whitespace-nowrap"
          >
            ऑनलाइन वर्गणी जमा करा
          </a>
        </div>

        {/* Tab Contents */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-white text-lg border-b border-slate-800 pb-2">मंडळ इतिहास व महाराजा</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                श्री हनुमान तालीम मंडळ शिरोळ ची स्थापना १९६४ साली झाली असून यंदा मंडळाचे ६२ वे वर्ष साजरे केले जात आहे. शिरोळ शहरातील 'नदीवेस चा महाराजा' म्हणून मंडळ प्रसिद्ध आहे.
              </p>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">रजिस्ट्रेशन क्र:</span>
                  <span className="text-amber-400 font-bold">MAH/KOLHAPUR/1964</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">मुख्य संपर्क:</span>
                  <span className="text-slate-200">+91 9356997428</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">स्थान:</span>
                  <span className="text-slate-200">नदीवेस, शिरोळ, जि. कोल्हापूर</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-lg border-b border-slate-800 pb-2 mb-3">बाप्पा दर्शन फोटो गॅलरी</h3>
                <div className="bg-slate-950 rounded-2xl p-6 text-center border border-slate-800">
                  <Image className="w-12 h-12 text-amber-400 mx-auto mb-2 opacity-80" />
                  <p className="text-xs text-slate-400">श्री गणेशोत्सव २०२६ बाप्पाच्या लाईव्ह दर्शनासाठी मंडप प्रांगणात सस्नेह निमंत्रित!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'aarti' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-lg border-b border-slate-800 pb-3">दैनिक महाआरती वेळापत्रक</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-amber-400 font-bold">०८:०० AM</span>
                <h4 className="font-bold text-white text-sm mt-1">सकाळची महाआरती 🌅</h4>
                <p className="text-xs text-slate-400 mt-0.5">वे. शा. सं. जोशी गुरुजी</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-amber-400 font-bold">१२:३० PM</span>
                <h4 className="font-bold text-white text-sm mt-1">दुपारची नैवेद्य आरती 🌞</h4>
                <p className="text-xs text-slate-400 mt-0.5">मंडळ अध्यक्ष व पदाधिकारी</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-amber-400 font-bold">०७:३० PM</span>
                <h4 className="font-bold text-white text-sm mt-1">संध्याकाळची मुख्य महाआरती 🔱</h4>
                <p className="text-xs text-slate-400 mt-0.5">प्रमुख पाहुणे व समस्त ग्रामस्थ</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-amber-400 font-bold">१०:०० PM</span>
                <h4 className="font-bold text-white text-sm mt-1">रात्रीची शेजारती 🌙</h4>
                <p className="text-xs text-slate-400 mt-0.5">कार्यकर्ते व भाविक</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verify' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 max-w-xl mx-auto">
            <h3 className="font-bold text-white text-lg text-center">डिजिटल वर्गणी पावती पडताळणी</h3>
            <p className="text-xs text-slate-400 text-center">आपला पावती क्रमांक (उदा. HANUMAN-2026-000001) टाका व खात्री करा.</p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
                placeholder="पावती क्रमांक भरा..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleVerify}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
              >
                पडताळा
              </button>
            </div>

            {verifyResult && (
              <div className={`p-4 rounded-2xl text-xs ${verifyResult.valid ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/40 text-rose-300'}`}>
                {verifyResult.valid ? (
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-emerald-400">✅ वैध पावती (Verified Receipt)</p>
                    <p>देणगीदार: <strong className="text-white">{verifyResult.data.donorNameSafe}</strong></p>
                    <p>रक्कम: <strong className="text-amber-400">₹{verifyResult.data.amount}</strong></p>
                    <p>पावती क्र: {verifyResult.data.receiptNumber}</p>
                  </div>
                ) : (
                  <p className="font-bold">❌ {verifyResult.message || 'अवैध पावती!'}</p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default PublicDevoteePortal;
