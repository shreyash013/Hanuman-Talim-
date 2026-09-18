-- ==========================================================
-- SHRI HANUMAN TALIM MANDAL SHIROL - SUPABASE POSTGRESQL SCHEMA
-- Paste and run this script directly in Supabase SQL Editor
-- ==========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  mobile TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'treasurer', 'secretary', 'volunteer', 'member')),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Mandal Settings Table
CREATE TABLE IF NOT EXISTS mandal_settings (
  id BIGSERIAL PRIMARY KEY,
  name_mr TEXT NOT NULL DEFAULT 'श्री हनुमान तालीम मंडळ शिरोळ',
  name_en TEXT NOT NULL DEFAULT 'Shri Hanuman Talim Mandal Shirol',
  tagline_mr TEXT DEFAULT 'स्थापना १९६४ 🚩 | वर्ष-६२ वे 🔱 | ॥ नदीवेस चा महाराजा ॥ 🔱',
  tagline_en TEXT DEFAULT 'Est. 1964 🚩 | 62nd Year 🔱 | Nadives Cha Maharaja 🔱',
  address_mr TEXT DEFAULT 'नदीवेस, शिरोळ, जि. कोल्हापूर | ४१६१०३',
  address_en TEXT DEFAULT 'Nadives, Shirol, Dist. Kolhapur | 416103',
  contact_phone TEXT DEFAULT '+91 9356997428',
  contact_email TEXT DEFAULT 'shreyashgavade7@gmail.com',
  registration_no TEXT DEFAULT 'MAH/KOLHAPUR/1964',
  festival_year INTEGER DEFAULT 2026,
  arrival_date TIMESTAMPTZ DEFAULT '2026-09-14T09:00:00+05:30',
  visarjan_date TIMESTAMPTZ DEFAULT '2026-09-25T18:00:00+05:30',
  upi_id TEXT DEFAULT '9699572617@ibl',
  upi_name TEXT DEFAULT 'SUMEDH SHAHAJI GAVADE',
  receipt_prefix TEXT DEFAULT 'HANUMAN-2026-',
  receipt_language TEXT DEFAULT 'mr',
  currency_symbol TEXT DEFAULT '₹',
  logo_url TEXT DEFAULT '',
  initial_opening_balance NUMERIC(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Donors Table
CREATE TABLE IF NOT EXISTS donors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT,
  email TEXT,
  address TEXT,
  area TEXT DEFAULT 'शिरोळ',
  preferred_language TEXT DEFAULT 'mr',
  target_amount NUMERIC(12,2) DEFAULT 500,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  total_donated NUMERIC(12,2) DEFAULT 0,
  donations_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'unpaid',
  last_donated_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Income / Vargani Transactions Table
CREATE TABLE IF NOT EXISTS income_transactions (
  id BIGSERIAL PRIMARY KEY,
  transaction_id TEXT UNIQUE NOT NULL,
  donor_id BIGINT REFERENCES donors(id) ON DELETE SET NULL,
  donor_name TEXT NOT NULL,
  mobile TEXT,
  address TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK(amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'cash',
  category TEXT NOT NULL DEFAULT 'vargani',
  purpose TEXT DEFAULT 'श्री गणेशोत्सव वर्गणी',
  notes TEXT,
  collected_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  collector_name TEXT DEFAULT 'सुमेध गवडे (अध्यक्ष)',
  receipt_id BIGINT,
  receipt_number TEXT,
  attachment_url TEXT,
  status TEXT DEFAULT 'completed',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Digital Receipts Table
CREATE TABLE IF NOT EXISTS receipts (
  id BIGSERIAL PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  transaction_id BIGINT,
  donor_name TEXT NOT NULL,
  mobile TEXT,
  address TEXT,
  amount NUMERIC(12,2) NOT NULL,
  amount_in_words_mr TEXT,
  amount_in_words_en TEXT,
  payment_method TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'vargani',
  purpose TEXT DEFAULT 'श्री गणेशोत्सव वर्गणी',
  collector_name TEXT DEFAULT 'सुमेध गवडे (अध्यक्ष)',
  verification_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Expense Transactions Table
CREATE TABLE IF NOT EXISTS expense_transactions (
  id BIGSERIAL PRIMARY KEY,
  expense_id TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK(amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'cash',
  paid_to TEXT NOT NULL,
  bill_number TEXT,
  bill_attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'paid')),
  requested_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  requested_by_name TEXT,
  approved_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Cash Reconciliation Table
CREATE TABLE IF NOT EXISTS cash_reconciliation (
  id BIGSERIAL PRIMARY KEY,
  reconciliation_date DATE NOT NULL UNIQUE,
  opening_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
  cash_income NUMERIC(12,2) NOT NULL DEFAULT 0,
  cash_expense NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_closing NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_closing NUMERIC(12,2) NOT NULL DEFAULT 0,
  difference NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'reconciled',
  notes TEXT,
  verified_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  verified_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Committee Members Table
CREATE TABLE IF NOT EXISTS committee_members (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role_title_mr TEXT NOT NULL,
  role_title_en TEXT NOT NULL,
  mobile TEXT NOT NULL,
  photo_url TEXT,
  address TEXT,
  joining_year INTEGER DEFAULT 2026,
  emergency_contact TEXT,
  blood_group TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Events Table
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  title_mr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  location TEXT,
  description TEXT,
  organizer_name TEXT,
  budget NUMERIC(12,2) DEFAULT 0,
  actual_expense NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  description_mr TEXT,
  description_en TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  title_mr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  message_mr TEXT NOT NULL,
  message_en TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Loans Table
CREATE TABLE IF NOT EXISTS loans (
  id BIGSERIAL PRIMARY KEY,
  person_name TEXT NOT NULL,
  mobile TEXT,
  type TEXT NOT NULL DEFAULT 'borrowed' CHECK(type IN ('borrowed', 'lent')),
  amount NUMERIC(12,2) NOT NULL,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  remaining_amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  purpose TEXT,
  due_date DATE,
  interest_rate NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  repayments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_donors_mobile ON donors(mobile);
CREATE INDEX IF NOT EXISTS idx_donors_name ON donors(name);
CREATE INDEX IF NOT EXISTS idx_income_date ON income_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_income_payment ON income_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_expense_date ON expense_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_expense_status ON expense_transactions(status);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_verification ON receipts(verification_code);

-- Insert default mandal settings if empty
INSERT INTO mandal_settings (id, name_mr, name_en, tagline_mr, tagline_en, address_mr, address_en, contact_phone, contact_email, registration_no, festival_year, arrival_date, visarjan_date, upi_id, upi_name, receipt_prefix, currency_symbol)
VALUES (
  1,
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
  '2026-09-14T09:00:00+05:30',
  '2026-09-25T18:00:00+05:30',
  '9699572617@ibl',
  'SUMEDH SHAHAJI GAVADE',
  'HANUMAN-2026-',
  '₹'
)
ON CONFLICT (id) DO NOTHING;
