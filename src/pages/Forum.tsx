import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, getDoc, doc, updateDoc, onSnapshot, where } from 'firebase/firestore';
import { MessageSquare, Plus, Search, ChevronRight, GraduationCap, X, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ForumTopic {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  authorCim: string;
  targetDegree: string;
  status: 'Aberto' | 'Resolvido';
  replyCount: number;
  createdAt: any;
}

interface ForumReply {
  id: string;
  topicId: string;
  authorId: string;
  authorName: string;
  authorCim: string;
  content: string;
  createdAt: any;
}

interface ForumInstructor {
  cim: string;
  degrees: string[];
}

export function Forum() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [instructors, setInstructors] = useState<ForumInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [activeTab, setActiveTab] = useState<'Aberto' | 'Resolvido' | 'Aguardando'>('Aberto');
  
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [newReply, setNewReply] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newTopicDegree, setNewTopicDegree] = useState(user?.grau || 'Aprendiz');

  // Get user's degree. Gestor has access to all if needed, but here we can just use user?.grau.
  const targetDegree = user?.grau || 'Aprendiz';

  const getSelectableDegrees = (deg: string) => {
    if (deg === 'Mestre') return ['Aprendiz', 'Companheiro', 'Mestre'];
    if (deg === 'Companheiro') return ['Aprendiz', 'Companheiro'];
    return ['Aprendiz'];
  };

  const selectableDegrees = user?.role === 'gestor' 
    ? ['Aprendiz', 'Companheiro', 'Mestre'] 
    : getSelectableDegrees(targetDegree);

  useEffect(() => {
    // Load instructors to know who gets the badge
    const loadInstructors = async () => {
      const q = query(collection(db, 'forumInstructors'));
      const snap = await getDocs(q);
      const ists = snap.docs.map(d => d.data() as ForumInstructor);
      setInstructors(ists);
    };
    loadInstructors();
  }, []);

  useEffect(() => {
    // Determine the degrees the current user can see.
    // Usually, they see only their current degree and below.
    // If they are an instructor, they can see the degrees they instruct.
    // We'll just load all and filter in JS if they are instructor, or use query if member.
    let isInstructor = false;
    let allowedDegrees = getSelectableDegrees(targetDegree);
    
    const myInstructorProfile = instructors.find(i => i.cim === user?.cim);
    if (myInstructorProfile) {
      isInstructor = true;
      // Merge instructor degrees with normal member allowed degrees
      const combined = new Set([...allowedDegrees, ...myInstructorProfile.degrees]);
      allowedDegrees = Array.from(combined);
    }

    if (user?.role === 'gestor') {
      allowedDegrees = ['Aprendiz', 'Companheiro', 'Mestre'];
    }

    setLoading(true);
    const q = query(collection(db, 'forumTopics'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const allTopics = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumTopic));
      // Filter the ones allowed for me
      const visible = allTopics.filter(t => allowedDegrees.includes(t.targetDegree));
      setTopics(visible);
      setLoading(false);
      setQuotaExceeded(false);
    }, (err: any) => {
      console.error("Error loading forum topics:", err);
      if (err?.code === 'resource-exhausted') {
        setQuotaExceeded(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, instructors, targetDegree]);

  useEffect(() => {
    if (!selectedTopic) return;
    
    const q = query(collection(db, 'forumReplies'), where('topicId', '==', selectedTopic.id), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setReplies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumReply)));
      setQuotaExceeded(false);
    }, (err: any) => {
      console.error("Error loading forum replies:", err);
      if (err?.code === 'resource-exhausted') {
        setQuotaExceeded(true);
      }
    });

    return () => unsubscribe();
  }, [selectedTopic]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicDesc.trim()) return;

    try {
      const topicData = {
        title: newTopicTitle,
        description: newTopicDesc,
        authorId: user?.uid,
        authorName: user?.nome,
        authorCim: user?.cim || '',
        targetDegree: newTopicDegree, // They create in their chosen allowed degree
        status: 'Aberto',
        replyCount: 0,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'forumTopics'), topicData);
      setShowCreateModal(false);
      setNewTopicTitle('');
      setNewTopicDesc('');
    } catch (err) {
      console.error(err);
      alert('Erro ao criar tópico.');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || !selectedTopic) return;

    try {
      await addDoc(collection(db, 'forumReplies'), {
        topicId: selectedTopic.id,
        authorId: user?.uid,
        authorName: user?.nome,
        authorCim: user?.cim || '',
        content: newReply,
        createdAt: serverTimestamp()
      });
      
      // Increment reply counter
      await updateDoc(doc(db, 'forumTopics', selectedTopic.id), {
        replyCount: (selectedTopic.replyCount || 0) + 1
      });

      setNewReply('');
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar resposta.');
    }
  };

  const handleMarkResolved = async () => {
    if (!selectedTopic) return;
    try {
      await updateDoc(doc(db, 'forumTopics', selectedTopic.id), {
        status: 'Resolvido'
      });
      setSelectedTopic({ ...selectedTopic, status: 'Resolvido' });
    } catch (err) {
      console.error(err);
      alert('Erro ao marcar como resolvido.');
    }
  };

  const filteredTopics = topics.filter(t => {
    if (activeTab === 'Aguardando') {
      return t.status === 'Aberto' && t.replyCount === 0;
    }
    return t.status === activeTab;
  });
  const isInstructor = instructors.some(i => i.cim === user?.cim);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {quotaExceeded && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
            <Clock className="w-6 h-6 text-red-500 shrink-0" />
            <div>
                <p className="text-red-400 font-bold">Limite de Tráfego Diário Atingido</p>
                <p className="text-sm text-red-400/80">O servidor de dados atingiu sua cota de acesso gratuita para hoje. O conteúdo do fórum será restaurado automaticamente nas próximas horas. Agradecemos a compreensão.</p>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-[#D4AF37] mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8" /> Fórum de Estudos
          </h1>
          <p className="text-gray-400">
            Tire dúvidas, discuta temas e receba orientações dos Instrutores designados.
          </p>
        </div>
        {!selectedTopic && (
          <button onClick={() => setShowCreateModal(true)} className="rounded-md bg-[#D4AF37] text-black hover:bg-[#D4AF37] hover:brightness-110 font-bold px-6 py-3">
            <Plus className="w-5 h-5 mr-2 inline-block" /> Novo Tópico
          </button>
        )}
      </div>

      {selectedTopic ? (
        <div className="space-y-6">
          <button onClick={() => setSelectedTopic(null)} className="text-[#D4AF37] hover:underline flex items-center gap-2 mb-4">
            ← Voltar para a lista
          </button>
          
          {/* Topic Header */}
          <div className="bg-[#0A0E1A]/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 md:p-8">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">{selectedTopic.title}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedTopic.status === 'Resolvido' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {selectedTopic.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 border-b border-white/5 pb-6">
              <span className="font-medium text-gray-300">Ir∴ {selectedTopic.authorName}</span>
              <span>•</span>
              <span className="px-2 py-0.5 bg-white/5 rounded text-xs">{selectedTopic.targetDegree}</span>
              <span>•</span>
              <span>{selectedTopic.createdAt ? format(selectedTopic.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}</span>
            </div>
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
              {selectedTopic.description}
            </div>

            {selectedTopic.status === 'Aberto' && (selectedTopic.authorId === user?.uid || isInstructor || user?.role === 'gestor') && (
              <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                <button onClick={handleMarkResolved} className="rounded-md px-4 py-2 border border-green-500/50 text-green-400 hover:bg-green-500/10 transition-colors">
                  <CheckCircle className="w-4 h-4 mr-2 inline-block" /> Marcar como Resolvido
                </button>
              </div>
            )}
          </div>

          {/* Replies */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Respostas ({replies.length})</h3>
            
            {replies.map(reply => {
              const replyIsInstructor = instructors.some(i => i.cim === reply.authorCim);
              
              return (
                <div key={reply.id} className={`p-6 rounded-2xl border ${replyIsInstructor ? 'bg-[#D4AF37]/5 border-[#D4AF37]/20 relative overflow-hidden' : 'bg-[#0A0E1A]/40 border-white/5'}`}>
                  {replyIsInstructor && (
                    <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                      Instrutor
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`font-bold ${replyIsInstructor ? 'text-[#D4AF37]' : 'text-gray-300'}`}>Ir∴ {reply.authorName}</span>
                    <span className="text-xs text-gray-500">
                      {reply.createdAt ? format(reply.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}
                    </span>
                  </div>
                  <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {reply.content}
                  </div>
                </div>
              );
            })}
          </div>

          {(selectedTopic.status === 'Aberto' && (isInstructor || user?.role === 'gestor')) && (
            <div className="bg-[#0A0E1A]/40 border border-white/5 rounded-2xl p-6 mt-6">
              <h4 className="text-white font-bold mb-4">Sua Resposta (Painel do Instrutor)</h4>
              <form onSubmit={handleReply}>
                <textarea
                  value={newReply}
                  onChange={e => setNewReply(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:ring-[#D4AF37] focus:border-[#D4AF37] min-h-[120px] mb-4"
                  placeholder="Escreva a orientação para o Ir∴..."
                  required
                />
                <div className="flex justify-end">
                  <button type="submit" disabled={!newReply.trim()} className="rounded-md bg-[#D4AF37] text-black hover:bg-[#D4AF37] hover:brightness-110 font-bold px-6 py-3 disabled:opacity-50">
                    Enviar Orientação
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {(selectedTopic.status === 'Aberto' && !isInstructor && user?.role !== 'gestor') && (
            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-6 mt-6 text-center">
              <GraduationCap className="w-8 h-8 text-[#D4AF37] mx-auto mb-2 opacity-50" />
              <p className="text-sm text-gray-400">
                Aguardando a orientação de um <span className="text-[#D4AF37] font-bold">Instrutor</span>.
                <br />Você pode visualizar as respostas, mas apenas instrutores podem responder.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => setActiveTab('Aberto')}
              className={`px-6 py-4 text-sm font-bold tracking-wider uppercase transition-colors relative ${
                activeTab === 'Aberto' ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-white'
              }`}
            >
              Em Aberto
              {activeTab === 'Aberto' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('Aguardando')}
              className={`px-6 py-4 text-sm font-bold tracking-wider uppercase transition-colors relative flex items-center gap-2 ${
                activeTab === 'Aguardando' ? 'text-amber-500' : 'text-gray-500 hover:text-white'
              }`}
            >
              Aguardando Inst.
              {topics.filter(t => t.status === 'Aberto' && t.replyCount === 0).length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {topics.filter(t => t.status === 'Aberto' && t.replyCount === 0).length}
                </span>
              )}
              {activeTab === 'Aguardando' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('Resolvido')}
              className={`px-6 py-4 text-sm font-bold tracking-wider uppercase transition-colors relative ${
                activeTab === 'Resolvido' ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-white'
              }`}
            >
              Resolvidos
              {activeTab === 'Resolvido' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
              )}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando tópicos...</p>
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="text-center py-20 bg-[#0A0E1A]/40 rounded-2xl border border-white/5">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Nenhum tópico encontrado.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTopics.map(topic => (
                <div 
                  key={topic.id} 
                  onClick={() => setSelectedTopic(topic)}
                  className="bg-[#0A0E1A]/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:bg-white/[0.03] transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1">{topic.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {topic.createdAt ? format(topic.createdAt.toDate(), "dd/MM/yyyy") : ''}
                    </div>
                  </div>
                  <p className="text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                    {topic.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-300 font-medium">Ir∴ {topic.authorName}</span>
                      <span className="px-2 py-1 bg-white/5 rounded text-gray-400 text-xs">{topic.targetDegree}</span>
                      {topic.status === 'Aberto' && topic.replyCount === 0 && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs animate-pulse">
                          Aguardando Instrutor
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-medium text-sm">{topic.replyCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Criar Tópico */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0A0E1A] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
              <h2 className="text-cl font-bold text-white">Criar Novo Tópico de Estudo</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTopic} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Resumo da Dúvida (Título)</label>
                <input
                  type="text"
                  value={newTopicTitle}
                  onChange={e => setNewTopicTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  placeholder="Ex: Significado do Mosaico no 1º Grau"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sala de Estudos (Grau)</label>
                <select
                  value={newTopicDegree}
                  onChange={e => setNewTopicDegree(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  required
                >
                  {selectableDegrees.map(deg => (
                    <option key={deg} value={deg} className="bg-[#0A0E1A] text-white">{deg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descrição Detalhada</label>
                <textarea
                  value={newTopicDesc}
                  onChange={e => setNewTopicDesc(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-[#D4AF37] focus:border-[#D4AF37] h-32"
                  placeholder="Descreva sua dúvida com detalhes para que os Instrutores possam ajudar..."
                  required
                />
              </div>

              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-4 flex items-start gap-4">
                <GraduationCap className="w-6 h-6 text-[#D4AF37] shrink-0" />
                <p className="text-sm text-[#D4AF37] leading-relaxed">
                  <strong>Atenção:</strong> Seu tópico ficará visível apenas na sala do grau selecionado ({newTopicDegree}) visando manter a regularidade na evolução, além dos Instrutores designados pela Gestão.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-md border border-white/10 px-4 py-2 text-gray-300 hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={!newTopicTitle.trim() || !newTopicDesc.trim()} className="rounded-md bg-[#D4AF37] text-black hover:bg-[#D4AF37] px-4 py-2 hover:brightness-110 font-bold disabled:opacity-50">
                  Publicar Tópico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
