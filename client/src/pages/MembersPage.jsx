import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { downloadCsvReport } from '../utils/exportCsv';
import { Modal } from '../components/common/Modal';
import {
  UserCheck,
  PlusCircle,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Edit2,
  Trash2,
  ShieldCheck,
  User,
  Download
} from 'lucide-react';

export function MembersPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useNotification();

  // Strictly allow ONLY the 2 Administrators: President Sumedh Gavade & Treasurer Shreyash Gavade
  const is2Administrators = Boolean(
    user &&
    !user.name?.toLowerCase().includes('sarthak') &&
    user.id !== 2 &&
    (
      user.role === 'admin' ||
      user.role === 'treasurer' ||
      (user.email && (user.email.includes('president') || user.email.includes('sumedh') || user.email.includes('shreyashgavade') || user.email.includes('treasurer'))) ||
      (user.mobile && (user.mobile.includes('9822099999') || user.mobile.includes('9356997428') || user.mobile.includes('9822012345'))) ||
      (user.name && (user.name.includes('सुमेध') || user.name.includes('श्रेयश') || user.name.includes('Sumedh') || user.name.includes('Shreyash')))
    )
  );

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [roleTitleMr, setRoleTitleMr] = useState('कार्यकर्ता');
  const [roleTitleEn, setRoleTitleEn] = useState('Volunteer');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [joiningYear, setJoiningYear] = useState(2026);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultCommitteeMembers = [
    { id: 1, name: 'सुमेध गावडे', role_title_mr: 'अध्यक्ष', role_title_en: 'President', mobile: '9822011111', address: 'नदीवेस, शिरोळ', joining_year: 2018, blood_group: 'O+' },
    { id: 2, name: 'श्रेयस गावडे', role_title_mr: 'खजिनदार', role_title_en: 'Treasurer', mobile: '9822022222', address: 'नदीवेस, शिरोळ', joining_year: 2019, blood_group: 'B+' },
    { id: 3, name: 'शिवराज गावडे', role_title_mr: 'सचिव', role_title_en: 'Secretary', mobile: '9822033333', address: 'नदीवेस, शिरोळ', joining_year: 2020, blood_group: 'A+' },
    { id: 4, name: 'अथर्व गावडे (अभि)', role_title_mr: 'कार्यकर्ता प्रमुख', role_title_en: 'Volunteer Head', mobile: '9822044444', address: 'नदीवेस, शिरोळ', joining_year: 2021, blood_group: 'AB+' }
  ];

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/members');
      if (res.success && res.data && res.data.length > 0) {
        setMembers(res.data);
      } else {
        setMembers(defaultCommitteeMembers);
      }
    } catch (err) {
      console.error('fetchMembers error:', err);
      setMembers(defaultCommitteeMembers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setRoleTitleMr('कार्यकर्ता');
    setRoleTitleEn('Member');
    setMobile('');
    setAddress('');
    setJoiningYear(2026);
    setEmergencyContact('');
    setBloodGroup('O+');
    setShowModal(true);
  };

  const handleOpenEdit = (m) => {
    setEditingId(m.id);
    setName(m.name);
    setRoleTitleMr(m.role_title_mr);
    setRoleTitleEn(m.role_title_en);
    setMobile(m.mobile);
    setAddress(m.address || '');
    setJoiningYear(m.joining_year || 2020);
    setEmergencyContact(m.emergency_contact || '');
    setBloodGroup(m.blood_group || 'O+');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      showToast('कृपया नाव आणि मोबाईल क्रमांक भरा.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        role_title_mr: roleTitleMr.trim(),
        role_title_en: roleTitleEn.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        joining_year: Number(joiningYear),
        emergency_contact: emergencyContact.trim(),
        blood_group: bloodGroup.trim()
      };

      let res;
      if (editingId) {
        res = await api.put(`/members/${editingId}`, payload);
      } else {
        res = await api.post('/members', payload);
      }

      if (res.success) {
        showToast(res.message || 'सदस्य जतन झाला!', 'success');
        setShowModal(false);
        fetchMembers();
      }
    } catch (err) {
      showToast(err.message || 'जतन करताना त्रुटी.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('आपणास खात्री आहे की हा सदस्य हटवायचा आहे?')) return;
    try {
      const res = await api.delete(`/members/${id}`);
      if (res.success) {
        showToast('सदस्य हटवला.', 'success');
        fetchMembers();
      }
    } catch {
      showToast('हटवताना त्रुटी.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-marathi tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            {t('nav.members', 'मंडळ समिती व कार्यकर्ते (Committee Directory)')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            गणेशोत्सव कार्यकारिणी, पदाधिकारी व स्वयंसेवक सूची
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                showToast('सदस्य CSV डाऊनलोड होत आहे...', 'info');
                await downloadCsvReport('members');
                showToast('सदस्य CSV यशस्वीरित्या डाऊनलोड झाला!', 'success');
              } catch (err) {
                showToast(err.message || 'डाऊनलोड करताना त्रुटी.', 'error');
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>CSV एक्सेल</span>
          </button>

          {is2Administrators && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs sm:text-sm shadow-festive hover:from-orange-500 hover:to-amber-500 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ नवीन सदस्य जोडा</span>
            </button>
          )}
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">लोड होत आहे...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.map((m) => (
            <div
              key={m.id}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:shadow-festive transition-all duration-200 relative overflow-hidden group"
            >
              {/* Header Profile */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-black text-lg shadow-inner select-none flex-shrink-0">
                  {m.name.charAt(0)}
                </div>

                <div className="overflow-hidden">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {m.name}
                  </h3>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                    {lang === 'en' ? m.role_title_en : m.role_title_mr}
                  </span>
                </div>
              </div>

              {/* Meta Info */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  <a href={`tel:${m.mobile}`} className="font-mono font-bold hover:text-amber-600">
                    +91 {m.mobile}
                  </a>
                </div>

                {m.address && (
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span className="truncate">{m.address}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    मंडळात: {m.joining_year || 2020} पासून
                  </span>

                  {m.blood_group && (
                    <span className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                      <Heart className="w-3 h-3" /> {m.blood_group}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions strictly for the 2 Administrators only */}
              {is2Administrators && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="सदस्य माहिती बदला (फक्त २ प्रशासक)"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="सदस्य हटवा (फक्त २ प्रशासक)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'सदस्य माहिती बदला' : '+ नवीन सदस्य जोडा'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">पूर्ण नाव *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="उदा. राहुल बापू मोरे"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">पद (मराठी)</label>
              <input
                type="text"
                value={roleTitleMr}
                onChange={(e) => setRoleTitleMr(e.target.value)}
                placeholder="उदा. उपाध्यक्ष / कार्यकर्ता"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Role (English)</label>
              <input
                type="text"
                value={roleTitleEn}
                onChange={(e) => setRoleTitleEn(e.target.value)}
                placeholder="Vice President / Member"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">मोबाईल *</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="98220XXXXX"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">रक्तगट (Blood Group)</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">पत्ता</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="पेठ / सोसायटी..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600"
            >
              रद्द करा
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md"
            >
              {isSubmitting ? 'जतन होत आहे...' : 'जतन करा'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default MembersPage;
