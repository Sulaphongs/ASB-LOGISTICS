import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast.jsx';
import { ConfirmProvider } from './components/Confirm.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Customers from './pages/Customers.jsx';
import Packages from './pages/Packages.jsx';
import PackageDetail from './pages/PackageDetail.jsx';
import Receiving from './pages/Receiving.jsx';
import Pricing from './pages/Pricing.jsx';
import Users from './pages/Users.jsx';
import Settings from './pages/Settings.jsx';
import Reports from './pages/Reports.jsx';
import ActivityLog from './pages/ActivityLog.jsx';
import Track from './pages/Track.jsx';
import PrintLabel from './pages/PrintLabel.jsx';

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/track" element={<Track />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/packages" element={<ProtectedRoute><Packages /></ProtectedRoute>} />
          <Route path="/packages/:id" element={<ProtectedRoute><PackageDetail /></ProtectedRoute>} />
          <Route path="/packages/:id/label" element={<ProtectedRoute><PrintLabel /></ProtectedRoute>} />
          <Route path="/receiving" element={<ProtectedRoute><Receiving /></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
          <Route path="/activity-log" element={<ProtectedRoute adminOnly><ActivityLog /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
        </Routes>
      </ConfirmProvider>
    </ToastProvider>
  );
}
