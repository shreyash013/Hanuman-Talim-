import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import {
  Settings,
  Save,
  Building,
  Calendar,
  CreditCard,
  Receipt,
  Phone,
  Mail,
  MapPin,
  Sparkles
} from 'lucide-react';

export function SettingsPage() {
  const { t } = useLanguage();
  const { mandal, refreshMandal } = useMandal();
  const { showToast } = useNotification();

  const [formData, setFormData] = useState({
    name_mr: '',
    name_en: '',
    tagline_mr: '',
    address_mr: '',
    contact_phone: '',
    contact_email: '',
    registration_no: '',
    festival_year: 2026,
    arrival_date: '',
    visarjan_date: '',
    upi_id: '',
    upi_name: '',
    receipt_prefix: 'HANUMAN-2026-',
    initial_opening_balance: 0
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mandal) {
      setFormData({
        name_mr: mandal.name_mr || '',
        name_en: mandal.name_en || '',
        tagline_mr: mandal.tagline_mr || '',
        address_mr: mandal.address_mr || '',
        contact_phone: mandal.contact_phone || '',
        contact_email: mandal.contact_email || '',
        registration_no: mandal.registration_no || '',
        festival_year: mandal.festival_year || 2026,
        arrival_date: mandal.arrival_date ? mandal.arrival_date.split('T')[0] : '',
        visarjan_date: mandal.visarjan_date ? mandal.visarjan_date.split('T')[0] : '',
        upi_id: mandal.upi_id || '',
        upi_name: mandal.upi_name || '',
        receipt_prefix: mandal.receipt_prefix || 'HANUMAN-2026-',
        initial_opening_balance: mandal.initial_opening_balance !== undefined ? mandal.initial_opening_balance : 0
      });
    }
  }, [mandal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await api.put('/settings', formData);
      if (res.success) {
        showToast('मंडळ सेटिंग्ज यशस्वीरित्या जतन केल्या! 🕉️', 'success');
        refreshMandal();
      }
    } catch (err) {
      console.error('Save settings error:', err);
      showToast(err.message || 'सेटिंग्ज जतन करताना त्रुटी.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white font-marathi tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          {t('nav.settings', 'मंडळ माहिती व सेटिंग्ज (Mandal Settings)')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          मंडळाचे नाव, पत्ता, उत्सव वर्ष, अधिकृत UPI आयडी आणि पावती क्रमांक सेटिंग्ज
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Profile */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building className="w-4 h-4 text-amber-600" />
            <span>मंडळाची ओळख व नोंदणी तपशील</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">मंडळाचे नाव (मराठी) *</label>
              <input
                type="text"
                required
                name="name_mr"
                value={formData.name_mr}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mandal Name (English)</label>
              <input
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">नोंदणी क्रमांक (Registration No)</label>
              <input
                type="text"
                name="registration_no"
                value={formData.registration_no}
                onChange={handleChange}
                placeholder="MAH/PUNE/1992/F-1024"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">टॅगलाईन / ब्रीदवाक्य</label>
              <input
                type="text"
                name="tagline_mr"
                value={formData.tagline_mr}
                onChange={handleChange}
                placeholder="उदा. स्थापना: १९९२"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">मंडळाचा अधिकृत पत्ता</label>
              <input
                type="text"
                name="address_mr"
                value={formData.address_mr}
                onChange={handleChange}
                placeholder="नदीवेस, शिरोळ, जि. कोल्हापूर | ४१६१०३"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">संपर्क मोबाईल / फोन</label>
              <input
                type="text"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                placeholder="+91 98220 12345"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ईमेल आयडी</label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                placeholder="contact@ganeshmandal.org"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Festival Dates & Receipt Prefix */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>उत्सव वर्ष व पावती क्रमांक संरचना</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">उत्सव वर्ष *</label>
              <input
                type="number"
                required
                name="festival_year"
                value={formData.festival_year}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">गणपती आगमन दिनांक (Installation)</label>
              <input
                type="date"
                name="arrival_date"
                value={formData.arrival_date}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">विसर्जन दिनांक (Visarjan)</label>
              <input
                type="date"
                name="visarjan_date"
                value={formData.visarjan_date}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">पावती क्रमांक प्रीफिक्स (Receipt Prefix)</label>
              <input
                type="text"
                name="receipt_prefix"
                value={formData.receipt_prefix}
                onChange={handleChange}
                placeholder="HANUMAN-2026-"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[10px] text-slate-400">या प्रीफिक्सनुसार पावती क्रमांक तयार होतील, उदा. HANUMAN-2026-000001</p>
            </div>

            <div className="space-y-1 sm:col-span-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                उत्सवाची आरंभीची रोख शिल्लक / Initial Opening Cash Balance (₹)
              </label>
              <input
                type="number"
                name="initial_opening_balance"
                value={formData.initial_opening_balance}
                onChange={handleChange}
                placeholder="उदा. 10000 किंवा 0"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
              <p className="text-[10px] text-slate-400">मागील वर्षाची शिल्लक किंवा उत्सवाच्या पहिल्या दिवशी हातातील सुरुवातीची रोख रक्कम.</p>
            </div>
          </div>
        </div>

        {/* Section 3: Digital Payment & UPI */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>अधिकृत UPI व बँक खात्याची माहिती</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">UPI आयडी (VPA) *</label>
              <input
                type="text"
                name="upi_id"
                value={formData.upi_id}
                onChange={handleChange}
                placeholder="ganeshmandal@sbi"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">बँक खाते नाव (Account Holder Name)</label>
              <input
                type="text"
                name="upi_name"
                value={formData.upi_name}
                onChange={handleChange}
                placeholder="Shri Hanuman Talim Mandal Shirol"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm shadow-festive transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'जतन होत आहे...' : 'सेटिंग्ज सेव्ह करा (Save Settings)'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;
