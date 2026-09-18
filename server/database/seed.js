import bcrypt from 'bcryptjs';
import { db, initDb } from './db.js';

export async function seedDatabase(force = false) {
  await initDb();

  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count > 0 && !force) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  console.log('Seeding Ganpati Mandal database with realistic sample data...');

  // Clear existing tables
  await db.exec(`
    DELETE FROM notifications;
    DELETE FROM audit_logs;
    DELETE FROM events;
    DELETE FROM committee_members;
    DELETE FROM cash_reconciliation;
    DELETE FROM receipts;
    DELETE FROM income_transactions;
    DELETE FROM expense_transactions;
    DELETE FROM donors;
    DELETE FROM mandal_settings;
    DELETE FROM users;
  `);

  // 1. Seed Users
  const passwordHash = await bcrypt.hash('admin123', 10);
  const treasurerHash = await bcrypt.hash('treasurer123', 10);
  const secretaryHash = await bcrypt.hash('secretary123', 10);
  const volunteerHash = await bcrypt.hash('volunteer123', 10);

  await db.run(`
    INSERT INTO users (name, email, mobile, password_hash, role, status) VALUES
    ('सचिन मनगूळे (अध्यक्ष)', 'admin@ganeshmandal.org', '9822011111', ?, 'admin', 'active'),
    ('श्रेयश गवडे (खजिनदार)', 'shreyashgavade7@gmail.com', '9356997428', ?, 'treasurer', 'active'),
    ('शितल नेजे (सचिव)', 'secretary@ganeshmandal.org', '9822033333', ?, 'secretary', 'active'),
    ('अमोल सिदनाळे (स्वयंसेवक)', 'volunteer@ganeshmandal.org', '9822044444', ?, 'volunteer', 'active')
  `, [passwordHash, treasurerHash, secretaryHash, volunteerHash]);

  // 2. Seed Mandal Settings
  await db.run(`
    INSERT INTO mandal_settings (
      name_mr, name_en, tagline_mr, tagline_en, address_mr, address_en,
      contact_phone, contact_email, registration_no, festival_year,
      arrival_date, visarjan_date, upi_id, upi_name, receipt_prefix, receipt_language
    ) VALUES (
      'श्री हनुमान तालीम मंडळ शिरोळ',
      'Shri Hanuman Talim Mandal Shirol',
      'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा महाराजा ॥ 🔱',
      'Est. 1964 🚩 | 62nd Year 🔱 | Nadives Cha Maharaja 🔱',
      'नदीवेस, शिरोळ, जि. कोल्हापूर | ४१६१०३',
      'Nadives, Shirol, Dist. Kolhapur | 416103',
      '+91 9356997428',
      'shreyashgavade7@gmail.com',
      'MAH/KOLHAPUR/1964',
      2026,
      '2026-09-14T09:00:00',
      '2026-09-25T18:00:00',
      '9699572617@ibl',
      'SUMEDH SHAHAJI GAVADE',
      'HANUMAN-2026-',
      'mr'
    )
  `);

  // 3. Seed Donors
  const donorsData = [
    ['अमोल रमेश पाटील', '9823012345', 'amol.patil@gmail.com', 'फ्लॅट क्र. ४०२, सिद्धिविनायक हाइट्स, कसबा पेठ, पुणे', 'कसबा पेठ', 25000, 3, '2026-08-20 10:30:00', 'माजी नगरसेवक, दरवर्षी मुख्य देणगीदार'],
    ['रोहित विलास शिंदे', '9823023456', 'rohit.shinde@yahoo.com', 'घर क्र. ५६, शनिवार पेठ, पुणे', 'शनिवार पेठ', 11000, 2, '2026-08-21 14:15:00', 'महाप्रसाद प्रायोजक'],
    ['सागर विनायक जाधव', '9823034567', 'sagar.jadhav@outlook.com', 'फ्लॅट १२, ओंकार अपार्टमेंट्स, नारायण पेठ, पुणे', 'नारायण पेठ', 5500, 2, '2026-08-21 17:00:00', 'सांस्कृतिक कार्यक्रम वर्गणी'],
    ['सचिन दत्तात्रय कदम', '9823045678', 'sachin.kadam@rediffmail.com', 'प्लॉट ८, गणेश नगर, कोथरूड, पुणे', 'कोथरूड', 51000, 1, '2026-08-19 11:00:00', 'मुख्य मंडप सजावट देणगीदार'],
    ['राहुल बाळासाहेब मोरे', '9823056789', 'rahul.more@gmail.com', 'फ्लॅट २०३, मयूरेश्वर सोसायटी, कसबा पेठ, पुणे', 'कसबा पेठ', 2100, 1, '2026-08-22 09:30:00', 'वार्षिक कौटुंबिक वर्गणी'],
    ['सौ. दीपाली अनिकेत देशमुख', '9823067890', 'deepali.deshmukh@gmail.com', 'घर क्र. ११, बुधवार पेठ, पुणे', 'बुधवार पेठ', 5001, 1, '2026-08-21 18:30:00', 'मोदक महाप्रसाद योगदान'],
    ['विनायक मोरेश्वर जोशी', '9823078901', 'vinayak.joshi@gmail.com', 'सदाशिव पेठ, पुणे', 'सदाशिव पेठ', 1500, 1, '2026-08-22 10:00:00', 'पूजा व आरती देणगी'],
    ['मे. राजमाता ज्वेलर्स (प्रोप्रा. संतोष सराफ)', '9823089012', 'rajmata.jewellers@gmail.com', 'लक्ष्मी रोड, पुणे', 'लक्ष्मी रोड', 75000, 1, '2026-08-18 16:00:00', 'सुवर्ण महोत्सवी मुख्य प्रायोजक (Sponsor)'],
    ['महेश आनंदराव पवार', '9823090123', 'mahesh.pawar@gmail.com', 'रविवार पेठ, पुणे', 'रविवार पेठ', 3100, 1, '2026-08-20 12:00:00', 'वर्गणी'],
    ['सुनील शंकर घाडगे', '9823001234', 'sunil.ghadge@gmail.com', 'कसबा पेठ, पुणे', 'कसबा पेठ', 1001, 1, '2026-08-22 11:00:00', 'वर्गणी']
  ];

  for (const d of donorsData) {
    await db.run(`
      INSERT INTO donors (name, mobile, email, address, area, total_donated, donations_count, last_donated_at, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, d);
  }

  // 4. Seed Income Transactions & Digital Receipts
  const incomeList = [
    {
      txId: 'TXN-2026-001',
      donorId: 4,
      donorName: 'सचिन दत्तात्रय कदम',
      mobile: '9823045678',
      address: 'प्लॉट ८, गणेश नगर, कोथरूड, पुणे',
      amount: 51000,
      paymentMethod: 'bank_transfer',
      category: 'donation',
      purpose: 'मुख्य मंडप व देखावा देणगी',
      notes: 'NEFT द्वारे ट्रान्सफर - Ref: SBIN8839201',
      collectorName: 'राजेश कुलकर्णी (खजिनदार)',
      collectedById: 2,
      receiptNo: 'GM-2026-000001',
      wordsMr: 'एक्कावन्न हजार रुपये फक्त',
      wordsEn: 'Fifty One Thousand Rupees Only',
      createdAt: '2026-08-19 11:00:00'
    },
    {
      txId: 'TXN-2026-002',
      donorId: 8,
      donorName: 'मे. राजमाता ज्वेलर्स (प्रोप्रा. संतोष सराफ)',
      mobile: '9823089012',
      address: 'लक्ष्मी रोड, पुणे',
      amount: 75000,
      paymentMethod: 'cheque',
      category: 'sponsorship',
      purpose: 'मुख्य स्वागत कमान व बॅनर प्रायोजकत्व',
      notes: 'HDFC बँक धनादेश क्र. ०९३८२१',
      collectorName: 'संजय तात्या पाटील (अध्यक्ष)',
      collectedById: 1,
      receiptNo: 'GM-2026-000002',
      wordsMr: 'पंच्याहत्तर हजार रुपये फक्त',
      wordsEn: 'Seventy Five Thousand Rupees Only',
      createdAt: '2026-08-18 16:00:00'
    },
    {
      txId: 'TXN-2026-003',
      donorId: 1,
      donorName: 'अमोल रमेश पाटील',
      mobile: '9823012345',
      address: 'फ्लॅट क्र. ४०२, सिद्धिविनायक हाइट्स, कसबा पेठ, पुणे',
      amount: 15000,
      paymentMethod: 'upi',
      category: 'vargani',
      purpose: 'वार्षिक घरगुती वर्गणी',
      notes: 'Google Pay द्वारे ट्रान्सफर - UPI Ref: 489281920192',
      collectorName: 'अमोल जाधव (स्वयंसेवक)',
      collectedById: 4,
      receiptNo: 'GM-2026-000003',
      wordsMr: 'पंधरा हजार रुपये फक्त',
      wordsEn: 'Fifteen Thousand Rupees Only',
      createdAt: '2026-08-20 10:30:00'
    },
    {
      txId: 'TXN-2026-004',
      donorId: 2,
      donorName: 'रोहित विलास शिंदे',
      mobile: '9823023456',
      address: 'घर क्र. ५६, शनिवार पेठ, पुणे',
      amount: 11000,
      paymentMethod: 'cash',
      category: 'prasad_contribution',
      purpose: 'अनंत चतुर्दशी महाप्रसाद सेवा',
      notes: 'रोख रक्कम प्राप्त',
      collectorName: 'राजेश कुलकर्णी (खजिनदार)',
      collectedById: 2,
      receiptNo: 'GM-2026-000004',
      wordsMr: 'अकरा हजार रुपये फक्त',
      wordsEn: 'Eleven Thousand Rupees Only',
      createdAt: '2026-08-21 14:15:00'
    },
    {
      txId: 'TXN-2026-005',
      donorId: 6,
      donorName: 'सौ. दीपाली अनिकेत देशमुख',
      mobile: '9823067890',
      address: 'घर क्र. ११, बुधवार पेठ, पुणे',
      amount: 5001,
      paymentMethod: 'upi',
      category: 'vargani',
      purpose: 'महिला मंडळ विशेष वर्गणी',
      notes: 'PhonePe द्वारे जमा',
      collectorName: 'अमोल जाधव (स्वयंसेवक)',
      collectedById: 4,
      receiptNo: 'GM-2026-000005',
      wordsMr: 'पाच हजार एक रुपये फक्त',
      wordsEn: 'Five Thousand One Rupees Only',
      createdAt: '2026-08-21 18:30:00'
    },
    {
      txId: 'TXN-2026-006',
      donorId: 5,
      donorName: 'राहुल बाळासाहेब मोरे',
      mobile: '9823056789',
      address: 'फ्लॅट २०३, मयूरेश्वर सोसायटी, कसबा पेठ, पुणे',
      amount: 2100,
      paymentMethod: 'cash',
      category: 'vargani',
      purpose: 'वार्षिक वर्गणी',
      notes: 'रोख पावती',
      collectorName: 'अमोल जाधव (स्वयंसेवक)',
      collectedById: 4,
      receiptNo: 'GM-2026-000006',
      wordsMr: 'दोन हजार एकशे रुपये फक्त',
      wordsEn: 'Two Thousand One Hundred Rupees Only',
      createdAt: '2026-08-22 09:30:00'
    },
    {
      txId: 'TXN-2026-007',
      donorId: 7,
      donorName: 'विनायक मोरेश्वर जोशी',
      mobile: '9823078901',
      address: 'सदाशिव पेठ, पुणे',
      amount: 1500,
      paymentMethod: 'upi',
      category: 'donation',
      purpose: 'अथर्वशीर्ष पठण संकल्प',
      notes: 'UPI जमा',
      collectorName: 'अमोल जाधव (स्वयंसेवक)',
      collectedById: 4,
      receiptNo: 'GM-2026-000007',
      wordsMr: 'एक हजार पाचशे रुपये फक्त',
      wordsEn: 'One Thousand Five Hundred Rupees Only',
      createdAt: '2026-08-22 10:00:00'
    },
    {
      txId: 'TXN-2026-008',
      donorId: 10,
      donorName: 'सुनील शंकर घाडगे',
      mobile: '9823001234',
      address: 'कसबा पेठ, पुणे',
      amount: 1001,
      paymentMethod: 'cash',
      category: 'vargani',
      purpose: 'वर्गणी',
      notes: 'रोख जमा',
      collectorName: 'अमोल जाधव (स्वयंसेवक)',
      collectedById: 4,
      receiptNo: 'GM-2026-000008',
      wordsMr: 'एक हजार एक रुपये फक्त',
      wordsEn: 'One Thousand One Rupees Only',
      createdAt: '2026-08-22 11:00:00'
    }
  ];

  for (const inc of incomeList) {
    const incRes = await db.run(`
      INSERT INTO income_transactions (
        transaction_id, donor_id, donor_name, mobile, address, amount,
        payment_method, category, purpose, notes, collected_by_id, collector_name,
        receipt_number, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
    `, [
      inc.txId, inc.donorId, inc.donorName, inc.mobile, inc.address, inc.amount,
      inc.paymentMethod, inc.category, inc.purpose, inc.notes, inc.collectedById, inc.collectorName,
      inc.receiptNo, inc.createdAt
    ]);

    const txDbId = incRes.lastID;
    const verifyCode = `V-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const receiptRes = await db.run(`
      INSERT INTO receipts (
        receipt_number, transaction_id, donor_name, mobile, address,
        amount, amount_in_words_mr, amount_in_words_en, payment_method,
        category, purpose, collector_name, verification_code, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      inc.receiptNo, txDbId, inc.donorName, inc.mobile, inc.address,
      inc.amount, inc.wordsMr, inc.wordsEn, inc.paymentMethod,
      inc.category, inc.purpose, inc.collectorName, verifyCode, inc.createdAt
    ]);

    await db.run('UPDATE income_transactions SET receipt_id = ? WHERE id = ?', [receiptRes.lastID, txDbId]);
  }

  // 5. Seed Expense Transactions
  const expenseList = [
    {
      expId: 'EXP-2026-001',
      category: 'idol',
      description: 'श्री गणेश मूर्ती ॲडव्हान्स बुकिंग (पेण मूर्तिकार)',
      amount: 25000,
      paymentMethod: 'bank_transfer',
      paidTo: 'श्री विजय काळे मूर्तिकार, पेण',
      billNumber: 'BILL-KAL-902',
      status: 'paid',
      requestedByName: 'अमोल जाधव (स्वयंसेवक)',
      requestedById: 4,
      approvedByName: 'संजय तात्या पाटील (अध्यक्ष)',
      approvedById: 1,
      approvedAt: '2026-08-15 14:00:00',
      notes: 'मूर्तीची उंची ८ फूट, पर्यावरणपूरक शाडू माती',
      createdAt: '2026-08-15 12:00:00'
    },
    {
      expId: 'EXP-2026-002',
      category: 'mandap',
      description: 'भव्य मंडप व स्टेज उभारणी ॲडव्हान्स',
      amount: 35000,
      paymentMethod: 'cheque',
      paidTo: 'स्वाती मंडप डेकोरेटर्स, पुणे',
      billNumber: 'SW-892',
      status: 'paid',
      requestedByName: 'राजेश कुलकर्णी (खजिनदार)',
      requestedById: 2,
      approvedByName: 'संजय तात्या पाटील (अध्यक्ष)',
      approvedById: 1,
      approvedAt: '2026-08-18 17:00:00',
      notes: '६०x४० फूट मुख्य मंडप वॉटरप्रूफ शेड',
      createdAt: '2026-08-18 15:30:00'
    },
    {
      expId: 'EXP-2026-003',
      category: 'sound_system',
      description: 'साउंड सिस्टीम व माईक सेट बुकिंग',
      amount: 15000,
      paymentMethod: 'upi',
      paidTo: 'ओंकार ध्वनी व प्रकाश यंत्रणा',
      billNumber: 'ONK-SOUND-441',
      status: 'approved',
      requestedByName: 'विकास शिंदे (सचिव)',
      requestedById: 3,
      approvedByName: 'राजेश कुलकर्णी (खजिनदार)',
      approvedById: 2,
      approvedAt: '2026-08-20 11:30:00',
      notes: '१० दिवसांसाठी डिजिटल ऑडिओ मिक्सर व कॉर्डलेस माईक्स',
      createdAt: '2026-08-20 10:00:00'
    },
    {
      expId: 'EXP-2026-004',
      category: 'lighting',
      description: 'मंडप व परिसर विद्युत रोषणाई साहित्य',
      amount: 22000,
      paymentMethod: 'cash',
      paidTo: 'गणेश इलेक्ट्रिकल्स, कसबा पेठ',
      billNumber: 'GN-ELEC-102',
      status: 'pending',
      requestedByName: 'अमोल जाधव (स्वयंसेवक)',
      requestedById: 4,
      approvedByName: null,
      approvedById: null,
      approvedAt: null,
      notes: 'एलईडी तोरणे, फ्लड लाईट्स आणि जनरेटर बॅकअप',
      createdAt: '2026-08-22 08:30:00'
    },
    {
      expId: 'EXP-2026-005',
      category: 'printing',
      description: 'वर्गणी पावती पुस्तके व माहिती पत्रके छपाई',
      amount: 4500,
      paymentMethod: 'cash',
      paidTo: 'शारदा ऑफसेट प्रिंटर्स',
      billNumber: 'SHAR-3819',
      status: 'approved',
      requestedByName: 'विकास शिंदे (सचिव)',
      requestedById: 3,
      approvedByName: 'राजेश कुलकर्णी (खजिनदार)',
      approvedById: 2,
      approvedAt: '2026-08-21 16:00:00',
      notes: '२००० पावत्या व ५०० आमंत्रण पत्रिका',
      createdAt: '2026-08-21 14:00:00'
    }
  ];

  for (const exp of expenseList) {
    await db.run(`
      INSERT INTO expense_transactions (
        expense_id, category, description, amount, payment_method, paid_to,
        bill_number, status, requested_by_id, requested_by_name,
        approved_by_id, approved_by_name, approved_at, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      exp.expId, exp.category, exp.description, exp.amount, exp.paymentMethod, exp.paidTo,
      exp.billNumber, exp.status, exp.requestedById, exp.requestedByName,
      exp.approvedById, exp.approvedByName, exp.approvedAt, exp.notes, exp.createdAt
    ]);
  }

  // 6. Seed Cash Reconciliation
  await db.run(`
    INSERT INTO cash_reconciliation (
      reconciliation_date, opening_cash, cash_income, cash_expense,
      expected_closing, actual_closing, difference, status, notes,
      verified_by_id, verified_by_name, created_at
    ) VALUES (
      '2026-08-21', 10000, 11000, 4500,
      16500, 16500, 0, 'reconciled',
      'दैनिक रोख जमा व खर्च ताळेबंद पूर्ण जुळला आहे.',
      2, 'राजेश कुलकर्णी (खजिनदार)', '2026-08-21 21:00:00'
    )
  `);

  // 7. Seed Committee Members
  const committee = [
    ['संजय तात्या पाटील', 'अध्यक्ष', 'President', '9822011111', 'कसबा पेठ, पुणे', 1995, '9822099991', 'O+', 1, 1],
    ['प्रमोद बापूराव गायकवाड', 'उपाध्यक्ष', 'Vice President', '9822011112', 'शनिवार पेठ, पुणे', 2002, '9822099992', 'B+', 1, 2],
    ['विकास रमेश शिंदे', 'सचिव', 'Secretary', '9822033333', 'नारायण पेठ, पुणे', 2010, '9822099993', 'A+', 1, 3],
    ['श्रेयश गवडे', 'खजिनदार', 'Treasurer', '9356997428', 'नदीवेस, शिरोळ', 2019, '9356997428', 'B+', 1, 4],
    ['अमोल बबनराव जाधव', 'कार्यकर्ता प्रमुख', 'Volunteer Head', '9822044444', 'कसबा पेठ, पुणे', 2018, '9822099995', 'O+', 1, 5],
    ['सौ. सुजाता मंगेश जोशी', 'महिला मंडळ प्रमुख', 'Women Wing Head', '9822055555', 'बुधवार पेठ, पुणे', 2015, '9822099996', 'B+', 1, 6],
    ['सागर विलास सावंत', 'सांस्कृतिक कार्यक्रम प्रमुख', 'Cultural Head', '9822066666', 'कसबा पेठ, पुणे', 2019, '9822099997', 'A+', 1, 7],
    ['योगेश नामदेव भोसले', 'सुरक्षा व नियोजन प्रमुख', 'Security & Logistics', '9822077777', 'रविवार पेठ, पुणे', 2016, '9822099998', 'O-', 1, 8]
  ];

  for (const m of committee) {
    await db.run(`
      INSERT INTO committee_members (
        name, role_title_mr, role_title_en, mobile, address,
        joining_year, emergency_contact, blood_group, is_active, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, m);
  }

  // 8. Seed Events
  const eventsData = [
    ['श्री गणपती बाप्पा आगमन व प्राणप्रतिष्ठापना', 'Lord Ganesha Arrival & Pranpratishtha', '2026-09-15', '09:00 AM', '12:30 PM', 'मुख्य मंडप, कसबा पेठ', 'पारंपरिक ढोल ताशा गजर आणि वेदमंत्रोच्चारात बाप्पाची स्थापना', 'संजय तात्या पाटील', 30000, 0, 'upcoming'],
    ['दैनिक महाआरती (सकाळ व संध्याकाळ)', 'Daily Maha Aarti (Morning & Evening)', '2026-09-16', '08:00 AM', '09:00 PM', 'मुख्य मंडप', 'सकाळी ८:०० आणि रात्री ८:३० वाजता स्थानिक नागरिकांच्या उपस्थितीत महाआरती', 'विकास शिंदे', 10000, 0, 'upcoming'],
    ['मोफत आरोग्य व रक्तदान शिबीर', 'Free Health & Blood Donation Camp', '2026-09-18', '10:00 AM', '04:00 PM', 'मंडप शेजारील हॉल', 'ससून रुग्णालय रक्तपेढीच्या सहकार्याने भव्य रक्तदान शिबीर', 'अमोल जाधव', 15000, 0, 'upcoming'],
    ['पारंपरिक मोदक बनवणे व रांगोळी स्पर्धा', 'Traditional Modak & Rangoli Competition', '2026-09-20', '04:00 PM', '08:00 PM', 'महिला मंडळ विभाग', 'परिसरातील महिला व मुलींसाठी भव्य बक्षीस वितरण स्पर्धा', 'सौ. सुजाता जोशी', 12000, 0, 'upcoming'],
    ['भव्य महाप्रसाद वाटप', 'Grand Mahaprasad Feast', '2026-09-22', '12:00 PM', '06:00 PM', 'मंडळ अन्नछत्र परिसर', '५,००० हून अधिक भाविकांसाठी पुरी-भाजी, बुंदी व वरण-भात महाप्रसाद', 'राजेश कुलकर्णी', 65000, 0, 'upcoming'],
    ['अनंत चतुर्दशी भव्य विसर्जन मिरवणूक', 'Grand Visarjan Mirvanuk (Procession)', '2026-09-25', '04:00 PM', '11:59 PM', 'अलका टॉकीज चौक ते ओंकारेश्वर घाट', 'पारंपरिक झांज पथक, ढोल-ताशा पथक व फुलांचा रथ', 'सर्व समिती सदस्य', 80000, 0, 'upcoming']
  ];

  for (const ev of eventsData) {
    await db.run(`
      INSERT INTO events (
        title_mr, title_en, event_date, start_time, end_time,
        location, description, organizer_name, budget, actual_expense, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ev);
  }

  // 9. Seed Notifications
  await db.run(`
    INSERT INTO notifications (user_id, title_mr, title_en, message_mr, message_en, type, link) VALUES
    (1, 'नवीन खर्च मंजुरीसाठी प्रलंबित', 'Expense Pending Approval', 'विद्युत रोषणाई बिलासाठी ₹२२,००० मंजुरी बाकी आहे.', 'Lighting bill for ₹22,000 is awaiting approval.', 'warning', '/approvals'),
    (1, 'देणगी नोंदवली', 'New Big Donation', 'मे. राजमाता ज्वेलर्स कडून ₹७५,००० प्रायोजकत्व जमा झाले आहे.', 'Received ₹75,000 sponsorship from M/s Rajmata Jewellers.', 'success', '/income'),
    (2, 'दैनिक रोख ताळेबंद', 'Daily Cash Reconciled', 'कालचा रोख ताळेबंद यशस्वीरित्या जुळला आहे.', 'Yesterday cash reconciliation completed with zero mismatch.', 'info', '/cash-management'),
    (4, 'गणेशोत्सवाची तयारी', 'Festival Approvals', 'उत्सव सुरु होण्यास २५ दिवस बाकी आहेत. वर्गणी नोंदणी जलद करा.', 'Festival starts in 25 days. Speed up vargani collection.', 'info', '/vargani')
  `);

  // 10. Seed Audit Logs
  await db.run(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, entity, entity_id, description_mr, description_en, created_at) VALUES
    (1, 'संजय तात्या पाटील (अध्यक्ष)', 'admin', 'CREATE', 'MANDAL_SETTINGS', '1', 'गणपती मंडळ प्रणाली सुरू केली व माहिती अद्ययावत केली.', 'Initialized Mandal settings and festival setup.', '2026-08-15 10:00:00'),
    (1, 'संजय तात्या पाटील (अध्यक्ष)', 'admin', 'APPROVE', 'EXPENSE', 'EXP-2026-001', 'मूर्ती ॲडव्हान्स बुकिंग ₹२५,००० मंजूर केले.', 'Approved idol advance booking ₹25,000.', '2026-08-15 14:00:00'),
    (2, 'राजेश कुलकर्णी (खजिनदार)', 'treasurer', 'APPROVE', 'EXPENSE', 'EXP-2026-002', 'मंडप उभारणी खर्च ₹३५,००० मंजूर केला.', 'Approved mandap decoration advance ₹35,000.', '2026-08-18 17:00:00'),
    (4, 'अमोल जाधव (स्वयंसेवक)', 'volunteer', 'CREATE', 'INCOME', 'TXN-2026-003', 'अमोल पाटील यांच्याकडून ₹१५,००० वर्गणी नोंदवली व पावती GM-2026-000003 तयार केली.', 'Recorded vargani ₹15,000 from Amol Patil and issued receipt GM-2026-000003.', '2026-08-20 10:30:00'),
    (2, 'राजेश कुलकर्णी (खजिनदार)', 'treasurer', 'RECONCILE', 'CASH', '2026-08-21', 'दिनांक २१ ऑगस्ट २०२६ चा रोख ताळेबंद नोंदवला.', 'Recorded daily cash reconciliation for 21 Aug 2026.', '2026-08-21 21:00:00')
  `);

  console.log('Ganpati Mandal Database Seed completed successfully! 🎉');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase(true).then(() => {
    console.log('Direct seed finished.');
    process.exit(0);
  }).catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
