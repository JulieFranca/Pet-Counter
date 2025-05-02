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
  limit,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Pet } from '@/types';
import { DEFAULT_PET_IMAGE } from '@/constants';

export interface PetData {
  name: string;
  age: number;
  bio: string;
  photo: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const addPet = async (petData: Omit<PetData, 'createdAt' | 'updatedAt'>): Promise<string> => {
  const petRef = await addDoc(collection(db, 'pets'), {
    ...petData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return petRef.id;
};

export const updatePet = async (petId: string, petData: Partial<PetData>): Promise<void> => {
  const petRef = doc(db, 'pets', petId);
  await updateDoc(petRef, {
    ...petData,
    updatedAt: new Date()
  });
};

export const deletePet = async (petId: string): Promise<void> => {
  const petRef = doc(db, 'pets', petId);
  await deleteDoc(petRef);
};

export const getPetsByOwner = async (ownerId: string): Promise<Pet[]> => {
  const petsQuery = query(collection(db, 'pets'), where('ownerId', '==', ownerId));
  const querySnapshot = await getDocs(petsQuery);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Pet));
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
    const newPet = {
      ...petData,
      photo: petData.photo || DEFAULT_PET_IMAGE, // Usar foto padrão se nenhuma for fornecida
      ownerId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(petRef, newPet);

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