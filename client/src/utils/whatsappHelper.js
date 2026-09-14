import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatDate } from './dateUtils';

/**
 * Builds a Marathi WhatsApp message for Vargani/Donation receipts
 */
export function buildWhatsAppReceiptMessage(receipt, mandal) {
  const mandalName = mandal?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ';
  const tagline = mandal?.tagline_mr || 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा राजा ॥ 🔱';
  const phone = mandal?.contact_phone || '+91 9356997428';
  const email = mandal?.contact_email || 'shreyashgavade7@gmail.com';
  
  const receiptNo = receipt.receipt_number || receipt.receiptNo || 'HANUMAN-2026-000001';
  const amount = Number(receipt.amount || 0).toLocaleString('en-IN');
  const dateStr = formatDate(receipt.created_at || new Date(), 'mr');
  const purpose = receipt.purpose || 'श्री गणेशोत्सव वर्गणी';
  const paymentMethod = receipt.payment_method === 'cash' ? 'रोख (Cash)' :
                        receipt.payment_method === 'upi' ? 'UPI / QR कोड' :
                        receipt.payment_method === 'bank_transfer' ? 'बँक ट्रान्सफर' :
                        receipt.payment_method === 'pending_udhar' ? 'उधार / बाकी (Pending Credit)' : receipt.payment_method || 'रोख';

  const verificationUrl = `${window.location.origin}/verify-receipt/${receiptNo}`;

  return `🚩 *${mandalName}* 🚩
${tagline}

🙏 *आदरणीय ${receipt.donor_name}*,

मंडळाच्या गणेशोत्सवासाठी आपली वर्गणी / देणगी यशस्वीरित्या जमा झाली आहे.

🧾 *पावती क्रमांक:* ${receiptNo}
💰 *जमा रक्कम:* ₹${amount}
📅 *दिनांक:* ${dateStr}
💳 *पेमेंट प्रकार:* ${paymentMethod}
🎯 *संकल्प / हेतू:* ${purpose}

🔗 *डिजिटल पावती पाहा / डाउनलोड करा:*
${verificationUrl}

📞 *संपर्क:* श्रेयश गवडे (${phone})
📧 *ईमेल:* ${email}

🚩 *गणपती बाप्पा मोरया! मंगलमूर्ती मोरया!* 🚩`;
}

/**
 * Directly opens WhatsApp Web or App with pre-filled message targeted to registered mobile
 */
export function openWhatsAppReceipt(receipt, mandal, autoSend = true) {
  const rawMobile = receipt.mobile ? receipt.mobile.replace(/\D/g, '') : '';
  const message = buildWhatsAppReceiptMessage(receipt, mandal);
  const encodedText = encodeURIComponent(message);

  let targetUrl = '';
  if (rawMobile && rawMobile.length >= 10) {
    const formattedNum = rawMobile.length === 10 ? `91${rawMobile}` : rawMobile;
    targetUrl = `https://api.whatsapp.com/send?phone=${formattedNum}&text=${encodedText}`;
  } else {
    targetUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  if (autoSend) {
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
  if (format === 'pdf') {
    await downloadReceiptPdf(receiptElement, receipt);
  } else {
    await downloadReceiptImage(receiptElement, receipt);
  }
  
  // Directly open WhatsApp targeted to donor's mobile number
  openWhatsAppReceipt(receipt, mandal, true);
  return 'downloaded_and_opened';
}

