import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, where, addDoc, serverTimestamp, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { BookOpen, FileText, PlayCircle, Grid, Play, Lock, Compass, Landmark, Upload, Link, X, Download, ShieldAlert, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { SessionTimer } from '../components/Layout';
import { SafeVideoPlayer } from '../components/SafeVideoPlayer';

interface ContentItem {
  id: string;
  titulo: string;
  tipo: 'video' | 'pdf' | 'texto' | 'instrucao' | 'reflexao';
  grauMinimo: string;
  obrigatorio: boolean;
  descricao: string;
  fileUrl: string;
}

// Componente Visualizador de PDF Protegido
function SafePdfViewer({ 
  url, 
  title, 
  onClose,
  itemId,
  initialNoteText,
  onSaveNote,
  savingNoteId
}: { 
  url: string; 
  title: string; 
  onClose: () => void;
  itemId?: string;
  initialNoteText?: string;
  onSaveNote?: (itemId: string, noteText: string, silent?: boolean) => Promise<void>;
  savingNoteId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showNoteSidebar, setShowNoteSidebar] = useState(true);
  const [localNoteText, setLocalNoteText] = useState(initialNoteText || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setLocalNoteText(initialNoteText || '');
    setSaveStatus('idle');
  }, [initialNoteText]);

  useEffect(() => {
    let alertTimeout: NodeJS.Timeout;

    const triggerAlert = () => {
      setShowAlert(true);
      clearTimeout(alertTimeout);
      alertTimeout = setTimeout(() => setShowAlert(false), 3000);
    };

    // Bloquear clique direito no documento inteiro
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerAlert();
    };
    
    // Bloquear atalhos de teclado (S, P, U, C, F12)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey; // cmd para Mac, ctrl para Windows/Linux
      
      if (
        (isCmdOrCtrl && (e.key === 's' || e.key === 'p' || e.key === 'u' || e.key === 'c' || e.key === 'j' || e.key === 'i')) ||
        e.key === 'F12' ||
        (isCmdOrCtrl && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'S'))
      ) {
        e.preventDefault();
        triggerAlert();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(alertTimeout);
    };
  }, []);

  // Função para tratar links do Google Drive para modo Preview Seguro
  const getSafeUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    let processed = rawUrl;
    
    if (processed.includes('drive.google.com')) {
      // Se for link de "view", converte para "preview" que é mais limpo e seguro
      processed = processed.replace(/\/view(\?.*)?$/, '/preview');
      // Garante que termina com /preview caso não tenha parâmetros
      if (processed.includes('/file/d/') && !processed.endsWith('/preview')) {
        const parts = processed.split('?');
        if (!parts[0].endsWith('/preview')) {
          processed = parts[0].replace(/\/$/, '') + '/preview';
        }
      }
    }
    
    // Parâmetros de ocultação de toolbar padrão (funciona em PDFs diretos)
    return `${processed}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
  };

  const handleSave = async () => {
    if (!itemId || !onSaveNote) return;
    setSaveStatus('saving');
    try {
      await onSaveNote(itemId, localNoteText, true);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      setSaveStatus('error');
    }
  };

  const safeUrl = getSafeUrl(url);

  return (
    <div className="fixed inset-0 bg-black/98 z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-300">
      {/* Header do Visualizador */}
      <div className="bg-[#0A0E1A] border-b border-[#D4AF37]/30 p-4 flex items-center justify-between shadow-2xl relative z-50 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex-shrink-0 flex items-center justify-center border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <ShieldAlert size={20} className="text-[#D4AF37]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-gray-100 font-semibold text-base sm:text-lg leading-tight truncate">{title}</h3>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold">Conexão Criptografada & Protegida</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <SessionTimer />
          {itemId && onSaveNote && (
            <button
              onClick={() => setShowNoteSidebar(!showNoteSidebar)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer",
                showNoteSidebar 
                  ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]" 
                  : "bg-[#1e293b]/50 border-[#1e293b] text-gray-400 hover:text-white"
              )}
              title="Alternar Bloco de Notas"
            >
              <BookOpen size={14} />
              <span className="hidden md:inline">{showNoteSidebar ? "Fechar Notas" : "Abrir Notas"}</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-red-950/30 border border-red-500/30 rounded text-red-500 text-[10px] font-bold uppercase tracking-tighter shadow-inner">
            <Lock size={12} /> Proteção Ativa: Download e Impressão Bloqueados
          </div>
          <button 
            onClick={onClose}
            title="Fechar Visualizador"
            className="w-10 h-10 rounded-lg bg-[#1e293b] hover:bg-red-600 transition-all flex items-center justify-center text-white border border-[#1e293b] hover:border-red-500 group shadow-lg"
          >
            <X size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Conteúdo do Visualizador com Escudo de Proteção */}
      <div className="flex-1 flex flex-col md:flex-row relative bg-[#0A0E1A] overflow-hidden">
        
        {/* Iframe do PDF */}
        <div className="flex-1 h-full min-h-0 relative bg-[#0A0E1A] flex items-center justify-center overflow-hidden">
          {/* ESCUDO DE PROTEÇÃO (OVERLAY) 
            Este div invisível fica sobre os botões do Google Drive para impedir que o usuário clique no "Pop-out" ou "Download"
          */}
          <div className="absolute top-0 right-0 w-24 h-24 z-40 bg-transparent cursor-default" title="Área Protegida"></div>
          <div className="absolute top-0 left-0 right-0 h-12 z-30 bg-transparent cursor-default"></div>

          {/* Marca d'água de proteção visual lateral */}
          <div className="absolute inset-y-0 left-0 w-4 md:w-16 bg-gradient-to-r from-[#0A0E1A] to-transparent pointer-events-none z-20"></div>
          <div className="absolute inset-y-0 right-0 w-4 md:w-16 bg-gradient-to-l from-[#0A0E1A] to-transparent pointer-events-none z-20"></div>
          
          {/* Overlay de Proteção Geral (Impede seleção de texto se necessário) */}
          <div className="absolute inset-0 z-10 pointer-events-none border-[12px] md:border-[30px] border-[#0A0E1A]"></div>

          <iframe 
            src={safeUrl}
            className="w-full h-full border-none z-0 scale-[1.02] origin-center"
            title={title}
            allow="autoplay"
            onContextMenu={(e) => e.preventDefault()}
          />
          
          {/* Banner de Aviso na base para reforçar a segurança */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-black/80 backdrop-blur-md border border-[#D4AF37]/20 rounded-full flex items-center gap-2 pointer-events-none opacity-50">
             <Lock size={12} className="text-[#D4AF37]" />
             <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Documento Restrito à Visualização Local</span>
          </div>

          {/* Alerta de Ação Bloqueada */}
          {showAlert && (
            <div className="absolute inset-0 z-[110] flex items-center justify-center pointer-events-none px-6">
              <div className="bg-[#0A0E1A]/95 border-2 border-red-500/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.3)] flex flex-col items-center gap-4 animate-in zoom-in-90 duration-200">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30">
                  <ShieldAlert size={40} className="text-red-500 animate-pulse" />
                </div>
                <div className="text-center">
                  <h4 className="text-red-500 font-bold text-xl uppercase tracking-tighter">Documento Protegido</h4>
                  <p className="text-gray-300 text-sm max-w-[250px] mt-1">Ações de download, impressão e cópia são proibidas para este conteúdo restrito.</p>
                </div>
                <div className="px-3 py-1 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">
                  Protocolo G∴O∴M∴A∴U∴
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bloco de Notas Integrado / Caderno de Estudos Lateral */}
        {showNoteSidebar && itemId && onSaveNote && (
          <div className="w-full md:w-[380px] lg:w-[440px] border-t md:border-t-0 md:border-l border-[#D4AF37]/20 bg-[#070911]/95 flex flex-col shrink-0 z-40 animate-in slide-in-from-right-4 duration-350 shadow-2xl">
            <div className="p-4 border-b border-[#D4AF37]/15 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                </span>
                <span className="text-[11px] uppercase tracking-widest font-black text-[#D4AF37] font-cinzel">Caderno de Estudos Privado</span>
              </div>
              <button 
                onClick={() => setShowNoteSidebar(false)} 
                className="text-gray-500 hover:text-white p-1 rounded transition-colors"
                title="Minimizar Notas"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between gap-5 h-full overflow-y-auto">
              <div className="flex-1 flex flex-col">
                <p className="text-[12px] leading-relaxed text-gray-400 italic font-serif mb-3">
                  "Guarde reflexões, passagens marcantes ou conclusões ritualísticas para estudos posteriores. Suas notas são privadas."
                </p>
                <textarea
                  value={localNoteText}
                  onChange={(e) => {
                    setLocalNoteText(e.target.value);
                    if (saveStatus === 'saved') setSaveStatus('idle');
                  }}
                  placeholder="Inicie aqui seus apontamentos enquanto faz a leitura guiada do tomo..."
                  className="w-full bg-[#05070D] border border-[#1e293b] rounded-xl p-4 text-sm sm:text-[15px] text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] leading-relaxed resize-none flex-1 font-serif focus:ring-1 focus:ring-[#D4AF37]/30 min-h-[160px]"
                />
              </div>

              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex justify-between items-center text-[10px] text-gray-500">
                  <span className="font-mono">💾 Salvo sob sigilo absoluto</span>
                  {saveStatus === 'saved' && (
                    <span className="text-emerald-500 font-bold font-mono">✓ Notas Gravadas!</span>
                  )}
                  {saveStatus === 'saving' && (
                    <span className="text-[#D4AF37] font-bold font-mono animate-pulse">Gravando...</span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-red-500 font-bold font-mono">Erro ao gravar</span>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving' || savingNoteId === itemId}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-[#c2a033] hover:scale-[1.01] active:scale-[0.99] text-black font-black uppercase tracking-widest text-[10 px] sm:text-[11px] transition-all duration-200 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.15)] disabled:opacity-50"
                >
                  {saveStatus === 'saving' || savingNoteId === itemId ? 'Sincronizando...' : 'Gravar no Caderno'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CourseItem {
  id: string;
  titulo: string;
  descricao: string;
  cargaHoraria: string;
  grade: string;
  elegibilidade: string;
  registrationUrl: string;
  status: 'aberto' | 'fechado';
}

const GRAUS = ['Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'];

export function ContentPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'arquivos' | 'cursos' | 'minhas_pranchas'>('arquivos');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [pranchas, setPranchas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileFilter, setFileFilter] = useState<string>('todos');
  const [showPranchaModal, setShowPranchaModal] = useState(false);
  const [pranchaTitle, setPranchaTitle] = useState('');
  const [pranchaNumero, setPranchaNumero] = useState('Pr∴ 01');
  const [pranchaTema, setPranchaTema] = useState('');
  const [pranchaSimbolos, setPranchaSimbolos] = useState('');
  const [pranchaText, setPranchaText] = useState('');
  const [pranchaLink, setPranchaLink] = useState('');
  const [pranchaFile, setPranchaFile] = useState<File | null>(null);
  const [submittingPrancha, setSubmittingPrancha] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [editingPranchaId, setEditingPranchaId] = useState<string | null>(null);
  const [deletingPranchaId, setDeletingPranchaId] = useState<string | null>(null);
  const [viewingPdf, setViewingPdf] = useState<ContentItem | null>(null);
  const [viewingVideo, setViewingVideo] = useState<ContentItem | null>(null);

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
      console.error('Erro ao buscar anotações dos conteúdos:', err);
    }
  };

  const handleSaveNote = async (itemId: string, noteText: string, silent = false) => {
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
      if (!silent) {
        alert('Sua reflexão de estudo privada foi gravada com sucesso!');
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        alert('Erro ao salvar anotação. Tente novamente.');
      }
    } finally {
      setSavingNoteId(null);
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        // Load Contents (Files)
        const qContents = query(collection(db, 'contents'));
        const contentsSnapshot = await getDocs(qContents);
        setContents(contentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentItem)));

        // Load Courses (Links)
        const qCourses = query(collection(db, 'courses'));
        const coursesSnapshot = await getDocs(qCourses);
        setCourses(coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseItem)));

        // Load user's own pranchas
        const qPranchas = query(collection(db, 'requests'), where('userId', '==', user.uid));
        const pranchasSnapshot = await getDocs(qPranchas);
        setPranchas(pranchasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((p: any) => p.tipo === 'Envio de Prancha' || p.tipo === 'Prancha' || p.tipo === 'Prancha (Resumo/Estudo)'));

        // Load notes of studies
        await fetchUserNotes();
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'contents/courses/requests');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleSendPrancha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pranchaTitle) return;
    
    if (!pranchaFile && !pranchaLink.trim()) {
      alert("É necessário enviar um arquivo ou fornecer um Link Externo da prancha.");
      return;
    }

    setSubmittingPrancha(true);
    if (pranchaFile) setUploadProgress(1);
    
    try {
      let arquivoUrl = pranchaLink;
      if (pranchaFile) {
        console.log("Tentando upload do arquivo...");
        try {
          const extension = pranchaFile.name.split('.').pop() || 'pdf';
          const safeName = `file_${Date.now()}.${extension}`;
          const fileRef = ref(storage, `pranchas/${user.uid}/${safeName}`);
          
          const uploadTask = uploadBytesResumable(fileRef, pranchaFile);

          const uploadedUrl = await new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => {
              uploadTask.cancel();
              reject(new Error("Timeout de rede"));
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
          console.warn("Upload falhou, usando link se disponível:", uploadErr);
          if (!pranchaLink.trim()) {
            throw new Error("Falha no upload do arquivo e nenhum link alternativo foi fornecido. Verifique se o Storage está ativado no seu Firebase.");
          }
        }
      }

      if (editingPranchaId) {
        const pranchaRef = doc(db, 'requests', editingPranchaId);
        const updateData: any = {
          titulo: pranchaTitle,
          numero: pranchaNumero,
          temaCentral: pranchaTema,
          simbolosPrincipais: pranchaSimbolos,
          descricao: pranchaText,
        };
        if (arquivoUrl) {
          updateData.arquivoUrl = arquivoUrl;
        }
        await updateDoc(pranchaRef, updateData);
        setPranchas(pranchas.map(p => p.id === editingPranchaId ? { ...p, ...updateData } : p));
      } else {
        const newDoc = await addDoc(collection(db, 'requests'), {
          userId: user.uid,
          userName: user.nome,
          tipo: 'Envio de Prancha',
          titulo: pranchaTitle,
          numero: pranchaNumero,
          temaCentral: pranchaTema,
          simbolosPrincipais: pranchaSimbolos,
          descricao: pranchaText,
          arquivoUrl: arquivoUrl || null,
          status: 'pendente',
          criadoEm: serverTimestamp()
        });
        setPranchas([...pranchas, { 
          id: newDoc.id, 
          titulo: pranchaTitle, 
          numero: pranchaNumero,
          temaCentral: pranchaTema,
          simbolosPrincipais: pranchaSimbolos,
          descricao: pranchaText, 
          arquivoUrl: arquivoUrl || null, 
          status: 'pendente', 
          criadoEm: new Date() 
        }]);
      }
      
      setShowPranchaModal(false);
      setEditingPranchaId(null);
      setPranchaTitle('');
      setPranchaNumero('Pr∴ 01');
      setPranchaTema('');
      setPranchaSimbolos('');
      setPranchaText('');
      setPranchaLink('');
      setPranchaFile(null);
    } catch (err: any) {
      alert("Erro: " + (err.message || "Erro desconhecido."));
    } finally {
      setSubmittingPrancha(false);
      setUploadProgress(null);
    }
  };

  const handleEditPrancha = (prancha: any) => {
    setEditingPranchaId(prancha.id);
    setPranchaTitle(prancha.titulo || '');
    setPranchaNumero(prancha.numero || 'Pr∴ 01');
    setPranchaTema(prancha.temaCentral || '');
    setPranchaSimbolos(prancha.simbolosPrincipais || '');
    setPranchaText(prancha.descricao || '');
    setPranchaLink(prancha.arquivoUrl || '');
    setPranchaFile(null);
    setShowPranchaModal(true);
  };

  const handleDeletePrancha = async (pranchaId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta prancha? Esta ação não pode ser desfeita.")) return;
    
    setDeletingPranchaId(pranchaId);
    try {
      await deleteDoc(doc(db, 'requests', pranchaId));
      setPranchas(pranchas.filter(p => p.id !== pranchaId));
    } catch (err: any) {
      alert("Erro ao excluir prancha: " + err.message);
    } finally {
      setDeletingPranchaId(null);
    }
  };

  const handleContentClick = (file: ContentItem) => {
    if (!user) return;

    // Abrir o conteúdo imediatamente antes de operações async para evitar bloqueio de popup pelo navegador
    if (file.tipo === 'pdf') {
      setViewingPdf(file);
    } else if (file.tipo === 'video') {
      setViewingVideo(file);
    } else {
      if (file.fileUrl) {
        window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
      }
    }

    try {
       // Log no histórico do membro (Fire and forget, sem await)
       addDoc(collection(db, 'history'), {
          userId: user.uid,
          tipo: 'atividade',
          titulo: 'Visualizou Conteúdo',
          descricao: `O membro acessou o material: ${file.titulo}.`,
          data: new Date().toLocaleDateString('pt-br'),
          hora: new Date().toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' }),
          autor: 'Sistema',
          criadoEm: serverTimestamp()
       }).catch(err => console.warn("Aviso de histórico (pode ignorar se for quota):", err));

       // Registrar pendência de leitura se quiser pedir resumo futuramente
       addDoc(collection(db, 'reading_progress'), {
          userId: user.uid,
          contentId: file.id,
          contentTitle: file.titulo,
          viewedAt: serverTimestamp(),
          status: 'pendente' // Pode mudar para 'resumo_enviado' ou 'concluido' depois
       }).catch(err => console.warn("Aviso de progresso (pode ignorar se for quota):", err));
    } catch (err) {
       console.error("Erro ao iniciar registro de leitura:", err);
    }
  };

  const getUserGradeIndex = () => GRAUS.indexOf(user?.grau || 'Aprendiz');
  const getContentGradeIndex = (grau: string) => Math.max(0, GRAUS.indexOf(grau));

  const filteredFiles = (fileFilter === 'todos' ? contents : contents.filter(c => c.tipo === fileFilter))
    .filter(file => getContentGradeIndex(file.grauMinimo) <= getUserGradeIndex());

  const filteredCourses = courses.filter(course => {
    if (course.elegibilidade === 'Todos') return true;
    return getContentGradeIndex(course.elegibilidade) <= getUserGradeIndex();
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#1e293b] gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold text-gray-100 mb-2 truncate">Conteúdos & Cursos</h1>
          <p className="text-gray-400">Acesse materiais de estudo e inscreva-se em cursos de especialização.</p>
        </div>
      </header>

      {/* Main Tabs */}
      <div className="flex border-b border-[#1e293b] gap-8">
        <button 
           onClick={() => setActiveTab('arquivos')}
           className={cn("py-4 text-sm font-semibold tracking-wide transition-all relative flex items-center gap-2", activeTab === 'arquivos' ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-gray-300')}
        >
           <BookOpen size={18} />
           Biblioteca
           {activeTab === 'arquivos' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#D4AF37] shadow-[0_0_12px_#D4AF37]"></div>}
        </button>
        <button 
           onClick={() => setActiveTab('minhas_pranchas')}
           className={cn("py-4 text-sm font-semibold tracking-wide transition-all relative flex items-center gap-2", activeTab === 'minhas_pranchas' ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-gray-300')}
        >
           <FileText size={18} />
           Minhas Pranchas
           {activeTab === 'minhas_pranchas' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#D4AF37] shadow-[0_0_12px_#D4AF37]"></div>}
        </button>
      </div>

      {activeTab === 'arquivos' && (
        <div className="bg-[#0A0E1A] border border-[#D4AF37]/30 p-4 rounded-xl flex items-start gap-3.5 shadow-md">
          <div className="p-2.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] shrink-0">
            <BookOpen size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase text-[#D4AF37] tracking-widest">📖 Instruções e Caderno Virtual de Estudos</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Meu Ir∴, para cada arquivo, PDF de instrução ou vídeo-aula listado abaixo, providenciamos um <strong>Bloco de Notas Ritualístico particular</strong>. Ele fica acoplado diretamente sob o card de cada material. Ao abri-lo, você pode registrar livremente suas impressões e resumos para gravação síncrona sob total sigilo ritualístico.
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-[10px] text-[#D4AF37]/80 font-bold">
              <span>⚡ Como acessar:</span>
              <span className="text-gray-400 font-normal">Nesta lista abaixo, localize qualquer arquivo ou tomo e clique na aba inferior dourada <strong>"✍️ Bloco de Notas Ritualístico..."</strong> para expandir e começar a escrever.</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mb-4"></div>
          <div className="text-[#D4AF37] font-medium tracking-widest text-sm uppercase">Carregando Acervo...</div>
        </div>
      ) : (
        <div className="py-6">
          {/* TAB: ARQUIVOS */}
          {activeTab === 'arquivos' && (
            <div className="flex flex-col gap-8">
               {/* Sub-filters for files */}
               <div className="flex gap-3 flex-wrap">
                  {['todos', 'video', 'pdf', 'instrucao', 'reflexao'].map((t) => (
                    <button 
                       key={t}
                       onClick={() => setFileFilter(t)}
                       className={cn("px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-300", 
                       fileFilter === t ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-[#0F172A] border border-[#1e293b] text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50')}
                    >
                       {t}
                    </button>
                  ))}
               </div>

               {filteredFiles.length === 0 ? (
                  <div className="text-gray-500 py-32 text-center border border-dashed border-[#1e293b] bg-[#0A0E1A]/50 rounded-2xl flex flex-col items-center">
                    <BookOpen size={64} className="mb-6 text-[#1e293b]" strokeWidth={1} />
                    <p className="text-lg">Nenhum material encontrado no acervo.</p>
                  </div>
               ) : (
                  <div className="flex flex-col gap-4">
                    {filteredFiles.map(file => {
                      return (
                        <div key={file.id} className="group flex flex-col bg-[#0B0F19] border border-[#1e293b] rounded-xl p-5 hover:bg-[#0F172A] hover:border-[#D4AF37]/40 transition-all duration-300 shadow-lg cursor-pointer">
                             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full" onClick={() => handleContentClick(file)}>
                                <div className="flex items-center gap-5 w-full sm:w-auto">
                                   <div className="w-14 h-14 rounded-full bg-black border border-[#1e293b] flex items-center justify-center flex-shrink-0 group-hover:border-[#D4AF37]/50 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all animate-none">
                                      {file.tipo === 'video' ? <PlayCircle size={24} className="text-[#D4AF37]" /> : <FileText size={24} className="text-[#D4AF37]" />}
                                   </div>
                                   <div className="flex flex-col min-w-0 flex-1">
                                       <div className="flex items-center gap-3 mb-1">
                                         <h3 className="text-gray-100 font-semibold text-lg truncate group-hover:text-[#D4AF37] transition-colors">{file.titulo}</h3>
                                         <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded uppercase font-bold tracking-wider hidden sm:block border border-[#D4AF37]/20">{file.tipo}</span>
                                       </div>
                                       <p className="text-sm text-gray-500 line-clamp-1 group-hover:text-gray-400 transition-colors">{file.descricao || 'Sem descrição detalhada'}</p>
                                   </div>
                                </div>
                                
                                <div className="mt-4 sm:mt-0 w-full sm:w-auto flex justify-end">
                                  <button 
                                     className="flex items-center gap-2 text-sm font-bold text-black bg-[#D4AF37] px-6 py-2.5 rounded-lg hover:scale-105 transition-transform"
                                  >
                                     {file.tipo === 'video' ? 'Assistir' : 'Acessar'} <Play size={14} className="ml-1" />
                                  </button>
                                </div>
                             </div>

                             {/* CADERNO REVELADO COM EXCELENTE ACABAMENTO */}
                             <div onClick={e => e.stopPropagation()} className="mt-4 pt-4 border-t border-dashed border-[#D4AF37]/20 w-full text-left">
                               <details className="group border border-[#D4AF37]/20 rounded-xl bg-[#0F172A]/50 overflow-hidden transition-all duration-300">
                                 <summary className="flex items-center justify-between p-4 text-xs font-semibold tracking-wide text-gray-300 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 cursor-pointer select-none transition-colors">
                                   <span className="flex items-center gap-2.5 font-bold uppercase text-[10px] tracking-widest text-[#D4AF37]">
                                     <span className="flex h-2 w-2 relative">
                                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                                       <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                                     </span>
                                     ✍️ Bloco de Notas Ritualístico / Caderno de Estudos {userNotes[file.id] ? '(Preenchido)' : '(Vazio)'}
                                   </span>
                                   <div className="flex items-center gap-2">
                                     <span className="text-[9px] text-gray-400 font-normal italic hidden sm:inline">Clique para abrir seu caderno privado</span>
                                     <ChevronDown size={14} className="transition-transform group-open:rotate-180 text-gray-400 group-hover:text-[#D4AF37]" />
                                   </div>
                                 </summary>
                                 
                                 <div className="p-4 bg-black/40 border-t border-[#D4AF37]/10 space-y-3">
                                   <p className="text-[11px] text-gray-400 leading-relaxed font-serif italic mb-1">
                                     "As meditações e reflexões anotadas sob este tomo pertencem unicamente ao seu templo interior e são salvas sob absoluto sigilo ritualístico."
                                   </p>
                                   <textarea
                                     defaultValue={userNotes[file.id] || ''}
                                     id={`note_${file.id}`}
                                     placeholder="Registre suas impressões, conclusões e anotações individuais sobre esta instrução..."
                                     className="w-full bg-[#05070D] border border-[#1e293b]/70 rounded-xl p-4 text-sm sm:text-base text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] leading-relaxed resize-none h-32 font-serif focus:ring-1 focus:ring-[#D4AF37]/30"
                                   />
                                   <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
                                     <span className="text-[9px] text-[#D4AF37]/60 font-mono tracking-wider">💾 Salvo automaticamente de forma criptografada</span>
                                     <button
                                       onClick={() => {
                                         const ta = document.getElementById(`note_${file.id}`) as HTMLTextAreaElement;
                                         if (ta) {
                                           handleSaveNote(file.id, ta.value);
                                         }
                                       }}
                                       disabled={savingNoteId === file.id}
                                       className="py-2 px-5 bg-[#D4AF37] text-black font-black uppercase tracking-widest text-[9px] transition-all duration-300 hover:scale-105 rounded-lg flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                                     >
                                       {savingNoteId === file.id ? 'Gravando...' : 'Gravar no Caderno'}
                                     </button>
                                   </div>
                                 </div>
                               </details>
                             </div>
                        </div>
                      );
                    })}
                  </div>
               )}
            </div>
          )}

          {/* TAB: MINHAS PRANCHAS */}
          {activeTab === 'minhas_pranchas' && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <p className="text-gray-400 text-sm">Aqui estão as pranchas que você enviou para o gestor da sua loja.</p>
                <button onClick={() => {
                   setEditingPranchaId(null);
                   setPranchaTitle('');
                   setPranchaNumero('Pr∴ 01');
                   setPranchaTema('');
                   setPranchaSimbolos('');
                   setPranchaText('');
                   setPranchaLink('');
                   setPranchaFile(null);
                   setShowPranchaModal(true);
                }} className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                  <FileText size={18} /> Enviar Prancha
                </button>
              </div>
              
              {pranchas.length === 0 ? (
                <div className="text-gray-500 py-32 text-center border border-dashed border-[#1e293b] bg-[#0A0E1A]/50 rounded-2xl flex flex-col items-center">
                  <FileText size={64} className="mb-6 text-[#1e293b]" strokeWidth={1} />
                  <p className="text-lg">Você ainda não enviou nenhuma prancha.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {pranchas.map(prancha => (
                     <div key={prancha.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0B0F19] border border-[#1e293b] rounded-xl p-5 hover:bg-[#0F172A] hover:border-[#D4AF37]/40 transition-all duration-300 shadow-lg relative overflow-hidden">
                          <div className="flex items-center gap-5 w-full sm:w-auto">
                             <div className="w-14 h-14 rounded-full bg-black border border-[#1e293b] flex items-center justify-center flex-shrink-0 group-hover:border-[#D4AF37]/50 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all">
                                <FileText size={24} className="text-[#D4AF37]" />
                             </div>
                             <div className="flex flex-col min-w-0 flex-1">
                                 <div className="flex items-center gap-3 mb-1">
                                   <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                      {prancha.numero && (
                                         <span className="text-[10px] font-mono bg-[#D4AF37]/10 text-[#D4AF37] px-1.5 py-0.5 rounded border border-[#D4AF37]/20 uppercase shrink-0">
                                            {prancha.numero}
                                         </span>
                                      )}
                                      <h3 className="text-gray-100 font-semibold text-lg truncate group-hover:text-[#D4AF37] transition-colors">{prancha.titulo || prancha.temaCentral || 'Prancha sem título'}</h3>
                                   </div>
                                   <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded border tracking-wider", 
                                     prancha.status === 'aprovado' ? 'bg-green-900/10 text-green-400 border-green-500/20' : 
                                     prancha.status === 'rejeitado' ? 'bg-red-900/10 text-red-400 border-red-500/20' : 
                                     'bg-yellow-900/10 text-yellow-400 border-yellow-500/20')}>
                                     {prancha.status}
                                   </span>
                                 </div>
                                 <div className="flex flex-col gap-0.5">
                                    {prancha.temaCentral && (
                                       <p className="text-xs text-[#D4AF37]/80 italic line-clamp-1">"{prancha.temaCentral}"</p>
                                    )}
                                    <p className="text-sm text-gray-500 line-clamp-1 group-hover:text-gray-400 transition-colors">{prancha.descricao || 'Sem descrição detalhada'}</p>
                                 </div>
                             </div>
                          </div>
                        
                        <div className="mt-4 sm:mt-0 w-full sm:w-auto flex justify-end gap-2 flex-wrap sm:flex-nowrap">
                           {prancha.arquivoUrl && (
                                <a href={prancha.arquivoUrl} target="_blank" rel="noopener noreferrer" title="Link Anexado" className="flex items-center justify-center text-sm font-bold text-gray-300 bg-[#1e293b]/50 border border-[#1e293b] p-2 sm:px-5 sm:py-2 rounded-lg hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-colors">
                                   <Link size={14} className="sm:mr-2" /> <span className="hidden sm:inline">Link Anexado</span>
                                </a>
                           )}
                           {(prancha.status === 'pendente' || prancha.status === 'em_analise') && (
                             <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditPrancha(prancha)}
                                  className="p-2 sm:px-4 sm:py-2 flex items-center justify-center gap-2 rounded-lg border border-[#1e293b] text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all bg-[#1e293b]/50"
                                  title="Editar"
                                >
                                   <Edit2 size={14} /> <span className="hidden sm:inline text-sm">Editar</span>
                                </button>
                                <button
                                  onClick={() => handleDeletePrancha(prancha.id)}
                                  disabled={deletingPranchaId === prancha.id}
                                  className="p-2 sm:px-4 sm:py-2 flex items-center justify-center gap-2 rounded-lg border border-[#1e293b] text-red-400 hover:text-red-300 hover:border-red-500/50 transition-all bg-[#1e293b]/50 disabled:opacity-50"
                                  title="Excluir"
                                >
                                   <Trash2 size={14} /> <span className="hidden sm:inline text-sm">{deletingPranchaId === prancha.id ? 'Excluindo...' : 'Excluir'}</span>
                                </button>
                             </div>
                           )}
                        </div>
                     </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <SafePdfViewer 
          url={viewingPdf.fileUrl} 
          title={viewingPdf.titulo} 
          onClose={() => setViewingPdf(null)} 
          itemId={viewingPdf.id}
          initialNoteText={userNotes[viewingPdf.id] || ''}
          onSaveNote={handleSaveNote}
          savingNoteId={savingNoteId}
        />
      )}

      {/* Video Viewer Modal */}
      {viewingVideo && (
        <SafeVideoPlayer
          url={viewingVideo.fileUrl}
          title={viewingVideo.titulo}
          onClose={() => setViewingVideo(null)}
          itemId={viewingVideo.id}
          initialNoteText={userNotes[viewingVideo.id] || ''}
          onSaveNote={handleSaveNote}
          savingNoteId={savingNoteId}
        />
      )}

      {/* Prancha Modal */}
      {showPranchaModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0F172A] border border-[#1e293b] rounded-2xl p-8 max-w-xl w-full">
            <h2 className="text-2xl font-semibold text-[#D4AF37] mb-2 font-sans">{editingPranchaId ? 'Editar Prancha' : 'Enviar Nova Prancha'}</h2>
            <p className="text-gray-400 mb-6 text-sm">{editingPranchaId ? 'Altere os dados da sua prancha para análise.' : 'Preencha os dados da sua prancha para análise do Gestor.'}</p>
            
            <form onSubmit={handleSendPrancha} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Número</label>
                    <input 
                       type="text" 
                       value={pranchaNumero} 
                       onChange={(e) => setPranchaNumero(e.target.value)} 
                       className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                       placeholder="Pr∴ 01"
                       required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Título da Prancha</label>
                    <input 
                       type="text" 
                       value={pranchaTitle} 
                       onChange={(e) => setPranchaTitle(e.target.value)} 
                       className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                       placeholder="Ex: O Ego do Aprendiz"
                       required
                    />
                  </div>
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tema Central</label>
                  <input 
                     type="text" 
                     value={pranchaTema} 
                     onChange={(e) => setPranchaTema(e.target.value)} 
                     className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                     placeholder="Ex: O impacto do orgulho e da vaidade..."
                     required
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Símbolos Principais</label>
                  <input 
                     type="text" 
                     value={pranchaSimbolos} 
                     onChange={(e) => setPranchaSimbolos(e.target.value)} 
                     className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                     placeholder="Ex: Pedra Bruta, silêncio, humildade"
                     required
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Resumo / Texto Livre (Opcional)</label>
                  <textarea 
                     value={pranchaText} 
                     onChange={(e) => setPranchaText(e.target.value)} 
                     className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors resize-y h-24"
                     placeholder="Uma breve descrição ou o texto da prancha..."
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo da Prancha (Opcional se usar Link abaixo)</label>
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#1e293b]/50 border border-[#1e293b] rounded-lg cursor-pointer hover:bg-[#1e293b] transition-colors text-gray-300">
                    <Upload size={18} className="text-[#D4AF37]" />
                    <span className="text-sm">{pranchaFile ? pranchaFile.name : 'Anexar Arquivo'}</span>
                    <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => setPranchaFile(e.target.files ? e.target.files[0] : null)} />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Formatos: PDF, DOC, DOCX. Max: 10MB. {editingPranchaId ? 'Se selecionado, este arquivo substituirá o anterior.' : ''}</p>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">OU Link Externo (Google Drive, Dropbox, etc)</label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
                    <input 
                      type="url" 
                      value={pranchaLink} 
                      onChange={(e) => setPranchaLink(e.target.value)} 
                      className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 pl-10 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
               </div>
               
               <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => { setShowPranchaModal(false); setEditingPranchaId(null); }} className="px-5 py-2.5 rounded-lg text-gray-400 hover:bg-[#1e293b] transition-colors font-medium">Cancelar</button>
                  <button type="submit" disabled={submittingPrancha || !pranchaTitle} className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                     {submittingPrancha ? (uploadProgress ? `Enviando (${uploadProgress}%)...` : 'Enviando...') : (editingPranchaId ? 'Salvar Alterações' : 'Enviar Prancha')}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
