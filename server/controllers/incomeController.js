import { db } from '../database/db.js';
import { numberToWordsMarathi, numberToWordsEnglish } from '../utils/marathiNumberWords.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { uploadFileToSupabase } from '../middleware/uploadMiddleware.js';
import { istDayBounds, safeSearchTerm, sum, throwIfError } from '../utils/dbHelpers.js';

function applyIncomeFilters(query, filters) {
  const { search, category, payment_method, startDate, endDate, donor_id } = filters;
  if (search) {
    const s = safeSearchTerm(search);
    query = query.or(`donor_name.ilike.%${s}%,mobile.ilike.%${s}%,receipt_number.ilike.%${s}%,transaction_id.ilike.%${s}%,address.ilike.%${s}%`);
  }
  if (category) query = query.eq('category', category);
  if (payment_method) query = query.eq('payment_method', payment_method);
  if (donor_id) query = query.eq('donor_id', donor_id);
  if (startDate) query = query.gte('created_at', istDayBounds(startDate).start);
  if (endDate) query = query.lt('created_at', istDayBounds(endDate).end);
  return query;
}

export async function getIncomeList(req, res) {
  try {
    const filters = {
      search: req.query.search || '',
      category: req.query.category || '',
      payment_method: req.query.payment_method || '',
      startDate: req.query.startDate || '',
      endDate: req.query.endDate || '',
      donor_id: req.query.donor_id || ''
    };
    const pageNum = Math.max(1, Number(req.query.page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let pageQuery = db.from('income_transactions').select('*', { count: 'exact' }).eq('is_deleted', false).order('created_at', { ascending: false });
    pageQuery = applyIncomeFilters(pageQuery, filters);
    const { data: transactions, count, error } = await pageQuery.range(offset, offset + limitNum - 1);
    throwIfError(error);

    let sumQuery = db.from('income_transactions').select('amount').eq('is_deleted', false);
    sumQuery = applyIncomeFilters(sumQuery, filters);
    const { data: amountRows, error: sumError } = await sumQuery;
    throwIfError(sumError);

    const total = count || 0;
    return res.json({
      success: true,
      data: transactions || [],
      pagination: {
        total,
        totalAmount: sum(amountRows),
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error('getIncomeList error:', err);
    return res.status(500).json({ success: false, message: 'जमा रकमेची यादी मिळवताना त्रुटी' });
  }
}

export async function createIncome(req, res) {
  let createdTx = null;
  let donorBefore = null;
  let finalDonorId = null;
  let createdDonor = false;

  try {
    const { donor_name, mobile = '', email = '', address = '', area = '', amount, payment_method = 'cash', category = 'vargani', purpose = 'गणेशोत्सव वर्गणी', notes = '', donor_id = null } = req.body;
    const parsedAmount = Number(amount);
    if (!donor_name?.trim()) return res.status(400).json({ success: false, message: 'देणगीदाराचे / व्यक्तीचे नाव आवश्यक आहे.' });
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ success: false, message: 'कृपया वैध रक्कम भरा (Amount must be > 0).' });

    const { data: mandal, error: mandalError } = await db.from('mandal_settings').select('*').limit(1).maybeSingle();
    throwIfError(mandalError);
    const settings = mandal || { receipt_prefix: 'HANUMAN-2026-', festival_year: 2026 };

    finalDonorId = donor_id || null;
    if (!finalDonorId && mobile.trim()) {
      const { data: existingDonor, error } = await db.from('donors').select('*').eq('mobile', mobile.trim()).maybeSingle();
      throwIfError(error);
      if (existingDonor) {
        finalDonorId = existingDonor.id;
        donorBefore = existingDonor;
      }
    }

    if (finalDonorId && !donorBefore) {
      const { data, error } = await db.from('donors').select('*').eq('id', finalDonorId).maybeSingle();
      throwIfError(error);
      donorBefore = data;
    }

    if (!finalDonorId) {
      const { data: newDonor, error } = await db.from('donors').insert({
        name: donor_name.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        address: address.trim(),
        area: area.trim(),
        total_donated: parsedAmount,
        donations_count: 1,
        last_donated_at: new Date().toISOString(),
        notes: notes.trim()
      }).select('*').single();
      throwIfError(error);
      finalDonorId = newDonor.id;
      createdDonor = true;
    } else if (donorBefore) {
      const { error } = await db.from('donors').update({
        total_donated: (Number(donorBefore.total_donated) || 0) + parsedAmount,
        donations_count: (Number(donorBefore.donations_count) || 0) + 1,
        last_donated_at: new Date().toISOString(),
        name: donor_name.trim() || donorBefore.name,
        address: address.trim() || donorBefore.address
      }).eq('id', finalDonorId);
      throwIfError(error);
    }

    // Use MAX id to prevent duplicate receipt numbers after soft-deletes
    const { data: maxRow, error: maxError } = await db.from('income_transactions').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    throwIfError(maxError);
    const nextNum = ((maxRow?.id) || 0) + 1;
    const formattedNum = String(nextNum).padStart(6, '0');
    const receiptNumber = `${settings.receipt_prefix || 'HANUMAN-2026-'}${formattedNum}`;
    const transactionId = `TXN-${settings.festival_year || 2026}-${formattedNum}`;
    const attachmentUrl = req.file ? await uploadFileToSupabase(req.file, 'income') : '';
    const collectorName = req.user?.name || 'स्वयंसेवक';

    const { data: tx, error: txError } = await db.from('income_transactions').insert({
      transaction_id: transactionId,
      donor_id: finalDonorId,
      donor_name: donor_name.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      amount: parsedAmount,
      payment_method,
      category,
      purpose: purpose.trim(),
      notes: notes.trim(),
      collected_by_id: req.user?.id || null,
      collector_name: collectorName,
      receipt_number: receiptNumber,
      attachment_url: attachmentUrl,
      status: 'completed'
    }).select('*').single();
    throwIfError(txError);
    createdTx = tx;

    const verificationCode = `V-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
    const { data: receipt, error: receiptError } = await db.from('receipts').insert({
      receipt_number: receiptNumber,
      transaction_id: tx.id,
      donor_name: donor_name.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      amount: parsedAmount,
      amount_in_words_mr: numberToWordsMarathi(parsedAmount),
      amount_in_words_en: numberToWordsEnglish(parsedAmount),
      payment_method,
      category,
      purpose: purpose.trim(),
      collector_name: collectorName,
      verification_code: verificationCode
    }).select('*').single();
    throwIfError(receiptError);

    const { error: linkError } = await db.from('income_transactions').update({ receipt_id: receipt.id }).eq('id', tx.id);
    throwIfError(linkError);

    await logAudit({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: 'CREATE', entity: 'INCOME', entityId: transactionId, descriptionMr: `${donor_name.trim()} यांच्याकडून ₹${parsedAmount.toLocaleString('en-IN')} ${category === 'vargani' ? 'वर्गणी' : 'जमा'} नोंदवली (पावती क्र: ${receiptNumber}).`, descriptionEn: `Recorded income of ₹${parsedAmount.toLocaleString('en-IN')} from ${donor_name.trim()} (Receipt: ${receiptNumber}).`, newValues: { transactionId, receiptNumber, amount: parsedAmount, donor_name, payment_method, category }, req });

    return res.status(201).json({ success: true, message: 'जमा रक्कम यशस्वीरित्या नोंदवली व पावती तयार झाली! / Income recorded & receipt generated!', data: { transactionId, receiptNumber, amount: parsedAmount, receipt } });
  } catch (err) {
    console.error('createIncome error:', err);

    // Best-effort rollback because REST calls are not a single SQL transaction.
    try {
      if (createdTx?.id) await db.from('income_transactions').delete().eq('id', createdTx.id);
      if (createdDonor && finalDonorId) await db.from('donors').delete().eq('id', finalDonorId);
      else if (donorBefore && finalDonorId) {
        await db.from('donors').update({ total_donated: donorBefore.total_donated, donations_count: donorBefore.donations_count, last_donated_at: donorBefore.last_donated_at, name: donorBefore.name, address: donorBefore.address }).eq('id', finalDonorId);
      }
    } catch (rollbackError) {
      console.error('Income rollback error:', rollbackError);
    }

    return res.status(500).json({ success: false, message: 'जमा रक्कम नोंदवताना त्रुटी निर्माण झाली.' });
  }
}

export async function deleteIncome(req, res) {
  try {
    const { id } = req.params;
    const { data: tx, error } = await db.from('income_transactions').select('*').eq('id', id).eq('is_deleted', false).maybeSingle();
    throwIfError(error);
    if (!tx) return res.status(404).json({ success: false, message: 'व्यवहार सापडला नाही.' });

    const { error: deleteError } = await db.from('income_transactions').update({ is_deleted: true }).eq('id', id);
    throwIfError(deleteError);

    if (tx.donor_id) {
      const { data: donor, error: donorError } = await db.from('donors').select('total_donated, donations_count').eq('id', tx.donor_id).maybeSingle();
      throwIfError(donorError);
      if (donor) {
        const { error: donorUpdateError } = await db.from('donors').update({
          total_donated: Math.max(0, (Number(donor.total_donated) || 0) - (Number(tx.amount) || 0)),
          donations_count: Math.max(0, (Number(donor.donations_count) || 0) - 1)
        }).eq('id', tx.donor_id);
        throwIfError(donorUpdateError);
      }
    }

    await logAudit({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: 'DELETE', entity: 'INCOME', entityId: tx.transaction_id, descriptionMr: `${req.user?.name} यांनी जमा व्यवहार ${tx.transaction_id} (रक्कम ₹${tx.amount}) हटवला.`, descriptionEn: `Deleted income transaction ${tx.transaction_id} (₹${tx.amount}).`, oldValues: tx, req });
    return res.json({ success: true, message: 'व्यवहार यशस्वीरित्या हटवला / Transaction deleted successfully.' });
  } catch (err) {
    console.error('deleteIncome error:', err);
    return res.status(500).json({ success: false, message: 'व्यवहार हटवताना त्रुटी.' });
  }
}
