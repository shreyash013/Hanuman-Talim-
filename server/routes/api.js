import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

import * as authController from '../controllers/authController.js';
import * as dashboardController from '../controllers/dashboardController.js';
import * as incomeController from '../controllers/incomeController.js';
import * as expenseController from '../controllers/expenseController.js';
import * as donorController from '../controllers/donorController.js';
import * as receiptController from '../controllers/receiptController.js';
import * as cashController from '../controllers/cashController.js';
import * as memberController from '../controllers/memberController.js';
import * as eventController from '../controllers/eventController.js';
import * as reportController from '../controllers/reportController.js';
import * as auditController from '../controllers/auditController.js';
import * as settingsController from '../controllers/settingsController.js';
import * as notificationController from '../controllers/notificationController.js';
import * as publicController from '../controllers/publicController.js';
import * as festivalController from '../controllers/festivalController.js';
import * as aiController from '../controllers/aiController.js';
import * as volunteerController from '../controllers/volunteerController.js';
import * as loanController from '../controllers/loanController.js';

const router = express.Router();

// Public & Auth Routes
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/verify-otp', authController.verifyOtp);

router.get('/public/verify-receipt/:identifier', receiptController.verifyPublicReceipt);
router.get('/receipts/number/:receiptNumber', receiptController.getReceiptByNumber);
router.get('/public/donation-info', publicController.getPublicDonationInfo);
router.post('/public/donate', publicController.submitOnlineDonationIntent);
router.get('/public/festival', festivalController.getFestivalInfo);

router.use(authenticate);

// AI Assistant & Reports
router.post('/ai/ask', aiController.askAiAssistant);
router.get('/ai/report', aiController.generateAiReport);

// Volunteer Leaderboard
router.get('/volunteers/leaderboard', volunteerController.getVolunteerLeaderboard);

router.get('/auth/me', authController.getMe);
router.get('/users', requireRoles('admin'), authController.getUsers);
router.post('/users', requireRoles('admin'), authController.createUser);
router.put('/users/:id/role', requireRoles('admin'), authController.updateUserRole);
router.put('/users/:id/status', requireRoles('admin'), authController.updateUserStatus);
router.delete('/users/:id', requireRoles('admin'), authController.deleteUser);
router.get('/dashboard/stats', dashboardController.getDashboardStats);
router.get('/income', incomeController.getIncomeList);
router.post('/income', upload.single('attachment'), incomeController.createIncome);
router.delete('/income/:id', requireRoles('admin'), incomeController.deleteIncome);
router.get('/donors', donorController.getDonorsList);
router.get('/donors/search', donorController.searchDonors);
router.get('/donors/:id', donorController.getDonorById);
router.post('/donors', donorController.createDonor);
router.put('/donors/:id', donorController.updateDonor);
router.get('/receipts', receiptController.getAllReceipts);
router.get('/receipts/:id', receiptController.getReceiptById);
router.get('/receipts/number/:receiptNumber', receiptController.getReceiptByNumber);
router.get('/expenses', expenseController.getExpenseList);
router.post('/expenses', upload.single('bill_attachment'), expenseController.createExpense);
router.put('/expenses/:id/approve', requireRoles('admin', 'treasurer'), expenseController.approveExpense);
router.put('/expenses/:id/reject', requireRoles('admin', 'treasurer'), expenseController.rejectExpense);
router.delete('/expenses/:id', expenseController.deleteExpense);
router.get('/cash/summary', cashController.getCashSummary);
router.post('/cash/reconcile', requireRoles('admin', 'treasurer'), cashController.reconcileCash);
router.get('/cash/history', cashController.getCashHistory);
router.get('/members', memberController.getMembersList);
router.post('/members', requireRoles('admin', 'secretary'), upload.single('photo'), memberController.createMember);
router.put('/members/:id', requireRoles('admin', 'secretary'), upload.single('photo'), memberController.updateMember);
router.delete('/members/:id', requireRoles('admin'), memberController.deleteMember);
router.get('/events', eventController.getEventsList);
router.post('/events', requireRoles('admin', 'secretary'), eventController.createEvent);
router.put('/events/:id', requireRoles('admin', 'secretary'), eventController.updateEvent);
router.delete('/events/:id', requireRoles('admin'), eventController.deleteEvent);
router.get('/reports/financial', reportController.getFinancialReport);
router.get('/reports/export/:type', reportController.exportCsvData);
router.get('/audit-logs', requireRoles('admin'), auditController.getAuditLogs);
router.get('/settings', settingsController.getSettings);
router.put('/settings', requireRoles('admin'), upload.single('logo'), settingsController.updateSettings);
router.post('/settings/reset-database', requireRoles('admin'), settingsController.resetDatabase);
router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);

// Loans / Borrowings Endpoints
router.get('/loans', loanController.getLoans);
router.post('/loans', loanController.createLoan);
router.post('/loans/:id/repay', loanController.repayLoan);
router.get('/loans/summary', loanController.getLoanSummary);
router.delete('/loans/:id', requireRoles('admin'), loanController.deleteLoan);

export default router;
