import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Home() {
  const { user, userRole, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Pet Counter</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user?.email}
                {userRole === 'admin' && ' (Admin)'}
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Link
              to="/pet-counter"
              className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-50"
            >
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                Contador de Pets
              </h5>
              <p className="font-normal text-gray-700">
                Registre e gerencie seus pets aqui.
              </p>
            </Link>

            {userRole === 'admin' && (
              <Link
                to="/admin"
                className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-50"
              >
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                  Painel Admin
                </h5>
                <p className="font-normal text-gray-700">
                  Gerencie usuários e configurações do sistema.
                </p>
              </Link>
            )}

            <Link
              to="/dashboard"
              className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-50"
            >
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                Dashboard
              </h5>
              <p className="font-normal text-gray-700">
                Veja estatísticas e informações sobre seus pets.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 