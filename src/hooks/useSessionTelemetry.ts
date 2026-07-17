import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';

export function useSessionTelemetry() {
  const { user } = useAuth();
  const sessionStartTime = useRef<number>(Date.now());
  const accumulatedTime = useRef<number>(0);
  const lastSyncTime = useRef<number>(Date.now());

  useEffect(() => {
    if (!user) return;

    const syncTelemetry = async (timeToSyncInSeconds: number) => {
      if (timeToSyncInSeconds <= 0) return;

      try {
        const metricsRef = doc(db, 'userMetrics', user.uid);

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const monthKey = `${yyyy}-${mm}`;

        await setDoc(metricsRef, {
          uid: user.uid,
          nome: user.nome || 'Desconhecido',
          cim: user.cim || '',
          email: user.email || '',
          totalStudyTime: increment(timeToSyncInSeconds),
          monthlyStudyTime: {
            [monthKey]: increment(timeToSyncInSeconds)
          },
          lastActive: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Error syncing telemetry:", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Calculate time since last active state
        const timeSpent = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        if (timeSpent > 0) {
          accumulatedTime.current += timeSpent;
        }
        
        // Sync to Firestore if there's enough accumulated time (e.g. > 10 seconds)
        if (accumulatedTime.current >= 10) {
          syncTelemetry(accumulatedTime.current);
          accumulatedTime.current = 0;
        }
      } else {
        // Reset start time when coming back
        sessionStartTime.current = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      const timeSpent = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      if (timeSpent > 0) {
        accumulatedTime.current += timeSpent;
      }
      if (accumulatedTime.current >= 5) { // Lower threshold for unload
        syncTelemetry(accumulatedTime.current);
      }
    };

    // Periodic sync every 2 minutes while active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const timeSpent = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        if (timeSpent > 0) {
          accumulatedTime.current += timeSpent;
          sessionStartTime.current = Date.now(); // Reset for next interval
        }
      }

      if (accumulatedTime.current >= 60) {
        syncTelemetry(accumulatedTime.current);
        accumulatedTime.current = 0;
      }
    }, 120000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
      
      // Perform final sync on unmount if needed
      if (document.visibilityState === 'visible') {
        const timeSpent = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        if (timeSpent > 0) {
          accumulatedTime.current += timeSpent;
        }
      }
      if (accumulatedTime.current >= 5) {
        syncTelemetry(accumulatedTime.current);
      }
    };
  }, [user]);
}
