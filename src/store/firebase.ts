import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
};
let db: ReturnType<typeof getFirestore> | null = null;
export const firebaseEnabled = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);
try {
  if (firebaseEnabled) {
    const app = getApps().length ? getApps()[0] : initializeApp(cfg);
    db = getFirestore(app);
  }
} catch { db = null; }
export { db };
