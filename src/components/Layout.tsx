import React, { ReactNode, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Home, BookOpen, FileText, Calendar, Target, User, History, Settings, HelpCircle, LogOut, Shield, GraduationCap, Clock, Video, MessageSquare, DollarSign, Library, Sparkles, Menu, X, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { MASTER_ADMINS } from '../constants';

export function SessionTimer() {
  const [timeLeft, setTimeLeft] = useState<string>('--:--');
  const { logout, sessionTimeout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Garantir que o timer exista se o usuário estiver logado
    const ensureTimer = () => {
      const expiresAtStr = localStorage.getItem('session_expires_at');
      const SESSION_DURATION = sessionTimeout * 60 * 1000;
      
      // Se não existe, ou já passou, ou a discrepância é muito grande comparada ao novo tempo
      if (!expiresAtStr || parseInt(expiresAtStr) < Date.now() || Math.abs(parseInt(expiresAtStr) - (Date.now() + SESSION_DURATION)) > 60000) {
        localStorage.setItem('session_expires_at', (Date.now() + SESSION_DURATION).toString());
      }
    };

    ensureTimer();

    const timer = setInterval(() => {
      const expiresAtStr = localStorage.getItem('session_expires_at');
      if (!expiresAtStr) {
        setTimeLeft('--:--');
        return;
      }

      const expiresAt = parseInt(expiresAtStr);
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        clearInterval(timer);
        localStorage.removeItem('session_expires_at');
        logout().then(() => navigate('/login?reason=session_expired'));
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        const display = h > 0 
          ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
          : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        
        setTimeLeft(display);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [logout, navigate]);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37]/20 border-2 border-[#D4AF37] rounded-xl text-xs sm:text-sm font-mono text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)] animate-pulse">
      <div className="bg-[#D4AF37] text-black rounded p-0.5">
        <Clock size={14} />
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] uppercase font-bold tracking-tighter opacity-80 leading-none">Expira em</span>
        <span className="font-bold leading-none tabular-nums text-white">{timeLeft}</span>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout: contextLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      const dismissed = localStorage.getItem('gomau_onboarding_v4_dismissed');
      if (!dismissed) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const isMaster = MASTER_ADMINS.includes(user?.email || '');

  const handleLogout = async () => {
    await contextLogout();
    navigate('/login');
  };

  const userEmail = (user?.email || auth.currentUser?.email || '').toLowerCase().trim();
  const isOwner = ['gomau.ead@gmail.com', 'calepi@gmail.com', 'calepe@gmail.com'].includes(userEmail);
  const isPremiumAdmin = (userEmail === 'tazmaniacrvg@gmail.com' ? false : true) && (userEmail === 'tazmaniacrvg@gmail.com' || (user?.role as string) === 'adminPremium' || isOwner);
  const canAccessGestor = (isMaster || user?.role === 'gestor' || user?.cim === '3330' || user?.cim === '331' || ['diogo.mourapedroso@gmail.com', 'tazmaniacrvg@gmail.com'].includes(userEmail) || (user?.delegatedPastas && user.delegatedPastas.length > 0)) && userEmail !== 'tazmaniacrvg@gmail.com';

  const categories = [
    {
      title: "Principal",
      items: [
        { icon: Home, label: 'Dashboard', path: '/' },
        { icon: User, label: 'Meu Perfil', path: '/profile' },
      ]
    },
    {
      title: "Estudos & Formação",
      items: [
        { icon: BookOpen, label: 'Conteúdos', path: '/contents' },
        { icon: GraduationCap, label: 'Cursos EAD', path: '/cursos' },
        { icon: Library, label: 'Biblioteca Digital', path: '/library' },
        { icon: MessageSquare, label: 'Fórum', path: '/forum' },
      ]
    },
    {
      title: "Egrégora & Vida em Loja",
      items: [
        { icon: Sparkles, label: 'Cadeia de União', path: '/cadeia-uniao' },
        { icon: Calendar, label: 'Calendário', path: '/calendar' },
      ]
    },
    {
      title: "Secretaria & Tesouraria",
      items: [
        { icon: FileText, label: 'Solicitações', path: '/requests' },
        { icon: History, label: 'Histórico', path: '/history' },
      ]
    }
  ];

  const adminItems = [
    { icon: Shield, label: 'Área Gestor', path: '/gestor' },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#05070A]/40 text-[#E5E7EB] font-sans relative overflow-hidden">
      {/* Mobile Header - Now Sticky */}
      <header className="lg:hidden sticky top-0 flex items-center justify-between p-4 border-b border-[#D4AF37]/15 bg-[#05070A]/95 backdrop-blur-md z-[60] w-full shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
            <img src="/logotrad.png" alt="Logo" className="max-w-full max-h-full object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]" />
          </div>
          <div className="min-w-0">
             <h1 className="text-xs font-bold text-[#D4AF37] truncate" style={{fontFamily: 'Cinzel'}}>G∴O∴M∴A∴U∴</h1>
             <p className="text-[7px] tracking-widest text-gray-500 uppercase truncate font-semibold font-sans">Grande Oriente Maçônico Universal</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
           <SessionTimer />
           <div className="w-10 h-10 rounded-xl bg-black/40 border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] overflow-hidden text-xs cursor-pointer shadow-inner" onClick={() => navigate('/profile')}>
              {user?.photoUrl || auth.currentUser?.photoURL ? (
                 <img src={user?.photoUrl || auth.currentUser?.photoURL || ''} alt={user?.nome} className="w-full h-full object-cover" />
              ) : (
                 <User size={18} />
              )}
           </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-[#D4AF37]/15 bg-[#05070A]/90 backdrop-blur-md overflow-y-auto flex-shrink-0">
        <div className="p-8 flex flex-col items-center border-b border-[#D4AF37]/15">
          <div className="w-52 h-52 mb-6 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#D4AF37]/5 to-transparent blur-3xl opacity-50"></div>
            <img src="/logotrad.png" alt="Logo Plataforma Maçônica" className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]" />
          </div>
          <h1 className="text-2xl font-semibold tracking-wider text-[#D4AF37] text-center mb-1 animate-pulse" style={{fontFamily: 'Cinzel'}}>G∴O∴M∴A∴U∴</h1>
          <p className="text-[10px] tracking-[0.2em] text-gray-400 text-center uppercase leading-tight font-sans font-black">Grande Oriente Maçônico Universal</p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-6 flex flex-col gap-5 px-4 overflow-y-auto">
          {categories.map((category) => (
            <div key={category.title} className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-[#D4AF37]/50 tracking-[0.2em] uppercase px-4 pb-1">
                {category.title}
              </span>
              {category.items.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          ))}

          {canAccessGestor && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-red-500/60 tracking-[0.2em] uppercase px-4 pb-1">
                Administração
              </span>
              {adminItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-[#D4AF37]/15 flex flex-col gap-1">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative w-full">
        {/* Desktop Profile Link - Now strictly LG */}
        <div className="hidden lg:flex fixed top-0 right-0 left-72 h-20 items-center justify-end px-8 gap-4 z-[70] bg-[#05070A]/85 backdrop-blur-xl border-b border-[#D4AF37]/15 shadow-2xl">
          <SessionTimer />
          <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 p-2 rounded-2xl transition-all" onClick={() => navigate('/profile')}>
            <div className="text-right">
              <div className="flex flex-col items-end mb-1">
                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.15em] drop-shadow-md brightness-125 font-cinzel">
                  {user?.loja || 'JUS VERITAS 33'} | {user?.rito || 'EMULAÇÃO'}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">{user?.grau || 'Aprendiz'}</span>
              </div>
              <p className="text-base font-bold text-gray-100 leading-tight drop-shadow-sm">{user?.nome}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-black/40 border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] overflow-hidden shadow-lg shadow-black/40">
               {user?.photoUrl || auth.currentUser?.photoURL ? (
                  <img src={user?.photoUrl || auth.currentUser?.photoURL || ''} alt={user?.nome} className="w-full h-full object-cover" />
               ) : (
                  <User size={24} />
               )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-hidden overflow-y-auto w-full p-4 lg:p-8 lg:pt-28 pb-24 lg:pb-8">
          <div className="w-full max-w-7xl mx-auto overflow-hidden">
             {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-[#0A0E1A]/95 backdrop-blur-lg border-t border-[#1e293b]/50 px-2 flex justify-between items-center h-16 z-[60]">
        <NavLink
          to="/"
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all",
            isActive ? "text-[#D4AF37]" : "text-gray-500"
          )}
        >
          <Home size={18} />
          <span className="text-[10px] font-medium">Início</span>
        </NavLink>
        <NavLink
          to="/cadeia-uniao"
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all",
            isActive ? "text-[#D4AF37]" : "text-gray-500"
          )}
        >
          <Sparkles size={18} />
          <span className="text-[10px] font-medium">Cadeia</span>
        </NavLink>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all text-gray-500 hover:text-[#D4AF37] cursor-pointer"
          )}
        >
          <Menu size={18} />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </nav>

      {/* Modern Slide-up Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[100] flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black"
            />
            {/* Drawer Body */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-h-[85vh] bg-[#0A0E1A] border-t border-[#D4AF37]/40 rounded-t-3xl shadow-2xl p-6 overflow-y-auto no-scrollbar flex flex-col z-[110]"
            >
              {/* Gold decorative bar */}
              <div className="w-12 h-1 bg-[#D4AF37]/50 rounded-full mx-auto mb-6"></div>

              {/* Header */}
              <div className="flex justify-between items-center mb-6 border-b border-[#1e293b] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#D4AF37] uppercase tracking-wider" style={{ fontFamily: 'Cinzel' }}>Portal Maçônico</h3>
                  <p className="text-[10px] uppercase text-gray-500 tracking-widest mt-0.5">Navegação Geral e Egrégora</p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-900 border border-white/5 text-[#D4AF37] hover:bg-slate-850 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Options Grouped */}
              <div className="space-y-6 pb-6">
                {categories.map((category) => (
                  <div key={category.title} className="space-y-2">
                    <span className="text-[10px] font-black text-[#D4AF37]/50 tracking-[0.2em] uppercase block">
                      {category.title}
                    </span>
                    <div className="grid grid-cols-3 gap-2.5">
                      {category.items
                        .filter(item => item.path !== '/library' || isOwner)
                        .map((item: any) => {
                          const isActive = location.pathname === item.path;
                          return (
                            <button
                              key={item.path}
                              onClick={() => {
                                navigate(item.path);
                                setIsMobileMenuOpen(false);
                              }}
                              className={cn(
                                "p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all duration-200 cursor-pointer",
                                isActive
                                  ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]"
                                  : "bg-[#0F172A]/80 border-[#1e293b]/70 hover:border-slate-700 text-gray-300"
                              )}
                            >
                              <item.icon size={20} className={isActive ? "text-[#D4AF37]" : "text-gray-400"} />
                              <span className="text-[9px] font-bold leading-tight truncate w-full">{item.label}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}

                {/* Optional Gestor access */}
                {canAccessGestor && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-red-500/60 tracking-[0.2em] uppercase block">
                      Administração
                    </span>
                    <button
                      onClick={() => {
                        navigate('/gestor');
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full p-3.5 rounded-xl border flex items-center justify-center gap-2.5 transition-all duration-200 bg-red-950/20 border-red-900/30 text-rose-400 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      )}
                    >
                      <Shield size={20} className="text-red-500" />
                      <span>Acessar Painel do Gestor</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Logout & Footer */}
              <div className="border-t border-[#1e293b] pt-4 mt-auto flex flex-col gap-3">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-[#1e293b] text-gray-300 border border-white/5 hover:bg-slate-850 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <LogOut size={16} />
                  Sair da Plataforma
                </button>
                <div className="text-center text-[10px] text-gray-500 pb-2">
                  Fraternidade G∴O∴M∴A∴U∴ • Todos os direitos reservados.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic First-Access Onboarding for Members */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0A0E1A] border-2 border-[#D4AF37] rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-y-auto max-h-[90vh] z-10 font-sans"
            >
              {/* Corner gold highlights */}
              <div className="absolute top-4 left-4 w-3 h-3 border-t-2 border-l-2 border-[#D4AF37]"></div>
              <div className="absolute top-4 right-4 w-3 h-3 border-t-2 border-r-2 border-[#D4AF37]"></div>
              <div className="absolute bottom-4 left-4 w-3 h-3 border-b-2 border-l-2 border-[#D4AF37]"></div>
              <div className="absolute bottom-4 right-4 w-3 h-3 border-b-2 border-r-2 border-[#D4AF37]"></div>

              {/* Logo / Icon */}
              <div className="w-16 h-16 rounded-full border border-[#D4AF37] bg-[#D4AF37]/5 flex items-center justify-center text-[#D4AF37] mx-auto mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <Sparkles size={28} />
              </div>

              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-[#D4AF37] uppercase tracking-wider" style={{ fontFamily: 'Cinzel' }}>G∴O∴M∴A∴U∴ UPDATES</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Guia de Instruções e Novos Módulos aos Irmãos</p>
                <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent mx-auto mt-3"></div>
              </div>

              {/* Description body */}
              <div className="space-y-4 text-xs leading-relaxed text-gray-300">
                <p className="text-center italic font-serif text-[#D4AF37]/90 text-sm">
                  "Irmão, em virtude de nossas últimas resoluções estruturais, implementamos 3 grandes refinamentos no sistema para conferir-lhe maior centralidade de estudos."
                </p>

                {/* Section A */}
                <div className="bg-[#0F172A] border border-[#D4AF37]/20 p-4 rounded-xl flex gap-3">
                  <div className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] shrink-0 h-9 w-9 flex items-center justify-center">
                    <BookOpen size={18} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">1. Caderno Virtual e Central de Estudos</h4>
                    <p className="text-[11px] text-gray-400">
                      Ampliamos as nossas ferramentas de formação do obreiro. Em breve, cada conteúdo de instrução e estudo contará com seu próprio bloco de notas privado e dinâmico, garantindo que suas reflexões individuais fiquem gravadas sob total sigilo ritualístico.
                    </p>
                    <p className="text-[10px] text-[#D4AF37] font-medium leading-none mt-1">
                      ★ Novidade: Acompanhe os materiais de instrução em sua trilha de graus!
                    </p>
                  </div>
                </div>

                {/* Section B */}
                <div className="bg-[#0F172A] border border-[#D4AF37]/20 p-4 rounded-xl flex gap-3">
                  <div className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] shrink-0 h-9 w-9 flex items-center justify-center">
                    <Heart size={18} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">2. Cadeia de União (Egrégora Activa)</h4>
                    <p className="text-[11px] text-gray-400">
                      Módulo voltado exclusivamente para o suporte espiritual familiar e energético dos obreiros. Diferentemente das solicitações administrativas da Hospitalaria, aqui você emite preces, egrégora de saúde e boas vibrações visíveis diretamente a todos os irmãos.
                    </p>
                    <p className="text-[10px] text-[#D4AF37] font-medium leading-none mt-1">
                      ★ Como agir: Acesse o menu <strong>Cadeia</strong>, adicione preces ou registre uma vibração mística aos pedidos de outros irmãos em tempo real.
                    </p>
                  </div>
                </div>

                {/* Section C */}
                <div className="bg-[#0F172A] border border-[#D4AF37]/20 p-4 rounded-xl flex gap-3">
                  <div className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] shrink-0 h-9 w-9 flex items-center justify-center">
                    <DollarSign size={18} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">3. Tesouraria & Auditoria Contábil</h4>
                    <p className="text-[11px] text-gray-400">
                      A regularidade contributiva é vital para as colunas do templo. Agora você pode copiar facilmente a chave Pix, cadastrar seu envio indicando o titular da transferência e notificar o Tesoureiro no ato.
                    </p>
                    <p className="text-[10px] text-[#D4AF37] font-medium leading-none mt-1">
                      ★ Importante: O gerenciamento contábil e auditoria financeira automática mantêm o status de regularidade do seu perfil atualizado.
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions on what is required from them */}
              <div className="mt-5 text-[11px] text-[#D4AF37] bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-3 rounded-lg text-center font-mono">
                Por favor, acesse estes menus em sua barra lateral ou no menu móvel "Mais" para familiarizar-se com os mesmos e realizar seus primeiros preenchimentos de estudos e vibrações.
              </div>

              {/* CTA button */}
              <button
                onClick={() => {
                  localStorage.setItem('gomau_onboarding_v4_dismissed', 'true');
                  setShowOnboarding(false);
                }}
                className="w-full bg-[#D4AF37] text-black hover:bg-[#C5A028] py-3.5 mt-6 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Compreendo os Módulos e Desejo Prosseguir
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ item, ...props }: { item: any } & React.HTMLAttributes<HTMLAnchorElement>) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group cursor-pointer",
        isActive 
          ? "bg-gradient-to-r from-[#D4AF37]/12 via-[#D4AF37]/3 to-transparent text-[#D4AF37] border-l-2 border-[#D4AF37] shadow-[inset_1px_0_0_rgba(212,175,55,0.05)] font-semibold tracking-wide" 
          : "text-slate-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 border-l-2 border-transparent"
      )}
    >
      {({ isActive }) => (
        <>
          <item.icon size={17} className={isActive ? "text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" : "text-slate-400 group-hover:text-[#D4AF37] transition-colors"} />
          {item.label}
        </>
      )}
    </NavLink>
  );
}
