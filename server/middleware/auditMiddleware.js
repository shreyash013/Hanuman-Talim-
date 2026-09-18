import { db } from '../database/db.js';

export async function logAudit({
  userId = null,
  userName = 'System',
  userRole = 'system',
  action,
  entity,
  entityId = '',
  descriptionMr = '',
  descriptionEn = '',
  oldValues = null,
  newValues = null,
  req = null
}) {
  try {
    const forwarded = req?.headers?.['x-forwarded-for'];
    const ipAddress = forwarded
      ? String(forwarded).split(',')[0].trim()
      : (req?.socket?.remoteAddress || '');

    let safeUserId = null;
    if (userId) {
      try {
        const { data: u } = await db.from('users').select('id').eq('id', userId).maybeSingle();
        if (u) safeUserId = u.id;
      } catch {}
    }

    const { error } = await db.from('audit_logs').insert({
      user_id: safeUserId,
      user_name: userName,
      user_role: userRole,
      action,
      entity,
      entity_id: entityId,
      description_mr: descriptionMr,
      description_en: descriptionEn,
      old_values: oldValues,
      new_values: newValues,
      ip_address: ipAddress
    });

    if (error) throw error;
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
