import React, { useState, useEffect } from 'react';
import { Award, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('welcome_popup_seen_premium_2026_05_18');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('welcome_popup_seen_premium_2026_05_18', 'true');
      }, 1500); // Aparece 1.5s após carregar
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-[#0A0E1A] border border-[#D4AF37]/50 rounded-3xl p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(212,175,55,0.2)]"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 bg-[#D4AF37]/20 rounded-full flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                <Award size={40} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#D4AF37] mb-2" style={{fontFamily: 'Cinzel'}}>Atualização Premium!</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  O G∴O∴M∴A∴U∴ recebeu novas atualizações projetadas para melhorar sua jornada de estudos.
                </p>
              </div>

              <div className="w-full space-y-3">
                <div className="bg-[#1e293b]/30 rounded-2xl p-4 border border-[#1e293b]">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center text-[#D4AF37]">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Fórum de Estudos</p>
                      <p className="text-xs text-gray-300">Salas segmentadas por graus (Ap., Comp., Mestr.) orientadas por Instrutores.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1e293b]/30 rounded-2xl p-4 border border-[#1e293b]">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center text-[#D4AF37]">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Sessão Estendida</p>
                      <p className="text-xs text-gray-300">Tempo de permanência logado ampliado para 60 minutos inativos.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsOpen(false)}
                className="w-full bg-[#D4AF37] text-black py-4 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-[#D4AF37]/20"
              >
                Prosseguir
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
