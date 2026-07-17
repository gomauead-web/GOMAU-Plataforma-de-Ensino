import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

export function useSessionTelemetry() {
  const { user } = useAuth();
  const sessionStartTime = useRef<number>(Date.now());
  const accumulatedTime = useRef<number>(0);

  useEffect(() => {
    if (!user || user.email === 'gomau.ead@gmail.com') return;

    // Popula o cache de datas ao carregar a página para garantir sincronia precisa de dispositivos diferentes
    const initTelemetryCache = async () => {
      try {
        const metricsRef = doc(db, 'userMetrics', user.uid);
        const snap = await getDoc(metricsRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.lastActiveDate) {
            localStorage.setItem(`lastSyncDayKey_${user.uid}`, data.lastActiveDate);
          }
          if (data.lastActiveWeek) {
            localStorage.setItem(`lastSyncWeekKey_${user.uid}`, data.lastActiveWeek);
          }
          if (data.lastActiveMonth) {
            localStorage.setItem(`lastSyncMonthKey_${user.uid}`, data.lastActiveMonth);
          }
        }
      } catch (err) {
        console.error("Error initializing telemetry cache:", err);
      }
    };

    const localDay = localStorage.getItem(`lastSyncDayKey_${user.uid}`);
    if (!localDay) {
      initTelemetryCache();
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.email === 'gomau.ead@gmail.com') return;

    const syncTelemetry = async (timeToSyncInSeconds: number) => {
      if (timeToSyncInSeconds <= 0) return;

      try {
        const metricsRef = doc(db, 'userMetrics', user.uid);

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const monthKey = `${yyyy}-${mm}`;
        
        const dd = String(now.getDate()).padStart(2, '0');
        const dayKey = `${yyyy}-${mm}-${dd}`;
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Domingo como início
        const wYyyy = startOfWeek.getFullYear();
        const wMm = String(startOfWeek.getMonth() + 1).padStart(2, '0');
        const wDd = String(startOfWeek.getDate()).padStart(2, '0');
        const weekKey = `${wYyyy}-${wMm}-${wDd}`;

        const lastDayKey = localStorage.getItem(`lastSyncDayKey_${user.uid}`);
        const lastWeekKey = localStorage.getItem(`lastSyncWeekKey_${user.uid}`);
        const lastMonthKey = localStorage.getItem(`lastSyncMonthKey_${user.uid}`);

        const isNewDay = lastDayKey !== dayKey;
        const isNewWeek = lastWeekKey !== weekKey;
        const isNewMonth = lastMonthKey !== monthKey;

        const updateData: any = {
          uid: user.uid,
          nome: user.nome || 'Desconhecido',
          cim: user.cim || '',
          email: user.email || '',
          totalStudyTime: increment(timeToSyncInSeconds),
          lastActive: serverTimestamp(),
          lastActiveDate: dayKey,
          lastActiveWeek: weekKey,
          lastActiveMonth: monthKey,
        };

        if (isNewDay) {
          updateData.todayStudyTime = timeToSyncInSeconds;
        } else {
          updateData.todayStudyTime = increment(timeToSyncInSeconds);
        }

        if (isNewWeek) {
          updateData.currentWeekStudyTime = timeToSyncInSeconds;
        } else {
          updateData.currentWeekStudyTime = increment(timeToSyncInSeconds);
        }

        if (isNewMonth) {
          updateData.currentMonthStudyTime = timeToSyncInSeconds;
        } else {
          updateData.currentMonthStudyTime = increment(timeToSyncInSeconds);
        }

        // Mantém mapa mensal legado se útil
        updateData[`monthlyStudyTime.${monthKey}`] = increment(timeToSyncInSeconds);

        await setDoc(metricsRef, updateData, { merge: true });

        // Salva estados atualizados no localStorage
        localStorage.setItem(`lastSyncDayKey_${user.uid}`, dayKey);
        localStorage.setItem(`lastSyncWeekKey_${user.uid}`, weekKey);
        localStorage.setItem(`lastSyncMonthKey_${user.uid}`, monthKey);

      } catch (err) {
        console.error("Error syncing telemetry:", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const timeSpent = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        if (timeSpent > 0) {
          accumulatedTime.current += timeSpent;
        }
        
        if (accumulatedTime.current >= 10) {
          syncTelemetry(accumulatedTime.current);
          accumulatedTime.current = 0;
        }
      } else {
        sessionStartTime.current = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      const timeSpent = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      if (timeSpent > 0) {
        accumulatedTime.current += timeSpent;
      }
      if (accumulatedTime.current >= 5) {
        syncTelemetry(accumulatedTime.current);
      }
    };

    // Sincronização periódica a cada 2 minutos se ativo
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const timeSpent = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        if (timeSpent > 0) {
          accumulatedTime.current += timeSpent;
          sessionStartTime.current = Date.now();
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
