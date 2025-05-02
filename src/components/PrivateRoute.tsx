import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/lib/users';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'user';
}

export default function PrivateRoute({ children, requiredRole }: PrivateRouteProps) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        return;
      }

      try {
        const role = await getUserRole(user.uid);
        setHasAccess(role === requiredRole);
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [user, requiredRole]);

  if (hasAccess === null) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!hasAccess) {
    return <Navigate to="/pending" />;
  }

  return <>{children}</>;
} 