import React, { useState, useEffect } from 'react';
import { Award, Trophy, Target, TrendingUp, Users, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import api from '../services/api';

export function VolunteerManagementPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/volunteers/leaderboard');
      if (res.success && res.data) {
        setLeaderboard(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-slate-900 border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs mb-1">
              <Trophy className="w-4 h-4" />
              <span>कार्यकर्ते कामगिरी व लीडरबोर्ड (Gamification)</span>
            </div>
            <h1 className="text-2xl font-black text-white">कार्यकर्ता व्यवस्थापन (Volunteer Management) 🚩</h1>
            <p className="text-xs text-slate-300 mt-1">
              नियुक्त क्षेत्र, संकलन ध्येय vs यश, खर्च नोंदी, आणि गुणानुक्रमे क्रमवारी लीडरबोर्ड.
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Winners Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaderboard.slice(0, 3).map((v, idx) => (
          <div
            key={v.id || idx}
            className={`p-5 rounded-3xl border relative overflow-hidden flex flex-col justify-between ${
              idx === 0
                ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-500/50 shadow-xl'
                : idx === 1
                ? 'bg-slate-900 border-slate-700'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-black text-amber-400">#{idx + 1}</span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {v.badge}
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg">{v.name}</h3>
              <p className="text-xs text-slate-400">क्षेत्र: {v.area}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">संकलन:</span>
                <strong className="text-amber-400 font-extrabold">₹{Number(v.collected).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">लक्ष्य (Target):</span>
                <span className="text-slate-300">₹{Number(v.target).toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden mt-1">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(v.achievement, 100)}%` }}
                />
              </div>
              <div className="text-right text-[11px] font-bold text-amber-400">{v.achievement}% पूर्ण</div>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h3 className="font-bold text-white text-base mb-4 flex items-center space-x-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>सर्व कार्यकर्ते क्रमवारी यादी (Leaderboard)</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">रँक</th>
                <th className="pb-3">कार्यकर्त्याचे नाव</th>
                <th className="pb-3">नियुक्त क्षेत्र (Area)</th>
                <th className="pb-3 text-right">ध्येय (Target)</th>
                <th className="pb-3 text-right">जमा रक्कम</th>
                <th className="pb-3 text-right">यश (%)</th>
                <th className="pb-3 text-center">बैज (Badge)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leaderboard.map((v, i) => (
                <tr key={v.id || i} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 font-bold text-amber-400">#{i + 1}</td>
                  <td className="py-3.5 font-bold text-white">{v.name}</td>
                  <td className="py-3.5 text-slate-300">{v.area}</td>
                  <td className="py-3.5 text-right text-slate-400">₹{Number(v.target).toLocaleString('en-IN')}</td>
                  <td className="py-3.5 text-right font-bold text-emerald-400">₹{Number(v.collected).toLocaleString('en-IN')}</td>
                  <td className="py-3.5 text-right font-extrabold text-amber-400">{v.achievement}%</td>
                  <td className="py-3.5 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {v.badge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default VolunteerManagementPage;
