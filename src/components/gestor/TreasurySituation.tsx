import React, { useState, useMemo } from 'react';
import { CheckCircle, AlertCircle, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export function TreasurySituation({ members, payments }: { members: any[], payments: any[] }) {
   const [search, setSearch] = useState('');
   const [filterMode, setFilterMode] = useState<'todos' | 'em_dia' | 'pendente'>('todos');

   const situationData = useMemo(() => {
      return members.map(m => {
         const userPayments = payments.filter(p => p.userId === m.id);
         const pendentes = userPayments.filter(p => p.status === 'em_analise' || p.status === 'rejeitado' || !p.status || p.status === 'pendente');
         
         return {
            ...m,
            pendentes,
            isEmDia: pendentes.length === 0,
         };
      });
   }, [members, payments]);

   const filteredSituation = situationData.filter(m => {
      const matchesSearch = (m.nome || '').toLowerCase().includes(search.toLowerCase()) || 
                            (m.cim || '').toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;

      if (filterMode === 'em_dia') return m.isEmDia;
      if (filterMode === 'pendente') return !m.isEmDia;
      
      return true;
   });

   return (
      <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-xl p-6 shadow-xl font-sans text-left mt-8">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-[#D4AF37] font-medium flex items-center gap-2 text-base tracking-wide uppercase">
               Situação dos Obreiros (Em Dia vs Pendentes)
            </h3>
         </div>

         <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
               <input 
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar por Irmão ou CIM..."
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
               />
            </div>
            
            <div className="flex gap-2 bg-[#1e293b]/50 p-1 rounded-lg border border-[#334155] shrink-0">
               <button 
                  onClick={() => setFilterMode('todos')}
                  className={cn("px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors", filterMode === 'todos' ? "bg-[#334155] text-white" : "text-gray-400 hover:text-gray-200")}
               >
                  Todos
               </button>
               <button 
                  onClick={() => setFilterMode('em_dia')}
                  className={cn("px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors", filterMode === 'em_dia' ? "bg-green-500/20 text-green-500" : "text-gray-400 hover:text-green-500")}
               >
                  Em Dia
               </button>
               <button 
                  onClick={() => setFilterMode('pendente')}
                  className={cn("px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors", filterMode === 'pendente' ? "bg-red-500/20 text-red-500" : "text-gray-400 hover:text-red-500")}
               >
                  Pendentes
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 border border-[#1e293b] p-2 rounded-xl bg-[#0F172A] max-h-[400px] overflow-y-auto no-scrollbar">
            {filteredSituation.length === 0 ? (
               <div className="col-span-full py-8 text-center border border-dashed border-[#1e293b] rounded-lg">
                  <p className="text-gray-500 text-sm">Nenhum irmão encontrado com esses filtros.</p>
               </div>
            ) : (
               filteredSituation.map(m => (
                  <div key={m.id} className={cn("p-4 rounded-lg border flex flex-col justify-between transition-colors", m.isEmDia ? "bg-[#0A0E1A] border-[#1e293b] hover:border-green-500/30" : "bg-red-500/5 border-red-500/20 hover:border-red-500/50")}>
                     <div>
                        <div className="flex justify-between items-start mb-2 gap-2">
                           <div className="font-semibold text-white text-sm truncate">{m.nome}</div>
                           {m.isEmDia ? (
                              <CheckCircle className="text-green-500 shrink-0" size={18} />
                           ) : (
                              <AlertCircle className="text-red-500 shrink-0" size={18} />
                           )}
                        </div>
                        <div className="text-xs text-gray-400 mb-3 font-mono">CIM: {m.cim || 'N/A'}</div>
                     </div>
                     
                     <div className="mt-auto">
                        {m.isEmDia ? (
                           <div className="text-[10px] text-green-500 bg-green-500/10 px-3 py-1.5 rounded inline-block font-bold uppercase tracking-wider">
                              Status: OK (Em Dia)
                           </div>
                        ) : (
                           <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Lançamentos Abertos:</span>
                              <div className="flex flex-wrap gap-1.5">
                                 {m.pendentes.map((p: any) => (
                                    <span key={p.id} className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/20 font-mono">
                                       {p.mesRef}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>
   );
}
