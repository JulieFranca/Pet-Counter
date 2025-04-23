import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Pet } from '@/types';
import { User } from '@/types';
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import PetGrid from '../components/pets/PetGrid';
import PetForm from '../components/pets/PetForm';

interface Pet {
  id: number;
  name: string;
  age?: number;
  bio?: string;
  photo: string;
  owner: string;
}

interface PetFormData {
  name: string;
  age: string;
  bio: string;
  photo: string;
}

const DEFAULT_PET_IMAGE = '/pictures/default-pet.svg';

const Dashboard: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [petToDelete, setPetToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    age: '',
    bio: '',
    photo: ''
  });
  const [imageErrors, setImageErrors] = useState<{[key: number]: boolean}>({});

  const user = useSelector((state: any) => state.auth.user);
  const navigate = useNavigate();

  const fetchPets = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/pets?owner=${userId}`);
      if (!response.ok) throw new Error('Erro ao buscar pets');
      const data = await response.json();
      setPets(data);
    } catch (error) {
      console.error('Erro ao buscar pets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userId = localStorage.getItem('userId');
      const petData = {
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : undefined,
        bio: formData.bio,
        photo: formData.photo || DEFAULT_PET_IMAGE,
        owner: userId
      };

      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(petData)
      });

      if (!response.ok) throw new Error('Erro ao cadastrar pet');
      
      setFormData({ name: '', age: '', bio: '', photo: '' });
      setShowModal(false);
      fetchPets();
    } catch (error) {
      console.error('Erro ao cadastrar pet:', error);
    }
  };

  const handleDeletePet = async (petId: number) => {
    try {
      const response = await fetch(`/api/pets/${petId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao remover pet');
      
      // Atualizar a lista após excluir
      fetchPets();
      
      // Fechar os modais
      setSelectedPet(null);
      setShowDeleteConfirm(false);
      setPetToDelete(null);
    } catch (error) {
      console.error('Erro ao remover pet:', error);
    }
  };

  const confirmDelete = (petId: number) => {
    setPetToDelete(petId);
    setShowDeleteConfirm(true);
  };

  const handlePetClick = (pet: Pet) => {
    setSelectedPet(pet);
  };

  const closeDetails = () => {
    setSelectedPet(null);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Meus Pets</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Adicionar Pet
        </button>
      </div>

      {pets.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🐾</div>
          <h2 className="text-2xl font-medium text-gray-700 mb-4">Você ainda não tem pets cadastrados</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-600 transition-colors"
          >
            Cadastrar Meu Primeiro Pet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <div 
              key={pet.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-center p-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                  <img 
                    src={imageErrors[pet.id] ? DEFAULT_PET_IMAGE : (pet.photo || DEFAULT_PET_IMAGE)}
                    alt={pet.name} 
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(pet.id)}
                  />
                </div>
              </div>
              <div className="p-4 text-center">
                <h3 className="font-medium text-lg">{pet.name}</h3>
                {pet.age && <p className="text-gray-600">{pet.age} anos</p>}
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={() => handlePetClick(pet)}
                    className="text-blue-600 hover:text-blue-800 mx-2"
                  >
                    Detalhes
                  </button>
                  <button
                    onClick={() => confirmDelete(pet.id)}
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

      {/* Modal de Cadastro */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Cadastrar Pet</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
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
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Biografia</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
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
                    value={formData.photo}
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
                    onClick={() => setShowModal(false)}
                    className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Cadastrar
                  </button>
                </div>
              </form>
            </div>
          </div>
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
                <div className="w-32 h-32 rounded-full overflow-hidden">
                  <img 
                    src={selectedPet.photo || DEFAULT_PET_IMAGE} 
                    alt={selectedPet.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {selectedPet.age && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Idade</h3>
                    <p>{selectedPet.age} anos</p>
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
                  onClick={() => confirmDelete(selectedPet.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Remover Pet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800">Confirmar Exclusão</h2>
              </div>
              
              <div className="my-6">
                <p className="text-gray-600">
                  Tem certeza que deseja remover este pet? Esta ação não pode ser desfeita.
                </p>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPetToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (petToDelete) {
                      handleDeletePet(petToDelete);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Sim, Remover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 