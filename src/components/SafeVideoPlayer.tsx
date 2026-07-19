import React, { useState, useEffect } from 'react';
import { Play, Pause, X, Lock, ShieldAlert, BookOpen, Volume2, Maximize, AlertCircle, Headphones } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { SessionTimer } from './Layout';
import { useAuth } from '../contexts/AuthContext';
import { getAppLogo } from '../utils/logo';

interface SafeVideoPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
  itemId?: string;
  initialNoteText?: string;
  onSaveNote?: (itemId: string, noteText: string, silent?: boolean) => Promise<void>;
  savingNoteId?: string | null;
}

// Extract YouTube ID safely
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function SafeVideoPlayer({
  url,
  title,
  onClose,
  itemId,
  initialNoteText = '',
  onSaveNote,
  savingNoteId
}: SafeVideoPlayerProps) {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNoteSidebar, setShowNoteSidebar] = useState(true);
  const [localNoteText, setLocalNoteText] = useState(initialNoteText);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setLocalNoteText(initialNoteText);
    setSaveStatus('idle');
  }, [initialNoteText]);

  const videoId = getYouTubeId(url);
  const embedUrl = videoId 
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&controls=1&enablejsapi=1` 
    : '';

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

  return (
    <div className="fixed inset-0 bg-black/98 z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="bg-[#0A0E1A] border-b border-[#D4AF37]/30 p-4 flex items-center justify-between shadow-2xl relative z-50 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex-shrink-0 flex items-center justify-center border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <ShieldAlert size={20} className="text-[#D4AF37]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-gray-100 font-semibold text-base sm:text-lg leading-tight truncate">{title}</h3>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
              <p className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold">Transmissão Ritualística Segura</p>
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
            <Lock size={12} /> Proteção DRM Ativa
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row relative bg-[#05070D] overflow-hidden">
        
        {/* Left Area: Video Player / Cover */}
        <div className="flex-1 h-full relative flex items-center justify-center overflow-hidden bg-black">
          <style>{`
            @keyframes masonic-wave {
              0%, 100% { transform: scaleY(0.35); }
              50% { transform: scaleY(1.4); }
            }
            .bar-1 { animation: masonic-wave 0.8s ease-in-out infinite; }
            .bar-2 { animation: masonic-wave 1.1s ease-in-out infinite; }
            .bar-3 { animation: masonic-wave 0.9s ease-in-out infinite; }
            .bar-4 { animation: masonic-wave 1.3s ease-in-out infinite; }
            .bar-5 { animation: masonic-wave 1.0s ease-in-out infinite; }
            .bar-6 { animation: masonic-wave 1.2s ease-in-out infinite; }
            .bar-7 { animation: masonic-wave 0.7s ease-in-out infinite; }
          `}</style>

          {/* Custom G.O.M.A.U. Elegant Video Cover */}
          {!isPlaying && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-[#0A0E1A] via-[#05070D] to-[#010204] p-6 text-center select-none animate-in fade-in duration-350">
              {/* Background ambient light */}
              <div className="absolute w-[300px] h-[300px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none transition-all duration-1000"></div>
              
              {/* Logo GOMAU */}
              <div className="relative mb-8 group cursor-pointer" onClick={() => setIsPlaying(true)}>
                <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-full blur-2xl group-hover:bg-[#D4AF37]/20 transition-all duration-500 animate-pulse"></div>
                
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-[#D4AF37]/30 p-4 bg-[#0A0E1A]/80 backdrop-blur-md flex items-center justify-center transition-all duration-500 group-hover:border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.15)] group-hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] relative z-10">
                  <img 
                    src={getAppLogo(user)} 
                    alt="GOMAU Logo" 
                    className="w-24 h-24 md:w-28 md:h-28 object-contain pointer-events-none select-none transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback in case of image missing
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                
                {/* Absolute Golden Play/Pause Ring Overlay */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] hover:bg-[#c2a033] text-black w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_20px_#D4AF37] hover:scale-110 active:scale-95 transition-all z-20">
                  <Play size={22} className="ml-0.5 fill-current" />
                </div>
              </div>

              {/* Video Title */}
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-sans text-gray-100 max-w-2xl px-4 leading-tight mb-2 tracking-wide group-hover:text-[#D4AF37] transition-colors relative z-10">
                {title}
              </h2>
              
              {/* Visual Equalizer / State Indicator */}
              <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent my-6 relative z-10"></div>
              
              <p className="text-gray-400 text-xs md:text-sm max-w-md leading-relaxed font-sans px-4 relative z-10">
                Clique no botão de reprodução acima para assistir à instrução em vídeo.
              </p>

              <div className="mt-8 flex items-center gap-2 text-[10px] text-[#D4AF37]/70 uppercase tracking-widest font-bold relative z-10">
                <ShieldAlert size={14} /> Reprodução Confidencial Autorizada
              </div>
            </div>
          )}

          {/* Secure Video Player Iframe */}
          {isPlaying && videoId && (
            <div className="absolute inset-0 w-full h-full z-10 bg-black flex items-center justify-center animate-in fade-in duration-350">
              <iframe
                src={embedUrl}
                title={title}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
              
              {/* Floating button to return to cover/pause if desired */}
              <button
                onClick={() => setIsPlaying(false)}
                className="absolute top-4 left-4 bg-black/80 hover:bg-black text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#D4AF37]/50 transition-all text-[10px] font-bold uppercase tracking-wider z-20 shadow-lg cursor-pointer"
              >
                Voltar à Capa
              </button>
            </div>
          )}

          {/* Protective Frame Lines */}
          <div className="absolute inset-0 pointer-events-none border-[12px] md:border-[20px] border-[#05070D] z-30"></div>
          
        </div>

        {/* Right Area: Study Notebook (Caderno de Estudos) */}
        {showNoteSidebar && itemId && onSaveNote && (
          <div className="w-full md:w-[380px] lg:w-[440px] border-t md:border-t-0 md:border-l border-[#D4AF37]/20 bg-[#070911]/95 flex flex-col shrink-0 z-40 animate-in slide-in-from-right-4 duration-350 shadow-2xl">
            <div className="p-4 border-b border-[#D4AF37]/15 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                </span>
                <span className="text-[11px] uppercase tracking-widest font-black text-[#D4AF37] font-sans">Caderno de Estudos Privado</span>
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
                  placeholder="Inicie aqui seus apontamentos enquanto assiste a instrução guiada..."
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
                  className="w-full py-3 bg-[#D4AF37] hover:bg-[#c2a033] hover:scale-[1.01] active:scale-[0.99] text-black font-black uppercase tracking-widest text-[10px] sm:text-[11px] transition-all duration-200 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.15)] disabled:opacity-50"
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
