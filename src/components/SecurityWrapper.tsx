import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ShieldAlert, EyeOff } from 'lucide-react';

interface SecurityWrapperProps {
  children: React.ReactNode;
}

export function SecurityWrapper({ children }: SecurityWrapperProps) {
  const [isProtected, setIsProtected] = useState(false);

  useEffect(() => {
    // 1. Prevent Right Click (Context Menu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error("Cópia e menu de contexto desativados por segurança.", {
        id: "sec-context-menu"
      });
    };

    // 2. Prevent Copy, Cut, Paste
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      // Overwrite clipboard if possible
      try {
        e.clipboardData?.setData('text/plain', 'CONTEÚDO PROTEGIDO G∴O∴M∴A∴U∴');
      } catch (err) {
        // Safe fallback if clipboard API is restricted
      }
      toast.error("A cópia de conteúdo é estritamente proibida.", {
        id: "sec-copy"
      });
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error("O corte de conteúdo é estritamente proibido.", {
        id: "sec-cut"
      });
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error("A colagem de conteúdo é desativada nesta área.", {
        id: "sec-paste"
      });
    };

    // 3. Prevent Drag and Selection
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    // 4. Block Keyboard Shortcuts (PrintScreen, Ctrl+C, Ctrl+X, Ctrl+P, F12, Ctrl+Shift+I, DevTools)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      // Print Screen
      if (e.key === 'PrintScreen' || key === 'printscreen') {
        e.preventDefault();
        try {
          navigator.clipboard.writeText('CONTEÚDO PROTEGIDO G∴O∴M∴A∴U∴');
        } catch (_) {}
        toast.error("Captura de tela detectada e bloqueada!", { id: "sec-printscreen" });
        return;
      }

      // Ctrl/Cmd + P (Print)
      if (isCmdOrCtrl && key === 'p') {
        e.preventDefault();
        toast.error("A impressão deste documento é proibida.", { id: "sec-print" });
        return;
      }

      // Ctrl/Cmd + C (Copy)
      if (isCmdOrCtrl && key === 'c') {
        e.preventDefault();
        toast.error("A cópia por atalho é desativada.", { id: "sec-copy-shortcut" });
        return;
      }

      // Ctrl/Cmd + X (Cut)
      if (isCmdOrCtrl && key === 'x') {
        e.preventDefault();
        toast.error("O corte por atalho é desativado.", { id: "sec-cut-shortcut" });
        return;
      }

      // Ctrl/Cmd + U (View Source)
      if (isCmdOrCtrl && key === 'u') {
        e.preventDefault();
        toast.error("Código fonte protegido pela administração.", { id: "sec-source" });
        return;
      }

      // F12 or Ctrl+Shift+I / Cmd+Opt+I (DevTools)
      if (e.key === 'F12' || key === 'f12') {
        e.preventDefault();
        toast.error("Acesso de inspeção restrito.", { id: "sec-devtools" });
        return;
      }

      if (isCmdOrCtrl && isShift && key === 'i') {
        e.preventDefault();
        toast.error("Acesso de inspeção restrito.", { id: "sec-devtools" });
        return;
      }

      if (isCmdOrCtrl && isShift && key === 'c') {
        e.preventDefault();
        toast.error("Acesso de inspeção restrito.", { id: "sec-devtools" });
        return;
      }

      if (isCmdOrCtrl && isShift && key === 'j') {
        e.preventDefault();
        toast.error("Acesso de inspeção restrito.", { id: "sec-devtools" });
        return;
      }
    };

    // 5. Visibility and Focus Change (Protects mobile screensharing, switching, and background capture)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsProtected(true);
      } else {
        // Add a tiny delay to clean up when returning
        setTimeout(() => {
          setIsProtected(false);
        }, 300);
      }
    };

    const handleBlur = () => {
      // Blur can happen on some input helpers, so we only apply blur if the document actually lost active window focus
      if (!document.hasFocus()) {
        setIsProtected(true);
      }
    };

    const handleFocus = () => {
      setIsProtected(false);
    };

    // Attach Event Listeners globally
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('keydown', handleKeyDown);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      // Cleanup Event Listeners
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('keydown', handleKeyDown);
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full">
      {/* Main Content wrapper - will blur if isProtected is active */}
      <div className={isProtected ? 'filter blur-2xl pointer-events-none transition-all duration-300 select-none' : 'transition-all duration-300'}>
        {children}
      </div>

      {/* Screen Protection Shield Overlay */}
      {isProtected && (
        <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#05070A]/95 p-6 text-center select-none animate-fade-in font-sans">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-full blur-xl animate-pulse"></div>
            <div className="border border-[#D4AF37]/30 p-5 rounded-full bg-[#0A0E1A] text-[#D4AF37] relative z-10">
              <EyeOff size={48} className="animate-pulse" />
            </div>
          </div>
          <h2 className="text-[#D4AF37] text-xl font-cinzel font-bold tracking-widest uppercase mb-3">
            Ambiente Seguro Protegido
          </h2>
          <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-4"></div>
          <p className="text-gray-400 max-w-md text-xs sm:text-sm leading-relaxed mb-6 font-medium">
            Por motivos de alta segurança e confidencialidade rituálica da plataforma <strong className="text-white">G∴O∴M∴A∴U∴</strong>, o conteúdo foi ocultado automaticamente para impedir capturas de tela ou gravações não autorizadas.
          </p>
          <div className="flex items-center gap-2 text-[10px] text-[#D4AF37]/70 uppercase tracking-wider font-bold">
            <ShieldAlert size={14} /> Transmissão & Cópia Bloqueadas
          </div>
        </div>
      )}
    </div>
  );
}
