import React, { useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { DigitalReceipt } from './DigitalReceipt';
import { useLanguage } from '../../context/LanguageContext';
import { useMandal } from '../../context/MandalContext';
import { useNotification } from '../../context/NotificationContext';
import {
  openWhatsAppReceipt,
  downloadReceiptImage,
  downloadReceiptPdf,
  copyReceiptImageToClipboard,
  shareReceiptFile
} from '../../utils/whatsappHelper';
import {
  Share2,
  Download,
  Printer,
  Copy,
  Check,
  MessageCircle,
  FileImage,
  FileText,
  Sparkles
} from 'lucide-react';

export function ReceiptModal({ isOpen, onClose, receipt }) {
  const { t } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const receiptRef = useRef(null);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCopiedImage, setIsCopiedImage] = useState(false);

  if (!receipt) return null;

  const handleShareImageOrPdf = async (format = 'image') => {
    if (!receiptRef.current) return;
    try {
      setIsSharing(true);
      showToast(`${format === 'pdf' ? 'PDF' : 'इमेज'} तयार होत आहे...`, 'info');
      const status = await shareReceiptFile(receiptRef.current, receipt, mandal, format);
      if (status === 'shared') {
        showToast('पावती यशस्वीरित्या शेअर केली!', 'success');
      } else {
        showToast('फाइल डाऊनलोड झाली व WhatsApp उघडले!', 'success');
      }
    } catch (err) {
      console.error('Share error:', err);
      showToast('शेअर करताना त्रुटी आली.', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    try {
      setIsExportingImage(true);
      showToast('इमेज (PNG) तयार होत आहे...', 'info');
      await downloadReceiptImage(receiptRef.current, receipt);
      showToast('पावती इमेज (PNG) यशस्वीरित्या डाऊनलोड झाली!', 'success');
    } catch (err) {
      console.error('Image export error:', err);
      showToast('इमेज डाऊनलोड करताना त्रुटी आली.', 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    try {
      setIsExportingPdf(true);
      showToast('PDF तयार होत आहे...', 'info');
      await downloadReceiptPdf(receiptRef.current, receipt);
      showToast('पावती PDF यशस्वीरित्या डाऊनलोड झाली!', 'success');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('PDF डाऊनलोड करताना त्रुटी आली.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyImage = async () => {
    if (!receiptRef.current) return;
    try {
      setIsCopyingImage(true);
      showToast('इमेज कॉपी होत आहे...', 'info');
      await copyReceiptImageToClipboard(receiptRef.current);
      setIsCopiedImage(true);
      showToast('पावती इमेज कॉपी झाली! WhatsApp Web वर Ctrl+V दाबून पेस्ट करा.', 'success');
      setTimeout(() => setIsCopiedImage(false), 3000);
    } catch (err) {
      console.error('Copy image error:', err);
      showToast('इमेज कॉपी करणे supported नाही. PNG / PDF डाउनलोड वापरा.', 'warning');
    } finally {
      setIsCopyingImage(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('receipt.title', 'डिजिटल वर्गणी पावती (Official Receipt)')}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Action Buttons Bar */}
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-slate-800/80 border border-amber-500/30 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Primary Mobile Share Button */}
            <button
              disabled={isSharing}
              onClick={() => handleShareImageOrPdf('image')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>{isSharing ? 'तयार होत आहे...' : 'WhatsApp वर इमेज पावती पाठवा'}</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {/* Copy Image Button */}
              <button
                disabled={isCopyingImage}
                onClick={handleCopyImage}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-600 transition shadow-sm"
                title="WhatsApp Web वर पेस्ट करण्यासाठी इमेज कॉपी करा"
              >
                {isCopiedImage ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-amber-500" />}
                <span>{isCopiedImage ? 'कॉपी झाली!' : 'इमेज कॉपी करा (Ctrl+V)'}</span>
              </button>

              {/* Download Image PNG */}
              <button
                disabled={isExportingImage}
                onClick={handleDownloadImage}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                <FileImage className="w-4 h-4" />
                <span>{isExportingImage ? '...' : 'PNG फोटो डाऊनलोड'}</span>
              </button>

              {/* Download PDF */}
              <button
                disabled={isExportingPdf}
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-800 hover:bg-red-900 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>{isExportingPdf ? '...' : 'PDF डाऊनलोड'}</span>
              </button>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 font-bold text-xs transition"
              >
                <Printer className="w-4 h-4" />
                <span>प्रिंट</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 font-medium pt-1 border-t border-amber-500/20">
            <span>📱 <strong>मोबाईल:</strong> WhatsApp बटणावर क्लिक करताच इमेज / PDF फाइल डायरेक्ट चॅटवर पाठवता येते.</span>
            <span className="hidden sm:inline">💻 <strong>डेस्कटॉप:</strong> 'इमेज कॉपी करा' दाबून WhatsApp Web मध्ये direct Ctrl+V (Paste) करा.</span>
          </div>
        </div>

        {/* Printable Digital Receipt Card */}
        <div className="overflow-x-auto pb-2">
          <DigitalReceipt
            receipt={receipt}
            mandal={mandal}
            receiptRef={receiptRef}
          />
        </div>
      </div>
    </Modal>
  );
}

export default ReceiptModal;

