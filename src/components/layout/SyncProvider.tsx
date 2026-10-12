'use client';
import { useEffect } from 'react';
import { initFirebase, getDefaultConfig } from '@/lib/firebase';
import { useFirebaseLeads } from '@/hooks/useFirebaseLeads';
import { useCRMStore } from '@/lib/store';

/**
 * Mounts inside the dashboard layout.
 * - Auto-connects to the hardcoded Firebase project on first load.
 * - Starts real-time Firestore listeners for all active CRM forms.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { setFirebaseConfig, setFirebaseConnected, firebaseConfig } = useCRMStore();

  // ── Auto-init Firebase with the hardcoded config ────────────────────────
  useEffect(() => {
    try {
      const cfg = getDefaultConfig();
      initFirebase(cfg);
      setFirebaseConfig(cfg);
      setFirebaseConnected(true);
    } catch (err) {
      console.error('[SyncProvider] Firebase init failed', err);
      setFirebaseConnected(false);
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Browser notification permission ────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // ── Real-time Firestore listeners ───────────────────────────────────────
  // (activated after firebaseConfig is set in the store)
  return <FirebaseListenerWrapper>{children}</FirebaseListenerWrapper>;
}

/** Separate component so the hook re-runs when firebaseConfig is set */
function FirebaseListenerWrapper({ children }: { children: React.ReactNode }) {
  useFirebaseLeads();
  return <>{children}</>;
}
