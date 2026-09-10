import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { GanpatiLogo } from '../components/common/GanpatiLogo';
import { ReceiptModal } from '../components/receipt/ReceiptModal';
import api, { API_BASE_URL } from '../services/api';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  ArrowLeft,
  Calendar,
  IndianRupee,
  Building,
  UserCheck,
  FileText,
  Download,
  Share2
} from 'lucide-react';

export function PublicVerifyReceiptPage() {
  const { receiptNumber: paramNumber } = useParams();
  const [searchCode, setSearchCode] = useState(paramNumber || '');
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

      const json = await api.get(`/public/verify-receipt/${encodeURIComponent(codeToVerify.trim())}`);

      if (json.valid && json.data) {
        setData(json.data);
      } else {
        setError(json.message || 'ही पावती अवैध आहे किंवा सिस्टीममध्ये नोंद आढळली नाही.');
      }
    } catch (err) {
      setError('पडताळणी करताना तांत्रिक त्रुटी निर्माण झाली.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramNumber) {
      verifyReceipt(paramNumber);
    }
  }, [paramNumber]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    verifyReceipt(searchCode);
  };

  const handleWhatsAppShare = () => {
    if (!data) return;
    const verificationUrl = window.location.href;
    const text = encodeURIComponent(`🙏 *श्री गणेशोत्सव अधिकृत डिजिटल वर्गणी पावती*\n\nपावती क्र: ${data.receiptNumber}\nदेणगीदार: ${data.donorNameSafe}\nरक्कम: ₹${Number(data.amount).toLocaleString('en-IN')}\n\nपावती पडताळणी व PDF साठी लिंक:\n${verificationUrl}\n\n🚩 *गणपती बाप्पा मोरया!* 🙏`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>मुख्य पृष्ठ / डॅशबोर्ड</span>
        </Link>
        <span className="text-xs font-bold text-slate-400">अधिकृत पडताळणी पोर्टल</span>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full my-auto py-8">
        <div className="rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Logo & Heading */}
          <div className="text-center space-y-2">
            <div className="inline-block mx-auto mb-1">
              <GanpatiLogo size="lg" glow={true} />
            </div>
            <p className="text-xs font-bold text-amber-400">
              ॥ श्री गणेशाय नमः ॥
            </p>
            <h1 className="text-2xl font-black text-white font-marathi">
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
              placeholder="पावती क्रमांक किंवा पडताळणी कोड टाका..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? 'तपासत आहे...' : 'तपासा'}
            </button>
          </form>

          {/* Result Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-center space-y-2">
              <XCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-sm font-bold text-rose-200">पावती वैध नाही किंवा सापडली नाही</h3>
              <p className="text-xs text-rose-300/80">{error}</p>
            </div>
          )}

          {data && (
            <div className="rounded-2xl bg-slate-800/80 border-2 border-emerald-500/50 p-5 space-y-4">
              {/* Verified Badge */}
              <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>✓ ही पावती १००% अधिकृत व सत्यापित आहे</span>
              </div>

              {/* Mandal details */}
              <div className="text-center space-y-0.5 border-b border-slate-700 pb-3">
                <h3 className="text-lg font-black text-amber-400 font-marathi">
                  {data.mandal?.nameMr}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {data.mandal?.address} • नोंदणी क्र: {data.mandal?.registrationNo || '-'}
                </p>
                <p className="text-[11px] text-amber-300 font-bold">
                  गणेशोत्सव वर्ष {data.mandal?.festivalYear || 2026}
                </p>
              </div>

              {/* Receipt Parameters */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">पावती क्रमांक:</span>
                  <p className="font-mono font-bold text-white text-sm mt-0.5">{data.receiptNumber}</p>
                </div>

                <div>
                  <span className="text-slate-400">दिनांक:</span>
                  <p className="font-bold text-white mt-0.5">{formatDate(data.date, 'mr')}</p>
                </div>

                <div>
                  <span className="text-slate-400">देणगीदार / व्यक्ती:</span>
                  <p className="font-bold text-white mt-0.5">{data.donorNameSafe}</p>
                </div>

                <div>
                  <span className="text-slate-400">पेमेंट पद्धत:</span>
                  <p className="font-bold text-white uppercase mt-0.5">{data.paymentMethod}</p>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold">
                    जमा वर्गणी रक्कम
                  </span>
                  <p className="text-2xl font-black text-emerald-400">
                    {formatCurrency(data.amount)}
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  उद्देश: <span className="font-semibold text-white">{data.purpose}</span>
                </div>
              </div>

              {/* Action Buttons: View Full Receipt / Download PDF */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFullReceiptModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>📄 अधिकृत डिजिटल पावती पहा (PDF / PNG डाऊनलोड करा)</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>शेअर</span>
                </button>
              </div>

              <p className="text-[11px] text-center text-amber-300/80 italic font-marathi pt-1">
                "श्री गणेशाच्या आशीर्वादाने आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद! गणपती बाप्पा मोरया!"
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Full Digital Receipt Modal with PDF download */}
      {showFullReceiptModal && data?.receipt && (
        <ReceiptModal
          isOpen={showFullReceiptModal}
          onClose={() => setShowFullReceiptModal(false)}
          receipt={data.receipt}
        />
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-2">
        गणपती मंडळ व्यवस्थापन प्रणाली © २०२६ • Powered by Safe Digital Receipts
      </footer>
    </div>
  );
}

export default PublicVerifyReceiptPage;

