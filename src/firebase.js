import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// استبدل هذه البيانات ببيانات مشروعك الخاصة من Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCtcW-6MowzBWbcOfXvHNZ_MqPHeHzwKiM",
  authDomain: "transitexpress-53350.firebaseapp.com",
  projectId: "transitexpress-53350",
  storageBucket: "transitexpress-53350.firebasestorage.app",
  messagingSenderId: "933717970415",
  appId: "1:933717970415:web:e3d3626deb4f3001ac3a1a",
  measurementId: "G-R75KG82QP2"
};

// تهيئة تطبيق Firebase
const app = initializeApp(firebaseConfig);

// تصدير خدمة Firestore فقط
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
