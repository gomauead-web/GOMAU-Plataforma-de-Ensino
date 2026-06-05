import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Detecta se dispositivo é mobile
  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Detecta se já está instalado (standalone)
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true ||
    localStorage.getItem('pwa-installed-gomau') === 'true'
  );

  useEffect(() => {
    if (!isMobile || isStandalone) {
      setIsVisible(false);
      return;
    }

    // 1. Ouvir evento de app instalado para sumir de vez e salvar estado permanente
    const onAppInstalled = () => {
      console.log('[PWA Component] Aplicativo instalado com sucesso pelo prompt do componente.');
      localStorage.setItem('pwa-installed-gomau', 'true');
      setIsVisible(false);
    };
    window.addEventListener('appinstalled', onAppInstalled);

    // 2. Verifica se o prompt já foi capturado muito cedo no index.html
    const existingPrompt = (window as any).deferredPWAInstallPrompt;
    if (existingPrompt) {
      console.log('[PWA Component] Evento PWA já existia no escopo global.');
      setDeferredPrompt(existingPrompt);
      const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!isDismissed) {
        setIsVisible(true);
      }
    }

    // 3. Ouvinte para capturar o evento nativo clássico se ele disparar depois de montado
    const handler = (e: any) => {
      e.preventDefault();
      console.log('[PWA Component] Evento beforeinstallprompt capturado no React.');
      setDeferredPrompt(e);
      (window as any).deferredPWAInstallPrompt = e;
      const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    // 4. Ouvinte especial para o evento customizado disparado pelo index.html
    const customHandler = (e: any) => {
      console.log('[PWA Component] Recebeu evento customizado pwa-prompt-ready.');
      if (e.detail) {
        setDeferredPrompt(e.detail);
        const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
        if (!isDismissed) {
          setIsVisible(true);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('pwa-prompt-ready', customHandler);

    // Ouvinte para tentar instalação automática imediata no primeiro clique da tela
    const autoTriggerOnFirstTap = () => {
      const activePrompt = (window as any).deferredPWAInstallPrompt || deferredPrompt || existingPrompt;
      if (activePrompt) {
        console.log('[PWA Component] Forçando abertura de tela de instalação por interação inicial...');
        try {
          activePrompt.prompt();
          activePrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
              (window as any).deferredPWAInstallPrompt = null;
              setDeferredPrompt(null);
              setIsVisible(false);
              localStorage.setItem('pwa-installed-gomau', 'true');
            }
          });
        } catch (err) {
          console.log('[PWA Component] Erro ao invocar prompt nativo:', err);
        }
        cleanup();
      }
    };

    const cleanup = () => {
      document.removeEventListener('click', autoTriggerOnFirstTap);
      document.removeEventListener('touchstart', autoTriggerOnFirstTap);
    };

    // Se já estiver pronto na inicialização, ouve o primeiro toque para abrir o instalador nativo
    document.addEventListener('click', autoTriggerOnFirstTap, { once: true });
    document.addEventListener('touchstart', autoTriggerOnFirstTap, { once: true });

    // Detecta iOS para dar instrução manual (visto que iOS não tem beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Se for iOS e não estiver no modo Standalone em uma aba pai
    if (isIOS && !isStandalone) {
       try {
         if (window === window.top) { // Só mostra se estiver fora de iFrame do preview
            const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
            if (!isDismissed) {
              setIsVisible(true);
            }
         }
       } catch (e) {}
    }

    return () => {
      window.removeEventListener('appinstalled', onAppInstalled);
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('pwa-prompt-ready', customHandler);
      cleanup();
    };
  }, [deferredPrompt, isMobile, isStandalone]);

  const handleInstall = async () => {
    const activePrompt = deferredPrompt || (window as any).deferredPWAInstallPrompt;
    if (!activePrompt) {
      toastInfo();
      return;
    }
    
    try {
      activePrompt.prompt();
      const { outcome } = await activePrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      if (outcome === 'accepted') {
        (window as any).deferredPWAInstallPrompt = null;
        setDeferredPrompt(null);
        setIsVisible(false);
      }
    } catch (err) {
      console.error('Falha ao abrir instalador do celular:', err);
    }
  };

  const toastInfo = () => {
    console.log('Navegador não disparou o trigger PWA ainda ou app já está instalado.');
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  // Se já está instalado, não exibe nada
  if (isStandalone) return null;
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99] w-[92%] max-w-sm"
      >
        <div className="bg-[#0f172a]/95 backdrop-blur-xl border-2 border-[#D4AF37] rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4AF37]/15 rounded-xl flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/35 shrink-0 animate-pulse">
              <Download size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Instalar App GOMAU</p>
              {isIOS ? (
                <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                  Toque no ícone de <b className="text-[#D4AF37]">Compartilhar</b> e escolha <b className="text-[#D4AF37]">Adicionar à Tela de Início</b>.
                </p>
              ) : (
                <p className="text-[10px] text-gray-300 leading-tight">Instalação imediata do aplicativo de segurança</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {!isIOS && (
              <button 
                onClick={handleInstall}
                className="bg-[#D4AF37] text-[#0A0E1A] text-xs font-extrabold px-3 py-2 rounded-lg shadow-md shadow-[#D4AF37]/20 hover:scale-[1.03] active:scale-[0.98] transition-all uppercase tracking-wider"
              >
                Instalar
              </button>
            )}
            <button 
              onClick={handleDismiss}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
