import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore'

// Firebase 설정 (실제 프로젝트)
const firebaseConfig = {
  apiKey: "AIzaSyCnNuJu6A6SgI6V_ZEH5ej7ICo0Zo-pxlM",
  authDomain: "hanolchaeum.firebaseapp.com",
  projectId: "hanolchaeum",
  storageBucket: "hanolchaeum.firebasestorage.app",
  messagingSenderId: "807965642924",
  appId: "1:807965642924:web:3aeae11c030c89dd370f09",
  measurementId: "G-ZVVSXFLN0E"
}

let app: FirebaseApp
let auth: Auth
let db: Firestore

try {
  // Firebase 앱 초기화
  app = initializeApp(firebaseConfig)
  
  // Firebase 서비스 초기화
  auth = getAuth(app)
  db = getFirestore(app)
  
  console.log('Firebase initialized successfully for Hanolchaeum')
  
  // 개발 환경에서만 에뮬레이터 연결 시도 (선택사항)
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099')
      connectFirestoreEmulator(db, 'localhost', 8080)
      console.log('Connected to Firebase emulators')
    } catch (error) {
      console.log('Firebase emulators not available, using production')
    }
  }
} catch (error) {
  console.error('Firebase initialization failed:', error)
  throw error
}

export { auth, db }
export default app 