import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import configJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: configJson.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: configJson.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: configJson.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: configJson.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: configJson.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: configJson.appId || import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const databaseId = (configJson as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

if (firebaseEnabled && db) {
  try {
    getDocFromServer(doc(db, 'settings', 'global')).catch(() => {});
  } catch {
    // Firebase availability is handled by the UI actions.
  }
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function registerWithEmail(email: string, password: string, displayName: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName.trim()) await updateProfile(result.user, { displayName: displayName.trim() });
  return result.user;
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function uploadImage(file: File, path: string) {
  if (!firebaseEnabled) throw new Error('Firebase Storage is not configured.');
  const imageRef = ref(storage, path);
  const snapshot = await uploadBytes(imageRef, file, { contentType: file.type, cacheControl: 'public,max-age=31536000,immutable' });
  return getDownloadURL(snapshot.ref);
}

export function authProviderOf(user: FirebaseUser) {
  return user.providerData.some(p => p.providerId === 'google.com') ? 'google' as const : 'password' as const;
}

export async function logoutFirebase() {
  await fbSignOut(auth);
}
