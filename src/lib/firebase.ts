import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBeqn6JPOX1kVrt-ajT_RNj_RnKBN0Ykbc",
  authDomain: "mentoria-lari.firebaseapp.com",
  projectId: "mentoria-lari",
  storageBucket: "mentoria-lari.firebasestorage.app",
  messagingSenderId: "890952150788",
  appId: "1:890952150788:web:aca24d1424a300676e2a51"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 