import { db } from '../database/db.js';
import { throwIfError } from '../utils/dbHelpers.js';

export async function getFestivalInfo(req, res) {
  try {
    const [eventsRes, membersRes, settingsRes] = await Promise.all([
      db.from('events').select('*').order('event_date', { ascending: true }),
      db.from('committee_members').select('*').order('display_order', { ascending: true }),
      db.from('mandal_settings').select('*').limit(1).maybeSingle()
    ]);

    throwIfError(eventsRes.error);

    const aartiSchedule = [
      { id: 1, title_mr: 'सकाळची महाआरती 🌅', time: '०८:०० AM', priest: 'वे. शा. सं. जोशी गुरुजी', status: 'completed' },
      { id: 2, title_mr: 'दुपारची नैवेद्य आरती 🌞', time: '१२:३० PM', priest: 'श्री सुमेध गवडे (अध्यक्ष)', status: 'upcoming' },
      { id: 3, title_mr: 'संध्याकाळची महाआरती 🔱', time: '०७:३० PM', priest: 'प्रमुख पाहुणे व ग्रामस्थ', status: 'upcoming' },
      { id: 4, title_mr: 'रात्रीची शेजारती 🌙', time: '१०:०० PM', priest: 'मंगेश गवडे व कार्यकर्ते', status: 'upcoming' }
    ];

    const mahaprasadInfo = {
      date: '2026-09-20',
      time: '१२:०० PM ते ०४:०० PM',
      venue: 'श्री हनुमान तालीम मंडळ प्रांगण, शिरोळ',
      expected_headcount: 3500,
      menu_mr: 'पुरी, भाजी, मसाले भात, जिलबी, आमटी, बूंदी प्रसादम',
      coordinators: [
        { name: 'श्रेयश गावडे', phone: '9356997428' },
        { name: 'अथर्व गवडे', phone: '9822012348' }
      ]
    };

    const dholTashaInfo = {
      troupe_name: 'शिवमुद्रा ढोल-ताशा पथक, शिरोळ',
      members_count: 75,
      agaman_date: '२०२६-०९-१४',
      visarjan_date: '२०२६-०९-२५'
    };

    return res.json({
      success: true,
      data: {
        events: eventsRes.data || [],
        members: membersRes.data || [],
        settings: settingsRes.data || null,
        aartiSchedule,
        mahaprasadInfo,
        dholTashaInfo
      }
    });
  } catch (err) {
    console.error('getFestivalInfo error:', err);
    return res.status(500).json({ success: false, message: 'उत्सव माहिती लोड करताना त्रुटी.' });
  }
}
