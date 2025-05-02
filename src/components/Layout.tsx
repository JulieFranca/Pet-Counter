import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { useAuth } from '@/contexts/AuthContext';
import { RootState } from '@/store';
import Notifications from './Notifications';
import ProfileCompletion from './ProfileCompletion';
import { checkProfileCompletion } from '@/lib/users';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LayoutProps {
  children: React.ReactNode;
  currentPageName: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPageName }) => {
  const [totalPets, setTotalPets] = useState(0);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { logout: firebaseLogout } = useAuth();
  const isPublicPage = currentPageName === 'PetCounter';

  useEffect(() => {
    // Verificar se o usuário precisa completar o perfil
    const checkProfile = async () => {
      if (user?.uid) {
        const needsCompletion = await checkProfileCompletion(user.uid);
        setShowProfileCompletion(needsCompletion);
      }
    };

    checkProfile();
  }, [user]);

  useEffect(() => {
    // Escutar mudanças na coleção de pets para atualizar o contador
    const q = query(collection(db, 'pets'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTotalPets(snapshot.size);
    }, (error) => {
      console.error('Erro ao escutar pets:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await firebaseLogout(); // Fazer logout no Firebase
      dispatch(logout()); // Limpar o estado do Redux
      
      // Limpar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      
      // Limpar cookies
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'firebase-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'firebase-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      navigate('/login'); // Redirecionar para a página de login
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
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
              <div className="flex items-center gap-4">
                {user ? (
                  <>
                    <span className="text-gray-600">{user.email}</span>
                    <button 
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-gray-900 flex items-center"
                    >
                      <span className="mr-2">🚪</span>
                      Sair
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/login" 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Entrar
                  </Link>
                )}
              </div>
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
      {showProfileCompletion && (
        <ProfileCompletion onComplete={() => setShowProfileCompletion(false)} />
      )}
      
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
              {user?.role === 'admin' && (
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
              <div className="flex items-center gap-4">
                <Notifications />
                <span className="text-gray-600">{user?.email}</span>
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
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 