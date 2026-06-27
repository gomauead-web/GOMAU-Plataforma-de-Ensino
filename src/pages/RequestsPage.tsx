import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, addDoc, serverTimestamp, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { FileText, Send, Eye, Calendar, ArrowUp, HeartHandshake, LogOut, Upload, Link, Edit3, Trash2, Video } from 'lucide-react';
import { cn } from '../lib/utils';

interface RequestItem {
  id: string;
  userId: string;
  tipo: string;
  descricao: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'em_analise';
  criadoEm: any;
  analisadoEm?: any;
  comentarioGestor?: string | null;
  arquivoUrl?: string | null;
  numero?: string;
  temaCentral?: string;
  simbolosPrincipais?: string;
}

export function RequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [pranchaNumero, setPranchaNumero] = useState('Pr∴ 01');
  const [pranchaTema, setPranchaTema] = useState('');
  const [pranchaSimbolos, setPranchaSimbolos] = useState('');
  const [pranchaLink, setPranchaLink] = useState('');
  const [pranchaFile, setPranchaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadRequests() {
    if (!user) return;
    try {
      const q = query(collection(db, 'requests'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RequestItem));
      // Sort manually since we might not have a composite index right away
      fetched.sort((a, b) => {
         const timeA = a.criadoEm?.toMillis ? a.criadoEm.toMillis() : 0;
         const timeB = b.criadoEm?.toMillis ? b.criadoEm.toMillis() : 0;
         return timeB - timeA;
      });
      setRequests(fetched);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'requests');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo || !user) return;
    
    if (tipo === 'Prancha (Resumo/Estudo)' && !pranchaFile && !pranchaLink.trim()) {
        alert("Para Pranchas, é necessário anexar o arquivo ou fornecer um Link Externo.");
        return;
    }
    
    if (tipo !== 'Prancha (Resumo/Estudo)' && !descricao) {
        alert("A descrição é obrigatória.");
        return;
    }
    
    setSubmitting(true);
    if (pranchaFile) setUploadProgress(1);

    try {
      let arquivoUrl = pranchaLink;
      if (pranchaFile) {
        console.log("Tentando upload em background...");
        try {
          const extension = pranchaFile.name.split('.').pop() || 'pdf';
          const safeName = `file_${Date.now()}.${extension}`;
          const fileRef = ref(storage, `pranchas/${user.uid}/${safeName}`);
          
          const uploadTask = uploadBytesResumable(fileRef, pranchaFile);

          const uploadedUrl = await new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => {
              uploadTask.cancel();
              reject(new Error("Timeout"));
            }, 15000);

            uploadTask.on('state_changed', 
              (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setUploadProgress(progress);
              }, 
              (error) => { clearTimeout(timeout); reject(error); }, 
              async () => {
                clearTimeout(timeout);
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              }
            );
          });
          arquivoUrl = uploadedUrl;
        } catch (uploadErr) {
           console.warn("Upload falhou, tentando salvar sem arquivo pois o Storage está desativado:", uploadErr);
           if (tipo === 'Prancha (Resumo/Estudo)' && !pranchaLink.trim()) {
             throw new Error("Falha no envio do arquivo e nenhum link foi fornecido. Ative o Storage no console do Firebase para enviar arquivos.");
           }
        }
      }

      if (editingId) {
        const reqRef = doc(db, 'requests', editingId);
        
        const updatePayload: any = {
          tipo: tipo === 'Prancha (Resumo/Estudo)' ? 'Envio de Prancha' : tipo,
          descricao,
          updatedAt: serverTimestamp()
        };
        
        if (arquivoUrl) {
          updatePayload.arquivoUrl = arquivoUrl;
        }

        if (tipo === 'Prancha (Resumo/Estudo)') {
          updatePayload.numero = pranchaNumero;
          updatePayload.temaCentral = pranchaTema;
          updatePayload.simbolosPrincipais = pranchaSimbolos;
          updatePayload.titulo = 'Envio de Prancha';
        }
        
        await updateDoc(reqRef, updatePayload);
        
        await addDoc(collection(db, 'history'), {
           userId: user.uid,
           tipo: 'atividade',
           titulo: `Solicitação Editada: ${tipo}`,
           descricao: `Uma solicitação pendente foi editada pelo membro.`,
           data: new Date().toLocaleDateString('pt-br'),
           hora: new Date().toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' }),
           autor: 'Sistema',
           criadoEm: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'requests'), {
          userId: user.uid,
          userName: user.nome,
          tipo: tipo === 'Prancha (Resumo/Estudo)' ? 'Envio de Prancha' : tipo,
          descricao,
          numero: tipo === 'Prancha (Resumo/Estudo)' ? pranchaNumero : null,
          temaCentral: tipo === 'Prancha (Resumo/Estudo)' ? pranchaTema : null,
          simbolosPrincipais: tipo === 'Prancha (Resumo/Estudo)' ? pranchaSimbolos : null,
          titulo: tipo === 'Prancha (Resumo/Estudo)' ? 'Envio de Prancha' : null,
          arquivoUrl: arquivoUrl || null,
          status: 'pendente',
          criadoEm: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        await addDoc(collection(db, 'history'), {
           userId: user.uid,
           tipo: 'atividade',
           titulo: `Nova Solicitação: ${tipo}`,
           descricao: `Enviada uma solicitação do tipo: ${tipo}.`,
           data: new Date().toLocaleDateString('pt-br'),
           hora: new Date().toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' }),
           autor: 'Sistema',
           criadoEm: serverTimestamp()
        });
      }

      if (tipo === 'Prancha (Resumo/Estudo)' && !editingId) {
         const qReadings = query(collection(db, 'reading_progress'), where('userId', '==', user.uid), where('status', '==', 'pendente'));
         const readingsSnap = await getDocs(qReadings);
         for (const readingDoc of readingsSnap.docs) {
             await updateDoc(doc(db, 'reading_progress', readingDoc.id), { status: 'resumo_enviado' });
         }
      }

      setTipo('');
      setDescricao('');
      setPranchaNumero('Pr∴ 01');
      setPranchaTema('');
      setPranchaSimbolos('');
      setPranchaLink('');
      setPranchaFile(null);
      setEditingId(null);
      await loadRequests();
    } catch (err: any) {
      alert("Erro: " + (err.message || "Erro desconhecido."));
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-900/50 text-green-400 border border-green-500/50';
      case 'rejeitado': return 'bg-red-900/50 text-red-400 border border-red-500/50';
      case 'pendente': return 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/50';
      case 'em_analise': return 'bg-blue-900/50 text-blue-400 border border-blue-500/50';
      default: return 'bg-gray-800 text-gray-400';
    }
  };

  const getIcon = (tipo: string) => {
    if (tipo.includes('Falta') || tipo.includes('Evento')) return <Calendar size={16} />;
    if (tipo.includes('Hospitalaria')) return <HeartHandshake size={16} />;
    if (tipo.includes('Quitte') || tipo.includes('Transferência')) return <LogOut size={16} />;
    return <FileText size={16} />;
  };

  const handleEdit = (req: RequestItem) => {
    setTipo(req.tipo === 'Envio de Prancha' ? 'Prancha (Resumo/Estudo)' : req.tipo);
    setDescricao(req.descricao);
    setPranchaLink(req.arquivoUrl || '');
    if (req.tipo === 'Envio de Prancha') {
      setPranchaNumero(req.numero || 'Pr∴ 01');
      setPranchaTema(req.temaCentral || '');
      setPranchaSimbolos(req.simbolosPrincipais || '');
    } else {
      setPranchaNumero('Pr∴ 01');
      setPranchaTema('');
      setPranchaSimbolos('');
    }
    setEditingId(req.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'requests', id));
      await loadRequests();
      alert("Solicitação excluída com sucesso.");
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <h1 className="text-3xl font-semibold text-[#D4AF37] mb-2">{editingId ? 'Editando Solicitação' : 'Solicitações'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {editingId && (
            <button 
              onClick={() => {
                setEditingId(null);
                setTipo('');
                setDescricao('');
                setPranchaLink('');
                setPranchaFile(null);
              }}
              className="text-gray-400 hover:text-white px-4 py-2 bg-[#1e293b] rounded-lg text-sm font-medium transition-colors"
            >
              Cancelar Edição
            </button>
          )}
        </div>
      </header>

      {/* New Request Form */}
      <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1e293b] flex items-center gap-2 text-[#D4AF37]">
          {editingId ? <Edit3 size={20} /> : <FileText size={20} />}
          <h2 className="text-lg font-medium">{editingId ? 'Alterar Dados' : 'Nova Solicitação'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de Solicitação</label>
              <select 
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors appearance-none"
                required
              >
                <option value="" disabled>Selecione o tipo de solicitação</option>
                <option value="Prancha (Resumo/Estudo)">Prancha (Resumo/Estudo)</option>
                <option value="Justificativa de Falta">Justificativa de Falta</option>
                <option value="Pedido de Certidão/Docs">Pedido de Certidão/Docs</option>
                <option value="Apoio de Hospitalaria">Apoio de Hospitalaria</option>
                <option value="Quitte Placet (Transferência)">Quitte Placet (Transferência)</option>
                <option value="Outros">Outros...</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">Escolha o assunto principal da sua solicitação. Pranchas aprovadas contarão para sua evolução de grau.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Descrição {tipo === 'Prancha (Resumo/Estudo)' ? '(Opcional)' : ''}</label>
              <textarea 
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva sua solicitação com detalhes ou cole o texto da prancha..."
                className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors resize-none h-24"
              ></textarea>
              <p className="text-xs text-gray-500 mt-2">No caso de faltas, detalhe o motivo.</p>
            </div>
            
            {tipo === 'Prancha (Resumo/Estudo)' && (
               <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Número</label>
                      <input 
                         type="text" 
                         value={pranchaNumero} 
                         onChange={(e) => setPranchaNumero(e.target.value)} 
                         className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                         placeholder="Pr∴ 01"
                      />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-gray-400 mb-2">Tema Central</label>
                       <input 
                          type="text" 
                          value={pranchaTema} 
                          onChange={(e) => setPranchaTema(e.target.value)} 
                          className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                          placeholder="Ex: O Ego do Aprendiz"
                       />
                    </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-400 mb-2">Símbolos Principais</label>
                     <input 
                        type="text" 
                        value={pranchaSimbolos} 
                        onChange={(e) => setPranchaSimbolos(e.target.value)} 
                        className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                        placeholder="Pedra Bruta, silêncio, humildade"
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo da Prancha (Opcional se usar Link)</label>
                       <label className="flex items-center gap-2 px-4 py-2 bg-[#1e293b]/50 border border-[#1e293b] rounded-lg cursor-pointer hover:bg-[#1e293b] transition-colors text-gray-300 w-full">
                           <Upload size={18} className="text-[#D4AF37]" />
                           <span className="text-sm truncate">{pranchaFile ? pranchaFile.name : 'Selecionar Arquivo'}</span>
                           <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => setPranchaFile(e.target.files ? e.target.files[0] : null)} />
                       </label>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-400 mb-2">OU Link Externo</label>
                       <div className="relative">
                         <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
                         <input 
                           type="url" 
                           value={pranchaLink} 
                           onChange={(e) => setPranchaLink(e.target.value)} 
                           className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 pl-10 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                           placeholder="https://docs.google.com/..."
                         />
                       </div>
                     </div>
                  </div>
               </div>
            )}
            
          </div>
          <div className="flex justify-end mt-4">
            <button 
              type="submit"
              disabled={submitting || !tipo || (tipo !== 'Prancha (Resumo/Estudo)' && !descricao) || (tipo === 'Prancha (Resumo/Estudo)' && !pranchaFile && !pranchaLink.trim())}
              className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#c2a033] hover:to-[#b59223] text-black font-semibold py-2 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              {submitting ? (uploadProgress ? `Enviando (${uploadProgress}%)...` : 'Enviando...') : (editingId ? 'Salvar Alterações' : 'Enviar Solicitação')}
            </button>
          </div>
        </form>
      </div>

      {/* Requests List */}
      <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1e293b]">
          <h2 className="text-lg font-medium text-[#D4AF37]">Minhas Solicitações</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e293b]">
                <th className="py-4 px-6 text-sm font-medium text-gray-400">Tipo</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-400">Descrição</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-400">Data</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-400">Status</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-400 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#D4AF37]">Carregando...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">Nenhuma solicitação encontrada.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="border-b border-[#1e293b] hover:bg-[#1E293B]/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-[#D4AF37]">
                            {getIcon(req.tipo)}
                         </div>
                         <span className="font-medium text-gray-200">{req.tipo}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm truncate max-w-xs">{req.descricao}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-gray-300 text-sm font-medium">
                          {req.criadoEm ? new Date(req.criadoEm.toMillis()).toLocaleDateString('pt-BR') : '-'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {req.criadoEm ? new Date(req.criadoEm.toMillis()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 w-max border", getStatusColor(req.status))}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", req.status === 'pendente' ? 'bg-yellow-400' : req.status === 'aprovado' ? 'bg-green-400' : 'bg-red-400')}></div>
                          {req.status === 'em_analise' ? 'Em Análise' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                        {req.analisadoEm && (
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter ml-1">
                            Resp: {new Date(req.analisadoEm.toMillis()).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={() => setSelectedRequest(req)}
                          className="text-[#D4AF37] hover:text-[#c2a033] flex items-center gap-1"
                          title="Ver Comentário"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {['pendente', 'rejeitado'].includes(req.status) && (
                          <>
                            {req.status === 'pendente' && (
                              <button 
                                onClick={() => handleEdit(req)}
                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                title="Editar"
                              >
                                <Edit3 size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(req.id)}
                              className="text-red-400 hover:text-red-300 flex items-center gap-1"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comentário Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
             <div className="p-6 border-b border-[#1e293b]">
                <h2 className="text-xl font-medium text-gray-200">
                  Comentário do Gestor
                </h2>
             </div>
             <div className="p-6 text-gray-300">
               {selectedRequest.comentarioGestor ? (
                 <p className="whitespace-pre-wrap">{selectedRequest.comentarioGestor}</p>
               ) : (
                 <p className="text-gray-500 italic">Nenhum comentário adicionado ainda.</p>
               )}
             </div>
             <div className="p-6 border-t border-[#1e293b] flex justify-end bg-[#0B0F19]">
                <button 
                   onClick={() => setSelectedRequest(null)}
                   className="px-6 py-2 bg-[#1e293b] text-gray-200 hover:bg-[#2e3e5c] rounded-lg transition-colors font-medium"
                >
                   Fechar
                </button>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}
