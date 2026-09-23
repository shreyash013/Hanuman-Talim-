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
      settings = null,
      deleted_donors = []
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
          tagline_mr: settings.tagline_mr || 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा महाराजा ॥ 🔱',
          tagline_en: settings.tagline_en || 'Est. 1964 🚩 | 62nd Year 🔱 | Nadives Cha Maharaja 🔱',
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

    // 1.5 Handle Deleted Donors Synchronization
    const deletedNameSet = new Set();
    const deletedIdSet = new Set();
    const deletedMobileSet = new Set();

    if (Array.isArray(deleted_donors) && deleted_donors.length > 0) {
      for (const item of deleted_donors) {
        if (!item) continue;
        let itemStr = '';
        if (typeof item === 'string') {
          itemStr = item.trim().toLowerCase();
        } else if (typeof item === 'object') {
          if (item.name) itemStr = String(item.name).trim().toLowerCase();
          if (item.id) deletedIdSet.add(String(item.id));
          if (item.mobile) deletedMobileSet.add(String(item.mobile).trim());
        }
        // PROTECT Pruthviraj Gavade and variations from being deleted by tombstone
        if (itemStr && !itemStr.includes('pruthvi') && !itemStr.includes('पृथ्वी')) {
          deletedNameSet.add(itemStr);
        }
      }

      // Delete from Supabase donors table and soft-delete related income using STRICT matching (not wildcards)
      try {
        for (const name of deletedNameSet) {
          if (name.includes('pruthvi') || name.includes('पृथ्वी')) continue;
          await db.from('income_transactions').update({ is_deleted: true }).eq('donor_name', name);
          await db.from('donors').delete().eq('name', name);
        }
        for (const id of deletedIdSet) {
          const numId = Number(id);
          if (!isNaN(numId) && numId > 0 && numId < 1000000000) {
            const { data: chk } = await db.from('donors').select('name').eq('id', numId).maybeSingle();
            if (chk?.name && (chk.name.toLowerCase().includes('pruthvi') || chk.name.includes('पृथ्वी'))) {
              continue;
            }
            await db.from('income_transactions').update({ is_deleted: true }).eq('donor_id', numId);
            await db.from('donors').delete().eq('id', numId);
          }
        }
        for (const mob of deletedMobileSet) {
          if (mob.length >= 10) {
            await db.from('income_transactions').update({ is_deleted: true }).eq('mobile', mob);
            await db.from('donors').delete().eq('mobile', mob);
          }
        }
      } catch (delErr) {
        console.warn('Sync deleted donors note:', delErr.message);
      }
    }

    // 2. Sync Donors (Diff-checked & Batch Inserted for 100x speed)
    const { data: existingDonors } = await db.from('donors').select('id, name, mobile, target_amount, paid_amount, status');
    const existingDonorMapByName = new Map();
    const existingDonorMapByMobile = new Map();
    const existingDonorMapById = new Map();

    if (Array.isArray(existingDonors)) {
      existingDonors.forEach(d => {
        if (d.name) existingDonorMapByName.set(d.name.trim().toLowerCase(), d);
        if (d.mobile) existingDonorMapByMobile.set(d.mobile.trim(), d);
        if (d.id) existingDonorMapById.set(String(d.id), d);
      });
    }

    const donorsToInsert = [];
    const donorUpdates = [];

    for (const d of donors) {
      if (!d || !d.name) continue;
      let cleanName = d.name.trim();
      const lower = cleanName.toLowerCase();
      if (lower === 'pruthvi gavade' || lower === 'prithvi gavade' || cleanName === 'पृथ्वी गवडे') {
        cleanName = 'Pruthviraj Gavade';
      }
      const cleanMobile = (d.mobile || '').trim();
      const keyName = cleanName.toLowerCase();

      // Skip any donor that was marked as deleted
      if (deletedNameSet.has(keyName) || deletedNameSet.has('pruthvi gavade')) continue;
      if (cleanMobile && deletedMobileSet.has(cleanMobile)) continue;
      if (d.id && deletedIdSet.has(String(d.id))) continue;

      const matchByName = existingDonorMapByName.get(keyName);
      const matchByMobile = cleanMobile ? existingDonorMapByMobile.get(cleanMobile) : null;
      const isMobileNameMatch = matchByMobile && (
        matchByMobile.name.toLowerCase() === keyName ||
        matchByMobile.name.toLowerCase().split(/\s+/).some(w => w.length >= 3 && keyName.includes(w))
      );
      const matchById = d.id ? existingDonorMapById.get(String(d.id)) : null;

      const existing = matchByName ||
                       existingDonorMapByName.get('pruthviraj gavade') ||
                       (isMobileNameMatch ? matchByMobile : null) ||
                       (matchById && matchById.name.toLowerCase() === keyName ? matchById : null);

      const targetAmount = Number(d.target_amount || d.total_donated || d.paid_amount || 500);
      const paidAmount = Number(d.paid_amount || d.total_donated || 0);
      const expectedStatus = paidAmount >= targetAmount && targetAmount > 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid');

      if (!existing) {
        donorsToInsert.push({
          name: cleanName,
          mobile: cleanMobile,
          email: (d.email || '').trim(),
          address: (d.address || '').trim(),
          area: (d.area || 'शिरोळ').trim(),
          target_amount: targetAmount,
          paid_amount: paidAmount,
          total_donated: paidAmount,
          donations_count: Number(d.donations_count) || (paidAmount > 0 ? 1 : 0),
          status: expectedStatus,
          notes: d.notes || '',
          last_donated_at: d.last_donated_at || d.created_at || new Date().toISOString(),
          created_at: d.created_at || new Date().toISOString()
        });
      } else {
        // Diff checking: only update if values actually changed!
        const curTarget = Number(existing.target_amount || 0);
        const curPaid = Number(existing.paid_amount || 0);
        const curStatus = existing.status || 'unpaid';

        const updateFields = {
          target_amount: targetAmount,
          paid_amount: paidAmount,
          total_donated: paidAmount,
          status: expectedStatus
        };
        if (d.name && d.name.trim() && d.name.trim() !== existing.name) updateFields.name = d.name.trim();
        if (d.mobile !== undefined && d.mobile.trim() !== (existing.mobile || '')) updateFields.mobile = d.mobile.trim();
        if (d.area && d.area.trim()) updateFields.area = d.area.trim();
        if (d.address !== undefined) updateFields.address = d.address.trim();

        if (curTarget !== targetAmount || curPaid !== paidAmount || curStatus !== expectedStatus || updateFields.name || updateFields.mobile) {
          donorUpdates.push(
            db.from('donors').update(updateFields).eq('id', existing.id)
          );
        }

      }
    }

    // Batch insert new donors in 1 single network request!
    if (donorsToInsert.length > 0) {
      try {
        const { data: insertedDonors, error: dErr } = await db.from('donors').insert(donorsToInsert).select('id, name, mobile');
        if (!dErr && insertedDonors) {
          counts.donors += insertedDonors.length;
          insertedDonors.forEach(d => {
            if (d.name) existingDonorMapByName.set(d.name.trim().toLowerCase(), d);
            if (d.mobile) existingDonorMapByMobile.set(d.mobile.trim(), d);
          });
        }
      } catch (err) {
        console.warn('Batch donor insert note:', err.message);
      }
    }

    // Execute needed updates concurrently
    if (donorUpdates.length > 0) {
      await Promise.allSettled(donorUpdates);
    }

    // 3. Sync Income / Vargani Transactions (Parallelized)
    const { data: existingIncome } = await db.from('income_transactions').select('id, transaction_id, receipt_number');
    const existingTxIds = new Set((existingIncome || []).map(i => i.transaction_id).filter(Boolean));
    const existingReceiptNos = new Set((existingIncome || []).map(i => i.receipt_number).filter(Boolean));

    const newIncomeItems = [];
    for (const inc of income) {
      if (!inc || !inc.donor_name || inc.is_deleted) continue;
      const txId = inc.transaction_id || `TXN-LOCAL-${inc.id || Date.now()}`;
      const rNo = inc.receipt_number || `HANUMAN-2026-${String(inc.id || counts.income + 1).padStart(6, '0')}`;

      if (existingTxIds.has(txId) || existingReceiptNos.has(rNo)) {
        continue;
      }

      const cleanDonorName = inc.donor_name.trim();
      if (deletedNameSet.has(cleanDonorName.toLowerCase())) continue;

      const parsedAmount = Number(inc.amount) || 0;
      if (parsedAmount <= 0) continue;

      newIncomeItems.push({ inc, txId, rNo, cleanDonorName, parsedAmount });
    }

    if (newIncomeItems.length > 0) {
      await Promise.allSettled(newIncomeItems.map(async ({ inc, txId, rNo, cleanDonorName, parsedAmount }) => {
        try {
          const cleanMobile = (inc.mobile || '').trim();
          const matchByName = existingDonorMapByName.get(cleanDonorName.toLowerCase());
          const matchMobile = cleanMobile ? existingDonorMapByMobile.get(cleanMobile) : null;
          const isMobileNameMatch = matchMobile && (
            matchMobile.name.toLowerCase() === cleanDonorName.toLowerCase() ||
            matchMobile.name.toLowerCase().split(/\s+/).some(w => w.length >= 3 && cleanDonorName.toLowerCase().includes(w))
          );
          const donorMatch = matchByName || (isMobileNameMatch ? matchMobile : null);
          const donorId = donorMatch ? donorMatch.id : null;

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

            // Update matching donor's paid amount and payment status
            if (donorId) {
              try {
                const { data: dRows } = await db.from('donors').select('target_amount, paid_amount, total_donated, donations_count').eq('id', donorId).limit(1);
                const dRow = dRows?.[0] || null;
                if (dRow) {
                  const newPaid = (Number(dRow.paid_amount || dRow.total_donated) || 0) + parsedAmount;
                  const targetAmt = Number(dRow.target_amount) || 500;
                  const newStatus = (newPaid >= targetAmt && targetAmt > 0) ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid');
                  await db.from('donors').update({
                    paid_amount: newPaid,
                    total_donated: newPaid,
                    donations_count: (Number(dRow.donations_count) || 0) + 1,
                    status: newStatus,
                    last_donated_at: inc.created_at || new Date().toISOString()
                  }).eq('id', donorId);
                }
              } catch (dErr) {
                console.warn('Sync donor stats update note:', dErr.message);
              }
            }
          }
        } catch (incErr) {
          console.warn('Sync income item note:', incErr.message);
        }
      }));
    }

    // 4. Sync Expense Transactions (Diff-checked & Batch Inserted)
    const { data: existingExpenses } = await db.from('expense_transactions').select('id, expense_id, description, amount, status');
    const existingExpMap = new Map((existingExpenses || []).map(e => [e.expense_id, e]));

    const expensesToInsert = [];
    const expenseUpdates = [];

    for (const exp of expenses) {
      if (!exp || !exp.description || exp.is_deleted) continue;
      const expId = exp.expense_id || `EXP-2026-${String(counts.expenses + 1).padStart(5, '0')}`;
      const existingExp = existingExpMap.get(expId);

      if (existingExp) {
        // Diff check: only update if status actually changed!
        if (exp.status && ['approved', 'rejected', 'paid'].includes(exp.status) && existingExp.status !== exp.status) {
          expenseUpdates.push(
            db.from('expense_transactions').update({
              status: exp.status,
              approved_by_name: exp.approved_by_name || 'अध्यक्ष (Admin)',
              approved_at: exp.approved_at || new Date().toISOString(),
              notes: exp.notes || ''
            }).eq('expense_id', expId)
          );
        }
        continue;
      }

      const parsedAmount = Number(exp.amount) || 0;
      if (parsedAmount <= 0) continue;

      expensesToInsert.push({
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
      });
    }

    if (expensesToInsert.length > 0) {
      try {
        const { data: insertedExps, error: expErr } = await db.from('expense_transactions').insert(expensesToInsert).select('id, expense_id');
        if (!expErr && insertedExps) {
          counts.expenses += insertedExps.length;
        }
      } catch (err) {
        console.warn('Batch expense insert note:', err.message);
      }
    }

    if (expenseUpdates.length > 0) {
      await Promise.allSettled(expenseUpdates);
    }

    // 5. Sync Loans
    const { data: existingLoans } = await db.from('loans').select('id, person_name, amount, created_at');
    const loansToInsert = [];
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
        loansToInsert.push({
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
      }
    }

    if (loansToInsert.length > 0) {
      try {
        const { error: loanErr } = await db.from('loans').insert(loansToInsert);
        if (!loanErr) counts.loans += loansToInsert.length;
      } catch (err) {
        console.warn('Batch loan insert note:', err.message);
      }
    }

    // 6. Sync Committee Members
    const { data: existingMembers } = await db.from('committee_members').select('id, name');
    const existingMemberNames = new Set((existingMembers || []).map(m => (m.name || '').trim().toLowerCase()));
    const membersToInsert = [];

    for (const m of members) {
      if (!m || !m.name) continue;
      const mName = m.name.trim();
      if (!existingMemberNames.has(mName.toLowerCase())) {
        membersToInsert.push({
          name: mName,
          role_title_mr: m.role_title_mr || 'कार्यकर्ता',
          role_title_en: m.role_title_en || 'Member',
          mobile: (m.mobile || '9822012345').trim(),
          address: m.address || 'नदीवेस, शिरोळ',
          joining_year: Number(m.joining_year) || 2026,
          blood_group: m.blood_group || 'O+'
        });
        existingMemberNames.add(mName.toLowerCase());
      }
    }

    if (membersToInsert.length > 0) {
      try {
        const { error: mErr } = await db.from('committee_members').insert(membersToInsert);
        if (!mErr) counts.members += membersToInsert.length;
      } catch (err) {
        console.warn('Batch member insert note:', err.message);
      }
    }

    // Ensure Pruthviraj Gavade continuity and un-deletion
    await restorePruthvirajGavadeAndFixContinuity();

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

export async function restorePruthvirajGavadeAndFixContinuity() {
  try {
    // 1. Find or create Pruthviraj Gavade in donors table
    const { data: dRows } = await db.from('donors')
      .select('id, name, target_amount, paid_amount')
      .ilike('name', '%Pruthvi%')
      .limit(1);

    let donorId = dRows?.[0]?.id;
    if (!donorId) {
      const { data: insD } = await db.from('donors').insert({
        name: 'Pruthviraj Gavade',
        mobile: '',
        email: '',
        address: 'नदीवेस शिरोळ',
        area: 'नदीवेस शिरोळ',
        target_amount: 3000,
        paid_amount: 2501,
        total_donated: 2501,
        donations_count: 1,
        status: 'partial',
        notes: 'वर्गणी नोंदणी'
      }).select('id').single();
      donorId = insD?.id;
    } else {
      await db.from('donors').update({
        name: 'Pruthviraj Gavade',
        area: 'नदीवेस शिरोळ',
        target_amount: 3000,
        paid_amount: 2501,
        total_donated: 2501,
        donations_count: 1,
        status: 'partial'
      }).eq('id', donorId);
    }

    // 2. Ensure Transaction 37 / Pruthviraj transaction is un-deleted (is_deleted = false)
    const { data: txRows } = await db.from('income_transactions')
      .select('id, receipt_number')
      .or(`id.eq.37,donor_name.ilike.%Pruthvi%,receipt_number.eq.HANUMAN-2026-000016`);

    let txId = null;
    if (txRows && txRows.length > 0) {
      txId = txRows[0].id;
      for (const tx of txRows) {
        await db.from('income_transactions').update({
          is_deleted: false,
          donor_id: donorId,
          donor_name: 'Pruthviraj Gavade',
          amount: 2501,
          receipt_number: 'HANUMAN-2026-000016',
          transaction_id: 'TXN-2026-000016',
          status: 'completed'
        }).eq('id', tx.id);
      }
    } else {
      const { data: insTx } = await db.from('income_transactions').insert({
        id: 37,
        transaction_id: 'TXN-2026-000016',
        donor_id: donorId,
        donor_name: 'Pruthviraj Gavade',
        amount: 2501,
        payment_method: 'cash',
        category: 'vargani',
        purpose: 'श्री गणेशोत्सव वर्गणी',
        collector_name: 'अध्यक्ष (Admin)',
        receipt_number: 'HANUMAN-2026-000016',
        status: 'completed',
        is_deleted: false
      }).select('id').single();
      txId = insTx?.id;
    }

    // 3. Ensure receipt exists for HANUMAN-2026-000016 and link receipt_id
    const { data: recRows } = await db.from('receipts')
      .select('id')
      .eq('receipt_number', 'HANUMAN-2026-000016')
      .limit(1);

    let recId = recRows?.[0]?.id;
    if (!recId && txId) {
      const verificationCode = `V-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
      const { data: insRec } = await db.from('receipts').insert({
        receipt_number: 'HANUMAN-2026-000016',
        transaction_id: txId,
        donor_name: 'Pruthviraj Gavade',
        amount: 2501,
        amount_in_words_mr: 'दोन हजार पाचशे एक रुपये फक्त',
        amount_in_words_en: 'Two Thousand Five Hundred One Rupees Only',
        payment_method: 'cash',
        category: 'vargani',
        purpose: 'श्री गणेशोत्सव वर्गणी',
        collector_name: 'अध्यक्ष (Admin)',
        verification_code: verificationCode
      }).select('id').single();
      recId = insRec?.id;
    }

    if (recId && txId) {
      await db.from('income_transactions').update({ receipt_id: recId }).eq('id', txId);
    }
  } catch (e) {
    console.warn('restorePruthvirajGavadeAndFixContinuity note:', e.message);
  }
}

export async function getCloudFullData(req, res) {
  try {
    await restorePruthvirajGavadeAndFixContinuity();

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
