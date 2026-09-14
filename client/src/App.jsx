import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { MandalProvider } from './context/MandalContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { VarganiPage } from './pages/VarganiPage';
import { IncomePage } from './pages/IncomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { CashManagementPage } from './pages/CashManagementPage';
import { DigitalPaymentsPage } from './pages/DigitalPaymentsPage';
import { DonorsPage } from './pages/DonorsPage';
import { MembersPage } from './pages/MembersPage';
import { EventsPage } from './pages/EventsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { PublicVerifyReceiptPage } from './pages/PublicVerifyReceiptPage';
import { PublicDonationPage } from './pages/PublicDonationPage';
import { PublicDevoteePortal } from './pages/PublicDevoteePortal';
import { FestivalPlannerPage } from './pages/FestivalPlannerPage';
import { VolunteerManagementPage } from './pages/VolunteerManagementPage';
import { LoansPage } from './pages/LoansPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">सुरक्षित पडताळणी...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MandalProvider>
            <NotificationProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/verify-receipt/:receiptNumber?" element={<PublicVerifyReceiptPage />} />
                  <Route path="/donate" element={<PublicDonationPage />} />
                  <Route path="/public" element={<PublicDevoteePortal />} />

                  {/* Protected Mandal App Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="festival-planner" element={<FestivalPlannerPage />} />
                    <Route path="volunteers" element={<VolunteerManagementPage />} />
                    <Route
                      path="vargani"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'treasurer', 'secretary', 'volunteer', 'member']}>
                          <VarganiPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="income"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'treasurer', 'secretary', 'volunteer', 'member']}>
                          <IncomePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="expenses"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'treasurer', 'secretary', 'volunteer', 'member']}>
                          <ExpensesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="approvals"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'treasurer']}>
                          <ApprovalsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="transactions"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'treasurer', 'secretary', 'volunteer', 'member']}>
                          <TransactionsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="cash-management"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'treasurer', 'secretary', 'volunteer', 'member']}>
                          <CashManagementPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="loans"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'treasurer', 'secretary']}>
                          <LoansPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="digital-payments" element={<DigitalPaymentsPage />} />
                    <Route path="donors" element={<DonorsPage />} />
                    <Route path="members" element={<MembersPage />} />
                    <Route path="events" element={<EventsPage />} />
                    <Route
                      path="reports"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'treasurer', 'secretary', 'volunteer']}>
                          <ReportsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="users"
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <UsersManagementPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="audit-logs"
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AuditLogsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="settings"
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <SettingsPage />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* Catch all fallback */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </BrowserRouter>
            </NotificationProvider>
          </MandalProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
