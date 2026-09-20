import React, { useRef } from 'react';
import { Modal } from '../common/Modal';
import { DigitalReceipt } from './DigitalReceipt';
import { useLanguage } from '../../context/LanguageContext';
import { useMandal } from '../../context/MandalContext';
import { useNotification } from '../../context/NotificationContext';
import { openWhatsAppReceipt } from '../../utils/whatsappHelper';
import { MessageCircle } from 'lucide-react';

export function ReceiptModal({ isOpen, onClose, receipt }) {
  const { t } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const receiptRef = useRef(null);

  if (!receipt) return null;

  const activeReceipt = receipt;

  // Direct 1-Click WhatsApp Action: opens WhatsApp immediately with pre-filled number & receipt text
  const handleWhatsApp = () => {
    try {
      openWhatsAppReceipt(activeReceipt, mandal, true);
      showToast('WhatsApp उघडत आहे...', 'info');
    } catch (err) {
      console.error('WhatsApp open error:', err);
      showToast('WhatsApp उघडताना अडचण आली.', 'error');
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
            title="WhatsApp वर पावती पाठवा"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-white shrink-0" />
            <span>WhatsApp</span>
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
