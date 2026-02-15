import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7pHSc51_wzOgjiCTivSRe_vlJ5MRrLiM",
  authDomain: "irisflow-c7dba.firebaseapp.com",
  databaseURL: "https://irisflow-c7dba-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "irisflow-c7dba",
  storageBucket: "irisflow-c7dba.firebasestorage.app",
  messagingSenderId: "308646169856",
  appId: "1:308646169856:web:1243c59ce8ae3bcbfdf7e5",
  measurementId: "G-QH1KTTDNQB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and export it for AlertService
export const db = getDatabase(app);