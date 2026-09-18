import React, { useRef, useState, useEffect } from 'react';
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
  shareReceiptFile,
  shareReceiptNativeApp,
  getDisplayMobileNumber,
  getFormattedWhatsAppNumber
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
  Sparkles,
  Phone,
  Edit2
} from 'lucide-react';

export function ReceiptModal({ isOpen, onClose, receipt, autoShare = false }) {
  const { t } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const receiptRef = useRef(null);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCopiedImage, setIsCopiedImage] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // Editable mobile state so user can review or change number directly in receipt popup
  const [mobileNumber, setMobileNumber] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  useEffect(() => {
    if (receipt) {
      setMobileNumber(receipt.mobile || receipt.phone || '');
    }
  }, [receipt]);

  const activeReceipt = receipt ? { ...receipt, mobile: mobileNumber } : null;
  const formattedNum = activeReceipt ? getFormattedWhatsAppNumber(activeReceipt) : '';
  const displayMobile = activeReceipt ? getDisplayMobileNumber(activeReceipt) : '';

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleDirectWhatsAppMsg = () => {
    if (!activeReceipt) return;
    openWhatsAppReceipt(activeReceipt, mandal, true);
    showToast(`WhatsApp ${displayMobile ? `(${displayMobile})` : ''} उघडत आहे...`, 'info');
  };

  const handleShareImageOrPdf = async (format = 'image') => {
    if (!receiptRef.current || !activeReceipt) return;
    try {
      setIsSharing(true);
      showToast(`${format === 'pdf' ? 'PDF' : 'HD इमेज'} तयार होत आहे...`, 'info');
      const res = await shareReceiptFile(receiptRef.current, activeReceipt, mandal, format);

      if (res?.status === 'shared') {
        showToast('HD पावती फोटो WhatsApp वर यशस्वीरित्या पाठवला! 🕉️', 'success');
        setShowDesktopGuide(false);
      } else if (res?.status === 'copied_and_opened') {
        setShowDesktopGuide(true);
        showToast('HD पावती फोटो कॉपी व डाऊनलोड झाला! WhatsApp मध्ये Ctrl+V दाबा.', 'success');
      } else if (res?.status !== 'aborted') {
        setShowDesktopGuide(true);
        showToast('पावती डाऊनलोड झाली व WhatsApp उघडले!', 'success');
      }
    } catch (err) {
      console.error('Share error:', err);
      showToast('शेअर करताना त्रुटी आली.', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleNativeShareDirect = async () => {
    if (!receiptRef.current || !activeReceipt) return;
    try {
      setIsSharing(true);
      showToast('मोबाईल शेअर शीट उघडत आहे...', 'info');
      await shareReceiptNativeApp(receiptRef.current, activeReceipt, mandal);
      showToast('HD पावती फोटो यशस्वीरित्या पाठवला!', 'success');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Native share failed, using standard WhatsApp flow:', err);
        handleShareImageOrPdf('image');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!receiptRef.current || !activeReceipt) return;
    try {
      setIsExportingImage(true);
      showToast('इमेज (PNG) तयार होत आहे...', 'info');
      await downloadReceiptImage(receiptRef.current, activeReceipt);
      showToast('पावती इमेज (PNG) यशस्वीरित्या डाऊनलोड झाली!', 'success');
    } catch (err) {
      console.error('Image export error:', err);
      showToast('इमेज डाऊनलोड करताना त्रुटी आली.', 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!receiptRef.current || !activeReceipt) return;
    try {
      setIsExportingPdf(true);
      showToast('PDF तयार होत आहे...', 'info');
      await downloadReceiptPdf(receiptRef.current, activeReceipt);
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
      showToast('पावती इमेज कॉपी झाली! WhatsApp वर Ctrl+V दाबून पेस्ट करा.', 'success');
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

  if (!receipt) return null;

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
          
          {/* Target Mobile Row with Inline Quick Editor */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                लक्ष्य मोबाईल क्रमांक (WhatsApp Target):
              </span>
              {isEditingPhone ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="उदा. 9822012345"
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-amber-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none w-36 shadow-inner"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingPhone(false)}
                    className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                  >
                    जतन करा
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {displayMobile || 'मोबाईल नोंदवलेला नाही'}
                  </span>
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="p-1 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-white rounded"
                    title="मोबाईल क्रमांक बदला किंवा टाका"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {formattedNum ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  ✓ पावती थेट या क्रमांकावर उघडेल
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400">
                  (मोबाईल टाकल्यास थेट नंबरचे चॅट उघडेल)
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Main HD Image WhatsApp Share Button */}
              <button
                disabled={isSharing}
                onClick={() => handleShareImageOrPdf('image')}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                title={displayMobile ? `${displayMobile} वर थेट WhatsApp पावती फोटो पाठवा` : 'WhatsApp वर पावती फोटो पाठवा'}
              >
                <MessageCircle className="w-5 h-5 fill-current text-white shrink-0" />
                <div className="text-left">
                  <span className="block leading-tight font-black">
                    {isSharing ? 'HD इमेज तयार होत आहे...' : 'WhatsApp वर थेट HD पावती फोटो पाठवा'}
                  </span>
                  <span className="text-[10px] text-emerald-100 block font-normal">
                    {displayMobile ? `लक्ष्य: ${displayMobile}` : 'चॅट उघडल्यावर Ctrl+V करा'}
                  </span>
                </div>
              </button>

              {/* Mobile Native Share Button (if supported) */}
              {canNativeShare && (
                <button
                  disabled={isSharing}
                  onClick={handleNativeShareDirect}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition"
                  title="मोबाईल शेअर मेनूद्वारे पावती फोटो थेट शेअर करा"
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span>मोबाईल ॲपद्वारे फोटो शेअर</span>
                </button>
              )}
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
                <span>{isCopiedImage ? 'कॉपी झाली!' : 'इमेज कॉपी (Ctrl+V)'}</span>
              </button>

              {/* Download Image PNG */}
              <button
                disabled={isExportingImage}
                onClick={handleDownloadImage}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                <FileImage className="w-4 h-4" />
                <span>{isExportingImage ? '...' : 'PNG डाऊनलोड'}</span>
              </button>

              {/* Download PDF */}
              <button
                disabled={isExportingPdf}
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-800 hover:bg-red-900 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>{isExportingPdf ? '...' : 'PDF'}</span>
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

          <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium pt-1 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-1">
            <span>💡 <strong>कसे पाठवायचे:</strong> बटण दाबल्यास HD पावती फोटो आपोआप कॉपी होतो व WhatsApp चॅट उघडते. चॅटमध्ये फक्त <strong>Ctrl + V</strong> (किंवा Paste) दाबा.</span>
          </div>
        </div>

        {/* Desktop Helper Banner when WhatsApp Web is launched */}
        {showDesktopGuide && (
          <div className="p-4 rounded-2xl bg-emerald-950/95 border-2 border-emerald-500 text-white space-y-2.5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-emerald-300 text-sm">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <span>📸 HD पावती फोटो क्लिपबोर्डवर कॉपी झाला आहे! (HD Image Ready)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDesktopGuide(false)}
                className="text-xs text-emerald-300 hover:text-white px-2 py-0.5 rounded bg-emerald-900/80 border border-emerald-700 cursor-pointer"
              >
                ✕ बंद करा
              </button>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              {displayMobile ? (
                <span><strong>{displayMobile}</strong> यांचे WhatsApp चॅट उघडले आहे. </span>
              ) : null}
              WhatsApp उघडल्यावर चॅट इनपुट बॉक्सवर फक्त <kbd className="px-2 py-0.5 bg-slate-900 border border-emerald-500/60 rounded font-mono font-bold text-amber-300">Ctrl + V</kbd> (किंवा Right Click करून Paste) दाबा आणि <strong>Send</strong> करा — तुमची HD पावती थेट <strong>रंगीत फोटो (Photo)</strong> म्हणून सेंड होईल!
            </p>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={handleCopyImage}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>पुन्हा फोटो कॉपी करा</span>
              </button>
              <button
                type="button"
                onClick={handleDirectWhatsAppMsg}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp पुन्हा उघडा</span>
              </button>
            </div>
          </div>
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
