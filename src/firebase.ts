import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB4R00_XaN_xqtIezsztUxMx6XdRF5-NPs",
  authDomain: "ai-ocr-667af.firebaseapp.com",
  projectId: "ai-ocr-667af",
  storageBucket: "ai-ocr-667af.firebasestorage.app",
  messagingSenderId: "561852741630",
  appId: "1:561852741630:web:12ca74e1409e6d5b16b2af",
  measurementId: "G-G0P0800Z05"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
