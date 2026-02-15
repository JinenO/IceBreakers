/* frontend/js/firebase-init.js */
import { AppConfig } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Initialize Firebase
const app = initializeApp(AppConfig.FIREBASE);
const db = getDatabase(app);

export { db, ref, push, set, onValue, update };
