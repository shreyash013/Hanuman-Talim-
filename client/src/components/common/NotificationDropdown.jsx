import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Clock, ShieldAlert, Sparkles, X } from 'lucide-react';
import api from '../../services/api';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: '🔔 खर्चाची विनंती प्रलंबित',
      message: '₹१२,५०० रोषणाई खर्च राहुल गवडे यांनी मंजुरीसाठी पाठवला आहे.',
      time: '१० मिनिटांपूर्वी',
      type: 'warning',
      unread: true
    },
    {
      id: 2,
      title: '🎯 दैनिक वर्गणी लक्ष्य ८०%',
      message: 'तुमच्या टीमने आजचे ₹५,००,००० पैकी ₹४,०२,५०० जमा केले आहे!',
      time: '३० मिनिटांपूर्वी',
      type: 'success',
      unread: true
    },
    {
      id: 3,
      title: '⚠️ रोख रकमेतील तफावत',
      message: 'आजच्या ताळेबंदात ₹१,५०० चा फरक आढळून आला आहे. पडताळणी करा.',
      time: '१ तासापूर्वी',
      type: 'error',
      unread: false
    },
    {
      id: 4,
      title: '🗓️ महाप्रसाद स्मरणपत्र',
      message: 'उद्या दुपारी १२:०० वाजता महाप्रसाद उपक्रम सुरू होत आहे.',
      time: '२ तासांपूर्वी',
      type: 'info',
      unread: false
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition border border-slate-700/60"
        title="सूचना केंद्र (Notifications)"
      >
        <Bell className="w-5 h-5 text-amber-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-slate-100 text-sm">सूचना केंद्र (Notifications)</h3>
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-amber-400 hover:underline font-medium"
                >
                  सर्व वाचले
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 flex items-start space-x-3 transition hover:bg-slate-800/40 ${
                  n.unread ? 'bg-amber-500/5' : ''
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  {n.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {n.type === 'error' && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                  {n.type === 'info' && <Clock className="w-4 h-4 text-sky-400" />}
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-bold text-slate-200">{n.title}</p>
                  <p className="text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-500 mt-1.5 block">{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
