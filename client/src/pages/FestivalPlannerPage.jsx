import React, { useState } from 'react';
import { Calendar, Clock, Utensils, Music, Users, Shield, Award, CheckCircle2, Sparkles, Plus, AlertCircle } from 'lucide-react';

export function FestivalPlannerPage() {
  const [activeTab, setActiveTab] = useState('aarti');

  const aartiList = [
    { time: '०८:०० AM', title: 'सकाळची महाआरती 🌅', priest: 'वे. शा. सं. जोशी गुरुजी', status: 'पूर्ण (Completed)', coordinator: 'सुमेध गवडे (अध्यक्ष)' },
    { time: '१२:३० PM', title: 'दुपारची नैवेद्य आरती 🌞', priest: 'श्री सुमेध गवडे', status: 'आगामी (Upcoming)', coordinator: 'श्रेयश गवडे (खजिनदार)' },
    { time: '०७:३० PM', title: 'संध्याकाळची महाआरती 🔱', timeNote: 'मुख्य आरती', priest: 'प्रमुख पाहुणे व ग्रामस्थ', status: 'आगामी (Upcoming)', coordinator: 'शिवराज गवडे (सचिव)' },
    { time: '१०:०० PM', title: 'रात्रीची शेजारती 🌙', priest: 'कार्यकर्ते व भाविक', status: 'आगामी (Upcoming)', coordinator: 'अथर्व गवडे' }
  ];

  const culturalEvents = [
    { date: '१५ सप्टेंबर', title: 'बालकलाकार चित्रकला स्पर्धा 🎨', venue: 'तालीम हॉल', time: '१०:०० AM', status: 'नियोजित' },
    { date: '१७ सप्टेंबर', title: 'महिला होम मिनिस्टर व रांगोळी 🏆', venue: 'प्रांगण', time: '०५:०० PM', status: 'नियोजित' },
    { date: '२० सप्टेंबर', title: 'भव्य महाप्रसाद व भजन संध्या 🍲', venue: 'मुख्य मैदान', time: '१२:०० PM', status: 'तयारी सुरू' },
    { date: '२३ सप्टेंबर', title: 'सत्यनारायण पूजा व सांस्कृतिक संध्या 🎼', venue: 'मंडप', time: '०६:०० PM', status: 'नियोजित' }
  ];

  const duties = [
    { role: 'मंडप व रोषणाई सुरक्षा', lead: 'अथर्व गवडे', volunteers: 6, timing: '२४ तास रोटेशन' },
    { role: 'आरती व दर्शन रांग व्यवस्था', lead: 'राहुल गवडे', volunteers: 8, timing: 'संध्याकाळी ६ ते १०' },
    { role: 'महाप्रसाद वाढप व भोजन व्यवस्था', lead: 'श्रेयश गवडे', volunteers: 15, timing: 'दुपारी ११ ते ४' },
    { role: 'ढोल-ताशा व आगमन/विसर्जन पथक', lead: 'अमित गवडे', volunteers: 25, timing: 'मार्ग नियंत्रण' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-slate-900 border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4" />
              <span>श्री गणेशोत्सव २०२६ नियोजन केंद्र</span>
            </div>
            <h1 className="text-2xl font-black text-white">उत्सव व्यवस्थापन (Real Festival Planner) 🎉</h1>
            <p className="text-xs text-slate-300 mt-1">
              आरती वेळापत्रक, सांस्कृतिक कार्यक्रम, महाप्रसाद, ढोल-ताशा पथक व कार्यकर्ता ड्युटी रोस्टर.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs transition shadow-lg flex items-center space-x-1.5">
              <Plus className="w-4 h-4" />
              <span>नवीन उपक्रम जोडा</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('aarti')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'aarti'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>आरती वेळापत्रक (Aarti Schedule)</span>
        </button>
        <button
          onClick={() => setActiveTab('cultural')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'cultural'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>सांस्कृतिक कार्यक्रम (Events)</span>
        </button>
        <button
          onClick={() => setActiveTab('mahaprasad')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'mahaprasad'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>महाप्रसाद नियोजन (Mahaprasad)</span>
        </button>
        <button
          onClick={() => setActiveTab('duties')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'duties'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>कार्यकर्ता ड्युटी (Volunteer Duties)</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'aarti' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aartiList.map((a, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 transition">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-xs">
                    {a.time}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{a.title}</h3>
                    <p className="text-xs text-slate-400">पुरोहित: {a.priest}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  a.status.includes('Completed') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                }`}>
                  {a.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>समन्वयक: <strong className="text-slate-200">{a.coordinator}</strong></span>
                <button className="text-amber-400 font-bold hover:underline">स्थान निश्चित करा</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'cultural' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {culturalEvents.map((e, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400">{e.date} • {e.time}</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium">{e.status}</span>
              </div>
              <h3 className="font-bold text-white text-base mb-1">{e.title}</h3>
              <p className="text-xs text-slate-400">स्थळ: {e.venue}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'mahaprasad' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center space-x-3 text-amber-400 font-bold text-lg border-b border-slate-800 pb-3">
            <Utensils className="w-6 h-6" />
            <h2>भव्य महाप्रसाद उपक्रम नियोजन (2026)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block mb-1">अंदाजित भाविक संख्या</span>
              <span className="text-xl font-bold text-amber-400">३,५००+ भाविक</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block mb-1">वेळ व दिनांक</span>
              <span className="text-sm font-bold text-white">२० सप्टें २०२६ (१२:०० PM ते ०४:०० PM)</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block mb-1">स्थान</span>
              <span className="text-sm font-bold text-white">श्री हनुमान तालीम प्रांगण, शिरोळ</span>
            </div>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <h4 className="font-bold text-white text-xs mb-2">मेन्यू (Menu List):</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              पुरी, सुकी बटाटा भाजी, मसाले भात, कट्टा आमटी, गरम जिलबी, बूंदी प्रसादम आणि थंड पाणी व्यवस्था.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'duties' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {duties.map((d, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-sm">{d.role}</h3>
                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full">
                  {d.volunteers} कार्यकर्ते
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                <p>प्रमुख: <strong className="text-slate-200">{d.lead}</strong></p>
                <p>वेळ: <span className="text-slate-300">{d.timing}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FestivalPlannerPage;
