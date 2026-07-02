import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Save, X, BookOpen, Link, Star, Lock, HelpCircle, Users, Unlock, CheckCircle2, Search, Coins, Sparkles, BookMarked, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const GRAUS = ['Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'];

export function GestorLibrary() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<'obras' | 'liberacoes' | 'configuracoes'>('obras');
  const [users, setUsers] = useState<any[]>([]);
  const [userPayments, setUserPayments] = useState<{ [uid: string]: any[] }>({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Config State
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [configSubmitting, setConfigSubmitting] = useState(false);
  const [planoMensal, setPlanoMensal] = useState('');
  const [planoSemestral, setPlanoSemestral] = useState('');
  const [planoAnual, setPlanoAnual] = useState('');
  const [descontoTexto, setDescontoTexto] = useState('');
  const [whatsappCobranca, setWhatsappCobranca] = useState('');

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [grauMinimo, setGrauMinimo] = useState('Aprendiz');
  const [categoria, setCategoria] = useState('Livro');
  const [preco, setPreco] = useState('R$ 49,90');
  const [isPaid, setIsPaid] = useState(false);
  const [urlDrive, setUrlDrive] = useState('');
  const [imagemCapa, setImagemCapa] = useState('');
  const [corCapa, setCorCapa] = useState('golden');
  const [whatsappPersonalizado, setWhatsappPersonalizado] = useState('');
  const [destaqueConversion, setDestaqueConversion] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchUsersAndPayments();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const docRef = doc(db, 'library_settings', 'premium_plan');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setPlanoMensal(data.planoMensal || '');
        setPlanoSemestral(data.planoSemestral || '');
        setPlanoAnual(data.planoAnual || '');
        setDescontoTexto(data.descontoTexto || '');
        setWhatsappCobranca(data.whatsappCobranca || '');
      }
    } catch (err) {
      console.error("Erro ao carregar configurações da biblioteca:", err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSubmitting(true);
    try {
      await setDoc(doc(db, 'library_settings', 'premium_plan'), {
        planoMensal,
        planoSemestral,
        planoAnual,
        descontoTexto,
        whatsappCobranca,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast.success("Configurações financeiras atualizadas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
      toast.error("Falha ao salvar configurações.");
    } finally {
      setConfigSubmitting(false);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'library_items'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(fetched);
    } catch (err) {
      console.error("Erro ao carregar biblioteca virtual:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersAndPayments = async () => {
    setLoadingUsers(true);
    try {
      const snapUsers = await getDocs(collection(db, 'users'));
      const fetchedUsers = snapUsers.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedUsers = fetchedUsers
        .filter((u: any) => u.nome)
        .sort((a: any, b: any) => a.nome.localeCompare(b.nome));
      setUsers(sortedUsers);

      const snapPayments = await getDocs(collection(db, 'mensalidades'));
      const fetchedPayments = snapPayments.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const paymentsMap: { [uid: string]: any[] } = {};
      fetchedPayments.forEach((p: any) => {
        if (p.uid) {
          if (!paymentsMap[p.uid]) paymentsMap[p.uid] = [];
          paymentsMap[p.uid].push(p);
        }
      });
      setUserPayments(paymentsMap);
    } catch (err) {
      console.error("Erro ao carregar dados integrados da biblioteca:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const togglePremiumSubscription = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      const newStatus = !currentStatus;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, hasPremiumLibrary: newStatus } : u));
      await updateDoc(userRef, { hasPremiumLibrary: newStatus });
      toast.success(`Assinatura Premium ${newStatus ? 'ativada' : 'cancelada'} com sucesso!`);
    } catch (err) {
      console.error("Erro ao atualizar assinatura:", err);
      toast.error("Erro ao alterar assinatura premium.");
      fetchUsersAndPayments();
    }
  };

  const toggleBookUnlock = async (userId: string, bookId: string, currentUnlocked: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;
      
      let updatedList = targetUser.unlockedBooks || [];
      if (currentUnlocked) {
        updatedList = updatedList.filter((id: string) => id !== bookId);
      } else {
        if (!updatedList.includes(bookId)) {
          updatedList = [...updatedList, bookId];
        }
      }
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, unlockedBooks: updatedList } : u));
      await updateDoc(userRef, { unlockedBooks: updatedList });
      toast.success(`Acesso ${currentUnlocked ? 'revogado' : 'liberado'} com sucesso!`);
    } catch (err) {
      console.error("Erro ao atualizar desbloqueio:", err);
      toast.error("Erro ao salvar permissão.");
      fetchUsersAndPayments();
    }
  };

  const unlockAllPremiumForUser = async (userId: string) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;
      
      const premiumItemIds = items.filter(item => item.isPaid).map(item => item.id);
      if (premiumItemIds.length === 0) {
        toast.error("Nenhuma obra premium cadastrada para liberar.");
        return;
      }
      
      let updatedList = [...(targetUser.unlockedBooks || [])];
      premiumItemIds.forEach(id => {
        if (!updatedList.includes(id)) updatedList.push(id);
      });
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, unlockedBooks: updatedList } : u));
      await updateDoc(doc(db, 'users', userId), { unlockedBooks: updatedList });
      toast.success("Todas as obras premium foram liberadas para o irmão!");
    } catch (err) {
      console.error("Erro ao liberar todos:", err);
      toast.error("Falha ao liberar todas as obras.");
    }
  };

  const toggleAllLocksForUser = async (userId: string) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;
      
      const hasAny = (targetUser.unlockedBooks || []).length > 0;
      const updatedList = hasAny ? [] : items.filter(item => item.isPaid).map(item => item.id);
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, unlockedBooks: updatedList } : u));
      await updateDoc(doc(db, 'users', userId), { unlockedBooks: updatedList });
      toast.success(hasAny ? "Acessos premium revogados integralmente." : "Todas as obras foram liberadas de cortesia!");
    } catch (err) {
      console.error("Erro ao alternar acessos:", err);
      toast.error("Falha ao atualizar.");
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setTitulo(item.titulo || '');
    setDescricao(item.descricao || '');
    setGrauMinimo(item.grauMinimo || 'Aprendiz');
    setCategoria(item.categoria || 'Livro');
    setPreco(item.preco || 'R$ 49,90');
    setIsPaid(item.isPaid || false);
    setUrlDrive(item.urlDrive || '');
    setImagemCapa(item.imagemCapa || '');
    setCorCapa(item.corCapa || 'golden');
    setWhatsappPersonalizado(item.whatsappPersonalizado || '');
    setDestaqueConversion(item.destaqueConversion || false);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingItem(null);
    resetForm();
  };

  const resetForm = () => {
    setTitulo('');
    setDescricao('');
    setGrauMinimo('Aprendiz');
    setCategoria('Livro');
    setPreco('R$ 49,90');
    setIsPaid(false);
    setUrlDrive('');
    setImagemCapa('');
    setCorCapa('golden');
    setWhatsappPersonalizado('');
    setDestaqueConversion(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !urlDrive) {
      toast.error("Por favor, preencha o Título e o Link do Google Drive.");
      return;
    }

    setSubmitting(true);
    const payload = {
      titulo,
      descricao,
      grauMinimo,
      categoria,
      preco: isPaid ? preco : '',
      isPaid,
      urlDrive,
      imagemCapa,
      corCapa,
      whatsappPersonalizado,
      destaqueConversion,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingItem) {
        // Editar item existente
        await updateDoc(doc(db, 'library_items', editingItem.id), payload);
        toast.success("Documento da biblioteca atualizado com sucesso!");
      } else {
        // Criar novo item
        await addDoc(collection(db, 'library_items'), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        toast.success("Documento adicionado à biblioteca com sucesso!");
      }

      handleCancel();
      fetchItems();
    } catch (err) {
      console.error("Erro ao salvar documento na biblioteca:", err);
      toast.error("Erro ao salvar alteração.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'library_items', id));
      toast.success("Item removido imediatamente em silêncio.");
      // Atualiza o estado local imediatamente
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Erro ao remover documento:", err);
      toast.error("Erro ao remover documento.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Dual Tab Controller Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#1e293b]/20 p-5 rounded-2xl border border-white/5 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#D4AF37] flex items-center gap-2.5" style={{ fontFamily: 'Cinzel' }}>
            <BookOpen size={22} className="text-[#D4AF37]" />
            Atheneum — Biblioteca Secreta
          </h2>
          <p className="text-xs text-gray-400 mt-1">Gerencie tomos, rituais, de linhagem e envie chaves de liberação para os irmãos.</p>
        </div>
        <div className="flex bg-black/40 border border-white/10 p-0.5 rounded-xl w-full sm:w-auto self-stretch sm:self-auto shrink-0 overflow-x-auto hide-scrollbar">
          <button
            type="button"
            onClick={() => { setActiveTab('obras'); setShowAddForm(false); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'obras' ? 'bg-[#D4AF37] text-black font-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <BookMarked size={14} />
            Acervo de Obras
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('liberacoes'); fetchUsersAndPayments(); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'liberacoes' ? 'bg-[#D4AF37] text-black font-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Users size={14} />
            Liberações ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('configuracoes')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'configuracoes' ? 'bg-[#D4AF37] text-black font-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Settings size={14} />
            Planos & Cobrança
          </button>
        </div>
      </div>

      {activeTab === 'obras' && (
        <>
          <div className="flex justify-between items-center bg-[#1e293b]/20 p-5 rounded-2xl border border-white/5">
            <div>
              <h2 className="text-xl font-semibold text-[#D4AF37] flex items-center gap-2" style={{ fontFamily: 'Cinzel' }}>
                <BookOpen size={22} />
                Gerenciar Biblioteca Digital
              </h2>
              <p className="text-xs text-gray-400 mt-1">Configure livros rituais, livros gerais do Oriente e materiais pagos ou gratuitos.</p>
            </div>
            <button 
              type="button"
              onClick={() => { setShowAddForm(!showAddForm); setEditingItem(null); resetForm(); }}
              className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:scale-[1.03] transition-all"
            >
              {showAddForm ? 'Voltar para Lista' : 'Adicionar Nova Obra'}
            </button>
          </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#0A0E1A]/60 border border-[#D4AF37]/30 rounded-2xl p-6 space-y-6 animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <h3 className="text-sm font-black text-white uppercase tracking-widest text-[#D4AF37]">
              {editingItem ? 'Editar Documento da Biblioteca' : 'Formulário de Nova Obra/Livro'}
            </h3>
            <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Título */}
            <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Título da Obra *</label>
              <input 
                type="text" 
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Regulamento Geral da Ordem Comentado"
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
                required
              />
            </div>

            {/* Categoria */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categoria</label>
              <select 
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
              >
                <option value="Livro">Livro</option>
                <option value="Ritual">Ritual</option>
                <option value="Artigo">Artigo Acadêmico</option>
                <option value="Apostila">Apostila de Apoio</option>
                <option value="Estudo">Estudo Maçônico</option>
              </select>
            </div>

            {/* Grau Mínimo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grau de Estudo Mínimo</label>
              <select 
                value={grauMinimo}
                onChange={e => setGrauMinimo(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
              >
                {GRAUS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Cor da capa */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cor Temática da Capa</label>
              <select 
                value={corCapa}
                onChange={e => setCorCapa(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
              >
                <option value="golden">Dourado / Preto Imperial</option>
                <option value="blue">Azul Real (Companheiro)</option>
                <option value="crimson">Vermelho Escarlate (Mestre)</option>
                <option value="jade">Verde Jade</option>
                <option value="charcoal">Cinza Mineral / Neutro</option>
              </select>
            </div>

            {/* Imagem de Capa Personalizada */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">URL da Imagem de Capa (Opcional)</label>
              <input 
                type="url" 
                value={imagemCapa}
                onChange={e => setImagemCapa(e.target.value)}
                placeholder="Ex e-capa: https://images.unsplash.com/..."
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
              />
            </div>

            {/* Link do Google Drive */}
            <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1">
                <Link size={12} /> Link do Google Drive *
              </label>
              <input 
                type="url" 
                value={urlDrive}
                onChange={e => setUrlDrive(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="bg-black/60 border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none font-mono"
                required
              />
            </div>

            {/* Configurações de Compra / Preço */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-4 col-span-1 md:col-span-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <Lock size={12} className="text-yellow-500" /> Cobrança Premium
                  </h4>
                  <p className="text-[10px] text-gray-500">Marque se os irmãos precisam pagar ou solicitar acesso específico no WhatsApp para abrir o link.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={isPaid}
                  onChange={e => setIsPaid(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D4AF37] bg-black accent-[#D4AF37]"
                />
              </div>

              {isPaid && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor do Livro</label>
                    <input 
                      type="text" 
                      value={preco}
                      onChange={e => setPreco(e.target.value)}
                      placeholder="Ex: R$ 39,90"
                      className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Texto do botão WhatsApp (Conversão)</label>
                    <input 
                      type="text" 
                      value={whatsappPersonalizado}
                      onChange={e => setWhatsappPersonalizado(e.target.value)}
                      placeholder="Ex: Quero liberar o livro de Hiram..."
                      className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Destaque de Conversão Principal */}
            <div className="col-span-1 md:col-span-3 flex items-center justify-between p-4 bg-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/20">
              <div className="flex items-start gap-3">
                <Star className="text-[#D4AF37] shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Exibir com Destaque no Topo da Biblioteca</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Se marcado, as informações e botões de conversão desta obra substituirão o cabeçalho premium principal da página da Biblioteca.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={destaqueConversion}
                onChange={e => setDestaqueConversion(e.target.checked)}
                className="w-4 h-4 rounded text-[#D4AF37] bg-black accent-[#D4AF37]"
              />
            </div>

            {/* Descrição Detalhada */}
            <div className="flex flex-col gap-1 col-span-1 md:col-span-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição Detalhada / Sinopse</label>
              <textarea 
                rows={4}
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Apresentação do livro, capítulos inclusos, as lições aprendidas ao desvendar a obra e importância na evolução científica do irmão..."
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button 
              type="button" 
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-white uppercase transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="bg-[#D4AF37] hover:scale-[1.02] text-black px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 shadow-lg shadow-[#D4AF37]/20"
            >
              <Save size={14} /> {submitting ? 'Salvando...' : editingItem ? 'Salvar Edições' : 'Gravar Obra'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10">
          <p className="text-sm text-gray-400">Consultando inventário de obras...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#1e293b]/10 border border-dashed border-gray-800 rounded-2xl p-10 text-center">
          <p className="text-sm text-gray-500">Nenhum livro cadastrado na biblioteca ainda.</p>
        </div>
      ) : (
        <div className="bg-black/30 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1e293b]/40 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <th className="px-6 py-4">Título</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Público-alvo</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Capa</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1e293b]/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white uppercase tracking-wider font-sans">{item.titulo}</div>
                      <div className="text-[10px] text-gray-500 line-clamp-1 max-w-sm mt-0.5">{item.descricao || 'Sem descrição cadastrada'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium bg-[#1e293b]/50 px-2 py-1 rounded border border-white/5">{item.categoria}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-medium">
                      {item.grauMinimo}
                    </td>
                    <td className="px-6 py-4">
                      {item.isPaid ? (
                        <span className="text-yellow-500 font-bold bg-yellow-500/10 px-2.5 py-1 rounded border border-yellow-500/10">
                          {item.preco || 'Premium'}
                        </span>
                      ) : (
                        <span className="text-green-500 font-bold bg-green-500/10 px-2.5 py-1 rounded border border-green-500/10">
                          Gratuito
                        </span>
                      )}
                      {item.destaqueConversion && (
                        <span className="text-xs text-[#D4AF37] ml-2 font-black uppercase tracking-tighter" title="Destaque principal de conversão">★ Destaque</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] uppercase text-gray-500">
                      {item.corCapa || 'golden'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="text-gray-400 hover:text-[#D4AF37] p-2 hover:bg-[#1e293b]/40 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="text-red-900/50 hover:text-red-400 p-2 hover:bg-[#ef4444]/10 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {activeTab === 'liberacoes' && (
        <>
          {/* SECURE PREMIUM UNLOCK & TREASURY ALIGNMENT BOARD */}
          <div className="bg-black/30 border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-semibold text-white tracking-wide text-sm uppercase flex items-center gap-1.5">
                  <Users size={16} className="text-[#D4AF37]" /> Liberações Manuais & Controle de Adimplência
                </h3>
                <p className="text-xs text-gray-400 mt-1">Conceda acessos estritos de pergaminhos ou rituais premium individualmente baseando-se no status mensal da tesouraria do irmão.</p>
              </div>

              {/* Real-time search for quick control */}
              <div className="relative w-full md:w-72">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por irmão ou CIM..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-xs text-white focus:outline-none focus:border-[#D4AF37] w-full"
                />
              </div>
            </div>

            {loadingUsers ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400 font-mono text-xs">Mergulhando nos arquivos das colunas para listar obreiros...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs border border-dashed border-white/5 rounded-xl">
                Nenhum obreiro cadastrado no sistema GOMAU.
              </div>
            ) : (
              <div className="space-y-4">
                {users
                  .filter(u => {
                    const term = userSearch.toLowerCase();
                    return (
                      (u.nome || '').toLowerCase().includes(term) ||
                      (u.email || '').toLowerCase().includes(term) ||
                      (u.cim || '').toLowerCase().includes(term)
                    );
                  })
                  .map(memberUser => {
                    const pList = userPayments[memberUser.id] || [];
                    const approvedPayments = pList.filter(p => p.status === 'aprovado');
                    const pendingPayments = pList.filter(p => p.status === 'em_analise');
                    
                    const premiumItems = items.filter(it => it.isPaid);
                    const unlockedCount = (memberUser.unlockedBooks || []).filter((id: string) => 
                      premiumItems.some(pi => pi.id === id)
                    ).length;

                    return (
                      <div 
                        key={memberUser.id} 
                        className="bg-[#0A0E1A]/40 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                      >
                        {/* Member overview */}
                        <div className="space-y-1 md:max-w-xs shrink-0 text-left">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white uppercase tracking-wider text-sm font-sans">{memberUser.nome}</h4>
                            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-black/50 text-[#D4AF37] border border-[#D4AF37]/20 font-mono">
                              {memberUser.grau}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-mono">{memberUser.email}</p>
                          <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-gray-500">
                            <span>CIM: {memberUser.cim || 'Não cadastrado'}</span>
                            <span className="text-[#D4AF37]">•</span>
                            <span>{memberUser.loja || 'Oriente'}</span>
                          </div>
                          
                          {/* Align Treasury monthly fee badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-2">
                            {approvedPayments.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                <CheckCircle2 size={10} className="text-green-400" />
                                Contribuinte ({approvedPayments.length} Ok)
                              </span>
                            ) : pendingPayments.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                <Coins size={10} className="text-yellow-400" />
                                Pix enviado (Validação)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                Sem faturas pagas
                              </span>
                            )}

                            {memberUser.hasPremiumLibrary ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-green-500 font-black bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/30">
                                <Sparkles size={10} className="text-green-500" />
                                PLANO PREMIUM (TUDO LIBERADO)
                              </span>
                            ) : unlockedCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-yellow-500 font-black bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                <Sparkles size={10} className="text-yellow-500" />
                                {unlockedCount} Obras Avulsas
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Premium Books releases grid */}
                        <div className="flex-1 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-left">Controle de Obras Premium:</p>
                          
                          {premiumItems.length === 0 ? (
                            <p className="text-xs text-gray-500 italic text-left">Nenhum tomo premium ou pago cadastrado no catálogo.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {premiumItems.map(book => {
                                const isUnlocked = (memberUser.unlockedBooks || []).includes(book.id);
                                return (
                                  <button
                                    key={book.id}
                                    type="button"
                                    onClick={() => toggleBookUnlock(memberUser.id, book.id, isUnlocked)}
                                    className={`p-2.5 rounded-xl border text-xs font-medium uppercase tracking-wider text-left transition-all flex items-center justify-between gap-2 hover:brightness-110 active:scale-95 ${isUnlocked ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border-yellow-500/35 text-[#D4AF37] font-bold' : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/10'}`}
                                  >
                                    <div className="truncate max-w-[140px]" title={book.titulo}>
                                      {book.titulo}
                                    </div>
                                    <div className="shrink-0">
                                      {isUnlocked ? (
                                        <Unlock size={12} className="text-[#D4AF37]" />
                                      ) : (
                                        <Lock size={12} className="text-gray-500" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Fast actions list under user */}
                        <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 justify-end items-stretch border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                          <button
                            type="button"
                            onClick={() => togglePremiumSubscription(memberUser.id, !!memberUser.hasPremiumLibrary)}
                            className={`${memberUser.hasPremiumLibrary ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30'} font-bold text-[10px] uppercase tracking-wider px-3.5 py-4 lg:py-2.5 rounded-xl transition-all font-sans shrink-0 whitespace-nowrap text-center`}
                          >
                            {memberUser.hasPremiumLibrary ? 'Revogar PLANO' : 'Ativar PLANO TOTAL'}
                          </button>
                          <button
                            type="button"
                            onClick={() => unlockAllPremiumForUser(memberUser.id)}
                            className="bg-yellow-500/10 hover:bg-yellow-300 text-yellow-500 hover:text-black border border-yellow-500/30 font-bold text-[10px] uppercase tracking-wider px-3.5 py-4 lg:py-2.5 rounded-xl transition-all font-sans shrink-0 whitespace-nowrap text-center"
                          >
                            Ativar Avulsos
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAllLocksForUser(memberUser.id)}
                            className="bg-black hover:bg-red-950/10 text-gray-400 hover:text-white border border-white/10 hover:border-white/20 font-bold text-[10px] uppercase tracking-wider px-3.5 py-4 lg:py-2.5 rounded-xl transition-all font-sans shrink-0 whitespace-nowrap text-center"
                          >
                            Inverter Tudo
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'configuracoes' && (
        <form onSubmit={handleSaveConfig} className="bg-black/30 border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col gap-4 border-b border-white/5 pb-4">
            <h3 className="font-semibold text-white tracking-wide text-sm uppercase flex items-center gap-1.5">
              <Settings size={16} className="text-[#D4AF37]" /> Configurações de Planos & Cobrança
            </h3>
            <p className="text-xs text-gray-400">Configure os valores dos planos de assinatura (Plano Total) da Biblioteca Virtual e os textos de conversão/descontos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Valor Mensal (Plano Total)</label>
              <input 
                type="text" 
                value={planoMensal}
                onChange={e => setPlanoMensal(e.target.value)}
                placeholder="Ex: R$ 29,90"
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Valor Semestral (Plano Total)</label>
              <input 
                type="text" 
                value={planoSemestral}
                onChange={e => setPlanoSemestral(e.target.value)}
                placeholder="Ex: R$ 149,90 (15% de Desconto)"
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Valor Anual (Plano Total)</label>
              <input 
                type="text" 
                value={planoAnual}
                onChange={e => setPlanoAnual(e.target.value)}
                placeholder="Ex: R$ 249,90 (30% de Desconto)"
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
              />
            </div>
            
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Link/Número de WhatsApp para Cobrança</label>
              <input 
                type="text" 
                value={whatsappCobranca}
                onChange={e => setWhatsappCobranca(e.target.value)}
                placeholder="Ex: https://wa.me/5511999999999?text=Quero%20assinar%20o%20plano..."
                className="bg-black/60 border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
              />
            </div>
            
            <div className="flex flex-col gap-1 md:col-span-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Texto de Oferta / Cupons de Desconto</label>
              <textarea 
                value={descontoTexto}
                onChange={e => setDescontoTexto(e.target.value)}
                rows={3}
                placeholder="Insira promoções ativas, ex: Use o cupom HIRAM10 para 10% de desconto no plano anual."
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none resize-none"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-white/5">
            <button 
              type="submit" 
              disabled={configSubmitting || loadingConfig}
              className="bg-[#D4AF37] hover:scale-[1.02] text-black px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 shadow-lg shadow-[#D4AF37]/20"
            >
              <Save size={14} /> {configSubmitting ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
