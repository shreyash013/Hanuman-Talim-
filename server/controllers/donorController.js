import { db } from '../database/db.js';
import { safeSearchTerm, sum, throwIfError, expandBilingualSearchTerms } from '../utils/dbHelpers.js';

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

    let summaryQuery = db.from('donors').select('target_amount, paid_amount, total_donated');
    summaryQuery = applyDonorFilters(summaryQuery, search, area);
    const { data: summaryRows, error: summaryError } = await summaryQuery;
    throwIfError(summaryError);

    const total = count || 0;
    const rows = summaryRows || [];
    const totalTarget = rows.reduce((acc, r) => acc + (Number(r.target_amount) || Number(r.total_donated) || 500), 0);
    const totalPaid = rows.reduce((acc, r) => acc + (Number(r.paid_amount) || Number(r.total_donated) || 0), 0);
    const totalPending = Math.max(0, totalTarget - totalPaid);

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
    const { data: donor, error } = await db.from('donors').select('*').eq('id', id).maybeSingle();
    throwIfError(error);
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
    if (cleanMobile) {
      const { data: existing, error: existingError } = await db.from('donors').select('id').eq('mobile', cleanMobile).maybeSingle();
      throwIfError(existingError);
      if (existing) return res.status(400).json({ success: false, message: 'हा मोबाईल क्रमांक आधीच अस्तित्वात आहे.' });
    }

    const target = Number(target_amount || amount || 500);
    const { data: created, error } = await db.from('donors').insert({
      name: name.trim(),
      mobile: cleanMobile,
      email: email.trim(),
      address: address.trim(),
      area: (area || 'शिरोळ').trim(),
      notes: notes.trim(),
      target_amount: target,
      paid_amount: 0,
      total_donated: 0,
      donations_count: 0,
      status: 'unpaid'
    }).select('*').single();
    throwIfError(error);

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
      const { data } = await db.from('donors').select('*').eq('id', id).maybeSingle();
      donor = data;
    }

    // 2. If not found by ID, try finding by originalName or current name
    const targetName = (originalName || name)?.trim();
    if (!donor && targetName) {
      const { data } = await db.from('donors').select('*').ilike('name', targetName).maybeSingle();
      donor = data;
    }

    // 3. Fallback: try finding by mobile
    const cleanMobile = mobile ? mobile.trim() : '';
    if (!donor && cleanMobile) {
      const { data } = await db.from('donors').select('*').eq('mobile', cleanMobile).maybeSingle();
      donor = data;
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
    if (paid_amount !== undefined) updatePayload.paid_amount = Number(paid_amount);

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
      await db.from('income_transactions').update(txUpdates).eq('donor_id', donor.id);
      if (oldName) {
        await db.from('income_transactions').update(txUpdates).ilike('donor_name', oldName);
        await db.from('receipts').update(txUpdates).ilike('donor_name', oldName);
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
    // 1. Try finding by ID if it's a standard database ID
    if (id && Number(id) < 1000000000) {
      const { data } = await db.from('donors').select('id, name, mobile').eq('id', id).maybeSingle();
      donor = data;
    }

    // 2. If not found by ID, try finding by name or mobile
    if (!donor && name?.trim()) {
      const { data } = await db.from('donors').select('id, name, mobile').ilike('name', name.trim()).maybeSingle();
      donor = data;
    }

    if (!donor && mobile?.trim()) {
      const cleanMobile = mobile.trim();
      const { data } = await db.from('donors').select('id, name, mobile').eq('mobile', cleanMobile).maybeSingle();
      donor = data;
    }

    // Perform deletions
    if (donor?.id) {
      await db.from('donors').delete().eq('id', donor.id);
      await db.from('income_transactions').update({ is_deleted: true }).eq('donor_id', donor.id);
    } else if (id && Number(id) < 1000000000) {
      await db.from('donors').delete().eq('id', id);
      await db.from('income_transactions').update({ is_deleted: true }).eq('donor_id', id);
    }

    const targetName = donor?.name || name;
    if (targetName?.trim()) {
      await db.from('donors').delete().ilike('name', targetName.trim());
      await db.from('income_transactions').update({ is_deleted: true }).ilike('donor_name', targetName.trim());
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
      await db.from('donors').delete().in('id', standardIds);
      await db.from('income_transactions').update({ is_deleted: true }).in('donor_id', standardIds);
    }

    // Also delete by names
    const cleanNames = (names || []).map(n => String(n).trim()).filter(Boolean);
    for (const dName of cleanNames) {
      await db.from('donors').delete().ilike('name', dName);
      await db.from('income_transactions').update({ is_deleted: true }).ilike('donor_name', dName);
    }

    return res.json({ success: true, message: 'निवडलेले देणगीदार यशस्वीरित्या हटवले / Selected donors deleted successfully' });
  } catch (err) {
    console.error('deleteMultipleDonors error:', err);
    return res.status(500).json({ success: false, message: 'देणगीदार हटवताना त्रुटी' });
  }
}

