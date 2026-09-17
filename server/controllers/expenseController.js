import { db } from '../database/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { uploadFileToSupabase } from '../middleware/uploadMiddleware.js';
import { istDayBounds, safeSearchTerm, sum, throwIfError } from '../utils/dbHelpers.js';

function applyExpenseFilters(query, filters) {
  const { search, category, status, payment_method, startDate, endDate } = filters;
  if (search) {
    const s = safeSearchTerm(search);
    query = query.or(`description.ilike.%${s}%,paid_to.ilike.%${s}%,bill_number.ilike.%${s}%,expense_id.ilike.%${s}%`);
  }
  if (category) query = query.eq('category', category);
  if (status) {
    if (status.includes(',')) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      query = query.in('status', statuses);
    } else {
      query = query.eq('status', status);
    }
  }
  if (payment_method) query = query.eq('payment_method', payment_method);
  if (startDate) query = query.gte('created_at', istDayBounds(startDate).start);
  if (endDate) query = query.lt('created_at', istDayBounds(endDate).end);
  return query;
}

export async function getExpenseList(req, res) {
  try {
    const filters = {
      search: req.query.search || '',
      category: req.query.category || '',
      status: req.query.status || '',
      payment_method: req.query.payment_method || '',
      startDate: req.query.startDate || '',
      endDate: req.query.endDate || ''
    };
    const pageNum = Math.max(1, Number(req.query.page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let pageQuery = db.from('expense_transactions').select('*', { count: 'exact' }).eq('is_deleted', false).order('created_at', { ascending: false });
    pageQuery = applyExpenseFilters(pageQuery, filters);
    const { data: expenses, count, error } = await pageQuery.range(offset, offset + limitNum - 1);
    throwIfError(error);

    let summaryQuery = db.from('expense_transactions').select('amount, status').eq('is_deleted', false);
    summaryQuery = applyExpenseFilters(summaryQuery, filters);
    const { data: summaryRows, error: summaryError } = await summaryQuery;
    throwIfError(summaryError);

    const rows = summaryRows || [];
    const approved = rows.filter(r => ['approved', 'paid'].includes(r.status));
    const pending = rows.filter(r => r.status === 'pending');
    const rejected = rows.filter(r => r.status === 'rejected');
    const total = count || 0;

    return res.json({ success: true, data: expenses || [], summary: { total, totalAmount: sum(rows), approvedAmount: sum(approved), pendingAmount: sum(pending), rejectedAmount: sum(rejected) }, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 } });
  } catch (err) {
    console.error('getExpenseList error:', err);
    return res.status(500).json({ success: false, message: 'खर्च यादी मिळवताना त्रुटी' });
  }
}

export async function createExpense(req, res) {
  try {
    const { category, description, amount, payment_method = 'cash', paid_to, bill_number = '', notes = '', status: requestedStatus } = req.body;
    const parsedAmount = Number(amount);
    if (!description?.trim()) return res.status(400).json({ success: false, message: 'खर्चाचे वर्णन आवश्यक आहे.' });
    if (!paid_to?.trim()) return res.status(400).json({ success: false, message: 'कोणाला पैसे दिले ते नाव आवश्यक आहे.' });
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ success: false, message: 'कृपया वैध रक्कम भरा (Amount must be > 0).' });
    if (!category) return res.status(400).json({ success: false, message: 'खर्चाचा प्रवर्ग आवश्यक आहे / Expense category is required.' });

    const status = 'pending';
    const approvedByName = null;
    const approvedById = null;
    const approvedAt = null;

    // Use MAX id to prevent duplicate expense IDs after soft-deletes
    const { data: maxExpRow, error: countError } = await db.from('expense_transactions').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
    throwIfError(countError);
    const expenseId = `EXP-2026-${String(((maxExpRow?.id) || 0) + 1).padStart(5, '0')}`;
    const billAttachmentUrl = req.file ? await uploadFileToSupabase(req.file, 'expenses') : '';

    const { data: createdExpense, error } = await db.from('expense_transactions').insert({
      expense_id: expenseId,
      category,
      description: description.trim(),
      amount: parsedAmount,
      payment_method,
      paid_to: paid_to.trim(),
      bill_number: bill_number.trim(),
      bill_attachment_url: billAttachmentUrl,
      status,
      requested_by_id: req.user?.id,
      requested_by_name: req.user?.name,
      approved_by_id: approvedById,
      approved_by_name: approvedByName,
      approved_at: approvedAt,
      notes: notes.trim()
    }).select('*').single();
    throwIfError(error);

    if (status === 'pending') {
      const { error: notificationError } = await db.from('notifications').insert({ user_id: null, title_mr: 'नवीन खर्च मंजुरीसाठी प्रलंबित', title_en: 'Expense Pending Approval', message_mr: `${req.user?.name} यांनी ₹${parsedAmount.toLocaleString('en-IN')} खर्चाची नोंद केली (${description.trim()}). मंजुरी बाकी आहे.`, message_en: `${req.user?.name} recorded expense of ₹${parsedAmount.toLocaleString('en-IN')} (${description.trim()}). Pending approval.`, type: 'warning', link: '/approvals' });
      throwIfError(notificationError);
    }

    await logAudit({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: 'CREATE', entity: 'EXPENSE', entityId: expenseId, descriptionMr: `${req.user?.name} यांनी ₹${parsedAmount.toLocaleString('en-IN')} खर्च नोंदवला (${description.trim()}). स्थिती: ${status}.`, descriptionEn: `Created expense ${expenseId} of ₹${parsedAmount.toLocaleString('en-IN')}. Status: ${status}.`, newValues: createdExpense, req });

    return res.status(201).json({ success: true, message: status === 'pending' ? 'खर्च यशस्वीरित्या नोंदवला व मंजुरीसाठी पाठवला आहे / Expense recorded and sent for approval.' : 'खर्च यशस्वीरित्या नोंदवला व मंजूर झाला / Expense recorded and approved.', data: createdExpense });
  } catch (err) {
    console.error('createExpense error:', err);
    return res.status(500).json({ success: false, message: 'खर्च नोंदवताना त्रुटी निर्माण झाली.' });
  }
}

export async function approveExpense(req, res) {
  try {
    const { id } = req.params;
    const notes = req.body.notes?.trim() || '';
    const { data: expense, error } = await db.from('expense_transactions').select('*').eq('id', id).eq('is_deleted', false).maybeSingle();
    throwIfError(error);
    if (!expense) return res.status(404).json({ success: false, message: 'खर्च व्यवहार सापडला नाही.' });

    const update = { status: 'approved', approved_by_id: req.user.id, approved_by_name: req.user.name, approved_at: new Date().toISOString() };
    if (notes) update.notes = notes;
    const { data: updated, error: updateError } = await db.from('expense_transactions').update(update).eq('id', id).select('*').single();
    throwIfError(updateError);

    await logAudit({ userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'APPROVE', entity: 'EXPENSE', entityId: expense.expense_id, descriptionMr: `${req.user.name} यांनी खर्च ${expense.expense_id} (रक्कम ₹${expense.amount}) मंजूर केला.`, descriptionEn: `Approved expense ${expense.expense_id} (₹${expense.amount}).`, oldValues: { status: expense.status }, newValues: { status: 'approved' }, req });
    return res.json({ success: true, message: 'खर्च यशस्वीरित्या मंजूर करण्यात आला / Expense approved successfully.', data: updated });
  } catch (err) {
    console.error('approveExpense error:', err);
    return res.status(500).json({ success: false, message: 'खर्च मंजूर करताना त्रुटी.' });
  }
}

export async function rejectExpense(req, res) {
  try {
    const { id } = req.params;
    const reason = req.body.reason?.trim() || 'नाही';
    const { data: expense, error } = await db.from('expense_transactions').select('*').eq('id', id).eq('is_deleted', false).maybeSingle();
    throwIfError(error);
    if (!expense) return res.status(404).json({ success: false, message: 'खर्च व्यवहार सापडला नाही.' });

    const notes = `${expense.notes ? `${expense.notes} | ` : ''}नामंजूर करण्याचे कारण: ${reason}`;
    const { error: updateError } = await db.from('expense_transactions').update({ status: 'rejected', notes }).eq('id', id);
    throwIfError(updateError);

    await logAudit({ userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'REJECT', entity: 'EXPENSE', entityId: expense.expense_id, descriptionMr: `${req.user.name} यांनी खर्च ${expense.expense_id} नामंजूर केला. कारण: ${reason}`, descriptionEn: `Rejected expense ${expense.expense_id}. Reason: ${reason}`, oldValues: { status: expense.status }, newValues: { status: 'rejected', reason }, req });
    return res.json({ success: true, message: 'खर्च नामंजूर करण्यात आला / Expense rejected.' });
  } catch (err) {
    console.error('rejectExpense error:', err);
    return res.status(500).json({ success: false, message: 'खर्च नामंजूर करताना त्रुटी.' });
  }
}

export async function deleteExpense(req, res) {
  try {
    const { id } = req.params;
    const { data: expense, error } = await db.from('expense_transactions').select('*').eq('id', id).eq('is_deleted', false).maybeSingle();
    throwIfError(error);
    if (!expense) return res.status(404).json({ success: false, message: 'खर्च व्यवहार सापडला नाही.' });

    const { error: updateError } = await db.from('expense_transactions').update({ is_deleted: true }).eq('id', id);
    throwIfError(updateError);
    await logAudit({ userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'DELETE', entity: 'EXPENSE', entityId: expense.expense_id, descriptionMr: `${req.user.name} यांनी खर्च व्यवहार ${expense.expense_id} हटवला.`, descriptionEn: `Deleted expense transaction ${expense.expense_id}.`, oldValues: expense, req });
    return res.json({ success: true, message: 'खर्च यशस्वीरित्या हटवला / Expense deleted successfully.' });
  } catch (err) {
    console.error('deleteExpense error:', err);
    return res.status(500).json({ success: false, message: 'खर्च हटवताना त्रुटी.' });
  }
}
