import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
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
  Loader2
} from "lucide-react";

interface AdminPermissionsManagerProps {
  members: any[];
}

export default function AdminPermissionsManager({ members }: AdminPermissionsManagerProps) {
  const [delegations, setDelegations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCim, setNewCim] = useState("");
  const [newPasta, setNewPasta] = useState("2° Vigilante");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Resolve member name from CIM
  const foundMember = newCim.trim()
    ? members.find((m) => m.cim?.toString().trim() === newCim.trim())
    : null;

  useEffect(() => {
    const q = query(collection(db, "adminPermissions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setDelegations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao carregar permissões:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAddDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const targetCim = newCim.trim();
    if (!targetCim) {
      setErrorMessage("Por favor, digite o número do CIM.");
      return;
    }

    // Check if delegation already exists for this CIM and Folder
    const exists = delegations.some(
      (d) => d.cim?.toString().trim() === targetCim && d.pasta === newPasta
    );
    if (exists) {
      setErrorMessage(`Este CIM já possui delegação de acesso para a pasta "${newPasta}".`);
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "adminPermissions"), {
        cim: targetCim,
        pasta: newPasta,
        createdAt: new Date().toISOString()
      });
      setSuccessMessage("Permissão delegada com sucesso!");
      setNewCim("");
    } catch (err: any) {
      console.error("Erro ao salvar permissão:", err);
      setErrorMessage("Erro ao salvar no banco de dados. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDelegation = async (id: string) => {
    if (!window.confirm("Deseja realmente revogar esta permissão de acesso?")) {
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

  return (
    <div id="admin-permissions-manager" className="bg-[#0f172a] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border-b border-[#D4AF37]/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#D4AF37]/10 p-2 rounded-lg border border-[#D4AF37]/30">
            <Shield className="text-[#D4AF37]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">
              Acessos Delegados (Painel Administrativo)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Delegue permissões de acesso às pastas administrativas por CIM dos membros.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col lg:flex-row gap-8">
        {/* Form area */}
        <div className="w-full lg:w-1/3 bg-[#1e293b]/30 p-5 rounded-lg border border-[#1e293b] flex flex-col gap-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37]">
            Nova Delegação
          </h4>

          {errorMessage && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs flex items-center gap-2">
              <UserCheck size={14} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleAddDelegation} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">CIM do Responsável</label>
              <input
                type="text"
                placeholder="Ex: 1234"
                value={newCim}
                onChange={(e) => setNewCim(e.target.value)}
                className="bg-[#0B0B0C] border border-[#1e293b] focus:border-[#D4AF37]/50 rounded-lg px-4 py-2.5 text-white text-sm w-full outline-none transition-colors"
                required
              />
              {foundMember && (
                <div className="mt-2 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded p-2.5 text-xs text-amber-100 flex flex-col gap-0.5 animate-fade-in">
                  <span className="font-bold text-[#D4AF37]">Membro Identificado:</span>
                  <span className="font-medium">{foundMember.nome}</span>
                  <span className="text-gray-400">{foundMember.grau} • {foundMember.loja || "Loja Geral"}</span>
                </div>
              )}
              {newCim.trim() && !foundMember && (
                <div className="mt-2 bg-yellow-900/10 border border-yellow-500/20 rounded p-2 text-xs text-yellow-400 flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  <span>CIM não identificado localmente (ainda poderá ser adicionado).</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Pasta Administrativa</label>
              <select
                value={newPasta}
                onChange={(e) => setNewPasta(e.target.value)}
                className="bg-[#0B0B0C] border border-[#1e293b] focus:border-[#D4AF37]/50 rounded-lg px-3 py-2.5 text-white text-sm w-full outline-none transition-colors"
              >
                <option value="2° Vigilante">2° Vigilante (Oficiais da Loja)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 w-full bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 text-sm cursor-pointer shadow-md shadow-[#D4AF37]/10"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Delegar Acesso</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* List area */}
        <div className="w-full lg:w-2/3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] mb-3">
            Delegações Ativas
          </h4>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#D4AF37]" size={28} />
            </div>
          ) : delegations.length === 0 ? (
            <div className="border border-dashed border-[#1e293b] rounded-lg py-10 px-4 text-center text-gray-500 text-sm">
              Nenhuma delegação configurada ainda. Digite um CIM à esquerda para delegar acesso.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#1e293b]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1e293b]/50 border-b border-[#1e293b] text-gray-300 font-bold uppercase tracking-wider">
                    <th className="p-3">CIM</th>
                    <th className="p-3">Nome Completo</th>
                    <th className="p-3">Pasta Delegada</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/50 text-gray-300">
                  {delegations.map((del) => {
                    const member = members.find(
                      (m) => m.cim?.toString().trim() === del.cim?.toString().trim()
                    );
                    return (
                      <tr key={del.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-mono font-medium text-[#D4AF37]">
                          {del.cim}
                        </td>
                        <td className="p-3 font-medium">
                          {member ? member.nome : <span className="text-gray-500 italic">Membro não cadastrado</span>}
                          {member && (
                            <span className="block text-[10px] text-gray-500 font-normal">
                              {member.grau} • {member.loja || "Loja Geral"}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="bg-amber-950/30 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-semibold text-[10px]">
                            {del.pasta}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteDelegation(del.id)}
                            className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded transition-all"
                            title="Deletar delegação"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
