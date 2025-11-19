// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlYZBktMwAPnplMiC6jIy5kc2zw5bMTO0",
  authDomain: "mycoaching-mm.firebaseapp.com",
  databaseURL: "https://mycoaching-mm-default-rtdb.firebaseio.com",
  projectId: "mycoaching-mm",
  storageBucket: "mycoaching-mm.firebasestorage.app",
  messagingSenderId: "304171946364",
  appId: "1:304171946364:web:b1c329c6861d5764bf94f9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Export for use in other modules
export { app, auth, database };
