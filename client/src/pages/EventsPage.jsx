import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import {
  CalendarDays,
  PlusCircle,
  Clock,
  MapPin,
  User,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function EventsPage() {
  const { t, lang } = useLanguage();
  const { isAdmin, isSecretary } = useAuth();
  const { showToast } = useNotification();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [titleMr, setTitleMr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [eventDate, setEventDate] = useState('2026-09-15');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('12:00 PM');
  const [location, setLocation] = useState('मुख्य मंडप');
  const [description, setDescription] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [budget, setBudget] = useState(0);
  const [actualExpense, setActualExpense] = useState(0);
  const [status, setStatus] = useState('upcoming');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultMandalEvents = [
    { id: 1, title_mr: 'श्री गणपती बाप्पा आगमन व प्राणप्रतिष्ठापना', title_en: 'Ganesh Idol Arrival & Sthapana', event_date: '2026-09-14', start_time: '09:00 AM', end_time: '01:00 PM', location: 'नदीवेस तालीम परिसर, शिरोळ', description: 'ढोल ताशा गजर व वेदमंत्रोच्चारात श्री हनुमान तालीम श्रींचे आगमन व प्राणप्रतिष्ठा', organizer_name: 'सुमेध गावडे (अध्यक्ष)', budget: 25000, status: 'upcoming' },
    { id: 2, title_mr: 'दैनिक महाआरती (सकाळ व संध्याकाळ)', title_en: 'Daily Maha Aarti', event_date: '2026-09-15', start_time: '08:00 AM', end_time: '08:30 PM', location: 'मुख्य मंडप, शिरोळ', description: 'सकाळी ८:०० आणि रात्री ८:३० वाजता सर्व ग्रामस्थ व भक्तांच्या हस्ते महाआरती', organizer_name: 'शिवराज गावडे (सचिव)', budget: 10000, status: 'upcoming' },
    { id: 3, title_mr: 'भव्य महाप्रसाद वाटप व दहीहंडी सराव', title_en: 'Grand Mahaprasad & Dahihandi Practice', event_date: '2026-09-20', start_time: '12:00 PM', end_time: '06:00 PM', location: 'तालीम चौक, शिरोळ', description: 'सर्व भाविकांसाठी महाप्रसाद वाटप आणि नामांकित गोविंदा पथक सराव', organizer_name: 'श्रेयस गावडे (खजिनदार)', budget: 50000, status: 'upcoming' },
    { id: 4, title_mr: 'अनंत चतुर्दशी भव्य विसर्जन मिरवणूक', title_en: 'Grand Visarjan Procession', event_date: '2026-09-25', start_time: '04:00 PM', end_time: '11:59 PM', location: 'नदीवेस चौक ते कृष्णा नदी घाट', description: 'पारंपरिक झांज पथक, ढोल-ताशा गजर व फुलांच्या रथातून श्रींचे विसर्जन', organizer_name: 'अथर्व गावडे (अभि)', budget: 60000, status: 'upcoming' }
  ];

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events');
      if (res.success && res.data && res.data.length > 0) {
        setEvents(res.data);
      } else {
        setEvents(defaultMandalEvents);
      }
    } catch (err) {
      console.error('fetchEvents error:', err);
      setEvents(defaultMandalEvents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setTitleMr('');
    setTitleEn('');
    setEventDate('2026-09-15');
    setStartTime('09:00 AM');
    setEndTime('12:00 PM');
    setLocation('मुख्य मंडप');
    setDescription('');
    setOrganizerName('');
    setBudget(10000);
    setActualExpense(0);
    setStatus('upcoming');
    setShowModal(true);
  };

  const handleOpenEdit = (ev) => {
    setEditingId(ev.id);
    setTitleMr(ev.title_mr);
    setTitleEn(ev.title_en);
    setEventDate(ev.event_date);
    setStartTime(ev.start_time);
    setEndTime(ev.end_time || '');
    setLocation(ev.location || '');
    setDescription(ev.description || '');
    setOrganizerName(ev.organizer_name || '');
    setBudget(ev.budget || 0);
    setActualExpense(ev.actual_expense || 0);
    setStatus(ev.status || 'upcoming');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titleMr.trim() || !eventDate || !startTime.trim()) {
      showToast('कृपया कार्यक्रमाचे नाव, तारीख आणि वेळ भरा.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title_mr: titleMr.trim(),
        title_en: titleEn.trim(),
        event_date: eventDate,
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        location: location.trim(),
        description: description.trim(),
        organizer_name: organizerName.trim(),
        budget: Number(budget),
        actual_expense: Number(actualExpense),
        status
      };

      let res;
      if (editingId) {
        res = await api.put(`/events/${editingId}`, payload);
      } else {
        res = await api.post('/events', payload);
      }

      if (res.success) {
        showToast(res.message || 'कार्यक्रम जतन झाला!', 'success');
        setShowModal(false);
        fetchEvents();
      }
    } catch (err) {
      showToast(err.message || 'जतन करताना त्रुटी.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('आपणास खात्री आहे की हा कार्यक्रम हटवायचा आहे?')) return;
    try {
      const res = await api.delete(`/events/${id}`);
      if (res.success) {
        showToast('कार्यक्रम हटवला.', 'success');
        fetchEvents();
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
            <CalendarDays className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            {t('nav.events', 'उत्सव कार्यक्रम वेळापत्रक (Festival Events)')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            गणेशोत्सवातील पूजा, महाआरती, महाप्रसाद, सांस्कृतिक व विसर्जन कार्यक्रम
          </p>
        </div>

        {(isAdmin || isSecretary) && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs sm:text-sm shadow-festive hover:from-orange-500 hover:to-amber-500 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ नवीन कार्यक्रम जोडा</span>
          </button>
        )}
      </div>

      {/* Events Timeline / List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">लोड होत आहे...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 relative overflow-hidden"
            >
              {/* Top Banner */}
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 font-extrabold text-xs">
                      {formatDate(ev.event_date, lang)}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {ev.start_time} {ev.end_time ? `- ${ev.end_time}` : ''}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white font-marathi mt-1">
                    {lang === 'en' ? ev.title_en : ev.title_mr}
                  </h3>
                </div>

                <Badge value={ev.status} />
              </div>

              {/* Description & Location */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {ev.description && <p className="leading-relaxed">{ev.description}</p>}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    {ev.location || 'मुख्य मंडप'}
                  </span>

                  {ev.organizer_name && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      प्रमुख: <span className="font-bold text-slate-800 dark:text-slate-200">{ev.organizer_name}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Budget Badge */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">नियोजित बजेट: <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(ev.budget)}</span></span>
                {(isAdmin || isSecretary) && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(ev)}
                      className="p-1 rounded text-slate-400 hover:text-amber-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Event Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'कार्यक्रम माहिती बदला' : '+ नवीन कार्यक्रम जोडा'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">कार्यक्रमाचे नाव (मराठी) *</label>
              <input
                type="text"
                required
                value={titleMr}
                onChange={(e) => setTitleMr(e.target.value)}
                placeholder="उदा. भव्य महाप्रसाद वाटप / महाआरती"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">दिनांक (Date) *</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">सुरुवात वेळ *</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="उदा. 09:00 AM / रात्री ०८:३०"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">स्थान / परिसर</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="उदा. मुख्य मंडप, कसबा पेठ"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">वर्णन / रूपरेषा</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="कार्यक्रमाविषयी अधिक माहिती..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">आयोजक / प्रमुख कार्यकर्ता</label>
              <input
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="उदा. विकास शिंदे"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">अपेक्षित बजेट (₹)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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

export default EventsPage;
