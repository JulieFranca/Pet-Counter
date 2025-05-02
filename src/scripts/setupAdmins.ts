import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const adminUsers = [
  {
    email: 'juliefrancasouza@gmail.com',
    password: 'Akagami@666'
  },
  {
    email: 'Julie@admin.com',
    password: 'Akagami@666'
  }
];

async function setupAdmin(email: string, password: string) {
  try {
    // Primeiro, tentar criar o usuário
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Criar documento do usuário no Firestore
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        email,
        role: 'admin',
        status: 'approved',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log(`Admin ${email} criado com sucesso!`);
      return true;
    } catch (error: any) {
      // Se o usuário já existe, tentar atualizar
      if (error.code === 'auth/email-already-in-use') {
        console.log(`Usuário ${email} já existe, atualizando para admin...`);
        
        // Buscar usuário pelo email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userRef = doc(db, 'users', userDoc.id);
          
          await updateDoc(userRef, {
            role: 'admin',
            status: 'approved',
            isActive: true,
            updatedAt: Timestamp.now()
          });

          console.log(`Usuário ${email} atualizado para admin com sucesso!`);
          return true;
        }
      }
      throw error;
    }
  } catch (error) {
    console.error(`Erro ao configurar admin ${email}:`, error);
    return false;
  }
}

async function setupAllAdmins() {
  console.log('Iniciando configuração dos admins...');
  
  for (const admin of adminUsers) {
    await setupAdmin(admin.email, admin.password);
  }
  
  console.log('Processo de configuração de admins finalizado!');
}

// Executar a configuração
setupAllAdmins(); 