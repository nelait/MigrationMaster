import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MigrationProvider } from './context/MigrationContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MigrationsListPage from './pages/MigrationsListPage';
import MigrationPage from './pages/MigrationPage';
import SettingsPage from './pages/SettingsPage';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner spinner-lg"></div></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner spinner-lg"></div></div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/migrations" element={<MigrationsListPage />} />
        <Route path="/migration/:id" element={<MigrationPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MigrationProvider>
          <AppRoutes />
        </MigrationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
