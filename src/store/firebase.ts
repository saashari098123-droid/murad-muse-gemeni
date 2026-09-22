import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import configJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: configJson.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: configJson.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: configJson.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: configJson.storageBucket,
  messagingSenderId: configJson.messagingSenderId,
  appId: configJson.appId,
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const databaseId = (configJson as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Test server connection gracefully
if (firebaseEnabled && db) {
  try {
    getDocFromServer(doc(db, 'settings', 'global')).catch(() => {});
  } catch (e) {}
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutFirebase() {
  await fbSignOut(auth);
}
