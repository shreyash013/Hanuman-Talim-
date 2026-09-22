import React, { useRef, useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { DigitalReceipt } from './DigitalReceipt';
import { useLanguage } from '../../context/LanguageContext';
import { useMandal } from '../../context/MandalContext';
import { useNotification } from '../../context/NotificationContext';
import { openWhatsAppReceipt, buildWhatsAppReceiptMessage } from '../../utils/whatsappHelper';
import api from '../../services/api';
import { numberToWordsMarathi, numberToWordsEnglish } from '../../utils/marathiNumberToWords';
import { MessageCircle, Pencil, Check, X } from 'lucide-react';
import html2canvas from 'html2canvas';

export function ReceiptModal({ isOpen, onClose, receipt, autoShare = false, onUpdated }) {
  const { t } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const receiptRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const autoSharedRef = useRef(false);

  // Editable receipt state
  const [localReceipt, setLocalReceipt] = useState(receipt);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('cash');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalReceipt(receipt);
    setIsEditing(false);
  }, [receipt]);

  // Ultra-fast background pre-generation: As soon as modal opens, prepare image file in background
  useEffect(() => {
    let isMounted = true;
    if (isOpen && receipt && receiptRef.current) {
      const timer = setTimeout(async () => {
        try {
          if (!receiptRef.current) return;
          const canvas = await html2canvas(receiptRef.current, {
            scale: 1.3,
            useCORS: true,
            backgroundColor: '#fffcf7',
            logging: false,
            allowTaint: true
          });
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.92));
          if (blob && isMounted) {
            const fileName = `पावती_${receipt.receipt_number || 'vargani'}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });
            setImageFile(file);
          }
        } catch (e) {
          console.warn('Pre-render image error:', e);
        }
      }, 120);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    } else {
      setImageFile(null);
    }
  }, [isOpen, receipt]);

  // Reset auto-share lock when modal closes
  useEffect(() => {
    if (!isOpen) {
      autoSharedRef.current = false;
    }
  }, [isOpen]);

  // Auto-share trigger when modal opens with autoShare=true
  useEffect(() => {
    if (isOpen && autoShare && receipt && !autoSharedRef.current) {
      autoSharedRef.current = true;
      const timer = setTimeout(() => {
        handleWhatsApp();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoShare, receipt]);

  if (!receipt && !localReceipt) return null;

  const currentData = localReceipt || receipt;
  // Resolve mobile number if missing from receipt record
  const resolvedMobile = currentData.mobile || currentData.phone || currentData.donor_phone || currentData.contact || '';
  const activeReceipt = {
    ...currentData,
    mobile: resolvedMobile
  };

  const startEdit = () => {
    setEditName(activeReceipt.donor_name || '');
    setEditAmount(String(activeReceipt.amount || ''));
    setEditMobile(activeReceipt.mobile || '');
    setEditAddress(activeReceipt.address || '');
    setEditPurpose(activeReceipt.purpose || 'श्री गणेशोत्सव वर्गणी');
    setEditPaymentMethod(activeReceipt.payment_method || 'cash');
    setIsEditing(true);
  };

  const handleSaveEditReceipt = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('देणगीदाराचे नाव आवश्यक आहे.', 'warning');
      return;
    }
    const parsedAmount = Number(editAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('कृपया वैध रक्कम टाका (Amount > 0).', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        donor_name: editName.trim(),
        amount: parsedAmount,
        mobile: editMobile.trim(),
        address: editAddress.trim(),
        purpose: editPurpose.trim(),
        payment_method: editPaymentMethod
      };

      const targetId = activeReceipt.id || activeReceipt.receipt_number;
      await api.put(`/income/${targetId}`, payload).catch(() => {});

      const updated = {
        ...activeReceipt,
        donor_name: editName.trim(),
        amount: parsedAmount,
        amount_in_words_mr: numberToWordsMarathi(parsedAmount),
        amount_in_words_en: numberToWordsEnglish(parsedAmount),
        mobile: editMobile.trim(),
        address: editAddress.trim(),
        purpose: editPurpose.trim(),
        payment_method: editPaymentMethod
      };

      setLocalReceipt(updated);
      setImageFile(null); // Force re-render image for WhatsApp
      setIsEditing(false);
      showToast('पावती माहिती यशस्वीरित्या अद्ययावत केली!', 'success');
      if (typeof onUpdated === 'function') {
        onUpdated(updated);
      }
    } catch (err) {
      showToast(err.message || 'माहिती बदलताना त्रुटी.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Send the EXACT receipt image directly to WhatsApp
  const handleWhatsApp = async () => {
    try {
      const simpleMsg = buildWhatsAppReceiptMessage(activeReceipt, mandal);
      let fileToShare = imageFile;

      // If clicked before background pre-rendering finished, render immediately
      if (!fileToShare && receiptRef.current) {
        const canvas = await html2canvas(receiptRef.current, {
          scale: 1.3,
          useCORS: true,
          backgroundColor: '#fffcf7',
          logging: false
        });
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.92));
        if (blob) {
          const fileName = `पावती_${activeReceipt.receipt_number || 'vargani'}.png`;
          fileToShare = new File([blob], fileName, { type: 'image/png' });
          setImageFile(fileToShare);
        }
      }

      // 1. Mobile (Android / iOS): Send exact image file straight to WhatsApp
      if (fileToShare && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
        try {
          await navigator.share({
            files: [fileToShare],
            title: `पावती क्र. ${activeReceipt.receipt_number || ''}`,
            text: simpleMsg
          });
          showToast('पावती फोटो WhatsApp वर यशस्वीरित्या पाठवला!', 'success');
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') return;
          console.warn('Native share error, falling back to direct WhatsApp link:', shareErr);
          openWhatsAppReceipt(activeReceipt, mandal, true);
          return;
        }
      }

      // 2. Desktop Fallback: Copy image to clipboard, download, and open WhatsApp Web
      if (fileToShare) {
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': fileToShare })]);
          }
        } catch {}

        try {
          const url = URL.createObjectURL(fileToShare);
          const link = document.createElement('a');
          link.href = url;
          link.download = `पावती_${activeReceipt.receipt_number || 'vargani'}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch {}
      }

      openWhatsAppReceipt(activeReceipt, mandal, true);
      showToast('पावती फोटो तयार झाला! चॅटमध्ये पेस्ट (Ctrl+V) करा.', 'info');
    } catch (err) {
      if (err.name === 'AbortError') return; // User simply dismissed share dialog
      console.error('WhatsApp share error:', err);
      openWhatsAppReceipt(activeReceipt, mandal, true);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('receipt.title', 'डिजिटल वर्गणी पावती (Official Receipt)')}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Action Bar: WhatsApp, Edit, and Close */}
        <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-slate-800/80 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* WhatsApp Button */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              title="WhatsApp वर पावती फोटो पाठवा"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-white shrink-0" />
              <span>WhatsApp (पावती फोटो)</span>
            </button>

            {/* Edit Receipt Button */}
            <button
              type="button"
              onClick={() => (isEditing ? setIsEditing(false) : startEdit())}
              className={`flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer border ${
                isEditing
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
              }`}
              title="पावती माहिती दुरुस्त करा (Edit Receipt)"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isEditing ? 'संपादन बंद' : 'माहिती बदला'}</span>
            </button>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            <span>पूर्ण झाले ✓</span>
          </button>
        </div>

        {/* Inline Edit Form when isEditing is true */}
        {isEditing && (
          <form onSubmit={handleSaveEditReceipt} className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-amber-200 dark:border-amber-900">
              <span className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" />
                पावती क्र. {activeReceipt.receipt_number || ''} संपादन
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">देणगीदाराचे नाव *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">रक्कम (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">मोबाईल क्रमांक</label>
                <input
                  type="text"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">पत्ता / भाग</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">जमा पद्धत</label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                >
                  <option value="cash">रोख (Cash)</option>
                  <option value="upi">UPI / PhonePe / GPay</option>
                  <option value="bank_transfer">बँक ट्रान्सफर</option>
                  <option value="cheque">चेक</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">उद्देश</label>
                <input
                  type="text"
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1 shadow cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? 'जतन होत आहे...' : 'बदल जतन करा (Save)'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Printable Digital Receipt Card */}
        <div className="overflow-x-auto pb-2">
          <DigitalReceipt
            receipt={activeReceipt}
            mandal={mandal}
            receiptRef={receiptRef}
          />
        </div>
      </div>
    </Modal>
  );
}

export default ReceiptModal;
