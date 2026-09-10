import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateUtils';
import { FileText, User, IndianRupee, Calendar, CalendarDays, CreditCard } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export function DigitalReceipt({ receipt, mandal, receiptRef }) {
  if (!receipt) return null;

  const currentMandal = mandal || {
    name_mr: 'श्री हनुमान तालीम मंडळ शिरोळ',
    name_en: 'HANUMAN TALIM MANDAL SHIROL',
    tagline_mr: 'GANPATI MANDAL',
    contact_phone: '+91 9356997428',
    registration_no: 'MAH/KOLHAPUR/1964',
    festival_year: 2026
  };

  const verificationUrl = `${window.location.origin}/verify-receipt/${receipt.receipt_number}`;

  const formattedDate = receipt.created_at
    ? new Date(receipt.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '10 Sept 2026';

  const finYear = currentMandal.festival_year ? `${currentMandal.festival_year}-${(currentMandal.festival_year + 1).toString().slice(-2)}` : '2026-27';

  return (
    <div
      ref={receiptRef}
      className="printable-area bg-white text-slate-900 p-6 sm:p-10 rounded-3xl border-4 border-amber-600/40 shadow-2xl relative max-w-lg mx-auto overflow-hidden font-sans"
    >
      {/* Outer Border Box Frame */}
      <div className="border border-amber-800/20 rounded-2xl p-5 sm:p-6 space-y-6">
        
        {/* Top Centered Logo */}
        <div className="flex justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-amber-500 p-0.5 flex items-center justify-center bg-amber-400/20 shadow-md overflow-hidden">
            <img
              src={logoImg}
              alt="Ganpati Mandal Logo"
              className="w-full h-full object-cover object-center rounded-full"
            />
          </div>
        </div>

        {/* Header Titles */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="h-[1px] w-12 bg-amber-600/40"></span>
            <span className="text-[11px] sm:text-xs font-bold text-amber-700 uppercase tracking-widest">
              GANPATI MANDAL
            </span>
            <span className="h-[1px] w-12 bg-amber-600/40"></span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-red-950 font-serif tracking-tight uppercase">
            {currentMandal.name_en || 'HANUMAN TALIM MANDAL SHIROL'}
          </h1>
          <p className="text-xs font-extrabold text-amber-800 font-marathi">
            {currentMandal.name_mr}
          </p>
        </div>

        {/* Dark Maroon Badge */}
        <div className="flex justify-center">
          <div className="bg-red-950 text-white font-extrabold text-xs tracking-wider uppercase px-6 py-2 rounded-full shadow-md text-center border border-red-900">
            DIGITAL VARGANI RECEIPT
          </div>
        </div>

        {/* Rounded Cream Details Card */}
        <div className="bg-[#FAF5EF] border border-amber-800/20 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-inner">
          
          {/* 1. Receipt No */}
          <div className="flex items-center justify-between text-xs sm:text-sm border-b border-amber-900/10 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-red-950 text-white flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="text-slate-600 font-bold">Receipt No.</span>
            </div>
            <span className="font-mono font-black text-slate-900 text-sm sm:text-base">
              {receipt.receipt_number || 'GM-2026-0001'}
            </span>
          </div>

          {/* 2. Received From */}
          <div className="flex items-center justify-between text-xs sm:text-sm border-b border-amber-900/10 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-red-950 text-white flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-slate-600 font-bold">Received From</span>
            </div>
            <span className="font-extrabold text-slate-900 text-sm sm:text-base">
              {receipt.donor_name}
            </span>
          </div>

          {/* 3. Amount (Soft Pink Highlight Chip) */}
          <div className="flex items-center justify-between text-xs sm:text-sm border-b border-amber-900/10 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-red-950 text-white flex items-center justify-center shrink-0">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
              <span className="text-slate-600 font-bold">Amount</span>
            </div>
            <div className="px-4 py-1.5 rounded-2xl bg-red-100/80 border border-red-200 text-red-950 font-black text-base sm:text-lg shadow-xs">
              {formatCurrency(receipt.amount)}
            </div>
          </div>

          {/* 4. Date */}
          <div className="flex items-center justify-between text-xs sm:text-sm border-b border-amber-900/10 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-red-950 text-white flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="text-slate-600 font-bold">Date</span>
            </div>
            <span className="font-bold text-slate-900">
              {formattedDate}
            </span>
          </div>

          {/* 5. Financial Year */}
          <div className="flex items-center justify-between text-xs sm:text-sm border-b border-amber-900/10 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-red-950 text-white flex items-center justify-center shrink-0">
                <CalendarDays className="w-3.5 h-3.5" />
              </div>
              <span className="text-slate-600 font-bold">Financial Year</span>
            </div>
            <span className="font-bold text-slate-900">
              {finYear}
            </span>
          </div>

          {/* 6. Payment Mode */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-red-950 text-white flex items-center justify-center shrink-0">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <span className="text-slate-600 font-bold">Payment Mode</span>
            </div>
            <span className="font-extrabold text-slate-900 capitalize">
              {receipt.payment_method === 'cash' ? 'Cash' : receipt.payment_method === 'upi' ? 'UPI / Online' : receipt.payment_method}
            </span>
          </div>

        </div>

        {/* Verification QR Code Bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800 block">अधिकृत पडताळणी QR कोड</span>
            <span className="text-[10px] text-slate-500 block">Scan to verify digital receipt</span>
          </div>
          <QRCodeSVG value={verificationUrl} size={50} level="M" />
        </div>

        {/* Soft Pink Footer Banner */}
        <div className="p-3.5 rounded-2xl bg-red-100/60 border border-red-200 text-center">
          <p className="text-xs sm:text-sm font-black italic text-red-950 font-serif">
            Thank you for your valuable contribution!
          </p>
        </div>

        {/* Sub-footer Branding */}
        <div className="text-center space-y-0.5 text-[10px] text-slate-500 font-medium">
          <p>Shri Hanuman Talim Mandal Shirol | Digital Receipt</p>
          <p className="text-amber-800 font-bold uppercase tracking-wider">All Rights Reserved 2026</p>
        </div>

      </div>
    </div>
  );
}

export default DigitalReceipt;
