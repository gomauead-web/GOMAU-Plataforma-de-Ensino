import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { Calendar as CalendarIcon, Clock, MapPin, Bell, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const GRAUS = ['Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'];

interface AppEvent {
  id: string;
  titulo: string;
  data: string;
  hora: string;
  local: string;
  descricao: string;
  grauMinimo: string;
  status?: string;
}

export function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'events'),
          orderBy('data', 'asc')
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEvent));
        
        // Filter by user grade
        const userGradeIdx = GRAUS.indexOf(user.grau || 'Aprendiz');
        const accessibleEvents = fetched.filter(evt => {
           const evtGradeIdx = GRAUS.indexOf(evt.grauMinimo || 'Aprendiz');
           return userGradeIdx >= evtGradeIdx;
        });

        setEvents(accessibleEvents);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'events');
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [user]);

  const upcomingEvents = events.filter(evt => new Date(`${evt.data}T${evt.hora || '00:00'}`) >= new Date());
  const pastEvents = events.filter(evt => new Date(`${evt.data}T${evt.hora || '00:00'}`) < new Date());

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
        <div>
           <h1 className="text-3xl font-semibold text-[#D4AF37] mb-2">Calendário de Eventos</h1>
           <p className="text-gray-400">Acompanhe as sessões e eventos programados para o seu grau.</p>
        </div>
        <button 
           onClick={() => setNotifications(!notifications)}
           className={`hidden md:flex items-center gap-2 border px-4 py-2 rounded-lg text-sm transition-colors ${
              notifications ? 'bg-[#0F172A] border-[#1e293b] text-gray-300 hover:border-[#D4AF37]/50' : 'bg-transparent border-[#1e293b] text-gray-500 hover:text-gray-300'
           }`}
        >
           <Bell size={16} className={notifications ? "text-[#D4AF37]" : "text-gray-600"} /> 
           {notifications ? 'Notificações Ativadas' : 'Notificações Desativadas'}
        </button>
      </header>

      {/* Events List */}
      {loading ? (
         <div className="text-[#D4AF37] py-8 text-center">Carregando eventos...</div>
      ) : events.length === 0 ? (
         <div className="text-gray-500 py-12 text-center border border-dashed border-[#1e293b] rounded-xl flex flex-col items-center">
            <CalendarIcon size={48} className="mb-4 text-[#1e293b]" />
            <p>Nenhum evento programado para o seu grau no momento.</p>
         </div>
       ) : (
         <div className="space-y-12">
            {/* Próximos */}
            {upcomingEvents.length > 0 && (
               <section>
                  <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                     Próximos Eventos
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {upcomingEvents.map((evt) => (
                        <div key={evt.id} className={cn(
                           "bg-[#0A0E1A] border rounded-xl overflow-hidden flex flex-col group relative transition-all",
                           evt.status === 'cancelado' ? "border-red-500/50 opacity-80 grayscale" : "border-[#1e293b] hover:border-[#D4AF37]/50"
                        )}>
                           {evt.status !== 'cancelado' && <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#D4AF37] to-[#C9A227]"></div>}
                           
                           <div className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-3">
                                    <div className={cn(
                                       "w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold font-sans shadow-inner",
                                       evt.status === 'cancelado' ? "bg-red-900/20 text-red-500" : "bg-[#1e293b] text-[#D4AF37]"
                                    )}>
                                       <span className="text-xl leading-none">{evt.data.split('-')[2]}</span>
                                       <span className="text-[10px] uppercase font-medium">{new Date(evt.data).toLocaleString('pt-br', { month: 'short' }).replace('.', '')}</span>
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-2">
                                          <h3 className={cn(
                                             "text-xl font-semibold font-sans transition-colors",
                                             evt.status === 'cancelado' ? "text-gray-500 line-through decoration-red-500/50" : "text-gray-200 group-hover:text-[#D4AF37]"
                                          )}>{evt.titulo}</h3>
                                          {evt.status === 'cancelado' && (
                                             <span className="bg-red-900/50 text-red-500 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border border-red-500/30 flex items-center gap-1">
                                                <XCircle size={8} /> Cancelado
                                             </span>
                                          )}
                                       </div>
                                       <span className="text-xs uppercase font-bold tracking-widest text-[#D4AF37]">Grau: {evt.grauMinimo}</span>
                                    </div>
                                 </div>
                              </div>
                              
                              <p className="text-sm text-gray-400 mb-6 line-clamp-2">{evt.descricao}</p>
                              
                              <div className="flex flex-col gap-2 mt-auto border-t border-[#1e293b]/50 pt-4">
                                 <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <Clock size={14} className="text-gray-500" /> {evt.hora}
                                 </div>
                                 <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <MapPin size={14} className="text-gray-500" /> {evt.local}
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
            )}

            {/* Passados */}
            {pastEvents.length > 0 && (
               <section>
                  <h2 className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6 border-b border-[#1e293b] pb-2">
                     Histórico (Realizados)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                     {pastEvents.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((evt) => (
                        <div key={evt.id} className="bg-[#0B0B0C] border border-[#1e293b] rounded-xl overflow-hidden flex flex-col relative group">
                           <div className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-3">
                                    <div className="bg-[#1e293b]/50 text-gray-500 w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold font-sans">
                                       <span className="text-xl leading-none">{evt.data.split('-')[2]}</span>
                                       <span className="text-[10px] uppercase font-medium">{new Date(evt.data).toLocaleString('pt-br', { month: 'short' }).replace('.', '')}</span>
                                    </div>
                                    <div>
                                       <h3 className="text-lg font-semibold text-gray-400 font-sans line-through decoration-[#D4AF37]/30">{evt.titulo}</h3>
                                       <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-green-700 flex items-center gap-1 bg-green-900/10 px-1.5 rounded uppercase">
                                             <CheckCircle size={10} /> Realizado
                                          </span>
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-600">Grau: {evt.grauMinimo}</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              <p className="text-xs text-gray-500 mb-4 line-clamp-1 italic">"{evt.descricao}"</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
            )}
         </div>
       )}
    </div>
  );
}
