-- Ganpati Mandal Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  mobile TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'treasurer', 'secretary', 'volunteer', 'member')),
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mandal Settings table
CREATE TABLE IF NOT EXISTS mandal_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_mr TEXT NOT NULL DEFAULT 'श्री हनुमान तालीम मंडळ शिरोळ',
  name_en TEXT NOT NULL DEFAULT 'Shri Hanuman Talim Mandal Shirol',
  tagline_mr TEXT DEFAULT 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा राजा ॥ 🔱',
  tagline_en TEXT DEFAULT 'Est. 1964 🚩 | 62nd Year 🔱 | Nadives Cha Raja 🔱',
  address_mr TEXT DEFAULT 'नदीवेस, शिरोळ, जि. कोल्हापूर | ४१६१०३',
  address_en TEXT DEFAULT 'Nadives, Shirol, Dist. Kolhapur | 416103',
  contact_phone TEXT DEFAULT '+91 9356997428',
  contact_email TEXT DEFAULT 'shreyashgavade7@gmail.com',
  registration_no TEXT DEFAULT 'MAH/KOLHAPUR/1964',
  festival_year INTEGER DEFAULT 2026,
  arrival_date TEXT DEFAULT '2026-09-14T09:00:00',
  visarjan_date TEXT DEFAULT '2026-09-25T18:00:00',
  upi_id TEXT DEFAULT 'sarveshkharoshe8-2@okaxis',
  upi_name TEXT DEFAULT 'Shri Hanuman Talim Mandal Shirol',
  receipt_prefix TEXT DEFAULT 'HANUMAN-2026-',
  receipt_language TEXT DEFAULT 'mr',
  currency_symbol TEXT DEFAULT '₹',
  logo_url TEXT DEFAULT '',
  initial_opening_balance REAL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Donors table
CREATE TABLE IF NOT EXISTS donors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  address TEXT,
  area TEXT,
  preferred_language TEXT DEFAULT 'mr',
  total_donated REAL DEFAULT 0,
  donations_count INTEGER DEFAULT 0,
  last_donated_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Income / Vargani Transactions table
CREATE TABLE IF NOT EXISTS income_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT UNIQUE NOT NULL,
  donor_id INTEGER,
  donor_name TEXT NOT NULL,
  mobile TEXT,
  address TEXT,
  amount REAL NOT NULL CHECK(amount > 0),
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'upi', 'bank_transfer', 'cheque', 'other')),
  category TEXT NOT NULL CHECK(category IN ('vargani', 'donation', 'sponsorship', 'decoration_contribution', 'prasad_contribution', 'event_contribution', 'advertisement', 'other')),
  purpose TEXT,
  notes TEXT,
  collected_by_id INTEGER,
  collector_name TEXT,
  receipt_id INTEGER,
  receipt_number TEXT,
  attachment_url TEXT,
  status TEXT DEFAULT 'completed',
  is_deleted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donor_id) REFERENCES donors(id),
  FOREIGN KEY (collected_by_id) REFERENCES users(id)
);

-- Digital Receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_number TEXT UNIQUE NOT NULL,
  transaction_id INTEGER NOT NULL,
  donor_name TEXT NOT NULL,
  mobile TEXT,
  address TEXT,
  amount REAL NOT NULL,
  amount_in_words_mr TEXT,
  amount_in_words_en TEXT,
  payment_method TEXT NOT NULL,
  category TEXT NOT NULL,
  purpose TEXT,
  collector_name TEXT,
  verification_code TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES income_transactions(id)
);

-- Expense Transactions table
CREATE TABLE IF NOT EXISTS expense_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_id TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount > 0),
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'upi', 'bank_transfer', 'cheque', 'other')),
  paid_to TEXT NOT NULL,
  bill_number TEXT,
  bill_attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'paid')),
  requested_by_id INTEGER,
  requested_by_name TEXT,
  approved_by_id INTEGER,
  approved_by_name TEXT,
  approved_at DATETIME,
  notes TEXT,
  is_deleted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requested_by_id) REFERENCES users(id),
  FOREIGN KEY (approved_by_id) REFERENCES users(id)
);

-- Cash Reconciliation table
CREATE TABLE IF NOT EXISTS cash_reconciliation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reconciliation_date DATE NOT NULL UNIQUE,
  opening_cash REAL NOT NULL DEFAULT 0,
  cash_income REAL NOT NULL DEFAULT 0,
  cash_expense REAL NOT NULL DEFAULT 0,
  expected_closing REAL NOT NULL DEFAULT 0,
  actual_closing REAL NOT NULL DEFAULT 0,
  difference REAL NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'reconciled',
  notes TEXT,
  verified_by_id INTEGER,
  verified_by_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (verified_by_id) REFERENCES users(id)
);

-- Committee Members table
CREATE TABLE IF NOT EXISTS committee_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role_title_mr TEXT NOT NULL,
  role_title_en TEXT NOT NULL,
  mobile TEXT NOT NULL,
  photo_url TEXT,
  address TEXT,
  joining_year INTEGER DEFAULT 2026,
  emergency_contact TEXT,
  blood_group TEXT,
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_mr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  location TEXT,
  description TEXT,
  organizer_name TEXT,
  budget REAL DEFAULT 0,
  actual_expense REAL DEFAULT 0,
  status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  description_mr TEXT,
  description_en TEXT,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title_mr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  message_mr TEXT NOT NULL,
  message_en TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  link TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rapid lookups and search
CREATE INDEX IF NOT EXISTS idx_donors_mobile ON donors(mobile);
CREATE INDEX IF NOT EXISTS idx_donors_name ON donors(name);
CREATE INDEX IF NOT EXISTS idx_income_date ON income_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_income_payment ON income_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_expense_date ON expense_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_expense_status ON expense_transactions(status);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_verification ON receipts(verification_code);
