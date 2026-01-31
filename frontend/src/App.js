import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/sonner';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import ManagementDashboard from './pages/ManagementDashboard';
import IssueDetailPage from './pages/IssueDetailPage';
import LostFoundPage from './pages/LostFoundPage';
import MarketplacePage from './pages/MarketplacePage';
import MessMenuPage from './pages/MessMenuPage';
import LaundryPage from './pages/LaundryPage';
import GatePassPage from './pages/GatePassPage';
import AIAssistantPage from './pages/AIAssistantPage';
import './App.css';
import './index.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Navigate to="/login?tab=register" replace />} />
            
            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/ai-assistant"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <AIAssistantPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/issues/:issueId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <IssueDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/lost-found"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <LostFoundPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/marketplace"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MarketplacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/mess"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MessMenuPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/laundry"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <LaundryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/gatepass"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <GatePassPage />
                </ProtectedRoute>
              }
            />
            
            {/* Management Routes */}
            <Route
              path="/management/dashboard"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/management/lost-found"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <LostFoundPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/management/issues/:issueId"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <IssueDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/management/gatepass"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <GatePassPage />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
