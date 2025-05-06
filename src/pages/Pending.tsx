import { useAuth } from '@/contexts/AuthContext';

export default function Pending() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Conta Pendente
        </h2>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Olá {user?.email},
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Sua conta está aguardando aprovação do administrador.
              Você receberá um e-mail quando sua conta for aprovada.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Por favor, tente fazer login novamente mais tarde.
            </p>
            <button
              onClick={() => logout()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 