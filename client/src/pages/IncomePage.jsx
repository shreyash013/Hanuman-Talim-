import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { downloadCsvReport } from '../utils/exportCsv';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ReceiptModal } from '../components/receipt/ReceiptModal';
import { useMandal } from '../context/MandalContext';
import { openWhatsAppReceipt } from '../utils/whatsappHelper';
import {
  HandCoins,
  PlusCircle,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Calendar,
  FileText,
  CreditCard,
  User,
  Smartphone,
  MessageCircle,
  QrCode
} from 'lucide-react';
import phonepeQrImg from '../assets/phonepe_qr.jpg';

export function IncomePage() {
  const { t, lang } = useLanguage();
  const { isAdmin } = useAuth();
  const { showToast } = useNotification();
  const { mandal } = useMandal();

  const [incomeList, setIncomeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, totalAmount: 0 });

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [autoShareReceipt, setAutoShareReceipt] = useState(false);

  // Form State
  const [donorName, setDonorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [incomeCategory, setIncomeCategory] = useState('donation');
  const [incomePaymentMethod, setIncomePaymentMethod] = useState('cash');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchIncome = async () => {
    try {
      setLoading(true);
      const res = await api.get('/income', {
        page,
        limit: 15,
        search,
        category,
        payment_method: paymentMethod
      });
      if (res.success) {
        setIncomeList(res.data || []);
        setPagination(res.pagination || { total: 0, totalPages: 1, totalAmount: 0 });
      }
    } catch (err) {
      console.error('fetchIncome error:', err);
      showToast('जमा यादी लोड करताना त्रुटी.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncome();
  }, [page, search, category, paymentMethod]);

  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!donorName.trim() || !amount || Number(amount) <= 0) {
      showToast('कृपया नाव आणि वैध रक्कम भरा.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('donor_name', donorName.trim());
      formData.append('mobile', mobile.trim());
      formData.append('address', address.trim());
      formData.append('amount', amount);
      formData.append('category', incomeCategory);
      formData.append('payment_method', incomePaymentMethod);
      formData.append('purpose', purpose.trim() || 'गणेशोत्सव सहकार्य');
      formData.append('notes', notes.trim());
      if (attachment) {
        formData.append('attachment', attachment);
      }

      const res = await api.post('/income', formData);
      if (res.success) {
        showToast('जमा रक्कम यशस्वीरित्या नोंदवली! 🕉️', 'success');
        setShowAddModal(false);
        // Reset form
        setDonorName('');
        setMobile('');
        setAddress('');
        setAmount('');
        setPurpose('');
        setNotes('');
        setAttachment(null);
        fetchIncome();
        if (res.data?.receipt) {
          setSelectedReceipt(res.data.receipt);
          if (mobile && mobile.trim()) {
            setAutoShareReceipt(true);
          } else {
            setAutoShareReceipt(false);
          }
        }
      }
    } catch (err) {
      console.error('handleAddIncome error:', err);
      showToast(err.message || 'नोंदवताना त्रुटी.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('आपणास खात्री आहे की हा जमा व्यवहार हटवायचा आहे?')) return;
    try {
      const res = await api.delete(`/income/${id}`);
      if (res.success) {
        showToast('व्यवहार हटवला.', 'success');
        fetchIncome();
      }
    } catch (err) {
      showToast('हटवताना त्रुटी निर्माण झाली.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-marathi tracking-tight flex items-center gap-2">
            <HandCoins className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            {t('nav.income', 'जमा रक्कम (Income Records)')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            एकूण नोंदवलेली जमा रक्कम: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(pagination.totalAmount)}</span> ({pagination.total} व्यवहार)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                showToast('जमा CSV डाऊनलोड होत आहे...', 'info');
                await downloadCsvReport('income');
                showToast('जमा CSV यशस्वीरित्या डाऊनलोड झाला!', 'success');
              } catch (err) {
                showToast(err.message || 'डाऊनलोड करताना त्रुटी.', 'error');
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>CSV एक्सेल</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs sm:text-sm shadow-festive hover:from-orange-500 hover:to-amber-500 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ जमा रक्कम नोंदवा</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="नाव, मोबाईल, पावती क्र. शोधा..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="">सर्व प्रकार (All Categories)</option>
            <option value="vargani">वर्गणी (Vargani)</option>
            <option value="donation">देणगी (Donation)</option>
            <option value="sponsorship">प्रायोजकत्व (Sponsorship)</option>
            <option value="decoration_contribution">सजावट सहकार्य</option>
            <option value="prasad_contribution">प्रसाद सेवा</option>
            <option value="advertisement">जाहिरात</option>
          </select>
        </div>

        {/* Payment Method Filter */}
        <div>
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="">सर्व पेमेंट पद्धती (All Methods)</option>
            <option value="cash">रोख (Cash)</option>
            <option value="upi">UPI</option>
            <option value="pending_udhar">🚩 उधार / जमा बाकी (Pending Credit)</option>
            <option value="bank_transfer">बँक ट्रान्सफर</option>
            <option value="cheque">धनादेश (Cheque)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">पावती क्र. / दिनांक</th>
                <th className="py-3 px-4">देणगीदार / व्यक्ती</th>
                <th className="py-3 px-4">प्रकार</th>
                <th className="py-3 px-4">पेमेंट पद्धत</th>
                <th className="py-3 px-4 text-right">रक्कम (₹)</th>
                <th className="py-3 px-4">संकलक / कार्यकर्ता</th>
                <th className="py-3 px-4 text-center">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    लोड होत आहे...
                  </td>
                </tr>
              ) : incomeList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    कोणतेही जमा व्यवहार सापडले नाहीत.
                  </td>
                </tr>
              ) : (
                incomeList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-amber-800 dark:text-amber-400 block">
                        {row.receipt_number || row.transaction_id}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(row.created_at, lang)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{row.donor_name}</p>
                      <p className="text-[10px] text-slate-400">
                        {row.mobile ? `📞 ${row.mobile}` : ''} {row.address ? `• 📍 ${row.address}` : ''}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge value={row.category} />
                    </td>
                    <td className="py-3 px-4">
                      <Badge value={row.payment_method} type="payment" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        + {formatCurrency(row.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {row.collector_name || 'प्रतिनिधी'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {row.receipt_number && (
                          <>
                            <button
                              onClick={async () => {
                                setAutoShareReceipt(false);
                                try {
                                  const r = await api.get(`/receipts/number/${row.receipt_number}`);
                                  if (r.success && r.data?.receipt) {
                                    setSelectedReceipt(r.data.receipt);
                                  } else {
                                    setSelectedReceipt({
                                      receipt_number: row.receipt_number,
                                      donor_name: row.donor_name,
                                      mobile: row.mobile,
                                      address: row.address,
                                      amount: row.amount,
                                      created_at: row.created_at,
                                      purpose: row.purpose,
                                      payment_method: row.payment_method
                                    });
                                  }
                                } catch {
                                  setSelectedReceipt({
                                    receipt_number: row.receipt_number,
                                    donor_name: row.donor_name,
                                    mobile: row.mobile,
                                    address: row.address,
                                    amount: row.amount,
                                    created_at: row.created_at,
                                    purpose: row.purpose,
                                    payment_method: row.payment_method
                                  });
                                }
                              }}
                              className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                              title="पावती पहा"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                const receiptObj = {
                                  receipt_number: row.receipt_number,
                                  donor_name: row.donor_name,
                                  mobile: row.mobile,
                                  address: row.address,
                                  amount: row.amount,
                                  created_at: row.created_at,
                                  purpose: row.purpose,
                                  payment_method: row.payment_method
                                };
                                setSelectedReceipt(receiptObj);
                                setAutoShareReceipt(true);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                              title="WhatsApp वर HD पावती फोटो पाठवा"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="हटवा"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              पृष्ठ {pagination.page} / {pagination.totalPages} (एकूण {pagination.total} नोंदी)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-bold"
              >
                मागील
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-bold"
              >
                पुढील
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Income Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="+ नवीन जमा रक्कम नोंदवा"
        subtitle="देणगी, प्रायोजकत्व किंवा इतर जमा रकमेची पावती बनवा"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleAddIncome} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">व्यक्तीचे / संस्थेचे नाव *</label>
              <input
                type="text"
                required
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="उदा. मे. राजमाता ज्वेलर्स"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">मोबाईल क्रमांक</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="98230XXXXX"
                maxLength={10}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">जमा रक्कम (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-extrabold text-amber-700 dark:text-amber-400 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">जमा प्रकार (Category)</label>
              <select
                value={incomeCategory}
                onChange={(e) => setIncomeCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="donation">देणगी (Donation)</option>
                <option value="vargani">वर्गणी (Vargani)</option>
                <option value="sponsorship">प्रायोजकत्व (Sponsorship)</option>
                <option value="decoration_contribution">सजावट सहकार्य</option>
                <option value="prasad_contribution">प्रसाद सेवा</option>
                <option value="advertisement">जाहिरात (Advertisement)</option>
                <option value="other">इतर</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">पेमेंट पद्धत / स्टेटस</label>
              <select
                value={incomePaymentMethod}
                onChange={(e) => setIncomePaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="cash">💵 रोख (Cash)</option>
                <option value="upi">📲 UPI</option>
                <option value="pending_udhar">🚩 उधार / जमा बाकी (Pending Credit)</option>
                <option value="bank_transfer">🏛️ बँक ट्रान्सफर (NEFT/IMPS)</option>
                <option value="cheque">📝 धनादेश (Cheque)</option>
              </select>
            </div>

            {incomePaymentMethod === 'upi' && (
              <div className="sm:col-span-2 p-3.5 bg-slate-900 border-2 border-emerald-500/60 rounded-2xl text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <QrCode className="w-4 h-4" />
                  <span>PhonePe अधिकृत स्कॅनर (+91 9699572617)</span>
                </div>
                <div className="p-2 bg-white rounded-xl max-w-[170px] mx-auto overflow-hidden shadow-md">
                  <img
                    src={phonepeQrImg}
                    alt="PhonePe Payment QR"
                    className="w-full h-auto rounded-lg object-contain"
                  />
                </div>
                <p className="text-[11px] text-slate-300">
                  UPI ID: <strong className="text-amber-400 font-mono">9699572617@ibl</strong> • खाते: <strong className="text-white">SUMEDH SHAHAJI GAVADE</strong>
                </p>
              </div>
            )}

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">पत्ता</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="पत्ता किंवा पेठ..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">उद्देश / संकल्प</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="उदा. मुख्य स्वागत कमान प्रायोजकत्व / महाप्रसाद"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">पावती / धनादेश फोटो (पर्यायी)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setAttachment(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              रद्द करा
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'जतन होत आहे...' : 'जतन करा व पावती बनवा'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal with Auto HD Image Share */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => {
          setSelectedReceipt(null);
          setAutoShareReceipt(false);
        }}
        receipt={selectedReceipt}
        autoShare={autoShareReceipt}
      />
    </div>
  );
}

export default IncomePage;
