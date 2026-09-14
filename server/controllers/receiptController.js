import { db } from '../database/db.js';
import { safeSearchTerm, throwIfError } from '../utils/dbHelpers.js';
import { numberToWordsMarathi, numberToWordsEnglish } from '../utils/marathiNumberWords.js';

async function getMandal(select = '*') {
  try {
    const { data, error } = await db.from('mandal_settings').select(select).limit(1).maybeSingle();
    if (error) console.error('getMandal error:', error);
    return data || {
      name_mr: 'श्री हनुमान तालीम मंडळ शिरोळ',
      name_en: 'Shri Hanuman Talim Mandal Shirol',
      tagline_mr: 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा राजा ॥ 🔱',
      address_mr: 'नदीवेस, शिरोळ, जि. कोल्हापूर | ४१६१०३',
      contact_phone: '+91 9356997428',
      registration_no: 'MAH/KOLHAPUR/1964',
      festival_year: 2026
    };
  } catch (err) {
    return {
      name_mr: 'श्री हनुमान तालीम मंडळ शिरोळ',
      name_en: 'Shri Hanuman Talim Mandal Shirol',
      tagline_mr: 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा राजा ॥ 🔱',
      address_mr: 'नदीवेस, शिरोळ, जि. कोल्हापूर | ४१६१०३',
      contact_phone: '+91 9356997428',
      registration_no: 'MAH/KOLHAPUR/1964',
      festival_year: 2026
    };
  }
}

function constructReceiptFromTx(tx) {
  if (!tx) return null;
  const parsedAmount = Number(tx.amount) || 0;
  return {
    id: tx.receipt_id || tx.id,
    receipt_number: tx.receipt_number || tx.transaction_id,
    transaction_id: tx.transaction_id || `TXN-${tx.id}`,
    donor_name: tx.donor_name,
    mobile: tx.mobile || '',
    address: tx.address || '',
    amount: parsedAmount,
    amount_in_words_mr: numberToWordsMarathi(parsedAmount),
    amount_in_words_en: numberToWordsEnglish(parsedAmount),
    payment_method: tx.payment_method || 'cash',
    category: tx.category || 'vargani',
    purpose: tx.purpose || 'श्री गणेशोत्सव वर्गणी / देणगी',
    collector_name: tx.collector_name || 'खजिनदार / प्रतिनिधी',
    verification_code: `V-${tx.id}-${String(parsedAmount).slice(-3)}`,
    created_at: tx.created_at
  };
}

export async function getReceiptById(req, res) {
  try {
    const receiptId = req.params.id;
    let receipt = null;

    // 1. Try numeric or string id in receipts table
    const { data: directReceipt } = await db.from('receipts').select('*').eq('id', receiptId).maybeSingle();
    if (directReceipt) {
      receipt = directReceipt;
    }

    // 2. Fallback to income_transactions by id or receipt_id
    if (!receipt) {
      const { data: tx } = await db.from('income_transactions')
        .select('*')
        .or(`id.eq.${receiptId},receipt_id.eq.${receiptId}`)
        .eq('is_deleted', false)
        .maybeSingle();

      if (tx) {
        receipt = constructReceiptFromTx(tx);
      }
    }

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'पावती सापडली नाही / Receipt not found.' });
    }

    const mandal = await getMandal();
    return res.json({ success: true, data: { receipt, mandal } });
  } catch (err) {
    console.error('getReceiptById error:', err);
    return res.status(500).json({ success: false, message: 'पावती मिळवताना त्रुटी.' });
  }
}

export async function getReceiptByNumber(req, res) {
  try {
    const rawNumber = decodeURIComponent(req.params.receiptNumber || '').trim();
    if (!rawNumber) {
      return res.status(400).json({ success: false, message: 'पावती क्रमांक आवश्यक आहे.' });
    }

    let receipt = null;

    // 1. Direct search by receipt_number in receipts
    const { data: byNum } = await db.from('receipts').select('*').eq('receipt_number', rawNumber).maybeSingle();
    if (byNum) {
      receipt = byNum;
    }

    // 2. Direct search by verification_code in receipts
    if (!receipt) {
      const { data: byCode } = await db.from('receipts').select('*').eq('verification_code', rawNumber).maybeSingle();
      if (byCode) {
        receipt = byCode;
      }
    }

    // 3. Fallback search in income_transactions by receipt_number or transaction_id
    if (!receipt) {
      const safeNum = safeSearchTerm(rawNumber);
      const { data: tx } = await db.from('income_transactions')
        .select('*')
        .or(`receipt_number.eq.${rawNumber},transaction_id.eq.${rawNumber},receipt_number.ilike.%${safeNum}%,transaction_id.ilike.%${safeNum}%`)
        .eq('is_deleted', false)
        .maybeSingle();

      if (tx) {
        receipt = constructReceiptFromTx(tx);
      }
    }

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'पावती सापडली नाही / Receipt not found.' });
    }

    const mandal = await getMandal();
    return res.json({ success: true, data: { receipt, mandal } });
  } catch (err) {
    console.error('getReceiptByNumber error:', err);
    return res.status(500).json({ success: false, message: 'पावती मिळवताना त्रुटी.' });
  }
}

export async function getAllReceipts(req, res) {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    let query = db.from('receipts').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (search) {
      const s = safeSearchTerm(search);
      query = query.or(`receipt_number.ilike.%${s}%,donor_name.ilike.%${s}%,mobile.ilike.%${s}%`);
    }
    const { data, count, error } = await query.range(offset, offset + limitNum - 1);
    throwIfError(error);
    const total = count || 0;
    return res.json({ success: true, data: data || [], pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 } });
  } catch (err) {
    console.error('getAllReceipts error:', err);
    return res.status(500).json({ success: false, message: 'पावत्यांची यादी मिळवताना त्रुटी.' });
  }
}

export async function verifyPublicReceipt(req, res) {
  try {
    const rawIdentifier = decodeURIComponent(req.params.identifier || '').trim();
    if (!rawIdentifier) {
      return res.status(400).json({ success: false, valid: false, message: 'पावती क्रमांक किंवा पडताळणी कोड आवश्यक आहे.' });
    }

    let receipt = null;

    const cleanQuery = rawIdentifier.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // 1. Try receipts table by receipt_number (case-insensitive ilike)
    const { data: byNumArr } = await db.from('receipts').select('*').ilike('receipt_number', `%${rawIdentifier}%`).limit(1);
    if (byNumArr && byNumArr.length > 0) {
      receipt = byNumArr[0];
    }

    // 2. Try receipts table by verification_code
    if (!receipt) {
      const { data: byCodeArr } = await db.from('receipts').select('*').ilike('verification_code', `%${rawIdentifier}%`).limit(1);
      if (byCodeArr && byCodeArr.length > 0) {
        receipt = byCodeArr[0];
      }
    }

    // 3. Fallback to income_transactions
    if (!receipt) {
      const safeId = safeSearchTerm(rawIdentifier);
      const { data: txArr } = await db.from('income_transactions')
        .select('*')
        .or(`receipt_number.ilike.%${safeId}%,transaction_id.ilike.%${safeId}%`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (txArr && txArr.length > 0) {
        receipt = constructReceiptFromTx(txArr[0]);
      }
    }

    if (!receipt) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'ही पावती अवैध आहे किंवा सिस्टीममध्ये अस्तित्वात नाही / Invalid receipt. Not found in system.'
      });
    }

    const mandal = await getMandal('name_mr, name_en, tagline_mr, registration_no, festival_year, address_mr, contact_phone');
    const nameParts = (receipt.donor_name || '').split(' ');
    const safeName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}***` : (receipt.donor_name || 'देणगीदार');

    return res.json({
      success: true,
      valid: true,
      data: {
        receiptNumber: receipt.receipt_number,
        verificationCode: receipt.verification_code || `V-${receipt.id}`,
        donorNameSafe: safeName,
        amount: receipt.amount,
        paymentMethod: receipt.payment_method,
        category: receipt.category,
        purpose: receipt.purpose,
        date: receipt.created_at,
        receipt: {
          id: receipt.id,
          receipt_number: receipt.receipt_number,
          donor_name: receipt.donor_name,
          mobile: receipt.mobile,
          address: receipt.address,
          amount: receipt.amount,
          amount_in_words_mr: receipt.amount_in_words_mr || numberToWordsMarathi(Number(receipt.amount)),
          amount_in_words_en: receipt.amount_in_words_en || numberToWordsEnglish(Number(receipt.amount)),
          payment_method: receipt.payment_method,
          category: receipt.category,
          purpose: receipt.purpose,
          collector_name: receipt.collector_name,
          created_at: receipt.created_at,
          verification_code: receipt.verification_code
        },
        mandal: {
          nameMr: mandal?.name_mr,
          nameEn: mandal?.name_en,
          taglineMr: mandal?.tagline_mr,
          registrationNo: mandal?.registration_no,
          festivalYear: mandal?.festival_year,
          address: mandal?.address_mr,
          contactPhone: mandal?.contact_phone
        }
      }
    });
  } catch (err) {
    console.error('verifyPublicReceipt error:', err);
    return res.status(500).json({ success: false, message: 'पडताळणी करताना त्रुटी.' });
  }
}

