import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { Heart, Send, Sparkles, ChevronDown, Sparkle, AlertCircle, Info, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function CadeiaUniaoPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState<{ [uid: string]: string }>({});
  const [selectedRequestForVibrators, setSelectedRequestForVibrators] = useState<any | null>(null);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Força Espiritual');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vibratingId, setVibratingId] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('Força Espiritual');
  const [editAnonymous, setEditAnonymous] = useState(false);
  const [updating, setUpdating] = useState(false);

  const categories = [
    'Oração & Prece',
    'Recuperação de Saúde',
    'Vibrações de Harmonia',
    'Força Espiritual',
    'Apoio Fraterno',
    'Egrégora'
  ];

  const fetchRequests = async () => {
    try {
      const q = query(collection(db, 'cadeia_uniao'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() as any }));
      setRequests(list);
    } catch (err) {
      console.error('Erro ao buscar pedidos da Cadeia de União:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const mapping: { [uid: string]: string } = {};
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const name = data.nome || 'Nobre Irmão';
        const uid = data.uid || docSnap.id;
        if (uid) {
          mapping[uid] = name;
        }
      });
      setUserMap(mapping);
    } catch (err) {
      console.error('Erro ao buscar usuários para Cadeia de União:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchUsers();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newTitle.trim() || !newDesc.trim()) {
      alert('Por favor, preencha o título e a descrição do seu pedido.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'cadeia_uniao'), {
        userId: user.uid,
        uid: user.uid,
        userName: isAnonymous ? 'Irmão em Segredo' : (user.nome || 'Nobre Irmão'),
        isAnonymous,
        title: newTitle.trim(),
        description: newDesc.trim(),
        category: newCategory,
        vibrantesCount: 0,
        vibrators: [],
        createdAt: serverTimestamp()
      });

      setNewTitle('');
      setNewDesc('');
      setIsAnonymous(false);
      alert('Seu pedido de vibrações foi enviado à egrégora da Cadeia de União!');
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar o pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVibrate = async (reqId: string, hasVibrated: boolean) => {
    if (!user) return;
    setVibratingId(reqId);
    
    try {
      const reqRef = doc(db, 'cadeia_uniao', reqId);
      const targetReq = requests.find(r => r.id === reqId);
      if (!targetReq) return;

      const currentVibrators = targetReq.vibrators || [];
      const isAlreadyVibrating = currentVibrators.includes(user.uid);

      let newCount = targetReq.vibrantesCount || 0;
      if (isAlreadyVibrating) {
        newCount = Math.max(0, newCount - 1);
        await updateDoc(reqRef, {
          vibrators: arrayRemove(user.uid),
          vibrantesCount: newCount
        });
      } else {
        newCount += 1;
        await updateDoc(reqRef, {
          vibrators: arrayUnion(user.uid),
          vibrantesCount: newCount
        });
      }

      setRequests(prev => prev.map(r => r.id === reqId ? {
        ...r,
        vibrators: isAlreadyVibrating ? r.vibrators.filter((uid: string) => uid !== user.uid) : [...(r.vibrators || []), user.uid],
        vibrantesCount: newCount
      } : r));

    } catch (err) {
      console.error(err);
    } finally {
      setVibratingId(null);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'cadeia_uniao', id));
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Erro ao excluir pedido:', err);
    }
  };

  const startEdit = (r: any) => {
    setEditingId(r.id);
    setEditTitle(r.title);
    setEditDesc(r.description);
    setEditCategory(r.category || 'Força Espiritual');
    setEditAnonymous(r.isAnonymous ?? false);
  };

  const handleUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !user) return;
    if (!editTitle.trim() || !editDesc.trim()) {
      alert('Por favor, preencha o título e a descrição.');
      return;
    }

    setUpdating(true);
    try {
      const reqRef = doc(db, 'cadeia_uniao', editingId);
      const updatedPayload = {
        title: editTitle.trim(),
        description: editDesc.trim(),
        category: editCategory,
        isAnonymous: editAnonymous,
        userName: editAnonymous ? 'Irmão em Segredo' : (user.nome || 'Nobre Irmão'),
      };

      await updateDoc(reqRef, {
        ...updatedPayload,
        updatedAt: serverTimestamp()
      });

      setRequests(prev => prev.map(r => r.id === editingId ? {
        ...r,
        ...updatedPayload,
        updatedAt: { toDate: () => new Date() }
      } : r));

      setEditingId(null);
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      alert('Erro ao atualizar o pedido.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 w-full h-full overflow-y-auto no-scrollbar font-sans text-left">
      
      {/* Header explicativo - Excluído do gestor, focado 100% no membro */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#0A0E1A] border-y border-[#D4AF37]/30 lg:border lg:rounded-xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 blur-3xl rounded-full"></div>
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className="p-3 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/30 shrink-0">
            <Sparkle size={32} className="text-[#D4AF37] animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#D4AF37] tracking-wide uppercase font-sans">
              Cadeia de União
            </h1>
            <p className="text-gray-300 text-sm mt-2 leading-relaxed">
              Diferente da <strong>Hospitalaria</strong> (que cuida de auxílio material), a 
              <strong> Cadeia de União</strong> espiritual é o espaço sagrado onde nos unimos em egrégora mental, 
              orações e envio de vibrações benfazejas para amparar os Irmãos em momentos de provação, 
              convalescença ou necessidade espiritual.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-yellow-400">
              <Info size={14} />
              <span>Qualquer obreiro pode postar ou enviar vibrações para fortalecer a corrente.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulário - Enviar novo pedido */}
        <div className="lg:col-span-5">
          <div className="bg-[#0F172A] border border-[#D4AF37]/20 rounded-xl p-6 sticky top-4 shadow-xl">
            <h2 className="text-lg font-medium text-[#D4AF37] mb-4 flex items-center gap-2">
              <Send size={18} />
              Novas Vibrações
            </h2>
            
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-semibold">
                  Tópico / Quem necessita?
                </label>
                <input 
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ex: Saúde de familiar ou Força Espiritual para mim"
                  className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all"
                  maxLength={60}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-semibold">
                  Categoria da Vibração
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c} value={c} className="bg-[#0F172A]">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-semibold">
                  Seu Pedido / Súplica
                </label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Descreva de forma fraterna para receber as orações dos Irmãos da oficina..."
                  rows={4}
                  className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg p-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all resize-none leading-relaxed"
                  maxLength={500}
                />
              </div>

              <div className="flex items-center gap-3 bg-black/30 p-3 rounded-lg border border-[#1e293b]">
                <input
                  type="checkbox"
                  id="chkAnon"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded border-[#1e293b] text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                />
                <label htmlFor="chkAnon" className="text-xs text-gray-300 select-none cursor-pointer">
                  Fazer pedido de forma reservada / anônima
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] text-black font-semibold uppercase tracking-wider py-3 rounded-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-xs"
              >
                {submitting ? 'Elevando preces...' : 'Elevar Pedido à Egrégora'}
              </button>
            </form>
          </div>
        </div>

        {/* Quadro de Correntes em Andamento */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
            <h2 className="text-lg font-medium text-white tracking-wide flex items-center gap-2">
              <Sparkles size={20} className="text-[#D4AF37]" />
              Correntes de Oração Ativas
            </h2>
            <span className="text-xs text-gray-400 font-mono">
              {requests.length} total
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-[#0F172A]/50 border border-[#1e293b] rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 border border-[#1e293b] border-dashed rounded-lg bg-[#0F172A]/40">
              <AlertCircle className="mx-auto text-gray-650 mb-3" size={40} />
              <p className="text-gray-400 text-sm">Harmonia perfeita. Nenhum pedido ativo na egrégora.</p>
              <p className="text-xs text-gray-650 mt-1">Insira um pedido à esquerda se algum Irmão precisar de amparo.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((r, idx) => {
                const alreadyVibrated = user ? (r.vibrators || []).includes(user.uid) : false;
                const isMyRequest = user && (r.userId === user.uid || r.uid === user.uid);
                const isEditing = editingId === r.id;

                if (isEditing) {
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#0F172A] border border-[#D4AF37]/75 rounded-xl p-5 relative overflow-hidden transition-all shadow-xl"
                    >
                      <form onSubmit={handleUpdateRequest} className="space-y-4">
                        <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-2">
                          <span className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37] font-cinzel">Editar Pedido de Vibrações</span>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Tópico / Quem necessita?</label>
                          <input 
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all"
                            maxLength={60}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Categoria</label>
                            <select
                              value={editCategory}
                              onChange={e => setEditCategory(e.target.value)}
                              className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-all cursor-pointer"
                            >
                              {categories.map(c => (
                                <option key={c} value={c} className="bg-[#0F172A] text-xs">{c}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-2.5 bg-black/30 px-3 py-2 rounded-lg border border-[#1e293b] self-end cursor-pointer">
                            <input
                              type="checkbox"
                              id={`chkEditAnon_${r.id}`}
                              checked={editAnonymous}
                              onChange={e => setEditAnonymous(e.target.checked)}
                              className="w-4 h-4 rounded border-[#1e293b] text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                            />
                            <label htmlFor={`chkEditAnon_${r.id}`} className="text-xs text-gray-300 select-none cursor-pointer">
                              Pedido Anônimo
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Seu Pedido / Súplica</label>
                          <textarea
                            value={editDesc}
                            onChange={e => setEditDesc(e.target.value)}
                            rows={3}
                            className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all resize-none leading-relaxed font-sans"
                            maxLength={500}
                          />
                        </div>

                        <div className="flex justify-end gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3.5 py-1.5 border border-[#1e293b] bg-[#0A0E1A] hover:bg-white/5 text-gray-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={updating}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] text-black hover:brightness-110 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {updating ? 'Gravando...' : 'Salvar Alterações'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-[#0F172A] border border-[#1e293b]/70 hover:border-[#D4AF37]/30 rounded-xl p-5 relative overflow-hidden transition-all shadow-md group"
                  >
                    {/* Glowing light indicator if highly vibrated */}
                    {r.vibrantesCount >= 5 && (
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-pulse"></div>
                    )}

                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        {/* Categoria tag & Owner Actions */}
                        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                          <span className="inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                            {r.category || 'Vibração'}
                          </span>
                          
                          {isMyRequest && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEdit(r)}
                                className="text-gray-400 hover:text-[#D4AF37] p-1 rounded hover:bg-white/5 transition-all cursor-pointer"
                                title="Editar pedido"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteRequest(r.id)}
                                className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-all cursor-pointer"
                                title="Excluir pedido imediatamente"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-base font-semibold text-white group-hover:text-[#D4AF37] transition-all">
                          {r.title}
                        </h3>
                      </div>
                      
                      {/* Vibration indicators count */}
                      <div 
                        onClick={() => r.vibrators && r.vibrators.length > 0 && setSelectedRequestForVibrators(r)}
                        className={`text-right ${r.vibrators && r.vibrators.length > 0 ? 'cursor-pointer hover:opacity-80 transition-all' : ''}`}
                        title={r.vibrators && r.vibrators.length > 0 ? "Clique para ver quem elevou preces" : "Nenhuma vibração ainda"}
                      >
                        <div className="flex items-center gap-1.5 justify-end">
                          <Heart className={`w-4 h-4 ${alreadyVibrated ? 'fill-red-500 text-red-500' : 'text-[#D4AF37]/65 animate-pulse'}`} />
                          <span className="font-mono text-sm text-gray-200 group-hover:text-[#D4AF37] transition-colors">
                            {r.vibrantesCount || 0}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 block">em oração</span>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mt-3 leading-relaxed break-words whitespace-pre-line">
                      {r.description}
                    </p>

                    <div className="border-t border-[#1e293b]/60 mt-4 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="text-xs text-gray-500 flex flex-wrap gap-x-2 gap-y-1">
                        <span>Por: <strong className="text-gray-300 font-medium">{r.userName || 'Reservado'}</strong></span>
                        <span className="text-gray-650">•</span>
                        <span>Postado em: {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recente'}</span>
                      </div>

                      <button
                        onClick={() => handleVibrate(r.id, alreadyVibrated)}
                        disabled={vibratingId === r.id}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                          alreadyVibrated 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                          : 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black'
                        }`}
                      >
                        <Heart className="w-4 h-4 fill-current shrink-0" />
                        {alreadyVibrated ? 'Abraçado em Corrente' : 'Elevar minhas Preces'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Vibrators Modal */}
      <AnimatePresence>
        {selectedRequestForVibrators && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0A0E1A] border-2 border-[#D4AF37]/50 rounded-3xl p-6 max-w-md w-full relative shadow-[0_0_50px_rgba(212,175,55,0.15)]"
            >
              <button
                onClick={() => setSelectedRequestForVibrators(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-[#1e293b] pb-3">
                  <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20">
                    <Heart size={20} className="fill-current animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-serif" style={{ fontFamily: 'Cinzel' }}>Irmãos em Oração</h3>
                    <p className="text-[10px] text-[#D4AF37] uppercase tracking-widest">Cadeia de União da Egrégora</p>
                  </div>
                </div>

                <p className="text-xs text-[#D4AF37]/80 italic font-serif">
                  "{selectedRequestForVibrators.title}"
                </p>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {(selectedRequestForVibrators.vibrators || []).map((uid: string, idx: number) => {
                    const name = userMap[uid] || 'Nobre Irmão';
                    return (
                      <div key={uid || idx} className="flex items-center gap-2.5 p-2 bg-[#0F172A] border border-[#1e293b] rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[10px] font-bold text-[#D4AF37]">
                          {name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-200 font-medium">{name}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setSelectedRequestForVibrators(null)}
                  className="w-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-black transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
