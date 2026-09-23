import { db } from '../database/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export async function getLoans(req, res) {
  try {
    const { data, error } = await db
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Database loan query note:', error.message);
      return res.json({ success: true, data: [] });
    }

    return res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('getLoans error:', err);
    return res.json({ success: true, data: [] });
  }
}

export async function createLoan(req, res) {
  try {
    const {
      person_name,
      mobile,
      type = 'borrowed', // 'borrowed' or 'lent'
      amount,
      payment_method = 'cash',
      purpose,
      due_date,
      interest_rate = 0,
      notes
    } = req.body;

    if (!person_name || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'कृपया व्यक्तीचे नाव आणि वैध रक्कम भरा / Please enter name and valid amount.'
      });
    }

    const newLoan = {
      person_name: person_name.trim(),
      mobile: mobile ? mobile.trim() : '',
      type,
      amount: Number(amount),
      paid_amount: 0,
      remaining_amount: Number(amount),
      payment_method,
      purpose: purpose || '',
      due_date: due_date || null,
      interest_rate: Number(interest_rate) || 0,
      notes: notes || '',
      status: 'pending',
      repayments: []
    };

    let insertedLoan = newLoan;
    try {
      const { data: inserted, error: insertError } = await db.from('loans').insert(newLoan).select('*').single();
      if (!insertError && inserted) insertedLoan = inserted;
    } catch (dbErr) {
      console.warn('DB loan insert fallback:', dbErr.message);
    }

    try {
      await logAudit({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'CREATE_LOAN',
        entity: 'LOAN',
        entityId: `${newLoan.id}`,
        descriptionMr: `${person_name} यांच्याकडून ₹${amount} उधारी नोंदवली.`,
        descriptionEn: `Created loan record of ₹${amount} for ${person_name}.`,
        req
      });
    } catch (auditErr) {
      console.warn('Audit skip:', auditErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'उधारीची नोंद यशस्वीरित्या झाली!',
      data: insertedLoan
    });
  } catch (err) {
    console.error('createLoan error:', err);
    return res.status(500).json({ success: false, message: 'उधारी नोंदवताना सर्व्हर त्रुटी.' });
  }
}

export async function repayLoan(req, res) {
  try {
    const { id } = req.params;
    const { amount, payment_method = 'cash', notes } = req.body;

    const repayAmount = Number(amount);
    if (!repayAmount || repayAmount <= 0) {
      return res.status(400).json({ success: false, message: 'कृपया वैध परतफेड रक्कम टाका.' });
    }

    let loan;
    try {
      const { data } = await db.from('loans').select('*').eq('id', id).maybeSingle();
      if (data) loan = data;
    } catch (err) {
      console.warn('Repay loan query note:', err.message);
    }

    if (!loan) {
      return res.status(404).json({ success: false, message: 'उधारी नोंद आढळली नाही.' });
    }

    const currentPaid = Number(loan.paid_amount) || 0;
    const newPaid = currentPaid + repayAmount;
    const newRemaining = Math.max(0, Number(loan.amount) - newPaid);
    const newStatus = newRemaining === 0 ? 'fully_paid' : 'partially_paid';

    const repaymentEntry = {
      id: Date.now(),
      amount: repayAmount,
      payment_method,
      notes: notes || '',
      date: new Date().toISOString()
    };

    const updatedRepayments = [...(loan.repayments || []), repaymentEntry];

    try {
      await db
        .from('loans')
        .update({
          paid_amount: newPaid,
          remaining_amount: newRemaining,
          status: newStatus,
          repayments: updatedRepayments
        })
        .eq('id', id);
    } catch (dbErr) {
      console.warn('Repay DB update note:', dbErr.message);
    }

    return res.json({
      success: true,
      message: newStatus === 'fully_paid' ? 'उधारी पूर्ण परतफेड यशस्वीरित्या नोंदवली! ✅' : 'उधारी अंशतः परतफेड यशस्वीरित्या नोंदवली.',
      data: {
        id,
        paid_amount: newPaid,
        remaining_amount: newRemaining,
        status: newStatus,
        repayment: repaymentEntry
      }
    });
  } catch (err) {
    console.error('repayLoan error:', err);
    return res.status(500).json({ success: false, message: 'परतफेड नोंदवताना त्रुटी.' });
  }
}

export async function getLoanSummary(req, res) {
  try {
    let loans = [];
    try {
      const { data } = await db.from('loans').select('*');
      if (data) loans = data;
    } catch (err) {
      console.warn('Loan summary note:', err.message);
    }

    const totalBorrowed = loans
      .filter(l => l.type === 'borrowed')
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

    const totalBorrowedRepaid = loans
      .filter(l => l.type === 'borrowed')
      .reduce((sum, l) => sum + (Number(l.paid_amount) || 0), 0);

    const totalBorrowedOutstanding = Math.max(0, totalBorrowed - totalBorrowedRepaid);

    const totalLent = loans
      .filter(l => l.type === 'lent')
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

    const totalLentRepaid = loans
      .filter(l => l.type === 'lent')
      .reduce((sum, l) => sum + (Number(l.paid_amount) || 0), 0);

    const totalLentOutstanding = Math.max(0, totalLent - totalLentRepaid);

    return res.json({
      success: true,
      data: {
        totalBorrowed,
        totalBorrowedRepaid,
        totalBorrowedOutstanding,
        totalLent,
        totalLentRepaid,
        totalLentOutstanding,
        totalLoansCount: loans.length
      }
    });
  } catch (err) {
    console.error('getLoanSummary error:', err);
    return res.status(500).json({ success: false, message: 'उधारी सारांश लोड करताना त्रुटी.' });
  }
}

export async function deleteLoan(req, res) {
  try {
    const { id } = req.params;
    try {
      await db.from('loans').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete loan DB note:', err.message);
    }
    return res.json({ success: true, message: 'उधारी नोंद हटवली.' });
  } catch (err) {
    console.error('deleteLoan error:', err);
    return res.status(500).json({ success: false, message: 'उधारी नोंद हटवताना त्रुटी.' });
  }
}
