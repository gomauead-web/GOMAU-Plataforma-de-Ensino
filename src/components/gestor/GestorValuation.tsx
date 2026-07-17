import React, { useState } from 'react';
import { BarChart3, TrendingUp, ShieldCheck, Database, LayoutTemplate, BrainCircuit, HeartHandshake, Link as LinkIcon, Check, BookOpen, Award, GraduationCap, MessageSquare, IdCard, Shield, Bell, Target } from 'lucide-react';

export function GestorValuation() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
     const sharedUrl = window.location.origin.replace('ais-dev-', 'ais-pre-');
     navigator.clipboard.writeText(sharedUrl);
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8 font-sans">
      <div className="mb-4 space-y-2">
        <h2 className="text-2xl font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-3">
          <BarChart3 className="text-[#D4AF37]" size={28} /> Avaliação de Mercado (Valuation)
        </h2>
        <p className="text-gray-400 text-sm tracking-wide leading-relaxed">
          Este documento apresenta uma análise técnica e mercadológica do valor de reconstrução 
          e licenciamento desta plataforma. Os valores refletem os custos justos de mercado 
          para o desenvolvimento de um sistema "Full-Stack" de alta complexidade com os mesmos recursos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Modulos */}
        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <LayoutTemplate size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Design & Frontend (React/Tailwind)</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Arquitetura Single Page Application (SPA), gestão de estados globais, interface responsiva adaptável, UX moderna focada em retenção (Dark Mode especializado, navegação persistente).
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 18.000,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Estimativa Base</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <Database size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Backend & Infraestrutura (GCP/Firebase)</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Modelagem de dados no-SQL, autenticação segura, persistência em tempo real, upload/streaming de arquivos (Storage), regras robustas de segurança e auditorias de acessos diários.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 15.000,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Estimativa Base</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <ShieldCheck size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Controle de Acessos & RBAC</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Role-Based Access Control para Master, Administradores e Membros. Barreiras de segurança por Grau maçônico, tempo de loja, controle por tokens.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 8.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Estimativa Base</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <BrainCircuit size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">I.A. e Automações (Gemini API)</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Integração complexa com LLMs para geração estruturada de cursos, quiz, painéis maçônicos automáticos e fóruns moderados. Parsing de JSON dinâmico.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 12.000,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Estimativa Base</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <Shield size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Security Audit, Caching & Otimização de Performance</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Auditoria profunda cobrindo OWASP Top 10, proteção do Firestore com regras estritas, refatoração de contextos, telemetria write-only, caching inteligente com 99.5% de redução nas demais queries e resiliência contra exaustão de cotas com banners imediatos de aviso e cache multicamadas redundante na validação do portal.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 17.000,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Estimativa Base</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-red-500/20 opacity-60 flex flex-col gap-4 shadow-xl hover:border-red-500/40 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-red-400">
                <TrendingUp size={24} />
             </div>
             <h3 className="font-bold text-gray-400 line-through uppercase tracking-wide text-sm">Tesouraria & Finanças</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
             [MÓDULO REMOVIDO] Sistema de gestão de faturas PIX, conciliação manual, lançamentos individuais ou em lote, status em tempo real (pendente, pago) e histórico detalhado.
          </p>
          <div className="mt-auto">
             <div className="text-gray-500 font-bold text-lg">R$ 0,00</div>
             <div className="text-[10px] text-red-500 font-bold uppercase mt-1 tracking-widest">Módulo Desativado</div>
          </div>
        </div>
        
        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <BookOpen size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Biblioteca Virtual & Tomos Premium</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Módulo de Atheneum standalone com acervo digitalizado, triagem automática por grau iniciático, configuração dinâmica de planos de assinatura, cupons de desconto e controle de acessos (Premium/Avulso).
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 13.000,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativado</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <HeartHandshake size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Cadeia de União & Egrégora</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Módulo espiritual síncrono para vibrações, saúde e preces familiares. Canal místico em tempo real com emissão de intenções de luz direto aos irmãos necessitados.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 5.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <BookOpen size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Anotações Marginais Privadas</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Diário de estudos e notas de exegese integrado diretamente a cada obra do Atheneum para registro autônomo individual de meditações místicas e guardados.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 4.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-red-500/20 opacity-60 flex flex-col gap-4 shadow-xl hover:border-red-500/40 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-red-400">
                <ShieldCheck size={24} />
             </div>
             <h3 className="font-bold text-gray-400 line-through uppercase tracking-wide text-sm">Auditoria "Livro Preto" & Finanças</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
             [MÓDULO REMOVIDO] Lógica de verificação contábil de mensalidades, auditores de adimplência, e status de regularidade do perfil para manutenção estrita das colunas da Loja.
          </p>
          <div className="mt-auto">
             <div className="text-gray-500 font-bold text-lg">R$ 0,00</div>
             <div className="text-[10px] text-red-500 font-bold uppercase mt-1 tracking-widest">Módulo Desativado</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <HeartHandshake size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Gestão de Projetos & QA</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Horas dedicadas a arquitetura de software, engenharia de prompt avançada, testes E2E, revisões de código, deploy automatizado e alocação de squads.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 6.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Estimativa Base</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <Award size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Gamificação & Meritocracia</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Sistema de condecorações e aprovações de mérito (ex: Aprendiz Erudito), com barra de progresso individual, métricas de qualificação e insígnias atreladas ao perfil.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 8.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <GraduationCap size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">LMS & Cursos EAD</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Plataforma completa de Ensino à Distância, com gestão de cursos corporativos, módulos divididos, aulas, quizzes dinâmicos com nota mínima e emissão de certificado virtual.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 18.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <MessageSquare size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Fórum Místico P2P</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Fórum de discussões sigiloso, organizado por categorias maçônicas, suporte a tópicos de dúvidas, curadoria de postagens e moderação ativa.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 6.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <IdCard size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Identidade Digital (CIM)</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Geração dinâmica da Carteira de Identidade Maçônica com dados persistidos em tempo real para controle de visibilidade no perfil dos irmãos.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 3.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-dashed border-[#D4AF37]/35 flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/60 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                 <TrendingUp size={24} />
             </div>
             <h3 className="font-bold text-[#D4AF37] uppercase tracking-wide text-sm">Multi-Lojas Inteligente</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
             Arquitetura de isolamento e governança multi-oficina. Inclui regras de validação por prefixo CIM, palavras sagradas independentes por congregação, faturamento e mensalidades individualizadas por Loja.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 11.500,00</div>
             <div className="text-[10px] text-[#D4AF37] font-bold uppercase mt-1 tracking-widest font-sans">Adicional Ativado</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <Shield size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Oficiais da Loja & 2º Vigilante</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Gestão independente de 9 cargos ritualísticos (incluindo o Secr∴), titulares/suplentes em standby, envio de pautas, convocações individuais via WhatsApp e painel de confirmação retroativa.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 14.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <ShieldCheck size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Delegação Dinâmica por CIM</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Gerenciador granular de permissões com lookup de obreiros em tempo real, permitindo outorgar controle de pastas específicas do Gestor a membros delegados sem elevar sua role global.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 9.000,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <Bell size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Monitoramento Real-Time (SLA)</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Painel de controle do 2º Vigilante com rastreamento síncrono e contagem de ciência de leitura (read receipts) das convocações via Firebase Streams, com SLA progressivo.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 5.500,00</div>
             <div className="text-[10px] text-[#D4AF37] font-bold uppercase mt-1 tracking-widest">Adicional Ativado</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <BarChart3 size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Telemetria & Engajamento</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Módulo de monitoramento ativo com telemetria contínua via `visibilitychange`, sincronização otimizada em lote para economia de requisições, armazenamento analítico do tempo real de tela e ranqueamento de engajamento em 4 dimensões (Diário, Semanal, Mensal e Histórico) com SWR caching.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 14.500,00</div>
             <div className="text-[10px] text-[#D4AF37] font-bold uppercase mt-1 tracking-widest">Módulo Agregado</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-red-500/20 opacity-60 flex flex-col gap-4 shadow-xl hover:border-red-500/40 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-red-400">
                <Shield size={24} />
             </div>
             <h3 className="font-bold text-gray-400 line-through uppercase tracking-wide text-sm">Proteção DRM & Anti-Vazamento</h3>
          </div>
          <p className="text-xs text-[#D4AF37] leading-relaxed font-sans">
             [TEMPORARIAMENTE DESATIVADO] Sistema de segurança que bloqueia cópias, seleções de textos, menu de contexto (botão direito), atalhos de desenvolvedor/inspeção, tentativas de impressão e blura automaticamente a tela quando fora de foco.
          </p>
          <div className="mt-auto">
             <div className="text-gray-500 font-bold text-lg">R$ 0,00</div>
             <div className="text-[10px] text-red-500 font-bold uppercase mt-1 tracking-widest font-sans">Módulo Desativado</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <BookOpen size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm font-sans">Player Cinematográfico & Caderno</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
             Player customizado de vídeo rituálico com capa protetora de alta-fidelidade (Logo G.O.M.A.U. + Título) integrado a um Bloco de Notas Ritualístico com autosalvamento síncrono no Firestore.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 9.000,00</div>
             <div className="text-[10px] text-[#D4AF37] font-bold uppercase mt-1 tracking-widest font-sans">Módulo Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <Shield size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm font-sans">Regras de Delegação & Estética Iniciática</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
             Arquitetura resiliente de segurança por conversão síncrona de tipos (`string()`) no Firestore Rules, migração autolimpante de permissões delegadas e badges iniciáticos de alta costura estética (Estrela de 6 Pontas neon).
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 3.500,00</div>
             <div className="text-[10px] text-[#D4AF37] font-bold uppercase mt-1 tracking-widest font-sans">Módulo Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <BrainCircuit size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm font-sans">Seeder de Instruções & Sincronizador de Acervo</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
             Lógica síncrona de ingestão em massa para carregamento das 100 Instruções Litúrgicas de Aprendiz Maçom, com prevenção automatizada de duplicidade para economia de requisições Firestore.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 5.500,00</div>
             <div className="text-[10px] text-[#D4AF37] font-bold uppercase mt-1 tracking-widest font-sans">Módulo Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <HeartHandshake size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm font-sans">Tronco de Beneficência & Sigilo Absoluto</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
             Módulo de solidariedade iniciática com criptografia rituálica (zero leaks de UID/CIM) no Firestore, geração dinâmica de código Pix por polinômio CRC16 padrão BCB e registro estatístico cumulativo da Loja.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 11.500,00</div>
             <div className="text-[10px] text-[#D4AF37] font-bold uppercase mt-1 tracking-widest font-sans">Módulo Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <MessageSquare size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm font-sans">Canal Fale com o Dev & Triagem Administrativa</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
             Canal interativo direto na barra de navegação para que os obreiros transmitam críticas, sugestões, bugs e acessos, com painel completo de triagem síncrona, filtros de categorias, contador e notificações piscantes de mensagens não lidas.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 8.500,00</div>
             <div className="text-[10px] text-[#D4AF37] font-bold uppercase mt-1 tracking-widest font-sans">Módulo Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <Award size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm font-sans">Rastreamento Nominal de Vibrações (Cadeia de União)</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
             Módulo complementar rituálico na Cadeia de União para identificação nominal e síncrona (lookup automático via banco de dados) dos irmãos que vibraram por uma prece, fortalecendo a união fraternal.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 4.000,00</div>
             <div className="text-[10px] text-[#D4AF37] font-bold uppercase mt-1 tracking-widest font-sans">Módulo Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#D4AF37]/35 flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/55 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <Database size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm font-sans">White-Label & Distribuição Independente (Setup Wizard)</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
             Assistente automatizado de instalação em 3 etapas para compradores independentes. Permite configurar credenciais customizadas de banco de dados do Firebase em runtime e inicializar tabelas e estruturas com semeadura de dados de fábrica em 1 clique.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 16.500,00</div>
             <div className="text-[10px] text-[#D4AF37] font-bold uppercase mt-1 tracking-widest font-sans">Módulo Ativo</div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#D4AF37]/10 to-transparent border-l-4 border-[#D4AF37] p-8 rounded-r-xl mt-4">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Valor Global Estimado</h3>
               <p className="text-sm text-gray-400 font-sans max-w-2xl">
                  Considerando todos os módulos desenvolvidos, o custo final para licitação, documentação estrutural e handoff desta solução no mercado nacional Open/Closed Source.
               </p>
            </div>
            <div className="text-right shrink-0">
               <div className="text-4xl font-extrabold text-[#D4AF37] tracking-tight">R$ 250.500,00</div>
               <div className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">Investimento Calculado</div>
            </div>
         </div>
       </div>

      <div className="bg-[#0A0E1A]/60 backdrop-blur-md p-8 rounded-xl border border-[#D4AF37]/30 shadow-2xl mt-4 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
           <Database size={120} className="text-[#D4AF37]" strokeWidth={1} />
         </div>
         <div className="relative z-10">
            <h3 className="text-lg font-bold text-[#D4AF37] mb-2 uppercase tracking-wider font-cinzel">Rateio Tecnológico e Manutenção (Custos Operacionais)</h3>
            <p className="text-sm text-gray-400 font-sans mb-6 max-w-3xl leading-relaxed">
               Com uma base atual de aproximadamente <strong>70 membros</strong>, esta é a memória de cálculo para uma mensalidade justa dedicada exclusivamente ao custeio tecnológico, englobando hospedagem, manutenção do sistema, suporte a cadastros, inserção de conteúdos e desenvolvimento contínuo de novas melhorias.
            </p>
            
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-2">
               <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-3">
                     <Check size={16} className="text-[#D4AF37] mt-0.5 shrink-0" />
                     <p className="text-xs text-gray-400 leading-relaxed"><strong className="text-gray-200">Cloud & Infraestrutura:</strong> Hospedagem escalável da plataforma (GCP), serviços serverless de banco de dados (Firebase Firestore), transferências dinâmicas de arquivos e mídias.</p>
                  </div>
                  <div className="flex items-start gap-3">
                     <Check size={16} className="text-[#D4AF37] mt-0.5 shrink-0" />
                     <p className="text-xs text-gray-400 leading-relaxed"><strong className="text-gray-200">Manutenção & BPO:</strong> Auditoria preventiva de estabilidade, limpeza e suporte de cadastros de obreiros, validações de acesso Google, monitoramento contínuo e tratativas de exceções.</p>
                  </div>
                  <div className="flex items-start gap-3">
                     <Check size={16} className="text-[#D4AF37] mt-0.5 shrink-0" />
                     <p className="text-xs text-gray-400 leading-relaxed"><strong className="text-gray-200">Conteúdos & Evolução Ativa:</strong> Digitalização e publicação de rituais/artigos no Atheneum, criação/lançamentos de novas funcionalidades estruturais (Software Engineering) sob demanda do Grão-Mestrado e refatorações visuais.</p>
                  </div>
               </div>
               
               <div className="shrink-0 bg-black/40 p-6 rounded-xl border border-[#D4AF37]/20 flex flex-col items-center justify-center min-w-[260px] shadow-lg relative overflow-hidden group hover:border-[#D4AF37]/40 transition-colors">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent"></div>
                  
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3 font-cinzel">Mensalidade Tecnológica Justa</span>
                  
                  <div className="flex items-baseline gap-1.5 mb-1">
                     <span className="text-lg text-[#D4AF37] font-bold">R$</span>
                     <span className="text-4xl font-black text-gray-100 tracking-tight">35,00</span>
                     <span className="text-xs text-gray-500 font-mono">/membro</span>
                  </div>
                  
                  <div className="w-full h-px bg-[#D4AF37]/15 my-4"></div>
                  
                  <div className="text-center w-full">
                     <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                        <span>Base de Cálculo</span>
                        <span className="font-bold text-gray-200">70 irmãos</span>
                     </div>
                     <div className="flex justify-between items-center text-xs text-[#D4AF37] font-bold">
                        <span>Fomento Mensal</span>
                        <span>R$ 2.450,00</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] shadow-xl mt-2 flex flex-col md:flex-row items-center gap-4">
         <div className="flex items-center gap-3 shrink-0">
            <div className="p-2.5 rounded-lg bg-[#1e293b] text-[#D4AF37]">
               <LinkIcon size={20} />
            </div>
            <div>
               <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Link de Acesso (Plataforma)</h3>
               <p className="text-xs text-gray-500">URL pública vigente da aplicação.</p>
            </div>
         </div>
         <div className="flex-1 flex w-full">
            <input 
               type="text" 
               readOnly
               value={window.location.origin.replace('ais-dev-', 'ais-pre-')}
               className="bg-[#1e293b] border border-[#334155] border-r-0 rounded-l-lg px-4 py-2 text-gray-300 text-sm font-mono w-full focus:outline-none"
            />
            <button 
               onClick={handleCopyLink}
               className="bg-[#D4AF37] text-black px-6 py-2 rounded-r-lg font-bold text-sm uppercase tracking-wider hover:bg-[#C5A028] transition-colors flex items-center justify-center gap-2 min-w-[124px]"
            >
               {copied ? <><Check size={16} /> Copiado</> : 'Copiar URL'}
            </button>
         </div>
      </div>
    </div>
  );
}
