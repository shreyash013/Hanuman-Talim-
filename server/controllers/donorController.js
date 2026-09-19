import { db } from '../database/db.js';
import { safeSearchTerm, sum, throwIfError, expandBilingualSearchTerms } from '../utils/dbHelpers.js';
import { numberToWordsMarathi, numberToWordsEnglish } from '../utils/marathiNumberWords.js';
import { getNextReceiptNumber } from './incomeController.js';

function applyDonorFilters(query, search, area) {
  if (search) {
    const s = safeSearchTerm(search);
    const searchTerms = expandBilingualSearchTerms(s);
    const clauses = searchTerms.map(term => {
      const safeTerm = safeSearchTerm(term);
      return `name.ilike.%${safeTerm}%,mobile.ilike.%${safeTerm}%,area.ilike.%${safeTerm}%,address.ilike.%${safeTerm}%`;
    }).join(',');
    query = query.or(clauses);
  }
  if (area) query = query.eq('area', area);
  return query;
}


export async function getDonorsList(req, res) {
  try {
    const { page = 1, limit = 500, search = '', area = '' } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(1000, Math.max(1, Number(limit) || 500));
    const offset = (pageNum - 1) * limitNum;

    let pageQuery = db.from('donors').select('*', { count: 'exact' }).order('total_donated', { ascending: false }).order('donations_count', { ascending: false });
    pageQuery = applyDonorFilters(pageQuery, search, area);
    const { data: donors, count, error } = await pageQuery.range(offset, offset + limitNum - 1);
    throwIfError(error);

    // Get totalPaid from income_transactions (SAME source as dashboard) to prevent mismatch
    const { data: incomeRows, error: incomeError } = await db.from('income_transactions').select('amount').eq('is_deleted', false);
    throwIfError(incomeError);
    const totalPaid = (incomeRows || []).reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

    let summaryQuery = db.from('donors').select('target_amount, total_donated');
    summaryQuery = applyDonorFilters(summaryQuery, search, area);
    const { data: summaryRows, error: summaryError } = await summaryQuery;
    throwIfError(summaryError);

    const total = count || 0;
    const rows = summaryRows || [];
    const totalTarget = rows.reduce((acc, r) => acc + (Number(r.target_amount) || Number(r.total_donated) || 500), 0);
    const totalPending = rows.reduce((acc, r) => {
      const t = Number(r.target_amount) || Number(r.total_donated) || 0;
      const p = Number(r.total_donated) || 0;
      return acc + Math.max(0, t - p);
    }, 0);

    return res.json({
      success: true,
      data: donors || [],
      summary: {
        totalDonors: total,
        totalTarget,
        totalPaid,
        totalPending,
        grandTotal: totalPaid
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error('getDonorsList error:', err);
    return res.status(500).json({ success: false, message: 'देणगीदार यादी मिळवताना त्रुटी' });
  }
}

export async function searchDonors(req, res) {
  try {
    const q = req.query.q || '';
    if (q.trim().length < 2) return res.json({ success: true, data: [] });
    const s = safeSearchTerm(q);
    const searchTerms = expandBilingualSearchTerms(s);
    const clauses = searchTerms.map(term => {
      const safeTerm = safeSearchTerm(term);
      return `name.ilike.%${safeTerm}%,mobile.ilike.%${safeTerm}%,area.ilike.%${safeTerm}%`;
    }).join(',');
    const { data, error } = await db.from('donors')
      .select('id, name, mobile, address, area, total_donated, donations_count, last_donated_at')
      .or(clauses)
      .order('total_donated', { ascending: false })
      .limit(10);
    throwIfError(error);
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('searchDonors error:', err);
    return res.status(500).json({ success: false, message: 'शोधताना त्रुटी' });
  }
}


export async function getDonorById(req, res) {
  try {
    const { id } = req.params;
    const { data: donorRows, error } = await db.from('donors').select('*').eq('id', id).limit(1);
    throwIfError(error);
    const donor = donorRows?.[0] || null;
    if (!donor) return res.status(404).json({ success: false, message: 'देणगीदार सापडला नाही.' });

    const { data: txRows, error: txError } = await db.from('income_transactions').select('id, transaction_id, amount, payment_method, category, purpose, receipt_number, created_at, collector_name').eq('donor_id', id).eq('is_deleted', false).order('created_at', { ascending: false });
    throwIfError(txError);

    const ids = (txRows || []).map(r => r.id);
    let receipts = [];
    if (ids.length) {
      const { data, error: receiptError } = await db.from('receipts').select('id, transaction_id, verification_code').in('transaction_id', ids);
      throwIfError(receiptError);
      receipts = data || [];
    }
    const byTx = new Map(receipts.map(r => [String(r.transaction_id), r]));
    const history = (txRows || []).map(tx => ({ ...tx, receipt_id: byTx.get(String(tx.id))?.id || null, verification_code: byTx.get(String(tx.id))?.verification_code || null }));
    return res.json({ success: true, data: { donor, history } });
  } catch (err) {
    console.error('getDonorById error:', err);
    return res.status(500).json({ success: false, message: 'माहिती मिळवताना त्रुटी' });
  }
}

export async function createDonor(req, res) {
  try {
    // 1. Support Bulk Donors addition
    if (Array.isArray(req.body.donors) && req.body.donors.length > 0) {
      const donorsToInsert = req.body.donors.map(d => {
        const target = Number(d.target_amount || d.amount || 500);
        const paid = Number(d.paid_amount || d.total_donated || 0);
        return {
          name: (d.name || '').trim(),
          mobile: (d.mobile || '').trim(),
          email: (d.email || '').trim(),
          address: (d.address || '').trim(),
          area: (d.area || 'शिरोळ').trim(),
          target_amount: target,
          paid_amount: paid,
          total_donated: paid,
          donations_count: paid > 0 ? 1 : 0,
          status: paid >= target && target > 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid'),
          notes: d.notes || 'बल्क नोंदणी'
        };
      }).filter(d => d.name);

      if (donorsToInsert.length === 0) {
        return res.status(400).json({ success: false, message: 'वैध देणगीदार माहिती आढळली नाही.' });
      }

      const { data: createdBatch, error: batchError } = await db.from('donors').insert(donorsToInsert).select('*');
      throwIfError(batchError);
      return res.status(201).json({
        success: true,
        message: `${createdBatch?.length || donorsToInsert.length} देणगीदार यशस्वीरित्या जोडले!`,
        data: createdBatch || donorsToInsert
      });
    }

    // 2. Single Donor addition
    const { name, mobile = '', email = '', address = '', area = '', notes = '', target_amount, amount } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'नाव आवश्यक आहे.' });

    const cleanMobile = mobile ? mobile.trim() : '';
    const digits10 = cleanMobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile) {
      let existingQuery = db.from('donors').select('id, name, mobile');
      if (digits10.length >= 10) {
        existingQuery = existingQuery.or(`mobile.eq.${cleanMobile},mobile.ilike.%${digits10}%`);
      } else {
        existingQuery = existingQuery.eq('mobile', cleanMobile);
      }
      const { data: existingRows } = await existingQuery.limit(1);
      if (existingRows?.[0]) return res.status(400).json({ success: false, message: `हा मोबाईल क्रमांक आधीच '${existingRows[0].name}' यांच्यासाठी नोंदवलेला आहे.` });
    }

async function createIncomeForDonor(donor, amount, category = 'vargani') {
  try {
    const { receiptNumber, transactionId } = await getNextReceiptNumber('HANUMAN-2026-');
    const cleanName = (donor.name || '').trim();
    const cleanMobile = (donor.mobile || '').trim();
    const cleanAddress = (donor.address || '').trim();

    const { data: tx, error: txErr } = await db.from('income_transactions').insert({
      transaction_id: transactionId,
      donor_id: donor.id,
      donor_name: cleanName,
      mobile: cleanMobile,
      address: cleanAddress,
      amount: Number(amount),
      payment_method: 'cash',
      category: category,
      purpose: 'श्री गणेशोत्सव वर्गणी',
      notes: 'वर्गणी नोंदणी',
      collector_name: 'अध्यक्ष (Admin)',
      receipt_number: receiptNumber,
      status: 'completed',
      is_deleted: false
    }).select('*').single();

    if (!txErr && tx) {
      const verificationCode = `V-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
      const { data: receipt } = await db.from('receipts').insert({
        receipt_number: receiptNumber,
        transaction_id: tx.id,
        donor_name: cleanName,
        mobile: cleanMobile,
        address: cleanAddress,
        amount: Number(amount),
        amount_in_words_mr: numberToWordsMarathi(Number(amount)),
        amount_in_words_en: numberToWordsEnglish(Number(amount)),
        payment_method: 'cash',
        category: category,
        purpose: 'श्री गणेशोत्सव वर्गणी',
        collector_name: 'अध्यक्ष (Admin)',
        verification_code: verificationCode
      }).select('*').single();

      if (receipt) {
        await db.from('income_transactions').update({ receipt_id: receipt.id }).eq('id', tx.id);
      }
    }
  } catch (err) {
    console.warn('createIncomeForDonor helper note:', err.message);
  }
}

    const target = Number(target_amount || amount || 500);
    const initialPaid = Number(req.body.paid_amount || req.body.total_donated || 0);
    const { data: created, error } = await db.from('donors').insert({
      name: name.trim(),
      mobile: cleanMobile,
      email: email.trim(),
      address: address.trim(),
      area: (area || 'शिरोळ').trim(),
      notes: notes.trim(),
      target_amount: target,
      paid_amount: initialPaid,
      total_donated: initialPaid,
      donations_count: initialPaid > 0 ? 1 : 0,
      status: initialPaid >= target && target > 0 ? 'paid' : (initialPaid > 0 ? 'partial' : 'unpaid')
    }).select('*').single();
    throwIfError(error);

    if (initialPaid > 0 && created) {
      await createIncomeForDonor(created, initialPaid, req.body.category || 'vargani');
    }

    return res.status(201).json({
      success: true,
      message: 'देणगीदार यशस्वीरित्या जोडला / Donor added successfully',
      data: created
    });
  } catch (err) {
    console.error('createDonor error:', err);
    return res.status(500).json({ success: false, message: 'नोंदणी करताना त्रुटी' });
  }
}

export async function updateDonor(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      mobile,
      email,
      address,
      area,
      notes,
      target_amount,
      paid_amount,
      category,
      originalName
    } = req.body;

    let donor = null;
    // 1. Try finding by ID if it's a standard numeric database ID (< 1,000,000,000)
    if (id && Number(id) < 1000000000) {
      const { data } = await db.from('donors').select('*').eq('id', id).limit(1);
      donor = data?.[0] || null;
    }

    // 2. If not found by ID, try finding by originalName or current name (with bilingual terms)
    const targetName = (originalName || name)?.trim();
    if (!donor && targetName) {
      const terms = expandBilingualSearchTerms(targetName);
      for (const t of terms) {
        const safeT = safeSearchTerm(t);
        const { data } = await db.from('donors').select('*').ilike('name', `%${safeT}%`).limit(1);
        if (data?.[0]) {
          donor = data[0];
          break;
        }
      }
    }

    // 3. Fallback: try finding by mobile (exact or last 10 digits)
    const cleanMobile = mobile ? mobile.trim() : '';
    const digits10 = cleanMobile.replace(/\D/g, '').slice(-10);
    if (!donor && cleanMobile) {
      let mobQuery = db.from('donors').select('*');
      if (digits10.length >= 10) {
        mobQuery = mobQuery.or(`mobile.eq.${cleanMobile},mobile.ilike.%${digits10}%`);
      } else {
        mobQuery = mobQuery.eq('mobile', cleanMobile);
      }
      const { data } = await mobQuery.limit(1);
      donor = data?.[0] || null;
    }

    // 4. If still not found and valid name provided, insert as new donor
    if (!donor) {
      if (!name?.trim()) {
        return res.status(404).json({ success: false, message: 'देणगीदार सापडला नाही.' });
      }
      const target = Number(target_amount || 500);
      const paid = Number(paid_amount || 0);
      const { data: created, error: createError } = await db.from('donors').insert({
        name: name.trim(),
        mobile: cleanMobile,
        email: (email || '').trim(),
        address: (address || '').trim(),
        area: (area || 'शिरोळ').trim(),
        notes: (notes || '').trim(),
        target_amount: target,
        paid_amount: paid,
        total_donated: paid,
        donations_count: paid > 0 ? 1 : 0,
        status: (paid >= target && target > 0) ? 'paid' : (paid > 0 ? 'partial' : 'unpaid')
      }).select('*').single();
      throwIfError(createError);
      return res.json({ success: true, message: 'देणगीदार यशस्वीरित्या तयार केला', data: created });
    }

    // 5. Update donor with provided fields only (never wipe non-provided fields to '')
    const updatePayload = {};
    if (name !== undefined && name.trim()) updatePayload.name = name.trim();
    if (mobile !== undefined) updatePayload.mobile = mobile.trim();
    if (email !== undefined) updatePayload.email = email.trim();
    if (address !== undefined) updatePayload.address = address.trim();
    if (area !== undefined) updatePayload.area = area.trim();
    if (notes !== undefined) updatePayload.notes = notes.trim();
    if (target_amount !== undefined) updatePayload.target_amount = Number(target_amount);
    if (paid_amount !== undefined) {
      updatePayload.paid_amount = Number(paid_amount);
      updatePayload.total_donated = Number(paid_amount);
    }

    const effectiveTarget = updatePayload.target_amount !== undefined ? updatePayload.target_amount : Number(donor.target_amount || 500);
    const effectivePaid = updatePayload.paid_amount !== undefined ? updatePayload.paid_amount : Number(donor.paid_amount || donor.total_donated || 0);
    updatePayload.status = (effectivePaid >= effectiveTarget && effectiveTarget > 0) ? 'paid' : (effectivePaid > 0 ? 'partial' : 'unpaid');

    const { data: updated, error: updateError } = await db.from('donors').update(updatePayload).eq('id', donor.id).select('*').single();
    throwIfError(updateError);

    // 6. Cascade update to linked transactions and receipts if name, mobile, address, or category changed
    const oldName = donor.name;
    const newName = updatePayload.name || oldName;
    const newMobile = updatePayload.mobile !== undefined ? updatePayload.mobile : donor.mobile;
    const newAddress = updatePayload.address !== undefined ? updatePayload.address : donor.address;

    const txUpdates = {};
    if (newName) txUpdates.donor_name = newName;
    if (newMobile) txUpdates.mobile = newMobile;
    if (newAddress) txUpdates.address = newAddress;
    if (category) txUpdates.category = category;

    if (Object.keys(txUpdates).length > 0) {
      await db.from('income_transactions').update(txUpdates).eq('donor_id', donor.id).eq('is_deleted', false);
      if (oldName) {
        await db.from('income_transactions').update(txUpdates).ilike('donor_name', oldName).eq('is_deleted', false);
        await db.from('receipts').update({ donor_name: newName, mobile: newMobile, address: newAddress }).ilike('donor_name', oldName);
      }
    }

    // 7. If paid_amount changed, cascade the new amount to the most recent income transaction & receipt
    const oldPaid = Number(donor.paid_amount || donor.total_donated || 0);
    const newPaid = updatePayload.paid_amount !== undefined ? Number(updatePayload.paid_amount) : oldPaid;
    if (newPaid !== oldPaid && donor.id) {
      // Find the most recent income transaction for this donor to update its amount
      const { data: recentTxRows } = await db.from('income_transactions')
        .select('id, amount, receipt_id, receipt_number')
        .eq('donor_id', donor.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1);
      const recentTx = recentTxRows?.[0];
      if (recentTx) {
        // Calculate the new transaction amount: adjust by the difference
        const diff = newPaid - oldPaid;
        const newTxAmount = Math.max(0, Number(recentTx.amount || 0) + diff);
        await db.from('income_transactions').update({ amount: newTxAmount }).eq('id', recentTx.id);
        // Also update the linked receipt
        if (recentTx.receipt_id) {
          await db.from('receipts').update({
            amount: newTxAmount,
            amount_in_words_mr: numberToWordsMarathi(newTxAmount),
            amount_in_words_en: numberToWordsEnglish(newTxAmount)
          }).eq('id', recentTx.receipt_id);
        } else if (recentTx.receipt_number) {
          await db.from('receipts').update({
            amount: newTxAmount,
            amount_in_words_mr: numberToWordsMarathi(newTxAmount),
            amount_in_words_en: numberToWordsEnglish(newTxAmount)
          }).eq('receipt_number', recentTx.receipt_number);
        }
      } else if (newPaid > 0) {
        // No existing income transaction -> create one so it shows in Income Records!
        await createIncomeForDonor(donor, newPaid, category || 'vargani');
      }
    }

    return res.json({ success: true, message: 'माहिती अद्ययावत केली / Donor updated successfully', data: updated });
  } catch (err) {
    console.error('updateDonor error:', err);
    return res.status(500).json({ success: false, message: 'अद्ययावत करताना त्रुटी' });
  }
}

export async function deleteDonor(req, res) {
  try {
    const { id } = req.params;
    const name = req.body?.name || req.query?.name;
    const mobile = req.body?.mobile || req.query?.mobile;

    let donor = null;
    // 1. Try finding by ID
    if (id) {
      const numId = Number(id);
      if (!isNaN(numId) && numId > 0) {
        const { data } = await db.from('donors').select('id, name, mobile').eq('id', numId).limit(1);
        donor = data?.[0] || null;
      }
    }

    // 2. If not found by ID, try finding by name (bilingual)
    if (!donor && name?.trim()) {
      const terms = expandBilingualSearchTerms(name.trim());
      for (const t of terms) {
        const { data } = await db.from('donors').select('id, name, mobile').ilike('name', `%${safeSearchTerm(t)}%`).limit(1);
        if (data?.[0]) {
          donor = data[0];
          break;
        }
      }
    }

    if (!donor && mobile?.trim()) {
      const cleanMobile = mobile.trim();
      const digits10 = cleanMobile.replace(/\D/g, '').slice(-10);
      let mobQuery = db.from('donors').select('id, name, mobile');
      if (digits10.length >= 10) {
        mobQuery = mobQuery.or(`mobile.eq.${cleanMobile},mobile.ilike.%${digits10}%`);
      } else {
        mobQuery = mobQuery.eq('mobile', cleanMobile);
      }
      const { data } = await mobQuery.limit(1);
      donor = data?.[0] || null;
    }

    // Perform deletions - ALWAYS soft-delete/delete linked income transactions first, then delete donor
    const donorId = donor?.id || (id && Number(id) < 1000000000 ? Number(id) : null);
    if (donorId) {
      await db.from('income_transactions').update({ is_deleted: true }).eq('donor_id', donorId);
      await db.from('donors').delete().eq('id', donorId);
    }

    const targetName = donor?.name || name;
    if (targetName?.trim()) {
      const terms = expandBilingualSearchTerms(targetName.trim());
      for (const t of terms) {
        const safeT = safeSearchTerm(t);
        await db.from('income_transactions').update({ is_deleted: true }).ilike('donor_name', `%${safeT}%`);
        await db.from('donors').delete().ilike('name', `%${safeT}%`);
      }
    }

    return res.json({ success: true, message: 'देणगीदार यशस्वीरित्या हटवला / Donor deleted successfully' });
  } catch (err) {
    console.error('deleteDonor error:', err);
    return res.status(500).json({ success: false, message: 'देणगीदार हटवताना त्रुटी' });
  }
}

export async function deleteMultipleDonors(req, res) {
  try {
    const { ids = [], names = [] } = req.body;
    if ((!Array.isArray(ids) || ids.length === 0) && (!Array.isArray(names) || names.length === 0)) {
      return res.status(400).json({ success: false, message: 'हटवण्यासाठी किमान एक देणगीदार निवडा.' });
    }

    const standardIds = (ids || []).map(Number).filter(id => id > 0 && id < 1000000000);

    if (standardIds.length > 0) {
      await db.from('income_transactions').update({ is_deleted: true }).in('donor_id', standardIds);
      await db.from('donors').delete().in('id', standardIds);
    }

    // Also delete by names (bilingual)
    const cleanNames = (names || []).map(n => String(n).trim()).filter(Boolean);
    for (const dName of cleanNames) {
      const terms = expandBilingualSearchTerms(dName);
      for (const t of terms) {
        const safeT = safeSearchTerm(t);
        await db.from('income_transactions').update({ is_deleted: true }).ilike('donor_name', `%${safeT}%`);
        await db.from('donors').delete().ilike('name', `%${safeT}%`);
      }
    }

    return res.json({ success: true, message: 'निवडलेले देणगीदार यशस्वीरित्या हटवले / Selected donors deleted successfully' });
  } catch (err) {
    console.error('deleteMultipleDonors error:', err);
    return res.status(500).json({ success: false, message: 'देणगीदार हटवताना त्रुटी' });
  }
}

export async function reconcileAndDeduplicateDonors(req, res) {
  try {
    const { data: allDonors, error: dErr } = await db.from('donors').select('*').order('id', { ascending: true });
    throwIfError(dErr);
    const { data: allTx, error: tErr } = await db.from('income_transactions').select('*').eq('is_deleted', false);
    throwIfError(tErr);

    const donors = allDonors || [];
    const txs = allTx || [];

    // Group donors by normalized 10-digit mobile, or lowercase trimmed name
    const grouped = new Map();

    donors.forEach(d => {
      const mob = (d.mobile || '').replace(/\D/g, '').slice(-10);
      const key = (mob.length === 10) ? `mob_${mob}` : `name_${(d.name || '').trim().toLowerCase()}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(d);
    });

    let mergedCount = 0;
    const details = [];

    for (const [key, group] of grouped.entries()) {
      if (group.length <= 1) continue;

      // Found duplicates! Pick canonical donor
      const sorted = [...group].sort((a, b) => {
        const aHasMr = /[\u0900-\u097F]/.test(a.name || '');
        const bHasMr = /[\u0900-\u097F]/.test(b.name || '');
        if (aHasMr && !bHasMr) return -1;
        if (!aHasMr && bHasMr) return 1;
        const aTarget = Number(a.target_amount || 0);
        const bTarget = Number(b.target_amount || 0);
        if (bTarget !== aTarget) return bTarget - aTarget;
        return a.id - b.id;
      });

      const canonical = sorted[0];
      const duplicates = sorted.slice(1);
      const duplicateIds = duplicates.map(d => d.id);

      // Re-link all transactions linked to duplicate IDs to canonical.id
      for (const dupId of duplicateIds) {
        await db.from('income_transactions').update({
          donor_id: canonical.id,
          donor_name: canonical.name,
          mobile: canonical.mobile || undefined,
          address: canonical.address || undefined
        }).eq('donor_id', dupId);
      }

      // Re-link any transactions where donor_name matches the canonical name or duplicate names
      const allNamesInGroup = group.map(g => (g.name || '').trim()).filter(Boolean);
      for (const nameToMatch of allNamesInGroup) {
        await db.from('income_transactions').update({
          donor_id: canonical.id,
          donor_name: canonical.name,
          mobile: canonical.mobile || undefined
        }).ilike('donor_name', nameToMatch);
      }

      // Re-calculate payments for canonical donor
      const { data: matchedTxs } = await db.from('income_transactions').select('amount').eq('donor_id', canonical.id).eq('is_deleted', false);
      const totalPaid = (matchedTxs || []).reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      const maxTargetInGroup = Math.max(...group.map(g => Number(g.target_amount || 0)), 500);
      const effectiveTarget = Math.max(maxTargetInGroup, totalPaid);
      const newStatus = (totalPaid >= effectiveTarget && effectiveTarget > 0) ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid');

      await db.from('donors').update({
        target_amount: effectiveTarget,
        paid_amount: totalPaid,
        total_donated: totalPaid,
        donations_count: matchedTxs?.length || 0,
        status: newStatus
      }).eq('id', canonical.id);

      // Delete duplicate donor rows
      await db.from('donors').delete().in('id', duplicateIds);

      mergedCount += duplicates.length;
      details.push({
        canonicalId: canonical.id,
        canonicalName: canonical.name,
        mergedIds: duplicateIds,
        effectiveTarget,
        totalPaid
      });
    }

    return res.json({
      success: true,
      message: `${mergedCount} दुबार देणगीदार खाती यशस्वीरित्या एकत्रित केली! / Successfully deduplicated ${mergedCount} duplicate donor profiles!`,
      mergedCount,
      details
    });
  } catch (err) {
    console.error('reconcileAndDeduplicateDonors error:', err);
    return res.status(500).json({ success: false, message: 'डेटा दुरुस्त करताना त्रुटी: ' + (err.message || err) });
  }
}

