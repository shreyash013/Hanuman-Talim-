# गणपती मंडळ व्यवस्थापन प्रणाली (Ganpati Mandal Management System)
### Production-Quality Financial Accounting, Vargani Collection, Digital Receipts, WhatsApp Sharing & Festival Management System

---

## 🚩 Overview

**"गणपती मंडळ व्यवस्थापन प्रणाली" (Ganpati Mandal Management System)** is a modern, responsive, Marathi-first full-stack web application purpose-built for Indian Ganpati Mandals. It automates daily financial record keeping, fast on-the-ground vargani/donation collection in under 20 seconds, digital receipt generation with Marathi amount in words, 1-click WhatsApp deep-link sharing, multi-level expense approvals, daily cash reconciliation, festival countdowns, event scheduling, and audit trail security.

---

## 🌟 Key Features

1. **Marathi-First Multilingual Interface (`mr`, `hi`, `en`)**
   - Default native Marathi terminology (डॅशबोर्ड, जमा रक्कम, खर्च, वर्गणी, देणगी, पावती, खजिनदार, ताळेबंद).
   - Seamless language switcher for Hindi and English.
   - Dynamic Marathi number-to-words converter for receipts (e.g. ₹ 2,501 → *"दोन हजार पाचशे एक रुपये फक्त"*).

2. **Ultra-Fast Vargani Collection Flow (< 20 Seconds)**
   - Autocomplete search by donor name, mobile number, or locality/peth.
   - Real-time display of previous contributions and lifetime donation totals.
   - Preset quick amount chips (₹101, ₹251, ₹501, ₹1,001, ₹2,100, ₹5,001, ₹11,000).
   - Automatic unique receipt numbering (`HANUMAN-2026-000001`).
   - Celebratory confetti on successful collection!

3. **Digital Receipt & WhatsApp Sharing**
   - Royal temple border design with Ganpati motifs, Mandal registration number, donor details, and digital signatures.
   - Dynamic QR verification code.
   - **WhatsApp 1-Click Share Button**: Generates a pre-formatted respectful Marathi/Hindi/English devotional message and launches `https://wa.me/91XXXXXXXXXX?text=...`.
   - Instant high-resolution **PDF Download** and **Print Layout**.

4. **Multi-Level Expense & Approval Queue**
   - Volunteers submit expenses with attached bill photos/vouchers.
   - Treasurers and Admins review pending expenses with 1-click Approve or Reject (with required reason).
   - Categorized under Mandap, Ganesh Idol, Sound System, Lighting, Prasad, Flowers, Security, Printing, etc.

5. **Daily Cash Management & Reconciliation**
   - Automated formula: `Opening Cash + Cash Income - Cash Expenses = Expected Closing`.
   - Real-time comparison with physical cash counted.
   - Highlighted discrepancy warning and reason logging.

6. **Dynamic NPCI UPI QR Code Generator**
   - Generates live NPCI-compliant UPI QR codes (`upi://pay?pa=...`) for custom amounts or open amounts.
   - Printable counter standee for donation counters.

7. **Public Verification & Devotee Donation Portal**
   - `/verify-receipt/:receiptNumber` - Privacy-protected public receipt verification via QR scan without leaking donor mobile numbers.
   - `/donate` - Public donation page for devotees with live Mandal UPI QR code and online contribution submission.

8. **Role-Based Security & User Management**
   - **Admin (अध्यक्ष)**: Full access to Mandal settings, users, audit logs, financial CRUD, and backups.
   - **Treasurer (खजिनदार)**: Manages income, records expenses, approves volunteer requests, reconciles daily cash.
   - **Secretary (सचिव)**: Coordinates committee members, festival events, and reports.
   - **Volunteer (स्वयंसेवक)**: Fast on-the-ground donor registration and vargani collection.

9. **Comprehensive Financial Reports & CSV Export**
   - Daily, Weekly, Monthly, and Festival balance sheets.
   - Performance breakdown by Volunteer/Collector.
   - One-click CSV/Excel downloads and printable balance sheet views.

10. **Immutable Security Audit Log**
    - Tracks every financial creation, update, approval, rejection, deletion, and reconciliation with user, timestamp, and before/after values.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 18, Vite, React Router v6
  - Tailwind CSS with customized Ganpati festive design system (Saffron, Maroon, Gold, Dark Charcoal)
  - Lucide React Icons
  - Recharts (Interactive Area, Donut, and Bar charts)
  - Framer Motion (Page and modal transitions)
  - Canvas-Confetti
  - QRCode.react
  - html2canvas & jsPDF
- **Backend**:
  - Node.js & Express.js (REST API Architecture)
  - SQLite (with WAL mode) + PostgreSQL/Supabase compatibility
  - JSON Web Tokens (JWT) & Bcryptjs
  - Multer (Bill/Receipt uploads)
  - Morgan Logger & CORS
- **Database**:
  - Relational SQL schema with foreign keys, indexes, and automated seed dataset.

---

## 📁 Directory Structure

```
ganpati-mandal-app/
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── components/
│       │   ├── common/ (GanpatiLogo, StatCard, Badge, Modal, CountdownTimer)
│       │   ├── layout/ (Sidebar, TopNavbar, BottomMobileNav, AppLayout)
│       │   ├── receipt/ (DigitalReceipt, ReceiptModal)
│       │   └── upi/ (UpiQrModal)
│       ├── context/ (AuthContext, LanguageContext, ThemeContext, MandalContext, NotificationContext)
│       ├── locales/ (mr.json, hi.json, en.json)
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── VarganiPage.jsx
│       │   ├── IncomePage.jsx
│       │   ├── ExpensesPage.jsx
│       │   ├── ApprovalsPage.jsx
│       │   ├── TransactionsPage.jsx
│       │   ├── CashManagementPage.jsx
│       │   ├── DigitalPaymentsPage.jsx
│       │   ├── DonorsPage.jsx
│       │   ├── MembersPage.jsx
│       │   ├── EventsPage.jsx
│       │   ├── ReportsPage.jsx
│       │   ├── AuditLogsPage.jsx
│       │   ├── SettingsPage.jsx
│       │   ├── PublicVerifyReceiptPage.jsx
│       │   └── PublicDonationPage.jsx
│       ├── services/ (api.js)
│       ├── utils/ (marathiNumberToWords.js, formatCurrency.js, dateUtils.js)
│       ├── App.jsx
│       └── main.jsx
├── server/
│   ├── database/
│   │   ├── db.js
│   │   ├── schema.sql
│   │   ├── reset.js
│   │   └── seed.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── incomeController.js
│   │   ├── expenseController.js
│   │   ├── donorController.js
│   │   ├── receiptController.js
│   │   ├── cashController.js
│   │   ├── memberController.js
│   │   ├── eventController.js
│   │   ├── reportController.js
│   │   ├── auditController.js
│   │   ├── settingsController.js
│   │   ├── notificationController.js
│   │   └── publicController.js
│   ├── middleware/ (authMiddleware.js, roleMiddleware.js, uploadMiddleware.js, auditMiddleware.js)
│   ├── routes/ (api.js)
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── README.md
└── test_flow.js
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Backend Setup
```bash
cd server
npm install
npm start        # Runs backend on http://localhost:5000 (auto-initializes clean schema & initial admin)
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev      # Runs frontend on http://localhost:3000
```

Open your browser and navigate to `http://localhost:3000`.

---

## 🔑 Initial Administrator Account

On first startup, the system initializes with the default Super Admin account:

- **Email / Mobile**: `admin@ganeshmandal.org` or `9822011111`
- **Default Password**: `admin123`
- **Role**: `admin` (अध्यक्ष / मुख्य प्रशासक)

*You can configure the initial admin credentials via environment variables in `server/.env` (`ADMIN_EMAIL`, `ADMIN_MOBILE`, `ADMIN_PASSWORD`).*

Once logged in as Admin, you can add and manage accounts for Treasurers, Secretaries, and Volunteers.

---

## 📲 WhatsApp Deep-Link Integration

When a vargani or donation receipt is generated, the system creates a formatted devotional WhatsApp message:

```text
🙏 नमस्कार अमोल रमेश पाटील,

युवा स्पोर्ट्स गणेशोत्सव मंडळ गणेशोत्सवासाठी आपण दिलेल्या वर्गणी/देणगीबद्दल मनःपूर्वक धन्यवाद!

🧾 पावती क्र: HANUMAN-2026-000003
💰 रक्कम: ₹15,000
📅 दिनांक: 20 ऑगस्ट 2026
🎯 उद्देश: वार्षिक घरगुती वर्गणी

🔗 आपली अधिकृत डिजिटल पावती येथे पहा:
http://localhost:3000/verify-receipt/HANUMAN-2026-000003

आपले सहकार्य आमच्यासाठी मोलाचे आहे.

🚩 गणपती बाप्पा मोरया! मंगलमूर्ती मोरया! 🙏
```

Clicking **"WhatsApp वर पाठवा"** opens `https://wa.me/919823012345?text=...` directly in WhatsApp Web or the WhatsApp mobile app.

---

## ⚙️ Environment Variables

### Backend (`server/.env`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=ganpati_bappa_morya_mandal_secure_jwt_secret_2026
CLIENT_URL=http://hanuman-talim-mandal.onrender.com
DATABASE_URL=./database/ganpati_mandal.sqlite

# Optional: Supabase / PostgreSQL Migration
# DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
# SUPABASE_URL=https://[project-ref].supabase.co
# SUPABASE_ANON_KEY=[anon-key]
```

---

## 🌐 Production Deployment Guide

### Deploying Frontend (Vercel / Netlify):
1. Build command: `npm run build`
2. Output directory: `dist`
3. Set environment variable `VITE_API_URL` to your production backend URL.

### Deploying Backend (Render / Railway / Cloud Run):
1. Start command: `node server.js`
2. Configure `PORT`, `JWT_SECRET`, and `DATABASE_URL`.

---

🚩 **गणपती बाप्पा मोरया! मंगलमूर्ती मोरया!** 🚩
