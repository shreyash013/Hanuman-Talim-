import { db } from '../database/db.js';
import { countByAndSum, istDateKey, sum, throwIfError } from '../utils/dbHelpers.js';

export async function getDashboardStats(req, res) {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [incomeResult, expenseResult, donorsResult, topDonorsResult, recentIncomeResult, recentExpensesResult, eventsResult, settingsResult] = await Promise.all([
      db.from('income_transactions').select('id, amount, category, payment_method, created_at').eq('is_deleted', false),
      db.from('expense_transactions').select('id, amount, category, payment_method, status, created_at').eq('is_deleted', false),
      db.from('donors').select('*', { count: 'exact', head: true }),
      db.from('donors').select('id, name, mobile, area, total_donated, donations_count').order('total_donated', { ascending: false }).limit(6),
      db.from('income_transactions').select('transaction_id, donor_name, amount, payment_method, category, receipt_number, created_at, status').eq('is_deleted', false).order('created_at', { ascending: false }).limit(5),
      db.from('expense_transactions').select('expense_id, paid_to, amount, payment_method, category, bill_number, created_at, status').eq('is_deleted', false).order('created_at', { ascending: false }).limit(5),
      db.from('events').select('id, title_mr, title_en, event_date, start_time, end_time, location, status').order('event_date', { ascending: true }).order('start_time', { ascending: true }).limit(4),
      db.from('mandal_settings').select('*').limit(1).maybeSingle()
    ]);

    [incomeResult, expenseResult, topDonorsResult, recentIncomeResult, recentExpensesResult, eventsResult, settingsResult].forEach(r => throwIfError(r.error));
    throwIfError(donorsResult.error);

    const incomes = incomeResult.data || [];
    const expenses = (expenseResult.data || []).filter(e => e && e.category !== 'loan_repayment');
    const approvedExpenses = expenses.filter(e => ['approved', 'paid'].includes(e.status));
    const pendingExpenses = expenses.filter(e => e.status === 'pending');
    const today = istDateKey();

    const totalIncome = sum(incomes);
    const totalExpense = sum(approvedExpenses);

    const paymentMethods = countByAndSum(incomes, 'payment_method').sort((a, b) => b.total_amount - a.total_amount);
    const expenseCategories = countByAndSum(approvedExpenses, 'category').sort((a, b) => b.total_amount - a.total_amount);
    const incomeCategories = countByAndSum(incomes, 'category').sort((a, b) => b.total_amount - a.total_amount);

    const trendMap = new Map();
    for (const row of incomes.filter(r => new Date(r.created_at) >= new Date(fourteenDaysAgo))) {
      const date = istDateKey(row.created_at);
      const current = trendMap.get(date) || { date, amount: 0, count: 0 };
      current.amount += Number(row.amount) || 0;
      current.count += 1;
      trendMap.set(date, current);
    }
    const dailyTrend = [...trendMap.values()].sort((a, b) => a.date.localeCompare(b.date));

    const recentIncome = (recentIncomeResult.data || []).map(r => ({
      type: 'income',
      id_code: r.transaction_id,
      party_name: r.donor_name,
      amount: r.amount,
      payment_method: r.payment_method,
      category: r.category,
      receipt_number: r.receipt_number,
      created_at: r.created_at,
      status: r.status
    }));

    const recentExpenses = (recentExpensesResult.data || []).map(r => ({
      type: 'expense',
      id_code: r.expense_id,
      party_name: r.paid_to,
      amount: r.amount,
      payment_method: r.payment_method,
      category: r.category,
      receipt_number: r.bill_number,
      created_at: r.created_at,
      status: r.status
    }));

    const recentTransactions = [...recentIncome, ...recentExpenses]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);

    return res.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          currentBalance: totalIncome - totalExpense,
          totalVargani: sum(incomes.filter(r => r.category === 'vargani')),
          totalDonation: sum(incomes.filter(r => r.category === 'donation')),
          totalSponsorship: sum(incomes.filter(r => r.category === 'sponsorship')),
          totalDonors: donorsResult.count || 0,
          totalTransactions: incomes.length + expenses.length,
          todayCollection: sum(incomes.filter(r => istDateKey(r.created_at) === today)),
          varganiTarget: Number(settingsResult.data?.vargani_target || settingsResult.data?.daily_target || 500000),
          todayExpense: sum(approvedExpenses.filter(r => istDateKey(r.created_at) === today)),
          pendingExpensesCount: pendingExpenses.length,
          pendingExpensesAmount: sum(pendingExpenses),
          cashIncome: sum(incomes.filter(r => r.payment_method === 'cash')),
          digitalIncome: sum(incomes.filter(r => r.payment_method !== 'cash')),
          cashExpense: sum(approvedExpenses.filter(r => r.payment_method === 'cash'))
        },
        paymentMethods,
        expenseCategories,
        incomeCategories,
        dailyTrend,
        topDonors: topDonorsResult.data || [],
        recentTransactions,
        upcomingEvents: eventsResult.data || [],
        mandalSettings: settingsResult.data || null
      }
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ success: false, message: 'डॅशबोर्ड माहिती मिळवताना त्रुटी / Server error loading dashboard.' });
  }
}
