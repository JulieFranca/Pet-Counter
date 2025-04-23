import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Pet } from '@/types';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PetGrid from '../components/pets/PetGrid';
import { Trash2, UserX } from "lucide-react";

interface PendingUser {
  id: number;
  fullName: string;
  email: string;
  password: string;
}

interface Pet {
  id: number;
  name: string;
  photo: string;
  owner: string;
  age?: number;
  bio?: string;
}

const DEFAULT_PET_IMAGE = '/pictures/default-pet.svg';

const Admin: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'pets'>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [petFormData, setPetFormData] = useState({
    name: '',
    age: '',
    bio: '',
    photo: ''
  });
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: number, type: 'pet' | 'user'} | null>(null);
  const [imageErrors, setImageErrors] = useState<{[key: number]: boolean}>({});

  const user = useSelector((state: any) => state.auth.user);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      // Usuários pendentes
      const pendingResponse = await fetch('/api/pendingUsers');
      const pendingData = await pendingResponse.json();
      setPendingUsers(pendingData);

      // Usuários aprovados
      const usersResponse = await fetch('/api/users');
      const usersData = await usersResponse.json();
      setUsers(usersData);

      // Todos os pets
      const petsResponse = await fetch('/api/pets');
      const petsData = await petsResponse.json();
      setPets(petsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verificar se o usuário é admin
    if (!user?.isAdmin) {
      navigate('/dashboard');
      return;
    }
    
    fetchData();
  }, [user, navigate]);

  const handleApproveUser = async (pendingUser: PendingUser) => {
    try {
      // Criar o novo usuário aprovado
      const newUser = {
        fullName: pendingUser.fullName,
        email: pendingUser.email,
        password: pendingUser.password,
        isAdmin: false,
        isApproved: true
      };
      
      const createResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });
      
      if (!createResponse.ok) throw new Error('Erro ao aprovar usuário');
      
      // Remover o usuário da lista de pendentes
      const deleteResponse = await fetch(`/api/pendingUsers/${pendingUser.id}`, {
        method: 'DELETE'
      });
      
      if (!deleteResponse.ok) throw new Error('Erro ao remover usuário pendente');
      
      // Atualizar os dados
      fetchData();
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
    }
  };

  const handleRejectUser = async (pendingUser: PendingUser) => {
    try {
      const deleteResponse = await fetch(`/api/pendingUsers/${pendingUser.id}`, {
        method: 'DELETE'
      });
      
      if (!deleteResponse.ok) throw new Error('Erro ao rejeitar usuário');
      
      // Atualizar os dados
      fetchData();
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
    }
  };

  const handleMakeAdmin = async (userId: number) => {
    try {
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) return;
      
      const updatedUser = {
        ...userToUpdate,
        isAdmin: true
      };
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedUser)
      });
      
      if (!response.ok) throw new Error('Erro ao atualizar permissões');
      
      // Atualizar os dados
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      // Primeiro, excluir todos os pets do usuário
      const userPets = pets.filter(pet => pet.owner === userId.toString());
      for (const pet of userPets) {
        await fetch(`/api/pets/${pet.id}`, {
          method: 'DELETE'
        });
      }
      
      // Depois, excluir o usuário
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Erro ao excluir usuário');
      
      // Atualizar os dados
      fetchData();
      
      // Fechar o modal de confirmação se estiver aberto
      setShowConfirmDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  const handleDeletePet = async (petId: number) => {
    try {
      const response = await fetch(`/api/pets/${petId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Erro ao excluir pet');
      
      // Atualizar os dados
      fetchData();
      
      // Fechar modais se estiverem abertos
      setSelectedPet(null);
      setShowConfirmDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir pet:', error);
    }
  };

  const confirmDelete = (id: number, type: 'pet' | 'user') => {
    setItemToDelete({ id, type });
    setShowConfirmDeleteModal(true);
  };

  const handlePetClick = (pet: Pet) => {
    setSelectedPet(pet);
  };

  const closeDetails = () => {
    setSelectedPet(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPetFormData({ ...petFormData, [name]: value });
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const petData = {
        name: petFormData.name,
        age: petFormData.age ? parseInt(petFormData.age) : undefined,
        bio: petFormData.bio,
        photo: petFormData.photo || DEFAULT_PET_IMAGE,
        owner: selectedOwnerId
      };

      await fetch('/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(petData)
      });
      
      setShowAddPetModal(false);
      setPetFormData({ name: '', age: '', bio: '', photo: '' });
      setSelectedOwnerId('');
      fetchData();
    } catch (error) {
      console.error('Error adding pet:', error);
    }
  };

  const openAddPetModal = (userId: string) => {
    setSelectedOwnerId(userId);
    setShowAddPetModal(true);
  };

  const handleImageError = (petId: number) => {
    setImageErrors(prev => ({
      ...prev,
      [petId]: true
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Painel do Administrador</h1>
      
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'pending' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('pending')}
        >
          Usuários Pendentes ({pendingUsers.length})
        </button>
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('users')}
        >
          Usuários ({users.length})
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'pets' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('pets')}
        >
          Pets ({pets.length})
        </button>
      </div>
      
      {activeTab === 'pending' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Usuários Aguardando Aprovação</h2>
          
          {pendingUsers.length === 0 ? (
            <p className="text-gray-500">Não há usuários pendentes.</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingUsers.map((pendingUser) => (
                    <tr key={pendingUser.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{pendingUser.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{pendingUser.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleApproveUser(pendingUser)}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleRejectUser(pendingUser)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Rejeitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'users' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Usuários Ativos</h2>
          
          {users.length === 0 ? (
            <p className="text-gray-500">Não há usuários ativos.</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                          {user.isAdmin ? 'Administrador' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {!user.isAdmin && (
                          <>
                            <button
                              onClick={() => handleMakeAdmin(user.id)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Tornar Admin
                            </button>
                            <button
                              onClick={() => confirmDelete(user.id, 'user')}
                              className="text-red-600 hover:text-red-900 mr-3"
                              title="Remover usuário e seus pets"
                            >
                              <UserX className="h-4 w-4 inline" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openAddPetModal(user.id.toString())}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Adicionar Pet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'pets' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Todos os Pets</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <p className="text-blue-700">Total de pets cadastrados: <span className="font-bold">{pets.length}</span></p>
          </div>
          
          {pets.length === 0 ? (
            <p className="text-gray-500">Não há pets cadastrados.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <div 
                  key={pet.id} 
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="flex justify-center p-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                      <img 
                        src={imageErrors[pet.id] ? DEFAULT_PET_IMAGE : (pet.photo || DEFAULT_PET_IMAGE)}
                        alt={pet.name} 
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(pet.id)}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 text-center">
                    <h3 className="text-lg font-medium text-gray-800">{pet.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">Dono: {
                      (() => {
                        const ownerUser = users.find(u => u.id.toString() === pet.owner);
                        return ownerUser ? ownerUser.fullName : `ID ${pet.owner}`;
                      })()
                    }</p>
                    {pet.age && <p className="text-sm text-gray-500 mt-1">{pet.age} anos</p>}
                    <div className="mt-3 flex justify-center">
                      <button
                        onClick={() => handlePetClick(pet)}
                        className="text-blue-600 hover:text-blue-800 mx-2"
                      >
                        Detalhes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(pet.id, 'pet');
                        }}
                        className="text-red-600 hover:text-red-800 mx-2"
                      >
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalhes do Pet */}
      {selectedPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{selectedPet.name}</h2>
                <button 
                  onClick={closeDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex justify-center mb-6">
                <div className="w-40 h-40 rounded-full overflow-hidden">
                  <img 
                    src={selectedPet.photo || DEFAULT_PET_IMAGE} 
                    alt={selectedPet.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Dono</h3>
                  <p className="text-gray-600">{
                    (() => {
                      const ownerUser = users.find(u => u.id.toString() === selectedPet.owner);
                      return ownerUser ? ownerUser.fullName : `ID ${selectedPet.owner}`;
                    })()
                  }</p>
                </div>
              
                {selectedPet.age && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Idade</h3>
                    <p className="text-gray-600">{selectedPet.age} anos</p>
                  </div>
                )}
                
                {selectedPet.bio && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Biografia</h3>
                    <p className="text-gray-600">{selectedPet.bio}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={closeDetails}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    confirmDelete(selectedPet.id, 'pet');
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Remover Pet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Pet Modal */}
      {showAddPetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Adicionar Pet para o Usuário #{selectedOwnerId}</h2>
                <button 
                  onClick={() => setShowAddPetModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleAddPet} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={petFormData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Idade (anos)</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={petFormData.age}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Biografia</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={petFormData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">URL da Foto</label>
                  <input
                    type="text"
                    id="photo"
                    name="photo"
                    value={petFormData.photo}
                    onChange={handleInputChange}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deixe em branco para usar uma imagem padrão
                  </p>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddPetModal(false)}
                    className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800">Confirmar Exclusão</h2>
              </div>
              
              <div className="my-6">
                <p className="text-gray-600">
                  {itemToDelete.type === 'pet' 
                    ? 'Tem certeza que deseja excluir este pet? Esta ação não pode ser desfeita.'
                    : 'Tem certeza que deseja excluir este usuário? Todos os pets associados também serão removidos. Esta ação não pode ser desfeita.'}
                </p>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setShowConfirmDeleteModal(false);
                    setItemToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (itemToDelete.type === 'pet') {
                      handleDeletePet(itemToDelete.id);
                    } else {
                      handleDeleteUser(itemToDelete.id);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin; 