import { numberToWordsMarathi, numberToWordsEnglish } from '../utils/marathiNumberToWords.js';

export const getActiveApiUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('shirol_custom_api_url');
    if (custom && custom.trim()) return custom.trim();
  }
  return 'https://hanuman-talim-api.onrender.com/api';
};

export const API_BASE_URL = getActiveApiUrl();

// ==========================================
// MANDAL CONSTANTS & LOCAL STORAGE ENGINE
// ==========================================
export const SHIROL_MANDAL_SETTINGS = {
  id: 1,
  name_mr: 'श्री हनुमान तालीम मंडळ शिरोळ',
  name_en: 'Shri Hanuman Talim Mandal Shirol',
  tagline_mr: 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा महाराजा ॥ 🔱',
  tagline_en: 'Est. 1964 🚩 | 62nd Year 🔱 | Nadives Cha Maharaja 🔱',
  address_mr: 'नदीवेस, शिरोळ, जि. कोल्हापूर | ४१६१०३',
  address_en: 'Nadives, Shirol, Dist. Kolhapur | 416103',
  contact_phone: '+91 9356997428',
  contact_email: 'shreyashgavade7@gmail.com',
  registration_no: 'MAH/KOLHAPUR/1964',
  festival_year: 2026,
  arrival_date: '2026-09-14T09:00:00+05:30',
  visarjan_date: '2026-09-25T18:00:00+05:30',
  upi_id: '9699572617@ibl',
  upi_name: 'SUMEDH SHAHAJI GAVADE',
  receipt_prefix: 'HANUMAN-2026-',
  receipt_language: 'mr',
  currency_symbol: '₹',
  logo_url: '/images/mandal_logo.jpg',
  initial_opening_balance: 0
};

export const DEFAULT_SHIROL_USERS = [
  { id: 101, name: 'सुमेध गवडे', email: 'sumedhgavade@gmail.com', mobile: '9822012345', role: 'admin', status: 'active', created_at: '2026-09-01T10:00:00Z' },
  { id: 102, name: 'श्रेयश गवडे', email: 'shreyashgavade7@gmail.com', mobile: '9356997428', role: 'treasurer', status: 'active', created_at: '2026-09-01T10:00:00Z' },
  { id: 103, name: 'शिवराज गवडे', email: 'shivrajgavade@gmail.com', mobile: '9822012347', role: 'secretary', status: 'active', created_at: '2026-09-01T10:00:00Z' },
  { id: 104, name: 'अथर्व गवडे (अभि)', email: 'atharvgavade@gmail.com', mobile: '9822012348', role: 'volunteer', status: 'active', created_at: '2026-09-01T10:00:00Z' }
];

export const DEFAULT_SHIROL_MEMBERS = [
  { id: 1, name: 'सुमेध गावडे', role_title_mr: 'अध्यक्ष', role_title_en: 'President', mobile: '9822012345', address: 'नदीवेस, शिरोळ', joining_year: 2018, blood_group: 'O+' },
  { id: 2, name: 'श्रेयस गावडे', role_title_mr: 'खजिनदार', role_title_en: 'Treasurer', mobile: '9356997428', address: 'नदीवेस, शिरोळ', joining_year: 2019, blood_group: 'B+' },
  { id: 3, name: 'शिवराज गावडे', role_title_mr: 'सचिव', role_title_en: 'Secretary', mobile: '9822012347', address: 'नदीवेस, शिरोळ', joining_year: 2020, blood_group: 'A+' },
  { id: 4, name: 'अथर्व गावडे (अभि)', role_title_mr: 'कार्यकर्ता प्रमुख', role_title_en: 'Volunteer Head', mobile: '9822012348', address: 'नदीवेस, शिरोळ', joining_year: 2021, blood_group: 'AB+' }
];

// Data recovery to ensure valid baseline mandal settings and structure
export function ensureDataRecovery() {
  if (typeof window === 'undefined') return;
  try {
    const rawSettings = localStorage.getItem('shirol_mandal_settings_custom');
    if (!rawSettings) {
      localStorage.setItem('shirol_mandal_settings_custom', JSON.stringify(SHIROL_MANDAL_SETTINGS));
    }
  } catch (err) {
    console.warn('ensureDataRecovery note:', err);
  }
}

// Run recovery on module evaluation
ensureDataRecovery();

// Auto-sync debounce timer
let syncDebounceTimer = null;
let isSyncingToServer = false;
let isSyncingFromServer = false;

// BroadcastChannel for cross-tab real-time sync (notifies other open tabs when data changes)
let _bc = null;
function getBroadcastChannel() {
  if (!_bc && typeof BroadcastChannel !== 'undefined') {
    try {
      _bc = new BroadcastChannel('shirol_mandal_sync');
      _bc.onmessage = () => {
        // Another tab changed data — fire update events so this tab refreshes
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('shirol_data_updated'));
        }
      };
    } catch {}
  }
  return _bc;
}
function broadcastDataChange() {
  try {
    const bc = getBroadcastChannel();
    if (bc) bc.postMessage({ type: 'data_updated', ts: Date.now() });
  } catch {}
}
// Initialize broadcast channel on load
if (typeof window !== 'undefined') getBroadcastChannel();

// Auto-acquire valid JWT token if missing or demo token
export async function ensureValidToken() {
  if (typeof window === 'undefined') return null;
  let token = localStorage.getItem('ganpati_mandal_token');
  if (token && !token.startsWith('demo-') && !token.startsWith('user-token-')) {
    return token;
  }
  try {
    const baseUrl = getActiveApiUrl();
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'president@mandal.org', password: 'admin123' })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('ganpati_mandal_token', data.token);
        if (data.user) {
          localStorage.setItem('ganpati_mandal_user', JSON.stringify(data.user));
        }
        return data.token;
      }
    }
  } catch (e) {
    console.warn('Auto-token renewal background note:', e.message);
  }
  return token;
}

// Helper: Immediately delete donor from local storage, remove associated transactions/receipts, and track tombstone
export function handleLocalDonorDeletion(endpoint, options = {}) {
  try {
    let deletedIds = [];
    let bodyData = {};
    try {
      bodyData = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
    } catch (e) {}

    if (endpoint.includes('/donors/bulk')) {
      deletedIds = (bodyData.ids || []).map(String);
    } else {
      const parts = endpoint.split('?')[0].split('/');
      const donorId = parts[parts.length - 1];
      if (donorId && donorId !== 'donors' && donorId !== 'bulk') {
        deletedIds = [String(donorId)];
      }
    }

    let donorsList = getLocalStore('donors', []);
    const incomeList = getLocalStore('income', []);

    // Collect target names and phones for deletion
    const deletedDonors = donorsList.filter(d => deletedIds.includes(String(d.id)));
    const targetNames = Array.from(new Set([
      ...deletedDonors.map(d => (d.name || '').trim().toLowerCase()),
      ...(bodyData.name ? [String(bodyData.name).trim().toLowerCase()] : []),
      ...(Array.isArray(bodyData.names) ? bodyData.names.map(n => String(n).trim().toLowerCase()) : [])
    ])).filter(Boolean);

    const targetPhones = Array.from(new Set([
      ...deletedDonors.map(d => (d.mobile || '').replace(/\D/g, '')),
      ...(bodyData.mobile ? [String(bodyData.mobile).replace(/\D/g, '')] : [])
    ])).filter(p => p.length >= 10);

    // 1. Remove from donorsList
    donorsList = donorsList.filter(d => {
      if (deletedIds.includes(String(d.id))) return false;
      const dName = (d.name || '').trim().toLowerCase();
      const dPhone = (d.mobile || '').replace(/\D/g, '');
      if (dName && targetNames.includes(dName)) {
        if (targetPhones.length === 0 || !dPhone || targetPhones.includes(dPhone)) {
          return false;
        }
      }
      return true;
    });
    localStorage.setItem('shirol_donors', JSON.stringify(donorsList));

    // 2. Remove matching transactions from incomeList
    const incomeToDelete = incomeList.filter(inc => {
      if (deletedIds.includes(String(inc.id)) || deletedIds.includes(String(inc.donor_id))) return true;
      const incName = (inc.donor_name || '').trim().toLowerCase();
      const incPhone = (inc.mobile || '').replace(/\D/g, '');
      if (incName && targetNames.includes(incName)) {
        if (targetPhones.length === 0 || !incPhone || targetPhones.includes(incPhone)) {
          return true;
        }
      }
      return false;
    });

    const deletedTxIds = incomeToDelete.map(i => String(i.id));
    const deletedReceiptNos = incomeToDelete.map(i => i.receipt_number).filter(Boolean);

    const remainingIncome = incomeList.filter(inc => !incomeToDelete.includes(inc));
    localStorage.setItem('shirol_income', JSON.stringify(remainingIncome));

    // 3. Remove matching receipts
    const receiptsList = getLocalStore('receipts', []);
    const remainingReceipts = receiptsList.filter(r => {
      if (deletedIds.includes(String(r.id)) || deletedIds.includes(String(r.donor_id))) return false;
      if (deletedTxIds.includes(String(r.transaction_id)) || deletedTxIds.includes(String(r.id))) return false;
      if (deletedReceiptNos.includes(r.receipt_number)) return false;
      const rName = (r.donor_name || '').trim().toLowerCase();
      const rPhone = (r.mobile || '').replace(/\D/g, '');
      if (rName && targetNames.includes(rName)) {
        if (targetPhones.length === 0 || !rPhone || targetPhones.includes(rPhone)) {
          return false;
        }
      }
      return true;
    });
    localStorage.setItem('shirol_receipts', JSON.stringify(remainingReceipts));

    // 4. Record in shirol_deleted_donors so auto-sync never brings them back
    const existingDeleted = getLocalStore('deleted_donors', []);
    const updatedDeleted = [...existingDeleted];

    deletedIds.forEach(id => {
      if (!updatedDeleted.some(d => String(d.id) === String(id))) {
        updatedDeleted.push({ id, deleted_at: new Date().toISOString() });
      }
    });
    targetNames.forEach(name => {
      if (!updatedDeleted.some(d => d.name && d.name.trim().toLowerCase() === name)) {
        updatedDeleted.push({ name, deleted_at: new Date().toISOString() });
      }
    });
    localStorage.setItem('shirol_deleted_donors', JSON.stringify(updatedDeleted));

    // 5. Dispatch live update events and trigger immediate cloud sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('shirol_data_updated'));
      window.dispatchEvent(new Event('storage'));
      setTimeout(() => autoSyncAllToServer(true), 100);
    }
  } catch (err) {
    console.warn('handleLocalDonorDeletion error:', err);
  }
}

// 100% Automatic Auto-Upload: Syncs all local data to live cloud server in background
export async function autoSyncAllToServer(force = false, retryCount = 0) {
  if (typeof window === 'undefined') return { success: false, reason: 'no-window' };
  if (isSyncingToServer && !force) return { success: false, reason: 'already-syncing' };

  const baseUrl = getActiveApiUrl();
  if (!baseUrl) return { success: false, reason: 'no-base-url' };

  const rawIncome = localStorage.getItem('shirol_income');
  const rawExpenses = localStorage.getItem('shirol_expenses');
  const rawDonors = localStorage.getItem('shirol_donors');
  const rawLoans = localStorage.getItem('shirol_loans');
  const rawReceipts = localStorage.getItem('shirol_receipts');
  const rawMembers = localStorage.getItem('shirol_members');
  const rawSettings = localStorage.getItem('shirol_mandal_settings_custom');
  const rawDeletedDonors = localStorage.getItem('shirol_deleted_donors');

  const income = rawIncome ? JSON.parse(rawIncome) : [];
  const expenses = rawExpenses ? JSON.parse(rawExpenses) : [];
  const donors = rawDonors ? JSON.parse(rawDonors) : [];
  const loans = rawLoans ? JSON.parse(rawLoans) : [];
  const receipts = rawReceipts ? JSON.parse(rawReceipts) : [];
  const members = rawMembers ? JSON.parse(rawMembers) : [];
  const settings = rawSettings ? JSON.parse(rawSettings) : null;
  const deleted_donors = rawDeletedDonors ? JSON.parse(rawDeletedDonors) : [];

  const totalLocalCount = income.length + expenses.length + donors.length + loans.length;
  if (totalLocalCount === 0 && deleted_donors.length === 0) return { success: true, count: 0 };

  isSyncingToServer = true;
  window.dispatchEvent(new CustomEvent('shirol_sync_status_changed', {
    detail: { status: 'syncing', totalLocalCount, donorsCount: donors.length }
  }));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('ganpati_mandal_token');
    if (token && !token.startsWith('demo-')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${baseUrl}/sync/auto-sync-all`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        income,
        expenses,
        donors,
        loans,
        receipts,
        members,
        settings,
        deleted_donors
      })
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        console.log('☁️ [Auto-Sync] सर्व नोंदी लाईव्ह सर्व्हरवर ऑटो-अपलोड झाल्या:', data.counts);
        localStorage.setItem('shirol_last_auto_synced', new Date().toISOString());
        window.dispatchEvent(new CustomEvent('shirol_sync_status_changed', {
          detail: { status: 'synced', counts: data.counts, donorsCount: donors.length }
        }));
        window.dispatchEvent(new Event('shirol_data_updated'));
        return { success: true, counts: data.counts };
      }
    }

    // If server responded with error and retry available
    if (retryCount < 1) {
      setTimeout(() => autoSyncAllToServer(true, retryCount + 1), 3000);
    }
    window.dispatchEvent(new CustomEvent('shirol_sync_status_changed', {
      detail: { status: 'error', reason: 'server-error', donorsCount: donors.length }
    }));
    return { success: false, reason: 'server-error' };
  } catch (err) {
    console.warn('Background auto-sync note:', err.message);
    if (retryCount < 1) {
      setTimeout(() => autoSyncAllToServer(true, retryCount + 1), 4000);
    }
    window.dispatchEvent(new CustomEvent('shirol_sync_status_changed', {
      detail: { status: 'error', error: err.message, donorsCount: donors.length }
    }));
    return { success: false, reason: err.message };
  } finally {
    isSyncingToServer = false;
  }
}

// 100% Automatic Pull: Syncs latest cloud data to local cache (bidirectional smart-merge)
export async function autoSyncFromServer() {
  if (typeof window === 'undefined' || isSyncingFromServer) return;
  const baseUrl = getActiveApiUrl();
  if (!baseUrl) return;

  isSyncingFromServer = true;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const headers = {};
    const token = localStorage.getItem('ganpati_mandal_token');
    if (token && !token.startsWith('demo-')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${baseUrl}/sync/full-data`, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const resp = await res.json();
      if (resp.success && resp.data) {
        const cloud = resp.data;
        let updated = false;

        // 1. Smart Merge Donors: Filter out any deleted donors!
        if (Array.isArray(cloud.donors)) {
          const currentDonors = getLocalStore('donors', []);
          const deletedDonors = getLocalStore('deleted_donors', []);
          const deletedNames = new Set(deletedDonors.map(d => (typeof d === 'string' ? d : d.name || '').trim().toLowerCase()).filter(Boolean));
          const deletedIds = new Set(deletedDonors.map(d => (typeof d === 'object' ? String(d.id) : null)).filter(Boolean));
          const deletedMobiles = new Set(deletedDonors.map(d => (typeof d === 'object' && d.mobile ? String(d.mobile).replace(/\D/g, '') : null)).filter(m => m && m.length >= 10));

          // Filter cloud donors to exclude any that were marked deleted locally
          const validCloudDonors = cloud.donors.filter(d => {
            if (!d || !d.name) return false;
            const name = d.name.trim().toLowerCase();
            const id = String(d.id);
            const mob = (d.mobile || '').replace(/\D/g, '');
            if (deletedNames.has(name)) return false;
            if (deletedIds.has(id)) return false;
            if (mob && deletedMobiles.has(mob)) return false;
            return true;
          });

          // Normalize alias function for consistent donor matching
          const normalizeDonorName = (nm) => {
            const low = (nm || '').trim().toLowerCase();
            if (low === 'pruthvi gavade' || low === 'prithvi gavade' || low === 'पृथ्वी गवडे') return 'pruthviraj gavade';
            return low;
          };

          // Build donor map from active cloud donors
          const donorMap = new Map();
          validCloudDonors.forEach(d => {
            const key = normalizeDonorName(d.name);
            donorMap.set(key, d);
          });

          // Preserve local donors that were genuinely created offline (temporary ID)
          currentDonors.forEach(d => {
            if (d && d.name) {
              const name = normalizeDonorName(d.name);
              const id = String(d.id);
              const mob = (d.mobile || '').replace(/\D/g, '');
              const isDeleted = deletedNames.has(name) || deletedNames.has((d.name || '').trim().toLowerCase()) || deletedIds.has(id) || (mob && deletedMobiles.has(mob));
              const isLocalTemp = Number(d.id) > 1000000000 || d.is_local;
              if (!isDeleted && isLocalTemp && !donorMap.has(name)) {
                donorMap.set(name, d);
              }
            }
          });

          const mergedDonors = Array.from(donorMap.values());
          localStorage.setItem('shirol_donors', JSON.stringify(mergedDonors));
          updated = true;
        }

        // 2. Smart Merge Income / Vargani Transactions (Exclude deleted donors/transactions!)
        if (Array.isArray(cloud.income)) {
          const currentIncome = getLocalStore('income', []);
          const deletedDonors = getLocalStore('deleted_donors', []);
          const deletedNames = new Set(deletedDonors.map(d => (typeof d === 'string' ? d : d.name || '').trim().toLowerCase()).filter(Boolean));
          const deletedIds = new Set(deletedDonors.map(d => (typeof d === 'object' ? String(d.id) : null)).filter(Boolean));
          const deletedMobiles = new Set(deletedDonors.map(d => (typeof d === 'object' && d.mobile ? String(d.mobile).replace(/\D/g, '') : null)).filter(m => m && m.length >= 10));

          const isIncDeleted = (inc) => {
            if (!inc || inc.is_deleted) return true;
            const incName = (inc.donor_name || '').trim().toLowerCase();
            const incId = inc.donor_id ? String(inc.donor_id) : null;
            const incMob = (inc.mobile || '').replace(/\D/g, '');
            if (deletedNames.has(incName)) return true;
            if (incId && deletedIds.has(incId)) return true;
            if (incMob && deletedMobiles.has(incMob)) return true;
            return false;
          };

          const validCloudIncome = cloud.income.filter(inc => !isIncDeleted(inc));
          const incomeMap = new Map();
          validCloudIncome.forEach(inc => {
            const key = inc.receipt_number || inc.transaction_id || `${inc.donor_name}_${inc.amount}`;
            incomeMap.set(key, inc);
          });
          currentIncome.filter(inc => !isIncDeleted(inc)).forEach(inc => {
            const key = inc.receipt_number || inc.transaction_id || `${inc.donor_name}_${inc.amount}`;
            if (!incomeMap.has(key)) {
              incomeMap.set(key, inc);
            }
          });
          const mergedIncome = Array.from(incomeMap.values());
          localStorage.setItem('shirol_income', JSON.stringify(mergedIncome));
          updated = true;
        }

        // 3. Expenses: Smart merge preserving approved status
        if (Array.isArray(cloud.expenses) && cloud.expenses.length > 0) {
          const currentExpenses = getLocalStore('expenses', []);
          const merged = cloud.expenses.map(ce => {
            const localMatch = currentExpenses.find(le =>
              (le.id && String(le.id) === String(ce.id)) ||
              (le.expense_id && String(le.expense_id) === String(ce.expense_id))
            );
            if (localMatch && localMatch.status === 'approved' && ce.status === 'pending') {
              return { ...ce, status: 'approved', approved_by_name: localMatch.approved_by_name || ce.approved_by_name };
            }
            return ce;
          });
          currentExpenses.forEach(le => {
            const inCloud = merged.some(me =>
              (me.id && String(me.id) === String(le.id)) ||
              (me.expense_id && String(me.expense_id) === String(le.expense_id))
            );
            if (!inCloud) merged.push(le);
          });
          localStorage.setItem('shirol_expenses', JSON.stringify(merged));
          updated = true;
        }

        // 4. Loans
        if (Array.isArray(cloud.loans) && cloud.loans.length > 0) {
          const currentLoans = getLocalStore('loans', []);
          if (cloud.loans.length >= currentLoans.length || currentLoans.length === 0) {
            localStorage.setItem('shirol_loans', JSON.stringify(cloud.loans));
            updated = true;
          }
        }

        // 5. Receipts
        if (Array.isArray(cloud.receipts) && cloud.receipts.length > 0) {
          const currentReceipts = getLocalStore('receipts', []);
          if (cloud.receipts.length >= currentReceipts.length || currentReceipts.length <= 1) {
            localStorage.setItem('shirol_receipts', JSON.stringify(cloud.receipts));
            updated = true;
          }
        }

        // 6. Settings
        if (cloud.settings && typeof cloud.settings === 'object') {
          localStorage.setItem('shirol_mandal_settings_custom', JSON.stringify(cloud.settings));
          updated = true;
        }

        if (updated) {
          console.log('🔄 [Auto-Sync] क्लाउड डेटा स्थानिक कॅशमध्ये अपडेट झाला!');
          window.dispatchEvent(new Event('shirol_data_updated'));
          window.dispatchEvent(new Event('storage'));
        }
      }
    }
  } catch (err) {
    console.warn('Background auto-pull note:', err.message);
  } finally {
    isSyncingFromServer = false;
  }
}

// Manual force sync trigger for user UI buttons
export async function forceSyncNow() {
  const uploadRes = await autoSyncAllToServer(true);
  await autoSyncFromServer();
  return uploadRes;
}

// Debounced trigger for auto-upload on every entry
export function triggerAutoSync() {
  if (typeof window === 'undefined') return;
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    autoSyncAllToServer();
  }, 1000);
}

// Background auto-sync initialization on app startup
if (typeof window !== 'undefined') {
  // 1. Initial sync after 1 second
  setTimeout(() => {
    autoSyncAllToServer().then(() => autoSyncFromServer());
  }, 1000);

  // 2. Periodic background sync every 60 seconds
  setInterval(() => {
    autoSyncAllToServer().then(() => autoSyncFromServer());
  }, 60000);

  // 3. Event listeners for visibility & online
  window.addEventListener('online', () => {
    autoSyncAllToServer(true).then(() => autoSyncFromServer());
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      autoSyncAllToServer().then(() => autoSyncFromServer());
    }
  });
}

function getLocalStore(key, defaultValue = []) {
  try {
    ensureDataRecovery();
    const item = localStorage.getItem(`shirol_${key}`);
    let data = item ? JSON.parse(item) : defaultValue;

    if (key === 'income' && Array.isArray(data)) {
      data = data.filter(inc => inc && !inc.is_deleted);
      data = data.map(inc => {
        if (inc.collector_name && (inc.collector_name.includes('सचिन') || inc.collector_name.includes('मनगूळे'))) {
          return { ...inc, collector_name: 'सुमेध गवडे (अध्यक्ष)' };
        }
        return inc;
      });
    }

    return data;
  } catch {
    return defaultValue;
  }
}

function setLocalStore(key, value) {
  try {
    localStorage.setItem(`shirol_${key}`, JSON.stringify(value));
    // Auto-upload to live server automatically on EVERY single entry!
    if (['income', 'expenses', 'donors', 'loans', 'receipts', 'members', 'cash_history', 'mandal_settings_custom'].includes(key)) {
      triggerAutoSync();
      // Notify all other open tabs to refresh their data
      broadcastDataChange();
    }
  } catch (e) {
    console.error('LocalStore write error:', e);
  }
}

// ==========================================
// CLIENT API INTERCEPTOR & SERVICES
// ==========================================
export async function request(endpoint, options = {}) {
  let token = localStorage.getItem('ganpati_mandal_token');

  const baseUrl = getActiveApiUrl();
  // Network-First: Try live central backend API first for cross-device sync
  if (baseUrl && !endpoint.startsWith('/auth/send-otp') && !endpoint.startsWith('/auth/verify-otp')) {
    try {
      const headers = { ...(options.headers || {}) };
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let res = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
      if (res.status === 401 && !endpoint.includes('/auth/login')) {
        // Self-heal: Renew token in background and retry once
        const freshToken = await ensureValidToken();
        if (freshToken && freshToken !== token) {
          token = freshToken;
          headers['Authorization'] = `Bearer ${token}`;
          res = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
        }
      }
      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false) {
          // Immediately sync local store on donor deletion
          if (options.method === 'DELETE' && endpoint.includes('/donors')) {
            handleLocalDonorDeletion(endpoint, options);
          }

          // If donor was created or updated, ensure it's removed from deleted_donors tombstone
          if ((options.method === 'POST' || options.method === 'PUT') && endpoint.includes('/donors')) {
            try {
              const bodyData = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
              const existingDeleted = getLocalStore('deleted_donors', []);
              if (existingDeleted.length > 0) {
                const targetName = (bodyData.name || data.data?.name || '').trim().toLowerCase();
                const filtered = existingDeleted.filter(d => !d.name || d.name.trim().toLowerCase() !== targetName);
                localStorage.setItem('shirol_deleted_donors', JSON.stringify(filtered));
              }
            } catch (e) {}
          }

          // Immediately sync local store on donor update (PUT /donors)
          if (options.method === 'PUT' && endpoint.includes('/donors')) {
            try {
              const bodyData = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
              const parts = endpoint.split('?')[0].split('/');
              const urlDonorId = parts[parts.length - 1];
              let localDonors = getLocalStore('donors', []);
              const updatedRow = data.data || {};

              localDonors = localDonors.map(d => {
                const matchId = (urlDonorId && String(d.id) === String(urlDonorId)) || (bodyData.id && String(d.id) === String(bodyData.id));
                const matchName = (bodyData.originalName && d.name?.toLowerCase() === bodyData.originalName?.toLowerCase()) ||
                                  (bodyData.name && d.name?.toLowerCase() === bodyData.name?.toLowerCase());
                const matchMobile = bodyData.mobile && d.mobile && (d.mobile.replace(/\D/g, '') === bodyData.mobile.replace(/\D/g, ''));

                if (matchId || matchName || matchMobile) {
                  const target = bodyData.target_amount !== undefined ? Number(bodyData.target_amount) : (updatedRow.target_amount !== undefined ? Number(updatedRow.target_amount) : Number(d.target_amount || 500));
                  const paid = bodyData.paid_amount !== undefined ? Number(bodyData.paid_amount) : (updatedRow.paid_amount !== undefined ? Number(updatedRow.paid_amount) : Number(d.paid_amount || 0));
                  return {
                    ...d,
                    ...updatedRow,
                    name: bodyData.name || updatedRow.name || d.name,
                    mobile: bodyData.mobile !== undefined ? bodyData.mobile : (updatedRow.mobile || d.mobile),
                    area: bodyData.area || updatedRow.area || d.area,
                    address: bodyData.address !== undefined ? bodyData.address : (updatedRow.address || d.address),
                    target_amount: target,
                    paid_amount: paid,
                    pending_amount: Math.max(0, target - paid),
                    status: (paid >= target && target > 0) ? 'paid' : (paid > 0 ? 'partial' : 'unpaid')
                  };
                }
                return d;
              });

              localStorage.setItem('shirol_donors', JSON.stringify(localDonors));

              if (bodyData.name && ((bodyData.originalName && bodyData.name !== bodyData.originalName) || urlDonorId)) {
                let localIncome = getLocalStore('income', []);
                localIncome = localIncome.map(inc => {
                  const matchInc = (bodyData.originalName && inc.donor_name?.toLowerCase() === bodyData.originalName?.toLowerCase()) ||
                                   (urlDonorId && String(inc.donor_id) === String(urlDonorId));
                  if (matchInc) {
                    return {
                      ...inc,
                      donor_name: bodyData.name,
                      mobile: bodyData.mobile !== undefined ? bodyData.mobile : inc.mobile,
                      address: bodyData.address !== undefined ? bodyData.address : inc.address
                    };
                  }
                  return inc;
                });
                localStorage.setItem('shirol_income', JSON.stringify(localIncome));
              }

              // Also cascade paid_amount changes to the local income store (most recent entry)
              if (bodyData.paid_amount !== undefined) {
                // Find the existing donor before update to get old paid amount
                const preUpdateDonor = getLocalStore('donors', []).find(d =>
                  (urlDonorId && String(d.id) === String(urlDonorId)) ||
                  (bodyData.originalName && d.name?.toLowerCase() === bodyData.originalName?.toLowerCase())
                );
                const oldPaid = Number(preUpdateDonor?.paid_amount || preUpdateDonor?.total_donated || 0);
                const newPaid = Number(bodyData.paid_amount);
                if (newPaid !== oldPaid && Math.abs(newPaid - oldPaid) > 0) {
                  let localIncome = getLocalStore('income', []);
                  let updated = false;
                  // Update only the most recent matching transaction amount
                  const sorted = [...localIncome].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                  const mostRecentMatch = sorted.find(inc =>
                    !inc.is_deleted && (
                      (urlDonorId && String(inc.donor_id) === String(urlDonorId)) ||
                      (bodyData.originalName && inc.donor_name?.toLowerCase() === bodyData.originalName?.toLowerCase()) ||
                      (bodyData.name && inc.donor_name?.toLowerCase() === bodyData.name?.toLowerCase())
                    )
                  );
                  if (mostRecentMatch) {
                    const diff = newPaid - oldPaid;
                    const newAmt = Math.max(0, (Number(mostRecentMatch.amount) || 0) + diff);
                    localIncome = localIncome.map(inc =>
                      inc === mostRecentMatch || (inc.id && inc.id === mostRecentMatch.id)
                        ? { ...inc, amount: newAmt }
                        : inc
                    );
                    localStorage.setItem('shirol_income', JSON.stringify(localIncome));
                  }
                }
              }

              window.dispatchEvent(new Event('shirol_data_updated'));
              window.dispatchEvent(new Event('storage'));
              broadcastDataChange();
            } catch (e) {
              console.warn('Local store update on PUT /donors error:', e);
            }
          }


          // Immediately sync local store on expense approval/rejection
          if (options.method === 'PUT' && endpoint.includes('/expenses/') && (endpoint.includes('/approve') || endpoint.includes('/reject'))) {
            const parts = endpoint.split('/');
            const targetExpId = parts[2];
            const isApprove = endpoint.includes('/approve');
            let expensesList = getLocalStore('expenses', []);
            expensesList = expensesList.map(exp => {
              if (String(exp.id) === String(targetExpId) || String(exp.expense_id) === String(targetExpId)) {
                return {
                  ...exp,
                  status: isApprove ? 'approved' : 'rejected',
                  approved_at: isApprove ? new Date().toISOString() : exp.approved_at,
                  approved_by_name: isApprove ? (exp.approved_by_name || 'अध्यक्ष (Admin)') : exp.approved_by_name
                };
              }
              return exp;
            });
            setLocalStore('expenses', expensesList);
          }

          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase())) {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('shirol_data_updated'));
              window.dispatchEvent(new Event('storage'));
              broadcastDataChange();
            }
          }

          return data;
        }
      }
    } catch (e) {
      console.warn(`Live API call to ${endpoint} unreachable, using local store engine:`, e);
    }
  }

  // Handle Login Endpoint (Local Engine Fallback)
  if (endpoint.startsWith('/auth/login')) {
    const bodyData = JSON.parse(options.body || '{}');
    const { identifier, password } = bodyData;
    const cleanId = (identifier || '').trim().toLowerCase();

    // 1. President Authority Account
    if (cleanId === 'president@mandal.org' || cleanId === 'admin@ganeshmandal.org' || cleanId === '9822099999' || cleanId === 'admin') {
      if (password === 'admin123' || password === '123456') {
        const user = { id: 101, name: 'सुमेध गवडे (अध्यक्ष)', email: 'president@mandal.org', mobile: '9822099999', role: 'admin', status: 'active' };
        const token = 'demo-admin-token-' + Date.now();
        localStorage.setItem('ganpati_mandal_token', token);
        localStorage.setItem('ganpati_mandal_user', JSON.stringify(user));
        return { success: true, message: 'अध्यक्ष (President) म्हणून लॉगिन!', token, user };
      }
    }

    // 2. Treasurer Authority Account
    if (cleanId === 'treasurer@mandal.org' || cleanId === 'treasurer@ganeshmandal.org' || cleanId === '9822022222' || cleanId === '9356997428' || cleanId === 'treasurer' || cleanId === 'shreyashgavade7@gmail.com') {
      if (password === 'treasurer123' || password === '123456') {
        const user = { id: 102, name: 'श्रेयश गवडे (खजिनदार)', email: 'shreyashgavade7@gmail.com', mobile: '9356997428', role: 'treasurer', status: 'active' };
        const token = 'demo-treasurer-token-' + Date.now();
        localStorage.setItem('ganpati_mandal_token', token);
        localStorage.setItem('ganpati_mandal_user', JSON.stringify(user));
        return { success: true, message: 'खजिनदार (Treasurer - श्रेयश गवडे) म्हणून लॉगिन!', token, user };
      }
    }

    // 3. Member User from local store
    const usersList = getLocalStore('users', DEFAULT_SHIROL_USERS);
    let user = usersList.find(u =>
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.mobile && u.mobile === cleanId)
    );

    if (user && (password === 'admin123' || password === '123456' || password.length >= 4)) {
      const token = 'user-token-' + Date.now();
      localStorage.setItem('ganpati_mandal_token', token);
      localStorage.setItem('ganpati_mandal_user', JSON.stringify(user));
      return { success: true, message: 'सभासद लॉगिन यशस्वी!', token, user };
    }

    return { success: false, message: 'अवैध मोबाईल / ईमेल किंवा पासवर्ड.' };
  }

  // Handle Auth Me Session Check (Local Engine Fallback)
  if (endpoint.startsWith('/auth/me')) {
    const savedUser = localStorage.getItem('ganpati_mandal_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        return { success: true, user };
      } catch (e) {}
    }
    return { success: false, message: 'लॉगिन केलेले नाही' };
  }

  // Handle Volunteer Leaderboard Endpoint
  if (endpoint.startsWith('/volunteers/leaderboard')) {
    const incomeList = getLocalStore('income', []);
    const volunteers = [
      { id: 1, name: 'राहुल गवडे', area: 'नदीवेस शिरोळ', target: 60000, base: 0 },
      { id: 2, name: 'अमित गवडे', area: 'गावभाग', target: 60000, base: 0 },
      { id: 3, name: 'सागर गवडे', area: 'तालीम गल्ली', target: 60000, base: 0 },
      { id: 4, name: 'अथर्व गवडे (अभि)', area: 'स्टँड रोड', target: 50000, base: 0 }
    ];

    const data = volunteers.map((v, i) => {
      const extra = incomeList.filter(inc => (inc.collector_name || '').includes(v.name.split(' ')[0])).reduce((s, inc) => s + (Number(inc.amount) || 0), 0);
      const collected = v.base + extra;
      const achievement = Math.round((collected / v.target) * 100);
      return {
        ...v,
        rank: i + 1,
        collected,
        achievement,
        badge: achievement >= 120 ? '🥇 Super Star Collector' : achievement >= 100 ? '🥈 Target Achiever' : '🥉 Active Volunteer'
      };
    }).sort((a, b) => b.collected - a.collected);

    return { success: true, data };
  }

  // Handle Dashboard Stats (Local Engine Fallback)
  if (endpoint.startsWith('/dashboard/stats')) {
    const incomeList = getLocalStore('income', []);
    const expensesList = getLocalStore('expenses', []);
    const donorsList = getLocalStore('donors', []);
    const loansList = getLocalStore('loans', []);

    const totalIncome = incomeList.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalExpense = expensesList.filter(e => e.status === 'approved').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const currentBalance = totalIncome - totalExpense;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCollection = incomeList
      .filter(i => (i.created_at || '').startsWith(todayStr))
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const pendingExpenses = expensesList.filter(e => e.status === 'pending');

    return {
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          currentBalance,
          todayCollection: todayCollection > 0 ? todayCollection : totalIncome,
          totalDonors: Math.max(donorsList.length, incomeList.length),
          totalTransactions: incomeList.length,
          pendingExpensesCount: pendingExpenses.length,
          pendingExpensesAmount: pendingExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
        },
        recentTransactions: incomeList.slice(0, 10),
        dailyTrend: [
          { date: 'आज', amount: todayCollection > 0 ? todayCollection : totalIncome }
        ]
      }
    };
  }
  if (endpoint.startsWith('/loans')) {
    let loansList = getLocalStore('loans', []);

    if (endpoint.includes('/summary')) {
      const totalBorrowed = loansList.filter(l => l.type === 'borrowed').reduce((s, l) => s + (Number(l.amount) || 0), 0);
      const totalBorrowedRepaid = loansList.filter(l => l.type === 'borrowed').reduce((s, l) => s + (Number(l.paid_amount) || 0), 0);
      const totalBorrowedOutstanding = Math.max(0, totalBorrowed - totalBorrowedRepaid);

      const totalLent = loansList.filter(l => l.type === 'lent').reduce((s, l) => s + (Number(l.amount) || 0), 0);
      const totalLentRepaid = loansList.filter(l => l.type === 'lent').reduce((s, l) => s + (Number(l.paid_amount) || 0), 0);
      const totalLentOutstanding = Math.max(0, totalLent - totalLentRepaid);

      return {
        success: true,
        data: {
          totalBorrowed,
          totalBorrowedRepaid,
          totalBorrowedOutstanding,
          totalLent,
          totalLentRepaid,
          totalLentOutstanding,
          totalLoansCount: loansList.length
        }
      };
    }

    if (endpoint.includes('/repay') && options.method === 'POST') {
      const parts = endpoint.split('/');
      const loanId = parts[2];
      const bodyData = JSON.parse(options.body || '{}');
      const repayAmount = Number(bodyData.amount) || 0;

      let targetLoan = null;
      loansList = loansList.map(loan => {
        if (String(loan.id) === String(loanId)) {
          const currentPaid = Number(loan.paid_amount) || 0;
          const newPaid = currentPaid + repayAmount;
          const newRemaining = Math.max(0, Number(loan.amount) - newPaid);
          const newStatus = newRemaining === 0 ? 'fully_paid' : 'partially_paid';

          const repaymentEntry = {
            id: Date.now(),
            amount: repayAmount,
            payment_method: bodyData.payment_method || 'cash',
            notes: bodyData.notes || '',
            date: new Date().toISOString()
          };

          targetLoan = {
            ...loan,
            paid_amount: newPaid,
            remaining_amount: newRemaining,
            status: newStatus,
            repayments: [...(loan.repayments || []), repaymentEntry]
          };
          return targetLoan;
        }
        return loan;
      });

      setLocalStore('loans', loansList);

      // Automatically add loan repayment to Expenses
      if (targetLoan && (targetLoan.type === 'borrowed' || !targetLoan.type) && repayAmount > 0) {
        const expensesList = getLocalStore('expenses', []);
        const expCount = expensesList.length + 1;
        const newExpense = {
          id: Date.now(),
          expense_id: `EXP-LOAN-${String(expCount).padStart(4, '0')}`,
          category: 'loan_repayment',
          paid_to: targetLoan.person_name,
          amount: repayAmount,
          payment_method: bodyData.payment_method || 'cash',
          description: `कर्ज / उधारी परतफेड: ${targetLoan.person_name} (${targetLoan.remaining_amount === 0 ? 'पूर्ण फेडली' : 'अंशतः परतफेड'}${bodyData.notes ? ` - ${bodyData.notes}` : ''})`,
          notes: bodyData.notes || 'कर्ज परतफेड',
          status: 'approved',
          approved_by_name: 'खजिनदार',
          created_at: new Date().toISOString()
        };
        setLocalStore('expenses', [newExpense, ...expensesList]);
      }

      return { success: true, message: 'उधारी परतफेड नोंदवली व खर्चात जमा झाली! 💸' };
    }

    if (options.method === 'POST') {
      const bodyData = JSON.parse(options.body || '{}');
      const newLoan = {
        id: Date.now(),
        person_name: bodyData.person_name,
        mobile: bodyData.mobile || '',
        type: bodyData.type || 'borrowed',
        amount: Number(bodyData.amount) || 0,
        paid_amount: 0,
        remaining_amount: Number(bodyData.amount) || 0,
        payment_method: bodyData.payment_method || 'cash',
        purpose: bodyData.purpose || '',
        due_date: bodyData.due_date || null,
        interest_rate: Number(bodyData.interest_rate) || 0,
        notes: bodyData.notes || '',
        status: 'pending',
        repayments: [],
        created_at: new Date().toISOString()
      };
      loansList = [newLoan, ...loansList];
      setLocalStore('loans', loansList);
      return { success: true, message: 'उधारीची नोंद जतन झाली!', data: newLoan };
    }

    if (options.method === 'DELETE') {
      const loanId = endpoint.split('/loans/')[1];
      loansList = loansList.filter(l => String(l.id) !== String(loanId));
      setLocalStore('loans', loansList);
      return { success: true, message: 'उधारी नोंद हटवली.' };
    }

    return { success: true, data: loansList };
  }

  // Handle Mandal Settings endpoints
  if (endpoint.startsWith('/settings') || endpoint.startsWith('/public/donation-info')) {
    if (options.method === 'PUT') {
      try {
        const bodyData = options.body instanceof FormData ? {} : JSON.parse(options.body || '{}');
        const current = getLocalStore('mandal_settings_custom', SHIROL_MANDAL_SETTINGS);
        const updated = { ...current, ...bodyData };
        setLocalStore('mandal_settings_custom', updated);
        return { success: true, data: updated, message: 'सेटिंग्ज जतन झाल्या!' };
      } catch (err) {
        console.error('Save settings error:', err);
      }
    }
    let currentSettings = getLocalStore('mandal_settings_custom', SHIROL_MANDAL_SETTINGS);
    if (!currentSettings.upi_id || currentSettings.upi_id.includes('okaxis') || currentSettings.upi_id.includes('@ybl')) {
      currentSettings.upi_id = '9699572617@ibl';
      currentSettings.upi_name = 'SUMEDH SHAHAJI GAVADE';
      setLocalStore('mandal_settings_custom', currentSettings);
    }
    return { success: true, data: currentSettings, mandal: currentSettings };
  }

  // Handle Dashboard Stats endpoint (Calculates live stats from clean local database)
  if (endpoint.startsWith('/dashboard/stats')) {
    const incomeList = getLocalStore('income', []);
    const expenseList = getLocalStore('expenses', []);
    const donorsList = getLocalStore('donors', []);
    const settings = getLocalStore('mandal_settings_custom', SHIROL_MANDAL_SETTINGS);

    // Filter ONLY approved or paid expenses (rejected/pending expenses do NOT count toward actual total expense)
    const approvedExpenses = expenseList.filter(e => ['approved', 'paid'].includes(e.status));
    const pendingExpenses = expenseList.filter(e => e.status === 'pending');

    const totalIncome = incomeList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalExpense = approvedExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalVargani = incomeList
      .filter(item => item.category === 'vargani')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // Bug 1 fix: Use IST date instead of UTC
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const todayCollection = incomeList
      .filter(item => item.created_at && new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(item.created_at)) === todayStr)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const todayExpense = approvedExpenses
      .filter(item => item.created_at && new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(item.created_at)) === todayStr)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const targetAmount = getLocalStore('daily_vargani_target', 500000);

    const donorNamesSet = new Set(donorsList.map(d => (d.name || '').trim().toLowerCase()).filter(Boolean));
    incomeList.forEach(inc => {
      if (inc && !inc.is_deleted && inc.donor_name) {
        donorNamesSet.add(inc.donor_name.trim().toLowerCase());
      }
    });
    const totalDonors = Math.max(donorsList.length, donorNamesSet.size);

    const processedTopDonors = donorsList.map(d => {
      const matchingPayments = incomeList.filter(inc => {
        if (inc.is_deleted) return false;
        const nameMatch = inc.donor_name && d.name && (inc.donor_name.trim().toLowerCase() === d.name.trim().toLowerCase());
        const mobileMatch = d.mobile && inc.mobile && (d.mobile.replace(/\D/g, '') === inc.mobile.replace(/\D/g, '') && d.mobile.replace(/\D/g, '').length >= 10);
        return nameMatch || mobileMatch;
      });
      const paid = matchingPayments.reduce((s, inc) => s + (Number(inc.amount) || 0), 0);
      return {
        ...d,
        total_donated: paid || Number(d.total_donated) || 0,
        paid_amount: paid || Number(d.paid_amount) || 0
      };
    }).sort((a, b) => (b.total_donated || 0) - (a.total_donated || 0)).slice(0, 10);

    return {
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          currentBalance: totalIncome - totalExpense,
          totalVargani,
          totalDonation: totalIncome - totalVargani,
          totalSponsorship: 0,
          totalDonors,
          totalTransactions: incomeList.length + expenseList.length, // Bug 8 fix: count all expenses
          todayCollection,
          varganiTarget: targetAmount,
          todayExpense,
          pendingExpensesCount: pendingExpenses.length,
          pendingExpensesAmount: pendingExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
          cashIncome: incomeList.filter(i => (i.payment_method || 'cash') === 'cash').reduce((s, i) => s + (Number(i.amount) || 0), 0),
          digitalIncome: incomeList.filter(i => (i.payment_method || 'cash') !== 'cash').reduce((s, i) => s + (Number(i.amount) || 0), 0),
          cashExpense: approvedExpenses.filter(e => (e.payment_method || 'cash') === 'cash').reduce((s, e) => s + (Number(e.amount) || 0), 0)
        },
        paymentMethods: [],
        expenseCategories: [],
        incomeCategories: [],
        dailyTrend: [],
        topDonors: processedTopDonors,
        recentTransactions: incomeList.slice(0, 5),
        upcomingEvents: [],
        mandalSettings: settings
      }
    };
  }


  // Handle Financial Reports Endpoints (Live calculation from local database)
  if (endpoint.startsWith('/reports')) {
    const incomeList = getLocalStore('income', []);
    const expenseList = getLocalStore('expenses', []);

    let filteredIncome = [...incomeList];
    let filteredExpenses = [...expenseList];

    const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
    const params = new URLSearchParams(queryString);
    const rangeParam = params.get('range') || 'all';

    const now = new Date();
    if (rangeParam === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      filteredIncome = incomeList.filter(i => i.created_at && i.created_at.startsWith(todayStr));
      filteredExpenses = expenseList.filter(e => e.created_at && e.created_at.startsWith(todayStr));
    } else if (rangeParam === '7days') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredIncome = incomeList.filter(i => new Date(i.created_at) >= past7);
      filteredExpenses = expenseList.filter(e => new Date(e.created_at) >= past7);
    } else if (rangeParam === '30days') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredIncome = incomeList.filter(i => new Date(i.created_at) >= past30);
      filteredExpenses = expenseList.filter(e => new Date(e.created_at) >= past30);
    }

    const totalIncome = filteredIncome.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const cashIncome = filteredIncome
      .filter(item => (item.payment_method || 'cash') === 'cash')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const digitalIncome = totalIncome - cashIncome;

    const totalApprovedExpense = filteredExpenses
      .filter(item => item.status === 'approved' || !item.status)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const cashExpense = totalApprovedExpense;

    // Income breakdown by category
    const incomeCatMap = {};
    filteredIncome.forEach(item => {
      const cat = item.category || 'vargani';
      if (!incomeCatMap[cat]) incomeCatMap[cat] = { category: cat, count: 0, amount: 0 };
      incomeCatMap[cat].count += 1;
      incomeCatMap[cat].amount += (Number(item.amount) || 0);
    });

    // Expense breakdown by category
    const expenseCatMap = {};
    filteredExpenses.forEach(item => {
      const cat = item.category || 'other';
      if (!expenseCatMap[cat]) expenseCatMap[cat] = { category: cat, count: 0, amount: 0 };
      expenseCatMap[cat].count += 1;
      expenseCatMap[cat].amount += (Number(item.amount) || 0);
    });

    // Collector Performance breakdown
    const collectorMap = {};
    filteredIncome.forEach(item => {
      let colName = item.collector_name || 'अध्यक्ष (Admin)';
      if (colName.includes('सचिन') || colName.includes('मनगूळे')) {
        colName = 'सुमेध गवडे (अध्यक्ष)';
      }
      if (!collectorMap[colName]) collectorMap[colName] = { collector_name: colName, count: 0, total_amount: 0 };
      collectorMap[colName].count += 1;
      collectorMap[colName].total_amount += (Number(item.amount) || 0);
    });

    return {
      success: true,
      data: {
        totals: {
          totalIncome,
          cashIncome,
          digitalIncome,
          totalApprovedExpense,
          cashExpense,
          netBalance: totalIncome - totalApprovedExpense
        },
        incomeByCategory: Object.values(incomeCatMap),
        expenseByCategory: Object.values(expenseCatMap),
        collectionsByCollector: Object.values(collectorMap)
      }
    };
  }

  // Handle Cash Reconciliation Endpoints
  if (endpoint.startsWith('/cash')) {
    const urlObj = new URL(endpoint, 'http://dummy.local');
    const targetDate = urlObj.searchParams.get('date') || new Date().toISOString().split('T')[0];

    const incomeList = getLocalStore('income', []);
    const expenseList = getLocalStore('expenses', []);
    const history = getLocalStore('cash_history', []);

    // Filter income transactions for targetDate & cash payment method
    const targetIncome = incomeList.filter(item => {
      const pm = String(item.payment_method || 'cash').toLowerCase();
      const isCash = pm === 'cash' || pm === 'rokh' || pm.includes('रोख');
      const itemDate = item.created_at ? item.created_at.split('T')[0] : '';
      return isCash && itemDate === targetDate && !item.is_deleted;
    });

    // Filter expense transactions for targetDate & cash payment method (exclude deleted or rejected)
    const targetExpense = expenseList.filter(item => {
      const pm = String(item.payment_method || 'cash').toLowerCase();
      const isCash = pm === 'cash' || pm === 'rokh' || pm.includes('रोख');
      const notRejected = item.status !== 'rejected' && !item.is_deleted;
      const itemDate = item.created_at ? item.created_at.split('T')[0] : '';
      return isCash && notRejected && itemDate === targetDate;
    });

    const cashIncome = targetIncome.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const cashExpense = targetExpense.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // Calculate opening cash from previous reconciliation record before targetDate
    const prevRec = history
      .filter(h => h.reconciliation_date < targetDate)
      .sort((a, b) => b.reconciliation_date.localeCompare(a.reconciliation_date))[0];

    let openingCash = 0;
    if (prevRec) {
      openingCash = Number(prevRec.actual_closing) || 0;
    } else {
      openingCash = getLocalStore('opening_cash', 0);
    }

    const expectedClosing = openingCash + cashIncome - cashExpense;

    if (endpoint.includes('/summary')) {
      const existingRec = history.find(h => h.reconciliation_date === targetDate) || null;
      return {
        success: true,
        data: {
          date: targetDate,
          openingCash,
          cashIncome,
          cashExpense,
          expectedClosing,
          cashIncomeCount: targetIncome.length,
          cashExpenseCount: targetExpense.length,
          existingReconciliation: existingRec
        }
      };
    }

    if (endpoint.includes('/history')) {
      return { success: true, data: history };
    }

    if (endpoint.includes('/reconcile') && options.method === 'POST') {
      const bodyData = JSON.parse(options.body || '{}');
      const recDate = bodyData.date || targetDate;
      const opCash = Number(bodyData.opening_cash) || 0;
      const incCash = Number(bodyData.cash_income) || 0;
      const expCash = Number(bodyData.cash_expense) || 0;
      const actClosing = Number(bodyData.actual_closing) || 0;
      const expClosing = opCash + incCash - expCash;
      const diff = actClosing - expClosing;

      const existingIdx = history.findIndex(h => h.reconciliation_date === recDate);
      const newRecord = {
        id: existingIdx >= 0 ? history[existingIdx].id : Date.now(),
        reconciliation_date: recDate,
        opening_cash: opCash,
        cash_income: incCash,
        cash_expense: expCash,
        expected_closing: expClosing,
        actual_closing: actClosing,
        difference: diff,
        notes: bodyData.notes || '',
        verified_by_name: 'अध्यक्ष / खजिनदार',
        created_at: new Date().toISOString()
      };

      let updatedHistory = [...history];
      if (existingIdx >= 0) {
        updatedHistory[existingIdx] = newRecord;
      } else {
        updatedHistory = [newRecord, ...history];
      }

      setLocalStore('cash_history', updatedHistory);
      setLocalStore('opening_cash', actClosing);
      return { success: true, message: 'रोख ताळेबंद यशस्वीरित्या जतन झाला!' };
    }
  }

  // Handle Users Management Endpoints
  if (endpoint.startsWith('/users')) {
    let usersList = getLocalStore('users', DEFAULT_SHIROL_USERS);
    const currentUser = JSON.parse(localStorage.getItem('ganpati_mandal_user') || 'null');
    if (currentUser && !usersList.some(u => u.email === currentUser.email || u.mobile === currentUser.mobile)) {
      usersList.push({
        id: currentUser.id || Date.now(),
        name: currentUser.name || 'सभासद',
        email: currentUser.email || '',
        mobile: currentUser.mobile || '',
        role: currentUser.role || 'member',
        status: 'active',
        created_at: new Date().toISOString()
      });
      setLocalStore('users', usersList);
    }

    if (options.method === 'POST') {
      const bodyData = JSON.parse(options.body || '{}');
      const newUser = {
        id: Date.now(),
        name: bodyData.name,
        email: bodyData.email || '',
        mobile: bodyData.mobile,
        role: bodyData.role || 'member',
        status: 'active',
        created_at: new Date().toISOString()
      };
      usersList = [newUser, ...usersList];
      setLocalStore('users', usersList);
      return { success: true, message: 'नवीन वापरकर्ता जोडला!', data: newUser };
    }

    if (options.method === 'PUT') {
      const parts = endpoint.split('/');
      const userId = parts[2];
      const action = parts[3];
      const bodyData = JSON.parse(options.body || '{}');
      usersList = usersList.map(u => {
        if (String(u.id) === String(userId)) {
          if (action === 'role') return { ...u, role: bodyData.role };
          if (action === 'status') return { ...u, status: bodyData.status };
          return { ...u, ...bodyData };
        }
        return u;
      });
      setLocalStore('users', usersList);
      return { success: true, message: 'वापरकर्ता अद्ययावत केला.' };
    }

    if (options.method === 'DELETE') {
      const parts = endpoint.split('/');
      const userId = parts[2];
      usersList = usersList.filter(u => String(u.id) !== String(userId));
      setLocalStore('users', usersList);
      return { success: true, message: 'वापरकर्ता हटवला.' };
    }

    return { success: true, data: usersList };
  }

  // Handle Committee Members Endpoints
  if (endpoint.startsWith('/members')) {
    let membersList = getLocalStore('members', DEFAULT_SHIROL_MEMBERS);

    if (options.method === 'POST') {
      const bodyData = JSON.parse(options.body || '{}');
      const newMember = {
        id: Date.now(),
        name: bodyData.name,
        role_title_mr: bodyData.role_title_mr || 'कार्यकर्ता',
        role_title_en: bodyData.role_title_en || 'Member',
        mobile: bodyData.mobile || '',
        address: bodyData.address || '',
        joining_year: bodyData.joining_year || 2026,
        blood_group: bodyData.blood_group || 'O+'
      };
      membersList = [newMember, ...membersList];
      setLocalStore('members', membersList);
      return { success: true, message: 'नवीन सदस्य जोडला!', data: newMember };
    }

    if (options.method === 'PUT') {
      const parts = endpoint.split('/');
      const memberId = parts[2];
      const bodyData = JSON.parse(options.body || '{}');
      membersList = membersList.map(m => String(m.id) === String(memberId) ? { ...m, ...bodyData } : m);
      setLocalStore('members', membersList);
      return { success: true, message: 'सदस्य माहिती जतन झाली.' };
    }

    if (options.method === 'DELETE') {
      const parts = endpoint.split('/');
      const memberId = parts[2];
      membersList = membersList.filter(m => String(m.id) !== String(memberId));
      setLocalStore('members', membersList);
      return { success: true, message: 'सदस्य हटवला.' };
    }

    return { success: true, data: membersList };
  }

  // Handle Income / Vargani Endpoints
  if (endpoint.startsWith('/income')) {
    if (options.method === 'POST') {
      let bodyData = {};
      if (options.body instanceof FormData) {
        options.body.forEach((val, key) => { bodyData[key] = val; });
      } else {
        bodyData = JSON.parse(options.body || '{}');
      }

      const incomeList = getLocalStore('income', []);
      const donorsList = getLocalStore('donors', []);
      const settings = getLocalStore('mandal_settings_custom', SHIROL_MANDAL_SETTINGS);

      let maxReceiptNum = 0;
      incomeList.forEach(inc => {
        if (inc.receipt_number) {
          const m = inc.receipt_number.match(/(\d+)$/);
          if (m) {
            const n = parseInt(m[1], 10);
            if (!isNaN(n) && n > maxReceiptNum && n < 999999) maxReceiptNum = n;
          }
        }
      });
      const count = Math.max(incomeList.length, maxReceiptNum) + 1;
      const formattedNum = String(count).padStart(6, '0');
      const receiptNo = `${settings.receipt_prefix || 'HANUMAN-2026-'}${formattedNum}`;
      const amount = Number(bodyData.amount) || 0;
      const createdAt = new Date().toISOString();

      const newIncome = {
        id: Date.now(),
        transaction_id: `TXN-2026-${formattedNum}`,
        receipt_number: receiptNo,
        donor_name: bodyData.donor_name,
        mobile: bodyData.mobile || '',
        address: bodyData.address || bodyData.area || '',
        amount,
        payment_method: bodyData.payment_method || 'cash',
        category: bodyData.category || 'vargani',
        purpose: bodyData.purpose || 'श्री गणेशोत्सव वर्गणी',
        notes: bodyData.notes || '',
        collector_name: 'अध्यक्ष (Admin)',
        amount_in_words_mr: numberToWordsMarathi(amount),
        amount_in_words_en: numberToWordsEnglish(amount),
        created_at: createdAt
      };

      const updatedIncome = [newIncome, ...incomeList];
      setLocalStore('income', updatedIncome);

      // Add/Update Donor record
      let donorIndex = donorsList.findIndex(d =>
        (d.name && bodyData.donor_name && d.name.trim().toLowerCase() === bodyData.donor_name.trim().toLowerCase()) ||
        (bodyData.mobile && d.mobile && d.mobile.replace(/\D/g, '') === bodyData.mobile.replace(/\D/g, '') && d.mobile.replace(/\D/g, '').length >= 10)
      );

      if (donorIndex >= 0) {
        const currentPaid = (Number(donorsList[donorIndex].paid_amount || donorsList[donorIndex].total_donated) || 0) + amount;
        const currentTarget = Math.max(Number(donorsList[donorIndex].target_amount || 0), currentPaid);
        donorsList[donorIndex].total_donated = currentPaid;
        donorsList[donorIndex].paid_amount = currentPaid;
        donorsList[donorIndex].target_amount = currentTarget;
        donorsList[donorIndex].pending_amount = Math.max(0, currentTarget - currentPaid);
        donorsList[donorIndex].donations_count = (Number(donorsList[donorIndex].donations_count) || 0) + 1;
        donorsList[donorIndex].last_donated_at = createdAt;
        donorsList[donorIndex].status = donorsList[donorIndex].pending_amount === 0 ? 'paid' : 'partial';
        if (bodyData.mobile) {
          donorsList[donorIndex].mobile = bodyData.mobile;
        }
        if (bodyData.address) {
          donorsList[donorIndex].address = bodyData.address;
        }
      } else {
        donorsList.unshift({
          id: Date.now(),
          name: bodyData.donor_name,
          mobile: bodyData.mobile || '',
          address: bodyData.address || '',
          area: bodyData.area || 'शिरोळ',
          total_donated: amount,
          target_amount: amount,
          paid_amount: amount,
          pending_amount: 0,
          donations_count: 1,
          status: 'paid',
          last_donated_at: createdAt
        });
      }
      setLocalStore('donors', donorsList);

      const receipt = {
        id: newIncome.id,
        receipt_number: receiptNo,
        transaction_id: newIncome.transaction_id,
        donor_name: newIncome.donor_name,
        mobile: newIncome.mobile,
        address: newIncome.address,
        amount: newIncome.amount,
        amount_in_words_mr: newIncome.amount_in_words_mr,
        amount_in_words_en: newIncome.amount_in_words_en,
        payment_method: newIncome.payment_method,
        category: newIncome.category,
        purpose: newIncome.purpose,
        collector_name: newIncome.collector_name,
        verification_code: `V-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        created_at: createdAt
      };

      setLocalStore('receipts', [receipt, ...getLocalStore('receipts', [])]);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('shirol_data_updated'));
        window.dispatchEvent(new Event('storage'));
        broadcastDataChange();
      }

      return {
        success: true,
        message: 'वर्गणी जमा झाली!',
        data: { receipt, receiptNumber: receiptNo }
      };
    }

    if (options.method === 'DELETE') {
      const id = endpoint.split('/income/')[1];
      const incomeList = getLocalStore('income', []);
      const deletedItem = incomeList.find(item => String(item.id) === String(id));
      const filtered = incomeList.filter(item => String(item.id) !== String(id));
      setLocalStore('income', filtered);
      if (deletedItem) {
        const donorsList = getLocalStore('donors', []);
        const updatedDonors = donorsList.map(d => {
          const nameMatch = deletedItem.donor_name && d.name &&
            d.name.trim().toLowerCase() === deletedItem.donor_name.trim().toLowerCase();
          const mobileMatch = deletedItem.mobile && d.mobile &&
            d.mobile.replace(/\D/g, '') === deletedItem.mobile.replace(/\D/g, '') &&
            d.mobile.replace(/\D/g, '').length >= 10;
          if (nameMatch || mobileMatch) {
            const newPaid = Math.max(0, (Number(d.paid_amount || d.total_donated) || 0) - (Number(deletedItem.amount) || 0));
            const newTarget = Number(d.target_amount || 0);
            return {
              ...d,
              total_donated: newPaid,
              paid_amount: newPaid,
              pending_amount: Math.max(0, newTarget - newPaid),
              donations_count: Math.max(0, (Number(d.donations_count) || 0) - 1),
              status: newPaid >= newTarget && newTarget > 0 ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid')
            };
          }
          return d;
        });
        setLocalStore('donors', updatedDonors);
        // Also remove associated receipt
        const receipts = getLocalStore('receipts', []);
        const updatedReceipts = receipts.filter(r =>
          String(r.id) !== String(id) &&
          String(r.transaction_id) !== String(deletedItem.transaction_id) &&
          String(r.receipt_number) !== String(deletedItem.receipt_number)
        );
        setLocalStore('receipts', updatedReceipts);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('shirol_data_updated'));
        window.dispatchEvent(new Event('storage'));
        broadcastDataChange();
      }

      return { success: true, message: 'व्यवहार हटवला.' };
    }

    let incomeList = getLocalStore('income', []);

    // Filter by query parameters if provided
    let params = options.params || {};
    if (endpoint.includes('?')) {
      const urlSearchParams = new URLSearchParams(endpoint.split('?')[1]);
      const queryParams = Object.fromEntries(urlSearchParams.entries());
      params = { ...queryParams, ...params };
    }

    let filtered = [...incomeList];
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(item =>
        (item.donor_name && item.donor_name.toLowerCase().includes(q)) ||
        (item.receipt_number && item.receipt_number.toLowerCase().includes(q)) ||
        (item.transaction_id && item.transaction_id.toLowerCase().includes(q)) ||
        (item.mobile && item.mobile.includes(q)) ||
        (item.purpose && item.purpose.toLowerCase().includes(q)) ||
        String(item.amount).includes(q)
      );
    }

    if (params.category && params.category !== 'all') {
      filtered = filtered.filter(item => (item.category || 'vargani') === params.category);
    }

    if (params.payment_method && params.payment_method !== 'all') {
      filtered = filtered.filter(item => (item.payment_method || 'cash') === params.payment_method);
    }

    const totalAmount = filtered.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 15));
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const pagedData = filtered.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      data: pagedData,
      pagination: {
        total,
        totalPages,
        totalAmount,
        page,
        limit
      }
    };
  }

  // Handle Expenses Endpoints
  if (endpoint.startsWith('/expenses')) {
    let expensesList = getLocalStore('expenses', []);
    const user = JSON.parse(localStorage.getItem('ganpati_mandal_user') || '{}');

    if (options.method === 'POST') {
      let bodyData = {};
      if (options.body instanceof FormData) {
        options.body.forEach((val, key) => { bodyData[key] = val; });
      } else {
        bodyData = JSON.parse(options.body || '{}');
      }
      const status = 'pending';

      const newExpense = {
        id: Date.now(),
        expense_id: `EXP-2026-${String(expensesList.length + 1).padStart(5, '0')}`,
        description: bodyData.description || '',
        amount: Number(bodyData.amount) || 0,
        category: bodyData.category || 'other',
        payment_method: bodyData.payment_method || 'cash',
        paid_to: bodyData.paid_to || '',
        bill_number: bodyData.bill_number || '',
        bill_attachment_url: bodyData.bill_attachment_url || bodyData.attachment_url || '',
        status: 'pending',
        requested_by_id: user.id || null,
        requested_by_name: user.name || 'स्वयंसेवक',
        approved_by_id: null,
        approved_by_name: null,
        approved_at: null,
        notes: bodyData.notes || '',
        created_at: new Date().toISOString()
      };
      const updated = [newExpense, ...expensesList];
      setLocalStore('expenses', updated);
      return {
        success: true,
        message: status === 'pending'
          ? 'खर्च यशस्वीरित्या नोंदवला व मंजुरीसाठी पाठवला आहे / Sent for approval.'
          : 'खर्च यशस्वीरित्या नोंदवला व मंजूर झाला / Expense approved.',
        data: newExpense
      };
    }

    if (options.method === 'PUT' && endpoint.includes('/approve')) {
      const parts = endpoint.split('/');
      const expenseId = parts[2];
      expensesList = expensesList.map(exp => {
        if (String(exp.id) === String(expenseId) || String(exp.expense_id) === String(expenseId)) {
          return {
            ...exp,
            status: 'approved',
            approved_by_id: user.id || 1,
            approved_by_name: user.name || 'अध्यक्ष (Admin)',
            approved_at: new Date().toISOString()
          };
        }
        return exp;
      });
      setLocalStore('expenses', expensesList);
      return { success: true, message: 'खर्च यशस्वीरित्या मंजूर करण्यात आला.' };
    }

    if (options.method === 'PUT' && endpoint.includes('/reject')) {
      const parts = endpoint.split('/');
      const expenseId = parts[2];
      const bodyData = JSON.parse(options.body || '{}');
      expensesList = expensesList.map(exp => {
        if (String(exp.id) === String(expenseId) || String(exp.expense_id) === String(expenseId)) {
          return {
            ...exp,
            status: 'rejected',
            notes: `${exp.notes ? `${exp.notes} | ` : ''}Reason: ${bodyData.reason || 'नाही'}`
          };
        }
        return exp;
      });
      setLocalStore('expenses', expensesList);
      return { success: true, message: 'खर्च नामंजूर करण्यात आला.' };
    }

    if (options.method === 'DELETE') {
      const id = endpoint.split('/expenses/')[1];
      const filtered = expensesList.filter(item => String(item.id) !== String(id));
      setLocalStore('expenses', filtered);
      return { success: true, message: 'खर्च हटवला.' };
    }

    // GET Request - handle filtering
    let filteredList = [...expensesList];
    const urlObj = new URL(endpoint, 'http://dummy.local');
    const statusParam = urlObj.searchParams.get('status');
    const categoryParam = urlObj.searchParams.get('category');
    const searchParam = urlObj.searchParams.get('search');

    if (statusParam) {
      const statusArr = statusParam.split(',').map(s => s.trim());
      filteredList = filteredList.filter(e => statusArr.includes(e.status));
    }
    if (categoryParam && categoryParam !== 'all') {
      filteredList = filteredList.filter(e => e.category === categoryParam);
    }
    if (searchParam) {
      const s = searchParam.toLowerCase();
      filteredList = filteredList.filter(e =>
        (e.description && e.description.toLowerCase().includes(s)) ||
        (e.paid_to && e.paid_to.toLowerCase().includes(s)) ||
        (e.bill_number && e.bill_number.toLowerCase().includes(s))
      );
    }

    return { success: true, data: filteredList };
  }

  // Handle Donors Endpoints (Universal donor lifecycle without blacklist)
  if (endpoint.startsWith('/donors')) {
    let donorsList = getLocalStore('donors', []);
    const incomeList = getLocalStore('income', []);

    if (options.method === 'POST') {
      const bodyData = JSON.parse(options.body || '{}');

      // Support Bulk Donors addition
      if (Array.isArray(bodyData.donors)) {
        const newDonors = bodyData.donors.map((d, index) => {
          const target = Number(d.target_amount || d.amount || 500);
          const paid = Number(d.paid_amount || d.total_donated || 0);
          return {
            id: Date.now() + index,
            name: d.name,
            mobile: d.mobile || '',
            email: d.email || '',
            address: d.address || '',
            area: d.area || 'शिरोळ',
            notes: d.notes || 'बल्क नोंदणी',
            target_amount: target,
            total_donated: paid,
            paid_amount: paid,
            pending_amount: Math.max(0, target - paid),
            donations_count: paid > 0 ? 1 : 0,
            status: paid >= target && target > 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid'),
            last_donated_at: new Date().toISOString()
          };
        });
        donorsList = [...newDonors, ...donorsList];
        setLocalStore('donors', donorsList);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('shirol_data_updated'));
          window.dispatchEvent(new Event('storage'));
          broadcastDataChange();
        }

        return {
          success: true,
          message: `${newDonors.length} देणगीदार यशस्वीरित्या जोडले!`,
          data: newDonors
        };
      }

      const target = Number(bodyData.target_amount || bodyData.total_donated || bodyData.amount || 500);
      const paid = Number(bodyData.paid_amount || bodyData.total_donated || 0);
      const newDonor = {
        id: Date.now(),
        name: bodyData.name,
        mobile: bodyData.mobile || '',
        email: bodyData.email || '',
        address: bodyData.address || '',
        area: bodyData.area || 'शिरोळ',
        notes: bodyData.notes || '',
        target_amount: target,
        total_donated: paid,
        paid_amount: paid,
        pending_amount: Math.max(0, target - paid),
        donations_count: paid > 0 ? 1 : 0,
        status: paid >= target && target > 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid'),
        last_donated_at: new Date().toISOString()
      };
      donorsList = [newDonor, ...donorsList];
      setLocalStore('donors', donorsList);

      // Clean up from deleted_donors tombstone if re-adding
      try {
        const existingDeleted = getLocalStore('deleted_donors', []);
        if (existingDeleted.length > 0) {
          const targetName = (bodyData.name || '').trim().toLowerCase();
          const filtered = existingDeleted.filter(d => !d.name || d.name.trim().toLowerCase() !== targetName);
          localStorage.setItem('shirol_deleted_donors', JSON.stringify(filtered));
        }
      } catch (e) {}

      // If donor was added with paid amount, also add an income transaction so dashboard total updates
      if (paid > 0) {
        let maxReceiptNum = 0;
        incomeList.forEach(inc => {
          if (inc.receipt_number) {
            const m = inc.receipt_number.match(/(\d+)$/);
            if (m) {
              const n = parseInt(m[1], 10);
              if (!isNaN(n) && n > maxReceiptNum && n < 999999) maxReceiptNum = n;
            }
          }
        });
        const count = Math.max(incomeList.length, maxReceiptNum) + 1;
        const formattedNum = String(count).padStart(6, '0');
        const settings = getLocalStore('mandal_settings_custom', SHIROL_MANDAL_SETTINGS);
        const receiptNo = `${settings.receipt_prefix || 'HANUMAN-2026-'}${formattedNum}`;
        const newIncome = {
          id: Date.now() + 1,
          transaction_id: `TXN-2026-${formattedNum}`,
          receipt_number: receiptNo,
          donor_name: bodyData.name,
          donor_id: newDonor.id,
          mobile: bodyData.mobile || '',
          address: bodyData.address || '',
          amount: paid,
          payment_method: bodyData.payment_method || 'cash',
          category: 'vargani',
          purpose: 'श्री गणेशोत्सव वर्गणी',
          collector_name: 'सुमेध गवडे (अध्यक्ष)',
          amount_in_words_mr: numberToWordsMarathi(paid),
          amount_in_words_en: numberToWordsEnglish(paid),
          created_at: new Date().toISOString()
        };
        setLocalStore('income', [newIncome, ...incomeList]);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('shirol_data_updated'));
        window.dispatchEvent(new Event('storage'));
        broadcastDataChange();
      }

      return { success: true, message: 'देणगीदार यशस्वीरित्या जोडला!', data: newDonor };
    }

    if (options.method === 'PUT') {
      const parts = endpoint.split('?')[0].split('/');
      const donorId = parts[parts.length - 1];
      const bodyData = JSON.parse(options.body || '{}');

      donorsList = donorsList.map(d => {
        const matchId = (donorId && String(d.id) === String(donorId)) || (bodyData.id && String(d.id) === String(bodyData.id));
        const matchName = (bodyData.originalName && d.name?.toLowerCase() === bodyData.originalName?.toLowerCase()) ||
                          (bodyData.name && d.name?.toLowerCase() === bodyData.name?.toLowerCase());
        const matchMobile = bodyData.mobile && d.mobile && (d.mobile.replace(/\D/g, '') === bodyData.mobile.replace(/\D/g, ''));

        if (matchId || matchName || matchMobile) {
          const target = bodyData.target_amount !== undefined ? Number(bodyData.target_amount) : Number(d.target_amount || 500);
          const paid = bodyData.paid_amount !== undefined ? Number(bodyData.paid_amount) : Number(d.paid_amount || d.total_donated || 0);
          return {
            ...d,
            target_amount: target,
            total_donated: paid,
            paid_amount: paid,
            pending_amount: Math.max(0, target - paid),
            status: (paid >= target && target > 0) ? 'paid' : (paid > 0 ? 'partial' : 'unpaid'),
            name: bodyData.name || d.name,
            mobile: bodyData.mobile !== undefined ? bodyData.mobile : d.mobile,
            area: bodyData.area || d.area,
            address: bodyData.address !== undefined ? bodyData.address : d.address
          };
        }
        return d;
      });

      setLocalStore('donors', donorsList);

      if (bodyData.paid_amount !== undefined || bodyData.name) {
        let localIncome = getLocalStore('income', []);
        let found = false;
        const newPaid = Number(bodyData.paid_amount);
        localIncome = localIncome.map(inc => {
          const matchInc = (bodyData.originalName && inc.donor_name?.toLowerCase() === bodyData.originalName?.toLowerCase()) ||
                           (bodyData.name && inc.donor_name?.toLowerCase() === bodyData.name?.toLowerCase()) ||
                           (donorId && String(inc.donor_id) === String(donorId));
          if (matchInc) {
            found = true;
            return {
              ...inc,
              amount: !isNaN(newPaid) && newPaid >= 0 ? newPaid : inc.amount,
              donor_name: bodyData.name || inc.donor_name,
              mobile: bodyData.mobile !== undefined ? bodyData.mobile : inc.mobile,
              address: bodyData.address !== undefined ? bodyData.address : inc.address
            };
          }
          return inc;
        });

        if (!found && !isNaN(newPaid) && newPaid > 0) {
          const formattedNum = String(localIncome.length + 1).padStart(6, '0');
          localIncome.unshift({
            id: Date.now(),
            transaction_id: `TXN-2026-${formattedNum}`,
            receipt_number: `HANUMAN-2026-${formattedNum}`,
            donor_id: donorId,
            donor_name: bodyData.name || 'देणगीदार',
            mobile: bodyData.mobile || '',
            address: bodyData.address || '',
            amount: newPaid,
            payment_method: 'cash',
            category: 'vargani',
            purpose: 'श्री गणेशोत्सव वर्गणी',
            collector_name: 'अध्यक्ष (Admin)',
            status: 'completed',
            is_deleted: false,
            created_at: new Date().toISOString()
          });
        }
        setLocalStore('income', localIncome);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('shirol_data_updated'));
        window.dispatchEvent(new Event('storage'));
        broadcastDataChange();
      }

      return { success: true, message: 'देणगीदाराची माहिती यशस्वीरित्या अद्ययावत केली!', data: donorsList };
    }


    if (options.method === 'DELETE') {
      handleLocalDonorDeletion(endpoint, options);
      return { success: true, message: 'देणगीदार व संबंधित सर्व जमा नोंदी यशस्वीरित्या हटवल्या!' };
    }

    // Process & calculate paid amount by matching name/phone with live income transactions
    const processedDonors = donorsList.map(d => {
      const matchingPayments = incomeList.filter(inc => {
        if (inc.is_deleted) return false;
        const nameMatch = inc.donor_name && d.name && (
          inc.donor_name.trim().toLowerCase() === d.name.trim().toLowerCase()
        );
        const mobileMatch = d.mobile && inc.mobile && (
          d.mobile.replace(/\D/g, '') === inc.mobile.replace(/\D/g, '') && d.mobile.replace(/\D/g, '').length >= 10
        );
        return nameMatch || mobileMatch;
      });

      const paid_amount = matchingPayments.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
      const target_amount = Number(d.target_amount || d.total_donated || 500);
      const pending_amount = Math.max(0, target_amount - paid_amount);
      const donations_count = matchingPayments.length;

      let status = 'unpaid';
      if (paid_amount >= target_amount && target_amount > 0) {
        status = 'paid';
      } else if (paid_amount > 0) {
        status = 'partial';
      }

      return {
        ...d,
        target_amount,
        paid_amount,
        pending_amount,
        donations_count,
        status,
        matchingPayments
      };
    });

    // Check income records that are not yet in donorsList
    incomeList.forEach(inc => {
      if (inc.is_deleted) return;
      const incNameClean = (inc.donor_name || '').trim().toLowerCase();
      if (!incNameClean) return;

      if (!processedDonors.some(d => d.name.trim().toLowerCase() === incNameClean || (inc.mobile && d.mobile && d.mobile.replace(/\D/g, '') === inc.mobile.replace(/\D/g, '') && inc.mobile.replace(/\D/g, '').length >= 10))) {
        const paid_amount = Number(inc.amount) || 0;
        processedDonors.push({
          id: inc.id || Date.now(),
          name: inc.donor_name,
          mobile: inc.mobile || '',
          address: inc.address || '',
          area: inc.area || 'शिरोळ',
          target_amount: paid_amount,
          paid_amount: paid_amount,
          pending_amount: 0,
          donations_count: 1,
          status: 'paid',
          last_donated_at: inc.created_at || new Date().toISOString()
        });
      }
    });

    // Summary: totalPaid MUST equal raw income sum (same as dashboard) to prevent mismatch
    // Do NOT use processedDonors.paid_amount sum as it can double-count
    const totalTarget = processedDonors.reduce((sum, d) => sum + (Number(d.target_amount) || 0), 0);
    const totalPaid = incomeList.filter(i => !i.is_deleted).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalPending = Math.max(0, totalTarget - totalPaid);

    const summary = {
      totalDonors: processedDonors.length,
      totalTarget,
      totalPaid,
      totalPending,
      grandTotal: totalPaid
    };

    if (endpoint.includes('/search')) {
      const urlObj = new URL(endpoint, 'http://dummy.local');
      const q = (options.params?.q || urlObj.searchParams.get('q') || '').toLowerCase();
      const filtered = processedDonors.filter(d =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.mobile && d.mobile.includes(q)) ||
        (d.area && d.area.toLowerCase().includes(q))
      );
      return { success: true, data: filtered, summary };
    }
    return { success: true, data: processedDonors, summary };
  }

  // Handle Receipts Lookup & Public Verification Endpoints
  if (endpoint.startsWith('/receipts') || endpoint.startsWith('/public/verify-receipt')) {
    const receipts = getLocalStore('receipts', []);
    const incomeList = getLocalStore('income', []);
    const parts = endpoint.split('/');
    const rawQuery = parts[parts.length - 1];
    const queryNo = decodeURIComponent(rawQuery).trim();
    const cleanQuery = queryNo.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // 1. Check in receipts store
    let receipt = receipts.find(r =>
      (r.receipt_number && r.receipt_number.trim() === queryNo) ||
      String(r.id) === queryNo ||
      (r.receipt_number && r.receipt_number.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanQuery)
    );

    // 2. Check in income list
    if (!receipt) {
      const inc = incomeList.find((i, idx) =>
        (i.receipt_number && i.receipt_number.trim() === queryNo) ||
        (i.receipt_number && i.receipt_number.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanQuery) ||
        String(i.id) === queryNo ||
        String(idx + 1) === queryNo ||
        `HANUMAN-2026-${String(idx + 1).padStart(6, '0')}` === queryNo ||
        `HANUMAN-2026-${String(i.id).padStart(6, '0')}` === queryNo
      );
      if (inc) {
        receipt = {
          id: inc.id,
          receipt_number: inc.receipt_number || `HANUMAN-2026-${String(inc.id).padStart(6, '0')}`,
          donor_name: inc.donor_name,
          mobile: inc.mobile,
          address: inc.address,
          amount: inc.amount,
          amount_in_words_mr: inc.amount_in_words_mr,
          amount_in_words_en: inc.amount_in_words_en,
          payment_method: inc.payment_method,
          category: inc.category,
          purpose: inc.purpose,
          collector_name: inc.collector_name || 'खजिनदार',
          created_at: inc.created_at
        };
      }
    }

    // 3. Demo Fallback sample receipts
    if (!receipt && (cleanQuery.includes('hanuman2026000001') || cleanQuery === '1')) {
      receipt = {
        id: 1,
        receipt_number: 'HANUMAN-2026-000001',
        donor_name: 'आदरणीय राहुल चव्हाण',
        mobile: '9822012345',
        address: 'नदीवेस, शिरोळ',
        amount: 2100,
        amount_in_words_mr: 'दोन हजार शंभर रुपये फक्त',
        amount_in_words_en: 'Two Thousand One Hundred Rupees Only',
        payment_method: 'cash',
        category: 'vargani',
        purpose: 'गणेशोत्सव वर्गणी',
        collector_name: 'सुमेध गवडे (अध्यक्ष)',
        created_at: '2026-09-09T18:00:00.000Z'
      };
    }

    if (!receipt && (cleanQuery.includes('hanuman2026000002') || cleanQuery === '2' || cleanQuery === '000002')) {
      receipt = {
        id: 2,
        receipt_number: 'HANUMAN-2026-000002',
        donor_name: 'निखिल गवडे (Nikhil Gavade)',
        mobile: '9823012345',
        address: 'नदीवेस, शिरोळ',
        amount: 5000,
        amount_in_words_mr: 'पाच हजार रुपये फक्त',
        amount_in_words_en: 'Five Thousand Rupees Only',
        payment_method: 'upi',
        category: 'vargani',
        purpose: 'श्री गणेशोत्सव वर्गणी / देणगी',
        collector_name: 'सुमेध गवडे (अध्यक्ष)',
        created_at: '2026-09-14T10:00:00.000Z'
      };
    }

    if (receipt) {
      const mandalSettings = getLocalStore('mandal_settings_custom', SHIROL_MANDAL_SETTINGS);
      return {
        success: true,
        valid: true,
        data: {
          receipt,
          receiptNumber: receipt.receipt_number,
          donorNameSafe: receipt.donor_name,
          amount: receipt.amount,
          date: receipt.created_at,
          paymentMethod: receipt.payment_method === 'cash' ? 'रोख (Cash)' : receipt.payment_method === 'upi' ? 'UPI / QR' : receipt.payment_method,
          purpose: receipt.purpose || 'श्री गणेशोत्सव वर्गणी',
          mandal: {
            nameMr: mandalSettings.name_mr,
            address: mandalSettings.address_mr,
            registrationNo: mandalSettings.registration_no,
            festivalYear: mandalSettings.festival_year
          }
        }
      };
    } else {
      return {
        success: false,
        valid: false,
        message: 'ही पावती अवैध आहे किंवा सिस्टीममध्ये नोंद आढळली नाही.'
      };
    }
  }

  // Fallback default network request for Auth and other APIs
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('ganpati_mandal_token');
      localStorage.removeItem('ganpati_mandal_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`API Fallback for ${endpoint}:`, error);
    return { success: false, message: 'नेटवर्क कनेक्ट समस्या.' };
  }
}

export const api = {
  get: (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return request(url, { method: 'GET', params });
  },

  post: (endpoint, body) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  },

  put: (endpoint, body) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body)
    });
  },

  delete: (endpoint, body) => {
    const isFormData = body instanceof FormData;
    let url = endpoint;
    if (body && !isFormData && typeof body === 'object') {
      const qParams = new URLSearchParams();
      if (body.name) qParams.set('name', body.name);
      if (body.mobile) qParams.set('mobile', body.mobile);
      const qStr = qParams.toString();
      if (qStr) {
        url = url.includes('?') ? `${url}&${qStr}` : `${url}?${qStr}`;
      }
    }
    return request(url, {
      method: 'DELETE',
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined
    });
  }
};

export default api;
