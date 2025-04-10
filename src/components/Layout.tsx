import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';

interface LayoutProps {
  children: React.ReactNode;
  currentPageName: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPageName }) => {
  const [totalPets, setTotalPets] = useState(0);
  const user = useSelector((state: any) => state.auth.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isPublicPage = currentPageName === 'PetCounter';

  useEffect(() => {
    const fetchPetCount = async () => {
      try {
        const response = await fetch('/api/pets');
        if (response.ok) {
          const pets = await response.json();
          setTotalPets(pets.length);
        }
      } catch (error) {
        console.error('Erro ao buscar contagem de pets:', error);
      }
    };

    fetchPetCount();
    const interval = setInterval(fetchPetCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    dispatch(logout());
    navigate('/login');
  };

  // Para páginas públicas
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="text-xl font-bold text-blue-600 flex items-center">
                <span className="mr-2">🐾</span>
                Pet Register
              </Link>
              <Link 
                to="/login" 
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    );
  }

  // Para páginas que requerem autenticação
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="text-xl font-bold text-blue-600 flex items-center">
                <span className="mr-2">🐾</span>
                Pets da Mentoria da LARI
              </Link>
              <div className="text-sm text-gray-600 flex items-center">
                <span className="mr-2">🐾</span>
                <span>{totalPets} pets cadastrados</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user?.isAdmin && (
                <Link 
                  to="/admin" 
                  className={`px-4 py-2 rounded-md ${
                    currentPageName === 'Admin' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Admin
                </Link>
              )}
              <Link 
                to="/dashboard" 
                className={`px-4 py-2 rounded-md ${
                  currentPageName === 'Dashboard' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                <span className="mr-2">🚪</span>
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 