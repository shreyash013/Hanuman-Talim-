import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-slate-900 text-white font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-amber-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">काहीतरी त्रुटी निर्माण झाली</h2>
              <p className="text-xs text-slate-300 mt-1">
                स्क्रीन लोड करताना अनपेक्षित तांत्रिक अडचण आली आहे. कृपया खालील बटण दाबून पुन्हा प्रयत्न करा.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-[11px] font-mono text-rose-300 text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>पुन्हा लोड करा (Reload)</span>
              </button>
              <button
                onClick={this.handleHome}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
              >
                <Home className="w-4 h-4" />
                <span>मुख्यपृष्ठ (Dashboard)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
