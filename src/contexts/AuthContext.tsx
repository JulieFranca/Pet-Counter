import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserDocument, getUserRole, getUserById } from '@/lib/users';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials, logout as logoutAction } from '@/store/slices/authSlice';
import { User } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  async function signUp(email: string, password: string, firstName: string, lastName: string) {
    try {
      setError(null);
      // Criar usuário no Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Criar documento do usuário no Firestore com status pendente
      await createUserDocument(userCredential.user.uid, email, firstName, lastName);
      
      // Redirecionar para página de pendência
      navigate('/pending');
    } catch (error: any) {
      console.error('Erro no signup:', error);
      setError(error.message || 'Erro ao criar conta');
      throw error;
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setError(null);
      // Fazer login no Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Verificar o status e role do usuário
      const userDoc = await getUserById(userCredential.user.uid);
      
      if (!userDoc) {
        throw new Error('Usuário não encontrado');
      }

      if (!userDoc.isActive) {
        throw new Error('Conta desativada');
      }

      if (userDoc.status === 'rejected') {
        throw new Error('Conta rejeitada');
      }

      if (userDoc.status === 'pending') {
        navigate('/pending');
        return;
      }

      // Verificar se o perfil está completo
      if (!userDoc.hasCompletedProfile) {
        navigate('/complete-profile');
        return;
      }

      // Atualizar o Redux com os dados do usuário
      dispatch(setCredentials({
        user: userDoc,
        token: await userCredential.user.getIdToken()
      }));

      // Se chegou aqui, o usuário está aprovado
      if (userDoc.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/pet-counter');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      setError(error.message || 'Erro ao fazer login');
      throw error;
    }
  }

  async function logout() {
    try {
      setError(null);
      await signOut(auth);
      dispatch(logoutAction());
      navigate('/login');
    } catch (error: any) {
      console.error('Erro no logout:', error);
      setError(error.message || 'Erro ao fazer logout');
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getUserById(firebaseUser.uid);
          
          if (!userDoc) {
            dispatch(logoutAction());
            navigate('/login');
            return;
          }

          if (!userDoc.isActive || userDoc.status === 'rejected') {
            await logout();
            return;
          }

          if (userDoc.status === 'pending') {
            navigate('/pending');
            return;
          }

          // Verificar se o perfil está completo
          if (!userDoc.hasCompletedProfile) {
            navigate('/complete-profile');
            return;
          }

          // Atualizar o Redux com os dados do usuário
          dispatch(setCredentials({
            user: userDoc,
            token: await firebaseUser.getIdToken()
          }));

          // Se chegou aqui, o usuário está aprovado
          if (userDoc.role === 'admin') {
            navigate('/dashboard');
          } else {
            navigate('/pet-counter');
          }
        } catch (error) {
          console.error('Erro ao verificar usuário:', error);
          navigate('/pending');
        }
      } else {
        dispatch(logoutAction());
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, dispatch]);

  const value = {
    user,
    loading,
    signUp,
    signIn,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
} 