import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import RoomDashboard from './pages/RoomDashboard';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import Contributions from './pages/Contributions';
import Expenses from './pages/Expenses';
import Wallet from './pages/Wallet';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="loader w-12 h-12 border-2 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/room" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/room" element={
            <ProtectedRoute>
              <RoomDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly={true}>
              <AdminUsers />
            </ProtectedRoute>
          } />
          
          <Route path="/contributions" element={
            <ProtectedRoute>
              <Contributions />
            </ProtectedRoute>
          } />
          
          <Route path="/expenses" element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          } />
          
          <Route path="/wallet" element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/room" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;