import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { getFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'admisionejercito';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCG2tZTLsK-6qzuSI1Tyf5ZQzxMw2FEC2s',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'admisionejercito.firebaseapp.com',
  projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '156026675574',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:156026675574:web:feb0f39946d8487f10da57',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-Z4YGJM7DRK',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const functions = getFunctions(firebaseApp, 'us-central1');

export const storage = getStorage(firebaseApp);

/** Preferir el bucket nuevo (.firebasestorage.app); appspot como respaldo. */
export const STORAGE_BUCKET_CANDIDATES = Array.from(
  new Set(
    [
      firebaseConfig.storageBucket,
      `${projectId}.firebasestorage.app`,
      `${projectId}.appspot.com`,
    ].filter(Boolean)
  )
);

export function getStorageForBucket(bucket: string): FirebaseStorage {
  return getStorage(firebaseApp, `gs://${bucket}`);
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
