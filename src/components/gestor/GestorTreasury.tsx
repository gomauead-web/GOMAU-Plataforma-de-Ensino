import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, updateDoc, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { Settings, Save, CheckCircle, AlertCircle, FileText, Download, Users, Search, PlusCircle, Check, X, CreditCard, Clock, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TreasurySituation } from './TreasurySituation';

export function GestorTreasury() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settings, setSettings] = useState({ pixKey: '', pixName: '', amount: '100.00', instructions: '' });
  const [filterMonth, setFilterMonth] = useState('');
  
  const [evaluatingPayment, setEvaluatingPayment] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Estados para o Lançamento Seletivo/Individual de Mensalidade
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [mSearch, setMSearch] = useState('');
  const [mMonth, setMMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [mAmount, setMAmount] = useState('100.00');
  const [mStatus, setMStatus] = useState('em_analise'); // 'em_analise' = Aguardando Validação, 'aprovado' = Pago
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    // Load config
    const loadSettings = async () => {
      const snap = await getDoc(doc(db, 'configs', 'treasury'));
      if (snap.exists()) {
        const data = snap.data() as any;
        setSettings(data);
        if (data.amount) {
          setMAmount(data.amount);
        }
      }
    };
    loadSettings();

    // Listen to payments
    const q = query(collection(db, 'mensalidades'), orderBy('dataEnvio', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() as any })));
      setLoading(false);
    });

    // Listen to GOMA members
    const qMembers = query(collection(db, 'users'), orderBy('nome', 'asc'));
    const unsubMembers = onSnapshot(qMembers, (snap) => {
      const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      // Deduplicação em tempo real por email
      const seen = new Set();
      const unique: any[] = [];
      const sorted = [...allDocs].sort((a, b) => {
         if (a.uid && !b.uid) return -1;
         if (!a.uid && b.uid) return 1;
         return 0;
      });
      for (const d of sorted) {
         const nameNorm = (d.nome || '').trim();
         const emailNorm = (d.email || '').toLowerCase().trim();
         if (!emailNorm) continue;
         if (!seen.has(emailNorm)) {
            seen.add(emailNorm);
            unique.push(d);
         }
      }
      setMembers(unique);
    });

    return () => {
      unsub();
      unsubMembers();
    };
  }, []);

  const handleLaunchIndividual = async () => {
    if (selectedMembers.length === 0) {
      alert('Por favor, selecione ao menos um irmão para efetuar o lançamento.');
      return;
    }
    setLaunching(true);
    try {
      let count = 0;
      for (const memberId of selectedMembers) {
        const m = members.find(x => x.id === memberId);
        if (!m) continue;
        
        await addDoc(collection(db, 'mensalidades'), {
          uid: m.uid || m.id,
          userName: m.nome || m.email || 'Nobre Irmão',
          userEmail: m.email || '',
          userCim: m.cim || 'N/A',
          mesRef: mMonth,
          valor: mAmount,
          comprovanteUrl: '',
          status: mStatus, // 'aprovado' ou 'em_analise'
          dataEnvio: serverTimestamp(),
          lancadoPorGestor: true
        });
        count++;
      }
      alert(`Mensalidade lançada com sucesso para ${count} irmão(s)!`);
      setSelectedMembers([]);
    } catch (err) {
      console.error(err);
      alert('Erro ao realizar o lançamento manual.');
    } finally {
      setLaunching(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'configs', 'treasury'), settings);
      alert('Configurações salvas!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleEvaluate = async (approved: boolean) => {
    if (!evaluatingPayment) return;
    try {
      // 1. Atualiza o status financeiro do lançamento
      await updateDoc(doc(db, 'mensalidades', evaluatingPayment.id), {
        status: approved ? 'aprovado' : 'rejeitado',
        comentarioGestor: approved ? null : rejectReason,
        dataAnalise: serverTimestamp()
      });

      // 2. Sincroniza a liberação dos itens da biblioteca ou pacote
      if (approved && evaluatingPayment.uid) {
        const userRef = doc(db, 'users', evaluatingPayment.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as any;

          if (evaluatingPayment.tipo === 'livro' && evaluatingPayment.itemId) {
            const currentUnlocked = userData.unlockedBooks || [];
            if (!currentUnlocked.includes(evaluatingPayment.itemId)) {
              await updateDoc(userRef, {
                unlockedBooks: [...currentUnlocked, evaluatingPayment.itemId]
              });
            }
          } else if (evaluatingPayment.tipo === 'assinatura') {
            await updateDoc(userRef, {
              hasPremiumLibrary: true,
              premiumPlanType: evaluatingPayment.mesRef || 'Assinatura',
              premiumPlanUnlockedAt: serverTimestamp()
            });
          }
        }
      }

      setEvaluatingPayment(null);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      alert('Erro ao processar o pagamento.');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
       await deleteDoc(doc(db, 'mensalidades', paymentId));
    } catch (error) {
       console.error('Error deleting payment:', error);
       alert('Erro ao excluir o registro.');
    }
  };

  const filteredPayments = payments.filter(p => !filterMonth || p.mesRef === filterMonth);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium text-gray-200">Gestão de Tesouraria</h2>
          <p className="text-xs text-gray-500">Administração de mensalidades e recebimentos via PIX</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Lançar Mensalidade Individual/Seleta */}
           <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-xl p-6 shadow-xl font-sans text-left flex flex-col justify-between">
              <div>
                 <h3 className="text-[#D4AF37] font-medium mb-4 flex items-center gap-2 text-base tracking-wide uppercase">
                    <PlusCircle size={18} /> {mStatus === 'em_analise' ? 'Lançar Nova Fatura' : 'Registrar Baixa Manual'}
                 </h3>
                 <p className="text-xs text-gray-500 mb-6 font-sans leading-relaxed">
                    {mStatus === 'em_analise' 
                       ? 'Emita solicitações de pagamento diretamente para um ou múltiplos irmãos selecionados. Eles verão o débito pendente na área da tesouraria.'
                       : 'Registre um pagamento já realizado por fora (em dinheiro, depósito direto, etc) para dar baixa imediata na tesouraria dos irmãos.'}
                 </p>

                 <div className="font-sans mb-6">
                    <label className="block text-gray-400 mb-2 text-xs uppercase font-medium">Modo de Operação</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                       <label className={cn("flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all", mStatus === 'em_analise' ? "bg-[#1e293b] border-[#D4AF37]" : "bg-[#0A0E1A] border-[#1e293b] hover:border-gray-600")}>
                          <input 
                             type="radio" 
                             name="mStatus" 
                             value="em_analise" 
                             checked={mStatus === 'em_analise'} 
                             onChange={() => setMStatus('em_analise')}
                             className="accent-[#D4AF37] w-4 h-4"
                          />
                          <span className="text-xs text-gray-300">Nova Cobrança (Pendente)</span>
                       </label>
                       <label className={cn("flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all", mStatus === 'aprovado' ? "bg-[#1e293b] border-green-600/70" : "bg-[#0A0E1A] border-[#1e293b] hover:border-gray-600")}>
                          <input 
                             type="radio" 
                             name="mStatus" 
                             value="aprovado" 
                             checked={mStatus === 'aprovado'} 
                             onChange={() => setMStatus('aprovado')}
                             className="accent-green-500 w-4 h-4"
                          />
                          <span className="text-xs text-gray-300">Dar Baixa (Já Pago)</span>
                       </label>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-sans mb-6">
                    <div>
                       <label className="block text-gray-400 mb-1.5 text-xs uppercase font-medium">Competência a {mStatus === 'em_analise' ? 'Cobrar' : 'Baixar'}</label>
                       <input 
                          type="month"
                          value={mMonth}
                          onChange={e => setMMonth(e.target.value)}
                          className="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37] transition-colors"
                       />
                    </div>
                    <div>
                       <label className="block text-gray-400 mb-1.5 text-xs uppercase font-medium">Valor (R$)</label>
                       <input 
                          type="text"
                          value={mAmount}
                          onChange={e => setMAmount(e.target.value)}
                          className="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37] transition-colors"
                          placeholder="100.00"
                       />
                    </div>
                 </div>

                 {/* Seleção dos obreiros */}
                 <div className="font-sans">
                    <div className="flex justify-between items-center mb-2">
                       <label className="block text-gray-400 text-xs uppercase font-medium">Selecionar Obreiros</label>
                       <div className="flex gap-2">
                          <button onClick={() => setSelectedMembers(members.map(x => x.id))} className="text-[10px] text-[#D4AF37] hover:underline uppercase font-bold">Todos</button>
                          <button onClick={() => setSelectedMembers([])} className="text-[10px] text-gray-500 hover:underline uppercase font-bold">Nenhum</button>
                       </div>
                    </div>
                    <div className="relative mb-3">
                       <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                       <input 
                          type="text"
                          value={mSearch}
                          onChange={e => setMSearch(e.target.value)}
                          placeholder="Pesquisar..."
                          className="w-full bg-[#1e293b] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                       />
                    </div>
                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar border border-[#1e293b] rounded-lg p-2 bg-[#0F172A]">
                       {(() => {
                          const filtered = members.filter(m => {
                             const nameMatches = (m.nome || '').toLowerCase().includes(mSearch.toLowerCase());
                             const cimMatches = (m.cim || '').toLowerCase().includes(mSearch.toLowerCase());
                             return nameMatches || cimMatches;
                          });

                          if (filtered.length === 0) return <p className="text-xs text-gray-500 italic py-4 text-center">Nenhum obreiro encontrado.</p>;

                          return filtered.map(m => {
                             const isChecked = selectedMembers.includes(m.id);
                             return (
                                <label key={m.id} className={cn("flex justify-between items-center px-3 py-2.5 rounded-lg border cursor-pointer transition-all", isChecked ? "bg-[#1e293b] border-[#D4AF37] shadow-sm" : "bg-[#0A0E1A] border-transparent hover:bg-[#1e293b]/50")}>
                                   <div className="flex items-center gap-3 min-w-0">
                                      <input 
                                         type="checkbox"
                                         checked={isChecked}
                                         onChange={() => {
                                            if (isChecked) setSelectedMembers(selectedMembers.filter(id => id !== m.id));
                                            else setSelectedMembers([...selectedMembers, m.id]);
                                         }}
                                         className="accent-[#D4AF37] w-4 h-4 rounded cursor-pointer"
                                      />
                                      <div className="truncate">
                                         <p className="text-xs text-gray-200 font-medium truncate">{m.nome}</p>
                                         <p className="text-[10px] text-gray-500 truncate">CIM: {m.cim || 'N/A'}</p>
                                      </div>
                                   </div>
                                </label>
                             );
                          });
                       })()}
                    </div>
                 </div>
              </div>

              <button 
                 type="button"
                 onClick={handleLaunchIndividual}
                 disabled={launching || selectedMembers.length === 0}
                 className={cn(
                    "mt-6 w-full text-black text-sm font-bold py-3.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wider flex items-center justify-center gap-2 font-sans shadow-lg",
                    mStatus === 'em_analise' ? "bg-[#D4AF37] hover:bg-[#C5A028]" : "bg-green-500 hover:bg-green-600"
                 )}
              >
                 {launching ? (
                    <>Processando...</>
                 ) : (
                    <>
                       <PlusCircle size={16} /> 
                       {mStatus === 'em_analise' 
                          ? `Emitir Fatura (${selectedMembers.length})` 
                          : `Registrar Pagamento (${selectedMembers.length})`}
                    </>
                 )}
              </button>
           </div>

           {/* Configurações PIX */}
           <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-xl p-6 flex flex-col justify-between shadow-xl">
             <div>
                <h3 className="text-gray-400 font-medium mb-6 flex items-center gap-2 text-sm tracking-widest uppercase">
                  <Settings size={16} /> Dados para Pagamento
                </h3>
                <div className="space-y-4 text-sm font-sans">
                   <div>
                      <label className="block text-gray-500 mb-1.5 text-xs font-semibold uppercase">Chave PIX Recebedora</label>
                      <textarea 
                         value={settings.pixKey} 
                         onChange={e => setSettings({...settings, pixKey: e.target.value})}
                         className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-white min-h-[60px] focus:border-[#D4AF37] transition-all no-scrollbar"
                         placeholder="Chave PIX ou código Copia e Cola..."
                      />
                   </div>
                   <div>
                      <label className="block text-gray-500 mb-1.5 text-xs font-semibold uppercase">Nome do Beneficiário</label>
                      <input 
                         type="text" 
                         value={settings.pixName} 
                         onChange={e => setSettings({...settings, pixName: e.target.value})}
                         className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-white focus:border-[#D4AF37] transition-all"
                         placeholder="Ex: Faculdade Maçônica"
                      />
                   </div>
                   <div>
                      <label className="block text-gray-500 mb-1.5 text-xs font-semibold uppercase">Valor Padrão (R$)</label>
                      <input 
                         type="text" 
                         value={settings.amount} 
                         onChange={e => setSettings({...settings, amount: e.target.value})}
                         className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-white focus:border-[#D4AF37] transition-all"
                      />
                   </div>
                   <div>
                      <label className="block text-gray-500 mb-1.5 text-xs font-semibold uppercase">Instruções aos Membros</label>
                      <textarea 
                         value={settings.instructions} 
                         onChange={e => setSettings({...settings, instructions: e.target.value})}
                         className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-white min-h-[80px] focus:border-[#D4AF37] transition-all no-scrollbar"
                         placeholder="Vencimentos e regras de atraso..."
                      />
                   </div>
                </div>
             </div>
             <button 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-gray-800 text-white border border-gray-600 font-medium py-3.5 rounded-lg hover:bg-gray-700 transition-colors uppercase tracking-wider text-xs"
             >
                {savingSettings ? 'Salvando...' : <><Save size={16} /> Salvar Parâmetros</>}
             </button>
           </div>

        </div>

        {/* Gestão de Comprovantes */}
        <div className="md:col-span-3 bg-[#0A0E1A] border border-[#1e293b] rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-[#D4AF37] font-medium flex items-center gap-2 text-base tracking-wide uppercase">
               <FileText size={18} /> Histórico de Confirmações
             </h3>
             <input 
                type="month" 
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="bg-[#1e293b] border border-[#334155] rounded px-3 py-1.5 text-white text-xs font-sans focus:outline-none focus:border-[#D4AF37]"
             />
          </div>

          <div className="space-y-3">
             {loading ? (
                <p className="text-gray-500 text-sm">Carregando histórico de pagamentos...</p>
             ) : filteredPayments.length === 0 ? (
                <div className="text-center py-12 border border-[#1e293b] border-dashed rounded-lg bg-[#0A0E1A]">
                   <FileText className="mx-auto text-gray-700 mb-2" size={32} />
                   <p className="text-gray-500 text-sm font-sans italic">Nenhum registro de pagamento para este período.</p>
                </div>
             ) : (
                filteredPayments.map(p => (
                   <div key={p.id} className="bg-[#0F172A] border border-[#1e293b] p-4 rounded-lg flex flex-col sm:flex-row justify-between gap-4 hover:border-[#D4AF37]/30 transition-all">
                      <div className="flex-1 font-sans">
                         <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-semibold text-white text-sm">{p.userName || p.userEmail}</span>
                            <span className="text-[10px] text-gray-400 px-2 py-0.5 rounded bg-[#1e293b]/70 font-mono">Mês: {p.mesRef}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                               p.status === 'aprovado' 
                                  ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                  : p.status === 'rejeitado' 
                                     ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                                     : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse'
                            }`}>
                               {p.status === 'aprovado' ? 'Pago' : p.status === 'rejeitado' ? 'Recusado' : 'Aguardando Validação'}{p.tipo && ` (${p.tipo === 'livro' ? 'Livro' : p.tipo === 'assinatura' ? 'Assinatura' : 'Mensalidade'})`}
                            </span>
                         </div>
                         <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>CIM: <strong className="text-[#D4AF37] font-mono">{p.userCim || 'N/A'}</strong></span>
                            <span>Valor: <strong>R$ {p.valor}</strong></span>
                            <span>Notificado em: <strong>{p.dataEnvio?.toDate ? p.dataEnvio.toDate().toLocaleDateString('pt-BR') : ''}</strong>{p.remetentePix && ` • Pix por: ${p.remetentePix}`}</span>
                         </div>
                      </div>

                      <div className="flex flex-row items-center gap-2 shrink-0">
                         {p.comprovanteUrl ? (
                            <a href={p.comprovanteUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 flex items-center gap-1 bg-[#1e293b] border border-[#334155] rounded text-white text-xs hover:bg-[#334155] w-full sm:w-auto justify-center font-sans">
                               <Download size={14} /> Ver Anexo
                            </a>
                         ) : (
                            <span className="text-[10px] text-gray-500 bg-black/40 px-2.5 py-1.5 rounded border border-[#1e293b] font-sans italic">
                               Confirmação Direta
                            </span>
                         )}
                         {p.status === 'em_analise' && (
                            <button onClick={() => setEvaluatingPayment(p)} className="px-3 py-1.5 bg-[#D4AF37] text-black text-xs font-bold rounded hover:bg-[#C5A028] w-full sm:w-auto transition-colors font-sans uppercase tracking-wider">
                               Validar
                            </button>
                         )}
                         <button onClick={() => handleDeletePayment(p.id)} className="p-1.5 border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/20 rounded transition-colors" title="Excluir Registro Permanente">
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </div>
                ))
             )}
          </div>
        </div>

      </div>

      <TreasurySituation members={members} payments={payments} />

      {/* Modal de Avaliação */}
      {evaluatingPayment && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0A0E1A] border-2 border-[#D4AF37]/30 rounded-xl p-6 max-w-md w-full shadow-2xl font-sans text-left">
               <h3 className="text-lg font-bold text-[#D4AF37] mb-4 uppercase tracking-wider">Validar Trânsito de Mensalidade</h3>
               
               <div className="bg-[#0F172A] p-4 rounded-lg border border-[#1e293b] mb-4 text-xs space-y-2 leading-relaxed">
                  <p className="text-gray-400">
                     O obreiro notificou o pagamento. Confirme as informações antes de dar a baixa no sistema:
                  </p>
                  <div className="border-t border-[#1e293b] pt-2 mt-2 text-sm text-white space-y-1">
                     <div>Membro: <strong>{evaluatingPayment.userName || evaluatingPayment.userEmail}</strong></div>
                     <div>CIM: <strong className="text-[#D4AF37]">{evaluatingPayment.userCim || 'N/A'}</strong></div>
                     <div>Referência/Item: <strong>{evaluatingPayment.mesRef}</strong></div>
                     {evaluatingPayment.tipo && (
                        <div>Tipo de Lançamento: <strong className="text-indigo-400 capitalize">{evaluatingPayment.tipo === 'livro' ? 'Livro / Curso' : evaluatingPayment.tipo === 'assinatura' ? 'Assinatura Biblioteca' : 'Mensalidade Geral'}</strong></div>
                     )}
                     <div>Valor a receber: <strong>R$ {evaluatingPayment.valor}</strong></div>
                     {evaluatingPayment.remetentePix && (
                        <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-2 rounded mt-2 text-xs text-gray-200">
                           Titular Pix Declarado: <span className="text-[#D4AF37] font-bold font-mono">{evaluatingPayment.remetentePix}</span>
                        </div>
                     )}
                  </div>
               </div>

               <div className="mb-6">
                  <label className="block text-gray-400 text-xs mb-2 uppercase font-medium">Motivo da Rejeição (Apenas se recusar)</label>
                  <textarea 
                     value={rejectReason}
                     onChange={e => setRejectReason(e.target.value)}
                     className="w-full h-20 bg-[#0F172A] border border-[#1e293b] rounded px-3 py-2 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                     placeholder="Ex: Valor não recebido em conta, dados de CIM incorretos..."
                  />
               </div>

               <div className="flex justify-end gap-3 font-sans">
                  <button onClick={() => setEvaluatingPayment(null)} className="px-3 py-2 rounded text-xs text-gray-400 hover:text-white hover:bg-[#1e293b] transition-colors uppercase font-bold">
                     Cancelar
                  </button>
                  <button onClick={() => handleEvaluate(false)} className="px-3 py-2 rounded text-xs bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 flex items-center gap-1 transition-colors uppercase font-bold">
                     <AlertCircle size={14} /> Recusar
                  </button>
                  <button onClick={() => handleEvaluate(true)} className="px-4 py-2 rounded text-xs bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 flex items-center gap-1 transition-colors uppercase font-bold">
                     <CheckCircle size={14} /> Confirmar Pagamento (Pago)
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}
