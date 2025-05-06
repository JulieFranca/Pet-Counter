import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Timestamp,
  onSnapshot,
  orderBy,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Pet } from '@/types';
import { DEFAULT_PET_IMAGE } from '@/constants';

export interface PetData {
  name: string;
  age?: number;
  bio?: string;
  photo?: string | null;
  ownerId: string;
  birthDate?: Date;
  adoptionDate?: Date;
  ageInMonths?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const addPet = async (petData: Omit<PetData, 'createdAt' | 'updatedAt'>) => {
  const now = Timestamp.now();
  
  // Verificar tamanho da imagem antes de salvar
  if (petData.photo && typeof petData.photo === 'string') {
    // Calcular tamanho aproximado da string base64
    const base64Size = Math.ceil((petData.photo.length * 3) / 4);
    const base64SizeMB = base64Size / (1024 * 1024);
    
    if (base64Size > 1000000) { // 1MB em bytes
      throw new Error(`A imagem é muito grande. Tamanho atual: ${base64SizeMB.toFixed(1)}MB. Tamanho máximo permitido: 1MB`);
    }
  }
  
  // Remover campos undefined
  const cleanPetData = Object.entries(petData).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);

  const newPet = {
    ...cleanPetData,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, 'pets'), newPet);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar pet:', error);
    if (error instanceof Error && error.message.includes('bytes')) {
      throw new Error('A imagem é muito grande. Por favor, escolha uma imagem menor que 1MB.');
    }
    throw new Error('Erro ao salvar o pet');
  }
};

export const updatePet = async (petId: string, userId: string, petData: Partial<PetData>) => {
  try {
    // Verificar se o pet pertence ao usuário
    const petRef = doc(db, 'pets', petId);
    const pet = await getDocs(query(collection(db, 'pets'), where('ownerId', '==', userId)));
    
    if (pet.empty) {
      throw new Error('Você não tem permissão para editar este pet');
    }

    const updateData = {
      ...petData,
      // Se a foto for removida, usar a foto padrão
      photo: petData.photo === null ? DEFAULT_PET_IMAGE : petData.photo,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(petRef, updateData);
  } catch (error) {
    console.error('Erro ao atualizar pet:', error);
    throw new Error('Erro ao atualizar o pet');
  }
};

export const deletePet = async (petId: string, userId: string) => {
  try {
    // Verificar se o pet pertence ao usuário
    const pet = await getDocs(query(collection(db, 'pets'), where('ownerId', '==', userId)));
    
    if (pet.empty) {
      throw new Error('Você não tem permissão para deletar este pet');
    }

    await deleteDoc(doc(db, 'pets', petId));
  } catch (error) {
    console.error('Erro ao deletar pet:', error);
    throw error;
  }
};

export const getUserPets = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'pets'),
      where('ownerId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar pets do usuário:', error);
    throw error;
  }
};

// Função para deletar todos os pets de um usuário
export const deleteUserPets = async (userId: string) => {
  try {
    const q = query(collection(db, 'pets'), where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Erro ao deletar pets do usuário:', error);
    throw error;
  }
};

export const listenToNewPets = (
  onUpdate: (pets: Pet[]) => void,
  onError: (error: Error) => void
) => {
  try {
    // Criar query ordenada por data de criação
    const q = query(
      collection(db, 'pets'),
      orderBy('createdAt', 'desc')
    );
    
    // Retornar o unsubscribe para limpar o listener quando necessário
    return onSnapshot(q, 
      (snapshot) => {
        const pets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Pet[];
        onUpdate(pets);
      },
      (error) => {
        console.error('Erro ao escutar novos pets:', error);
        onError(error);
      }
    );
  } catch (error) {
    console.error('Erro ao configurar listener de pets:', error);
    onError(error as Error);
  }
};

// Função para enviar notificação para todos os usuários
export const notifyNewPet = async (pet: Pet) => {
  try {
    // Criar uma nova notificação na coleção notifications
    const notificationRef = doc(collection(db, 'notifications'));
    await setDoc(notificationRef, {
      type: 'new_pet',
      petId: pet.id,
      petName: pet.name,
      ownerId: pet.ownerId,
      createdAt: Timestamp.now(),
      read: false
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
};

export const createPet = async (petData: PetData, userId: string) => {
  try {
    const petRef = doc(collection(db, 'pets'));
    
    // Buscar dados do dono
    const ownerDoc = await getDoc(doc(db, 'users', userId));
    const ownerData = ownerDoc.data();
    const ownerName = ownerData?.firstName 
      ? `${ownerData.firstName} ${ownerData.lastName}`
      : ownerData?.email || '';

    const now = Timestamp.now();
    const newPet = {
      ...petData,
      photo: petData.photo || DEFAULT_PET_IMAGE, // Usar foto padrão se nenhuma for fornecida
      ownerId: userId,
      ownerName,
      createdAt: now.toDate(),
      updatedAt: now.toDate()
    };

    await setDoc(petRef, {
      ...newPet,
      createdAt: now,
      updatedAt: now
    });

    // Criar notificação para todos os usuários
    await notifyNewPet({
      id: petRef.id,
      ...newPet
    });

    return {
      id: petRef.id,
      ...newPet
    };
  } catch (error) {
    console.error('Erro ao criar pet:', error);
    throw error;
  }
}; 