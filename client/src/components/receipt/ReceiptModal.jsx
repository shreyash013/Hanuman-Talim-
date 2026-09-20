import React, { useRef, useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { DigitalReceipt } from './DigitalReceipt';
import { useLanguage } from '../../context/LanguageContext';
import { useMandal } from '../../context/MandalContext';
import { useNotification } from '../../context/NotificationContext';
import { openWhatsAppReceipt, buildWhatsAppReceiptMessage } from '../../utils/whatsappHelper';
import { MessageCircle } from 'lucide-react';
import html2canvas from 'html2canvas';

export function ReceiptModal({ isOpen, onClose, receipt }) {
  const { t } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const receiptRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);

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

  if (!receipt) return null;

  const activeReceipt = receipt;

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
        await navigator.share({
          files: [fileToShare],
          title: `पावती क्र. ${activeReceipt.receipt_number || ''}`,
          text: simpleMsg
        });
        showToast('पावती फोटो WhatsApp वर यशस्वीरित्या पाठवला!', 'success');
        return;
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
        {/* Streamlined Action Bar: Only WhatsApp and Close */}
        <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-slate-800/80 border border-amber-500/30 flex items-center justify-between gap-2.5">
          {/* WhatsApp Button */}
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
            title="WhatsApp वर पावती फोटो पाठवा"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-white shrink-0" />
            <span>WhatsApp (पावती फोटो)</span>
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
