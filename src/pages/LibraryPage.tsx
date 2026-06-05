import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy, doc, getDoc, addDoc, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Search, Lock, Unlock, ExternalLink, Sparkles, Filter, CheckCircle, DollarSign, Bookmark, ArrowLeft, Shield, Award, Landmark, HelpCircle, Copy, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GRAUS = ['Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'];

interface LibraryItem {
  id: string;
  titulo: string;
  descricao: string;
  grauMinimo: string;
  categoria: 'Livro' | 'Ritual' | 'Artigo' | 'Apostila' | 'Estudo';
  preco?: string;
  isPaid: boolean;
  urlDrive: string;
  imagemCapa?: string;
  corCapa?: 'golden' | 'blue' | 'crimson' | 'jade' | 'charcoal';
  whatsappPersonalizado?: string;
  destaqueConversion?: boolean; 
  createdAt?: any;
}

export function LibraryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCost, setSelectedCost] = useState<string>('Público'); // 'Público', 'Premium'
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todos');
  const [showUnlockModal, setShowUnlockModal] = useState<LibraryItem | null>(null);
  const [remetentePix, setRemetentePix] = useState('');
  const [copied, setCopied] = useState(false);
  const [treasuryConfig, setTreasuryConfig] = useState({ pixKey: '', pixName: '' });

  useEffect(() => {
    const loadTreasuryConfig = async () => {
      try {
        const confRef = doc(db, 'configs', 'treasury');
        const confSnap = await getDoc(confRef);
        if (confSnap.exists()) {
          const data = confSnap.data() as any;
          setTreasuryConfig({
            pixKey: data.pixKey || 'gomau.ead@gmail.com',
            pixName: data.pixName || 'Tesouraria GOMAU'
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadTreasuryConfig();
  }, []);

  // Controle de progresso local para marcar livros como guardados na estante pessoal
  const [bookMarked, setBookMarked] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gomau_marked_books');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [userNotes, setUserNotes] = useState<{ [itemId: string]: string }>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  const fetchUserNotes = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'library_notes'),
        where('uid', '==', user.uid)
      );
      const snaps = await getDocs(q);
      const notesObj: { [itemId: string]: string } = {};
      snaps.docs.forEach(d => {
        const data = d.data();
        if (data.itemId && data.noteText) {
          notesObj[data.itemId] = data.noteText;
        }
      });
      setUserNotes(notesObj);
    } catch (err) {
      console.error('Erro ao carregar anotações:', err);
    }
  };

  const handleSaveNote = async (itemId: string, noteText: string) => {
    if (!user) return;
    setSavingNoteId(itemId);
    try {
      const noteDocId = `${user.uid}_${itemId}`;
      await setDoc(doc(db, 'library_notes', noteDocId), {
        uid: user.uid,
        itemId,
        noteText: noteText.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      setUserNotes(prev => ({ ...prev, [itemId]: noteText.trim() }));
      alert('Sua reflexão de estudo privada foi gravada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar anotação. Tente novamente.');
    } finally {
      setSavingNoteId(null);
    }
  };

  useEffect(() => {
    if (user) {
      const isOwner = ['gomau.ead@gmail.com', 'calepi@gmail.com', 'calepe@gmail.com'].includes((user?.email || '').toLowerCase().trim());
      if (!isOwner) {
        navigate('/');
        return;
      }
      fetchLibraryItems();
      fetchUserNotes();
    }
  }, [user, navigate]);

  const fetchLibraryItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'library_items'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LibraryItem[];
      setItems(fetched);
    } catch (err) {
      console.error("Erro ao carregar biblioteca virtual:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (bookMarked.includes(id)) {
      updated = bookMarked.filter(b => b !== id);
    } else {
      updated = [...bookMarked, id];
    }
    setBookMarked(updated);
    localStorage.setItem('gomau_marked_books', JSON.stringify(updated));
  };

  const userGrau = user?.grau || 'Aprendiz';

  // REGRA DE TRIAGEM AUTOMÁTICA: O membro visualiza estritamente os materiais correspondentes ao seu grau atual!
  const filteredItems = items.filter(item => {
    // Triagem estrita por grau (o aluno só enxerga as obras do seu próprio grau para manter a regularidade iniciática)
    if (item.grauMinimo !== userGrau) return false;

    // Filtro de Preço/Acesso
    if (selectedCost === 'Público' && item.isPaid) return false;
    if (selectedCost === 'Premium' && !item.isPaid) return false;

    // Filtro de Categoria
    if (selectedCategoria !== 'Todos' && item.categoria !== selectedCategoria) return false;

    // Filtro de Busca por Texto
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchTitle = item.titulo.toLowerCase().includes(term);
      const matchDesc = item.descricao.toLowerCase().includes(term);
      return matchTitle || matchDesc;
    }

    return true;
  });

  const getPremiumFeaturedCard = () => {
    // Retorna o item marcado com destaqueConversion do respectivo grau do usuário
    return items.find(item => item.destaqueConversion && item.grauMinimo === userGrau) || 
           items.find(item => item.isPaid && item.grauMinimo === userGrau);
  };

  const featuredPremiumItem = getPremiumFeaturedCard();

  const isBookUnlockedForUser = (itemId: string) => {
    if (user?.hasPremiumLibrary) return true;
    const item = items.find(it => it.id === itemId);
    if (!item) return false;
    if (!item.isPaid) return true;
    return (user?.unlockedBooks || []).includes(itemId);
  };

  const handleAccessItem = (item: LibraryItem) => {
    if (item.isPaid && !isBookUnlockedForUser(item.id)) {
      setShowUnlockModal(item);
    } else {
      window.open(item.urlDrive, '_blank', 'noopener,noreferrer');
    }
  };

  const handleWhatsappConversion = async (item: LibraryItem) => {
    if (!remetentePix.trim()) {
      alert('Por favor, informe quem realizou o pagamento Pix (Titular da Conta) para que possamos validar e liberar.');
      return;
    }
    const targetValor = item.preco ? item.preco.replace(/[^0-9,.]/g, '').trim() : '0,00';
    const tipo = (item.id && item.id.includes('Plano')) ? 'assinatura' : 'livro';
    
    if (user) {
      try {
        await addDoc(collection(db, 'mensalidades'), {
          uid: user.uid,
          userName: user.nome || '',
          userEmail: user.email || '',
          userCim: user.cim || '',
          mesRef: `Biblioteca: ${item.titulo}`,
          valor: targetValor,
          comprovanteUrl: '',
          remetentePix: remetentePix.trim(),
          tipo: tipo,
          itemId: item.id,
          status: 'em_analise',
          dataEnvio: serverTimestamp()
        });
      } catch (e) {
        console.error("Erro ao registrar intenção com tesouraria:", e);
      }
    }

    const defaultMsg = `Saudações Ir:. Tesoureiro! Gostaria de solicitar a liberação do item "${item.titulo}" na Biblioteca Virtual GOMAU.\n\n• Pix por: ${remetentePix.trim()}\n• Valor: R$ ${targetValor}`;
    const message = encodeURIComponent(item.whatsappPersonalizado ? `${item.whatsappPersonalizado}\n\n• Pix por: ${remetentePix.trim()}` : defaultMsg);
    window.open(`https://api.whatsapp.com/send?phone=5531994375772&text=${message}`, '_blank');
    setShowUnlockModal(null);
    setRemetentePix('');
  };

  const getCoverGradient = (cor?: string) => {
    switch (cor) {
      case 'charcoal': return 'from-[#1A1E24] to-[#0A0C0F] border-[#2A313C] text-gray-300';
      case 'blue': return 'from-[#0C1B33] to-[#040A14] border-[#15325E] text-blue-200';
      case 'crimson': return 'from-[#2F0F14] to-[#0F0406] border-[#5E1F28] text-red-100';
      case 'jade': return 'from-[#0A2218] to-[#030A07] border-[#134430] text-emerald-200';
      case 'golden':
      default: return 'from-[#2F2104] to-[#0E0B02] border-[#D4AF37]/50 text-[#D4AF37]';
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-sans relative overflow-x-hidden">
      {/* Elegantes Linhas de Esquadro e Compasso Geométricos de Fundo (Aparência Riquíssima) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FAF2E1] via-[#FDFBF7] to-[#FDFBF7] pointer-events-none"></div>
      
      {/* Ornamento de Linha Áurea do Topo */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent w-full opacity-80"></div>

      {/* LUXURY STANDALONE CUSTOM BAR */}
      <header className="border-b border-[#D4AF37]/30 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#785303]/40 text-[#785303] hover:bg-[#785303] hover:text-white hover:border-transparent transition-all duration-300 text-xs font-black uppercase tracking-widest hover:shadow-lg shadow-[#785303]/20"
            >
              <ArrowLeft size={14} />
              Retornar ao Templo
            </button>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-widest uppercase">
              <Landmark size={12} className="text-[#D4AF37]" />
              Atheneum GOMAU
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[9px] text-[#785303] uppercase tracking-widest font-black leading-none">Acervo Filtrado</p>
              <p className="text-xs font-semibold text-gray-800 mt-1 uppercase tracking-wide">{userGrau}</p>
            </div>
            <div className="w-10 h-10 rounded-full border border-[#D4AF37]/40 bg-white flex items-center justify-center text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)]">
              <Award size={18} />
            </div>
          </div>
        </div>
      </header>

      {/* Luxury Immersive Body Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {/* Intro Hero Section - Grand Design */}
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center justify-center p-4 bg-white/60 rounded-full border border-[#D4AF37]/30 mb-2 shadow-[0_15px_40px_rgba(212,175,55,0.15)] relative">
            <div className="absolute inset-0 bg-[#D4AF37]/5 blur-xl rounded-full"></div>
            <img src="/logotrad.png" alt="Logo GOMAU" className="w-24 h-24 sm:w-32 sm:h-32 object-contain relative z-10 drop-shadow-md" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold uppercase tracking-widest text-[#785303]" style={{ fontFamily: 'Cinzel', textShadow: '0 2px 10px rgba(120,83,3,0.15)' }}>
            BIBLIOTECA SECRETA
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent w-48 mx-auto"></div>
          <p className="text-base sm:text-lg text-gray-800 font-serif leading-relaxed italic">
            "Penetra nos mistérios ocultos da escrita sagrada. Aqui residem as instruções, rituais e ciências voltadas exclusivamente para a instrução individual do seu atual estágio de regularidade."
          </p>
          <div className="text-sm text-gray-700 font-mono flex items-center justify-center gap-1.5 pt-2">
            <Shield size={14} className="text-[#785303]" /> Triagem Automática Ativa: Exibindo apenas conteúdos homologados para o grau <span className="text-[#664601] font-extrabold">{userGrau}</span>.
          </div>
        </div>

        {/* Brand New Luxury Premium Card Banner - Conversion layout */}
        {selectedCost === 'Premium' && !user?.hasPremiumLibrary ? (
          <div className="bg-white border-2 border-[#D4AF37]/40 rounded-3xl p-8 relative overflow-hidden shadow-[0_15px_40px_rgba(212,175,55,0.1)] group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Landmark size={160} className="text-[#D4AF37]" strokeWidth={1} />
            </div>
            {/* Soft gold light backglow */}
            <div className="absolute left-1/4 top-1/2 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center gap-8 text-center text-left">
              <div className="space-y-4 max-w-3xl text-center mx-auto">
                <span className="bg-gradient-to-r from-[#D4AF37] to-[#F39C12] text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full inline-block shadow-md">
                  Acesso Total ao Acervo Reservado
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 uppercase tracking-wider leading-tight" style={{ fontFamily: 'Cinzel' }}>
                  Planos de Assinatura Premium GOMAU
                </h2>
                <p className="text-base sm:text-lg text-gray-800 leading-relaxed font-serif max-w-2xl mx-auto">
                  Liberte seu potencial maçônico. A Assinatura Premium confere passe livre a todos os pergaminhos, rituais e estudos aprofundados do seu grau. Escolha a jornada que mais se alinha ao seu momento e aproveite condições exclusivas abaixo, ou continue adquirindo obras avulsas individualmente na estante.
                </p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-4">
                {[
                  { title: 'Plano Mensal', price: 'R$ 29,90', period: '/mês', icon: <Bookmark size={18} /> },
                  { title: 'Plano Trimestral', price: 'R$ 79,90', period: '/trimestre', icon: <BookOpen size={18} /> },
                  { title: 'Plano Semestral', price: 'R$ 149,90', period: '/semestre', icon: <Landmark size={18} /> },
                  { title: 'Plano Anual', price: 'R$ 249,90', period: '/ano', icon: <Award size={18} />, highlight: true }
                ].map(plan => (
                  <div key={plan.title} className={`bg-[#FDFBF7] border ${plan.highlight ? 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)] scale-[1.02]' : 'border-gray-200'} p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden transition-all hover:border-[#D4AF37]/50 hover:shadow-lg`}>
                    {plan.highlight && (
                      <div className="absolute top-0 inset-x-0 bg-[#D4AF37] text-white text-[9px] font-black uppercase py-1 tracking-widest text-center">
                        Mais Obreiros Escolhem
                      </div>
                    )}
                    <div className={`space-y-4 ${plan.highlight ? 'pt-4' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-100 text-gray-400'}`}>
                        {plan.icon}
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">{plan.title}</h3>
                      <div className="space-y-1">
                        <span className="text-2xl font-black text-[#785303]" style={{ fontFamily: 'Cinzel' }}>{plan.price}</span>
                        <span className="text-[10px] text-gray-500 font-mono block">{plan.period}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowUnlockModal({
                        id: plan.title,
                        titulo: plan.title,
                        descricao: `Assinatura ${plan.title} para acesso integral ao Acervo Premium.`,
                        preco: plan.price,
                        isPaid: true,
                        grauMinimo: 'Aprendiz',
                        categoria: 'Livro',
                        urlDrive: '',
                        destaqueConversion: false,
                        whatsappPersonalizado: `Saudações Ir:. Tesoureiro! Gostaria de realizar a ativação do ${plan.title} (${plan.price}) da Biblioteca Virtual GOMAU. Segue o comprovante!`
                      } as LibraryItem)}
                      className={`mt-6 w-full py-3 rounded-xl font-extrabold transition-all text-xs uppercase tracking-widest ${plan.highlight ? 'bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black hover:scale-[1.03] shadow-lg shadow-[#D4AF37]/30' : 'bg-transparent text-[#785303] border border-[#785303]/60 hover:bg-[#785303]/10'}`}
                    >
                      Assinar Plano
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (selectedCost === 'Público' && featuredPremiumItem) ? (
          <div className="bg-white border-2 border-[#D4AF37]/40 rounded-3xl p-8 relative overflow-hidden shadow-[0_15px_40px_rgba(212,175,55,0.08)] group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Landmark size={160} className="text-[#D4AF37]" strokeWidth={1} />
            </div>
            {/* Soft gold light backglow */}
            <div className="absolute left-1/4 top-1/2 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 justify-between">
              <div className="space-y-4 max-w-2xl text-left">
                <span className="bg-gradient-to-r from-[#D4AF37] to-[#F39C12] text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full inline-block shadow-md">
                  Estudo de Alta Linhagem Iniciática
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 uppercase tracking-wider leading-tight" style={{ fontFamily: 'Cinzel' }}>
                  Aprofunde suas Raízes Científicas e Filosóficas
                </h2>
                <p className="text-base sm:text-lg text-gray-800 leading-relaxed font-serif">
                  Alcance chaves interpretativas de alto valor iniciático. Nossa Curadoria Premium reúne compilações históricas, exegeses ritualísticas e o simbolismo puro voltado para a elevação de sua consciência na Arte Real.
                </p>
                <div className="flex flex-wrap gap-4 items-center text-xs pt-2">
                  <span className="flex items-center gap-1.5 text-[#785303] bg-white px-3.5 py-2.5 rounded-xl border border-[#785303]/35 font-mono shadow-sm font-semibold">
                    ✦ Sincronização WhatsApp Imediata
                  </span>
                  <span className="text-gray-400 hidden sm:inline">•</span>
                  <span className="text-gray-500 font-sans">Liberação concedida via Tesouraria</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full lg:w-auto shrink-0 bg-[#FDFBF7] border border-[#D4AF37]/30 p-6 rounded-2xl text-center min-w-[280px] shadow-lg relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#D4AF37] text-white text-[9px] font-black uppercase px-3 py-0.5 rounded-full tracking-widest scale-95 border border-[#D4AF37] shadow-sm">
                  RECOMENDADO
                </div>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-2">Destaque Exclusivo</p>
                <div className="py-2">
                  <span className="text-4xl font-extrabold text-[#785303]" style={{ fontFamily: 'Cinzel' }}>{featuredPremiumItem.preco || 'Sob Consulta'}</span>
                  <span className="text-xs text-gray-500 block mt-1">acesso individual vitalício</span>
                </div>
                <button 
                  onClick={() => handleAccessItem(featuredPremiumItem)}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black w-full py-3 px-6 rounded-xl font-extrabold hover:scale-[1.03] transition-all text-xs uppercase tracking-widest shadow-lg shadow-[#D4AF37]/30"
                >
                  Garantir Acesso
                </button>
                <p className="text-[9px] text-gray-500 font-mono">Chave Pix institucional e liberação expressa.</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Sophisticated Search & Filtering */}
        <div className="bg-white/90 border border-[#D4AF37]/30 rounded-2xl p-6 space-y-4 shadow-[0_10px_30px_rgba(212,175,55,0.08)] relative">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            {/* Filter tags (free/premium) */}
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 w-full lg:w-auto">
              {['Público', 'Premium'].map(cost => (
                <button 
                  key={cost}
                  onClick={() => setSelectedCost(cost)}
                  className={`flex-1 lg:flex-initial px-8 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest shadow-sm ${selectedCost === cost ? 'bg-gradient-to-r from-[#D4AF37] to-[#F39C12] text-white shadow-[0_2px_10px_rgba(212,175,55,0.3)]' : 'text-gray-500 hover:text-gray-900 bg-white border border-gray-200'}`}
                >
                  Acervo {cost}
                </button>
              ))}
            </div>

            {/* Title search */}
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#664601]" size={18} />
              <input 
                type="text" 
                placeholder="Buscar obra pelo título ou assunto..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 w-full placeholder-gray-500 focus:border-[#D4AF37]/70 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all font-mono shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 items-center justify-between">
            {/* Category selection */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-700 uppercase tracking-widest mr-1 flex items-center gap-1">
                <Filter size={14} className="text-[#664601]" /> Categoria:
              </span>
              {['Todos', 'Livro', 'Ritual', 'Artigo', 'Apostila', 'Estudo'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategoria(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${selectedCategoria === cat ? 'bg-[#785303]/10 border border-[#785303]/40 text-[#664601] font-bold' : 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="text-xs text-gray-700 font-mono">
              Encontrados: <span className="text-gray-900 font-bold">{filteredItems.length}</span> tomos de estudo
            </div>
          </div>
        </div>

        {/* Luxurious Books Shelf Column/Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-gray-200">
            <BookOpen className="text-[#D4AF37] animate-bounce mb-4" size={40} />
            <p className="text-gray-500 text-xs font-mono tracking-widest uppercase">Consultando baú de acervos...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white/80 border border-gray-200 rounded-3xl p-20 text-center shadow-sm space-y-4">
            <BookOpen className="text-gray-300 mx-auto" size={48} />
            <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wider" style={{ fontFamily: 'Cinzel' }}>Nenhuma obra catalogada</h3>
            <p className="text-gray-500 text-xs mt-1 max-w-sm mx-auto font-serif">Não há livros cadastrados para o seu grau com os filtros atuais selecionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => {
                const gradientStyle = getCoverGradient(item.corCapa);
                const isMarked = bookMarked.includes(item.id);

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    key={item.id}
                    onClick={() => handleAccessItem(item)}
                    className="bg-white border border-[#D4AF37]/20 rounded-2xl p-6 flex flex-col justify-between hover:border-[#D4AF37]/50 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:bg-[#FDFBF7] relative overflow-hidden shadow-sm"
                  >
                    <div className="space-y-5">
                      {/* Cover Header Graphic - Premium styled canvas */}
                      <div 
                        className={`aspect-[4/3] w-full rounded-xl bg-gradient-to-br ${gradientStyle} border p-4 flex flex-col justify-between relative shadow-[inset_0_4px_25px_rgba(0,0,0,0.9)] overflow-hidden group-hover:brightness-110 transition-all duration-300`}
                        style={item.imagemCapa ? {
                          backgroundImage: `linear-gradient(to bottom, rgba(3, 5, 9, 0.45), rgba(3, 5, 9, 0.9)), url(${item.imagemCapa})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        } : {}}
                      >
                        {/* Book-spine overlay line for realism (lombada texturizada) */}
                        <div className="absolute top-0 bottom-0 left-0 w-3.5 bg-gradient-to-r from-black/80 via-black/40 to-transparent border-r border-white/5 z-20"></div>
                        
                        {/* Golden/Silver Hot Stamp Inner Frame for Luxury Binding sensation */}
                        <div className="absolute inset-2 border border-[#D4AF37]/30 rounded-lg pointer-events-none z-10 opacity-70"></div>
                        <div className="absolute inset-2.5 border border-[#D4AF37]/15 rounded shadow-[inset_0_0_20px_rgba(212,175,55,0.15)] pointer-events-none z-10"></div>

                        {/* Traditional Corner Accents in Esoteric Frames */}
                        <div className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l border-[#D4AF37]/50 z-20"></div>
                        <div className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r border-[#D4AF37]/50 z-20"></div>
                        <div className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l border-[#D4AF37]/50 z-20"></div>
                        <div className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r border-[#D4AF37]/50 z-20"></div>

                        {/* Subtle background cosmic mesh of coordinates */}
                        <div className="absolute inset-0 bg-radial-gradient from-[#D4AF37]/5 to-transparent pointer-events-none z-0"></div>
                        
                        {/* Top banner */}
                        <div className="flex justify-between items-start relative z-30 pl-2">
                          <span className="text-[9px] uppercase font-mono tracking-widest bg-white/90 backdrop-blur-md text-gray-900 px-2.5 py-0.5 rounded border border-white/40 font-bold shadow-sm">
                            {item.categoria}
                          </span>
                          
                          {/* Bookmark Estante Toggle */}
                          <button 
                            onClick={(e) => toggleBookmark(item.id, e)}
                            className="bg-white/80 hover:bg-white p-1.5 rounded-lg border border-white/40 text-gray-500 hover:text-yellow-500 transition-colors shadow-sm"
                          >
                            <Bookmark size={12} className={isMarked ? 'fill-[#D4AF37] text-[#D4AF37]' : ''} />
                          </button>
                        </div>

                        {/* Centralizing Esoteric Compass Layout with Glowing Aura */}
                        <div className="flex justify-center items-center py-2 relative z-30">
                          {/* Pulsing Backglow */}
                          <div className="absolute w-20 h-20 bg-[#D4AF37]/15 rounded-full blur-xl animate-pulse"></div>
                          
                          <div className="w-16 h-16 rounded-full border border-[#D4AF37]/45 bg-black/75 backdrop-blur-lg flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.25)] group-hover:scale-110 transition-transform duration-300">
                            {item.categoria === 'Ritual' ? (
                              <Award size={24} className="text-[#D4AF37]" />
                            ) : item.categoria === 'Artigo' ? (
                              <Sparkles size={24} className="text-[#D4AF37]" />
                            ) : item.categoria === 'Estudo' ? (
                              <Shield size={24} className="text-[#D4AF37]" />
                            ) : (
                              <BookOpen size={24} className="text-[#D4AF37]" />
                            )}
                          </div>
                        </div>

                        {/* Bottom line */}
                        <div className="flex justify-between items-end relative z-30 pl-2">
                          <span className="text-[8px] tracking-widest font-extrabold text-white/80 font-mono">
                            ACERVO REAL
                          </span>
                          <span className="text-[9px] uppercase font-bold tracking-widest text-[#D4AF37] font-mono bg-black/85 backdrop-blur-md px-2.5 py-0.5 rounded border border-[#D4AF37]/20">
                            {item.grauMinimo}
                          </span>
                        </div>
                      </div>

                      {/* Cover Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {item.isPaid ? (
                            isBookUnlockedForUser(item.id) ? (
                              <span className="text-green-600 text-xs uppercase font-black bg-green-500/10 px-2.5 py-1 rounded border border-green-500/30 flex items-center gap-1">
                                <Unlock size={12} className="text-green-600" /> Acesso Liberado
                              </span>
                            ) : (
                              <span className="text-yellow-700 text-xs uppercase font-black bg-yellow-500/15 px-2.5 py-1 rounded border border-yellow-500/30 flex items-center gap-1">
                                <Lock size={12} /> Premium ({item.preco || 'Ativação'})
                              </span>
                            )
                          ) : (
                            <span className="text-emerald-600 text-xs uppercase font-black bg-emerald-500/15 px-2.5 py-1 rounded border border-emerald-500/30">
                              Livre Leitura
                            </span>
                          )}
                          {isMarked && (
                            <span className="text-[#664601] text-xs bg-[#785303]/10 px-2.5 py-1 rounded flex items-center gap-1 font-extrabold border border-[#785303]/30">
                              ★ Guardado
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-gray-900 text-lg sm:text-xl uppercase tracking-wider group-hover:text-[#664601] transition-colors leading-snug line-clamp-2" style={{ fontFamily: 'Cinzel' }}>
                          {item.titulo}
                        </h3>
                        <p className="text-sm text-gray-800 line-clamp-3 leading-relaxed font-serif">
                          {item.descricao}
                        </p>
                      </div>
                    </div>

                    {/* Marginal study notes - ONLY if book is unlocked or free */}
                    {(!item.isPaid || isBookUnlockedForUser(item.id)) && (
                      <div 
                        onClick={e => e.stopPropagation()} 
                        className="mt-4 pt-3 border-t border-dashed border-gray-200 space-y-2 text-left"
                      >
                        <details className="group">
                          <summary className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-gray-500 hover:text-[#785303] cursor-pointer select-none">
                            <span className="flex items-center gap-1.5 font-bold">
                              <BookOpen size={12} className="text-[#D4AF37]" />
                              Anotações Privadas {userNotes[item.id] ? '(Preenchido)' : ''}
                            </span>
                            <ChevronDown size={12} className="transition-transform group-open:rotate-180 text-gray-450 focus:outline-none" />
                          </summary>
                          
                          <div className="mt-3 space-y-2">
                            <textarea
                              defaultValue={userNotes[item.id] || ''}
                              id={`note_${item.id}`}
                              placeholder="Suas meditações ao estudar este tomo. Salvo de forma 100% privada..."
                              className="w-full bg-[#FCFBF7] border border-[#D4AF37]/35 rounded-xl p-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#755502] leading-relaxed resize-none h-24 font-serif"
                            />
                            <button
                              onClick={() => {
                                const ta = document.getElementById(`note_${item.id}`) as HTMLTextAreaElement;
                                if (ta) {
                                  handleSaveNote(item.id, ta.value);
                                }
                              }}
                              disabled={savingNoteId === item.id}
                              className="w-full py-2 bg-[#785303] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#664601] transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                            >
                              {savingNoteId === item.id ? 'Gravando...' : 'Gravar Anotação'}
                            </button>
                          </div>
                        </details>
                      </div>
                    )}

                    {/* Bottom access button */}
                    <div className="pt-4 border-t border-gray-200 flex items-center justify-between mt-5">
                      <span className="text-xs text-gray-700 font-mono uppercase tracking-wider">{item.categoria}</span>
                      <button className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg bg-white text-gray-900 hover:bg-[#D4AF37] hover:text-white border border-[#D4AF37]/50 hover:border-transparent transition-all duration-300 shadow-sm">
                        {item.isPaid && !isBookUnlockedForUser(item.id) ? (
                          <>
                            <Lock size={11} /> Adquirir Tomo
                          </>
                        ) : (
                          <>
                            Estudar e Abrir <ExternalLink size={11} />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <footer className="border-t border-[#D4AF37]/20 py-10 mt-16 bg-white/60 text-center space-y-3">
        <p className="font-serif text-sm italic text-[#785303] font-bold">"Saber, Querer, Ousar e Calar"</p>
        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Atheneum Guardado G∴O∴M∴A∴U∴ — 2026</p>
      </footer>

      {/* Modern Luxury WhatsApp Acquisition Modal */}
      <AnimatePresence>
        {showUnlockModal && (
          <div className="fixed inset-0 bg-[#020408]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0A0E1A] border-2 border-[#D4AF37] rounded-3xl p-8 max-w-md w-full relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-center space-y-6"
            >
              <div className="absolute top-0 right-0 p-3 animate-pulse">
                <button 
                  onClick={() => { setShowUnlockModal(null); setCopied(false); }}
                  className="text-gray-400 hover:text-[#D4AF37] p-2 rounded-xl transition-colors text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="w-16 h-16 bg-[#D4AF37]/15 rounded-full flex items-center justify-center mx-auto text-[#D4AF37] border-2 border-[#D4AF37]/70 shadow-[0_0_25px_rgba(212,175,55,0.3)]">
                <Lock size={26} className="text-[#D4AF37]" />
              </div>

              <div className="space-y-2">
                <span className="text-black text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-[#D4AF37] to-[#C9A227] px-4 py-1.5 rounded-full shadow-sm inline-block">
                  Aquisição Premium — Pix Direto
                </span>
                <h3 className="text-2xl font-black text-white uppercase tracking-wider mt-2 font-sans" style={{ fontFamily: 'Cinzel' }}>
                  {showUnlockModal.titulo}
                </h3>
                <p className="text-sm text-gray-300 font-sans font-medium">
                  Valor de Contribuição: <strong className="text-[#D4AF37] text-2xl ml-2 font-sans font-black">{showUnlockModal.preco || 'R$ 49,90'}</strong>
                </p>
              </div>

              {/* Dedicated Copy Pix Section */}
              <div className="bg-[#111625] border border-gray-800 p-5 rounded-2xl space-y-3 text-left shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-300 uppercase tracking-wider font-mono font-bold">Chave Pix (Integração Tesouraria):</span>
                  {copied && (
                    <span className="text-xs text-green-400 font-bold uppercase tracking-widest font-mono">✓ Copiada!</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 bg-[#070A13] border border-[#D4AF37]/30 px-3 py-2.5 rounded-xl">
                  <span className="text-xs text-gray-100 font-mono select-all font-black truncate">{treasuryConfig.pixKey || 'gomau.ead@gmail.com'}</span>
                  <button
                    type="button"
                    onClick={() => {
                       navigator.clipboard.writeText(treasuryConfig.pixKey || 'gomau.ead@gmail.com');
                       setCopied(true);
                       setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-2.5 bg-[#D4AF37] text-black hover:bg-[#C9A227] rounded-lg hover:scale-105 transition-all text-xs font-bold shrink-0 shadow-md"
                    title="Copiar Chave Pix"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                {treasuryConfig.pixName && (
                   <div className="mt-1">
                      <span className="text-[10px] text-gray-400 uppercase font-mono block">Beneficiário:</span>
                      <p className="text-sm text-gray-200 font-sans font-bold">{treasuryConfig.pixName}</p>
                   </div>
                )}
              </div>

              {/* Input for Pix Payor details */}
              <div className="text-left space-y-1.5">
                <label className="text-[11px] text-gray-300 uppercase tracking-wider font-mono font-bold block">
                  Quem enviou o Pix? (Titular da Conta):
                </label>
                <input 
                  type="text"
                  value={remetentePix}
                  onChange={e => setRemetentePix(e.target.value)}
                  placeholder="Seu nome ou nome da conta pagadora"
                  className="w-full bg-[#070A13] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Ajude a Tesouraria a cruzar os depósitos no extrato bancário para liberação imediata.</p>
              </div>

              <div className="text-left bg-[#111625] p-4 border border-gray-800 rounded-2xl space-y-2 text-xs text-gray-200 font-sans leading-relaxed">
                <p className="font-black text-[#D4AF37] uppercase tracking-wider text-[10px] font-sans">Passo a Passo para Liberação:</p>
                <p className="pl-1 flex gap-2"><span className="text-[#D4AF37] font-bold">1.</span> Efetue a contribuição utilizando a chave Pix copiada.</p>
                <p className="pl-1 flex gap-2"><span className="text-[#D4AF37] font-bold">2.</span> Informe acima o titular da conta que fez a transferência.</p>
                <p className="pl-1 flex gap-2"><span className="text-[#D4AF37] font-bold">3.</span> Pressione o botão verde para notificar o Tesoureiro no WhatsApp.</p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button 
                  onClick={() => handleWhatsappConversion(showUnlockModal)}
                  className="bg-[#25D366] hover:bg-[#20ba5a] text-white w-full py-3.5 rounded-xl font-extrabold transition-all text-xs uppercase tracking-widest shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  Confirmar Pagamento e Enviar Aviso
                </button>
                <button 
                  onClick={() => { setShowUnlockModal(null); setCopied(false); }}
                  className="text-gray-400 hover:text-[#D4AF37] py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Voltar ao Acervo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
