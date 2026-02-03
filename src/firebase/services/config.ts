// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHYGUjcGe1VlsZrsWA0psQ_9qpi3jy-4U",
  authDomain: "juscash-96b2c.firebaseapp.com",
  projectId: "juscash-96b2c",
  storageBucket: "juscash-96b2c.firebasestorage.app",
  messagingSenderId: "588169717428",
  appId: "1:588169717428:web:40d6cf18a2b4f0d80b59e1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const db = getFirestore(app);
export const auth = getAuth(app);