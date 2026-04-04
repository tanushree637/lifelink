import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBdch48tqnrJfU1IlOzHGBS7i69TvytOCA",
  authDomain: "lifelink-355bc.firebaseapp.com",
  projectId: "lifelink-355bc",
  storageBucket: "lifelink-355bc.firebasestorage.app",
  messagingSenderId: "769584480094",
  appId: "1:769584480094:web:a57ecdab787662181d59cf",
  measurementId: "G-FV5BGZPDRS",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export default app;
