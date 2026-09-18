import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Image as ImageIcon,
  AlertTriangle,
  FileText
} from 'lucide-react';

export function ApprovalsPage() {
  const { t, lang } = useLanguage();
  const { isAdmin, isTreasurer } = useAuth();
  const { showToast } = useNotification();

  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reject Modal State
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewBillUrl, setPreviewBillUrl] = useState(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses', { status: 'pending', limit: 50 });
      if (res.success) {
        setPendingExpenses(res.data || []);
      }
    } catch (err) {
      console.error('fetchPending error:', err);
      showToast('प्रलंबित यादी लोड करताना त्रुटी.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id, expId) => {
    try {
      setIsProcessing(true);
      const res = await api.put(`/expenses/${id}/approve`, {});
      if (res.success) {
        showToast(`खर्च ${expId || id} यशस्वीरित्या मंजूर केला!`, 'success');
        setPendingExpenses(prev => prev.filter(e => String(e.id) !== String(id) && String(e.expense_id) !== String(expId)));
        fetchPending();
      } else {
        showToast(res.message || 'मंजूर करताना अडचण आली.', 'error');
      }
    } catch (err) {
      console.error('handleApprove error:', err);
      showToast(err?.message || 'मंजूर करताना अडचण आली.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectId) return;
    try {
      setIsProcessing(true);
      const res = await api.put(`/expenses/${rejectId}/reject`, { reason: rejectReason });
      if (res.success) {
        showToast('खर्च नामंजूर करण्यात आला.', 'info');
        setPendingExpenses(prev => prev.filter(e => String(e.id) !== String(rejectId) && String(e.expense_id) !== String(rejectId)));
        setRejectId(null);
        setRejectReason('');
        fetchPending();
      } else {
        showToast(res.message || 'नामंजूर करताना अडचण आली.', 'error');
      }
    } catch (err) {
      console.error('handleRejectSubmit error:', err);
      showToast(err?.message || 'नामंजूर करताना अडचण आली.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white font-marathi tracking-tight flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          {t('nav.approvals', 'खर्च मंजुरी कक्ष (Expense Approvals)')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          कार्यकर्त्यांनी सादर केलेले प्रलंबित खर्च तपासा व त्वरित मंजुरी किंवा नामंजुरी द्या
        </p>
      </div>

      {/* Pending Items Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">माहिती लोड होत आहे...</div>
      ) : pendingExpenses.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            सध्या कोणताही खर्च मंजुरीसाठी प्रलंबित नाही!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            सर्व खर्च तपासले गेले आहेत. नवीन खर्च नोंदवला की येथे दिसेल.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingExpenses.map((exp) => (
            <div
              key={exp.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-400/50 shadow-sm space-y-4 relative overflow-hidden"
            >
              {/* Top Meta */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 block">
                    {exp.expense_id}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {exp.description}
                  </h3>
                </div>

                <Badge value={exp.category} />
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div>
                  <span className="text-slate-400">रक्कम: </span>
                  <span className="font-black text-rose-600 dark:text-rose-400 text-sm block">
                    {formatCurrency(exp.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">कोणाला दिले: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {exp.paid_to}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">नोंदणी करणारे: </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                    {exp.requested_by_name || 'स्वयंसेवक'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">दिनांक: </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                    {formatDate(exp.created_at, lang)}
                  </span>
                </div>
              </div>

              {exp.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-900">
                  <span className="font-bold">टीप:</span> {exp.notes}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  {exp.bill_attachment_url ? (
                    <button
                      onClick={() => setPreviewBillUrl(exp.bill_attachment_url)}
                      className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      {exp.bill_attachment_url.toLowerCase().includes('.pdf') || exp.bill_attachment_url.startsWith('data:application/pdf') ? (
                        <>
                          <FileText className="w-3.5 h-3.5 text-rose-500" />
                          <span>PDF बिल पहा</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>फोटो बिल पहा</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">बिल जोडलेले नाही</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={isProcessing}
                    onClick={() => {
                      setRejectId(exp.id);
                      setRejectReason('');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>नामंजूर करा</span>
                  </button>

                  <button
                    disabled={isProcessing}
                    onClick={() => handleApprove(exp.id, exp.expense_id)}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>मंजूर करा</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Reason Modal */}
      <Modal
        isOpen={!!rejectId}
        onClose={() => setRejectId(null)}
        title="खर्च नामंजूर करण्याचे कारण"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              कारण किंवा शेरा (Reason for rejection):
            </label>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="उदा. बिल अस्पष्ट आहे / जास्तीचा खर्च नोंदवला..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejectId(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600"
            >
              रद्द करा
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
            >
              नामंजूर करा
            </button>
          </div>
        </form>
      </Modal>

      {/* Bill Attachment Preview Modal (Supports Image & PDF) */}
      <Modal
        isOpen={!!previewBillUrl}
        onClose={() => setPreviewBillUrl(null)}
        title="बिल / पावती पाहणी (Bill Attachment)"
        maxWidth="max-w-2xl"
      >
        {previewBillUrl && (previewBillUrl.toLowerCase().includes('.pdf') || previewBillUrl.startsWith('data:application/pdf')) ? (
          <div className="space-y-3 text-center p-2">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <FileText className="w-10 h-10 text-rose-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">PDF जोडणी (PDF Document)</h4>
              <div className="flex justify-center space-x-2 mt-2">
                <a
                  href={previewBillUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition"
                >
                  नवीन टॅबमध्ये उघडा
                </a>
                <a
                  href={previewBillUrl}
                  download="bill_attachment.pdf"
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition"
                >
                  डाउनलोड PDF
                </a>
              </div>
            </div>
            <iframe
              src={previewBillUrl}
              title="PDF Preview"
              className="w-full h-[50vh] rounded-xl border border-slate-200 dark:border-slate-800"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center p-2">
            <img
              src={previewBillUrl}
              alt="Bill Preview"
              className="max-h-[65vh] w-auto object-contain rounded-xl shadow-md border border-slate-200 dark:border-slate-800"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ApprovalsPage;
