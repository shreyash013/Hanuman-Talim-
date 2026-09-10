import { db } from '../database/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { istDayBounds, sum, throwIfError } from '../utils/dbHelpers.js';

export async function getCashSummary(req, res) {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];
    const { start, end } = istDayBounds(targetDate);

    let openingCash = 0;
    try {
      const { data: prev } = await db.from('cash_reconciliation').select('actual_closing').lt('reconciliation_date', targetDate).order('reconciliation_date', { ascending: false }).limit(1).maybeSingle();
      if (prev) openingCash = Number(prev.actual_closing) || 0;
      else {
        const { data: mandal } = await db.from('mandal_settings').select('initial_opening_balance').limit(1).maybeSingle();
        openingCash = Number(mandal?.initial_opening_balance) || 0;
      }
    } catch (e) {
      console.warn('Prev cash rec lookup fallback:', e.message);
    }

    let incomeRows = [];
    try {
      const { data } = await db.from('income_transactions').select('amount').eq('is_deleted', false).ilike('payment_method', '%cash%').gte('created_at', start).lt('created_at', end);
      incomeRows = data || [];
    } catch (e) {
      console.warn('Cash income query fallback:', e.message);
    }

    let expenseRows = [];
    try {
      const { data } = await db.from('expense_transactions').select('amount').eq('is_deleted', false).ilike('payment_method', '%cash%').neq('status', 'rejected').gte('created_at', start).lt('created_at', end);
      expenseRows = data || [];
    } catch (e) {
      console.warn('Cash expense query fallback:', e.message);
    }

    const cashIncome = sum(incomeRows);
    const cashExpense = sum(expenseRows);
    const expectedClosing = openingCash + cashIncome - cashExpense;

    let existingRec = null;
    try {
      const { data } = await db.from('cash_reconciliation').select('*').eq('reconciliation_date', targetDate).maybeSingle();
      existingRec = data || null;
    } catch (e) {
      console.warn('Existing cash rec lookup fallback:', e.message);
    }

    return res.json({
      success: true,
      data: {
        date: targetDate,
        openingCash,
        cashIncome,
        cashIncomeCount: incomeRows.length,
        cashExpense,
        cashExpenseCount: expenseRows.length,
        expectedClosing,
        existingReconciliation: existingRec
      }
    });
  } catch (err) {
    console.error('getCashSummary error:', err);
    return res.status(500).json({ success: false, message: 'रोख ताळेबंद माहिती मिळवताना त्रुटी.' });
  }
}

export async function reconcileCash(req, res) {
  try {
    const { date: targetDate = new Date().toISOString().split('T')[0], opening_cash, cash_income, cash_expense, actual_closing, notes = '' } = req.body;
    const opCash = Number(opening_cash) || 0;
    const incCash = Number(cash_income) || 0;
    const expCash = Number(cash_expense) || 0;
    const actClosing = Number(actual_closing) || 0;
    const expClosing = opCash + incCash - expCash;
    const diff = actClosing - expClosing;
    const status = diff === 0 ? 'reconciled' : 'mismatch';

    const { data: savedRecord, error } = await db.from('cash_reconciliation').upsert({ reconciliation_date: targetDate, opening_cash: opCash, cash_income: incCash, cash_expense: expCash, expected_closing: expClosing, actual_closing: actClosing, difference: diff, status, notes: notes.trim(), verified_by_id: req.user.id, verified_by_name: req.user.name, created_at: new Date().toISOString() }, { onConflict: 'reconciliation_date' }).select('*').single();
    throwIfError(error);

    if (diff !== 0) {
      const { error: notificationError } = await db.from('notifications').insert({ user_id: null, title_mr: 'रोख ताळेबंद तफावत अलर्ट', title_en: 'Cash Discrepancy Alert', message_mr: `दिनांक ${targetDate} च्या रोख ताळेबंदात ₹${Math.abs(diff).toLocaleString('en-IN')} ची तफावत आढळली.`, message_en: `Cash mismatch of ₹${Math.abs(diff).toLocaleString('en-IN')} found on ${targetDate}.`, type: 'error', link: '/cash-management' });
      throwIfError(notificationError);
    }

    await logAudit({ userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'RECONCILE', entity: 'CASH', entityId: targetDate, descriptionMr: `${req.user.name} यांनी ${targetDate} चा रोख ताळेबंद नोंदवला. प्रत्यक्ष शिल्लक: ₹${actClosing} (तफावत: ₹${diff}).`, descriptionEn: `Reconciled cash for ${targetDate}. Actual Closing: ₹${actClosing} (Diff: ₹${diff}).`, newValues: savedRecord, req });

    return res.json({ success: true, message: diff === 0 ? 'रोख ताळेबंद यशस्वीरित्या जुळला! / Cash reconciled with zero difference.' : `रोख ताळेबंद जतन झाला. तफावत: ₹${diff} / Cash recorded with ₹${diff} discrepancy.`, data: savedRecord });
  } catch (err) {
    console.error('reconcileCash error:', err);
    return res.status(500).json({ success: false, message: 'ताळेबंद जतन करताना त्रुटी.' });
  }
}

export async function getCashHistory(req, res) {
  try {
    const { data, error } = await db.from('cash_reconciliation').select('*').order('reconciliation_date', { ascending: false }).limit(30);
    throwIfError(error);
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('getCashHistory error:', err);
    return res.status(500).json({ success: false, message: 'इतिहास मिळवताना त्रुटी.' });
  }
}
