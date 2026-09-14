import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'admisionejercito';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCG2tZTLsK-6qzuSI1Tyf5ZQzxMw2FEC2s',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'admisionejercito.firebaseapp.com',
  projectId,
  // Bucket clásico suele ser más estable; el .env puede sobreescribir
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '156026675574',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:156026675574:web:feb0f39946d8487f10da57',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-Z4YGJM7DRK',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);

/** Storage principal */
export const storage = getStorage(firebaseApp);

/** Buckets a probar si el principal falla / cuelga */
export const STORAGE_BUCKET_CANDIDATES = Array.from(
  new Set(
    [
      firebaseConfig.storageBucket,
      `${projectId}.appspot.com`,
      `${projectId}.firebasestorage.app`,
    ].filter(Boolean)
  )
);

export function getStorageForBucket(bucket: string): FirebaseStorage {
  return getStorage(firebaseApp, `gs://${bucket}`);
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
