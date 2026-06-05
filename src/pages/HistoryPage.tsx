import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { Calendar, Clock, Star, Landmark, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface HistoryEvent {
  id: string;
  data: string;
  titulo: string;
  descricao: string;
  tipo: 'marco' | 'atividade' | 'reuniao';
  grau?: string;
  detalhes?: string;
}

export function HistoryPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'history'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoryEvent));
        
        // Fix sort
        fetched.sort((a, b) => {
           // Fallback to timestamp if available
           const timeA = (a as any).criadoEm?.toMillis ? (a as any).criadoEm.toMillis() : 0;
           const timeB = (b as any).criadoEm?.toMillis ? (b as any).criadoEm.toMillis() : 0;
           if (timeA && timeB) return timeB - timeA;
           
           // parse dd/mm/yyyy
           const partsA = a.data?.split('/') || ['01','01','2000'];
           const partsB = b.data?.split('/') || ['01','01','2000'];
           const dateA = new Date(`${partsA[2]}-${partsA[1]}-${partsA[0]}T${(a as any).hora || '00:00'}:00`).getTime();
           const dateB = new Date(`${partsB[2]}-${partsB[1]}-${partsB[0]}T${(b as any).hora || '00:00'}:00`).getTime();
           return dateB - dateA;
        });
        
        // If empty, let's create a few generic events for the user based on creation date or defaults so it's not totally empty if they just joined
        if (fetched.length === 0) {
           const initialDate = user.createdAt ? new Date(user.createdAt.toMillis()).toLocaleDateString('pt-br') : new Date().toLocaleDateString('pt-br');
           setEvents([
              { id: '1', data: initialDate, titulo: `Iniciado no grau de Aprendiz`, descricao: 'Início da jornada maçônica na Loja ' + user.loja, tipo: 'marco', detalhes: 'Você foi iniciado e agora inicia sua jornada na Ordem Maçônica.' }
           ]);
        } else {
           setEvents(fetched);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'history');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
       case 'marco': return <Star size={16} className="text-[#D4AF37]" />;
       case 'reuniao': return <Landmark size={16} className="text-[#D4AF37]" />;
       default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
        <div>
           <h1 className="text-3xl font-semibold text-[#D4AF37] mb-2">Sua Linha do Tempo</h1>
           <p className="text-gray-400">Acompanhe todos os marcos e progressos de sua jornada maçônica.</p>
        </div>
      </header>

      {/* Timeline */}
      {loading ? (
         <div className="text-[#D4AF37] py-8 text-center">Carregando histórico...</div>
      ) : (
         <div className="relative pl-4 md:pl-8">
            {/* Vertical Line */}
            <div className="absolute left-10 md:left-14 top-4 bottom-4 w-px bg-gradient-to-b from-[#D4AF37] via-[#1e293b] to-transparent"></div>

            <div className="flex flex-col gap-6">
               {events.map((event, index) => (
                  <div key={event.id} className="relative flex items-start group">
                     {/* Timeline Node */}
                     <div className="absolute -left-6 md:-left-4 z-10">
                        <div className={cn(
                           "w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#0B0B0C] shadow-lg",
                           event.tipo === 'marco' ? 'bg-[#1e293b] ring-1 ring-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-[#0F172A]'
                        )}>
                           {getIcon(event.tipo)}
                        </div>
                     </div>

                     {/* Event Content */}
                     <div className="ml-16 w-full cursor-pointer" onClick={() => toggleExpand(event.id)}>
                        <div className={cn(
                           "bg-[#0A0E1A] border rounded-xl transition-all duration-300",
                           expandedId === event.id ? 'border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'border-[#1e293b] hover:border-[#1e293b]/80'
                        )}>
                           <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                 <div className="flex items-center gap-3 mb-1">
                                    <span className="text-sm font-medium text-[#D4AF37]">{event.data}</span>
                                    {event.tipo === 'marco' && (
                                       <span className="text-[10px] uppercase font-bold tracking-widest text-black bg-[#D4AF37] px-2 py-0.5 rounded">Marco</span>
                                    )}
                                 </div>
                                 <h3 className="text-lg font-semibold text-gray-200 font-sans">{event.titulo}</h3>
                                 <p className="text-sm text-gray-400 mt-1">{event.descricao}</p>
                              </div>
                              <div className="text-gray-500 hidden md:block">
                                 {expandedId === event.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              </div>
                           </div>

                           {/* Expanded Details */}
                           {expandedId === event.id && event.detalhes && (
                              <div className="px-5 pb-5 pt-2 border-t border-[#1e293b]/50 mt-2 text-sm text-gray-300 leading-relaxed bg-[#0F172A]/30 rounded-b-xl animate-in slide-in-from-top-2">
                                 {event.detalhes}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
}
