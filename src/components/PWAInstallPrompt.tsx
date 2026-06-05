import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // O evento `beforeinstallprompt` é suportado no Chrome/Edge. (Android e Desktop)
      e.preventDefault();
      setDeferredPrompt(e);
      const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detecta iOS para dar instrução manual (visto que iOS não tem beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    // Se for iOS e não estiver no modo App, e não estiver no iframe (AI Studio preview iframe = window !== window.top)
    if (isIOS && !isStandalone) {
       try {
         if (window === window.top) { // Só mostra se não estiver no iFrame do preview da IDE
            const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
            if (!isDismissed) {
              setIsVisible(true);
            }
         }
       } catch (e) {} // Evita erro de CORS do window.top
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Mostra o prompt de instalação
    deferredPrompt.prompt();
    
    // Espera a resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // Limpa o prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[90%] max-w-sm"
      >
        <div className="bg-[#1e293b]/95 backdrop-blur-md border border-[#D4AF37]/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center text-[#D4AF37] shrink-0">
              <Download size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Instalar GOMAU</p>
              {isIOS ? (
                <p className="text-[10px] text-gray-400 mt-1">
                  Toque em <b>Compartilhar</b> <br/>e em seguida <b>Adicionar à Tela de Início</b>.
                </p>
              ) : (
                <p className="text-[10px] text-gray-400">Acesse mais rápido pelo celular</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isIOS && (
              <button 
                onClick={handleInstall}
                className="bg-[#D4AF37] text-black text-xs font-bold px-4 py-2 rounded-lg hover:brightness-110 transition-all"
              >
                Instalar
              </button>
            )}
            <button 
              onClick={handleDismiss}
              className="p-2 text-gray-500 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
