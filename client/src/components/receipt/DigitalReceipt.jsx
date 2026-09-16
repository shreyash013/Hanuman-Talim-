import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateUtils';
import { numberToWordsMarathi } from '../../utils/marathiNumberToWords';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export function DigitalReceipt({ receipt, mandal, receiptRef }) {
  if (!receipt) return null;

  const currentMandal = mandal || {
    name_mr: 'श्री हनुमान तालीम मंडळ शिरोळ',
    name_en: 'Shri Hanuman Talim Mandal Shirol',
    tagline_mr: 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा राजा ॥ 🔱',
    address_mr: 'नदीवेस, शिरोळ, जि. कोल्हापूर | ४१६१०३',
    contact_phone: '+91 9356997428',
    registration_no: 'MAH/KOLHAPUR/1964',
    festival_year: 2026
  };

  const receiptNo = receipt.receipt_number || receipt.receiptNo || 'HANUMAN-2026-000001';
  
  // Dynamic verification URL encoded in the unique QR code
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hanuman-talim.vercel.app';
  const verificationUrl = `${origin}/verify-receipt/${receiptNo}`;

  const formattedDate = receipt.created_at
    ? formatDate(receipt.created_at, 'mr')
    : '१४ सप्टेंबर २०२६';

  const amountNumber = Number(receipt.amount || 0);
  const amountInWords = receipt.amount_in_words_mr || numberToWordsMarathi(amountNumber);

  const paymentMethodText =
    receipt.payment_method === 'cash' ? 'रोख (Cash)' :
    receipt.payment_method === 'upi' ? 'UPI / QR कोड' :
    receipt.payment_method === 'bank_transfer' ? 'बँक ट्रान्सफर' :
    receipt.payment_method === 'pending_udhar' ? 'उधार / बाकी (Pending)' :
    receipt.payment_method || 'UPI / QR कोड';

  return (
    <div
      ref={receiptRef}
      style={{ width: '540px', minWidth: '540px' }}
      className="printable-area bg-[#fffcf7] text-slate-900 p-5 rounded-3xl border-4 border-[#d97706]/70 shadow-2xl relative mx-auto overflow-hidden font-sans box-border"
    >
      {/* Decorative Watermark & Glows */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Inner Border Frame */}
      <div className="border-2 border-amber-600/30 rounded-2xl p-4 space-y-4 bg-white/95 backdrop-blur-sm relative z-10 shadow-sm">
        
        {/* Top Header Row with Logo & Mandal Info */}
        <div className="flex items-center gap-4 pb-3 border-b-2 border-amber-500/30">
          <div className="w-20 h-20 rounded-2xl border-2 border-amber-500 p-1 bg-gradient-to-tr from-amber-100 to-orange-100 flex items-center justify-center shrink-0 shadow-md">
            <img
              src={logoImg}
              alt="Ganpati Mandal Logo"
              className="w-full h-full object-cover rounded-xl"
              crossOrigin="anonymous"
            />
          </div>

          <div className="flex-1 space-y-1">
            <p className="text-[11px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-1 font-marathi">
              <span>॥ श्री गणेशाय नमः ॥</span>
              <span className="text-amber-500">•</span>
              <span>अधिकृत वर्गणी पावती</span>
            </p>
            <h1 className="text-xl font-black text-amber-950 font-marathi leading-tight">
              {currentMandal.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ'}
            </h1>
            <p className="text-[11px] text-slate-600 font-medium">
              {currentMandal.address_mr || 'नदीवेस, शिरोळ, जि. कोल्हापूर | ४१६१०३'} | नोंदणी क्र: {currentMandal.registration_no || 'MAH/KOLHAPUR/1964'}
            </p>
          </div>
        </div>

        {/* Receipt Banner & Number Row */}
        <div className="flex items-center justify-between bg-[#4a2411] text-white rounded-xl px-4 py-2.5 shadow-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-extrabold text-xs tracking-wider uppercase">डिजिटल वर्गणी पावती</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-amber-300 block font-semibold uppercase tracking-wider">पावती क्रमांक</span>
            <span className="font-mono font-black text-amber-400 text-sm tracking-wide">{receiptNo}</span>
          </div>
        </div>

        {/* Structured Details Grid */}
        <div className="bg-[#fefce8] border border-amber-200/90 rounded-xl p-4 space-y-3.5">
          
          {/* Received From */}
          <div className="flex flex-col gap-1 border-b border-amber-200/80 pb-2.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">देणगीदार / श्री-श्रीमती:</span>
            <span className="font-black text-slate-900 text-xl font-marathi tracking-tight">
              {receipt.donor_name}
            </span>
          </div>

          {/* Amount Box */}
          <div className="p-3.5 rounded-xl bg-[#0e6d49] text-white shadow-md flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-200 uppercase font-extrabold tracking-wider block">जमा वर्गणी रक्कम</span>
              <span className="text-2xl font-black font-mono text-[#34d399]">
                {formatCurrency(amountNumber)}
              </span>
            </div>
            <div className="text-right max-w-[240px]">
              <span className="text-[10px] text-emerald-200 uppercase font-extrabold tracking-wider block">अक्षरी रक्कम</span>
              <span className="text-xs font-bold text-white font-marathi line-clamp-2">
                {amountInWords}
              </span>
            </div>
          </div>

          {/* Date, Payment Method & Purpose Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-amber-200/70 space-y-0.5">
              <span className="text-slate-500 text-[11px] block font-semibold">दिनांक:</span>
              <span className="font-bold text-slate-900 block">{formattedDate}</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-amber-200/70 space-y-0.5">
              <span className="text-slate-500 text-[11px] block font-semibold">पेमेंट प्रकार:</span>
              <span className="font-bold text-slate-900 uppercase block">
                {paymentMethodText}
              </span>
            </div>

            <div className="col-span-2 bg-white p-2.5 rounded-lg border border-amber-200/70 space-y-0.5">
              <span className="text-slate-500 text-[11px] block font-semibold">संकल्प / उद्देश:</span>
              <span className="font-bold text-slate-900 block">{receipt.purpose || 'श्री गणेशोत्सव वर्गणी'}</span>
            </div>
          </div>

        </div>

        {/* QR Verification Bar with Dynamic Unique QR Code */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-amber-300/90 shadow-xs">
          <div className="space-y-1 max-w-[340px]">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 font-marathi">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>१००% अधिकृत डिजिटल पावती सत्यापित</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              क्युआर कोड स्कॅन करून मंडळाच्या डिजिटल पोर्टलवर पावती तपासा.
            </p>
          </div>
          <div className="p-1.5 bg-white border border-amber-400/80 rounded-lg shadow-xs shrink-0">
            <QRCodeSVG value={verificationUrl} size={64} level="H" includeMargin={false} />
          </div>
        </div>

        {/* Footer Blessing */}
        <div className="text-center pt-1 border-t border-amber-500/20">
          <p className="text-xs font-black text-amber-950 font-marathi italic">
            "श्री गणेशाच्या आशीर्वादाने आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद! गणपती बाप्पा मोरया!"
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
            श्री हनुमान तालीम मंडळ शिरोळ © 2026 • Powered by Safe Digital Receipts
          </p>
        </div>

      </div>
    </div>
  );
}

export default DigitalReceipt;
