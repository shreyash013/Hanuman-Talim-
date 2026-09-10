import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { Lock, Smartphone, ArrowRight, Eye, EyeOff, ShieldCheck, KeyRound, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export function LoginPage() {
  const { login } = useAuth();
  const { lang, setLang } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginTab, setLoginTab] = useState('password'); // 'password' or 'otp'

  // Password Login State
  const [identifier, setIdentifier] = useState(location.state?.registeredMobile || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP Login State
  const [mobileOtp, setMobileOtp] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sentOtpDisplay, setSentOtpDisplay] = useState('');
  const [countdown, setCountdown] = useState(60);

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    let timer;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      showToast('कृपया मोबाईल / ईमेल आणि पासवर्ड टाका.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const res = await login(identifier.trim(), password.trim());
    setIsSubmitting(false);

    if (res.success) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      showToast('लॉगिन यशस्वी! गणपती बाप्पा मोरया! 🙏', 'success');
      navigate(from, { replace: true });
    } else {
      showToast(res.message || 'लॉगिन अयशस्वी झाले. कृपया तपशील तपासा.', 'error');
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!mobileOtp.trim() || mobileOtp.trim().length < 10) {
      showToast('कृपया वैध १० अंकी मोबाईल क्रमांक टाका.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/send-otp', { mobile: mobileOtp.trim() });
      if (res.success) {
        setOtpSent(true);
        setSentOtpDisplay(res.otp || '');
        setCountdown(60);
        showToast(res.message || `मोबाईल क्रमांक ${mobileOtp} वर नवीन OTP पाठवला आहे!`, 'success');
      } else {
        showToast(res.message || 'OTP पाठवताना त्रुटी.', 'error');
      }
    } catch {
      showToast('नेटवर्क त्रुटी निर्माण झाली.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      showToast('कृपया ६ अंकी OTP कोड भरा.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/verify-otp', { mobile: mobileOtp.trim(), otp: otpCode.trim() });
      if (res.success) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        showToast('OTP पडताळणी यशस्वी! लॉगिन झाले.', 'success');
        navigate(from, { replace: true });
        window.location.reload();
      } else {
        showToast(res.message || 'अवैध OTP! पुन्हा प्रयत्न करा.', 'error');
      }
    } catch {
      showToast('पडताळणी दरम्यान त्रुटी आली.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Language Bar Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs z-20">
        <button onClick={() => setLang('mr')} className={`px-2.5 py-1 rounded-lg font-bold ${lang === 'mr' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'}`}>मराठी</button>
        <button onClick={() => setLang('en')} className={`px-2.5 py-1 rounded-lg font-bold ${lang === 'en' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'}`}>English</button>
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Mandal Title Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mx-auto shadow-lg text-2xl font-black text-slate-950">
            🚩
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">{mandal?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ'}</h1>
          <p className="text-xs text-amber-400 font-medium">{mandal?.tagline_mr || 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱'}</p>
        </div>

        {/* Login Mode Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setLoginTab('password')}
            className={`py-2 rounded-xl transition ${loginTab === 'password' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            🔒 पासवर्ड लॉगिन
          </button>
          <button
            onClick={() => setLoginTab('otp')}
            className={`py-2 rounded-xl transition ${loginTab === 'otp' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            📲 मोबाईल OTP लॉगिन
          </button>
        </div>

        {/* TAB 1: Password Login Form */}
        {loginTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">मोबाईल क्रमांक किंवा ईमेल</label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="उदा. 9822012345"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">पासवर्ड</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition transform active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'लॉगिन होत आहे...' : 'लॉगिन करा (Login)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 2: Mobile OTP Login Form */}
        {loginTab === 'otp' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">१० अंकी मोबाईल क्रमांक</label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={mobileOtp}
                      onChange={(e) => setMobileOtp(e.target.value)}
                      placeholder="उदा. 9822012345"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isSubmitting ? 'OTP पाठवत आहे...' : 'नवीन OTP मागवा (Send Fresh OTP)'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {sentOtpDisplay && (
                  <div className="bg-amber-500/10 border border-amber-500/40 p-3 rounded-2xl text-xs text-amber-300 text-center">
                    <span>📲 SMS simulated code for demo: <strong className="text-white text-base tracking-widest">{sentOtpDisplay}</strong></span>
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400 block mb-1">६ अंकी OTP कोड भरा</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="६ अंकी OTP कोड"
                    className="w-full bg-slate-950 border border-amber-500/60 rounded-xl px-4 py-3 text-center text-lg font-black text-amber-400 tracking-widest focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>वेळ: {countdown} सेकंद</span>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={countdown > 0}
                    className="text-amber-400 font-bold hover:underline disabled:opacity-40"
                  >
                    पुन्हा OTP पाठवा
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'पडताळणी होत आहे...' : 'OTP पडताळा व लॉगिन करा'}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Devotee / Public Links */}
        <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800 space-y-2">
          <p>
            नवीन सभासद?{' '}
            <Link to="/register" className="text-amber-400 font-bold hover:underline">
              येथे नोंदणी करा
            </Link>
          </p>
          <a href="/public" className="block text-slate-400 hover:text-white font-medium">
            ← भाविक सार्वजनिक पोर्टलकडे जा (/public)
          </a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
