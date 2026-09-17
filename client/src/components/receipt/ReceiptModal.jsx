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

  const rawMobile = receipt.mobile ? String(receipt.mobile).replace(/\D/g, '') : '';
  const hasMobile = rawMobile.length >= 10;
  const displayMobile = hasMobile ? (rawMobile.length === 10 ? `+91 ${rawMobile}` : `+${rawMobile}`) : (receipt.mobile || '');

  const handleDirectWhatsAppMsg = () => {
    openWhatsAppReceipt(receipt, mandal, true);
    showToast(`WhatsApp ${displayMobile ? `(${displayMobile})` : ''} उघडत आहे...`, 'info');
  };

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
            <div className="flex flex-wrap items-center gap-2">
              {/* Main HD Image WhatsApp Share Button */}
              <button
                disabled={isSharing}
                onClick={() => handleShareImageOrPdf('image')}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                title={displayMobile ? `${displayMobile} वर HD पावती फोटो पाठवा` : 'WhatsApp वर HD पावती फोटो पाठवा'}
              >
                <MessageCircle className="w-5 h-5 fill-current text-white shrink-0" />
                <div className="text-left">
                  <span className="block leading-tight">
                    {isSharing ? 'HD इमेज तयार होत आहे...' : 'WhatsApp वर HD पावती फोटो पाठवा'}
                  </span>
                  {displayMobile && (
                    <span className="text-[10px] text-emerald-100 block font-normal">
                      नंबर: {displayMobile}
                    </span>
                  )}
                </div>
              </button>
            </div>

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

          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-amber-800 dark:text-amber-300 font-medium pt-1 border-t border-amber-500/20">
            <span>📱 <strong>लक्ष्य मोबाईल:</strong> <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{displayMobile || 'मोबाईल नोंदवला नाही'}</strong> (पावती डायरेक्ट या क्रमांकावर पाठवली जाते)</span>
            <span className="hidden sm:inline">💻 <strong>डेस्कटॉप:</strong> 'इमेज कॉपी करा' दाबून WhatsApp Web मध्ये डायरेक्ट Ctrl+V करा.</span>
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

