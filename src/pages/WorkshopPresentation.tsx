import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, ChevronLeft, Monitor, BookOpen, 
  GraduationCap, Home, Users, FileText, Settings, 
  HelpCircle, PlayCircle, Upload, MessageSquare, ShieldCheck,
  Calendar, Link, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    id: 'intro',
    title: 'G∴O∴M∴A∴U∴',
    subtitle: 'Guia Completo do Membro',
    icon: <Monitor size={64} className="text-[#D4AF37] mb-6 mx-auto" />,
    content: (
      <div className="text-center space-y-6">
        <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Bem-vindo ao seu ambiente digital maçônico. Este manual interativo foi elaborado para apresentar detalhadamente todas as telas, menus e funcionalidades disponíveis.
        </p>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          O objetivo é que você conheça cada ferramenta e saiba como utilizá-la em sua jornada de estudos e aperfeiçoamento.
        </p>
        <div className="pt-8">
          <p className="text-[#D4AF37] uppercase tracking-widest text-sm font-bold">Pressione Espaço, Enter ou use as setas para navegar</p>
        </div>
      </div>
    )
  },
  {
    id: 'dashboard',
    title: '1. Dashboard (Painel Inicial)',
    icon: <Home size={48} className="text-[#D4AF37] mb-4" />,
    content: (
      <div className="max-w-4xl mx-auto text-left mt-8 space-y-6">
        <p className="text-lg text-gray-300 mb-6"><strong>O que é:</strong> O seu centro de comando. É a primeira tela que você visualiza ao entrar na plataforma.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1e293b]/50 p-6 rounded-xl border border-[#D4AF37]/20">
            <h3 className="text-[#D4AF37] text-lg font-bold mb-2">Resumo de Métricas</h3>
            <p className="text-gray-300 text-sm leading-relaxed">Gráficos e contadores que mostram suas horas de estudo, cursos concluídos e pranchas lidas/enviadas.</p>
          </div>
          <div className="bg-[#1e293b]/50 p-6 rounded-xl border border-[#D4AF37]/20">
            <h3 className="text-[#D4AF37] text-lg font-bold mb-2">Cursos em Andamento</h3>
            <p className="text-gray-300 text-sm leading-relaxed">Mostra onde você parou. Com um clique, você retoma o vídeo ou leitura do exato ponto.</p>
          </div>
          <div className="bg-[#1e293b]/50 p-6 rounded-xl border border-[#D4AF37]/20">
            <h3 className="text-[#D4AF37] text-lg font-bold mb-2">Últimas Pranchas</h3>
            <p className="text-gray-300 text-sm leading-relaxed">Lista das adições mais recentes na biblioteca, filtradas respeitando estritamente o seu Grau.</p>
          </div>
          <div className="bg-[#1e293b]/50 p-6 rounded-xl border border-[#D4AF37]/20">
            <h3 className="text-[#D4AF37] text-lg font-bold mb-2">Dica de Uso</h3>
            <p className="text-gray-300 text-sm leading-relaxed">Use o Dashboard para se atualizar rapidamente ou continuar seus estudos de onde parou.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'perfil',
    title: '2. Meu Perfil (Configurações)',
    icon: <Settings size={48} className="text-[#D4AF37] mb-4" />,
    content: (
      <div className="max-w-4xl mx-auto text-left mt-8 space-y-6">
        <p className="text-lg text-gray-300 mb-6"><strong>O que é:</strong> Onde suas informações pessoais e maçônicas estão centralizadas.</p>
        
        <ul className="space-y-4">
          <li className="flex gap-4 items-start bg-[#1e293b]/40 p-4 rounded-lg">
            <Settings className="text-[#D4AF37] mt-1 flex-shrink-0" size={24} />
            <div>
              <strong className="text-white block text-lg">Dados Pessoais</strong>
              <span className="text-gray-400 text-sm block mt-1">Edite sua foto (avatar), e-mail, telefone, endereço, CPF e contatos de emergência.</span>
            </div>
          </li>
          <li className="flex gap-4 items-start bg-[#1e293b]/40 p-4 rounded-lg">
            <ShieldCheck className="text-[#D4AF37] mt-1 flex-shrink-0" size={24} />
            <div>
              <strong className="text-white block text-lg">Dados Maçônicos (Somente Leitura)</strong>
              <span className="text-gray-400 text-sm block mt-1">Exibe seu CIM, Grau Atual, Loja e Rito. (Estes dados são gerenciados pela secretaria por segurança).</span>
            </div>
          </li>
        </ul>
      </div>
    )
  },
  {
    id: 'biblioteca',
    title: '3. Biblioteca (Acervo de Pranchas)',
    icon: <BookOpen size={48} className="text-[#D4AF37] mb-4" />,
    content: (
      <div className="max-w-4xl mx-auto text-left mt-8 space-y-6">
        <p className="text-lg text-gray-300 mb-6"><strong>O que é:</strong> O repositório digital seguro de conhecimento, textos, rituais e áudios.</p>
        
        <div className="bg-[#1e293b]/40 p-6 rounded-xl space-y-6 border border-[#D4AF37]/20">
          <div>
            <h4 className="text-[#D4AF37] font-bold text-lg mb-1">Filtro por Grau</h4>
            <p className="text-gray-300 text-sm">A plataforma filtra tudo automaticamente. Você só enxerga os documentos que estão liberados para a sua elevação maçônica.</p>
          </div>
          <hr className="border-gray-800" />
          <div>
            <h4 className="text-[#D4AF37] font-bold text-lg mb-1">Leitor Embutido</h4>
            <p className="text-gray-300 text-sm">Ao clicar em um documento, ele abre na própria tela da plataforma, evitando downloads desnecessários e proporcionando uma leitura focada.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'cursos_catalogo',
    title: '4. Cursos EAD (Catálogo)',
    icon: <GraduationCap size={48} className="text-[#D4AF37] mb-4" />,
    content: (
      <div className="max-w-4xl mx-auto text-left mt-8 space-y-6">
        <p className="text-lg text-gray-300 mb-6"><strong>O que é:</strong> Trilhas de estudo estruturadas, divididas por módulos e vídeo-aulas.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-b from-[#1e293b] to-black p-6 rounded-xl border border-gray-800">
             <h4 className="text-[#D4AF37] font-bold text-lg mb-2">O Catálogo</h4>
             <p className="text-gray-400 text-sm">Exibe todos os cursos disponíveis para o seu grau com instrutor, carga horária e sinopse. Inscrição com um clique.</p>
          </div>
          <div className="bg-gradient-to-b from-[#1e293b] to-black p-6 rounded-xl border border-gray-800">
             <h4 className="text-[#D4AF37] font-bold text-lg mb-2">Progressão Linear</h4>
             <p className="text-gray-400 text-sm">Você deve assistir à aula até o final para liberar a próxima. Não é possível avançar vídeos, garantindo a absorção integral.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'forum',
    title: '5. Fórum (Comunidade e Debates)',
    icon: <MessageSquare size={48} className="text-[#D4AF37] mb-4" />,
    content: (
      <div className="max-w-4xl mx-auto text-left mt-8 space-y-6">
        <p className="text-lg text-gray-300 mb-6"><strong>O que é:</strong> Espaço oficial para tira-dúvidas, discussões ricas e seguras sobre ensinamentos.</p>
        
        <div className="bg-[#1e293b]/40 p-6 rounded-xl space-y-6 border border-[#D4AF37]/20">
          <div>
            <h4 className="text-[#D4AF37] font-bold text-lg mb-1">Salas Segmentadas por Grau</h4>
            <p className="text-gray-300 text-sm">Debates divididos por categorias. Tópicos de Mestres são completamente invisíveis e protegidos contra graus iniciais.</p>
          </div>
          <hr className="border-gray-800" />
          <div>
            <h4 className="text-[#D4AF37] font-bold text-lg mb-1">Dica de Uso</h4>
            <p className="text-gray-300 text-sm">Leu algo profundo e ficou com dúvida? Abra um tópico. É o ambiente perfeito para "conversar" de forma assíncrona com os irmãos mais experientes.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'envio_trabalhos',
    title: '6. Solicitações e Envios (Pranchas)',
    icon: <Upload size={48} className="text-[#D4AF37] mb-4" />,
    content: (
      <div className="max-w-4xl mx-auto text-left mt-8 space-y-6">
        <p className="text-lg text-gray-300 mb-6"><strong>O que é:</strong> Módulo para enviar peças de arquitetura para avaliação ou solicitar documentos.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1e293b]/30 p-6 rounded-xl border border-gray-800">
             <h4 className="text-[#D4AF37] font-bold text-lg mb-2">Fluxo de Envio</h4>
             <p className="text-gray-400 text-sm">Anexe arquivos (PDF/Word). O status iniciará como "Pendente". Acompanhe a mudança para "Em Análise", "Aprovada" ou "Ajustes".</p>
          </div>
          <div className="bg-[#1e293b]/30 p-6 rounded-xl border border-gray-800">
             <h4 className="text-[#D4AF37] font-bold text-lg mb-2">Feedback Direto</h4>
             <p className="text-gray-400 text-sm">Leia os comentários do seu Venerável ou Instrutor e responda diretamente pela plataforma de forma unificada.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'calendario',
    title: '7. Calendário Maçônico',
    icon: <Calendar size={48} className="text-[#D4AF37] mb-4" />,
    content: (
      <div className="max-w-4xl mx-auto text-left mt-8 space-y-6">
        <p className="text-lg text-gray-300 mb-6"><strong>O que é:</strong> A agenda digital unificada para manter você informado sobre sessões magnas, iniciações e eventos.</p>
        
        <ul className="space-y-4">
           <li className="bg-[#1e293b]/30 p-4 rounded-lg">
             <strong className="text-[#D4AF37] text-md block mb-1">Visão Interativa</strong>
             <span className="text-gray-400 text-sm block">Navegue facilmente entre meses e semanas para localizar compromissos e agendar seu tempo.</span>
           </li>
           <li className="bg-[#1e293b]/30 p-4 rounded-lg">
             <strong className="text-[#D4AF37] text-md block mb-1">Detalhes do Evento</strong>
             <span className="text-gray-400 text-sm block">Ao clicar em uma data, visualize pauta da sessão, horário, traje exigido e o local exato da reunião.</span>
           </li>
        </ul>
      </div>
    )
  },
  {
    id: 'cadeia_uniao',
    title: '8. Cadeia de União (Irmãos)',
    icon: <Link size={48} className="text-[#D4AF37] mb-4" />,
    content: (
      <div className="max-w-4xl mx-auto text-left mt-8 space-y-6">
        <p className="text-lg text-gray-300 mb-6"><strong>O que é:</strong> O diretório de membros da sua Loja para facilitar a comunicação e o networking fraterno.</p>
        
        <div className="bg-[#1e293b]/40 p-6 rounded-xl space-y-6 border border-[#D4AF37]/20">
          <div>
            <h4 className="text-[#D4AF37] font-bold text-lg mb-1">Localização Rápida</h4>
            <p className="text-gray-300 text-sm">Use o campo de busca para encontrar o telefone ou e-mail de um irmão rapidamente e entrar em contato.</p>
          </div>
          <hr className="border-gray-800" />
          <div>
            <h4 className="text-[#D4AF37] font-bold text-lg mb-1">Privacidade Assegurada</h4>
            <p className="text-gray-300 text-sm">Apenas irmãos regulares do mesmo quadro visualizam essas informações, garantindo a segurança dos dados de contato.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'historico',
    title: '9. Histórico Maçônico',
    icon: <Clock size={48} className="text-[#D4AF37] mb-4" />,
    content: (
      <div className="max-w-4xl mx-auto text-left mt-8 space-y-6">
        <p className="text-lg text-gray-300 mb-6"><strong>O que é:</strong> O seu "currículo" e trajetória completa dentro da Ordem, registrado de forma permanente.</p>
        
        <div className="bg-[#1e293b]/40 p-6 rounded-xl space-y-6 border border-[#D4AF37]/20">
          <div>
            <h4 className="text-[#D4AF37] font-bold text-lg mb-1">Linha do Tempo (Timeline)</h4>
            <p className="text-gray-300 text-sm">Exibe datas vitais da sua jornada: Iniciação, Elevação, Exaltação, entre outros eventos chave.</p>
          </div>
          <hr className="border-gray-800" />
          <div>
            <h4 className="text-[#D4AF37] font-bold text-lg mb-1">Conquistas</h4>
            <p className="text-gray-300 text-sm">Arquiva automaticamente a conclusão dos seus cursos e aprovação de pranchas magnas para o seu registro definitivo.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'final',
    title: 'Pronto para Começar',
    icon: <GraduationCap size={64} className="text-[#D4AF37] mb-6 mx-auto" />,
    content: (
      <div className="text-center space-y-6">
        <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Você concluiu o guia de bordo da Plataforma G∴O∴M∴A∴U∴.
        </p>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Explore o conteúdo, compartilhe ideias nos fóruns e aproveite esta ferramenta desenvolvida para o seu constante aperfeiçoamento.
        </p>
        <div className="pt-8">
          <button 
            onClick={() => window.location.href = '/'}
            className="px-8 py-4 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-[#C5A028] transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] text-lg"
          >
            Ir para o Meu Dashboard
          </button>
        </div>
      </div>
    )
  }
];

export function WorkshopPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, navigate]);

  const slide = SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white flex flex-col overflow-hidden fixed inset-0 z-50">
      
      {/* Header (Progress) */}
      <div className="flex items-center justify-between p-6 absolute top-0 w-full z-10">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold flex items-center gap-2">
          <ChevronLeft size={16} /> Sair do Guia
        </button>
        <div className="flex gap-2">
          {SLIDES.map((_, idx) => (
            <div 
              key={idx} 
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 w-6 md:w-8 rounded-full transition-all duration-500 cursor-pointer ${idx === currentSlide ? 'bg-[#D4AF37]' : idx < currentSlide ? 'bg-[#D4AF37]/50' : 'bg-gray-800'}`} 
            />
          ))}
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 w-full max-w-5xl mx-auto relative overflow-y-auto mt-16 md:mt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full text-center py-12"
          >
            {slide.icon}
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
              {slide.title}
            </h1>
            {slide.subtitle && (
              <h2 className="text-xl md:text-2xl text-[#D4AF37] mb-8 uppercase tracking-widest font-light">
                {slide.subtitle}
              </h2>
            )}
            <div className="mt-8">
              {slide.content}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="absolute bottom-0 w-full p-6 md:p-8 flex justify-between items-center bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A] to-transparent">
        <button
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl border border-[#D4AF37]/30 text-[#D4AF37] font-bold transition-all ${currentSlide === 0 ? 'opacity-0 cursor-default' : 'hover:bg-[#D4AF37]/10'}`}
        >
          <ChevronLeft size={20} /> Anterior
        </button>
        
        <div className="text-gray-500 font-mono text-sm hidden md:block">
          Passo {currentSlide + 1} de {SLIDES.length}
        </div>

        <button
          onClick={handleNext}
          disabled={currentSlide === SLIDES.length - 1}
          className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold transition-all hover:bg-[#C5A028] shadow-[0_0_20px_rgba(212,175,55,0.2)] ${currentSlide === SLIDES.length - 1 ? 'opacity-0 cursor-default' : ''}`}
        >
          Próximo <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
