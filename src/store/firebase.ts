import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || configJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || configJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || configJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || configJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || configJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || configJson.appId,
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const databaseId = (configJson as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);


export async function loginWithGoogle() {
  // Keep the same Google OAuth flow that was working on mobile before the
  // redirect-specific changes: Firebase opens Google's auth popup directly.
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

// Free-plan fallback: keep small, optimized preview images in Firestore rather
// than requiring a Firebase Storage bucket. The app limits the result below
// Firestore's 1 MiB document limit and uses the original file only in memory.
export async function compressImageForFirestore(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('শুধু image file আপলোড করুন।');
  if (file.size > 10 * 1024 * 1024) throw new Error('প্রতিটি image 10 MB-এর কম হতে হবে।');

  const bitmap = await createImageBitmap(file);
  const maxSide = 1200;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.78, 0.64, 0.5, 0.38]) {
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) throw new Error('Image compress করা যায়নি।');
    if (blob.size <= 700 * 1024) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Image পড়া যায়নি।'));
        reader.readAsDataURL(blob);
      });
    }
  }
  throw new Error('Image ছোট করেও Firestore limit-এর মধ্যে আনা যায়নি। ছোট image দিন।');
}

export function authProviderOf(user: FirebaseUser) {
  return user.providerData.some(p => p.providerId === 'google.com') ? 'google' as const : 'password' as const;
}

export async function logoutFirebase() {
  await fbSignOut(auth);
}
