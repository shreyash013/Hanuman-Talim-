import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const MandalContext = createContext();

export function MandalProvider({ children }) {
  const [mandal, setMandal] = useState({
    name_mr: 'श्री हनुमान तालीम मंडळ शिरोळ',
    name_en: 'Shri Hanuman Talim Mandal Shirol',
    tagline_mr: 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा राजा ॥ 🔱',
    tagline_en: 'Est. 1964 🚩 | 62nd Year 🔱 | Nadives Cha Raja 🔱',
    address_mr: 'नदीवेस, शिरोळ, जि. कोल्हापूर | ४१६१०३',
    address_en: 'Nadives, Shirol, Dist. Kolhapur | 416103',
    contact_phone: '+91 9356997428',
    contact_email: 'shreyashgavade7@gmail.com',
    registration_no: 'MAH/KOLHAPUR/1964',
    festival_year: 2026,
    arrival_date: '2026-09-14T09:00:00',
    visarjan_date: '2026-09-25T18:00:00',
    upi_id: 'sarveshkharoshe8-2@okaxis',
    upi_name: 'Shri Hanuman Talim Mandal Shirol',
    receipt_prefix: 'HANUMAN-2026-',
    receipt_language: 'mr',
    currency_symbol: '₹',
    logo_url: '/images/mandal_logo.jpg'
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchMandalSettings = async () => {
    try {
      setIsLoading(true);
      // Try authenticated settings, fallback to public info
      let res;
      try {
        res = await api.get('/settings');
      } catch {
        res = await api.get('/public/donation-info');
      }

      if (res.success && (res.data || res.data?.mandal)) {
        const settingsData = res.data?.mandal || res.data;
        setMandal(settingsData);
      }
    } catch (err) {
      console.warn('Could not fetch latest mandal settings, using defaults:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMandalSettings();
  }, []);

  return (
    <MandalContext.Provider value={{ mandal, setMandal, refreshMandal: fetchMandalSettings, isLoading }}>
      {children}
    </MandalContext.Provider>
  );
}

export function useMandal() {
  const context = useContext(MandalContext);
  if (!context) {
    throw new Error('useMandal must be used within a MandalProvider');
  }
  return context;
}
