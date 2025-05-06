import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import PetCounter from '@/pages/PetCounter';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Pending from '@/pages/Pending';
import CompleteProfile from '@/pages/CompleteProfile';
import { useAuth } from '@/contexts/AuthContext';
import PrivateRoute from '@/components/PrivateRoute';

const App: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pending" element={<Pending />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />

      {/* Rotas protegidas */}
      <Route
        path="/"
        element={
          <PrivateRoute requiredRole="user">
            <Layout currentPageName="PetCounter">
              <PetCounter />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/pet-counter"
        element={
          <PrivateRoute requiredRole="user">
            <Layout currentPageName="PetCounter">
              <PetCounter />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute requiredRole="admin">
            <Layout currentPageName="Dashboard">
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Rota padrão - redireciona para login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
