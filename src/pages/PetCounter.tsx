import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import PetForm from './PetForm';
import Login from './Login';
import { Pencil, Trash2 } from 'lucide-react';
import { deletePet } from '@/lib/pets';

interface Pet {
  id: string;
  name: string;
  photo: string;
  ownerId: string;
}

const PetCounter: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { user } = useAuth();
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);

  useEffect(() => {
    // Criar query para buscar todos os pets
    const q = query(collection(db, 'pets'));
    
    // Escutar mudanças em tempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const petsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pet[];
      setPets(petsData);
    });
    
    return () => unsubscribe();
  }, []);

  // Filtrar pets do usuário logado
  const userPets = pets.filter(pet => pet.ownerId === user?.uid);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Cabeçalho com Contador Global */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pet Counter</h1>
              <p className="mt-1 text-2xl text-blue-600">
                Total de pets: {pets.length}
              </p>
            </div>
            {!user ? (
              <button
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Fazer Login
              </button>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Adicionar Pet
              </button>
            )}
          </div>
          </div>

        {/* Lista de Pets do Usuário (só aparece se estiver logado) */}
        {user && (
          <>
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Meus Pets</h2>
              <p className="text-gray-500">Total: {userPets.length}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {userPets.map((pet) => (
                <div
                  key={pet.id}
                  className="bg-white overflow-hidden shadow-sm rounded-lg"
                >
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full overflow-hidden">
                        <img
                          src={pet.photo || '/placeholder-pet.png'}
                          alt={pet.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {pet.name}
                        </h3>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        title="Editar"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => setEditingPet(pet)}
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        title="Remover"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => setDeletingPet(pet)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal de Edição */}
            {editingPet && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <PetForm
                    pet={editingPet}
                    onClose={() => setEditingPet(null)}
                    onSuccess={() => {
                      setEditingPet(null);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Modal de Confirmação de Remoção */}
            {deletingPet && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h2 className="text-lg font-bold mb-4">Remover Pet</h2>
                  <p className="mb-6">Tem certeza que deseja remover o pet <b>{deletingPet.name}</b>?</p>
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      onClick={() => setDeletingPet(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      onClick={async () => {
                        await deletePet(deletingPet.id, user.uid);
                        setDeletingPet(null);
                      }}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal de Login */}
        {showLogin && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <Login onClose={() => setShowLogin(false)} />
            </div>
          </div>
        )}
        
        {/* Modal do Formulário de Pet */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <PetForm onClose={() => setShowForm(false)} onSuccess={() => setShowForm(false)} />
            </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default PetCounter; 