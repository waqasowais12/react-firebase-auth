import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC9eLzJl3djhOW2qokqFFoE3Trkil6ll4I",
    authDomain: "team-management-92cdf.firebaseapp.com",
    projectId: "team-management-92cdf",
    storageBucket: "team-management-92cdf.appspot.com",
    messagingSenderId: "626663340656",
    appId: "1:626663340656:web:3f872a8767bfbc58bf12b5"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };