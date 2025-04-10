import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material';
import { store } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Admin from '@/pages/Admin';
import PetCounter from '@/pages/PetCounter';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { User } from '@/types';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Componente de teste simples
const TestComponent = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Página de Teste</h1>
        <p className="text-gray-600 text-center">Se você consegue ver esta página, o problema não é com o Tailwind CSS.</p>
      </div>
    </div>
  );
};

// Componente para verificar se o usuário está autenticado
const AuthCheck: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (token && userId) {
        try {
          const response = await fetch(`/api/users/${userId}`);
          if (response.ok) {
            const userData = await response.json();
            dispatch(setCredentials({ user: userData, token }));
          }
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [dispatch]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !user.isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/pet-counter" replace />} />
            <Route path="/test" element={<TestComponent />} />
            <Route
              path="/pet-counter"
              element={
                <Layout currentPageName="PetCounter">
                  <PetCounter />
                </Layout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <AuthCheck>
                  <Layout currentPageName="Dashboard">
                    <Dashboard />
                  </Layout>
                </AuthCheck>
              }
            />
            <Route
              path="/admin"
              element={
                <AuthCheck requireAdmin>
                  <Layout currentPageName="Admin">
                    <Admin />
                  </Layout>
                </AuthCheck>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
