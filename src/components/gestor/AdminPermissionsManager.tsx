import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import {
  Shield,
  Plus,
  Trash2,
  UserCheck,
  AlertCircle,
  Loader2,
  Activity,
  BookOpen,
  Calendar,
  Users,
  CheckCircle,
  FileText,
  Library,
  MessageSquare,
  BarChart3,
  GraduationCap,
  SlidersHorizontal,
  Layers,
  Search,
  UserPlus,
  X,
  Key
} from "lucide-react";

// List of all delegable functional sections of the platform
export const DELEGABLE_PASTAS = [
  { id: "dashboard", label: "Dashboard", description: "Painel Geral, estatísticas de presença e evolução de membros.", icon: GraduationCap },
  { id: "conteudos", label: "Arquivos", description: "Upload, edição e download de materiais litúrgicos e arquivos de estudo.", icon: FileText },
  { id: "cursos", label: "Cursos", description: "Plataforma de ensino (LMS) com trilhas de aprendizagem, aulas e notas.", icon: BookOpen },
  { id: "biblioteca", label: "Biblioteca", description: "Aquisição de livros e rituais exclusivos e gerenciamento de PIX.", icon: Library },
  { id: "solicitacoes", label: "Aprovações", description: "Triagem de justificativas de faltas, pranchas enviadas e pedidos de graus.", icon: CheckCircle },
  { id: "eventos", label: "Eventos", description: "Calendário de convocações, sessões litúrgicas e banquetes.", icon: Calendar },
  { id: "membros", label: "Membros", description: "Fichas de filiação, histórico de CIMs e administração de Lojas.", icon: Users },
  { id: "segundo_vigilante", label: "2° Vigilante", description: "Atividades, notas e presença exclusiva de Aprendizes.", icon: Shield },
  { id: "telemetria", label: "Telemetria", description: "Histórico passivo em tempo real de foco e engajamento de estudo.", icon: Activity },
  { id: "forum", label: "Fórum / Instrutores", description: "Tópicos de debate litúrgico e canal direto com instrutores.", icon: MessageSquare },
  { id: "developer_feedback", label: "Fale com o Dev", description: "Triagem síncrona de feedbacks, bugs e sugestões enviados.", icon: MessageSquare },
  { id: "avaliacao", label: "Valuation do Sistema", description: "Relatório de precificação financeira e valor agregado dos módulos.", icon: BarChart3 }
];

interface AdminPermissionsManagerProps {
  members: any[];
}

export default function AdminPermissionsManager({ members }: AdminPermissionsManagerProps) {
  const [delegations, setDelegations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"member" | "feature">("member");
  const [searchTerm, setSearchTerm] = useState("");

  // States for Adding Delegation by Member
  const [newCim, setNewCim] = useState("");
  const [newPasta, setNewPasta] = useState("dashboard");

  // States for Adding multiple CIMs to a Feature
  const [selectedFeatureId, setSelectedFeatureId] = useState("dashboard");
  const [commaCims, setCommaCims] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Resolve member name from CIM helper
  const getMemberByCim = (cim: string | number) => {
    if (!cim) return null;
    return members.find((m) => m.cim?.toString().trim() === cim.toString().trim());
  };

  const foundMember = newCim.trim() ? getMemberByCim(newCim.trim()) : null;

  useEffect(() => {
    const q = query(collection(db, "adminPermissions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          // Normalize existing legacy folders to proper casing if required
          const expectedId = `${data.cim?.toString().trim()}_${data.pasta}`;
          if (d.id !== expectedId) {
            setDoc(doc(db, "adminPermissions", expectedId), {
              ...data,
              createdAt: data.createdAt || new Date().toISOString()
            }).then(() => {
              deleteDoc(doc(db, "adminPermissions", d.id));
            }).catch(err => {
              console.error("Erro ao migrar ID de permissão:", err);
            });
          }
          return { id: d.id, ...data };
        });
        setDelegations(list);
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao carregar permissões:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper to add a delegation pair to Firestore
  const saveDelegationDoc = async (cim: string, pastaIdOrName: string) => {
    const docId = `${cim.trim()}_${pastaIdOrName}`;
    await setDoc(doc(db, "adminPermissions", docId), {
      cim: cim.trim(),
      pasta: pastaIdOrName,
      createdAt: new Date().toISOString()
    });
  };

  // 1. Handle adding delegation for a single member (by entering CIM and selecting Pasta)
  const handleAddSingleDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const targetCim = newCim.trim();
    if (!targetCim) {
      setErrorMessage("Por favor, digite o número do CIM.");
      return;
    }

    // Check if delegation already exists
    const exists = delegations.some(
      (d) => d.cim?.toString().trim() === targetCim && d.pasta === newPasta
    );
    if (exists) {
      setErrorMessage(`Este CIM já possui delegação ativa para a pasta "${newPasta}".`);
      return;
    }

    setSaving(true);
    try {
      await saveDelegationDoc(targetCim, newPasta);
      setSuccessMessage("Permissão delegada com sucesso!");
      setNewCim("");
    } catch (err) {
      console.error("Erro ao salvar permissão única:", err);
      setErrorMessage("Erro ao salvar no banco. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  // 2. Handle adding MULTIPLE CIMs to a single Feature/Pasta at once
  const handleAddMultipleCimsToFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!commaCims.trim()) {
      setErrorMessage("Por favor, digite pelo menos um CIM.");
      return;
    }

    // Parse CIMs (split by comma, clean whitespace, skip empty)
    const cimsArray = commaCims
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (cimsArray.length === 0) {
      setErrorMessage("Nenhum CIM válido identificado.");
      return;
    }

    setSaving(true);
    let addedCount = 0;
    try {
      for (const cim of cimsArray) {
        // Skip if already has this delegation
        const exists = delegations.some(
          (d) => d.cim?.toString().trim() === cim && d.pasta === selectedFeatureId
        );
        if (!exists) {
          await saveDelegationDoc(cim, selectedFeatureId);
          addedCount++;
        }
      }
      setSuccessMessage(`Associação concluída! ${addedCount} novos CIMs vinculados à pasta.`);
      setCommaCims("");
    } catch (err) {
      console.error("Erro ao salvar delegação em lote:", err);
      setErrorMessage("Erro ao salvar uma ou mais delegações no banco.");
    } finally {
      setSaving(false);
    }
  };

  // Revoke / Delete a delegation
  const handleDeleteDelegation = async (id: string, memberName?: string, pastaName?: string) => {
    const detail = memberName && pastaName ? `de ${memberName} para a pasta "${pastaName}"` : "esta permissão";
    if (!window.confirm(`Deseja realmente revogar ${detail}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "adminPermissions", id));
      setSuccessMessage("Permissão revogada com sucesso.");
    } catch (err) {
      console.error("Erro ao deletar permissão:", err);
      setErrorMessage("Erro ao revogar permissão.");
    }
  };

  // Group delegations by Member (CIM)
  const groupedByMember = React.useMemo(() => {
    const groups: { [cim: string]: { cim: string; member: any; folders: any[] } } = {};
    delegations.forEach((d) => {
      const cimStr = d.cim?.toString().trim();
      if (!cimStr) return;
      if (!groups[cimStr]) {
        groups[cimStr] = {
          cim: cimStr,
          member: getMemberByCim(cimStr),
          folders: []
        };
      }
      groups[cimStr].folders.push(d);
    });
    return Object.values(groups);
  }, [delegations, members]);

  // Group delegations by Feature/Pasta
  const groupedByFeature = React.useMemo(() => {
    return DELEGABLE_PASTAS.map((p) => {
      const cimsAssociated = delegations.filter(
        (d) => d.pasta === p.id || d.pasta.toLowerCase() === p.label.toLowerCase() || (p.id === "segundo_vigilante" && d.pasta.toLowerCase().includes("2"))
      );
      return {
        ...p,
        associations: cimsAssociated.map((a) => ({
          ...a,
          member: getMemberByCim(a.cim)
        }))
      };
    });
  }, [delegations, members]);

  // Filters based on search term
  const filteredMembersGroup = groupedByMember.filter((group) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    const cimMatch = group.cim.includes(s);
    const nameMatch = group.member?.nome?.toLowerCase().includes(s);
    const lojaMatch = group.member?.loja?.toLowerCase().includes(s);
    return cimMatch || nameMatch || lojaMatch;
  });

  const filteredFeaturesGroup = groupedByFeature.filter((f) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    const labelMatch = f.label.toLowerCase().includes(s);
    const descMatch = f.description.toLowerCase().includes(s);
    const memberMatch = f.associations.some((a) =>
      a.member?.nome?.toLowerCase().includes(s) || a.cim?.toString().includes(s)
    );
    return labelMatch || descMatch || memberMatch;
  });

  return (
    <div id="admin-permissions-manager" className="bg-[#0b0e1a] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border-b border-[#D4AF37]/30 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#D4AF37]/10 p-2.5 rounded-lg border border-[#D4AF37]/30">
            <Key className="text-[#D4AF37]" size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100 uppercase tracking-wider font-sans">
              Gerenciador de Cargos & Delegações
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 font-sans">
              Distribua acessos das pastas e opções administrativas a múltiplos CIMs de obreiros.
            </p>
          </div>
        </div>

        {/* Navigation Mode */}
        <div className="flex items-center gap-1.5 bg-black/40 border border-[#1e293b] p-1 rounded-lg h-fit">
          <button
            onClick={() => { setViewMode("member"); setSearchTerm(""); }}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "member"
                ? "bg-[#D4AF37] text-black"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Users size={12} />
            Por Membro
          </button>
          <button
            onClick={() => { setViewMode("feature"); setSearchTerm(""); }}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "feature"
                ? "bg-[#D4AF37] text-black"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Layers size={12} />
            Por Pasta / Função
          </button>
        </div>
      </div>

      <div className="p-6 flex flex-col xl:flex-row gap-8">
        {/* LEFT COLUMN: Input Forms (Contextual based on View Mode) */}
        <div className="w-full xl:w-1/3 bg-[#1e293b]/20 p-5 rounded-lg border border-[#1e293b] flex flex-col gap-5 h-fit">
          {viewMode === "member" ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="text-[#D4AF37]" size={16} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  Vincular Pasta a Membro
                </h4>
              </div>
              <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
                Insira o CIM do Irmão e selecione qual pasta administrativa ele poderá gerenciar.
              </p>

              <form onSubmit={handleAddSingleDelegation} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1 tracking-wider">CIM do Irmão</label>
                  <input
                    type="text"
                    placeholder="Ex: 331"
                    value={newCim}
                    onChange={(e) => setNewCim(e.target.value)}
                    className="bg-[#05070f] border border-[#1e293b] focus:border-[#D4AF37]/50 rounded-lg px-4 py-2.5 text-white text-sm w-full outline-none transition-colors font-mono"
                    required
                  />
                  {foundMember && (
                    <div className="mt-2.5 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg p-3 text-xs text-amber-100 flex flex-col gap-1 animate-fade-in">
                      <span className="font-bold text-[#D4AF37] text-[10px] uppercase tracking-wider">Membro Identificado:</span>
                      <span className="font-medium text-gray-200 text-sm">{foundMember.nome}</span>
                      <span className="text-gray-400 text-[10px]">
                        {foundMember.grau} • {foundMember.loja || "Loja Geral"}
                      </span>
                    </div>
                  )}
                  {newCim.trim() && !foundMember && (
                    <div className="mt-2 bg-yellow-900/10 border border-yellow-500/20 rounded-lg p-2.5 text-[11px] text-yellow-400 flex items-center gap-1.5 leading-relaxed">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>CIM não importado. A delegação funcionará assim que ele se conectar.</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1 tracking-wider">Selecionar Pasta</label>
                  <select
                    value={newPasta}
                    onChange={(e) => setNewPasta(e.target.value)}
                    className="bg-[#05070f] border border-[#1e293b] focus:border-[#D4AF37]/50 rounded-lg px-3 py-2.5 text-white text-sm w-full outline-none transition-colors cursor-pointer"
                  >
                    {DELEGABLE_PASTAS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-2 w-full bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 text-[11px] uppercase tracking-wider cursor-pointer shadow-md shadow-[#D4AF37]/10"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Delegar Pasta</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal className="text-[#D4AF37]" size={16} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  Vincular Membros a Pasta
                </h4>
              </div>
              <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
                Associe uma pasta a **um ou mais CIMs de uma só vez**. Separe os números de CIM por vírgula.
              </p>

              <form onSubmit={handleAddMultipleCimsToFeature} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1 tracking-wider">Selecionar Pasta Administrativa</label>
                  <select
                    value={selectedFeatureId}
                    onChange={(e) => setSelectedFeatureId(e.target.value)}
                    className="bg-[#05070f] border border-[#1e293b] focus:border-[#D4AF37]/50 rounded-lg px-3 py-2.5 text-white text-sm w-full outline-none transition-colors cursor-pointer"
                  >
                    {DELEGABLE_PASTAS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1 tracking-wider">CIMs Associados (Separados por Vírgula)</label>
                  <textarea
                    rows={3}
                    placeholder="Ex: 331, 332, 540, 108"
                    value={commaCims}
                    onChange={(e) => setCommaCims(e.target.value)}
                    className="bg-[#05070f] border border-[#1e293b] focus:border-[#D4AF37]/50 rounded-lg px-4 py-2 text-white text-sm w-full outline-none transition-colors font-mono resize-none leading-relaxed"
                    required
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block leading-relaxed">
                    Você pode colar uma lista de CIMs do Excel separados por vírgula para dar acesso em lote.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-2 w-full bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 text-[11px] uppercase tracking-wider cursor-pointer shadow-md shadow-[#D4AF37]/10"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Sincronizando Lote...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Associar CIMs à Pasta</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Messages */}
          {errorMessage && (
            <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2 animate-fade-in mt-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs flex items-center gap-2 animate-fade-in mt-2">
              <UserCheck size={14} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Active Delegations View / Grid */}
        <div className="w-full xl:w-2/3 flex flex-col gap-4">
          {/* Sub-Header with search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1e293b]/10 border border-[#1e293b]/60 px-4 py-3 rounded-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Delegações Ativas ({delegations.length})
            </h4>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
              <input
                type="text"
                placeholder={viewMode === "member" ? "Filtrar por nome, CIM ou Loja..." : "Filtrar por pasta ou obreiro..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#05070f] border border-[#1e293b] focus:border-[#D4AF37]/40 rounded-lg pl-9 pr-4 py-1.5 text-white text-xs w-full outline-none transition-colors"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-2 text-gray-400 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="animate-spin text-[#D4AF37]" size={36} />
              <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Carregando permissões rituálicas...</span>
            </div>
          ) : viewMode === "member" ? (
            /* VIEW MODE: MEMBER */
            filteredMembersGroup.length === 0 ? (
              <div className="border border-dashed border-[#1e293b] rounded-lg py-16 px-4 text-center text-gray-500 text-xs">
                {searchTerm ? "Nenhum membro ativo corresponde ao filtro." : "Nenhum Irmão possui delegação de cargos ativa no momento."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMembersGroup.map((group) => (
                  <div
                    key={group.cim}
                    className="bg-[#1e293b]/10 border border-[#1e293b] rounded-xl p-4 flex flex-col justify-between hover:border-[#D4AF37]/30 transition-all shadow-lg"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h5 className="font-bold text-gray-100 text-sm truncate">{group.member?.nome || "Irmão Não Cadastrado"}</h5>
                          <span className="text-[10px] text-[#D4AF37] font-mono font-bold tracking-wide">CIM: {group.cim}</span>
                        </div>
                        {group.member?.grau && (
                          <span className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest shrink-0">
                            {group.member.grau}
                          </span>
                        )}
                      </div>

                      {group.member?.loja && (
                        <p className="text-[10px] text-gray-400 mt-1 italic">{group.member.loja}</p>
                      )}

                      {/* Delegated Pastas tags */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {group.folders.map((f) => {
                          const pastaObj = DELEGABLE_PASTAS.find(
                            (p) => p.id === f.pasta || p.label === f.pasta || (p.id === "segundo_vigilante" && f.pasta.toLowerCase().includes("2"))
                          );
                          const icon = pastaObj ? pastaObj.icon : Shield;
                          return (
                            <div
                              key={f.id}
                              className="bg-black/40 border border-[#D4AF37]/10 hover:border-red-500/30 pl-2 pr-1.5 py-1 rounded-md text-[10px] text-amber-100 flex items-center gap-1.5 transition-all group/tag"
                            >
                              <span className="text-[#D4AF37]/70 font-semibold">{pastaObj ? pastaObj.label : f.pasta}</span>
                              <button
                                onClick={() => handleDeleteDelegation(f.id, group.member?.nome || group.cim, pastaObj?.label || f.pasta)}
                                className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-0.5 rounded transition-all cursor-pointer"
                                title="Revogar pasta"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* VIEW MODE: FEATURE / PASTA */
            filteredFeaturesGroup.length === 0 ? (
              <div className="border border-dashed border-[#1e293b] rounded-lg py-16 px-4 text-center text-gray-500 text-xs">
                Nenhuma pasta corresponde ao filtro.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredFeaturesGroup.map((feature) => {
                  const IconComponent = feature.icon;
                  return (
                    <div
                      key={feature.id}
                      className="bg-[#1e293b]/10 border border-[#1e293b] rounded-xl p-4 hover:border-[#D4AF37]/35 transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 md:w-1/2">
                        <div className="bg-[#D4AF37]/5 p-2 rounded-lg border border-[#D4AF37]/25 text-[#D4AF37] shrink-0 mt-0.5">
                          <IconComponent size={18} />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-gray-200 text-sm tracking-wide uppercase">{feature.label}</h5>
                          <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{feature.description}</p>
                        </div>
                      </div>

                      {/* Associated Users list */}
                      <div className="min-w-0 md:w-1/2 flex flex-col gap-1.5 md:items-end">
                        <span className="text-[10px] font-bold text-[#D4AF37]/60 uppercase tracking-widest mb-1">
                          Membros Vinculados ({feature.associations.length})
                        </span>
                        
                        {feature.associations.length === 0 ? (
                          <span className="text-[10px] text-gray-500 italic md:text-right">Acesso exclusivo do Owner (vazio)</span>
                        ) : (
                          <div className="flex flex-wrap md:justify-end gap-1.5 max-w-full">
                            {feature.associations.map((assoc) => (
                              <div
                                key={assoc.id}
                                className="bg-black/50 border border-[#1e293b] hover:border-red-500/20 px-2 py-1 rounded-md text-[10px] flex items-center gap-1.5 transition-all group/item"
                              >
                                <span className="text-gray-300 font-mono">{assoc.cim}</span>
                                {assoc.member && (
                                  <span className="text-gray-400 font-medium max-w-[120px] truncate">{assoc.member.nome.split(" ")[0]}</span>
                                )}
                                <button
                                  onClick={() => handleDeleteDelegation(assoc.id, assoc.member?.nome || assoc.cim, feature.label)}
                                  className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-0.5 rounded transition-all cursor-pointer"
                                  title="Revogar"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
