import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { useNotification } from '../context/NotificationContext';
import { User, Lock, Smartphone, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, UserPlus, CheckCircle2, Send, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export function RegisterPage() {
  const { register } = useAuth();
  const { lang, setLang } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcomeEmailModal, setShowWelcomeEmailModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('कृपया आपले पूर्ण नाव भरा.', 'warning');
      return;
    }

    const cleanMobile = mobile.trim();
    if (!cleanMobile || cleanMobile.length < 10) {
      showToast('कृपया वैध १० अंकी मोबाईल क्रमांक टाका.', 'warning');
      return;
    }

    if (!password || password.length < 6) {
      showToast('पासवर्ड किमान ६ अक्षरांचा असावा.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('दोन्ही पासवर्ड जुळत नाहीत. कृपया तपासा.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await register(name.trim(), cleanMobile, email.trim(), password);
      if (res.success) {
        setRegisteredUser({ name: name.trim(), mobile: cleanMobile, email: email.trim() || 'शिरोळ सभासद' });
        setShowWelcomeEmailModal(true);
        try { confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } }); } catch {}
        showToast('नोंदणी यशस्वी! स्वागत ईमेल पाठवला आहे 📧', 'success');
      } else {
        showToast(res.message || 'नोंदणी अयशस्वी झाली.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'नोंदणी करताना त्रुटी निर्माण झाली.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToLogin = () => {
    navigate('/login', {
      replace: true,
      state: { registeredMobile: registeredUser?.mobile }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Language Bar Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs z-20">
        <button onClick={() => setLang('mr')} className={`px-2.5 py-1 rounded-lg font-bold ${lang === 'mr' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'}`}>मराठी</button>
        <button onClick={() => setLang('en')} className={`px-2.5 py-1 rounded-lg font-bold ${lang === 'en' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'}`}>English</button>
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mx-auto shadow-lg text-2xl font-black text-slate-950">
            🚩
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">नवीन नोंदणी (Registration)</h1>
          <p className="text-xs text-amber-400 font-medium">{mandal?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">पूर्ण नाव *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="उदा. सुमेध पाटील"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">मोबाईल क्रमांक *</label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="१० अंकी मोबाईल नंबर"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">ईमेल पत्ता (पर्यायी)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="उदा. sumedh@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">पासवर्ड *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="किमान ६ अक्षरे"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">पासवर्ड पुन्हा टाका *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="तोच पासवर्ड पुन्हा टाका"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl shadow-lg transition flex items-center justify-center space-x-2 mt-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isSubmitting ? 'नोंदणी होत आहे...' : 'नोंदणी करा व स्वागत ईमेल मिळवा'}</span>
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
          आधीच खाते आहे?{' '}
          <Link to="/login" className="text-amber-400 font-bold hover:underline">
            लॉगिन करा
          </Link>
        </div>
      </div>

      {/* Welcome Email Confirmation Modal */}
      {showWelcomeEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <Mail className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-white text-lg">स्वागत ईमेल पाठवला आहे! 📧</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                नमस्कार <strong>{registeredUser?.name}</strong>! श्री हनुमान तालीम मंडळ शिरोळ मध्ये आपले सहर्ष स्वागत आहे.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-1.5">
              <p className="font-bold text-amber-400 mb-1">📧 Welcome Email Confirmation Card:</p>
              <p className="text-slate-300">• प्राधान्य नाव: <strong>{registeredUser?.name}</strong></p>
              <p className="text-slate-300">• मोबाईल: <strong>{registeredUser?.mobile}</strong></p>
              <p className="text-slate-300">• रोल: <strong>मंंडळ सभासद (Member)</strong></p>
              <p className="text-slate-300">• स्टेटस: <strong>सक्रिय (Active)</strong></p>
            </div>

            <button
              onClick={handleProceedToLogin}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition"
            >
              लॉगिन स्क्रीनकडे जा (Proceed to Login)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterPage;
