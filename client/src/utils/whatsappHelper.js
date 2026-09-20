import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatDate } from './dateUtils';

/**
 * Extracts and sanitizes the donor's 10-digit mobile number from receipt
 */
export function getCleanMobileNumber(receipt) {
  if (!receipt) return '';
  let possible = receipt.mobile ?? receipt.phone ?? receipt.donor_phone ?? receipt.contact ?? receipt.donorMobile ?? '';

  // If mobile is missing from receipt record, look it up in shirol_donors
  if (!possible && typeof window !== 'undefined') {
    try {
      const rawDonors = localStorage.getItem('shirol_donors');
      if (rawDonors) {
        const donors = JSON.parse(rawDonors);
        if (Array.isArray(donors)) {
          const donorName = (receipt.donor_name || '').trim().toLowerCase();
          const d = donors.find(item => 
            (receipt.donor_id && String(item.id) === String(receipt.donor_id)) ||
            (donorName && item.name && item.name.trim().toLowerCase() === donorName)
          );
          if (d && d.mobile) possible = d.mobile;
        }
      }
    } catch {}
  }

  let digits = String(possible).replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  return digits;
}

/**
 * Formats mobile number for WhatsApp international protocol (e.g. 919822012345)
 */
export function getFormattedWhatsAppNumber(receipt) {
  const clean = getCleanMobileNumber(receipt);
  if (clean && clean.length >= 10) {
    return `91${clean.slice(-10)}`;
  }
  return '';
}

/**
 * Formats mobile number for human display (e.g. +91 98220 12345)
 */
export function getDisplayMobileNumber(receipt) {
  const clean = getCleanMobileNumber(receipt);
  if (clean && clean.length >= 10) {
    const last10 = clean.slice(-10);
    return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
  }
  const raw = receipt?.mobile || receipt?.phone || '';
  return raw ? String(raw).trim() : '';
}

/**
 * Builds a simple, respectful Marathi WhatsApp thank you message to accompany the receipt image
 */
export function buildWhatsAppReceiptMessage(receipt, mandal) {
  const donorName = receipt?.donor_name || 'देणगीदार';
  const amountNumber = Number(receipt?.amount || 0);
  const amount = amountNumber.toLocaleString('en-IN');
  const receiptNo = receipt?.receipt_number || receipt?.receiptNo || 'HANUMAN-2026-000001';

  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://hanuman-talim.vercel.app';
  
  // Clean, compact 1-line verification URL encoding the exact amount and donor name
  const params = new URLSearchParams();
  if (amountNumber > 0) params.set('a', String(amountNumber));
  if (receipt?.donor_name && receipt.donor_name.trim() !== 'देणगीदार') {
    params.set('d', receipt.donor_name.trim());
  }
  const qStr = params.toString();
  const receiptUrl = qStr
    ? `${origin}/verify-receipt/${encodeURIComponent(receiptNo)}?${qStr}`
    : `${origin}/verify-receipt/${encodeURIComponent(receiptNo)}`;

  return `🙏 *सस्नेह नमस्कार ${donorName} जी!* 🚩
श्री हनुमान तालीम मंडळ शिरोळ (वर्ष ६२ वे) गणेशोत्सवासाठी दिलेल्या *₹${amount}* वर्गणीबद्दल आपले मनःपूर्वक आभार! 🌺

🧾 *पावती क्र:* ${receiptNo}
🔗 *सत्यता पडताळणी लिंक:* ${receiptUrl}

🚩 *गणपती बाप्पा मोरया!* 🙏`;
}

/**
 * Directly opens WhatsApp Web or App with pre-filled message targeted to registered mobile
 */
export function openWhatsAppReceipt(receipt, mandal, autoSend = true, options = {}) {
  const formattedNum = getFormattedWhatsAppNumber(receipt);
  const message = buildWhatsAppReceiptMessage(receipt, mandal);
  const encodedText = encodeURIComponent(message);

  const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');

  let targetUrl = '';
  if (formattedNum) {
    if (isMobile) {
      // On mobile: use whatsapp:// deep link to directly open the WhatsApp app with the contact
      targetUrl = `whatsapp://send?phone=${formattedNum}&text=${encodedText}`;
    } else {
      // On desktop: use api.whatsapp.com which pre-fills the contact number
      targetUrl = `https://api.whatsapp.com/send?phone=${formattedNum}&text=${encodedText}`;
    }
  } else {
    targetUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  if (autoSend && typeof window !== 'undefined') {
    if (isMobile) {
      window.location.href = targetUrl;
    } else {
      window.open(targetUrl, '_blank');
    }
  }
  return targetUrl;
}

/**
 * Generates an ultra high-definition (HD 2x) HTML canvas element from receipt DOM ref
 */
export async function generateReceiptCanvas(receiptElement) {
  if (!receiptElement) throw new Error('Receipt element not found');

  // Scroll element into view and wait for all CSS transitions to finish
  receiptElement.scrollIntoView({ block: 'center' });
  await new Promise(resolve => setTimeout(resolve, 120));

  const elemRect = receiptElement.getBoundingClientRect();

  return await html2canvas(receiptElement, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    allowTaint: true,
    foreignObjectRendering: false,
    imageTimeout: 0,
    scrollX: -window.scrollX,
    scrollY: -window.scrollY,
    x: 0,
    y: 0,
    width: elemRect.width || receiptElement.scrollWidth || 540,
    height: elemRect.height || receiptElement.scrollHeight,
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight,
    onclone: (clonedDoc) => {
      // Remove backdrop-blur and similar filters that html2canvas can't render
      clonedDoc.querySelectorAll('*').forEach(el => {
        const style = el.style;
        if (style) {
          if (style.backdropFilter) style.backdropFilter = 'none';
          if (style.webkitBackdropFilter) style.webkitBackdropFilter = 'none';
        }
        // Also remove from computed styles via class override
        const cls = el.getAttribute('class') || '';
        if (cls.includes('backdrop-blur') || cls.includes('backdrop-filter')) {
          el.style.backdropFilter = 'none';
          el.style.webkitBackdropFilter = 'none';
          el.style.background = el.style.background || '#ffffff';
        }
      });
    }
  });
}

/**
 * Downloads the receipt as a PNG image file
 */
export async function downloadReceiptImage(receiptElement, receipt) {
  const canvas = await generateReceiptCanvas(receiptElement);
  const imgData = canvas.toDataURL('image/png');
  const receiptNo = receipt?.receipt_number || receipt?.receiptNo || 'Receipt';
  const link = document.createElement('a');
  link.href = imgData;
  link.download = `Receipt_${receiptNo}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads the receipt as an A5 PDF document
 */
export async function downloadReceiptPdf(receiptElement, receipt) {
  const canvas = await generateReceiptCanvas(receiptElement);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a5');
  const imgWidth = 148;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  const receiptNo = receipt?.receipt_number || receipt?.receiptNo || 'Receipt';
  pdf.save(`Receipt_${receiptNo}.pdf`);
}

/**
 * Copies the receipt image directly to clipboard for Ctrl+V pasting in WhatsApp Web/Desktop
 */
export async function copyReceiptImageToClipboard(receiptElement) {
  const canvas = await generateReceiptCanvas(receiptElement);
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to generate image blob'));
        return;
      }
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          resolve(true);
        } else {
          reject(new Error('Clipboard API not supported'));
        }
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}

/**
 * Shares actual image file via Native Web Share API (Mobile phones / Android / iOS)
 * Shares ONLY the image file with zero text words or captions as requested
 */
export async function shareReceiptNativeApp(receiptElement, receipt) {
  if (!receiptElement) throw new Error('Receipt element not found');
  const receiptNo = receipt?.receipt_number || receipt?.receiptNo || 'Receipt';
  const canvas = await generateReceiptCanvas(receiptElement);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to create image blob');

  const file = new File([blob], `Receipt_${receiptNo}.png`, { type: 'image/png' });

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    // Strictly share the image file only - no title, no text words
    await navigator.share({
      files: [file]
    });
    return { status: 'shared', mode: 'native_file' };
  }
  throw new Error('Native file share not supported on this device');
}

/**
 * Primary HD Receipt Share Handler:
 * 1. Generates 2x HD image.
 * 2. On Mobile / Devices with Web Share API: shares ONLY THE RECEIPT IMAGE directly to WhatsApp (0 words)!
 * 3. On Desktop / Fallback: Opens WhatsApp chat with recipient
 */
export async function shareReceiptFile(receiptElement, receipt, mandal, format = 'image') {
  if (!receiptElement) throw new Error('Receipt element not found');
  const receiptNo = receipt?.receipt_number || receipt?.receiptNo || 'Receipt';
  const displayMobile = getDisplayMobileNumber(receipt);
  const formattedNum = getFormattedWhatsAppNumber(receipt);

  if (format === 'pdf') {
    await downloadReceiptPdf(receiptElement, receipt);
    return { status: 'downloaded_pdf', mode: 'pdf', displayMobile, formattedNum };
  }

  // 1. Generate Ultra HD Canvas (2x scale)
  const canvas = await generateReceiptCanvas(receiptElement);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to create image blob');

  const file = new File([blob], `Receipt_${receiptNo}.png`, { type: 'image/png' });

  // 2. Check if device supports Native File Sharing (Android, iOS, modern Chrome)
  const canShareFiles = typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] });

  if (canShareFiles) {
    try {
      // Send strictly ONLY the image file - not a single caption word
      await navigator.share({
        files: [file]
      });
      return { status: 'shared', mode: 'native_file', displayMobile };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { status: 'aborted', mode: 'native_file', displayMobile };
      }
      console.warn('Native share error, using fallback:', err);
    }
  }

  // 3. Desktop / Browser Fallback:
  // a) Auto-download the HD PNG image file to user's device
  try {
    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `Receipt_${receiptNo}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (dlErr) {
    console.warn('Image download failed:', dlErr);
  }

  // b) Copy HD PNG image to clipboard for instant Ctrl+V pasting
  let copiedToClipboard = false;
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      copiedToClipboard = true;
    }
  } catch (clipErr) {
    console.warn('Clipboard write failed:', clipErr);
  }

  // c) Open WhatsApp chat directly to the recipient's number
  if (formattedNum) {
    const isMobile2 = /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
    const targetUrl = isMobile2
      ? `whatsapp://send?phone=${formattedNum}`
      : `https://api.whatsapp.com/send?phone=${formattedNum}`;
    if (isMobile2) {
      window.location.href = targetUrl;
    } else {
      window.open(targetUrl, '_blank');
    }
  } else {
    window.open('https://web.whatsapp.com', '_blank');
  }

  return {
    status: 'copied_and_opened',
    mode: 'desktop_paste',
    formattedNum,
    displayMobile,
    copiedToClipboard
  };
}

