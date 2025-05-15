import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCG2fRn8Gu0qmR5NFYi-grcnHtrl9zVHrs",
  authDomain: "harli-platform.firebaseapp.com",
  projectId: "harli-platform",
  storageBucket: "harli-platform.firebasestorage.app",
  messagingSenderId: "380977456320",
  appId: "1:380977456320:web:8a661984fc53ef0bcff925"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);