import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { downloadCsvReport } from '../utils/exportCsv';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  Users,
  Award,
  ChevronDown,
  FileText,
  Filter,
  CheckCircle,
  Shield,
  Sparkles
} from 'lucide-react';

export function ReportsPage() {
  const { t } = useLanguage();
  const { mandal } = useMandal();
  const { showToast } = useNotification();

  const [activeReportTab, setActiveReportTab] = useState('financial'); // 'financial', 'collection', 'expense', 'audit'
  const [range, setRange] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/financial', { range });
      if (res.success && res.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('fetchReport error:', err);
      showToast('अहवाल तयार करताना अडचण आली.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [range]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = async (type = 'balance_sheet') => {
    try {
      showToast('CSV / Excel अहवाल तयार होत आहे...', 'info');
      await downloadCsvReport(type);
      showToast('अहवाल यशस्वीरित्या डाऊनलोड झाला! 📊', 'success');
    } catch (err) {
      showToast('अहवाल डाऊनलोड करताना त्रुटी.', 'error');
    }
  };

  const totals = reportData?.totals || {};
  const incomeCategories = reportData?.incomeByCategory || [];
  const expenseCategories = reportData?.expenseByCategory || [];
  const collectorList = reportData?.collectionsByCollector || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-400" />
            <span>प्रगत अहवाल केंद्र (Advanced Reports Center) 📊</span>
          </h2>
          <p className="text-xs text-slate-400">
            आर्थिक पत्रक, जमा वर्गणी, खर्च पृथक्करण, व ऑडीट रिपोर्ट्स.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExportCsv('balance_sheet')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs shadow transition"
          >
            <Download className="w-4 h-4" />
            <span>Excel / CSV डाऊनलोड</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>प्रिंट / PDF</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 no-print overflow-x-auto">
        <button
          onClick={() => setActiveReportTab('financial')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeReportTab === 'financial' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          💰 आर्थिक ताळेबंद (Financial Report)
        </button>
        <button
          onClick={() => setActiveReportTab('collection')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeReportTab === 'collection' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          📈 संकलन व कार्यकर्ते (Collection Report)
        </button>
        <button
          onClick={() => setActiveReportTab('expense')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeReportTab === 'expense' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          💸 खर्च पृथक्करण (Expense Report)
        </button>
      </div>

      {/* Printable Report Content */}
      <div className="printable-area bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Printable Letterhead Header */}
        <div className="text-center border-b-2 border-amber-500 pb-4 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-amber-400 font-marathi">
            {mandal?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ'}
          </h1>
          <p className="text-xs font-bold text-slate-300">
            {mandal?.tagline_mr || 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा राजा ॥'}
          </p>
          <p className="text-[11px] text-slate-400">
            {mandal?.address_mr} • रजि. क्र.: {mandal?.registration_no}
          </p>
          <div className="inline-block mt-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-extrabold text-amber-300">
            गणेशोत्सव {mandal?.festival_year || 2026} - अधिकृत आर्थिक ताळेबंद अहवाल
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">एकूण जमा (Total Income)</span>
            <span className="text-2xl font-black text-emerald-400">₹{(totals.totalIncome || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">एकूण खर्च (Total Expenses)</span>
            <span className="text-2xl font-black text-rose-400">₹{(totals.totalApprovedExpense || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">निव्वळ शिल्लक (Net Balance)</span>
            <span className="text-2xl font-black text-amber-400">₹{(totals.netBalance || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Collection & Collector Breakdown */}
        {activeReportTab === 'collection' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base">कार्यकर्ते संकलन तपशील:</h3>
            <table className="w-full text-left text-xs border border-slate-800">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3">कार्यकर्त्याचे नाव</th>
                  <th className="p-3 text-center">पावत्या संख्या</th>
                  <th className="p-3 text-right">जमा रक्कम</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {collectorList.map((c, idx) => (
                  <tr key={idx}>
                    <td className="p-3 text-white font-bold">{c.collector_name}</td>
                    <td className="p-3 text-center text-slate-400">{c.count}</td>
                    <td className="p-3 text-right text-emerald-400 font-extrabold">₹{c.total_amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Expense Category Breakdown */}
        {activeReportTab === 'expense' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base">खर्च वर्गवारी तपशील:</h3>
            <table className="w-full text-left text-xs border border-slate-800">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3">खर्च विभाग (Category)</th>
                  <th className="p-3 text-center">संख्या</th>
                  <th className="p-3 text-right">एकूण रक्कम</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {expenseCategories.map((e, idx) => (
                  <tr key={idx}>
                    <td className="p-3 text-white font-bold capitalize">{e.category}</td>
                    <td className="p-3 text-center text-slate-400">{e.count}</td>
                    <td className="p-3 text-right text-rose-400 font-extrabold">₹{e.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Financial Statement default view */}
        {activeReportTab === 'financial' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="flex justify-between border-b border-slate-800 pb-2 font-bold text-white">
              <span>वर्गणी जमा प्रकार:</span>
              <span>रक्कम:</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>• रोख जमा वर्गणी (Cash Income):</span>
              <span className="text-white font-bold">₹{(totals.cashIncome || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>• डिजिटल / UPI जमा (Digital Income):</span>
              <span className="text-white font-bold">₹{(totals.digitalIncome || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {/* Signature Box */}
        <div className="pt-8 border-t border-slate-800 flex justify-between text-center text-xs text-slate-400">
          <div>
            <span className="block border-t border-slate-600 w-32 mx-auto pt-1 font-bold text-white">सुमेध गवडे</span>
            <span>अध्यक्ष</span>
          </div>
          <div>
            <span className="block border-t border-slate-600 w-32 mx-auto pt-1 font-bold text-white">श्रेयश गवडे</span>
            <span>खजिनदार</span>
          </div>
          <div>
            <span className="block border-t border-slate-600 w-32 mx-auto pt-1 font-bold text-white">शिवराज गवडे</span>
            <span>सचिव</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
