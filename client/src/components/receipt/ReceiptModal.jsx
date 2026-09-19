import React, { useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { DigitalReceipt } from './DigitalReceipt';
import { useLanguage } from '../../context/LanguageContext';
import { useMandal } from '../../context/MandalContext';
import { useNotification } from '../../context/NotificationContext';
import {
  downloadReceiptImage,
  copyReceiptImageToClipboard,
  shareReceiptFile,
  getDisplayMobileNumber,
  getFormattedWhatsAppNumber,
  openWhatsAppReceipt
} from '../../utils/whatsappHelper';
import {
  MessageCircle,
  FileImage,
  Copy,
  Check
} from 'lucide-react';

export function ReceiptModal({ isOpen, onClose, receipt }) {
  const { t } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const receiptRef = useRef(null);

  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCopiedImage, setIsCopiedImage] = useState(false);

  if (!receipt) return null;

  const activeReceipt = receipt;
  const displayMobile = getDisplayMobileNumber(activeReceipt);
  const formattedNum = getFormattedWhatsAppNumber(activeReceipt);

  // 1. WhatsApp Action: Send strictly HD receipt image (0 words) or direct chat fallback
  const handleShareToWhatsApp = async () => {
    if (!receiptRef.current || !activeReceipt) return;
    try {
      setIsSharing(true);
      showToast('HD पावती फोटो तयार होत आहे...', 'info');
      const res = await shareReceiptFile(receiptRef.current, activeReceipt, mandal, 'image');

      if (res?.status === 'shared') {
        showToast('HD पावती फोटो यशस्वीरित्या पाठवला!', 'success');
      } else if (res?.status === 'aborted') {
        // User closed the share sheet
      } else {
        // Direct WhatsApp redirection fallback if Web Share unavailable
        openWhatsAppReceipt(activeReceipt, mandal, true);
        showToast('WhatsApp उघडत आहे...', 'info');
      }
    } catch (err) {
      console.error('WhatsApp share error:', err);
      // Fallback: direct WhatsApp open
      try {
        openWhatsAppReceipt(activeReceipt, mandal, true);
        showToast('WhatsApp उघडत आहे...', 'info');
      } catch {
        showToast('शेअर करताना तांत्रिक अडचण आली.', 'error');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // 2. PNG Download Action
  const handleDownloadImage = async () => {
    if (!receiptRef.current || !activeReceipt) return;
    try {
      setIsExportingImage(true);
      showToast('पावती फोटो तयार होत आहे...', 'info');
      await downloadReceiptImage(receiptRef.current, activeReceipt);
      showToast('पावती फोटो डाऊनलोड झाला!', 'success');
    } catch (err) {
      console.error('Image export error:', err);
      showToast('फोटो डाऊनलोड करताना त्रुटी आली.', 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  // 3. Copy Image Action
  const handleCopyImage = async () => {
    if (!receiptRef.current) return;
    try {
      setIsCopyingImage(true);
      showToast('इमेज कॉपी होत आहे...', 'info');
      await copyReceiptImageToClipboard(receiptRef.current);
      setIsCopiedImage(true);
      showToast('पावती इमेज कॉपी झाली! WhatsApp वर Ctrl+V दाबून पेस्ट करा.', 'success');
      setTimeout(() => setIsCopiedImage(false), 3000);
    } catch (err) {
      console.error('Copy image error:', err);
      showToast('इमेज कॉपी करणे समर्थित नाही. डाऊनलोड पर्याय वापरा.', 'warning');
    } finally {
      setIsCopyingImage(false);
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
        {/* Streamlined Action Bar: Only WhatsApp, PNG Download, Copy Image, and Close */}
        <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-slate-800/80 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. WhatsApp Button (Direct 1-Click Send Image) */}
            <button
              type="button"
              disabled={isSharing}
              onClick={handleShareToWhatsApp}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
              title="WhatsApp वर पावती फोटो पाठवा"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-white shrink-0" />
              <span>{isSharing ? 'तयार होत आहे...' : 'WhatsApp'}</span>
            </button>

            {/* 2. PNG Download Button */}
            <button
              type="button"
              disabled={isExportingImage}
              onClick={handleDownloadImage}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
              title="पावती फोटो (PNG) डाऊनलोड करा"
            >
              <FileImage className="w-4 h-4 shrink-0" />
              <span>{isExportingImage ? 'डाऊनलोड होत आहे...' : 'पावती फोटो डाऊनलोड'}</span>
            </button>

            {/* 3. Copy Image Button */}
            <button
              type="button"
              disabled={isCopyingImage}
              onClick={handleCopyImage}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-600 transition shadow-sm cursor-pointer"
              title="WhatsApp Web वर पेस्ट करण्यासाठी इमेज कॉपी करा"
            >
              {isCopiedImage ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-amber-500" />}
              <span>{isCopiedImage ? 'कॉपी झाली!' : 'फोटो कॉपी (Ctrl+V)'}</span>
            </button>
          </div>

          {/* 4. Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
          >
            <span>पूर्ण झाले ✓</span>
          </button>
        </div>

        {/* Printable Official Digital Receipt */}
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
