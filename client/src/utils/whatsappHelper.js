import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatDate } from './dateUtils';

/**
 * Extracts and sanitizes the donor's 10-digit mobile number from receipt
 */
export function getCleanMobileNumber(receipt) {
  if (!receipt) return '';
  const possible = receipt.mobile ?? receipt.phone ?? receipt.donor_phone ?? receipt.contact ?? receipt.donorMobile ?? '';
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
 * Builds a clean, respectful Marathi WhatsApp message to accompany receipt image
 */
export function buildWhatsAppReceiptMessage(receipt, mandal) {
  const mandalName = mandal?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ';
  const tagline = mandal?.tagline_mr || '॥ नदीवेस चा राजा ॥ (स्थापना १९६४ | वर्ष ६२ वे)';
  const donorName = receipt?.donor_name || 'देणगीदार';
  const amount = Number(receipt?.amount || 0).toLocaleString('en-IN');
  const receiptNo = receipt?.receipt_number || receipt?.receiptNo || 'HANUMAN-2026-000001';
  const date = receipt?.created_at ? formatDate(receipt.created_at, 'mr') : '१७ सप्टेंबर २०२६';

  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://hanuman-talim.vercel.app';
  const receiptUrl = `${origin}/verify-receipt/${encodeURIComponent(receiptNo)}`;

  return `🚩 *${mandalName}* 🚩
${tagline}

🙏 *सस्नेह नमस्कार ${donorName} जी*,
श्री गणेशोत्सव २०२६ साठी आपल्याकडून *₹${amount}* वर्गणी / देणगी प्राप्त झाली आहे. मंडळाकडून आपले मनःपूर्वक आभार! 🌺

🧾 *पावती क्रमांक:* ${receiptNo}
📅 *दिनांक:* ${date}

📸 *आपली अधिकृत HD रंगीत पावती पाहण्यासाठी व डाऊनलोड करण्यासाठी खालील लिंकवर क्लिक करा:*
👉 ${receiptUrl}

🚩 *गणपती बाप्पा मोरया! मंगलमूर्ती मोरया!* 🚩`;
}

/**
 * Directly opens WhatsApp Web or App with pre-filled message targeted to registered mobile
 */
export function openWhatsAppReceipt(receipt, mandal, autoSend = true, options = {}) {
  const formattedNum = getFormattedWhatsAppNumber(receipt);
  const message = buildWhatsAppReceiptMessage(receipt, mandal);
  const encodedText = encodeURIComponent(message);

  let targetUrl = '';
  if (formattedNum) {
    if (options.useAppProtocol) {
      targetUrl = `whatsapp://send?phone=${formattedNum}&text=${encodedText}`;
    } else {
      targetUrl = `https://api.whatsapp.com/send?phone=${formattedNum}&text=${encodedText}`;
    }
  } else {
    targetUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  if (autoSend && typeof window !== 'undefined') {
    window.open(targetUrl, '_blank');
  }
  return targetUrl;
}

/**
 * Generates an ultra high-definition (HD 3x) HTML canvas element from receipt DOM ref
 */
export async function generateReceiptCanvas(receiptElement) {
  if (!receiptElement) throw new Error('Receipt element not found');

  return await html2canvas(receiptElement, {
    scale: 3, // Ultra HD High Resolution (3x Pixel Density)
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    allowTaint: true
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
 */
export async function shareReceiptNativeApp(receiptElement, receipt, mandal) {
  if (!receiptElement) throw new Error('Receipt element not found');
  const receiptNo = receipt?.receipt_number || receipt?.receiptNo || 'Receipt';
  const canvas = await generateReceiptCanvas(receiptElement);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to create image blob');

  const file = new File([blob], `Receipt_${receiptNo}.png`, { type: 'image/png' });
  const shareText = buildWhatsAppReceiptMessage(receipt, mandal);

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: `डिजिटल वर्गणी पावती - ${receiptNo}`,
      text: shareText,
      files: [file]
    });
    return { status: 'shared', mode: 'native_file' };
  }
  throw new Error('Native file share not supported on this device');
}

/**
 * Primary HD Receipt Share Handler:
 * 1. Generates 3x HD image.
 * 2. Copies HD image to clipboard.
 * 3. Downloads PNG file.
 * 4. Opens WhatsApp directly targeted to donor's mobile number.
 */
export async function shareReceiptFile(receiptElement, receipt, mandal, format = 'image') {
  if (!receiptElement) throw new Error('Receipt element not found');
  const receiptNo = receipt?.receipt_number || receipt?.receiptNo || 'Receipt';
  const displayMobile = getDisplayMobileNumber(receipt);

  if (format === 'pdf') {
    await downloadReceiptPdf(receiptElement, receipt);
    openWhatsAppReceipt(receipt, mandal, true);
    return { status: 'downloaded_and_opened', mode: 'pdf', displayMobile };
  }

  // 1. Generate Ultra HD Canvas (3x scale)
  const canvas = await generateReceiptCanvas(receiptElement);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to create image blob');

  const file = new File([blob], `Receipt_${receiptNo}.png`, { type: 'image/png' });
  const shareText = buildWhatsAppReceiptMessage(receipt, mandal);

  // 2. If mobile device supports direct file share via Web Share API
  const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
  if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `डिजिटल वर्गणी पावती - ${receiptNo}`,
        text: shareText,
        files: [file]
      });
      return { status: 'shared', mode: 'native_file', displayMobile };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { status: 'aborted', mode: 'native_file', displayMobile };
      }
      console.warn('Native share failed, falling back to clipboard + open WhatsApp:', err);
    }
  }

  // 3. Desktop or fallback mode:
  // a) Copy HD PNG image to clipboard for instant Ctrl+V pasting in WhatsApp
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

  // b) Auto-download the HD PNG image file
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

  // c) Open WhatsApp with pre-filled message containing direct link to the HD receipt targeted to mobile
  openWhatsAppReceipt(receipt, mandal, true);

  return {
    status: 'copied_and_opened',
    mode: 'desktop_clipboard_download',
    copiedToClipboard,
    displayMobile
  };
}
