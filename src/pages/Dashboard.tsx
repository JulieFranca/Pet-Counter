import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getAllUsers, 
  listenToPendingUsers, 
  approveUser, 
  rejectUser, 
  changeUserRole 
} from '@/lib/users';
import { deletePet, deleteUserPets } from '@/lib/pets';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Pet } from '@/types/index';
import { DEFAULT_PET_IMAGE } from '@/constants';

export default function Dashboard() {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    let unsubscribePending: (() => void) | undefined;
    let unsubscribePets: (() => void) | undefined;

    // Escutar mudanças nos usuários pendentes
    unsubscribePending = listenToPendingUsers(
      user.uid,
      (users) => {
        setPendingUsers(users);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao escutar usuários pendentes:', error);
        setError('Erro ao carregar usuários pendentes');
        setLoading(false);
      }
    );

    // Carregar todos os usuários
    const loadAllUsers = async () => {
      try {
        const users = await getAllUsers(user.uid);
        setAllUsers(users);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        setError('Erro ao carregar usuários');
      }
    };

    // Escutar mudanças nos pets
    const q = query(collection(db, 'pets'));
    unsubscribePets = onSnapshot(q, (snapshot) => {
      const petsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pet[];
      setPets(petsData);
    });

    loadAllUsers();

    return () => {
      if (typeof unsubscribePending === 'function') unsubscribePending();
      if (typeof unsubscribePets === 'function') unsubscribePets();
    };
  }, [user, navigate]);

  const handleApproveUser = async (userId: string) => {
    try {
      await approveUser(userId, user!.uid);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      // Recarregar todos os usuários para atualizar a lista
      const users = await getAllUsers(user!.uid);
      setAllUsers(users);
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
      setError('Erro ao aprovar usuário');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await rejectUser(userId, user!.uid);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
      setError('Erro ao rejeitar usuário');
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await changeUserRole(userId, newRole, user!.uid);
      // Atualizar lista de usuários
      const users = await getAllUsers(user!.uid);
      setAllUsers(users);
    } catch (error) {
      console.error('Erro ao mudar role:', error);
      setError('Erro ao mudar role do usuário');
    }
  };

  const handleDeletePet = async (petId: string, ownerId: string) => {
    try {
      await deletePet(petId, ownerId);
    } catch (error) {
      console.error('Erro ao deletar pet:', error);
      setError('Erro ao deletar pet');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    // Não permitir deletar o usuário principal
    if (userEmail === 'juliefrancasouza@gmail.com') {
      alert('Não é possível deletar o usuário principal');
      return;
    }

    if (window.confirm(`Tem certeza que deseja deletar o usuário ${userEmail}?`)) {
      try {
        // Primeiro deletar todos os pets do usuário
        await deleteUserPets(userId);
        
        // Depois deletar o usuário do Firestore
        await deleteDoc(doc(db, 'users', userId));
        
        // Atualizar a lista de usuários localmente
        setAllUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        
        alert('Usuário e seus pets foram deletados com sucesso');
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        alert('Erro ao deletar usuário e seus pets. Tente novamente.');
      }
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Seção de Usuários Pendentes */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900">Usuários Pendentes</h2>
          <div className="mt-4">
            {pendingUsers.length === 0 ? (
              <p className="text-gray-500">Nenhum usuário pendente</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <li key={user.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveUser(user.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleRejectUser(user.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Rejeitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Usuários Ativos */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900">Usuários Ativos</h2>
          <div className="mt-4">
            <ul className="divide-y divide-gray-200">
              {allUsers
                .filter(user => user.isActive && user.status === 'approved')
                .map((user) => (
                  <li key={user.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <span className="text-sm text-gray-500 inline-flex items-center">
                        Role: <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value as 'admin' | 'user')}
                        className="border rounded px-2 py-1"
                        disabled={user.email === 'juliefrancasouza@gmail.com'}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        disabled={user.email === 'juliefrancasouza@gmail.com'}
                      >
                        Deletar
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Seção de Pets */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900">Todos os Pets</h2>
          <div className="mt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => {
                const owner = allUsers.find(u => u.id === pet.ownerId);
                return (
                  <div key={pet.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full overflow-hidden">
                        <img
                          src={pet.photo || DEFAULT_PET_IMAGE}
                          alt={pet.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{pet.name}</p>
                        <p className="text-sm text-gray-500">
                          Dono: {owner ? `${owner.firstName} ${owner.lastName}` : 'Usuário não encontrado'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeletePet(pet.id, pet.ownerId)}
                        className="ml-auto bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 