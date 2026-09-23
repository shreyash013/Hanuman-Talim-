export function formatDate(dateString, lang = 'mr') {
  if (!dateString) return '';
  try {
    const monthsMr = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
    const monthsHi = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const cleanStr = String(dateString).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const [y, m, d] = cleanStr.split('-').map(Number);
      if (lang === 'mr') return `${d} ${monthsMr[m - 1]} ${y}`;
      if (lang === 'hi') return `${d} ${monthsHi[m - 1]} ${y}`;
      return `${d} ${monthsEn[m - 1]}, ${y}`;
    }

    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const day = d.getDate();
    const year = d.getFullYear();

    if (lang === 'mr') {
      return `${day} ${monthsMr[d.getMonth()]} ${year}`;
    } else if (lang === 'hi') {
      return `${day} ${monthsHi[d.getMonth()]} ${year}`;
    } else {
      return `${day} ${monthsEn[d.getMonth()]}, ${year}`;
    }
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString, lang = 'mr') {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const dateFormatted = formatDate(dateString, lang);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? (lang === 'mr' ? 'दु.' : lang === 'hi' ? 'अप.' : 'PM') : (lang === 'mr' ? 'स.' : lang === 'hi' ? 'पू.' : 'AM');
    hours = hours % 12 || 12;

    return `${dateFormatted} | ${hours}:${minutes} ${ampm}`;
  } catch {
    return dateString;
  }
}

export function calculateCountdown(targetDateStr) {
  const target = new Date(targetDateStr || '2026-09-15T09:00:00').getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isPassed: false };
}
