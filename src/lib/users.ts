import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { deleteUserPets } from './pets';
import { User, Pet } from '@/types/index';

export const createUserDocument = async (userId: string, email: string, firstName?: string, lastName?: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userData = {
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      role: 'user',
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isActive: true,
      hasCompletedProfile: !!(firstName && lastName) // true se ambos estiverem preenchidos
    };

    await setDoc(userRef, userData);
    return userData;
  } catch (error) {
    console.error('Erro ao criar documento do usuário:', error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    
    return {
      id: userDoc.id,
      ...userDoc.data()
    } as User;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
};

export const getUserRole = async (userId: string): Promise<'admin' | 'user' | null> => {
  try {
    const user = await getUserById(userId);
    if (!user || !user.isActive || user.status !== 'approved') {
      return null;
    }
    return user.role as 'admin' | 'user';
  } catch (error) {
    console.error('Erro ao verificar role do usuário:', error);
    return null;
  }
};

export const approveUser = async (userId: string, adminId: string) => {
  try {
    // Verificar se quem está fazendo a ação é admin
    const adminRole = await getUserRole(adminId);
    if (adminRole !== 'admin') {
      throw new Error('Apenas administradores podem aprovar usuários');
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: 'approved',
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Erro ao aprovar usuário:', error);
    throw error;
  }
};

export const rejectUser = async (userId: string, adminId: string) => {
  try {
    // Verificar se quem está fazendo a ação é admin
    const adminRole = await getUserRole(adminId);
    if (adminRole !== 'admin') {
      throw new Error('Apenas administradores podem rejeitar usuários');
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: 'rejected',
      isActive: false,
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Erro ao rejeitar usuário:', error);
    throw error;
  }
};

export const changeUserRole = async (userId: string, newRole: 'admin' | 'user', adminId: string) => {
  try {
    // Verificar se quem está fazendo a ação é admin
    const adminRole = await getUserRole(adminId);
    if (adminRole !== 'admin') {
      throw new Error('Apenas administradores podem mudar roles');
    }

    // Verificar se não está tentando mudar o admin principal
    const user = await getUserById(userId);
    if (user?.email === 'juliefrancasouza@gmail.com') {
      throw new Error('Não é possível alterar o role do administrador principal');
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Erro ao mudar role do usuário:', error);
    throw error;
  }
};

export const getPendingUsers = async (adminId: string): Promise<User[]> => {
  try {
    // Verificar se quem está fazendo a ação é admin
    const adminRole = await getUserRole(adminId);
    if (adminRole !== 'admin') {
      throw new Error('Apenas administradores podem listar usuários pendentes');
    }

    const q = query(
      collection(db, 'users'),
      where('status', '==', 'pending'),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  } catch (error) {
    console.error('Erro ao listar usuários pendentes:', error);
    throw error;
  }
};

export const getAllUsers = async (adminId: string): Promise<User[]> => {
  try {
    // Verificar se quem está fazendo a ação é admin
    const adminRole = await getUserRole(adminId);
    if (adminRole !== 'admin') {
      throw new Error('Apenas administradores podem listar usuários');
    }

    const q = query(collection(db, 'users'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    throw error;
  }
};

export const listenToPendingUsers = (
  adminId: string,
  onUpdate: (users: User[]) => void,
  onError: (error: Error) => void
): (() => void) | undefined => {
  // Verificar se quem está fazendo a ação é admin
  getUserRole(adminId).then(adminRole => {
    if (adminRole !== 'admin') {
      onError(new Error('Apenas administradores podem listar usuários pendentes'));
      return;
    }

    const q = query(
      collection(db, 'users'),
      where('status', '==', 'pending'),
      where('isActive', '==', true)
    );
    
    // Retornar o unsubscribe para limpar o listener quando necessário
    return onSnapshot(q, 
      (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        onUpdate(users);
      },
      (error) => {
        console.error('Erro ao escutar usuários pendentes:', error);
        onError(error);
      }
    );
  }).catch(error => {
    console.error('Erro ao verificar role do admin:', error);
    onError(error);
  });

  return undefined;
};

export const updateUserProfile = async (userId: string, data: { firstName: string; lastName: string }) => {
  try {
    const userRef = doc(db, 'users', userId);
    const updateData = {
      ...data,
      hasCompletedProfile: true,
      updatedAt: Timestamp.now()
    };

    await updateDoc(userRef, updateData);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar perfil do usuário:', error);
    throw error;
  }
};

// Função para verificar se o usuário precisa completar o perfil
export const checkProfileCompletion = async (userId: string): Promise<boolean> => {
  try {
    const user = await getUserById(userId);
    if (!user) return false;
    return !user.hasCompletedProfile;
  } catch (error) {
    console.error('Erro ao verificar completude do perfil:', error);
    return false;
  }
};

// Atualizar a função de notificação para incluir o nome completo do dono do pet
export const notifyNewPet = async (pet: Pet) => {
  try {
    const ownerDoc = await getDoc(doc(db, 'users', pet.ownerId));
    const ownerData = ownerDoc.data() as User;
    const ownerName = ownerData.firstName 
      ? `${ownerData.firstName} ${ownerData.lastName}`
      : ownerData.email;

    const notificationRef = doc(collection(db, 'notifications'));
    await setDoc(notificationRef, {
      type: 'new_pet',
      petId: pet.id,
      petName: pet.name,
      ownerId: pet.ownerId,
      ownerName: ownerName,
      createdAt: Timestamp.now(),
      read: false
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
}; 