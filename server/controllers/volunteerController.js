import { db } from '../database/db.js';
import { throwIfError } from '../utils/dbHelpers.js';

export async function getVolunteerLeaderboard(req, res) {
  try {
    const { data: users, error } = await db.from('users').select('id, name, mobile, role, status').in('role', ['volunteer', 'secretary', 'treasurer', 'admin']);
    throwIfError(error);

    const { data: incomes } = await db.from('income_transactions').select('collected_by_id, collector_name, amount').eq('is_deleted', false);

    const volunteerMap = new Map();

    // Default mock targets for gamification
    const defaultVolunteers = [
      { name: 'राहुल गवडे', area: 'नदीवेस शिरोळ', target: 60000, collected: 75500 },
      { name: 'अमित गवडे', area: 'गावभाग', target: 60000, collected: 62000 },
      { name: 'सागर गवडे', area: 'तालीम गल्ली', target: 60000, collected: 48500 },
      { name: 'अथर्व गवडे (अभि)', area: 'स्टँड रोड', target: 50000, collected: 45000 }
    ];

    defaultVolunteers.forEach((v, idx) => {
      const achievement = Math.round((v.collected / v.target) * 100);
      volunteerMap.set(v.name, {
        rank: idx + 1,
        id: 1000 + idx,
        name: v.name,
        area: v.area,
        target: v.target,
        collected: v.collected,
        achievement,
        badge: achievement >= 120 ? '🥇 Super Star Collector' : achievement >= 100 ? '🥈 Target Achiever' : '🥉 Active Volunteer',
        expenses_submitted: 3,
        tasks_completed: 8
      });
    });

    (incomes || []).forEach(inc => {
      const colName = inc.collector_name || 'अध्यक्ष (Admin)';
      if (volunteerMap.has(colName)) {
        const current = volunteerMap.get(colName);
        current.collected += Number(inc.amount) || 0;
        current.achievement = Math.round((current.collected / current.target) * 100);
        if (current.achievement >= 120) current.badge = '🥇 Super Star Collector';
      }
    });

    const leaderboard = [...volunteerMap.values()].sort((a, b) => b.collected - a.collected).map((v, i) => ({ ...v, rank: i + 1 }));

    return res.json({ success: true, data: leaderboard });
  } catch (err) {
    console.error('getVolunteerLeaderboard error:', err);
    return res.status(500).json({ success: false, message: 'लीडरबोर्ड लोड करताना त्रुटी.' });
  }
}
