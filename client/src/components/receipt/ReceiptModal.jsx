import React, { useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { DigitalReceipt } from './DigitalReceipt';
import { useLanguage } from '../../context/LanguageContext';
import { useMandal } from '../../context/MandalContext';
import { useNotification } from '../../context/NotificationContext';
import { openWhatsAppReceipt, buildWhatsAppReceiptMessage } from '../../utils/whatsappHelper';
import { MessageCircle, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export function ReceiptModal({ isOpen, onClose, receipt }) {
  const { t } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const receiptRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);

  if (!receipt) return null;

  const activeReceipt = receipt;

  // Direct WhatsApp Action: shares receipt image + simple thank you message
  const handleWhatsApp = async () => {
    try {
      setIsSharing(true);
      const simpleMsg = buildWhatsAppReceiptMessage(activeReceipt, mandal);
      const receiptElement = receiptRef.current;

      if (!receiptElement) {
        openWhatsAppReceipt(activeReceipt, mandal, true);
        return;
      }

      // Render high quality receipt image
      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fffcf7',
        logging: false
      });

      // 1. Mobile Native Web Share API (sends receipt image directly to WhatsApp!)
      if (typeof navigator !== 'undefined' && navigator.canShare) {
        try {
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
          if (blob) {
            const fileName = `receipt_${activeReceipt.receipt_number || 'vargani'}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: `पावती क्र. ${activeReceipt.receipt_number}`,
                text: simpleMsg
              });
              showToast('पावती इमेज व मेसेज WhatsApp वर पाठवले!', 'success');
              return;
            }
          }
        } catch (shareErr) {
          // If user aborted or canceled share dialog, return gracefully
          if (shareErr.name === 'AbortError') return;
          console.warn('Native share error, using direct open fallback:', shareErr);
        }
      }

      // 2. Desktop Fallback: Copy image to clipboard, download, and open WhatsApp Web
      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
        if (blob && typeof navigator !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        }
      } catch (clipErr) {
        console.warn('Clipboard write note:', clipErr);
      }

      // Trigger automatic receipt image download
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `पावती_${activeReceipt.receipt_number || 'vargani'}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (dlErr) {
        console.warn('Download note:', dlErr);
      }

      // Open WhatsApp chat directly with the recipient
      openWhatsAppReceipt(activeReceipt, mandal, true);
      showToast('WhatsApp उघडत आहे! (इमेज पाठवण्यासाठी चॅटमध्ये Ctrl+V दाबा)', 'success');
    } catch (err) {
      console.error('WhatsApp send error:', err);
      openWhatsAppReceipt(activeReceipt, mandal, true);
    } finally {
      setIsSharing(false);
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
        {/* Streamlined Action Bar: WhatsApp and Close */}
        <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-slate-800/80 border border-amber-500/30 flex items-center justify-between gap-2.5">
          {/* WhatsApp Button */}
          <button
            type="button"
            onClick={handleWhatsApp}
            disabled={isSharing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer disabled:opacity-50"
            title="WhatsApp वर पावती व इमेज पाठवा"
          >
            {isSharing ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white shrink-0" />
            ) : (
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-white shrink-0" />
            )}
            <span>{isSharing ? 'इमेज तयार होत आहे...' : 'WhatsApp'}</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            <span>पूर्ण झाले ✓</span>
          </button>
        </div>

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
