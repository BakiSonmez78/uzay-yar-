import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    projectId: "math-games-6c136",
    appId: "1:465831207808:web:67dbbccf3c37986d4b9765",
    databaseURL: "https://math-games-6c136-default-rtdb.europe-west1.firebasedatabase.app",
    storageBucket: "math-games-6c136.firebasestorage.app",
    apiKey: "AIzaSyAA0ga6HPDQYWMfLclY8OvUqYO20AGTL3o",
    authDomain: "math-games-6c136.firebaseapp.com",
    messagingSenderId: "465831207808",
    measurementId: "G-XY81HWR793"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
