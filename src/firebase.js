import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCyh-nqcyScJvUWEDOnFmZD-BWOI-j9Jck",
  authDomain: "remote-dollars.firebaseapp.com",
  projectId: "remote-dollars",
  storageBucket: "remote-dollars.firebasestorage.app",
  messagingSenderId: "788852820594",
  appId: "1:788852820594:web:0c23159f286459038f10eb",
  measurementId: "G-730HNR0SE0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;