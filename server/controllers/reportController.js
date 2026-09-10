import { db } from '../database/db.js';
import { countByAndSum, istDayBounds, sum, throwIfError } from '../utils/dbHelpers.js';

function applyDateRange(query, range, startDate, endDate) {
  const now = new Date();
  if (range === 'today') {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const bounds = istDayBounds(date);
    return query.gte('created_at', bounds.start).lt('created_at', bounds.end);
  }
  if (range === '7days' || range === '30days') {
    const days = range === '7days' ? 7 : 30;
    return query.gte('created_at', new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString());
  }
  if (range === 'custom' && startDate && endDate) {
    return query.gte('created_at', istDayBounds(startDate).start).lt('created_at', istDayBounds(endDate).end);
  }
  return query;
}

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function getFinancialReport(req, res) {
  try {
    const { range = 'all', startDate = '', endDate = '' } = req.query;
    let incomeQuery = db.from('income_transactions').select('amount, category, payment_method, collector_name, created_at').eq('is_deleted', false);
    let expenseQuery = db.from('expense_transactions').select('amount, category, payment_method, status, created_at').eq('is_deleted', false);
    incomeQuery = applyDateRange(incomeQuery, range, startDate, endDate);
    expenseQuery = applyDateRange(expenseQuery, range, startDate, endDate);

    const [incomeResult, expenseResult, mandalResult] = await Promise.all([
      incomeQuery,
      expenseQuery,
      db.from('mandal_settings').select('*').limit(1).maybeSingle()
    ]);
    throwIfError(incomeResult.error);
    throwIfError(expenseResult.error);
    throwIfError(mandalResult.error);

    const incomes = incomeResult.data || [];
    const expenses = expenseResult.data || [];
    const approved = expenses.filter(r => ['approved', 'paid'].includes(r.status));
    const pending = expenses.filter(r => r.status === 'pending');
    const totalIncome = sum(incomes);
    const totalApprovedExpense = sum(approved);

    const incomeByCategory = countByAndSum(incomes, 'category').map(r => ({ category: r.category, count: r.count, amount: r.total_amount })).sort((a, b) => b.amount - a.amount);
    const expenseByCategory = countByAndSum(approved, 'category').map(r => ({ category: r.category, count: r.count, amount: r.total_amount })).sort((a, b) => b.amount - a.amount);
    const collectionsByCollector = countByAndSum(incomes.map(r => ({ ...r, collector_name: r.collector_name || 'इतर' })), 'collector_name').sort((a, b) => b.total_amount - a.total_amount);

    return res.json({
      success: true,
      data: {
        range,
        mandal: mandalResult.data,
        totals: {
          totalIncome,
          totalApprovedExpense,
          netBalance: totalIncome - totalApprovedExpense,
          varganiTotal: sum(incomes.filter(r => r.category === 'vargani')),
          donationTotal: sum(incomes.filter(r => r.category === 'donation')),
          sponsorshipTotal: sum(incomes.filter(r => r.category === 'sponsorship')),
          cashIncome: sum(incomes.filter(r => r.payment_method === 'cash')),
          digitalIncome: sum(incomes.filter(r => r.payment_method !== 'cash')),
          cashExpense: sum(approved.filter(r => r.payment_method === 'cash')),
          digitalExpense: sum(approved.filter(r => r.payment_method !== 'cash')),
          pendingExpense: sum(pending)
        },
        incomeByCategory,
        expenseByCategory,
        collectionsByCollector
      }
    });
  } catch (err) {
    console.error('getFinancialReport error:', err);
    return res.status(500).json({ success: false, message: 'अहवाल तयार करताना त्रुटी.' });
  }
}

export async function exportCsvData(req, res) {
  try {
    const type = req.params.type || 'balance_sheet';

    if (type === 'balance_sheet' || type === 'financial') {
      const [mandalResult, incomeResult, expenseResult] = await Promise.all([
        db.from('mandal_settings').select('name_mr, festival_year').limit(1).maybeSingle(),
        db.from('income_transactions').select('receipt_number, donor_name, mobile, address, amount, payment_method, category, purpose, collector_name, created_at').eq('is_deleted', false).order('created_at', { ascending: true }),
        db.from('expense_transactions').select('expense_id, category, description, amount, payment_method, paid_to, bill_number, status, approved_by_name, created_at').eq('is_deleted', false).order('created_at', { ascending: true })
      ]);
      throwIfError(mandalResult.error); throwIfError(incomeResult.error); throwIfError(expenseResult.error);

      const mandalName = mandalResult.data?.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ';
      const year = mandalResult.data?.festival_year || 2026;
      const incomeRows = incomeResult.data || [];
      const expenseRows = expenseResult.data || [];
      const approvedExpenses = expenseRows.filter(r => ['approved', 'paid'].includes(r.status));
      const totalIncome = sum(incomeRows);
      const totalExpense = sum(approvedExpenses);

      let csv = `${csvCell(`${mandalName} - वार्षिक आर्थिक ताळेबंद अहवाल (${year})`)}\n`;
      csv += `${csvCell(`अहवाल दिनांक: ${new Date().toLocaleDateString('en-GB')}`)}\n\n`;
      csv += `--- ताळेबंद गोषवारा (Financial Summary) ---\n`;
      csv += `एकूण जमा रक्कम (Total Income),${totalIncome}\n`;
      csv += `एकूण मंजूर खर्च (Total Expenses),${totalExpense}\n`;
      csv += `एकूण निव्वळ शिल्लक (Net Balance),${totalIncome - totalExpense}\n\n`;
      csv += `--- सर्व जमा नोंदी (Income & Vargani Transactions) ---\n`;
      csv += `पावती क्र.,देणगीदार,मोबाईल,पत्ता,रक्कम (₹),पेमेंट पद्धत,प्रवर्ग,उद्देश,संकलक,दिनांक\n`;
      incomeRows.forEach(r => { csv += [r.receipt_number, r.donor_name, r.mobile, r.address, r.amount, r.payment_method, r.category, r.purpose, r.collector_name, r.created_at].map(csvCell).join(',') + '\n'; });
      csv += `\n--- सर्व खर्च नोंदी (Expense Transactions) ---\n`;
      csv += `खर्च आयडी,प्रवर्ग,वर्णन,रक्कम (₹),पेमेंट पद्धत,कोणाला दिले,बिल क्र.,स्थिती,मंजूरकर्ता,दिनांक\n`;
      expenseRows.forEach(r => { csv += [r.expense_id, r.category, r.description, r.amount, r.payment_method, r.paid_to, r.bill_number, r.status, r.approved_by_name, r.created_at].map(csvCell).join(',') + '\n'; });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="ganpati_mandal_balance_sheet.csv"');
      return res.send('\uFEFF' + csv);
    }

    let query;
    let headers;
    let filename;
    let columns;

    if (type === 'income') {
      columns = ['receipt_number', 'transaction_id', 'donor_name', 'mobile', 'address', 'amount', 'payment_method', 'category', 'purpose', 'collector_name', 'created_at'];
      headers = 'पावती क्र.,Transaction ID,देणगीदार,मोबाईल,पत्ता,रक्कम (₹),पेमेंट पद्धत,प्रवर्ग,उद्देश,संकलक,दिनांक\n';
      filename = 'ganpati_mandal_income.csv';
      query = db.from('income_transactions').select(columns.join(',')).eq('is_deleted', false).order('created_at', { ascending: false });
    } else if (type === 'expenses') {
      columns = ['expense_id', 'category', 'description', 'amount', 'payment_method', 'paid_to', 'bill_number', 'status', 'requested_by_name', 'approved_by_name', 'created_at'];
      headers = 'Expense ID,Category,Description,Amount,Payment Method,Paid To,Bill No,Status,Requested By,Approved By,Date\n';
      filename = 'ganpati_mandal_expenses.csv';
      query = db.from('expense_transactions').select(columns.join(',')).eq('is_deleted', false).order('created_at', { ascending: false });
    } else if (type === 'donors') {
      columns = ['id', 'name', 'mobile', 'email', 'area', 'address', 'total_donated', 'donations_count', 'last_donated_at'];
      headers = 'Donor ID,Name,Mobile,Email,Area,Address,Total Donated (₹),Donations Count,Last Donated Date\n';
      filename = 'ganpati_mandal_donors.csv';
      query = db.from('donors').select(columns.join(',')).order('total_donated', { ascending: false });
    } else if (type === 'members') {
      columns = ['id', 'name', 'role_title_mr', 'role_title_en', 'mobile', 'address', 'blood_group', 'joining_year', 'created_at'];
      headers = 'ID,नाव (Name),पद (मराठी),Designation (EN),मोबाईल (Mobile),पत्ता (Address),रक्तगट (Blood Group),वर्ष (Year),नोंदणी दिनांक\n';
      filename = 'ganpati_mandal_members.csv';
      query = db.from('committee_members').select(columns.join(',')).order('display_order', { ascending: true });
    } else {
      return res.status(400).json({ success: false, message: 'अवैध एक्सपोर्ट प्रकार.' });
    }

    const { data: rows, error } = await query;
    throwIfError(error);
    let csv = headers;
    (rows || []).forEach(r => { csv += columns.map(c => csvCell(r[c])).join(',') + '\n'; });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send('\uFEFF' + csv);
  } catch (err) {
    console.error('exportCsvData error:', err);
    return res.status(500).json({ success: false, message: 'CSV एक्सपोर्ट करताना त्रुटी.' });
  }
}
