import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, onSnapshot,
  query, orderBy, serverTimestamp, type Firestore
} from 'firebase/firestore';
import type { FirebaseConfig } from '@/types';

// ── Hardcoded Guhanix Firebase config ─────────────────────────────────────────
const DEFAULT_CONFIG: FirebaseConfig = {
  apiKey:            'AIzaSyD6K1qTVXukL1Ad5y-LLerHEE548nvM0nQ',
  authDomain:        'leads-c1147.firebaseapp.com',
  projectId:         'leads-c1147',
  storageBucket:     'leads-c1147.firebasestorage.app',
  messagingSenderId: '693840437111',
  appId:             '1:693840437111:web:2963a0c36bc988a8398b72',
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

/** Initialise Firebase. Uses DEFAULT_CONFIG if no config is passed. */
export function initFirebase(config?: FirebaseConfig): Firestore {
  const cfg = config ?? DEFAULT_CONFIG;
  try {
    app = getApps().length ? getApp() : initializeApp(cfg);
    db  = getFirestore(app);
    return db;
  } catch (err) {
    console.error('[Firebase init]', err);
    throw err;
  }
}

export function getDB(): Firestore | null { return db; }
export function isFirebaseReady(): boolean { return db !== null; }
export function getDefaultConfig(): FirebaseConfig { return DEFAULT_CONFIG; }

/**
 * Save a form submission to Firestore.
 * Path: crm_forms/{formId}/submissions/{auto-id}
 */
export async function saveSubmission(
  formId: string,
  data: Record<string, string>
): Promise<string> {
  if (!db) throw new Error('Firebase not initialised');
  const ref    = collection(db, 'crm_forms', formId, 'submissions');
  const docRef = await addDoc(ref, { ...data, _submittedAt: serverTimestamp() });
  return docRef.id;
}

/**
 * Listen for new submissions on a form in real time.
 * Returns an unsubscribe function.
 */
export function listenToSubmissions(
  formId: string,
  onNew: (data: Record<string, string>, docId: string) => void
): () => void {
  if (!db) return () => {};
  const ref = collection(db, 'crm_forms', formId, 'submissions');
  const q   = query(ref, orderBy('_submittedAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const raw: Record<string, string> = {};
        Object.entries(change.doc.data()).forEach(([k, v]) => {
          if (k !== '_submittedAt') raw[k] = String(v ?? '');
        });
        onNew(raw, change.doc.id);
      }
    });
  });
}
