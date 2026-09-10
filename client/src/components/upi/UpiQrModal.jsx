import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { useMandal } from '../../context/MandalContext';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { Copy, Check, QrCode, IndianRupee } from 'lucide-react';

export function UpiQrModal({ isOpen, onClose, defaultAmount = 0, note = 'श्री गणेशोत्सव वर्गणी' }) {
  const { mandal } = useMandal();
  const { t } = useLanguage();
  const { showToast } = useNotification();
  const [customAmount, setCustomAmount] = useState(defaultAmount || 2500);
  const [isCopied, setIsCopied] = useState(false);

  const upiId = mandal?.upi_id || 'sarveshkharoshe8-2@okaxis';
  const upiName = mandal?.upi_name || 'Shreyash Gavade';

  // Construct NPCI standard UPI deep-link URI
  const upiUri = customAmount > 0
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${customAmount}&cu=INR&tn=${encodeURIComponent(note)}`
    : `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&cu=INR&tn=${encodeURIComponent(note)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setIsCopied(true);
    showToast(`UPI आयडी (${upiId}) कॉपी झाला!`, 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const presetAmounts = [2500, 3000];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🕉️ अधिकृत UPI QR कोड पेमेंट"
      subtitle={`${mandal?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ'} बँक खाते`}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Preset Amount Chips */}
        <div className="w-full">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5 text-left">
            रक्कम बदला (Select or enter amount):
          </label>
          <div className="grid grid-cols-3 gap-1.5 mb-2.5">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setCustomAmount(amt)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  customAmount === amt
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                ₹ {amt}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
              ₹
            </span>
            <input
              type="number"
              value={customAmount || ''}
              onChange={(e) => setCustomAmount(Number(e.target.value))}
              placeholder="इतर रक्कम टाका..."
              className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-center text-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {/* QR Code Container */}
        <div className="p-4 rounded-2xl bg-white border-2 border-amber-400 shadow-festive inline-block">
          <QRCodeSVG value={upiUri} size={190} level="H" />
        </div>

        {/* Amount Badge */}
        {customAmount > 0 && (
          <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-sm border border-emerald-300 dark:border-emerald-800">
            <IndianRupee className="w-4 h-4" />
            <span>देय रक्कम: ₹ {Number(customAmount).toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* UPI Details Box */}
        <div className="w-full p-3 rounded-xl bg-amber-50/70 dark:bg-slate-800/60 border border-amber-200 dark:border-slate-700 text-left space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            खाते नाव: <span className="font-bold text-slate-800 dark:text-slate-200">{upiName}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs">
              UPI ID: <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{upiId}</span>
            </div>
            <button
              onClick={handleCopyUpi}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
            >
              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {isCopied ? 'कॉपी झाले!' : 'कॉपी करा'}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
          गुगल पे (Google Pay), फोनपे (PhonePe), पेटीएम (Paytm) किंवा कोणत्याही UPI ॲपवरून हा QR कोड स्कॅन करा.
        </p>
      </div>
    </Modal>
  );
}

export default UpiQrModal;
