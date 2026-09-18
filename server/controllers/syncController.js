import { db } from '../database/db.js';
import { numberToWordsMarathi, numberToWordsEnglish } from '../utils/marathiNumberWords.js';

export async function autoSyncAll(req, res) {
  try {
    const {
      income = [],
      expenses = [],
      donors = [],
      loans = [],
      receipts = [],
      members = [],
      cash_history = [],
      settings = null
    } = req.body;

    const counts = {
      donors: 0,
      income: 0,
      expenses: 0,
      loans: 0,
      receipts: 0,
      members: 0
    };

    // 1. Sync Mandal Settings
    if (settings && typeof settings === 'object') {
      try {
        const updatePayload = {
          name_mr: settings.name_mr || 'श्री हनुमान तालीम मंडळ शिरोळ',
          name_en: settings.name_en || 'Shri Hanuman Talim Mandal Shirol',
          tagline_mr: settings.tagline_mr || 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा राजा ॥ 🔱',
          tagline_en: settings.tagline_en || 'Est. 1964 🚩 | 62nd Year 🔱 | Nadives Cha Raja 🔱',
          address_mr: settings.address_mr || 'नदीवेस, शिरोळ, जि. कोल्हापूर | ४१६१०३',
          address_en: settings.address_en || 'Nadives, Shirol, Dist. Kolhapur | 416103',
          contact_phone: settings.contact_phone || '+91 9356997428',
          contact_email: settings.contact_email || 'shreyashgavade7@gmail.com',
          registration_no: settings.registration_no || 'MAH/KOLHAPUR/1964',
          festival_year: Number(settings.festival_year) || 2026,
          upi_id: settings.upi_id || '9699572617@ibl',
          upi_name: settings.upi_name || 'SUMEDH SHAHAJI GAVADE',
          receipt_prefix: settings.receipt_prefix || 'HANUMAN-2026-'
        };
        await db.from('mandal_settings').update(updatePayload).eq('id', 1);
      } catch (sErr) {
        console.warn('Sync settings note:', sErr.message);
      }
    }

    // 2. Sync Donors
    const donorNameToIdMap = new Map();
    // Preload existing donors
    const { data: existingDonors } = await db.from('donors').select('id, name, mobile');
    if (Array.isArray(existingDonors)) {
      existingDonors.forEach(d => {
        if (d.name) donorNameToIdMap.set(d.name.trim().toLowerCase(), d.id);
        if (d.mobile) donorNameToIdMap.set(d.mobile.trim(), d.id);
      });
    }

    for (const d of donors) {
      if (!d || !d.name) continue;
      const cleanName = d.name.trim();
      const cleanMobile = (d.mobile || '').trim();
      const keyName = cleanName.toLowerCase();

      let donorId = (cleanMobile && donorNameToIdMap.get(cleanMobile)) || donorNameToIdMap.get(keyName);

      const targetAmount = Number(d.target_amount || d.total_donated || d.paid_amount || 500);
      const paidAmount = Number(d.paid_amount || d.total_donated || 0);

      if (!donorId) {
        const { data: insertedDonor, error: dErr } = await db.from('donors').insert({
          name: cleanName,
          mobile: cleanMobile,
          email: (d.email || '').trim(),
          address: (d.address || '').trim(),
          area: (d.area || 'शिरोळ').trim(),
          target_amount: targetAmount,
          paid_amount: paidAmount,
          total_donated: paidAmount,
          donations_count: Number(d.donations_count) || (paidAmount > 0 ? 1 : 0),
          status: paidAmount >= targetAmount && targetAmount > 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid'),
          notes: d.notes || '',
          last_donated_at: d.last_donated_at || d.created_at || new Date().toISOString(),
          created_at: d.created_at || new Date().toISOString()
        }).select('id').single();

        if (!dErr && insertedDonor) {
          donorId = insertedDonor.id;
          donorNameToIdMap.set(keyName, donorId);
          if (cleanMobile) donorNameToIdMap.set(cleanMobile, donorId);
          counts.donors++;
        }
      } else {
        // Update existing donor with latest totals
        await db.from('donors').update({
          target_amount: targetAmount,
          paid_amount: paidAmount,
          total_donated: paidAmount,
          status: paidAmount >= targetAmount && targetAmount > 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid')
        }).eq('id', donorId);
      }
    }

    // 3. Sync Income / Vargani Transactions
    const { data: existingIncome } = await db.from('income_transactions').select('id, transaction_id, receipt_number');
    const existingTxIds = new Set((existingIncome || []).map(i => i.transaction_id).filter(Boolean));
    const existingReceiptNos = new Set((existingIncome || []).map(i => i.receipt_number).filter(Boolean));

    for (const inc of income) {
      if (!inc || !inc.donor_name || inc.is_deleted) continue;
      const txId = inc.transaction_id || `TXN-LOCAL-${inc.id || Date.now()}`;
      const rNo = inc.receipt_number || `HANUMAN-2026-${String(inc.id || counts.income + 1).padStart(6, '0')}`;

      if (existingTxIds.has(txId) || existingReceiptNos.has(rNo)) {
        continue; // Already exists in cloud DB
      }

      const cleanDonorName = inc.donor_name.trim();
      const cleanMobile = (inc.mobile || '').trim();
      const donorId = (cleanMobile && donorNameToIdMap.get(cleanMobile)) || donorNameToIdMap.get(cleanDonorName.toLowerCase()) || null;
      const parsedAmount = Number(inc.amount) || 0;
      if (parsedAmount <= 0) continue;

      const { data: insertedTx, error: txErr } = await db.from('income_transactions').insert({
        transaction_id: txId,
        donor_id: donorId,
        donor_name: cleanDonorName,
        mobile: cleanMobile,
        address: (inc.address || '').trim(),
        amount: parsedAmount,
        payment_method: inc.payment_method || 'cash',
        category: inc.category || 'vargani',
        purpose: inc.purpose || 'श्री गणेशोत्सव वर्गणी',
        notes: inc.notes || '',
        collector_name: inc.collector_name || 'सुमेध गवडे (अध्यक्ष)',
        receipt_number: rNo,
        status: 'completed',
        created_at: inc.created_at || new Date().toISOString()
      }).select('id').single();

      if (!txErr && insertedTx) {
        counts.income++;
        existingTxIds.add(txId);
        existingReceiptNos.add(rNo);

        // Also insert receipt record
        const verificationCode = `V-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
        const { data: insertedRcpt } = await db.from('receipts').insert({
          receipt_number: rNo,
          transaction_id: insertedTx.id,
          donor_name: cleanDonorName,
          mobile: cleanMobile,
          address: (inc.address || '').trim(),
          amount: parsedAmount,
          amount_in_words_mr: inc.amount_in_words_mr || numberToWordsMarathi(parsedAmount),
          amount_in_words_en: inc.amount_in_words_en || numberToWordsEnglish(parsedAmount),
          payment_method: inc.payment_method || 'cash',
          category: inc.category || 'vargani',
          purpose: inc.purpose || 'श्री गणेशोत्सव वर्गणी',
          collector_name: inc.collector_name || 'सुमेध गवडे (अध्यक्ष)',
          verification_code: verificationCode,
          created_at: inc.created_at || new Date().toISOString()
        }).select('id').single();

        if (insertedRcpt) {
          await db.from('income_transactions').update({ receipt_id: insertedRcpt.id }).eq('id', insertedTx.id);
          counts.receipts++;
        }
      }
    }

    // 4. Sync Expense Transactions
    const { data: existingExpenses } = await db.from('expense_transactions').select('id, expense_id, description, amount');
    const existingExpIds = new Set((existingExpenses || []).map(e => e.expense_id).filter(Boolean));

    for (const exp of expenses) {
      if (!exp || !exp.description || exp.is_deleted) continue;
      const expId = exp.expense_id || `EXP-2026-${String(counts.expenses + 1).padStart(5, '0')}`;

      if (existingExpIds.has(expId)) {
        continue;
      }

      const parsedAmount = Number(exp.amount) || 0;
      if (parsedAmount <= 0) continue;

      const { data: insertedExp, error: expErr } = await db.from('expense_transactions').insert({
        expense_id: expId,
        category: exp.category || 'other',
        description: (exp.description || '').trim(),
        amount: parsedAmount,
        payment_method: exp.payment_method || 'cash',
        paid_to: (exp.paid_to || 'खर्च').trim(),
        bill_number: (exp.bill_number || '').trim(),
        bill_attachment_url: exp.bill_attachment_url || '',
        status: exp.status || 'approved',
        requested_by_name: exp.requested_by_name || 'खजिनदार',
        approved_by_name: exp.approved_by_name || 'अध्यक्ष (Admin)',
        approved_at: exp.approved_at || exp.created_at || new Date().toISOString(),
        notes: exp.notes || '',
        created_at: exp.created_at || new Date().toISOString()
      }).select('id').single();

      if (!expErr && insertedExp) {
        counts.expenses++;
        existingExpIds.add(expId);
      }
    }

    // 5. Sync Loans
    const { data: existingLoans } = await db.from('loans').select('id, person_name, amount, created_at');
    for (const l of loans) {
      if (!l || !l.person_name) continue;
      const personName = l.person_name.trim();
      const loanAmount = Number(l.amount) || 0;
      if (loanAmount <= 0) continue;

      const alreadyExists = (existingLoans || []).some(el =>
        el.person_name && el.person_name.trim().toLowerCase() === personName.toLowerCase() &&
        Math.abs(Number(el.amount) - loanAmount) < 0.01
      );

      if (!alreadyExists) {
        const { error: loanErr } = await db.from('loans').insert({
          person_name: personName,
          mobile: (l.mobile || '').trim(),
          type: l.type || 'borrowed',
          amount: loanAmount,
          paid_amount: Number(l.paid_amount) || 0,
          remaining_amount: Number(l.remaining_amount !== undefined ? l.remaining_amount : loanAmount - (Number(l.paid_amount) || 0)),
          payment_method: l.payment_method || 'cash',
          purpose: l.purpose || '',
          due_date: l.due_date || null,
          interest_rate: Number(l.interest_rate) || 0,
          notes: l.notes || '',
          status: l.status || 'pending',
          repayments: Array.isArray(l.repayments) ? l.repayments : [],
          created_at: l.created_at || new Date().toISOString()
        });

        if (!loanErr) {
          counts.loans++;
        }
      }
    }

    // 6. Sync Committee Members
    const { data: existingMembers } = await db.from('committee_members').select('id, name');
    const existingMemberNames = new Set((existingMembers || []).map(m => (m.name || '').trim().toLowerCase()));

    for (const m of members) {
      if (!m || !m.name) continue;
      const mName = m.name.trim();
      if (!existingMemberNames.has(mName.toLowerCase())) {
        const { error: mErr } = await db.from('committee_members').insert({
          name: mName,
          role_title_mr: m.role_title_mr || 'कार्यकर्ता',
          role_title_en: m.role_title_en || 'Member',
          mobile: (m.mobile || '9822012345').trim(),
          address: m.address || 'नदीवेस, शिरोळ',
          joining_year: Number(m.joining_year) || 2026,
          blood_group: m.blood_group || 'O+'
        });
        if (!mErr) {
          counts.members++;
          existingMemberNames.add(mName.toLowerCase());
        }
      }
    }

    return res.json({
      success: true,
      message: 'सर्व स्थानिक डेटा लाईव्ह सर्व्हरवर ऑटोमॅटिकली यशस्वीरित्या सिंक झाला!',
      counts
    });
  } catch (err) {
    console.error('autoSyncAll error:', err);
    return res.status(500).json({
      success: false,
      message: 'डेटा सिंक करताना त्रुटी: ' + (err.message || err)
    });
  }
}

export async function getCloudFullData(req, res) {
  try {
    const [
      incomeRes,
      expensesRes,
      donorsRes,
      loansRes,
      receiptsRes,
      settingsRes,
      membersRes
    ] = await Promise.all([
      db.from('income_transactions').select('*').eq('is_deleted', false).order('created_at', { ascending: false }),
      db.from('expense_transactions').select('*').eq('is_deleted', false).order('created_at', { ascending: false }),
      db.from('donors').select('*').order('total_donated', { ascending: false }),
      db.from('loans').select('*').order('created_at', { ascending: false }),
      db.from('receipts').select('*').order('created_at', { ascending: false }),
      db.from('mandal_settings').select('*').limit(1).maybeSingle(),
      db.from('committee_members').select('*').order('display_order', { ascending: true })
    ]);

    return res.json({
      success: true,
      data: {
        income: incomeRes.data || [],
        expenses: expensesRes.data || [],
        donors: donorsRes.data || [],
        loans: loansRes.data || [],
        receipts: receiptsRes.data || [],
        settings: settingsRes.data || null,
        members: membersRes.data || []
      }
    });
  } catch (err) {
    console.error('getCloudFullData error:', err);
    return res.status(500).json({
      success: false,
      message: 'क्लाउड डेटा मिळवताना त्रुटी: ' + (err.message || err)
    });
  }
}
