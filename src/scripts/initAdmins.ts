import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
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

async function createAdminUser(email: string, password: string) {
  try {
    // Criar usuário no Authentication
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
    if (error.code === 'auth/email-already-in-use') {
      console.log(`Usuário ${email} já existe, atualizando para admin...`);
      // Aqui poderíamos adicionar lógica para atualizar um usuário existente para admin
    } else {
      console.error(`Erro ao criar admin ${email}:`, error);
    }
    return false;
  }
}

async function initializeAdmins() {
  console.log('Iniciando criação dos admins...');
  
  for (const admin of adminUsers) {
    await createAdminUser(admin.email, admin.password);
  }
  
  console.log('Processo de criação de admins finalizado!');
}

// Executar a inicialização
initializeAdmins(); 