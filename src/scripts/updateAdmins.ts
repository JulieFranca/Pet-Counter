import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const adminEmails = [
  'juliefrancasouza@gmail.com',
  'Julie@admin.com'
];

async function updateUserToAdmin(email: string) {
  try {
    // Buscar usuário pelo email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`Usuário ${email} não encontrado`);
      return false;
    }

    // Atualizar o primeiro usuário encontrado com esse email
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
  } catch (error) {
    console.error(`Erro ao atualizar usuário ${email}:`, error);
    return false;
  }
}

async function updateExistingAdmins() {
  console.log('Iniciando atualização dos admins...');
  
  for (const email of adminEmails) {
    await updateUserToAdmin(email);
  }
  
  console.log('Processo de atualização de admins finalizado!');
}

// Executar a atualização
updateExistingAdmins(); 