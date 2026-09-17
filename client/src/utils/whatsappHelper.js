import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatDate } from './dateUtils';

/**
 * Builds a clean, simple Marathi WhatsApp thank you message to accompany receipt image
 */
export function buildWhatsAppReceiptMessage(receipt, mandal) {
  const mandalName = mandal?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ';
  const donorName = receipt?.donor_name || 'देणगीदार';
  const amount = Number(receipt?.amount || 0).toLocaleString('en-IN');

  return `🚩 *${mandalName}* 🚩

🙏 *आदरणीय ${donorName}*,
मंडळाच्या गणेशोत्सवासाठी आपल्या ₹${amount} वर्गणी / देणगीबद्दल मनःपूर्वक धन्यवाद! 🌺

🚩 *गणपती बाप्पा मोरया! मंगलमूर्ती मोरया!* 🚩`;
}

/**
 * Directly opens WhatsApp Web or App with pre-filled message targeted to registered mobile
 */
export function openWhatsAppReceipt(receipt, mandal, autoSend = true) {
  const rawMobile = receipt?.mobile ? String(receipt.mobile).replace(/\D/g, '') : '';
  const message = buildWhatsAppReceiptMessage(receipt, mandal);
  const encodedText = encodeURIComponent(message);

  let targetUrl = '';
  if (rawMobile && rawMobile.length >= 10) {
    let cleanMobile = rawMobile;
    if (cleanMobile.length === 11 && cleanMobile.startsWith('0')) {
      cleanMobile = cleanMobile.slice(1);
    }
    const formattedNum = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    targetUrl = `https://api.whatsapp.com/send?phone=${formattedNum}&text=${encodedText}`;
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
 * Copies the receipt image directly to clipboard for Ctrl+V pasting in WhatsApp Web
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
 * Shares HD Receipt image or PDF directly to donor's registered WhatsApp number
 */
export async function shareReceiptFile(receiptElement, receipt, mandal, format = 'image') {
  if (!receiptElement) throw new Error('Receipt element not found');
  const receiptNo = receipt?.receipt_number || receipt?.receiptNo || 'Receipt';

  if (format === 'pdf') {
    await downloadReceiptPdf(receiptElement, receipt);
    openWhatsAppReceipt(receipt, mandal, true);
    return 'downloaded_and_opened';
  }

  const canvas = await generateReceiptCanvas(receiptElement);

  // Try Web Share API (native image share on mobile Chrome / Safari / Android)
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const file = new File([blob], `Receipt_${receiptNo}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          const shareText = buildWhatsAppReceiptMessage(receipt, mandal);
          await navigator.share({
            title: `डिजिटल वर्गणी पावती - ${receiptNo}`,
            text: shareText,
            files: [file]
          });
          return 'shared';
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Native share failed, falling back to download & WhatsApp opening:', err);
      } else {
        return 'aborted';
      }
    }
  }

  // Desktop or unsupported share fallback: Copy to clipboard + Download PNG + Open WhatsApp
  try {
    await copyReceiptImageToClipboard(receiptElement);
  } catch (e) {
    // Ignore clipboard errors
  }

  await downloadReceiptImage(receiptElement, receipt);
  openWhatsAppReceipt(receipt, mandal, true);
  return 'downloaded_and_opened';
}

