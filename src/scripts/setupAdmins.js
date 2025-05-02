import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

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
    email: process.env.ADMIN_EMAIL_1,
    password: process.env.ADMIN_PASSWORD_1
  },
  {
    email: process.env.ADMIN_EMAIL_2,
    password: process.env.ADMIN_PASSWORD_2
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
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        userRecord = await auth.getUserByEmail(email);
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