import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute, ProtectedRoute, SubscriberRoute } from './routes/RouteGuards';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { HomePage } from './pages/public/HomePage';
import { CharitiesPage } from './pages/public/CharitiesPage';
import { CharityDetailPage } from './pages/public/CharityDetailPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { DrawMechanicsPage } from './pages/public/DrawMechanicsPage';
import { PricingPage } from './pages/public/PricingPage';
import { LoginPage } from './pages/public/LoginPage';
import { SignupPage } from './pages/public/SignupPage';
import { DashboardHomePage } from './pages/dashboard/DashboardHomePage';
import { ScoresPage } from './pages/dashboard/ScoresPage';
import { SubscriptionPage } from './pages/dashboard/SubscriptionPage';
import { CharitySelectionPage } from './pages/dashboard/CharitySelectionPage';
import { DrawsPage } from './pages/dashboard/DrawsPage';
import { WinningsPage } from './pages/dashboard/WinningsPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { AdminHomePage } from './pages/admin/AdminHomePage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminSubscriptionsPage } from './pages/admin/AdminSubscriptionsPage';
import { AdminDrawsPage } from './pages/admin/AdminDrawsPage';
import { AdminCharitiesPage } from './pages/admin/AdminCharitiesPage';
import { AdminWinnersPage } from './pages/admin/AdminWinnersPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/charities" element={<CharitiesPage />} />
      <Route path="/charities/:id" element={<CharityDetailPage />} />
      <Route path="/draw" element={<DrawMechanicsPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHomePage />} />
        <Route
          path="scores"
          element={
            <SubscriberRoute>
              <ScoresPage />
            </SubscriberRoute>
          }
        />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="charity" element={<CharitySelectionPage />} />
        <Route
          path="draws"
          element={
            <SubscriberRoute>
              <DrawsPage />
            </SubscriberRoute>
          }
        />
        <Route
          path="winnings"
          element={
            <SubscriberRoute>
              <WinningsPage />
            </SubscriberRoute>
          }
        />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminHomePage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
        <Route path="draws" element={<AdminDrawsPage />} />
        <Route path="charities" element={<AdminCharitiesPage />} />
        <Route path="winners" element={<AdminWinnersPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
