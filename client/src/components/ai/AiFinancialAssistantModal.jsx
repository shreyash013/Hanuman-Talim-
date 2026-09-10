import React, { useState } from 'react';
import { Bot, Send, Sparkles, X, FileText, Loader2, Award, TrendingUp, DollarSign } from 'lucide-react';
import api from '../../services/api';

export function AiFinancialAssistantModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'नमस्कार! 🚩 मी श्री हनुमान तालीम मंडळाचा AI आर्थिक सहाय्यक आहे. आपण मला जमा वर्गणी, खर्च, देणगीदार किंवा बजेटबद्दल कोणतेही प्रश्न विचारू शकता!'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const sampleQueries = [
    'या आठवड्यात किती वर्गणी जमा झाली?',
    'सर्वाधिक वर्गणी देणारे top 10 देणगीदार कोण आहेत?',
    'रोषणाई आणि मंडप खर्चाची काय स्थिती आहे?',
    'कोणत्या भागातून (पिक/Area) सर्वाधिक जमा झाली?'
  ];

  const handleSend = async (textToSend) => {
    const q = textToSend || query;
    if (!q.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/ai/ask', { query: q });
      if (res.success && res.data) {
        setMessages((prev) => [...prev, { sender: 'ai', text: res.data.answer }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'ai', text: 'उत्तर मिळवताना अडचण आली.' }]);
      }
    } catch {
      setMessages((prev) => [...prev, { sender: 'ai', text: 'नेटवर्क कनेक्ट त्रुटी.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/report');
      if (res.success && res.data) {
        const r = res.data;
        const reportText = `📋 **${r.title}**\n\n💰 **आर्थिक सारांश:**\n• एकूण जमा: ₹${r.summary.totalIncome.toLocaleString('en-IN')}\n• एकूण खर्च: ₹${r.summary.totalExpense.toLocaleString('en-IN')}\n• निव्वळ शिल्लक: ₹${r.summary.netBalance.toLocaleString('en-IN')}\n• एकूण देणगीदार: ${r.summary.totalDonorsCount}\n\n💡 **महत्त्वाचे AI निष्कर्ष:**\n${r.insights.join('\n')}\n\n📌 **शिफारसी:**\n${r.recommendations.join('\n')}`;
        setMessages((prev) => [...prev, { sender: 'ai', text: reportText }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col h-[600px] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">AI Financial Assistant</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  LIVE DB AI
                </span>
              </div>
              <p className="text-xs text-slate-400">श्री गणेशोत्सव आर्थिक विश्लेषण व अहवाल केंद्र</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleGenerateReport}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition shadow-md"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>उत्सव अहवाल</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/90 p-3 rounded-2xl flex items-center space-x-2 text-xs text-amber-400 border border-slate-700/60">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>डाटाबेसमधून विश्लेषण करत आहे...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Sample Questions */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center space-x-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-amber-400 shrink-0">सुचवलेले प्रश्न:</span>
          {sampleQueries.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sq)}
              className="text-[11px] whitespace-nowrap px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700 transition"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="येथे आपला प्रश्न टाईप करा (उदा. खर्चाचा तपशील)..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!query.trim()}
            className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl font-bold transition shadow-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AiFinancialAssistantModal;
