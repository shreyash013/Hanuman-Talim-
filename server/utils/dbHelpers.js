export function throwIfError(error) {
  if (error) throw error;
}

export function safeSearchTerm(value = '') {
  return String(value).trim().replace(/[(),]/g, ' ');
}

export function istDayBounds(dateString) {
  const start = new Date(`${dateString}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function istDateKey(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));
}

export function toBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export function sum(rows, selector = row => row.amount) {
  return (rows || []).reduce((total, row) => total + (Number(selector(row)) || 0), 0);
}

export function countByAndSum(rows, keyName, amountName = 'amount') {
  const map = new Map();
  for (const row of rows || []) {
    const key = row[keyName] ?? 'इतर';
    const current = map.get(key) || { [keyName]: key, count: 0, total_amount: 0 };
    current.count += 1;
    current.total_amount += Number(row[amountName]) || 0;
    map.set(key, current);
  }
  return [...map.values()];
}

export function expandBilingualSearchTerms(searchTerm = '') {
  if (!searchTerm) return [];
  const s = String(searchTerm).trim();
  if (!s) return [];
  const terms = new Set([s]);

  // Transliteration pairs for common Marathi names/surnames in Shirol Mandal
  const pairs = [
    ['पृथ्वीराज', 'Prithviraj'],
    ['गवडे', 'Gavade'],
    ['गावडे', 'Gavade'],
    ['माने', 'Mane'],
    ['दुबल', 'Dubal'],
    ['इंगळे', 'Ingale'],
    ['इंगले', 'Ingale'],
    ['निखिल', 'Nikhil'],
    ['शिवराज', 'Shivraj'],
    ['अथर्व', 'Atharv'],
    ['विशाल', 'Vishal'],
    ['महेश', 'Mahesh'],
    ['दीपक', 'Deepak'],
    ['ओमकार', 'Omkar'],
    ['फत्तेसिंग', 'Fattesing'],
    ['सुरज', 'Suraj'],
    ['प्रतिक', 'Pratik'],
    ['वैभव', 'Vaibhav'],
    ['प्रसाद', 'Prasad'],
    ['सचिन', 'Sachin'],
    ['प्रवीण', 'Pravin'],
    ['प्रविण', 'Pravin'],
    ['अंबादास', 'Ambadas'],
    ['सुमेध', 'Sumedh'],
    ['श्रेयश', 'Shreyash'],
    ['श्रेयस', 'Shreyash']
  ];

  for (const [mr, en] of pairs) {
    if (s.includes(mr)) {
      terms.add(s.replace(new RegExp(mr, 'g'), en));
      terms.add(en);
    }
    if (s.toLowerCase().includes(en.toLowerCase())) {
      terms.add(s.replace(new RegExp(en, 'gi'), mr));
      terms.add(mr);
    }
  }

  return Array.from(terms).filter(Boolean);
}

