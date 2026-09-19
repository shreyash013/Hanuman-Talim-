import { db } from '../database/db.js';
import { numberToWordsMarathi, numberToWordsEnglish } from '../utils/marathiNumberWords.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { uploadFileToSupabase } from '../middleware/uploadMiddleware.js';
import { istDayBounds, safeSearchTerm, sum, throwIfError, expandBilingualSearchTerms } from '../utils/dbHelpers.js';
import { restorePruthvirajGavadeAndFixContinuity } from './syncController.js';

function applyIncomeFilters(query, filters) {
  const { search, category, payment_method, startDate, endDate, donor_id } = filters;
  if (search) {
    const s = safeSearchTerm(search);
    const searchTerms = expandBilingualSearchTerms(s);
    const clauses = searchTerms.map(term => {
      const safeTerm = safeSearchTerm(term);
      return `donor_name.ilike.%${safeTerm}%,mobile.ilike.%${safeTerm}%,receipt_number.ilike.%${safeTerm}%,transaction_id.ilike.%${safeTerm}%,address.ilike.%${safeTerm}%`;
    }).join(',');
    query = query.or(clauses);
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
    await restorePruthvirajGavadeAndFixContinuity();

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

export async function getNextReceiptNumber(prefix = 'HANUMAN-2026-') {
  let maxNum = 0;

  // 1. Check all income transactions (including inactive to avoid collisions)
  try {
    const { data: rows } = await db.from('income_transactions').select('receipt_number');
    if (Array.isArray(rows)) {
      for (const r of rows) {
        if (r.receipt_number) {
          const m = r.receipt_number.match(/(\d+)$/);
          if (m) {
            const n = parseInt(m[1], 10);
            if (!isNaN(n) && n > maxNum && n < 999999) maxNum = n;
          }
        }
      }
    }
  } catch (err) {
    console.warn('getNextReceiptNumber income_transactions note:', err.message);
  }

  // 2. Also check receipts table
  try {
    const { data: recRows } = await db.from('receipts').select('receipt_number');
    if (Array.isArray(recRows)) {
      for (const r of recRows) {
        if (r.receipt_number) {
          const m = r.receipt_number.match(/(\d+)$/);
          if (m) {
            const n = parseInt(m[1], 10);
            if (!isNaN(n) && n > maxNum && n < 999999) maxNum = n;
          }
        }
      }
    }
  } catch (err) {
    console.warn('getNextReceiptNumber receipts note:', err.message);
  }

  const nextNum = maxNum + 1;
  const formattedNum = String(nextNum).padStart(6, '0');
  return {
    nextNum,
    receiptNumber: `${prefix}${formattedNum}`,
    transactionId: `TXN-2026-${formattedNum}`
  };
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
    const cleanMobile = (mobile || '').trim();
    const digits10 = cleanMobile.replace(/\D/g, '').slice(-10);
    const cleanName = (donor_name || '').trim();

    // 1. If finalDonorId is provided, fetch donor
    if (finalDonorId) {
      const { data: donorRows } = await db.from('donors').select('*').eq('id', finalDonorId).limit(1);
      donorBefore = donorRows?.[0] || null;
    }

    // 2. If not found by donor_id, find candidate by phone (exact or last 10 digits)
    if (!donorBefore && cleanMobile) {
      // Exact mobile match
      const { data: exactMobRows } = await db.from('donors').select('*').eq('mobile', cleanMobile).limit(1);
      if (exactMobRows?.[0]) {
        donorBefore = exactMobRows[0];
        finalDonorId = donorBefore.id;
      } else if (digits10.length >= 10) {
        // Last 10 digits match
        const { data: digitMobRows } = await db.from('donors').select('*').ilike('mobile', `%${digits10}%`).limit(1);
        if (digitMobRows?.[0]) {
          donorBefore = digitMobRows[0];
          finalDonorId = donorBefore.id;
        }
      }
    }

    // 3. Fallback: find candidate by name (using bilingual transliteration)
    if (!donorBefore && cleanName) {
      const terms = expandBilingualSearchTerms(cleanName);
      for (const term of terms) {
        const safe = safeSearchTerm(term);
        const { data: nameMatchRows } = await db.from('donors').select('*').ilike('name', `%${safe}%`).limit(1);
        if (nameMatchRows?.[0]) {
          donorBefore = nameMatchRows[0];
          finalDonorId = donorBefore.id;
          break;
        }
      }
    }

    // 4. If donor doesn't exist, create one
    if (!donorBefore) {
      const defaultTarget = parsedAmount > 0 ? parsedAmount : 500;
      const { data: created, error: donorError } = await db.from('donors').insert({
        name: cleanName,
        mobile: cleanMobile,
        email: (email || '').trim(),
        address: (address || '').trim(),
        area: (area || 'शिरोळ').trim(),
        target_amount: defaultTarget,
        paid_amount: parsedAmount,
        total_donated: parsedAmount,
        donations_count: 1,
        last_donated_at: new Date().toISOString(),
        status: parsedAmount >= defaultTarget ? 'paid' : 'partial'
      }).select('*').single();
      throwIfError(donorError);
      finalDonorId = created.id;
      createdDonor = true;
    } else {
      // Update existing donor
      const currentPaid = Number(donorBefore.paid_amount || donorBefore.total_donated || 0);
      const newPaid = currentPaid + parsedAmount;
      const currentTarget = Number(donorBefore.target_amount || 0);
      const effectiveTarget = Math.max(currentTarget, newPaid);
      const newStatus = (newPaid >= effectiveTarget && effectiveTarget > 0) ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid');

      const updatePayload = {
        paid_amount: newPaid,
        total_donated: newPaid,
        target_amount: effectiveTarget,
        status: newStatus,
        donations_count: (Number(donorBefore.donations_count) || 0) + 1,
        last_donated_at: new Date().toISOString(),
        name: cleanName || donorBefore.name,
        address: address.trim() || donorBefore.address
      };
      if (cleanMobile && !donorBefore.mobile) updatePayload.mobile = cleanMobile;

      const { error } = await db.from('donors').update(updatePayload).eq('id', finalDonorId);
      throwIfError(error);
    }

    // Generate continuous next receipt and transaction numbers with collision-safety check
    let { receiptNumber, transactionId, nextNum } = await getNextReceiptNumber(settings.receipt_prefix || 'HANUMAN-2026-');

    // Ensure candidate receiptNumber and transactionId are not already taken in receipts or income_transactions
    let candidateNum = nextNum;
    while (true) {
      const { data: existingRec } = await db.from('receipts').select('id').eq('receipt_number', receiptNumber).limit(1);
      const { data: existingTx } = await db.from('income_transactions').select('id').eq('transaction_id', transactionId).limit(1);
      if ((!existingRec || existingRec.length === 0) && (!existingTx || existingTx.length === 0)) {
        break;
      }
      candidateNum++;
      const fmt = String(candidateNum).padStart(6, '0');
      receiptNumber = `${settings.receipt_prefix || 'HANUMAN-2026-'}${fmt}`;
      transactionId = `TXN-2026-${fmt}`;
    }

    const attachmentUrl = req.file ? await uploadFileToSupabase(req.file, 'income') : '';
    const collectorName = req.user?.name || 'स्वयंसेवक';

    const { data: tx, error: txError } = await db.from('income_transactions').insert({
      transaction_id: transactionId,
      donor_id: finalDonorId,
      donor_name: cleanName,
      mobile: cleanMobile,
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
      donor_name: cleanName,
      mobile: cleanMobile,
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

    try {
      await logAudit({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: 'CREATE', entity: 'INCOME', entityId: transactionId, descriptionMr: `${cleanName} यांच्याकडून ₹${parsedAmount.toLocaleString('en-IN')} ${category === 'vargani' ? 'वर्गणी' : 'जमा'} नोंदवली (पावती क्र: ${receiptNumber}).`, descriptionEn: `Recorded income of ₹${parsedAmount.toLocaleString('en-IN')} from ${cleanName} (Receipt: ${receiptNumber}).`, newValues: { transactionId, receiptNumber, amount: parsedAmount, donor_name: cleanName, payment_method, category }, req });
    } catch {}

    return res.status(201).json({ success: true, message: 'जमा रक्कम यशस्वीरित्या नोंदवली व पावती तयार झाली! / Income recorded & receipt generated!', data: { transactionId, receiptNumber, amount: parsedAmount, receipt } });
  } catch (err) {
    console.error('createIncome error:', err);

    // Best-effort rollback because REST calls are not a single SQL transaction.
    try {
      if (createdTx?.id) await db.from('income_transactions').delete().eq('id', createdTx.id);
      if (createdDonor && finalDonorId) await db.from('donors').delete().eq('id', finalDonorId);
      else if (donorBefore && finalDonorId) {
        await db.from('donors').update({
          paid_amount: donorBefore.paid_amount,
          total_donated: donorBefore.total_donated,
          target_amount: donorBefore.target_amount,
          status: donorBefore.status,
          donations_count: donorBefore.donations_count,
          last_donated_at: donorBefore.last_donated_at,
          name: donorBefore.name,
          address: donorBefore.address
        }).eq('id', finalDonorId);
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
    const { data: txRows, error } = await db.from('income_transactions').select('*').eq('id', id).eq('is_deleted', false).limit(1);
    throwIfError(error);
    const tx = txRows?.[0] || null;
    if (!tx) return res.status(404).json({ success: false, message: 'व्यवहार सापडला नाही.' });

    const { error: deleteError } = await db.from('income_transactions').update({ is_deleted: true }).eq('id', id);
    throwIfError(deleteError);

    if (tx.donor_id) {
      const { data: donorRows, error: donorError } = await db.from('donors').select('id, target_amount, paid_amount, total_donated, donations_count').eq('id', tx.donor_id).limit(1);
      throwIfError(donorError);
      const donor = donorRows?.[0];
      if (donor) {
        const currentPaid = Number(donor.paid_amount || donor.total_donated || 0);
        const newPaid = Math.max(0, currentPaid - (Number(tx.amount) || 0));
        const targetAmt = Number(donor.target_amount) || 500;
        const newStatus = (newPaid >= targetAmt && targetAmt > 0) ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid');
        await db.from('donors').update({
          paid_amount: newPaid,
          total_donated: newPaid,
          status: newStatus,
          donations_count: Math.max(0, (Number(donor.donations_count) || 0) - 1)
        }).eq('id', tx.donor_id);
      }
    }

    await logAudit({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: 'DELETE', entity: 'INCOME', entityId: tx.transaction_id, descriptionMr: `${req.user?.name} यांनी जमा व्यवहार ${tx.transaction_id} (रक्कम ₹${tx.amount}) हटवला.`, descriptionEn: `Deleted income transaction ${tx.transaction_id} (₹${tx.amount}).`, oldValues: tx, req });
    return res.json({ success: true, message: 'व्यवहार यशस्वीरित्या हटवला / Transaction deleted successfully.' });
  } catch (err) {
    console.error('deleteIncome error:', err);
    return res.status(500).json({ success: false, message: 'व्यवहार हटवताना त्रुटी.' });
  }
}

export async function updateIncome(req, res) {
  try {
    const { id } = req.params;
    const { donor_name, mobile, address, amount, category, purpose, notes, payment_method } = req.body;
    const { data: txRows, error } = await db.from('income_transactions').select('*').eq('id', id).eq('is_deleted', false).limit(1);
    throwIfError(error);
    const tx = txRows?.[0] || null;
    if (!tx) return res.status(404).json({ success: false, message: 'व्यवहार सापडला नाही.' });

    const updatePayload = {};
    if (donor_name !== undefined) updatePayload.donor_name = donor_name.trim();
    if (mobile !== undefined) updatePayload.mobile = mobile.trim();
    if (address !== undefined) updatePayload.address = address.trim();
    if (amount !== undefined) updatePayload.amount = Number(amount);
    if (category !== undefined) updatePayload.category = category.trim();
    if (purpose !== undefined) updatePayload.purpose = purpose.trim();
    if (notes !== undefined) updatePayload.notes = notes.trim();
    if (payment_method !== undefined) updatePayload.payment_method = payment_method.trim();

    const { data: updated, error: updateError } = await db.from('income_transactions').update(updatePayload).eq('id', id).select('*').single();
    throwIfError(updateError);

    // Update donor paid_amount & status if amount changed
    if (updatePayload.amount !== undefined && tx.donor_id && Number(updatePayload.amount) !== Number(tx.amount)) {
      const diff = Number(updatePayload.amount) - Number(tx.amount);
      const { data: dRows } = await db.from('donors').select('id, target_amount, paid_amount, total_donated').eq('id', tx.donor_id).limit(1);
      const d = dRows?.[0];
      if (d) {
        const newPaid = Math.max(0, (Number(d.paid_amount || d.total_donated) || 0) + diff);
        const targetAmt = Number(d.target_amount) || 500;
        const newStatus = (newPaid >= targetAmt && targetAmt > 0) ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid');
        await db.from('donors').update({
          paid_amount: newPaid,
          total_donated: newPaid,
          status: newStatus
        }).eq('id', tx.donor_id);
      }
    }

    // Update matching receipt
    if (tx.receipt_id || tx.receipt_number) {
      const receiptUpdate = {};
      if (updatePayload.donor_name) receiptUpdate.donor_name = updatePayload.donor_name;
      if (updatePayload.mobile !== undefined) receiptUpdate.mobile = updatePayload.mobile;
      if (updatePayload.address !== undefined) receiptUpdate.address = updatePayload.address;
      if (updatePayload.amount !== undefined) {
        receiptUpdate.amount = updatePayload.amount;
        receiptUpdate.amount_in_words_mr = numberToWordsMarathi(updatePayload.amount);
        receiptUpdate.amount_in_words_en = numberToWordsEnglish(updatePayload.amount);
      }
      if (updatePayload.category) receiptUpdate.category = updatePayload.category;
      if (updatePayload.purpose) receiptUpdate.purpose = updatePayload.purpose;
      if (updatePayload.payment_method) receiptUpdate.payment_method = updatePayload.payment_method;

      if (Object.keys(receiptUpdate).length > 0) {
        if (tx.receipt_id) {
          await db.from('receipts').update(receiptUpdate).eq('id', tx.receipt_id);
        } else if (tx.receipt_number) {
          await db.from('receipts').update(receiptUpdate).eq('receipt_number', tx.receipt_number);
        }
      }
    }

    return res.json({ success: true, message: 'व्यवहार यशस्वीरित्या अद्ययावत केला / Transaction updated successfully.', data: updated });
  } catch (err) {
    console.error('updateIncome error:', err);
    return res.status(500).json({ success: false, message: 'व्यवहार अद्ययावत करताना त्रुटी.' });
  }
}

export async function renumberReceipts(req, res) {
  try {
    const { data: transactions, error } = await db.from('income_transactions')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    throwIfError(error);

    const results = [];
    let idx = 1;
    for (const tx of transactions) {
      const formattedNum = String(idx).padStart(6, '0');
      const newReceiptNumber = `HANUMAN-2026-${formattedNum}`;
      const newTxnId = `TXN-2026-${formattedNum}`;

      await db.from('income_transactions').update({
        receipt_number: newReceiptNumber,
        transaction_id: newTxnId
      }).eq('id', tx.id);

      if (tx.receipt_id) {
        await db.from('receipts').update({
          receipt_number: newReceiptNumber
        }).eq('id', tx.receipt_id);
      } else if (tx.receipt_number) {
        await db.from('receipts').update({
          receipt_number: newReceiptNumber
        }).eq('receipt_number', tx.receipt_number);
      }

      results.push({ id: tx.id, donor: tx.donor_name, receiptNumber: newReceiptNumber, txnId: newTxnId });
      idx++;
    }

    return res.json({
      success: true,
      message: `${results.length} पावत्यांचे क्रमांक अखंड क्रमाने (Continuous 1 to ${results.length}) यशस्वीरित्या अद्ययावत केले!`,
      data: results
    });
  } catch (err) {
    console.error('renumberReceipts error:', err);
    return res.status(500).json({ success: false, message: 'पावती क्रमांक अद्ययावत करताना त्रुटी.' });
  }
}


