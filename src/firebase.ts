import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyBVdTzfoTu4CqrUxYPFEqIivqRj2J_dvSc",
  authDomain: "cis371-a2b64.firebaseapp.com",
  projectId: "cis371-a2b64",
  storageBucket: "cis371-a2b64.firebasestorage.app",
  messagingSenderId: "339619956300",
  appId: "1:339619956300:web:651fe6c599094ff65556e9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;
