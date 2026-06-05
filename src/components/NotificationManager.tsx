import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { Bell, Info, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function NotificationManager() {
  const { user } = useAuth();
  const [activeNotification, setActiveNotification] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    // Listener para eventos que o usuário deve ver (baseado no grau)
    const q = query(
      collection(db, 'events'),
      where('status', '==', 'ativo')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const now = new Date();
        const oneDayFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const readNotifications = userDoc.data()?.readNotifications || [];
        const readReminders = userDoc.data()?.readReminders || [];

        for (const change of snapshot.docChanges()) {
          const event = { id: change.doc.id, ...change.doc.data() } as any;
          
          // Verifica se o usuário tem o grau necessário
          const graus = ['Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'];
          const userGrauIndex = graus.indexOf(user.grau || 'Aprendiz');
          const eventGrauIndex = graus.indexOf(event.grauMinimo);

          if (userGrauIndex < eventGrauIndex) continue;

          const eventDate = new Date(`${event.data}T${event.hora || '00:00'}`);

          // Só processa notificações para eventos FUTUROS ou que ocorrem HOJE
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (eventDate < today) continue;

          // 1. Notificação de Novo Evento (se criado recentemente e não lido)
          if (change.type === 'added' && !readNotifications.includes(event.id)) {
            setActiveNotification({
              type: 'new',
              id: event.id,
              title: 'Novo Evento Agendado',
              message: `Um novo evento "${event.titulo}" foi marcado para o dia ${new Date(event.data).toLocaleDateString('pt-br')}.`,
              icon: <Bell className="text-[#D4AF37]" />
            });
            return; // Mostra uma por vez
          }

          // 2. Lembrete de 24h
          if (eventDate > now && eventDate <= oneDayFromNow && !readReminders.includes(event.id)) {
            setActiveNotification({
              type: 'reminder',
              id: event.id,
              title: 'Lembrete: Sessão em 24h',
              message: `O evento "${event.titulo}" ocorrerá em menos de 24h. Caso não consiga comparecer, por favor, comunique sua ausência à secretaria.`,
              icon: <AlertTriangle className="text-amber-500" />
            });
            return;
          }
        }
      } catch (err: any) {
         if (err?.code === 'resource-exhausted') {
            console.warn("Cota excedida no handler de notificação.");
         }
      }
    }, (err: any) => {
       if (err?.code === 'resource-exhausted') {
          console.warn("Cota do Firestore atingida nas notificações.");
       }
    });

    return () => unsubscribe();
  }, [user]);

  const handleAcknowledge = async () => {
    if (!user || !activeNotification) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const field = activeNotification.type === 'new' ? 'readNotifications' : 'readReminders';
      
      await updateDoc(userRef, {
        [field]: arrayUnion(activeNotification.id)
      });
      
      setActiveNotification(null);
    } catch (err) {
      console.error("Erro ao confirmar notificação:", err);
    }
  };

  return (
    <AnimatePresence>
      {activeNotification && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-[#0F172A] border border-[#D4AF37]/40 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-[#1e293b] p-3 rounded-xl border border-[#D4AF37]/20">
                  {activeNotification.icon}
                </div>
                <div>
                  <h3 className="text-[#D4AF37] font-bold text-lg leading-tight">{activeNotification.title}</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-sans">Notificação Obrigatória</p>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed mb-8 bg-[#1e293b]/30 p-4 rounded-lg border border-[#1e293b]">
                {activeNotification.message}
              </p>

              <button
                onClick={handleAcknowledge}
                className="w-full bg-[#D4AF37] hover:bg-[#C9A227] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#D4AF37]/10"
              >
                <CheckCircle size={20} />
                Compreendido (OK)
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
