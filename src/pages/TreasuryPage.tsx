import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { DollarSign, Send, CheckCircle, Clock, AlertCircle, FileText, Download, Copy, Check } from 'lucide-react';

export function TreasuryPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [remetentePix, setRemetentePix] = useState('');
  const [info, setInfo] = useState({ 
    pixKey: 'calepe@gmail.com', 
    pixName: 'Grande Oriente Maçônico (GOMA)', 
    amount: '100.00', 
    instructions: 'Por favor, realize a transferência pix correspondente à mensalidade do mês de referência. Após pagar, clique em Confirmar Pagamento para notificar o Tesoureiro e atualizar seu status.' 
  });

  const isOwner = ['gomau.ead@gmail.com', 'calepi@gmail.com', 'calepe@gmail.com'].includes((user?.email || '').toLowerCase().trim());

  useEffect(() => {
    if (!user) return;

    const loadTreasury = async () => {
      try {
        // Load settings
        const confRef = doc(db, 'configs', 'treasury');
        const confSnap = await getDoc(confRef);
        if (confSnap.exists()) {
          const data = confSnap.data() as any;
          setInfo(prev => ({
            ...prev,
            pixKey: data.pixKey || prev.pixKey,
            pixName: data.pixName || prev.pixName,
            amount: data.amount || prev.amount,
            instructions: data.instructions || prev.instructions
          }));
        }

        // Load user's payments sem orderBy composto para evitar erro de índice
        const q = query(
          collection(db, 'mensalidades'), 
          where('uid', '==', user.uid)
        );
        const snaps = await getDocs(q);
        const list = snaps.docs.map(d => ({ id: d.id, ...d.data() as any }));
        list.sort((a, b) => (b.mesRef || '').localeCompare(a.mesRef || ''));
        setPayments(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTreasury();
  }, [user]);

  const handleConfirmPayment = async () => {
    if (!user) return;
    if (!remetentePix.trim()) {
      alert('Por favor, informe a identificação do pagamento (Nome do titular ou chave Pix) para que o Financeiro possa conferir o recebimento.');
      return;
    }
    setConfirming(true);
    
    const targetValor = info.amount || '100.00';
    try {
      await addDoc(collection(db, 'mensalidades'), {
        uid: user.uid,
        userName: user.nome || '',
        userEmail: user.email || '',
        userCim: user.cim || '',
        mesRef: month,
        valor: targetValor,
        comprovanteUrl: '',
        remetentePix: remetentePix.trim(),
        tipo: 'mensalidade',
        status: 'em_analise',
        dataEnvio: serverTimestamp()
      });

      // WhatsApp redirection message
      const message = `Olá Tesoureiro, acabei de realizar o pagamento da minha contribuição mensal!\n\n` +
                      `• Nome: ${user.nome || 'Nobre Irmão'}\n` +
                      `• CIM: ${user.cim || 'N/A'}\n` +
                      `• Competência: ${month}\n` +
                      `• Pix em nome de: ${remetentePix.trim()}\n` +
                      `• Valor: R$ ${targetValor}\n\n` +
                      `Por favor, realize a validação na área do Gestor!`;
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=5531994375772&text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');

      alert('Confirmação enviada! Você será redirecionado ao WhatsApp para notificar a Tesouraria.');
      setRemetentePix('');
      
      // refresh payments
      const q = query(
        collection(db, 'mensalidades'), 
        where('uid', '==', user.uid)
      );
      const snaps = await getDocs(q);
      const list = snaps.docs.map(d => ({ id: d.id, ...d.data() as any }));
      list.sort((a, b) => (b.mesRef || '').localeCompare(a.mesRef || ''));
      setPayments(list);
      
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar confirmação ou carregar histórico.');
    } finally {
      setConfirming(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado': return <CheckCircle className="text-green-500" size={18} />;
      case 'rejeitado': return <AlertCircle className="text-red-500" size={18} />;
      default: return <Clock className="text-yellow-500" size={18} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovado': return 'Pago';
      case 'rejeitado': return 'Recusado';
      default: return 'Em Análise';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 w-full h-full overflow-y-auto">
      {/* Aviso de Fase de Testes */}
      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="text-[#D4AF37] shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Fase de Homologação e Testes</h3>
          <p className="text-xs text-gray-300 mt-1 leading-relaxed">
            O módulo da Tesouraria / Financeiro está ativo em ambiente de homologação. Todos os obreiros podem visualizar as informações de contribuição, copiar a chave Pix e confirmar o pagamento para enviar a notificação instantânea de baixa técnica ao Tesoureiro.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-[#D4AF37] mb-2 flex items-center gap-3">
             <DollarSign size={32} />
             Tesouraria
          </h1>
          <p className="text-gray-400 text-sm">Controle as suas contribuições de mensalidades e confirme os seus pagamentos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Form */}
         <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-[#0F172A] border border-[#D4AF37]/30 rounded-xl p-6 relative overflow-hidden shadow-lg shadow-[#D4AF37]/5">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-3xl rounded-full"></div>
               
               <h2 className="text-lg font-medium text-white mb-4">Dados para Pagamento</h2>
               <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Chave PIX (E-mail / Copia e Cola)</p>
                    <div className="flex items-center gap-2">
                       <p className="text-[#D4AF37] font-mono bg-black/40 p-2 rounded border border-[#1e293b] select-all break-all text-xs max-h-32 overflow-y-auto flex-1">{info.pixKey || 'Não configurada'}</p>
                       <button
                          type="button"
                          onClick={() => {
                             if (info.pixKey) {
                                navigator.clipboard.writeText(info.pixKey);
                                setCopiedPix(true);
                                alert("Chave Pix copiada!");
                                setTimeout(() => setCopiedPix(false), 2000);
                             }
                          }}
                          className="p-2 bg-[#D4AF37] text-black hover:bg-[#C5A028] rounded-lg transition-colors flex items-center justify-center shrink-0"
                       >
                          {copiedPix ? <Check size={16} /> : <Copy size={16} />}
                       </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Beneficiário</p>
                    <p className="text-white text-sm">{info.pixName || 'Não configurado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Valor Mensalidade</p>
                    <p className="text-[#D4AF37] text-lg font-bold">R$ {info.amount || '100,00'}</p>
                  </div>
                  {info.instructions && (
                     <div>
                       <p className="text-xs text-yellow-500 uppercase tracking-widest mb-1">Avisos / Vencimento</p>
                       <p className="text-gray-300 text-xs bg-yellow-500/10 p-3 rounded border border-yellow-500/20">{info.instructions}</p>
                     </div>
                  )}
               </div>
            </div>

            <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl p-6">
               <h2 className="text-lg font-medium text-white mb-4">Confirmar Pagamento</h2>
               
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Mês Referência</label>
                     <input 
                        type="month" 
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                     />
                  </div>

                  <div>
                     <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Quem fez o Pix? (Titular da Conta)</label>
                     <input 
                        type="text" 
                        value={remetentePix}
                        onChange={e => setRemetentePix(e.target.value)}
                        placeholder="Ex: Diogo Moura ou Pix da conta de Maria"
                        className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37] placeholder-gray-650 text-sm"
                     />
                     <p className="text-[10px] text-gray-500">Informe o nome do titular pagador para que a Tesouraria de baixa síncrona fora da plataforma.</p>
                  </div>
                  
                  <button 
                     onClick={handleConfirmPayment}
                     disabled={confirming}
                     className="w-full bg-[#D4AF37] text-black font-semibold py-3 rounded-lg hover:bg-[#C5A028] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                     {confirming ? (
                        'Processando...'
                     ) : (
                        <>
                           <Send size={16} />
                           Confirmar Pagamento
                        </>
                     )}
                  </button>

                  <p className="text-[11px] text-gray-500 leading-relaxed text-center">
                     Após confirmar, abriremos o WhatsApp do Tesoureiro com os dados preenchidos para avisá-lo do pagamento.
                  </p>
               </div>
            </div>
         </div>

         {/* History */}
         <div className="lg:col-span-2">
            <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl p-6 h-full">
               <h2 className="text-lg font-medium text-white mb-6">Meu Histórico</h2>
               
               {loading ? (
                  <div className="animate-pulse flex flex-col gap-4">
                     {[1,2,3].map(i => <div key={i} className="h-16 bg-[#1e293b] rounded-lg"></div>)}
                  </div>
               ) : payments.length === 0 ? (
                  <div className="text-center py-12 border border-[#1e293b] border-dashed rounded-lg bg-[#0A0E1A]">
                     <FileText className="mx-auto text-gray-600 mb-3" size={32} />
                     <p className="text-gray-400">Nenhuma mensalidade registrada</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {payments.map(p => (
                        <div key={p.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-[#0A0E1A] border border-[#1e293b] gap-4 animate-in fade-in-50">
                           <div>
                              <div className="flex items-center gap-3 flex-wrap">
                                 <span className="font-medium text-white text-lg">{p.mesRef}</span>
                                 <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${p.status === 'aprovado' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : p.status === 'rejeitado' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                                    {getStatusIcon(p.status)} {getStatusText(p.status)}
                                 </span>
                                 {p.tipo && (
                                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${p.tipo === 'livro' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : p.tipo === 'assinatura' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                       {p.tipo === 'livro' ? 'Livro Premium' : p.tipo === 'assinatura' ? 'Assinatura' : 'Mensalidade'}
                                    </span>
                                 )}
                              </div>
                              <div className="text-sm text-gray-400 mt-1 space-y-1">
                                 <div>Valor: R$ {p.valor}</div>
                                 {p.remetentePix && (
                                    <div className="text-xs text-[#D4AF37]/85 font-sans">
                                       Pix enviado por: <span className="text-white font-medium">{p.remetentePix}</span>
                                    </div>
                                 )}
                              </div>
                              {p.comentarioGestor && (
                                 <div className="text-xs text-red-400 mt-2 bg-red-500/10 p-2 rounded border border-red-500/20">
                                    Nota: {p.comentarioGestor}
                                 </div>
                              )}
                           </div>
                           
                           <div className="flex flex-col items-end gap-2 text-xs text-gray-500">
                              <span>Enviado em: {p.dataEnvio?.toDate ? p.dataEnvio.toDate().toLocaleDateString('pt-BR') : ''}</span>
                              {p.comprovanteUrl && (
                                 <a href={p.comprovanteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#D4AF37] hover:underline">
                                    <Download size={14} /> Ver Comprovante Histórico
                                 </a>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>

      </div>
    </div>
  );
}
