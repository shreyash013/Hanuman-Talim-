import { db } from '../database/db.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { uploadFileToSupabase } from '../middleware/uploadMiddleware.js';
import { throwIfError } from '../utils/dbHelpers.js';

export async function getSettings(req, res) {
  try {
    let { data: mandal, error } = await db.from('mandal_settings').select('*').limit(1).maybeSingle();
    throwIfError(error);
    if (!mandal) {
      const created = await db.from('mandal_settings').insert({ name_mr: 'श्री हनुमान तालीम मंडळ शिरोळ' }).select('*').single();
      throwIfError(created.error);
      mandal = created.data;
    }
    return res.json({ success: true, data: mandal });
  } catch (err) {
    console.error('getSettings error:', err);
    return res.status(500).json({ success: false, message: 'सेटिंग्ज मिळवताना त्रुटी.' });
  }
}

export async function updateSettings(req, res) {
  try {
    const { data: existing, error } = await db.from('mandal_settings').select('*').limit(1).maybeSingle();
    throwIfError(error);
    if (!existing) return res.status(404).json({ success: false, message: 'मंडळ सेटिंग्ज सापडल्या नाहीत.' });

    const logoUrl = req.file ? await uploadFileToSupabase(req.file, 'mandal') : (existing.logo_url || '');
    const b = req.body;
    const updates = {
      name_mr: b.name_mr?.trim() || existing.name_mr,
      name_en: b.name_en?.trim() || existing.name_en,
      tagline_mr: b.tagline_mr !== undefined ? b.tagline_mr.trim() : existing.tagline_mr,
      tagline_en: b.tagline_en !== undefined ? b.tagline_en.trim() : existing.tagline_en,
      address_mr: b.address_mr !== undefined ? b.address_mr.trim() : existing.address_mr,
      address_en: b.address_en !== undefined ? b.address_en.trim() : existing.address_en,
      contact_phone: b.contact_phone !== undefined ? b.contact_phone.trim() : existing.contact_phone,
      contact_email: b.contact_email !== undefined ? b.contact_email.trim() : existing.contact_email,
      registration_no: b.registration_no !== undefined ? b.registration_no.trim() : existing.registration_no,
      festival_year: b.festival_year !== undefined ? Number(b.festival_year) : existing.festival_year,
      arrival_date: b.arrival_date || existing.arrival_date,
      visarjan_date: b.visarjan_date || existing.visarjan_date,
      upi_id: b.upi_id !== undefined ? b.upi_id.trim() : existing.upi_id,
      upi_name: b.upi_name !== undefined ? b.upi_name.trim() : existing.upi_name,
      receipt_prefix: b.receipt_prefix !== undefined ? b.receipt_prefix.trim() : existing.receipt_prefix,
      receipt_language: b.receipt_language || existing.receipt_language,
      initial_opening_balance: b.initial_opening_balance !== undefined ? Number(b.initial_opening_balance) : (Number(existing.initial_opening_balance) || 0),
      logo_url: logoUrl
    };

    const { data: updated, error: updateError } = await db.from('mandal_settings').update(updates).eq('id', existing.id).select('*').single();
    throwIfError(updateError);
    await logAudit({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: 'UPDATE', entity: 'SETTINGS', entityId: `${existing.id}`, descriptionMr: `${req.user?.name} यांनी मंडळाची माहिती व सेटिंग्ज अद्ययावत केली.`, descriptionEn: 'Updated Mandal profile and settings.', oldValues: existing, newValues: updated, req });
    return res.json({ success: true, message: 'मंडळ माहिती जतन झाली.', data: updated });
  } catch (err) {
    console.error('updateSettings error:', err);
    return res.status(500).json({ success: false, message: 'सेटिंग्ज अद्ययावत करताना त्रुटी.' });
  }
}

export async function resetDatabase(req, res) {
  try {
    // Delete all transactional and operational dummy records
    await db.from('receipts').delete().neq('id', 0);
    await db.from('income_transactions').delete().neq('id', 0);
    await db.from('expense_transactions').delete().neq('id', 0);
    await db.from('cash_reconciliation').delete().neq('id', 0);
    await db.from('donors').delete().neq('id', 0);
    await db.from('events').delete().neq('id', 0);
    await db.from('committee_members').delete().neq('id', 0);
    await db.from('notifications').delete().neq('id', 0);
    await db.from('audit_logs').delete().neq('id', 0);

    // Update mandal_settings to Shri Hanuman Talim Mandal Shirol
    const { data: existing } = await db.from('mandal_settings').select('id').limit(1).maybeSingle();
    let updated;
    const newSettings = {
      name_mr: 'श्री हनुमान तालीम मंडळ शिरोळ',
      name_en: 'Shri Hanuman Talim Mandal Shirol',
      tagline_mr: 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा राजा ॥ 🔱 | ताकद फुल्लच 💪🏼',
      tagline_en: 'Est. 1964 🚩 | 62nd Year 🔱 | Nadives Cha Raja 🔱',
      address_mr: 'नदीवेस, शिरोळ, जि. कोल्हापूर | ४१६१०३',
      address_en: 'Nadives, Shirol, Dist. Kolhapur | 416103',
      contact_phone: '+91 9356997428',
      contact_email: 'shreyashgavade7@gmail.com',
      registration_no: 'MAH/KOLHAPUR/1964',
      receipt_prefix: 'HANUMAN-2026-',
      upi_id: '9699572617@ibl',
      upi_name: 'SUMEDH SHAHAJI GAVADE',
      initial_opening_balance: 0
    };

    if (existing) {
      const { data } = await db.from('mandal_settings').update(newSettings).eq('id', existing.id).select('*').single();
      updated = data;
    } else {
      const { data } = await db.from('mandal_settings').insert(newSettings).select('*').single();
      updated = data;
    }

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'RESET_DATABASE',
      entity: 'DATABASE',
      entityId: 'ALL',
      descriptionMr: `${req.user?.name} यांनी जुना डेटा क्लिअर केला आणि श्री हनुमान तालीम मंडळ शिरोळ सेटिंग्ज अद्ययावत केली.`,
      descriptionEn: 'Cleared all previous dummy data and updated Shri Hanuman Talim Mandal Shirol settings.',
      req
    });

    return res.json({
      success: true,
      message: 'डेटाबेस मधील जुना डेटा यशस्वीरित्या डिलीट केला आणि श्री हनुमान तालीम मंडळ शिरोळ माहिती अपडेट झाली! (Database cleared successfully!)',
      data: updated
    });
  } catch (err) {
    console.error('resetDatabase error:', err);
    return res.status(500).json({ success: false, message: err.message || 'डेटाबेस क्लिअर करताना त्रुटी.' });
  }
}

