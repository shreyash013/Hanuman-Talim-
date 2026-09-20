import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { GanpatiLogo } from '../components/common/GanpatiLogo';
import { ReceiptModal } from '../components/receipt/ReceiptModal';
import api from '../services/api';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowLeft,
  FileText,
  Share2,
  Sparkles,
  HeartHandshake
} from 'lucide-react';

export function PublicVerifyReceiptPage() {
  const { receiptNumber: paramNumber } = useParams();
  const [searchParams] = useSearchParams();
  const [searchCode, setSearchCode] = useState(paramNumber || searchParams.get('no') || searchParams.get('receipt') || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFullReceiptModal, setShowFullReceiptModal] = useState(false);

  const verifyReceipt = async (codeToVerify) => {
    if (!codeToVerify) return;
    try {
      setLoading(true);
      setError('');
      setData(null);

      const queryParams = searchParams.toString();
      const url = queryParams
        ? `/public/verify-receipt/${encodeURIComponent(codeToVerify.trim())}?${queryParams}`
        : `/public/verify-receipt/${encodeURIComponent(codeToVerify.trim())}`;

      const json = await api.get(url);

      if (json.valid && json.data) {
        setData(json.data);
        // Trigger celebratory festive confetti when QR code is scanned & verified
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 }
          });
        } catch (e) {
          // ignore if canvas-confetti fails
        }
      } else {
        // Resilient fallback: read from URL searchParams (e.g. from scanned QR code or WhatsApp link)
        const donorNameParam = searchParams.get('d') || searchParams.get('name');
        const amountParam = searchParams.get('a') || searchParams.get('amount');
        if (donorNameParam && amountParam) {
          const amt = Number(amountParam) || 0;
          const fallbackData = {
            receiptNumber: codeToVerify.trim(),
            donorNameSafe: decodeURIComponent(donorNameParam),
            amount: amt,
            date: searchParams.get('dt') || new Date().toISOString(),
            paymentMethod: searchParams.get('m') === 'upi' ? 'UPI / QR' : 'रोख (Cash)',
            purpose: decodeURIComponent(searchParams.get('p') || 'श्री गणेशोत्सव वर्गणी'),
            receipt: {
              receipt_number: codeToVerify.trim(),
              donor_name: decodeURIComponent(donorNameParam),
              amount: amt,
              payment_method: searchParams.get('m') || 'cash',
              purpose: decodeURIComponent(searchParams.get('p') || 'श्री गणेशोत्सव वर्गणी'),
              created_at: searchParams.get('dt') || new Date().toISOString()
            },
            mandal: {
              nameMr: 'श्री हनुमान तालीम मंडळ शिरोळ',
              address: 'नदीवेस, शिरोळ, जि. कोल्हापूर | ४१६१०३',
              registrationNo: 'MAH/KOLHAPUR/1964',
              festivalYear: 2026
            }
          };
          setData(fallbackData);
          try {
            confetti({
              particleCount: 120,
              spread: 90,
              origin: { y: 0.5 }
            });
          } catch (e) {}
        } else {
          setError(json.message || 'ही पावती अवैध आहे किंवा सिस्टीममध्ये नोंद आढळली नाही.');
        }
      }
    } catch (err) {
      setError('पडताळणी करताना तांत्रिक त्रुटी निर्माण झाली.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const targetNo = paramNumber || searchParams.get('no') || searchParams.get('receipt');
    if (targetNo) {
      setSearchCode(targetNo);
      verifyReceipt(targetNo);
    }
  }, [paramNumber, searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    verifyReceipt(searchCode);
  };

  const handleWhatsAppShare = () => {
    if (!data) return;
    const verificationUrl = window.location.href;
    const text = encodeURIComponent(`🙏 *श्री गणेशोत्सव अधिकृत डिजिटल वर्गणी पावती*\n\nपावती क्र: ${data.receiptNumber}\nदेणगीदार: ${data.receipt?.donor_name || data.donorNameSafe}\nरक्कम: ₹${Number(data.amount).toLocaleString('en-IN')}\n\nपावती पडताळणी लिंक:\n${verificationUrl}\n\n🚩 *गणपती बाप्पा मोरया!* 🙏`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-2">
        <Link to="/login" className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>लॉगिन / मुख्य डॅशबोर्ड</span>
        </Link>
        <span className="text-xs font-bold text-slate-400">अधिकृत पडताळणी पोर्टल</span>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full my-auto py-6">
        <div className="rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Logo & Heading */}
          <div className="text-center space-y-2">
            <div className="inline-block mx-auto mb-1">
              <GanpatiLogo size="lg" glow={true} />
            </div>
            <p className="text-xs font-bold text-amber-400 tracking-wider">
              ॥ श्री गणेशाय नमः ॥
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-marathi">
              डिजिटल पावती सत्यता पडताळणी
            </h1>
            <p className="text-xs text-slate-400">
              Official Digital Receipt Verification Portal
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              required
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="पावती क्रमांक (उदा. HANUMAN-2026-000001) टाका..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs sm:text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? 'तपासत आहे...' : 'तपासा'}
            </button>
          </form>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-center space-y-2">
              <XCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-sm font-bold text-rose-200">पावती वैध नाही किंवा सापडली नाही</h3>
              <p className="text-xs text-rose-300/80">{error}</p>
            </div>
          )}

          {/* Verified Receipt Result */}
          {data && (
            <div className="space-y-5">
              
              {/* Grand Thank You Appreciation Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/25 via-orange-500/15 to-amber-950/40 border-2 border-amber-500/50 text-center space-y-3.5 relative overflow-hidden shadow-2xl">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-3xl shadow-lg mx-auto transform hover:scale-105 transition-transform">
                  🙏
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-[11px] uppercase tracking-wider border border-amber-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>श्री गणेशोत्सव देणगीदार आभार</span>
                  </span>

                  <h2 className="text-2xl sm:text-3xl font-black text-amber-300 font-marathi">
                    मनःपूर्वक धन्यवाद!
                  </h2>

                  <p className="text-sm sm:text-base text-slate-100 font-bold leading-relaxed max-w-lg mx-auto font-marathi pt-1">
                    आदरणीय <span className="text-amber-300 font-black text-lg underline decoration-amber-500/50">{data.receipt?.donor_name || data.donorNameSafe}</span>,<br />
                    मंडळाच्या गणेशोत्सवासाठी आपली <span className="text-emerald-400 font-black text-lg">{formatCurrency(data.amount)}</span> वर्गणी / देणगी यशस्वीरित्या जमा झाली आहे.
                  </p>

                  <p className="text-xs sm:text-sm text-amber-200/90 font-medium italic pt-1 font-marathi">
                    "आपल्या या अमूल्य सहकार्याबद्दल श्री हनुमान तालीम मंडळ शिरोळ आपले मनःपूर्वक ऋणी आहे!"
                  </p>
                </div>

                <div className="pt-3 text-xs sm:text-sm font-black text-amber-400 font-marathi tracking-wide border-t border-amber-500/30">
                  🚩 गणपती बाप्पा मोरया! मंगलमूर्ती मोरया! 🚩
                </div>
              </div>

              {/* Verified Status Banner */}
              <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-xs sm:text-sm font-black shadow-md">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>✓ ही पावती १००% अधिकृत व डिजिटल सत्यापित आहे</span>
              </div>

              {/* Receipt Parameters Card */}
              <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-5 space-y-4 shadow-lg">
                <div className="text-center space-y-0.5 border-b border-slate-700/80 pb-3">
                  <h3 className="text-lg font-black text-amber-400 font-marathi">
                    {data.mandal?.nameMr || 'श्री हनुमान तालीम मंडळ शिरोळ'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {data.mandal?.address || 'नदीवेस, शिरोळ, जि. कोल्हापूर | ४१६१०३'} • नोंदणी क्र: {data.mandal?.registrationNo || 'MAH/KOLHAPUR/1964'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 text-[11px]">पावती क्रमांक:</span>
                    <p className="font-mono font-black text-amber-400 text-sm mt-0.5">{data.receiptNumber}</p>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 text-[11px]">दिनांक:</span>
                    <p className="font-bold text-white mt-0.5">{formatDate(data.date, 'mr')}</p>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 text-[11px]">देणगीदार:</span>
                    <p className="font-bold text-white mt-0.5">{data.receipt?.donor_name || data.donorNameSafe}</p>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 text-[11px]">पेमेंट पद्धत:</span>
                    <p className="font-bold text-white uppercase mt-0.5">
                      {data.paymentMethod === 'cash' ? 'रोख (Cash)' : data.paymentMethod === 'upi' ? 'UPI / QR कोड' : data.paymentMethod || 'UPI / QR कोड'}
                    </p>
                  </div>
                </div>

                {/* Amount Details Box */}
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-extrabold block">
                      जमा वर्गणी रक्कम
                    </span>
                    <p className="text-2xl font-black text-emerald-400 font-mono">
                      {formatCurrency(data.amount)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-300 max-w-[200px]">
                    संकल्प: <span className="font-bold text-amber-300 block">{data.purpose || 'श्री गणेशोत्सव वर्गणी'}</span>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFullReceiptModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs sm:text-sm shadow-xl transition-all transform hover:-translate-y-0.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>📄 मूळ डिजिटल पावती पाहा (PNG / PDF डाऊनलोड)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-lg transition-colors shrink-0"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>शेअर करा</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      {/* Full Digital Receipt Modal with PDF/PNG download */}
      {showFullReceiptModal && data?.receipt && (
        <ReceiptModal
          isOpen={showFullReceiptModal}
          onClose={() => setShowFullReceiptModal(false)}
          receipt={data.receipt}
        />
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-3">
        श्री हनुमान तालीम मंडळ शिरोळ © २०२६ • Powered by Safe Digital Receipts
      </footer>
    </div>
  );
}

export default PublicVerifyReceiptPage;

