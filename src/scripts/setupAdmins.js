import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar a chave de serviço
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../../serviceAccountKey.json'))
);

// Inicializar o Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "mentoria-lari"
});

const auth = getAuth();
const db = getFirestore();

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

async function setupAdmin(email, password) {
  try {
    // Criar ou atualizar usuário no Authentication
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        emailVerified: true
      });
      console.log(`Usuário ${email} criado no Authentication`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        userRecord = await auth.getUserByEmail(email);
        console.log(`Usuário ${email} já existe no Authentication`);
      } else {
        throw error;
      }
    }

    // Criar ou atualizar documento no Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    await userRef.set({
      email,
      role: 'admin',
      status: 'approved',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Usuário ${email} configurado como admin com sucesso!`);
    return true;
  } catch (error) {
    console.error(`Erro ao configurar admin ${email}:`, error);
    return false;
  }
}

async function setupAllAdmins() {
  console.log('Iniciando configuração dos admins...');
  
  for (const adminUser of adminUsers) {
    await setupAdmin(adminUser.email, adminUser.password);
  }
  
  console.log('Processo de configuração de admins finalizado!');
  process.exit(0);
}

// Executar a configuração
setupAllAdmins(); 