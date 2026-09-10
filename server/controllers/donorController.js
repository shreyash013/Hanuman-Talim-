import { db } from '../database/db.js';
import { safeSearchTerm, sum, throwIfError } from '../utils/dbHelpers.js';

function applyDonorFilters(query, search, area) {
  if (search) {
    const s = safeSearchTerm(search);
    query = query.or(`name.ilike.%${s}%,mobile.ilike.%${s}%,area.ilike.%${s}%,address.ilike.%${s}%`);
  }
  if (area) query = query.eq('area', area);
  return query;
}

export async function getDonorsList(req, res) {
  try {
    const { page = 1, limit = 20, search = '', area = '' } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let pageQuery = db.from('donors').select('*', { count: 'exact' }).order('total_donated', { ascending: false }).order('donations_count', { ascending: false });
    pageQuery = applyDonorFilters(pageQuery, search, area);
    const { data: donors, count, error } = await pageQuery.range(offset, offset + limitNum - 1);
    throwIfError(error);

    let summaryQuery = db.from('donors').select('total_donated');
    summaryQuery = applyDonorFilters(summaryQuery, search, area);
    const { data: summaryRows, error: summaryError } = await summaryQuery;
    throwIfError(summaryError);

    const total = count || 0;
    return res.json({ success: true, data: donors || [], summary: { totalDonors: total, grandTotal: sum(summaryRows, r => r.total_donated) }, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 } });
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
    const { data, error } = await db.from('donors').select('id, name, mobile, address, area, total_donated, donations_count, last_donated_at').or(`name.ilike.%${s}%,mobile.ilike.%${s}%,area.ilike.%${s}%`).order('total_donated', { ascending: false }).limit(10);
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
    const { name, mobile, email = '', address = '', area = '', notes = '' } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'नाव आवश्यक आहे.' });
    if (!mobile?.trim()) return res.status(400).json({ success: false, message: 'मोबाईल क्रमांक आवश्यक आहे.' });

    const { data: existing, error: existingError } = await db.from('donors').select('id').eq('mobile', mobile.trim()).maybeSingle();
    throwIfError(existingError);
    if (existing) return res.status(400).json({ success: false, message: 'हा मोबाईल क्रमांक आधीच अस्तित्वात आहे.' });

    const { data: created, error } = await db.from('donors').insert({ name: name.trim(), mobile: mobile.trim(), email: email.trim(), address: address.trim(), area: area.trim(), notes: notes.trim() }).select('*').single();
    throwIfError(error);
    return res.status(201).json({ success: true, message: 'देणगीदार यशस्वीरित्या जोडला / Donor added successfully', data: created });
  } catch (err) {
    console.error('createDonor error:', err);
    return res.status(500).json({ success: false, message: 'नोंदणी करताना त्रुटी' });
  }
}

export async function updateDonor(req, res) {
  try {
    const { id } = req.params;
    const { name, mobile, email = '', address = '', area = '', notes = '', target_amount } = req.body;
    const { data: donor, error } = await db.from('donors').select('*').eq('id', id).maybeSingle();
    throwIfError(error);
    if (!donor) return res.status(404).json({ success: false, message: 'देणगीदार सापडला नाही.' });

    const updatePayload = {
      name: name?.trim() || donor.name,
      mobile: mobile?.trim() || donor.mobile,
      email: email.trim(),
      address: address.trim(),
      area: area.trim(),
      notes: notes.trim()
    };
    if (target_amount !== undefined) {
      updatePayload.target_amount = Number(target_amount);
    }

    const { data: updated, error: updateError } = await db.from('donors').update(updatePayload).eq('id', id).select('*').single();
    throwIfError(updateError);
    return res.json({ success: true, message: 'माहिती अद्ययावत केली / Donor updated successfully', data: updated });
  } catch (err) {
    console.error('updateDonor error:', err);
    return res.status(500).json({ success: false, message: 'अद्ययावत करताना त्रुटी' });
  }
}

export async function deleteDonor(req, res) {
  try {
    const { id } = req.params;
    const { error } = await db.from('donors').delete().eq('id', id);
    throwIfError(error);
    return res.json({ success: true, message: 'देणगीदार यशस्वीरित्या हटवला / Donor deleted successfully' });
  } catch (err) {
    console.error('deleteDonor error:', err);
    return res.status(500).json({ success: false, message: 'देणगीदार हटवताना त्रुटी' });
  }
}

export async function deleteMultipleDonors(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'हटवण्यासाठी किमान एक देणगीदार निवडा.' });
    }
    const { error } = await db.from('donors').delete().in('id', ids);
    throwIfError(error);
    return res.json({ success: true, message: `${ids.length} देणगीदार यशस्वीरित्या हटवले / Selected donors deleted successfully` });
  } catch (err) {
    console.error('deleteMultipleDonors error:', err);
    return res.status(500).json({ success: false, message: 'देणगीदार हटवताना त्रुटी' });
  }
}
