import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { calculateCountdown } from '../../utils/dateUtils';
import { Sparkles, Calendar } from 'lucide-react';

export function CountdownTimer({ targetDate, compact = false }) {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(() => calculateCountdown(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateCountdown(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isPassed) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-festive">
        <Sparkles className="w-6 h-6 text-amber-200 animate-pulse" />
        <div>
          <h4 className="font-bold text-lg">🌺 गणपती बाप्पा मोरया! 🌺</h4>
          <p className="text-xs text-amber-100 font-medium">गणेशोत्सव सुरू आहे! सर्वांना हार्दिक शुभेच्छा!</p>
        </div>
      </div>
    );
  }

  const timeBlocks = [
    { label: t('dashboard.days', 'दिवस'), value: timeLeft.days },
    { label: t('dashboard.hours', 'तास'), value: timeLeft.hours },
    { label: t('dashboard.minutes', 'मिनिटे'), value: timeLeft.minutes },
    { label: t('dashboard.seconds', 'सेकंद'), value: timeLeft.seconds }
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {timeBlocks.map((b, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center bg-black/30 backdrop-blur-md rounded-2xl p-2.5 min-w-[60px] sm:min-w-[70px] border border-white/20 shadow-inner"
          >
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono drop-shadow">
              {String(b.value).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-amber-200/90 mt-0.5">
              {b.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-amber-600 to-orange-700 text-white p-5 shadow-festive border border-amber-400/30">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-3 text-center md:text-left">
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md text-amber-200 shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-amber-200 flex items-center justify-center md:justify-start gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {t('dashboard.festivalCountdown', 'गणपती बाप्पाच्या आगमनाला')}
            </span>
            <h4 className="text-lg font-black tracking-tight text-white mt-0.5">
              श्री गणेशोत्सव २०२६
            </h4>
          </div>
        </div>

        {/* Counter Units */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full md:w-auto">
          {timeBlocks.map((b, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center bg-black/20 backdrop-blur-md rounded-xl p-2.5 min-w-[62px] sm:min-w-[72px] border border-white/10 shadow-inner"
            >
              <span className="text-xl sm:text-2xl font-black tracking-tight text-amber-100 font-mono">
                {String(b.value).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-amber-200/90 mt-0.5">
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-orange-400/20 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
}

export default CountdownTimer;
