import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";
import {
  Shield,
  Save,
  MessageSquare,
  Bell,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  Phone,
  User,
  Zap,
  Send,
  Eye
} from "lucide-react";

interface SegundoVigilanteViewProps {
  members: any[];
  currentUser: any;
}

interface OfficerRoleState {
  cim: string;
  nome: string;
  telefone: string;
  suplenteCim: string;
  suplenteNome: string;
  suplenteTelefone: string;
  suplenteAtivo: boolean;
}

const INITIAL_ROLES_STATE: Record<string, OfficerRoleState> = {
  vig1: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  vig2: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  gi: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  ge: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  cap: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  d1: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  d2: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  dc: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  secr: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
};

const ROLES_KEYS = [
  { key: "vig1", label: "1º Vig ∴" },
  { key: "vig2", label: "2º Vig ∴" },
  { key: "gi", label: "G ∴ I ∴" },
  { key: "ge", label: "G ∴ E ∴" },
  { key: "cap", label: "Cap ∴" },
  { key: "d1", label: "1º D ∴" },
  { key: "d2", label: "2º D ∴" },
  { key: "dc", label: "D∴C∴" },
  { key: "secr", label: "Secr∴" },
];

export default function SegundoVigilanteView({ members, currentUser }: SegundoVigilanteViewProps) {
  const [roles, setRoles] = useState<Record<string, OfficerRoleState>>(INITIAL_ROLES_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Messaging state
  const [messageText, setMessageText] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("sessao");
  const [targetSelections, setTargetSelections] = useState<Record<string, boolean>>({
    vig1: true,
    vig2: true,
    gi: true,
    ge: true,
    cap: true,
    d1: true,
    d2: true,
    dc: true,
    secr: true,
  });

  const [sendingNotification, setSendingNotification] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Load roster config from Firestore
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configRef = doc(db, "configs", "segundo_vigilante");
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
          const loadedData = docSnap.data().roles || {};
          // Merge loaded data with default states
          const merged: Record<string, OfficerRoleState> = {};
          Object.keys(INITIAL_ROLES_STATE).forEach((k) => {
            merged[k] = { ...INITIAL_ROLES_STATE[k], ...(loadedData[k] || {}) };
          });
          setRoles(merged);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do 2º Vigilante:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Subscribe to recent notifications
  useEffect(() => {
    const q = query(
      collection(db, "officersNotifications"),
      orderBy("timestamp", "desc"),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, []);

  // Update boilerplate template message content
  useEffect(() => {
    const today = new Date().toLocaleDateString("pt-BR");
    if (messageTemplate === "sessao") {
      setMessageText(
        `Saudações Fraternais, meu irmão Oficial!\n\nEste é um lembrete do dia e hora da nossa próxima Sessão na Loja. Sua presença como Oficial é de extrema importância para os trabalhos ritualísticos.\n\n📅 Data: [Preencher Dia]\n⏰ Horário: [Preencher Hora]\n🏛️ Templo: Jus Veritas 33`
      );
    } else if (messageTemplate === "iniciacao") {
      setMessageText(
        `Grande e Especial Convite, meu irmão Oficial!\n\nNo próximo evento teremos uma magna Cerimônia de Iniciação. Todos os oficiais devem estar presentes e instruídos em suas respectivas funções ritualísticas para que o brilho do rito seja pleno.\n\n📅 Data: [Preencher Dia]\n⏰ Horário: [Preencher Hora]`
      );
    } else if (messageTemplate === "standby") {
      setMessageText(
        `Alerta de Suplente Ativo!\n\nPrezado irmão Suplente, um oficial titular justificou ausência e você foi Ativado para os próximos trabalhos. Por gentileza, esteja pronto e em standby para assumir o cargo.\n\nCargos com suplentes ativos: por favor verifiquem o painel administrativo.`
      );
    } else {
      setMessageText("");
    }
  }, [messageTemplate]);

  // Autofill Names and Telephones based on CIM whenever the roster state or members list changes
  const handleCimChange = (roleKey: string, field: "cim" | "suplenteCim", value: string) => {
    const targetCim = value.trim();
    const found = members.find((m) => m.cim?.toString().trim() === targetCim);

    setRoles((prev) => {
      const updatedRole = { ...prev[roleKey] };
      if (field === "cim") {
        updatedRole.cim = value;
        updatedRole.nome = found ? found.nome : "";
        updatedRole.telefone = found ? (found.telefone || found.foneEmergencia || "") : "";
      } else {
        updatedRole.suplenteCim = value;
        updatedRole.suplenteNome = found ? found.nome : "";
        updatedRole.suplenteTelefone = found ? (found.telefone || found.foneEmergencia || "") : "";
      }
      return { ...prev, [roleKey]: updatedRole };
    });
  };

  const handleToggleSuplente = (roleKey: string) => {
    setRoles((prev) => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey],
        suplenteAtivo: !prev[roleKey].suplenteAtivo,
      },
    }));
  };

  // Save config back to firestore
  const handleSaveConfig = async () => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await setDoc(doc(db, "configs", "segundo_vigilante"), {
        roles,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.nome || "Gestor"
      });
      setSuccessMsg("Configurações dos Oficiais da Loja salvas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar config:", err);
      setErrorMsg("Falha ao salvar configurações no banco de dados.");
    } finally {
      setSaving(false);
    }
  };

  // WhatsApp individual delivery helpers
  const handleSendIndividualWhatsApp = (roleState: OfficerRoleState, roleName: string, type: "titular" | "suplente") => {
    const isSuplente = type === "suplente";
    const phone = isSuplente ? roleState.suplenteTelefone : roleState.telefone;
    const name = isSuplente ? roleState.suplenteNome : roleState.nome;

    if (!phone) {
      alert("Este irmão não possui telefone cadastrado!");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const personalizedMessage = `Prezado Ir∴ ${name} (${roleName} ${isSuplente ? "Suplente" : "Titular"}),\n\n${messageText}`;
    const encodedMessage = encodeURIComponent(personalizedMessage);

    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`, "_blank");
  };

  // Send platform notifications
  const handleSendPlatformNotification = async () => {
    if (!messageText.trim()) {
      alert("Por favor, escreva o texto da mensagem/lembrete.");
      return;
    }

    setSendingNotification(true);
    try {
      // Find out targeted CIMs
      const targets: string[] = [];
      ROLES_KEYS.forEach(({ key }) => {
        if (targetSelections[key]) {
          const roleState = roles[key];
          if (roleState.suplenteAtivo) {
            if (roleState.suplenteCim) targets.push(roleState.suplenteCim.trim());
          } else {
            if (roleState.cim) targets.push(roleState.cim.trim());
          }
        }
      });

      if (targets.length === 0) {
        alert("Nenhum oficial com CIM válido está selecionado.");
        setSendingNotification(false);
        return;
      }

      await addDoc(collection(db, "officersNotifications"), {
        targets,
        message: messageText,
        sender: "2º Vigilante ∴",
        timestamp: new Date().toISOString(),
        readBy: []
      });

      alert("Lembrete enviado com sucesso dentro da plataforma para todos os oficiais selecionados!");
      setMessageText("");
    } catch (err) {
      console.error("Erro ao enviar notificação de oficiais:", err);
      alert("Erro ao salvar lembrete na plataforma.");
    } finally {
      setSendingNotification(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  return (
    <div id="segundo-vigilante-view" className="flex flex-col gap-8">
      {/* Roster Configuration Section */}
      <div className="bg-[#0f172a] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border-b border-[#D4AF37]/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#D4AF37]/10 p-2 rounded-lg border border-[#D4AF37]/30">
              <Shield className="text-[#D4AF37]" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                2° Vigilante ∴ <span className="text-xs bg-amber-500/10 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded font-medium">Oficiais da Loja</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Gerencie os oficiais titulares, configure os suplentes em standby e coordene comunicações.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 text-sm shadow-md"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            <span>Salvar Oficiais</span>
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm flex items-center gap-2">
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Grid of Roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ROLES_KEYS.map(({ key, label }) => {
              const rState = roles[key] || INITIAL_ROLES_STATE[key];
              const isSubAtivo = rState.suplenteAtivo;

              return (
                <div
                  key={key}
                  className={`bg-[#1e293b]/10 border rounded-xl p-5 transition-all ${
                    isSubAtivo
                      ? "border-amber-500 bg-amber-950/5 shadow-inner shadow-amber-500/5"
                      : "border-[#1e293b] hover:border-[#D4AF37]/20"
                  }`}
                >
                  {/* Role Title Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-black text-[#D4AF37] tracking-wider uppercase">
                      {label}
                    </span>
                    <button
                      onClick={() => handleToggleSuplente(key)}
                      className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 border transition-all ${
                        isSubAtivo
                          ? "bg-amber-500 text-black border-amber-400 font-extrabold"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      <Zap size={12} />
                      {isSubAtivo ? "Suplente Ativo" : "Ativar Suplente"}
                    </button>
                  </div>

                  {/* Inputs and Members Lookup */}
                  <div className="flex flex-col gap-4">
                    {/* Official (Titular) Card */}
                    <div className={`p-3.5 rounded-lg border bg-black/40 ${isSubAtivo ? "opacity-40 border-[#1e293b]" : "border-[#1e293b]/50"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                          <User size={10} /> Titular
                        </span>
                        {!isSubAtivo && rState.nome && rState.telefone && (
                          <button
                            onClick={() => handleSendIndividualWhatsApp(rState, label, "titular")}
                            className="text-emerald-400 hover:text-emerald-300 transition-colors p-1 flex items-center gap-1 text-[10px]"
                            title="Enviar WhatsApp Individual"
                          >
                            <Phone size={10} /> WhatsApp
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="CIM do Titular"
                          value={rState.cim}
                          onChange={(e) => handleCimChange(key, "cim", e.target.value)}
                          className="bg-[#0B0B0C] border border-[#1e293b] rounded px-3 py-1.5 text-xs text-white w-28 placeholder-gray-600 outline-none focus:border-[#D4AF37]/30"
                        />
                        <div className="flex-1 bg-[#1e293b]/20 px-3 py-1.5 rounded border border-[#1e293b]/20 text-xs font-semibold text-gray-200 overflow-hidden text-ellipsis whitespace-nowrap">
                          {rState.nome || <span className="text-gray-500 italic font-normal">Digite o CIM</span>}
                        </div>
                      </div>
                    </div>

                    {/* Substitute (Suplente) Card */}
                    <div className={`p-3.5 rounded-lg border bg-black/40 ${isSubAtivo ? "border-amber-500/40 bg-amber-950/10" : "border-[#1e293b]/50 opacity-65"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                          <Clock size={10} /> Suplente (Standby)
                        </span>
                        {rState.suplenteNome && rState.suplenteTelefone && (
                          <button
                            onClick={() => handleSendIndividualWhatsApp(rState, label, "suplente")}
                            className="text-emerald-400 hover:text-emerald-300 transition-colors p-1 flex items-center gap-1 text-[10px]"
                            title="Enviar WhatsApp Individual ao Suplente"
                          >
                            <Phone size={10} /> WhatsApp
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="CIM do Suplente"
                          value={rState.suplenteCim}
                          onChange={(e) => handleCimChange(key, "suplenteCim", e.target.value)}
                          className="bg-[#0B0B0C] border border-[#1e293b] rounded px-3 py-1.5 text-xs text-white w-28 placeholder-gray-600 outline-none focus:border-[#D4AF37]/30"
                        />
                        <div className="flex-1 bg-[#1e293b]/20 px-3 py-1.5 rounded border border-[#1e293b]/20 text-xs font-semibold text-gray-200 overflow-hidden text-ellipsis whitespace-nowrap">
                          {rState.suplenteNome || <span className="text-gray-500 italic font-normal">Digite o CIM</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messaging and Reminders Panel */}
      <div className="bg-[#0f172a] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl">
        {/* ... existing messaging panel content ... */}
        <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border-b border-[#D4AF37]/30 px-6 py-4 flex items-center gap-3">
          <div className="bg-[#D4AF37]/10 p-2 rounded-lg border border-[#D4AF37]/30">
            <MessageSquare className="text-[#D4AF37]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">
              Central de Comunicação e Mensagens
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Envie comunicados individuais pelo WhatsApp ou envie lembretes internos na plataforma.
            </p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel - Target selections */}
          <div className="bg-black/20 border border-[#1e293b] p-4 rounded-lg flex flex-col gap-3">
            <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2">
              Selecione os Oficiais Destinatários
            </h4>
            <div className="flex flex-col gap-2">
              {ROLES_KEYS.map(({ key, label }) => {
                const rState = roles[key];
                const activeName = rState?.suplenteAtivo ? rState.suplenteNome : rState?.nome;
                const activeCim = rState?.suplenteAtivo ? rState.suplenteCim : rState?.cim;

                return (
                  <label
                    key={key}
                    className="flex items-center gap-3 bg-[#1e293b]/10 p-2.5 rounded border border-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={targetSelections[key]}
                      onChange={() =>
                        setTargetSelections((prev) => ({ ...prev, [key]: !prev[key] }))
                      }
                      className="accent-[#D4AF37]"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-[#D4AF37] block">{label}</span>
                      <span className="text-gray-300 font-medium block truncate">
                        {activeName ? (
                          `${activeName} (CIM: ${activeCim})`
                        ) : (
                          <span className="text-gray-500 italic font-normal">Não escalado</span>
                        )}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Right panel - Message Composer */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-bold uppercase tracking-wide">
                Modelos Rápidos / Boilerplates
              </label>
              <div className="flex gap-2">
                {[
                  { id: "sessao", label: "Lembrete de Sessão" },
                  { id: "iniciacao", label: "Lembrete Iniciação" },
                  { id: "standby", label: "Alerta de Standby" },
                  { id: "custom", label: "Texto Livre" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setMessageTemplate(t.id)}
                    className={`flex-1 text-xs py-2 px-3 border rounded-lg font-semibold transition-all ${
                      messageTemplate === t.id
                        ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]"
                        : "bg-[#0b0b0c] text-gray-400 border-[#1e293b] hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-xs text-gray-400 block mb-1.5 font-bold uppercase tracking-wide">
                Conteúdo da Mensagem
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={6}
                placeholder="Escreva aqui a mensagem fraternal para os oficiais..."
                className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg p-4 text-white text-xs w-full focus:border-[#D4AF37]/50 focus:ring-0 outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-amber-950/10 border border-amber-500/10 rounded-lg p-3 text-[11px] text-amber-200/70">
                💡 <span className="font-bold text-amber-400">Instruções:</span> O botão individual do WhatsApp (dentro dos cards acima) enviará este texto personalizado de forma direta para o irmão correspondente. O botão abaixo fará um envio massivo de notificações integradas dentro da própria plataforma.
              </div>

              <div className="flex flex-col gap-2 shrink-0 sm:w-64">
                <button
                  onClick={handleSendPlatformNotification}
                  disabled={sendingNotification}
                  className="w-full bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-xs"
                >
                  {sendingNotification ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Bell size={14} />
                  )}
                  <span>Notificar na Plataforma</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Tracking Panel */}
      <div className="bg-[#0f172a] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border-b border-[#D4AF37]/30 px-6 py-4 flex items-center gap-3">
          <div className="bg-[#D4AF37]/10 p-2 rounded-lg border border-[#D4AF37]/30">
            <Eye className="text-[#D4AF37]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">
              Monitoramento de Confirmações
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Acompanhe em tempo real quais oficiais confirmaram a ciência dos alertas enviados na plataforma.
            </p>
          </div>
        </div>
        <div className="p-6">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              Nenhuma notificação recente encontrada.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {notifications.map(notif => {
                const date = new Date(notif.timestamp).toLocaleString("pt-BR");
                const totalTargets = notif.targets?.length || 0;
                const readCount = notif.readBy?.length || 0;
                const allRead = totalTargets > 0 && totalTargets === readCount;
                
                return (
                  <div key={notif.id} className="bg-black/30 border border-[#1e293b] rounded-lg p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="text-sm text-gray-300 whitespace-pre-wrap flex-1 mr-4">
                        <span className="text-[#D4AF37] font-bold text-xs block mb-1">
                          Enviado em {date}
                        </span>
                        {notif.message.length > 100 ? notif.message.substring(0, 100) + '...' : notif.message}
                      </div>
                      <div className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${allRead ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {allRead ? <Check size={12} /> : <Clock size={12} />}
                        {readCount} / {totalTargets} Confirmados
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {notif.targets?.map((targetCim: string, idx: number) => {
                        const member = members.find(m => m.cim?.toString() === targetCim);
                        const name = member ? member.nome : `CIM ${targetCim}`;
                        const isRead = notif.readBy?.includes(targetCim);
                        
                        return (
                          <div key={idx} className={`text-xs px-3 py-2 rounded-lg border flex items-center justify-between ${isRead ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' : 'bg-red-950/20 border-red-900/50 text-red-400'}`}>
                            <span className="truncate pr-2 font-medium" title={name}>{name}</span>
                            {isRead ? <Check size={14} className="shrink-0" /> : <Clock size={14} className="shrink-0 opacity-70" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
