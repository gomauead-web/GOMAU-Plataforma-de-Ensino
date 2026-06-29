# 📜 CÓDIGOS COMPLETOS DE MIGRAÇÃO - G∴O∴M∴A∴U∴

Este documento contém o código-fonte integral, exato e sem resumos dos arquivos solicitados para migração e controle da plataforma.

---

## Arquivo: `src/pages/ProfilePage.tsx` (Extensão: `.tsx`)

```tsx
import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  Shield,
  Landmark,
  Award,
  Calendar,
  CheckCircle,
  Mail,
  Settings,
  Phone,
  MapPin,
  Hash,
  Compass,
  Save,
  Camera,
  X,
  AlertCircle,
  Plus,
  Trash2,
  LogOut,
  DollarSign,
  Upload,
  Download,
  Copy,
  Check,
  Clock,
  FileText,
  Send,
  Video,
} from "lucide-react";
import { cn } from "../lib/utils";
import { auth, db, storage } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { handleFirestoreError, OperationType } from "../lib/errorHandler";
import Cropper from "react-easy-crop";
import getCroppedImg from "../lib/cropImage";
import toast from "react-hot-toast";

const formatDateForDisplay = (dateStr: string) => {
  if (!dateStr) return "---";
  const cleanStr = dateStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) return cleanStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const [year, month, day] = cleanStr.split("-");
    return `${day}/${month}/${year}`;
  }
  return cleanStr;
};

const formatDateToYYYYMMDD = (dateStr: string) => {
  if (!dateStr) return "";
  const cleanStr = dateStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) {
    const [day, month, year] = cleanStr.split("/");
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    return cleanStr;
  }
  return "";
};

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [personalData, setPersonalData] = useState({
    telefone: user?.telefone || "",
    endereco: user?.endereco || "",
    nome: user?.nome || "",
    cpf: user?.cpf || "",
    dataNascimento: user?.dataNascimento || "",
    emailVinculado: user?.emailVinculado || "",
    cidade: user?.cidade || "",
    uf: user?.uf || "",
    cep: user?.cep || "",
    bairro: user?.bairro || "",
    rua: user?.rua || "",
    numero: user?.numero || "",
    estadoCivil: user?.estadoCivil || "Casado/a",
    esposa: user?.esposa || "",
    emergencia: user?.emergencia || "",
    foneEmergencia: user?.foneEmergencia || "",
    qtdFilhos: user?.qtdFilhos || 0,
    filhos: user?.filhos || [],
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Estados para a Tesouraria Integrada no Perfil
  const [treasuryPayments, setTreasuryPayments] = useState<any[]>([]);
  const [treasuryLoading, setTreasuryLoading] = useState(true);
  const [treasuryConfirming, setTreasuryConfirming] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [treasuryRemetentePix, setTreasuryRemetentePix] = useState("");
  const [treasuryMonth, setTreasuryMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [treasuryInfo, setTreasuryInfo] = useState({
    pixKey: "calepe@gmail.com",
    pixName: "Grande Oriente Maçônico (GOMA)",
    amount: "100.00",
    lodgeName: "",
    instructions:
      "Por favor, realize a transferência pix correspondente à mensalidade do mês de referência. Após pagar, clique em Confirmar Pagamento para notificar o Tesoureiro e atualizar seu status.",
  });

  useEffect(() => {
    if (!user) return;

    const loadProfileTreasury = async () => {
      try {
        // Carrega configurações da tesouraria
        const confRef = doc(db, "configs", "treasury");
        const confSnap = await getDoc(confRef);
        let baseAmount = "100.00";
        let instructionsText = "";
        if (confSnap.exists()) {
          const data = confSnap.data() as any;
          baseAmount = data.amount || "100.00";
          instructionsText = data.instructions || "";
        }

        let finalAmount = baseAmount;
        let lodgeNameText = user.loja || "";

        // Query configs/security to fetch the Lodges and match dynamic monthly fee
        try {
          const securitySnap = await getDoc(doc(db, "configs", "security"));
          if (securitySnap.exists()) {
            const data = securitySnap.data();
            if (data.lojas && Array.isArray(data.lojas)) {
              const matchedLoja = data.lojas.find((l: any) => {
                if (user.loja && l.nome && l.nome.toLowerCase().trim() === user.loja.toLowerCase().trim()) {
                  return true;
                }
                if (user.cim && l.prefixo === String(user.cim).substring(0, 2)) {
                  return true;
                }
                return false;
              });

              if (matchedLoja) {
                lodgeNameText = matchedLoja.nome;
                if (matchedLoja.mensalidade !== undefined && matchedLoja.mensalidade !== null && matchedLoja.mensalidade !== "") {
                  finalAmount = String(matchedLoja.mensalidade);
                }
              }
            }
          }
        } catch (errSec) {
          console.error("Erro ao carregar valor da mensalidade customizada da loja no perfil:", errSec);
        }

        setTreasuryInfo(prev => ({
          ...prev,
          pixKey: confSnap.exists() ? (confSnap.data() as any).pixKey || prev.pixKey : prev.pixKey,
          pixName: confSnap.exists() ? (confSnap.data() as any).pixName || prev.pixName : prev.pixName,
          instructions: instructionsText || prev.instructions,
          amount: finalAmount,
          lodgeName: lodgeNameText
        }));

        // Carrega mensalidades enviadas pelo obreiro sem orderBy composto para evitar dependência de índices
        const q = query(
          collection(db, "mensalidades"),
          where("uid", "==", user.uid),
        );
        const snaps = await getDocs(q);
        const list = snaps.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        // Ordena no client side (decrescente por mesRef)
        list.sort((a, b) => (b.mesRef || "").localeCompare(a.mesRef || ""));
        setTreasuryPayments(list);
      } catch (err) {
        console.error("Erro ao carregar dados financeiros no perfil:", err);
      } finally {
        setTreasuryLoading(false);
      }
    };
    loadProfileTreasury();
  }, [user]);

  const handleProfileConfirmPayment = async () => {
    if (!user) return;
    if (!treasuryRemetentePix.trim()) {
      toast.error(
        "Por favor, informe a identificação do Pix (Titular da Conta) para validação.",
      );
      return;
    }
    setTreasuryConfirming(true);

    const targetValor = treasuryInfo.amount || "100.00";
    try {
      await addDoc(collection(db, "mensalidades"), {
        uid: user.uid,
        userName: user.nome || "",
        userEmail: user.email || "",
        userCim: user.cim || "",
        loja: user.loja || treasuryInfo.lodgeName || "",
        mesRef: treasuryMonth,
        valor: targetValor,
        comprovanteUrl: "",
        remetentePix: treasuryRemetentePix.trim(),
        tipo: "mensalidade",
        status: "em_analise",
        dataEnvio: serverTimestamp(),
      });

      // WhatsApp redirection message
      const message =
        `Olá Tesoureiro, acabei de realizar o pagamento da minha contribuição mensal!\n\n` +
        `• Nome: ${user.nome || "Nobre Irmão"}\n` +
        `• CIM: ${user.cim || "N/A"}\n` +
        `• Oficina: ${user.loja || treasuryInfo.lodgeName || "N/A"}\n` +
        `• Competência: ${treasuryMonth}\n` +
        `• Pix em nome de: ${treasuryRemetentePix.trim()}\n` +
        `• Valor: R$ ${targetValor}\n\n` +
        `Por favor, realize a validação na área do Gestor!`;

      const whatsappUrl = `https://api.whatsapp.com/send?phone=5531994375772&text=${encodeURIComponent(message)}`;

      // Open WhatsApp
      window.open(whatsappUrl, "_blank");

      toast.success("Confirmação enviada! Redirecionando ao WhatsApp...");
      setTreasuryRemetentePix("");

      // Recarrega registros ordenando em memória
      const q = query(
        collection(db, "mensalidades"),
        where("uid", "==", user.uid),
      );
      const snaps = await getDocs(q);
      const list = snaps.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => (b.mesRef || "").localeCompare(a.mesRef || ""));
      setTreasuryPayments(list);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar confirmação.");
    } finally {
      setTreasuryConfirming(false);
    }
  };

  // Sincronizar dados locais com o objeto User (que agora é atualizado via Realtime no AuthContext)
  useEffect(() => {
    if (user && !editing) {
      setPersonalData({
        telefone: user.telefone || "",
        endereco: user.endereco || "",
        nome: user.nome || "",
        cpf: user.cpf || "",
        dataNascimento: user.dataNascimento || "",
        emailVinculado: user.emailVinculado || "",
        cidade: user.cidade || "",
        uf: user.uf || "",
        cep: user.cep || "",
        bairro: user.bairro || "",
        rua: user.rua || "",
        numero: user.numero || "",
        estadoCivil: user.estadoCivil || "Casado/a",
        esposa: user.esposa || "",
        emergencia: user.emergencia || "",
        foneEmergencia: user.foneEmergencia || "",
        qtdFilhos: user.qtdFilhos || 0,
        filhos: user.filhos || [],
      });
    }
  }, [user, editing]);

  const handleAddFilho = () => {
    setPersonalData({
      ...personalData,
      filhos: [...personalData.filhos, { nome: "", dataNascimento: "" }],
      qtdFilhos: personalData.filhos.length + 1,
    });
  };

  const handleRemoveFilho = (index: number) => {
    const newFilhos = personalData.filhos.filter((_, i) => i !== index);
    setPersonalData({
      ...personalData,
      filhos: newFilhos,
      qtdFilhos: newFilhos.length,
    });
  };

  const handleChangeFilho = (
    index: number,
    field: "nome" | "dataNascimento",
    value: string,
  ) => {
    const newFilhos = [...personalData.filhos];
    newFilhos[index][field] = value;
    setPersonalData({ ...personalData, filhos: newFilhos });
  };

  // Mask Helpers
  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  // Crop states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  if (!user) return null;

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl as string);
    }
    e.target.value = "";
  };

  const readFile = (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const showCroppedImage = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      setUploadingAvatar(true);
      const croppedImageBase64 = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
      );
      if (!croppedImageBase64) throw new Error("Failed to crop image");

      await uploadAvatar(croppedImageBase64);
    } catch (e) {
      console.error(e);
      setUploadingAvatar(false);
      setImageSrc(null);
    }
  };

  const uploadAvatar = async (base64Url: string) => {
    try {
      if (!user?.uid) throw new Error("Usuário não autenticado");

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        photoUrl: base64Url,
      });

      toast.success("Foto de perfil atualizada!");
    } catch (err: any) {
      console.error("Erro ao fazer upload do avatar:", err);
      toast.error("Erro ao salvar foto.");
    } finally {
      setUploadingAvatar(false);
      setImageSrc(null);
    }
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    // Validação básica do CPF se preenchido
    if (
      personalData.cpf &&
      personalData.cpf.length < 14 &&
      personalData.cpf.length > 0
    ) {
      toast.error("CPF incompleto.");
      return;
    }

    setSaving(true);
    try {
      if (!user?.uid) throw new Error("Usuário não autenticado");

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        telefone: personalData.telefone,
        endereco: personalData.endereco,
        nome: personalData.nome,
        cpf: personalData.cpf,
        dataNascimento: personalData.dataNascimento,
        emailVinculado: personalData.emailVinculado,
        cidade: personalData.cidade,
        uf: personalData.uf,
        cep: personalData.cep,
        bairro: personalData.bairro,
        rua: personalData.rua,
        numero: personalData.numero,
        estadoCivil: personalData.estadoCivil,
        esposa: personalData.esposa,
        emergencia: personalData.emergencia,
        foneEmergencia: personalData.foneEmergencia,
        qtdFilhos: Number(personalData.qtdFilhos),
        filhos: personalData.filhos,
        perfilAtualizadoEm: serverTimestamp(),
      });

      await addDoc(collection(db, "history"), {
        userId: user.uid,
        tipo: "atividade",
        titulo: "Perfil Atualizado",
        descricao: "O membro atualizou seus dados pessoais.",
        data: new Date().toLocaleDateString("pt-br"),
        hora: new Date().toLocaleTimeString("pt-br", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        autor: "Sistema",
        criadoEm: serverTimestamp(),
      });

      setEditing(false);
      toast.success("Perfil atualizado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar dados pessoais:", err);
      toast.error("Ocorreu um erro ao salvar os dados. Verifique sua conexão.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <h1 className="text-3xl font-semibold text-[#D4AF37] mb-2">
            Seu Perfil
          </h1>
          <p className="text-gray-400">
            Gerencie suas informações maçônicas e histórico.
          </p>
        </div>
      </header>

      {/* Main Profile Card */}
      <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl overflow-hidden relative">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-[#1e293b] via-[#D4AF37]/20 to-[#1e293b] flex items-center justify-center opacity-80">
          {/* Can put a temple graphic here */}
        </div>

        {/* Avatar & Basic Info */}
        <div className="px-8 pb-8 flex flex-col md:flex-row gap-6 items-start relative mt-[-40px]">
          <div className="relative group">
            <div className="w-24 h-24 flex-shrink-0 rounded-full bg-[#0A0E1A] border-4 border-[#0F172A] flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.15)] ring-1 ring-[#D4AF37]/50 relative z-10">
              {user.photoUrl || auth.currentUser?.photoURL ? (
                <img
                  src={user.photoUrl || auth.currentUser?.photoURL || ""}
                  alt={user.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-3xl text-[#D4AF37] font-sans font-bold">
                  {user.nome.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <label
              className="absolute bottom-0 right-0 w-8 h-8 flex items-center justify-center bg-[#D4AF37] hover:bg-[#C9A227] rounded-full cursor-pointer transition-colors z-20 shadow-lg border-2 border-[#0F172A]"
              title="Trocar Foto"
            >
              {uploadingAvatar ? (
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
              ) : (
                <Camera size={14} className="text-black" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploadingAvatar}
              />
            </label>
          </div>

          {imageSrc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-[#0F172A] border border-[#D4AF37]/30 rounded-xl overflow-hidden w-full max-w-md shadow-2xl flex flex-col">
                <div className="p-4 border-b border-[#1e293b] flex justify-between items-center">
                  <h3 className="text-[#D4AF37] font-medium">Ajustar Foto</h3>
                  <button
                    onClick={() => setImageSrc(null)}
                    className="text-gray-400 hover:text-white"
                    disabled={uploadingAvatar}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="relative h-64 bg-black">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
                <div className="p-4 space-y-4 border-t border-[#1e293b]">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400">Zoom</label>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full accent-[#D4AF37]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setImageSrc(null)}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                      disabled={uploadingAvatar}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={showCroppedImage}
                      disabled={uploadingAvatar}
                      className="bg-[#D4AF37] text-black px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
                    >
                      {uploadingAvatar ? "Salvando..." : "Salvar Foto"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 pt-12 md:pt-14 pb-2">
            <h2 className="text-2xl font-semibold text-gray-100 flex items-center gap-3">
              {user.nome}
              {user.role === "gestor" && (
                <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] uppercase font-bold px-2 py-1 rounded border border-[#D4AF37]/30">
                  Administrador
                </span>
              )}
            </h2>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail size={14} className="text-[#D4AF37]" /> {user.email}
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone size={14} className="text-[#D4AF37]" />{" "}
                {user.telefone || "Telefone não cadastrado"}
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto pt-4 md:pt-14 flex flex-col md:flex-row items-center gap-3">
            <button
              onClick={() => setEditing(!editing)}
              className="w-full md:w-auto bg-[#1e293b] text-gray-200 border border-[#1e293b] px-4 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-colors hover:border-[#D4AF37]/50"
            >
              <Settings size={16} />{" "}
              {editing ? "Cancelar" : "Editar Dados Pessoais"}
            </button>
            {user.role === "gestor" && (
              <button
                onClick={() => navigate("/gestor")}
                className="w-full md:w-auto bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-4 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-transform hover:scale-105"
              >
                <Shield size={16} /> Painel Gestor
              </button>
            )}
          </div>
        </div>

        {/* Info Grid (Masonic) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1e293b] border-t border-[#1e293b]">
          <div className="bg-[#0F172A] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-medium uppercase tracking-wider mb-1">
              <Award size={14} className="text-[#D4AF37]" /> Grau
            </div>
            <span className="text-sm sm:text-base text-gray-200 font-semibold">
              {user.grau}
            </span>
          </div>
          <div className="bg-[#0F172A] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-medium uppercase tracking-wider mb-1">
              <Compass size={14} className="text-[#D4AF37]" /> Rito
            </div>
            <span className="text-sm sm:text-base text-gray-200 font-semibold">
              {user.rito || "REAA"}
            </span>
          </div>
          <div className="bg-[#0F172A] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-medium uppercase tracking-wider mb-1">
              <Landmark size={14} className="text-[#D4AF37]" /> Loja Base
            </div>
            <span className="text-sm sm:text-base text-gray-200 font-semibold">
              {user.loja}
            </span>
          </div>
          <div className="bg-[#0F172A] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-medium uppercase tracking-wider mb-1">
              <Hash size={14} className="text-[#D4AF37]" /> CIM / Matrícula
            </div>
            <span className="text-sm sm:text-base text-gray-200 font-semibold">
              {user.cim || "Não cadastrado"}
            </span>
          </div>
          <div className="bg-[#0F172A] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-medium uppercase tracking-wider mb-1">
              <Shield size={14} className="text-[#D4AF37]" /> Cargo
            </div>
            <span className="text-sm sm:text-base text-gray-200 font-semibold">
              {user.cargo || "Nenhum"}
            </span>
          </div>
          <div className="bg-[#0F172A] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-medium uppercase tracking-wider mb-1">
              <Calendar size={14} className="text-[#D4AF37]" /> Iniciação
            </div>
            <span className="text-sm sm:text-base text-gray-200 font-semibold">
              {user.dataIniciacao || "Não informada"}
            </span>
          </div>
          <div className="bg-[#0F172A] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-medium uppercase tracking-wider mb-1">
              <Calendar size={14} className="text-[#D4AF37]" /> Membro Desde
            </div>
            <span className="text-sm sm:text-base text-gray-200 font-semibold">
              {user.createdAt
                ? typeof user.createdAt.toMillis === "function"
                  ? new Date(user.createdAt.toMillis()).toLocaleDateString(
                      "pt-BR",
                    )
                  : "Hoje"
                : "Hoje"}
            </span>
          </div>
          <div className="bg-[#0F172A] p-4 flex flex-col gap-2 flex items-center justify-center">
            <span
              className={cn(
                "px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                user.status === "ativo"
                  ? "bg-green-900/30 text-green-400 border-green-500/30"
                  : "bg-red-900/30 text-red-400 border-red-500/30",
              )}
            >
              {user.status}
            </span>
          </div>
        </div>
      </div>


      {/* Personal & Detail Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contato e Localização */}
        <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl p-6 shadow-lg">
          <h3 className="text-[#D4AF37] font-semibold mb-4 flex items-center gap-2">
            <MapPin size={18} /> Localização e Contato
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-[#1e293b] pb-2">
              <span className="text-gray-500 text-[10px] uppercase font-bold">
                E-mail Vinculado
              </span>
              <span className="text-gray-300 text-sm font-medium">
                {user.emailVinculado || user.email}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#1e293b] pb-2">
              <span className="text-gray-500 text-[10px] uppercase font-bold">
                CPF
              </span>
              <span className="text-gray-300 text-sm font-medium">
                {user.cpf || "---"}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#1e293b] pb-2">
              <span className="text-gray-500 text-[10px] uppercase font-bold">
                Cidade/UF
              </span>
              <span className="text-gray-300 text-sm font-medium">
                {user.cidade ? `${user.cidade}/${user.uf}` : "---"}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#1e293b] pb-2">
              <span className="text-gray-500 text-[10px] uppercase font-bold">
                Bairro
              </span>
              <span className="text-gray-300 text-sm font-medium">
                {user.bairro || "---"}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#1e293b] pb-2">
              <span className="text-gray-500 text-[10px] uppercase font-bold">
                Logradouro / Rua
              </span>
              <span className="text-gray-300 text-sm font-medium">
                {user.rua || "---"}
                {user.numero ? `, ${user.numero}` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-[10px] uppercase font-bold">
                CEP
              </span>
              <span className="text-gray-300 text-sm font-medium">
                {user.cep || "---"}
              </span>
            </div>
          </div>
        </div>

        {/* Emergência e Diversos */}
        <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl p-6 shadow-lg">
          <h3 className="text-[#D4AF37] font-semibold mb-4 flex items-center gap-2">
            <AlertCircle size={18} /> Informações Adicionais
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-[#1e293b] pb-2">
              <span className="text-gray-500 text-[10px] uppercase font-bold">
                Nascimento
              </span>
              <span className="text-gray-300 text-sm font-medium">
                {formatDateForDisplay(user.dataNascimento)}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#1e293b] pb-2">
              <span className="text-gray-500 text-[10px] uppercase font-bold">
                Estado Civil
              </span>
              <span className="text-gray-300 text-sm font-medium">
                {user.estadoCivil || "---"}
              </span>
            </div>
            {user.esposa && (
              <div className="flex justify-between border-b border-[#1e293b] pb-2">
                <span className="text-gray-500 text-[10px] uppercase font-bold">
                  Cônjuge
                </span>
                <span className="text-gray-300 text-sm font-medium">
                  {user.esposa}
                </span>
              </div>
            )}
            <div className="flex flex-col border-b border-[#1e293b] pb-2">
              <div className="flex justify-between">
                <span className="text-gray-500 text-[10px] uppercase font-bold">
                  Filhos ({user.qtdFilhos || 0})
                </span>
              </div>
              {user.filhos && user.filhos.length > 0 && (
                <div className="mt-2 space-y-1">
                  {user.filhos.map((filho, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-xs bg-black/20 p-2 rounded border border-white/5"
                    >
                      <span className="text-gray-300 font-medium">
                        {filho.nome || "Não informado"}
                      </span>
                      <span className="text-gray-500">
                        {formatDateForDisplay(filho.dataNascimento)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between border-b border-[#1e293b] pb-2">
              <span className="text-gray-500 text-[10px] uppercase font-bold">
                Emergência
              </span>
              <span className="text-gray-300 text-sm font-medium">
                {user.emergencia || "---"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-[10px] uppercase font-bold">
                Fone Emergência
              </span>
              <span className="text-gray-300 text-sm font-medium">
                {user.foneEmergencia || "---"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <div className="bg-[#0A0E1A] border-2 border-[#D4AF37]/30 rounded-xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
          <h3 className="text-xl font-semibold text-[#D4AF37] mb-6 flex items-center gap-2">
            <User size={20} /> Atualizar Seus Dados Pessoais
          </h3>
          <form onSubmit={handleSavePersonal} className="space-y-8">
            {/* Seção 1: Dados Pessoais Identificadores */}
            <div className="space-y-4">
              <h4 className="text-[#D4AF37] text-sm font-bold border-b border-[#1e293b] pb-2 uppercase tracking-wider flex justify-between items-center">
                <span>Identificação e Contato</span>
                <span className="text-[10px] text-red-500 font-bold bg-red-900/10 px-2 py-0.5 rounded border border-red-900/30">
                  Campos Maçônicos Bloqueados para Edição
                </span>
              </h4>
              {user?.role === "membro" && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-3 mb-2">
                  <Shield size={16} className="text-red-500" />
                  <p className="text-[10px] text-red-200 leading-tight">
                    <span className="font-bold">AVISO:</span> Dados como Grau,
                    Loja, Rito e CIM são geridos apenas pelo Gestor. Para
                    correções, use a aba de Solicitações.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={personalData.nome}
                    onChange={(e) =>
                      setPersonalData({ ...personalData, nome: e.target.value })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={personalData.cpf}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        cpf: maskCPF(e.target.value),
                      })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    Data Nascimento
                  </label>
                  <input
                    type="date"
                    value={formatDateToYYYYMMDD(personalData.dataNascimento)}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        dataNascimento: e.target.value,
                      })
                    }
                    style={{ colorScheme: "dark" }}
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={personalData.telefone}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        telefone: maskPhone(e.target.value),
                      })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    E-mail Alternativo
                  </label>
                  <input
                    type="email"
                    value={personalData.emailVinculado}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        emailVinculado: e.target.value,
                      })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    Estado Civil
                  </label>
                  <select
                    value={personalData.estadoCivil}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        estadoCivil: e.target.value,
                      })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                  >
                    <option value="Solteiro/a">Solteiro/a</option>
                    <option value="Casado/a">Casado/a</option>
                    <option value="Viúvo/a">Viúvo/a</option>
                    <option value="Divorciado/a">Divorciado/a</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    Cônjuge (Esposa)
                  </label>
                  <input
                    type="text"
                    value={personalData.esposa}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        esposa: e.target.value,
                      })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    Qtd Filhos
                  </label>
                  <input
                    type="number"
                    value={personalData.qtdFilhos}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        qtdFilhos: Number(e.target.value),
                      })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                    disabled
                  />
                </div>
              </div>

              <div className="mt-4 bg-[#0F172A]/50 p-4 rounded-xl border border-[#1e293b]">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    Dados dos Filhos
                  </label>
                  <button
                    type="button"
                    onClick={handleAddFilho}
                    className="text-xs bg-[#1e293b] hover:bg-[#D4AF37] hover:text-black text-gray-300 font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                  >
                    <Plus size={14} /> Adicionar Filho
                  </button>
                </div>
                {personalData.filhos.length === 0 && (
                  <p className="text-[10px] text-gray-500 italic ml-1">
                    Nenhum filho cadastrado.
                  </p>
                )}
                <div className="space-y-3">
                  {personalData.filhos.map((filho, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row gap-3 items-end bg-[#0A0E1A] p-3 rounded-lg border border-[#1e293b]"
                    >
                      <div className="flex-1 w-full flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          value={filho.nome}
                          onChange={(e) =>
                            handleChangeFilho(idx, "nome", e.target.value)
                          }
                          className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-3 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm w-full"
                          placeholder="Ex: João da Silva"
                        />
                      </div>
                      <div className="flex-1 w-full flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                          Data Nascimento
                        </label>
                        <input
                          type="date"
                          value={formatDateToYYYYMMDD(filho.dataNascimento)}
                          onChange={(e) =>
                            handleChangeFilho(
                              idx,
                              "dataNascimento",
                              e.target.value,
                            )
                          }
                          style={{ colorScheme: "dark" }}
                          className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-3 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFilho(idx)}
                        className="p-2 bg-red-900/30 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors mt-2 sm:mt-0 flex-shrink-0"
                        title="Remover Filho"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Seção 2: Localização */}
            <div className="space-y-4">
              <h4 className="text-[#D4AF37] text-sm font-bold border-b border-[#1e293b] pb-2 uppercase tracking-wider">
                Endereço de Residência
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2 lg:col-span-1">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    Logradouro (Rua/Av)
                  </label>
                  <input
                    type="text"
                    value={personalData.rua}
                    onChange={(e) =>
                      setPersonalData({ ...personalData, rua: e.target.value })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={personalData.numero}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        numero: e.target.value,
                      })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                    placeholder="Ex: 123"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={personalData.bairro}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        bairro: e.target.value,
                      })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={personalData.cidade}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        cidade: e.target.value,
                      })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    UF / Estado
                  </label>
                  <input
                    type="text"
                    value={personalData.uf}
                    onChange={(e) =>
                      setPersonalData({ ...personalData, uf: e.target.value })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                    maxLength={2}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={personalData.cep}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        cep: maskCEP(e.target.value),
                      })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            {/* Seção 3: Emergência */}
            <div className="space-y-4">
              <h4 className="text-[#D4AF37] text-sm font-bold border-b border-[#1e293b] pb-2 uppercase tracking-wider">
                Contatos de Emergência
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    Contato de Emergência (Nome/Parentesco)
                  </label>
                  <input
                    type="text"
                    value={personalData.emergencia}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        emergencia: e.target.value,
                      })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                    placeholder="Ex: Maria (Esposa)"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold ml-1">
                    Telefone de Emergência
                  </label>
                  <input
                    type="text"
                    value={personalData.foneEmergencia}
                    onChange={(e) =>
                      setPersonalData({
                        ...personalData,
                        foneEmergencia: maskPhone(e.target.value),
                      })
                    }
                    className="bg-[#0F172A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37]/50 outline-none text-sm"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 italic">
              Observação: Dados maçônicos (Grau, Loja, Rito, etc) só podem ser
              alterados pelo Gestor após verificação de documentos.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#D4AF37] text-black px-8 py-2 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Save size={18} />{" "}
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Carteira de Identidade Maçônica (CIM) */}
        <div className="bg-[#0A0E1A] border-2 border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl mb-8">
          <div className="bg-gradient-to-r from-[#1A1A1A] to-[#0A0A0A] p-6 border-b border-[#D4AF37]/20 flex justify-between items-center sm:flex-row flex-col gap-4 text-center sm:text-left">
            <div>
              <h3 className="text-xl font-bold text-[#D4AF37] tracking-wider uppercase">
                Identidade Maçônica Digital (Modelo)
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Este é o modelo de carteira divulgado para os membros.
              </p>
            </div>
          </div>

          <div className="p-8 flex items-center justify-center bg-black/60 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05),transparent_70%)] pointer-events-none" />
            <div className="flex justify-center w-full max-w-full overflow-hidden">
              <img
                src={
                  [
                    "calepi@gmail.com",
                    "calepe@gmail.com",
                    "tazmaniacrvg@gmail.com",
                    "tazmanicrvg@gmail.com",
                  ].includes((user.email || "").toLowerCase().trim())
                    ? "/CIM%20Frente.png"
                    : "/carteira.png"
                }
                alt="Carteira Maçônica"
                className="w-[800px] max-w-full h-auto object-contain rounded-2xl shadow-2xl border border-[#D4AF37]/20"
              />
            </div>
          </div>
        </div>

      {/* Módulo de Contribuição Financeira / Tesouraria no Perfil */}
      <div className="bg-[#0A0E1A] border-2 border-[#D4AF37]/20 rounded-xl overflow-hidden shadow-2xl mb-8 p-6">
        <div className="border-b border-[#D4AF37]/20 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-[#D4AF37] tracking-wider uppercase flex items-center gap-2">
              <DollarSign className="text-[#D4AF37]" size={24} /> Contribuição &
              Mensalidades
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Veja seus valores em aberto, copie a chave Pix e envie os
              comprovantes diretamente do seu perfil.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1 rounded-full border border-[#D4AF37]/30 text-xs font-semibold animate-pulse uppercase tracking-widest">
            <AlertCircle size={12} /> Ambiente de Testes
          </div>
        </div>

        {/* Painel Interno */}
        {treasuryLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-[#0F172A] rounded-lg"></div>
            <div className="h-32 bg-[#0F172A] rounded-lg"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
            {/* Coluna 1: Info & Upload */}
            <div className="lg:col-span-5 space-y-6">
              {/* Dados do Pix */}
              <div className="bg-[#0F172A] border border-[#D4AF37]/30 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 blur-2xl rounded-full"></div>
                <h4 className="text-white font-medium text-sm mb-3">
                  Dados para Trânsito / Transferência
                </h4>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                      Valor da Contribuição
                    </span>
                    <span className="text-white text-base font-semibold flex items-center gap-2 flex-wrap">
                      R$ {treasuryInfo.amount || "100,00"}
                      {treasuryInfo.lodgeName && (
                        <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full font-semibold border border-[#D4AF37]/30">
                          {treasuryInfo.lodgeName}
                        </span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                      Beneficiário
                    </span>
                    <span className="text-xs text-gray-200 block">
                      {treasuryInfo.pixName || "Administração Geral GOMA"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                      Chave Pix (Copia e Cola / E-mail)
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] sm:text-xs text-[#D4AF37] font-mono bg-black/50 px-2 py-1.5 rounded border border-[#1e293b] flex-1 select-all break-all overflow-hidden whitespace-nowrap text-ellipsis">
                        {treasuryInfo.pixKey || "Não configurada"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (treasuryInfo.pixKey) {
                            navigator.clipboard.writeText(treasuryInfo.pixKey);
                            setCopiedPix(true);
                            toast.success("Chave Pix copiada com sucesso!");
                            setTimeout(() => setCopiedPix(false), 2000);
                          } else {
                            toast.error(
                              "Nenhuma chave Pix foi configurada pela administração.",
                            );
                          }
                        }}
                        className="p-2 bg-[#D4AF37] text-black hover:bg-[#C5A028] rounded-lg transition-colors flex items-center justify-center shrink-0"
                        title="Copiar Chave Pix"
                      >
                        {copiedPix ? (
                          <Check className="text-green-500" size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {treasuryInfo.instructions && (
                    <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-2.5 rounded text-[11px] text-[#D4AF37] mt-2 font-sans">
                      {treasuryInfo.instructions}
                    </div>
                  )}
                </div>
              </div>

              {/* Formulário de Envio */}
              <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl p-5 space-y-4">
                <h4 className="text-white font-medium text-sm">
                  Confirmar Pagamento de Mensalidade
                </h4>

                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Competência (Mês de Referência)
                  </label>
                  <input
                    type="month"
                    value={treasuryMonth}
                    onChange={(e) => setTreasuryMonth(e.target.value)}
                    className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37] text-xs font-sans"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Quem fez o Pix? (Titular da Conta)
                  </label>
                  <input
                    type="text"
                    value={treasuryRemetentePix}
                    onChange={(e) => setTreasuryRemetentePix(e.target.value)}
                    placeholder="Ex: Diogo Moura ou Pix da conta de Maria"
                    className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37] text-xs font-sans placeholder-gray-650"
                  />
                  <p className="text-[9px] text-gray-500 mt-1 leading-relaxed">
                    Informe o nome do titular pagador para baixa rápida na
                    Tesouraria (via manual fora do app).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleProfileConfirmPayment}
                  disabled={treasuryConfirming}
                  className="w-full bg-[#D4AF37] text-black text-xs font-bold py-2.5 rounded-lg hover:bg-[#C5A028] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  {treasuryConfirming ? (
                    <>Processando...</>
                  ) : (
                    <>
                      <Send size={14} /> Confirmar Pagamento
                    </>
                  )}
                </button>

                <p className="text-[10px] text-gray-500 leading-relaxed text-center font-sans">
                  Após clicar, abriremos o WhatsApp do Tesoureiro com a mensagem
                  preenchida contendo seu nome, CIM e mês de referência para
                  baixa.
                </p>
              </div>
            </div>

            {/* Coluna 2: Histórico */}
            <div className="lg:col-span-7">
              <div className="bg-[#0F172A]/50 border border-[#1e293b] rounded-xl p-5 h-full flex flex-col">
                <h4 className="text-white font-medium text-sm mb-4">
                  Seu Histórico de Envios e Confirmações
                </h4>

                <div className="flex-1 overflow-y-auto max-h-[365px] space-y-3 pr-1 scrollbar-thin scrollbar-thumb-[#1e293b]">
                  {treasuryPayments.length === 0 ? (
                    <div className="text-center py-12 border border-[#1e293b] border-dashed rounded-lg bg-[#0A0E1A]">
                      <FileText
                        className="mx-auto text-gray-600 mb-2"
                        size={28}
                      />
                      <p className="text-xs text-gray-500 font-sans">
                        Nenhuma confirmação ou pagamento registrado por você.
                      </p>
                    </div>
                  ) : (
                    treasuryPayments.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-lg bg-[#0A0E1A] border border-[#1e293b] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-sans"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">
                              {p.mesRef}
                            </span>
                            <span
                              className={cn(
                                "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border",
                                p.status === "aprovado" &&
                                  "bg-green-500/10 text-green-500 border-green-500/20",
                                p.status === "rejeitado" &&
                                  "bg-red-500/10 text-red-500 border-red-500/20",
                                p.status === "em_analise" &&
                                  "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                              )}
                            >
                              {p.status === "aprovado" && (
                                <CheckCircle
                                  className="text-green-500"
                                  size={12}
                                />
                              )}
                              {p.status === "rejeitado" && (
                                <AlertCircle
                                  className="text-red-500"
                                  size={12}
                                />
                              )}
                              {p.status === "em_analise" && (
                                <Clock className="text-yellow-500" size={12} />
                              )}
                              {p.status === "aprovado"
                                ? "Pago"
                                : p.status === "rejeitado"
                                  ? "Recusado"
                                  : "Em Análise"}
                            </span>
                            {p.tipo && (
                              <span
                                className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded ${p.tipo === "livro" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : p.tipo === "assinatura" ? "bg-indigo-500/20 text-indigo-300" : "bg-blue-500/20 text-blue-300"}`}
                              >
                                {p.tipo === "livro"
                                  ? "Livro Premium"
                                  : p.tipo === "assinatura"
                                    ? "Assinatura"
                                    : "Mensalidade"}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                            <div>Valor: R$ {p.valor || "---"}</div>
                            {p.remetentePix && (
                              <div className="text-[11px] text-[#D4AF37]/80">
                                Pix por:{" "}
                                <strong className="text-white font-medium">
                                  {p.remetentePix}
                                </strong>
                              </div>
                            )}
                          </div>
                          {p.comentarioGestor && (
                            <div className="text-[11px] text-red-400 mt-1.5 bg-red-500/5 p-1.5 rounded border border-red-500/10">
                              Nota da Tesouraria: {p.comentarioGestor}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-start sm:items-end text-[10px] text-gray-500 gap-1.5 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1e293b]/60">
                          <span>
                            {p.dataEnvio?.toDate
                              ? p.dataEnvio.toDate().toLocaleDateString("pt-BR")
                              : ""}
                          </span>
                          {p.comprovanteUrl && (
                            <a
                              href={p.comprovanteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[#D4AF37] hover:underline hover:text-[#C5A028] font-semibold text-xs mt-0.5"
                            >
                              <Download size={12} /> Comprovante
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Configuration */}
      <div className="flex items-center justify-between mt-4 border-b border-[#1e293b] pb-4">
        <h2 className="text-xl font-medium text-[#D4AF37]">
          Segurança e Acesso
        </h2>
      </div>
      <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
          <div>
            <h3 className="text-gray-200 font-medium font-sans">
              Sessão Ativa
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Sessão logada via Google Authentication.
            </p>
          </div>
          <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-500/20 text-sm">
            <CheckCircle size={14} /> Conta Autenticada
          </div>
        </div>
        <div className="pt-6 flex justify-between items-center">
          <div>
            <h3 className="text-gray-200 font-medium font-sans">
              Permissões de Sistema
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Como <strong>{user.role}</strong>, você pode acessar as funções de{" "}
              {user.role === "gestor"
                ? "administração total do sistema, incluindo graus, membros e aprovação de conteúdo"
                : "visualização de conteúdos liberados para seu grau, e realizar solicitações de avanço"}
              .
            </p>
          </div>
          <button
            onClick={async () => {
              if (confirm("Deseja realmente encerrar sua sessão?")) {
                await logout();
                navigate("/login");
              }
            }}
            className="bg-red-900/20 text-red-500 border border-red-500/30 px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all font-bold"
          >
            <LogOut size={18} /> Encerrar Sessão
          </button>
        </div>
      </div>
    </div>
  );
}

```

---

## Arquivo: `src/pages/RequestsPage.tsx` (Extensão: `.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, addDoc, serverTimestamp, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { FileText, Send, Eye, Calendar, ArrowUp, HeartHandshake, LogOut, Upload, Link, Edit3, Trash2, Video } from 'lucide-react';
import { cn } from '../lib/utils';

interface RequestItem {
  id: string;
  userId: string;
  tipo: string;
  descricao: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'em_analise';
  criadoEm: any;
  analisadoEm?: any;
  comentarioGestor?: string | null;
  arquivoUrl?: string | null;
  numero?: string;
  temaCentral?: string;
  simbolosPrincipais?: string;
}

export function RequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [pranchaNumero, setPranchaNumero] = useState('Pr∴ 01');
  const [pranchaTema, setPranchaTema] = useState('');
  const [pranchaSimbolos, setPranchaSimbolos] = useState('');
  const [pranchaLink, setPranchaLink] = useState('');
  const [pranchaFile, setPranchaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadRequests() {
    if (!user) return;
    try {
      const q = query(collection(db, 'requests'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RequestItem));
      // Sort manually since we might not have a composite index right away
      fetched.sort((a, b) => {
         const timeA = a.criadoEm?.toMillis ? a.criadoEm.toMillis() : 0;
         const timeB = b.criadoEm?.toMillis ? b.criadoEm.toMillis() : 0;
         return timeB - timeA;
      });
      setRequests(fetched);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'requests');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo || !user) return;
    
    if (tipo === 'Prancha (Resumo/Estudo)' && !pranchaFile && !pranchaLink.trim()) {
        alert("Para Pranchas, é necessário anexar o arquivo ou fornecer um Link Externo.");
        return;
    }
    
    if (tipo !== 'Prancha (Resumo/Estudo)' && !descricao) {
        alert("A descrição é obrigatória.");
        return;
    }
    
    setSubmitting(true);
    if (pranchaFile) setUploadProgress(1);

    try {
      let arquivoUrl = pranchaLink;
      if (pranchaFile) {
        console.log("Tentando upload em background...");
        try {
          const extension = pranchaFile.name.split('.').pop() || 'pdf';
          const safeName = `file_${Date.now()}.${extension}`;
          const fileRef = ref(storage, `pranchas/${user.uid}/${safeName}`);
          
          const uploadTask = uploadBytesResumable(fileRef, pranchaFile);

          const uploadedUrl = await new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => {
              uploadTask.cancel();
              reject(new Error("Timeout"));
            }, 15000);

            uploadTask.on('state_changed', 
              (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setUploadProgress(progress);
              }, 
              (error) => { clearTimeout(timeout); reject(error); }, 
              async () => {
                clearTimeout(timeout);
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              }
            );
          });
          arquivoUrl = uploadedUrl;
        } catch (uploadErr) {
           console.warn("Upload falhou, tentando salvar sem arquivo pois o Storage está desativado:", uploadErr);
           if (tipo === 'Prancha (Resumo/Estudo)' && !pranchaLink.trim()) {
             throw new Error("Falha no envio do arquivo e nenhum link foi fornecido. Ative o Storage no console do Firebase para enviar arquivos.");
           }
        }
      }

      if (editingId) {
        const reqRef = doc(db, 'requests', editingId);
        
        const updatePayload: any = {
          tipo: tipo === 'Prancha (Resumo/Estudo)' ? 'Envio de Prancha' : tipo,
          descricao,
          updatedAt: serverTimestamp()
        };
        
        if (arquivoUrl) {
          updatePayload.arquivoUrl = arquivoUrl;
        }

        if (tipo === 'Prancha (Resumo/Estudo)') {
          updatePayload.numero = pranchaNumero;
          updatePayload.temaCentral = pranchaTema;
          updatePayload.simbolosPrincipais = pranchaSimbolos;
          updatePayload.titulo = 'Envio de Prancha';
        }
        
        await updateDoc(reqRef, updatePayload);
        
        await addDoc(collection(db, 'history'), {
           userId: user.uid,
           tipo: 'atividade',
           titulo: `Solicitação Editada: ${tipo}`,
           descricao: `Uma solicitação pendente foi editada pelo membro.`,
           data: new Date().toLocaleDateString('pt-br'),
           hora: new Date().toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' }),
           autor: 'Sistema',
           criadoEm: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'requests'), {
          userId: user.uid,
          userName: user.nome,
          tipo: tipo === 'Prancha (Resumo/Estudo)' ? 'Envio de Prancha' : tipo,
          descricao,
          numero: tipo === 'Prancha (Resumo/Estudo)' ? pranchaNumero : null,
          temaCentral: tipo === 'Prancha (Resumo/Estudo)' ? pranchaTema : null,
          simbolosPrincipais: tipo === 'Prancha (Resumo/Estudo)' ? pranchaSimbolos : null,
          titulo: tipo === 'Prancha (Resumo/Estudo)' ? 'Envio de Prancha' : null,
          arquivoUrl: arquivoUrl || null,
          status: 'pendente',
          criadoEm: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        await addDoc(collection(db, 'history'), {
           userId: user.uid,
           tipo: 'atividade',
           titulo: `Nova Solicitação: ${tipo}`,
           descricao: `Enviada uma solicitação do tipo: ${tipo}.`,
           data: new Date().toLocaleDateString('pt-br'),
           hora: new Date().toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' }),
           autor: 'Sistema',
           criadoEm: serverTimestamp()
        });
      }

      if (tipo === 'Prancha (Resumo/Estudo)' && !editingId) {
         const qReadings = query(collection(db, 'reading_progress'), where('userId', '==', user.uid), where('status', '==', 'pendente'));
         const readingsSnap = await getDocs(qReadings);
         for (const readingDoc of readingsSnap.docs) {
             await updateDoc(doc(db, 'reading_progress', readingDoc.id), { status: 'resumo_enviado' });
         }
      }

      setTipo('');
      setDescricao('');
      setPranchaNumero('Pr∴ 01');
      setPranchaTema('');
      setPranchaSimbolos('');
      setPranchaLink('');
      setPranchaFile(null);
      setEditingId(null);
      await loadRequests();
    } catch (err: any) {
      alert("Erro: " + (err.message || "Erro desconhecido."));
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-900/50 text-green-400 border border-green-500/50';
      case 'rejeitado': return 'bg-red-900/50 text-red-400 border border-red-500/50';
      case 'pendente': return 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/50';
      case 'em_analise': return 'bg-blue-900/50 text-blue-400 border border-blue-500/50';
      default: return 'bg-gray-800 text-gray-400';
    }
  };

  const getIcon = (tipo: string) => {
    if (tipo.includes('Falta') || tipo.includes('Evento')) return <Calendar size={16} />;
    if (tipo.includes('Hospitalaria')) return <HeartHandshake size={16} />;
    if (tipo.includes('Quitte') || tipo.includes('Transferência')) return <LogOut size={16} />;
    return <FileText size={16} />;
  };

  const handleEdit = (req: RequestItem) => {
    setTipo(req.tipo === 'Envio de Prancha' ? 'Prancha (Resumo/Estudo)' : req.tipo);
    setDescricao(req.descricao);
    setPranchaLink(req.arquivoUrl || '');
    if (req.tipo === 'Envio de Prancha') {
      setPranchaNumero(req.numero || 'Pr∴ 01');
      setPranchaTema(req.temaCentral || '');
      setPranchaSimbolos(req.simbolosPrincipais || '');
    } else {
      setPranchaNumero('Pr∴ 01');
      setPranchaTema('');
      setPranchaSimbolos('');
    }
    setEditingId(req.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'requests', id));
      await loadRequests();
      alert("Solicitação excluída com sucesso.");
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <h1 className="text-3xl font-semibold text-[#D4AF37] mb-2">{editingId ? 'Editando Solicitação' : 'Solicitações'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {editingId && (
            <button 
              onClick={() => {
                setEditingId(null);
                setTipo('');
                setDescricao('');
                setPranchaLink('');
                setPranchaFile(null);
              }}
              className="text-gray-400 hover:text-white px-4 py-2 bg-[#1e293b] rounded-lg text-sm font-medium transition-colors"
            >
              Cancelar Edição
            </button>
          )}
        </div>
      </header>

      {/* New Request Form */}
      <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1e293b] flex items-center gap-2 text-[#D4AF37]">
          {editingId ? <Edit3 size={20} /> : <FileText size={20} />}
          <h2 className="text-lg font-medium">{editingId ? 'Alterar Dados' : 'Nova Solicitação'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de Solicitação</label>
              <select 
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors appearance-none"
                required
              >
                <option value="" disabled>Selecione o tipo de solicitação</option>
                <option value="Prancha (Resumo/Estudo)">Prancha (Resumo/Estudo)</option>
                <option value="Justificativa de Falta">Justificativa de Falta</option>
                <option value="Pedido de Certidão/Docs">Pedido de Certidão/Docs</option>
                <option value="Apoio de Hospitalaria">Apoio de Hospitalaria</option>
                <option value="Quitte Placet (Transferência)">Quitte Placet (Transferência)</option>
                <option value="Outros">Outros...</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">Escolha o assunto principal da sua solicitação. Pranchas aprovadas contarão para sua evolução de grau.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Descrição {tipo === 'Prancha (Resumo/Estudo)' ? '(Opcional)' : ''}</label>
              <textarea 
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva sua solicitação com detalhes ou cole o texto da prancha..."
                className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors resize-none h-24"
              ></textarea>
              <p className="text-xs text-gray-500 mt-2">No caso de faltas, detalhe o motivo.</p>
            </div>
            
            {tipo === 'Prancha (Resumo/Estudo)' && (
               <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Número</label>
                      <input 
                         type="text" 
                         value={pranchaNumero} 
                         onChange={(e) => setPranchaNumero(e.target.value)} 
                         className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                         placeholder="Pr∴ 01"
                      />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-gray-400 mb-2">Tema Central</label>
                       <input 
                          type="text" 
                          value={pranchaTema} 
                          onChange={(e) => setPranchaTema(e.target.value)} 
                          className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                          placeholder="Ex: O Ego do Aprendiz"
                       />
                    </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-400 mb-2">Símbolos Principais</label>
                     <input 
                        type="text" 
                        value={pranchaSimbolos} 
                        onChange={(e) => setPranchaSimbolos(e.target.value)} 
                        className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                        placeholder="Pedra Bruta, silêncio, humildade"
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo da Prancha (Opcional se usar Link)</label>
                       <label className="flex items-center gap-2 px-4 py-2 bg-[#1e293b]/50 border border-[#1e293b] rounded-lg cursor-pointer hover:bg-[#1e293b] transition-colors text-gray-300 w-full">
                           <Upload size={18} className="text-[#D4AF37]" />
                           <span className="text-sm truncate">{pranchaFile ? pranchaFile.name : 'Selecionar Arquivo'}</span>
                           <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => setPranchaFile(e.target.files ? e.target.files[0] : null)} />
                       </label>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-400 mb-2">OU Link Externo</label>
                       <div className="relative">
                         <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
                         <input 
                           type="url" 
                           value={pranchaLink} 
                           onChange={(e) => setPranchaLink(e.target.value)} 
                           className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 pl-10 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                           placeholder="https://docs.google.com/..."
                         />
                       </div>
                     </div>
                  </div>
               </div>
            )}
            
          </div>
          <div className="flex justify-end mt-4">
            <button 
              type="submit"
              disabled={submitting || !tipo || (tipo !== 'Prancha (Resumo/Estudo)' && !descricao) || (tipo === 'Prancha (Resumo/Estudo)' && !pranchaFile && !pranchaLink.trim())}
              className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#c2a033] hover:to-[#b59223] text-black font-semibold py-2 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              {submitting ? (uploadProgress ? `Enviando (${uploadProgress}%)...` : 'Enviando...') : (editingId ? 'Salvar Alterações' : 'Enviar Solicitação')}
            </button>
          </div>
        </form>
      </div>

      {/* Requests List */}
      <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1e293b]">
          <h2 className="text-lg font-medium text-[#D4AF37]">Minhas Solicitações</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e293b]">
                <th className="py-4 px-6 text-sm font-medium text-gray-400">Tipo</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-400">Descrição</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-400">Data</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-400">Status</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-400 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#D4AF37]">Carregando...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">Nenhuma solicitação encontrada.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="border-b border-[#1e293b] hover:bg-[#1E293B]/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-[#D4AF37]">
                            {getIcon(req.tipo)}
                         </div>
                         <span className="font-medium text-gray-200">{req.tipo}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm truncate max-w-xs">{req.descricao}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-gray-300 text-sm font-medium">
                          {req.criadoEm ? new Date(req.criadoEm.toMillis()).toLocaleDateString('pt-BR') : '-'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {req.criadoEm ? new Date(req.criadoEm.toMillis()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 w-max border", getStatusColor(req.status))}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", req.status === 'pendente' ? 'bg-yellow-400' : req.status === 'aprovado' ? 'bg-green-400' : 'bg-red-400')}></div>
                          {req.status === 'em_analise' ? 'Em Análise' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                        {req.analisadoEm && (
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter ml-1">
                            Resp: {new Date(req.analisadoEm.toMillis()).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={() => setSelectedRequest(req)}
                          className="text-[#D4AF37] hover:text-[#c2a033] flex items-center gap-1"
                          title="Ver Comentário"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {['pendente', 'rejeitado'].includes(req.status) && (
                          <>
                            {req.status === 'pendente' && (
                              <button 
                                onClick={() => handleEdit(req)}
                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                title="Editar"
                              >
                                <Edit3 size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(req.id)}
                              className="text-red-400 hover:text-red-300 flex items-center gap-1"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comentário Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
             <div className="p-6 border-b border-[#1e293b]">
                <h2 className="text-xl font-medium text-gray-200">
                  Comentário do Gestor
                </h2>
             </div>
             <div className="p-6 text-gray-300">
               {selectedRequest.comentarioGestor ? (
                 <p className="whitespace-pre-wrap">{selectedRequest.comentarioGestor}</p>
               ) : (
                 <p className="text-gray-500 italic">Nenhum comentário adicionado ainda.</p>
               )}
             </div>
             <div className="p-6 border-t border-[#1e293b] flex justify-end bg-[#0B0F19]">
                <button 
                   onClick={() => setSelectedRequest(null)}
                   className="px-6 py-2 bg-[#1e293b] text-gray-200 hover:bg-[#2e3e5c] rounded-lg transition-colors font-medium"
                >
                   Fechar
                </button>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}

```

---

## Arquivo: `src/pages/ContentPage.tsx` (Extensão: `.tsx`)

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, where, addDoc, serverTimestamp, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { BookOpen, FileText, PlayCircle, Grid, Play, Lock, Compass, Landmark, Upload, Link, X, Download, ShieldAlert, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { SessionTimer } from '../components/Layout';

interface ContentItem {
  id: string;
  titulo: string;
  tipo: 'video' | 'pdf' | 'texto' | 'instrucao' | 'reflexao';
  grauMinimo: string;
  obrigatorio: boolean;
  descricao: string;
  fileUrl: string;
}

// Componente Visualizador de PDF Protegido
function SafePdfViewer({ 
  url, 
  title, 
  onClose,
  itemId,
  initialNoteText,
  onSaveNote,
  savingNoteId
}: { 
  url: string; 
  title: string; 
  onClose: () => void;
  itemId?: string;
  initialNoteText?: string;
  onSaveNote?: (itemId: string, noteText: string, silent?: boolean) => Promise<void>;
  savingNoteId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showNoteSidebar, setShowNoteSidebar] = useState(true);
  const [localNoteText, setLocalNoteText] = useState(initialNoteText || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setLocalNoteText(initialNoteText || '');
    setSaveStatus('idle');
  }, [initialNoteText]);

  useEffect(() => {
    let alertTimeout: NodeJS.Timeout;

    const triggerAlert = () => {
      setShowAlert(true);
      clearTimeout(alertTimeout);
      alertTimeout = setTimeout(() => setShowAlert(false), 3000);
    };

    // Bloquear clique direito no documento inteiro
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerAlert();
    };
    
    // Bloquear atalhos de teclado (S, P, U, C, F12)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey; // cmd para Mac, ctrl para Windows/Linux
      
      if (
        (isCmdOrCtrl && (e.key === 's' || e.key === 'p' || e.key === 'u' || e.key === 'c' || e.key === 'j' || e.key === 'i')) ||
        e.key === 'F12' ||
        (isCmdOrCtrl && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'S'))
      ) {
        e.preventDefault();
        triggerAlert();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(alertTimeout);
    };
  }, []);

  // Função para tratar links do Google Drive para modo Preview Seguro
  const getSafeUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    let processed = rawUrl;
    
    if (processed.includes('drive.google.com')) {
      // Se for link de "view", converte para "preview" que é mais limpo e seguro
      processed = processed.replace(/\/view(\?.*)?$/, '/preview');
      // Garante que termina com /preview caso não tenha parâmetros
      if (processed.includes('/file/d/') && !processed.endsWith('/preview')) {
        const parts = processed.split('?');
        if (!parts[0].endsWith('/preview')) {
          processed = parts[0].replace(/\/$/, '') + '/preview';
        }
      }
    }
    
    // Parâmetros de ocultação de toolbar padrão (funciona em PDFs diretos)
    return `${processed}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
  };

  const handleSave = async () => {
    if (!itemId || !onSaveNote) return;
    setSaveStatus('saving');
    try {
      await onSaveNote(itemId, localNoteText, true);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      setSaveStatus('error');
    }
  };

  const safeUrl = getSafeUrl(url);

  return (
    <div className="fixed inset-0 bg-black/98 z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-300">
      {/* Header do Visualizador */}
      <div className="bg-[#0A0E1A] border-b border-[#D4AF37]/30 p-4 flex items-center justify-between shadow-2xl relative z-50 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex-shrink-0 flex items-center justify-center border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <ShieldAlert size={20} className="text-[#D4AF37]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-gray-100 font-semibold text-base sm:text-lg leading-tight truncate">{title}</h3>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold">Conexão Criptografada & Protegida</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <SessionTimer />
          {itemId && onSaveNote && (
            <button
              onClick={() => setShowNoteSidebar(!showNoteSidebar)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer",
                showNoteSidebar 
                  ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]" 
                  : "bg-[#1e293b]/50 border-[#1e293b] text-gray-400 hover:text-white"
              )}
              title="Alternar Bloco de Notas"
            >
              <BookOpen size={14} />
              <span className="hidden md:inline">{showNoteSidebar ? "Fechar Notas" : "Abrir Notas"}</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-red-950/30 border border-red-500/30 rounded text-red-500 text-[10px] font-bold uppercase tracking-tighter shadow-inner">
            <Lock size={12} /> Proteção Ativa: Download e Impressão Bloqueados
          </div>
          <button 
            onClick={onClose}
            title="Fechar Visualizador"
            className="w-10 h-10 rounded-lg bg-[#1e293b] hover:bg-red-600 transition-all flex items-center justify-center text-white border border-[#1e293b] hover:border-red-500 group shadow-lg"
          >
            <X size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Conteúdo do Visualizador com Escudo de Proteção */}
      <div className="flex-1 flex flex-col md:flex-row relative bg-[#0A0E1A] overflow-hidden">
        
        {/* Iframe do PDF */}
        <div className="flex-1 h-full min-h-0 relative bg-[#0A0E1A] flex items-center justify-center overflow-hidden">
          {/* ESCUDO DE PROTEÇÃO (OVERLAY) 
            Este div invisível fica sobre os botões do Google Drive para impedir que o usuário clique no "Pop-out" ou "Download"
          */}
          <div className="absolute top-0 right-0 w-24 h-24 z-40 bg-transparent cursor-default" title="Área Protegida"></div>
          <div className="absolute top-0 left-0 right-0 h-12 z-30 bg-transparent cursor-default"></div>

          {/* Marca d'água de proteção visual lateral */}
          <div className="absolute inset-y-0 left-0 w-4 md:w-16 bg-gradient-to-r from-[#0A0E1A] to-transparent pointer-events-none z-20"></div>
          <div className="absolute inset-y-0 right-0 w-4 md:w-16 bg-gradient-to-l from-[#0A0E1A] to-transparent pointer-events-none z-20"></div>
          
          {/* Overlay de Proteção Geral (Impede seleção de texto se necessário) */}
          <div className="absolute inset-0 z-10 pointer-events-none border-[12px] md:border-[30px] border-[#0A0E1A]"></div>

          <iframe 
            src={safeUrl}
            className="w-full h-full border-none z-0 scale-[1.02] origin-center"
            title={title}
            allow="autoplay"
            onContextMenu={(e) => e.preventDefault()}
          />
          
          {/* Banner de Aviso na base para reforçar a segurança */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-black/80 backdrop-blur-md border border-[#D4AF37]/20 rounded-full flex items-center gap-2 pointer-events-none opacity-50">
             <Lock size={12} className="text-[#D4AF37]" />
             <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Documento Restrito à Visualização Local</span>
          </div>

          {/* Alerta de Ação Bloqueada */}
          {showAlert && (
            <div className="absolute inset-0 z-[110] flex items-center justify-center pointer-events-none px-6">
              <div className="bg-[#0A0E1A]/95 border-2 border-red-500/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.3)] flex flex-col items-center gap-4 animate-in zoom-in-90 duration-200">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30">
                  <ShieldAlert size={40} className="text-red-500 animate-pulse" />
                </div>
                <div className="text-center">
                  <h4 className="text-red-500 font-bold text-xl uppercase tracking-tighter">Documento Protegido</h4>
                  <p className="text-gray-300 text-sm max-w-[250px] mt-1">Ações de download, impressão e cópia são proibidas para este conteúdo restrito.</p>
                </div>
                <div className="px-3 py-1 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">
                  Protocolo G∴O∴M∴A∴U∴
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bloco de Notas Integrado / Caderno de Estudos Lateral */}
        {showNoteSidebar && itemId && onSaveNote && (
          <div className="w-full md:w-[380px] lg:w-[440px] border-t md:border-t-0 md:border-l border-[#D4AF37]/20 bg-[#070911]/95 flex flex-col shrink-0 z-40 animate-in slide-in-from-right-4 duration-350 shadow-2xl">
            <div className="p-4 border-b border-[#D4AF37]/15 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                </span>
                <span className="text-[11px] uppercase tracking-widest font-black text-[#D4AF37] font-cinzel">Caderno de Estudos Privado</span>
              </div>
              <button 
                onClick={() => setShowNoteSidebar(false)} 
                className="text-gray-500 hover:text-white p-1 rounded transition-colors"
                title="Minimizar Notas"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between gap-5 h-full overflow-y-auto">
              <div className="flex-1 flex flex-col">
                <p className="text-[12px] leading-relaxed text-gray-400 italic font-serif mb-3">
                  "Guarde reflexões, passagens marcantes ou conclusões ritualísticas para estudos posteriores. Suas notas são privadas."
                </p>
                <textarea
                  value={localNoteText}
                  onChange={(e) => {
                    setLocalNoteText(e.target.value);
                    if (saveStatus === 'saved') setSaveStatus('idle');
                  }}
                  placeholder="Inicie aqui seus apontamentos enquanto faz a leitura guiada do tomo..."
                  className="w-full bg-[#05070D] border border-[#1e293b] rounded-xl p-4 text-sm sm:text-[15px] text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] leading-relaxed resize-none flex-1 font-serif focus:ring-1 focus:ring-[#D4AF37]/30 min-h-[160px]"
                />
              </div>

              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex justify-between items-center text-[10px] text-gray-500">
                  <span className="font-mono">💾 Salvo sob sigilo absoluto</span>
                  {saveStatus === 'saved' && (
                    <span className="text-emerald-500 font-bold font-mono">✓ Notas Gravadas!</span>
                  )}
                  {saveStatus === 'saving' && (
                    <span className="text-[#D4AF37] font-bold font-mono animate-pulse">Gravando...</span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-red-500 font-bold font-mono">Erro ao gravar</span>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving' || savingNoteId === itemId}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-[#c2a033] hover:scale-[1.01] active:scale-[0.99] text-black font-black uppercase tracking-widest text-[10 px] sm:text-[11px] transition-all duration-200 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.15)] disabled:opacity-50"
                >
                  {saveStatus === 'saving' || savingNoteId === itemId ? 'Sincronizando...' : 'Gravar no Caderno'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CourseItem {
  id: string;
  titulo: string;
  descricao: string;
  cargaHoraria: string;
  grade: string;
  elegibilidade: string;
  registrationUrl: string;
  status: 'aberto' | 'fechado';
}

const GRAUS = ['Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'];

export function ContentPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'arquivos' | 'cursos' | 'minhas_pranchas'>('arquivos');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [pranchas, setPranchas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileFilter, setFileFilter] = useState<string>('todos');
  const [showPranchaModal, setShowPranchaModal] = useState(false);
  const [pranchaTitle, setPranchaTitle] = useState('');
  const [pranchaNumero, setPranchaNumero] = useState('Pr∴ 01');
  const [pranchaTema, setPranchaTema] = useState('');
  const [pranchaSimbolos, setPranchaSimbolos] = useState('');
  const [pranchaText, setPranchaText] = useState('');
  const [pranchaLink, setPranchaLink] = useState('');
  const [pranchaFile, setPranchaFile] = useState<File | null>(null);
  const [submittingPrancha, setSubmittingPrancha] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [editingPranchaId, setEditingPranchaId] = useState<string | null>(null);
  const [deletingPranchaId, setDeletingPranchaId] = useState<string | null>(null);
  const [viewingPdf, setViewingPdf] = useState<ContentItem | null>(null);

  const [userNotes, setUserNotes] = useState<{ [itemId: string]: string }>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  const fetchUserNotes = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'library_notes'),
        where('uid', '==', user.uid)
      );
      const snaps = await getDocs(q);
      const notesObj: { [itemId: string]: string } = {};
      snaps.docs.forEach(d => {
        const data = d.data();
        if (data.itemId && data.noteText) {
          notesObj[data.itemId] = data.noteText;
        }
      });
      setUserNotes(notesObj);
    } catch (err) {
      console.error('Erro ao buscar anotações dos conteúdos:', err);
    }
  };

  const handleSaveNote = async (itemId: string, noteText: string, silent = false) => {
    if (!user) return;
    setSavingNoteId(itemId);
    try {
      const noteDocId = `${user.uid}_${itemId}`;
      await setDoc(doc(db, 'library_notes', noteDocId), {
        uid: user.uid,
        itemId,
        noteText: noteText.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      setUserNotes(prev => ({ ...prev, [itemId]: noteText.trim() }));
      if (!silent) {
        alert('Sua reflexão de estudo privada foi gravada com sucesso!');
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        alert('Erro ao salvar anotação. Tente novamente.');
      }
    } finally {
      setSavingNoteId(null);
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        // Load Contents (Files)
        const qContents = query(collection(db, 'contents'));
        const contentsSnapshot = await getDocs(qContents);
        setContents(contentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentItem)));

        // Load Courses (Links)
        const qCourses = query(collection(db, 'courses'));
        const coursesSnapshot = await getDocs(qCourses);
        setCourses(coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseItem)));

        // Load user's own pranchas
        const qPranchas = query(collection(db, 'requests'), where('userId', '==', user.uid), where('tipo', '==', 'Envio de Prancha'));
        const pranchasSnapshot = await getDocs(qPranchas);
        setPranchas(pranchasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Load notes of studies
        await fetchUserNotes();
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'contents/courses/requests');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleSendPrancha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pranchaTitle) return;
    
    if (!pranchaFile && !pranchaLink.trim()) {
      alert("É necessário enviar um arquivo ou fornecer um Link Externo da prancha.");
      return;
    }

    setSubmittingPrancha(true);
    if (pranchaFile) setUploadProgress(1);
    
    try {
      let arquivoUrl = pranchaLink;
      if (pranchaFile) {
        console.log("Tentando upload do arquivo...");
        try {
          const extension = pranchaFile.name.split('.').pop() || 'pdf';
          const safeName = `file_${Date.now()}.${extension}`;
          const fileRef = ref(storage, `pranchas/${user.uid}/${safeName}`);
          
          const uploadTask = uploadBytesResumable(fileRef, pranchaFile);

          const uploadedUrl = await new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => {
              uploadTask.cancel();
              reject(new Error("Timeout de rede"));
            }, 15000);

            uploadTask.on('state_changed', 
              (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setUploadProgress(progress);
              }, 
              (error) => { clearTimeout(timeout); reject(error); }, 
              async () => {
                clearTimeout(timeout);
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              }
            );
          });
          arquivoUrl = uploadedUrl;
        } catch (uploadErr) {
          console.warn("Upload falhou, usando link se disponível:", uploadErr);
          if (!pranchaLink.trim()) {
            throw new Error("Falha no upload do arquivo e nenhum link alternativo foi fornecido. Verifique se o Storage está ativado no seu Firebase.");
          }
        }
      }

      if (editingPranchaId) {
        const pranchaRef = doc(db, 'requests', editingPranchaId);
        const updateData: any = {
          titulo: pranchaTitle,
          numero: pranchaNumero,
          temaCentral: pranchaTema,
          simbolosPrincipais: pranchaSimbolos,
          descricao: pranchaText,
        };
        if (arquivoUrl) {
          updateData.arquivoUrl = arquivoUrl;
        }
        await updateDoc(pranchaRef, updateData);
        setPranchas(pranchas.map(p => p.id === editingPranchaId ? { ...p, ...updateData } : p));
      } else {
        const newDoc = await addDoc(collection(db, 'requests'), {
          userId: user.uid,
          userName: user.nome,
          tipo: 'Envio de Prancha',
          titulo: pranchaTitle,
          numero: pranchaNumero,
          temaCentral: pranchaTema,
          simbolosPrincipais: pranchaSimbolos,
          descricao: pranchaText,
          arquivoUrl: arquivoUrl || null,
          status: 'pendente',
          criadoEm: serverTimestamp()
        });
        setPranchas([...pranchas, { 
          id: newDoc.id, 
          titulo: pranchaTitle, 
          numero: pranchaNumero,
          temaCentral: pranchaTema,
          simbolosPrincipais: pranchaSimbolos,
          descricao: pranchaText, 
          arquivoUrl: arquivoUrl || null, 
          status: 'pendente', 
          criadoEm: new Date() 
        }]);
      }
      
      setShowPranchaModal(false);
      setEditingPranchaId(null);
      setPranchaTitle('');
      setPranchaNumero('Pr∴ 01');
      setPranchaTema('');
      setPranchaSimbolos('');
      setPranchaText('');
      setPranchaLink('');
      setPranchaFile(null);
    } catch (err: any) {
      alert("Erro: " + (err.message || "Erro desconhecido."));
    } finally {
      setSubmittingPrancha(false);
      setUploadProgress(null);
    }
  };

  const handleEditPrancha = (prancha: any) => {
    setEditingPranchaId(prancha.id);
    setPranchaTitle(prancha.titulo || '');
    setPranchaNumero(prancha.numero || 'Pr∴ 01');
    setPranchaTema(prancha.temaCentral || '');
    setPranchaSimbolos(prancha.simbolosPrincipais || '');
    setPranchaText(prancha.descricao || '');
    setPranchaLink(prancha.arquivoUrl || '');
    setPranchaFile(null);
    setShowPranchaModal(true);
  };

  const handleDeletePrancha = async (pranchaId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta prancha? Esta ação não pode ser desfeita.")) return;
    
    setDeletingPranchaId(pranchaId);
    try {
      await deleteDoc(doc(db, 'requests', pranchaId));
      setPranchas(pranchas.filter(p => p.id !== pranchaId));
    } catch (err: any) {
      alert("Erro ao excluir prancha: " + err.message);
    } finally {
      setDeletingPranchaId(null);
    }
  };

  const handleContentClick = (file: ContentItem) => {
    if (!user) return;

    // Abrir o conteúdo imediatamente antes de operações async para evitar bloqueio de popup pelo navegador
    if (file.tipo === 'pdf') {
      setViewingPdf(file);
    } else {
      if (file.fileUrl) {
        window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
      }
    }

    try {
       // Log no histórico do membro (Fire and forget, sem await)
       addDoc(collection(db, 'history'), {
          userId: user.uid,
          tipo: 'atividade',
          titulo: 'Visualizou Conteúdo',
          descricao: `O membro acessou o material: ${file.titulo}.`,
          data: new Date().toLocaleDateString('pt-br'),
          hora: new Date().toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' }),
          autor: 'Sistema',
          criadoEm: serverTimestamp()
       }).catch(err => console.warn("Aviso de histórico (pode ignorar se for quota):", err));

       // Registrar pendência de leitura se quiser pedir resumo futuramente
       addDoc(collection(db, 'reading_progress'), {
          userId: user.uid,
          contentId: file.id,
          contentTitle: file.titulo,
          viewedAt: serverTimestamp(),
          status: 'pendente' // Pode mudar para 'resumo_enviado' ou 'concluido' depois
       }).catch(err => console.warn("Aviso de progresso (pode ignorar se for quota):", err));
    } catch (err) {
       console.error("Erro ao iniciar registro de leitura:", err);
    }
  };

  const getUserGradeIndex = () => GRAUS.indexOf(user?.grau || 'Aprendiz');
  const getContentGradeIndex = (grau: string) => Math.max(0, GRAUS.indexOf(grau));

  const filteredFiles = (fileFilter === 'todos' ? contents : contents.filter(c => c.tipo === fileFilter))
    .filter(file => getContentGradeIndex(file.grauMinimo) <= getUserGradeIndex());

  const filteredCourses = courses.filter(course => {
    if (course.elegibilidade === 'Todos') return true;
    return getContentGradeIndex(course.elegibilidade) <= getUserGradeIndex();
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#1e293b] gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold text-gray-100 mb-2 truncate">Conteúdos & Cursos</h1>
          <p className="text-gray-400">Acesse materiais de estudo e inscreva-se em cursos de especialização.</p>
        </div>
      </header>

      {/* Main Tabs */}
      <div className="flex border-b border-[#1e293b] gap-8">
        <button 
           onClick={() => setActiveTab('arquivos')}
           className={cn("py-4 text-sm font-semibold tracking-wide transition-all relative flex items-center gap-2", activeTab === 'arquivos' ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-gray-300')}
        >
           <BookOpen size={18} />
           Biblioteca
           {activeTab === 'arquivos' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#D4AF37] shadow-[0_0_12px_#D4AF37]"></div>}
        </button>
        <button 
           onClick={() => setActiveTab('minhas_pranchas')}
           className={cn("py-4 text-sm font-semibold tracking-wide transition-all relative flex items-center gap-2", activeTab === 'minhas_pranchas' ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-gray-300')}
        >
           <FileText size={18} />
           Minhas Pranchas
           {activeTab === 'minhas_pranchas' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#D4AF37] shadow-[0_0_12px_#D4AF37]"></div>}
        </button>
      </div>

      {activeTab === 'arquivos' && (
        <div className="bg-[#0A0E1A] border border-[#D4AF37]/30 p-4 rounded-xl flex items-start gap-3.5 shadow-md">
          <div className="p-2.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] shrink-0">
            <BookOpen size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase text-[#D4AF37] tracking-widest">📖 Instruções e Caderno Virtual de Estudos</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Meu Ir∴, para cada arquivo, PDF de instrução ou vídeo-aula listado abaixo, providenciamos um <strong>Bloco de Notas Ritualístico particular</strong>. Ele fica acoplado diretamente sob o card de cada material. Ao abri-lo, você pode registrar livremente suas impressões e resumos para gravação síncrona sob total sigilo ritualístico.
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-[10px] text-[#D4AF37]/80 font-bold">
              <span>⚡ Como acessar:</span>
              <span className="text-gray-400 font-normal">Nesta lista abaixo, localize qualquer arquivo ou tomo e clique na aba inferior dourada <strong>"✍️ Bloco de Notas Ritualístico..."</strong> para expandir e começar a escrever.</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mb-4"></div>
          <div className="text-[#D4AF37] font-medium tracking-widest text-sm uppercase">Carregando Acervo...</div>
        </div>
      ) : (
        <div className="py-6">
          {/* TAB: ARQUIVOS */}
          {activeTab === 'arquivos' && (
            <div className="flex flex-col gap-8">
               {/* Sub-filters for files */}
               <div className="flex gap-3 flex-wrap">
                  {['todos', 'video', 'pdf', 'instrucao', 'reflexao'].map((t) => (
                    <button 
                       key={t}
                       onClick={() => setFileFilter(t)}
                       className={cn("px-5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-300", 
                       fileFilter === t ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-[#0F172A] border border-[#1e293b] text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50')}
                    >
                       {t}
                    </button>
                  ))}
               </div>

               {filteredFiles.length === 0 ? (
                  <div className="text-gray-500 py-32 text-center border border-dashed border-[#1e293b] bg-[#0A0E1A]/50 rounded-2xl flex flex-col items-center">
                    <BookOpen size={64} className="mb-6 text-[#1e293b]" strokeWidth={1} />
                    <p className="text-lg">Nenhum material encontrado no acervo.</p>
                  </div>
               ) : (
                  <div className="flex flex-col gap-4">
                    {filteredFiles.map(file => {
                      return (
                        <div key={file.id} className="group flex flex-col bg-[#0B0F19] border border-[#1e293b] rounded-xl p-5 hover:bg-[#0F172A] hover:border-[#D4AF37]/40 transition-all duration-300 shadow-lg cursor-pointer">
                             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full" onClick={() => handleContentClick(file)}>
                                <div className="flex items-center gap-5 w-full sm:w-auto">
                                   <div className="w-14 h-14 rounded-full bg-black border border-[#1e293b] flex items-center justify-center flex-shrink-0 group-hover:border-[#D4AF37]/50 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all animate-none">
                                      {file.tipo === 'video' ? <PlayCircle size={24} className="text-[#D4AF37]" /> : <FileText size={24} className="text-[#D4AF37]" />}
                                   </div>
                                   <div className="flex flex-col min-w-0 flex-1">
                                       <div className="flex items-center gap-3 mb-1">
                                         <h3 className="text-gray-100 font-semibold text-lg truncate group-hover:text-[#D4AF37] transition-colors">{file.titulo}</h3>
                                         <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded uppercase font-bold tracking-wider hidden sm:block border border-[#D4AF37]/20">{file.tipo}</span>
                                       </div>
                                       <p className="text-sm text-gray-500 line-clamp-1 group-hover:text-gray-400 transition-colors">{file.descricao || 'Sem descrição detalhada'}</p>
                                   </div>
                                </div>
                                
                                <div className="mt-4 sm:mt-0 w-full sm:w-auto flex justify-end">
                                  <button 
                                     className="flex items-center gap-2 text-sm font-bold text-black bg-[#D4AF37] px-6 py-2.5 rounded-lg hover:scale-105 transition-transform"
                                  >
                                     {file.tipo === 'video' ? 'Assistir' : 'Acessar'} <Play size={14} className="ml-1" />
                                  </button>
                                </div>
                             </div>

                             {/* CADERNO REVELADO COM EXCELENTE ACABAMENTO */}
                             <div onClick={e => e.stopPropagation()} className="mt-4 pt-4 border-t border-dashed border-[#D4AF37]/20 w-full text-left">
                               <details className="group border border-[#D4AF37]/20 rounded-xl bg-[#0F172A]/50 overflow-hidden transition-all duration-300">
                                 <summary className="flex items-center justify-between p-4 text-xs font-semibold tracking-wide text-gray-300 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 cursor-pointer select-none transition-colors">
                                   <span className="flex items-center gap-2.5 font-bold uppercase text-[10px] tracking-widest text-[#D4AF37]">
                                     <span className="flex h-2 w-2 relative">
                                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                                       <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                                     </span>
                                     ✍️ Bloco de Notas Ritualístico / Caderno de Estudos {userNotes[file.id] ? '(Preenchido)' : '(Vazio)'}
                                   </span>
                                   <div className="flex items-center gap-2">
                                     <span className="text-[9px] text-gray-400 font-normal italic hidden sm:inline">Clique para abrir seu caderno privado</span>
                                     <ChevronDown size={14} className="transition-transform group-open:rotate-180 text-gray-400 group-hover:text-[#D4AF37]" />
                                   </div>
                                 </summary>
                                 
                                 <div className="p-4 bg-black/40 border-t border-[#D4AF37]/10 space-y-3">
                                   <p className="text-[11px] text-gray-400 leading-relaxed font-serif italic mb-1">
                                     "As meditações e reflexões anotadas sob este tomo pertencem unicamente ao seu templo interior e são salvas sob absoluto sigilo ritualístico."
                                   </p>
                                   <textarea
                                     defaultValue={userNotes[file.id] || ''}
                                     id={`note_${file.id}`}
                                     placeholder="Registre suas impressões, conclusões e anotações individuais sobre esta instrução..."
                                     className="w-full bg-[#05070D] border border-[#1e293b]/70 rounded-xl p-4 text-sm sm:text-base text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] leading-relaxed resize-none h-32 font-serif focus:ring-1 focus:ring-[#D4AF37]/30"
                                   />
                                   <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
                                     <span className="text-[9px] text-[#D4AF37]/60 font-mono tracking-wider">💾 Salvo automaticamente de forma criptografada</span>
                                     <button
                                       onClick={() => {
                                         const ta = document.getElementById(`note_${file.id}`) as HTMLTextAreaElement;
                                         if (ta) {
                                           handleSaveNote(file.id, ta.value);
                                         }
                                       }}
                                       disabled={savingNoteId === file.id}
                                       className="py-2 px-5 bg-[#D4AF37] text-black font-black uppercase tracking-widest text-[9px] transition-all duration-300 hover:scale-105 rounded-lg flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                                     >
                                       {savingNoteId === file.id ? 'Gravando...' : 'Gravar no Caderno'}
                                     </button>
                                   </div>
                                 </div>
                               </details>
                             </div>
                        </div>
                      );
                    })}
                  </div>
               )}
            </div>
          )}

          {/* TAB: MINHAS PRANCHAS */}
          {activeTab === 'minhas_pranchas' && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <p className="text-gray-400 text-sm">Aqui estão as pranchas que você enviou para o gestor da sua loja.</p>
                <button onClick={() => {
                   setEditingPranchaId(null);
                   setPranchaTitle('');
                   setPranchaNumero('Pr∴ 01');
                   setPranchaTema('');
                   setPranchaSimbolos('');
                   setPranchaText('');
                   setPranchaLink('');
                   setPranchaFile(null);
                   setShowPranchaModal(true);
                }} className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                  <FileText size={18} /> Enviar Prancha
                </button>
              </div>
              
              {pranchas.length === 0 ? (
                <div className="text-gray-500 py-32 text-center border border-dashed border-[#1e293b] bg-[#0A0E1A]/50 rounded-2xl flex flex-col items-center">
                  <FileText size={64} className="mb-6 text-[#1e293b]" strokeWidth={1} />
                  <p className="text-lg">Você ainda não enviou nenhuma prancha.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {pranchas.map(prancha => (
                     <div key={prancha.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0B0F19] border border-[#1e293b] rounded-xl p-5 hover:bg-[#0F172A] hover:border-[#D4AF37]/40 transition-all duration-300 shadow-lg relative overflow-hidden">
                          <div className="flex items-center gap-5 w-full sm:w-auto">
                             <div className="w-14 h-14 rounded-full bg-black border border-[#1e293b] flex items-center justify-center flex-shrink-0 group-hover:border-[#D4AF37]/50 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all">
                                <FileText size={24} className="text-[#D4AF37]" />
                             </div>
                             <div className="flex flex-col min-w-0 flex-1">
                                 <div className="flex items-center gap-3 mb-1">
                                   <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                      {prancha.numero && (
                                         <span className="text-[10px] font-mono bg-[#D4AF37]/10 text-[#D4AF37] px-1.5 py-0.5 rounded border border-[#D4AF37]/20 uppercase shrink-0">
                                            {prancha.numero}
                                         </span>
                                      )}
                                      <h3 className="text-gray-100 font-semibold text-lg truncate group-hover:text-[#D4AF37] transition-colors">{prancha.titulo || prancha.temaCentral || 'Prancha sem título'}</h3>
                                   </div>
                                   <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded border tracking-wider", 
                                     prancha.status === 'aprovado' ? 'bg-green-900/10 text-green-400 border-green-500/20' : 
                                     prancha.status === 'rejeitado' ? 'bg-red-900/10 text-red-400 border-red-500/20' : 
                                     'bg-yellow-900/10 text-yellow-400 border-yellow-500/20')}>
                                     {prancha.status}
                                   </span>
                                 </div>
                                 <div className="flex flex-col gap-0.5">
                                    {prancha.temaCentral && (
                                       <p className="text-xs text-[#D4AF37]/80 italic line-clamp-1">"{prancha.temaCentral}"</p>
                                    )}
                                    <p className="text-sm text-gray-500 line-clamp-1 group-hover:text-gray-400 transition-colors">{prancha.descricao || 'Sem descrição detalhada'}</p>
                                 </div>
                             </div>
                          </div>
                        
                        <div className="mt-4 sm:mt-0 w-full sm:w-auto flex justify-end gap-2 flex-wrap sm:flex-nowrap">
                           {prancha.arquivoUrl && (
                                <a href={prancha.arquivoUrl} target="_blank" rel="noopener noreferrer" title="Link Anexado" className="flex items-center justify-center text-sm font-bold text-gray-300 bg-[#1e293b]/50 border border-[#1e293b] p-2 sm:px-5 sm:py-2 rounded-lg hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-colors">
                                   <Link size={14} className="sm:mr-2" /> <span className="hidden sm:inline">Link Anexado</span>
                                </a>
                           )}
                           {(prancha.status === 'pendente' || prancha.status === 'em_analise') && (
                             <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditPrancha(prancha)}
                                  className="p-2 sm:px-4 sm:py-2 flex items-center justify-center gap-2 rounded-lg border border-[#1e293b] text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all bg-[#1e293b]/50"
                                  title="Editar"
                                >
                                   <Edit2 size={14} /> <span className="hidden sm:inline text-sm">Editar</span>
                                </button>
                                <button
                                  onClick={() => handleDeletePrancha(prancha.id)}
                                  disabled={deletingPranchaId === prancha.id}
                                  className="p-2 sm:px-4 sm:py-2 flex items-center justify-center gap-2 rounded-lg border border-[#1e293b] text-red-400 hover:text-red-300 hover:border-red-500/50 transition-all bg-[#1e293b]/50 disabled:opacity-50"
                                  title="Excluir"
                                >
                                   <Trash2 size={14} /> <span className="hidden sm:inline text-sm">{deletingPranchaId === prancha.id ? 'Excluindo...' : 'Excluir'}</span>
                                </button>
                             </div>
                           )}
                        </div>
                     </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <SafePdfViewer 
          url={viewingPdf.fileUrl} 
          title={viewingPdf.titulo} 
          onClose={() => setViewingPdf(null)} 
          itemId={viewingPdf.id}
          initialNoteText={userNotes[viewingPdf.id] || ''}
          onSaveNote={handleSaveNote}
          savingNoteId={savingNoteId}
        />
      )}

      {/* Prancha Modal */}
      {showPranchaModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0F172A] border border-[#1e293b] rounded-2xl p-8 max-w-xl w-full">
            <h2 className="text-2xl font-semibold text-[#D4AF37] mb-2 font-sans">{editingPranchaId ? 'Editar Prancha' : 'Enviar Nova Prancha'}</h2>
            <p className="text-gray-400 mb-6 text-sm">{editingPranchaId ? 'Altere os dados da sua prancha para análise.' : 'Preencha os dados da sua prancha para análise do Gestor.'}</p>
            
            <form onSubmit={handleSendPrancha} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Número</label>
                    <input 
                       type="text" 
                       value={pranchaNumero} 
                       onChange={(e) => setPranchaNumero(e.target.value)} 
                       className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                       placeholder="Pr∴ 01"
                       required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Título da Prancha</label>
                    <input 
                       type="text" 
                       value={pranchaTitle} 
                       onChange={(e) => setPranchaTitle(e.target.value)} 
                       className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                       placeholder="Ex: O Ego do Aprendiz"
                       required
                    />
                  </div>
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tema Central</label>
                  <input 
                     type="text" 
                     value={pranchaTema} 
                     onChange={(e) => setPranchaTema(e.target.value)} 
                     className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                     placeholder="Ex: O impacto do orgulho e da vaidade..."
                     required
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Símbolos Principais</label>
                  <input 
                     type="text" 
                     value={pranchaSimbolos} 
                     onChange={(e) => setPranchaSimbolos(e.target.value)} 
                     className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                     placeholder="Ex: Pedra Bruta, silêncio, humildade"
                     required
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Resumo / Texto Livre (Opcional)</label>
                  <textarea 
                     value={pranchaText} 
                     onChange={(e) => setPranchaText(e.target.value)} 
                     className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors resize-y h-24"
                     placeholder="Uma breve descrição ou o texto da prancha..."
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo da Prancha (Opcional se usar Link abaixo)</label>
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#1e293b]/50 border border-[#1e293b] rounded-lg cursor-pointer hover:bg-[#1e293b] transition-colors text-gray-300">
                    <Upload size={18} className="text-[#D4AF37]" />
                    <span className="text-sm">{pranchaFile ? pranchaFile.name : 'Anexar Arquivo'}</span>
                    <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => setPranchaFile(e.target.files ? e.target.files[0] : null)} />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Formatos: PDF, DOC, DOCX. Max: 10MB. {editingPranchaId ? 'Se selecionado, este arquivo substituirá o anterior.' : ''}</p>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">OU Link Externo (Google Drive, Dropbox, etc)</label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
                    <input 
                      type="url" 
                      value={pranchaLink} 
                      onChange={(e) => setPranchaLink(e.target.value)} 
                      className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 pl-10 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
               </div>
               
               <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => { setShowPranchaModal(false); setEditingPranchaId(null); }} className="px-5 py-2.5 rounded-lg text-gray-400 hover:bg-[#1e293b] transition-colors font-medium">Cancelar</button>
                  <button type="submit" disabled={submittingPrancha || !pranchaTitle} className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                     {submittingPrancha ? (uploadProgress ? `Enviando (${uploadProgress}%)...` : 'Enviando...') : (editingPranchaId ? 'Salvar Alterações' : 'Enviar Prancha')}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

```

---

## Arquivo: `src/pages/CursosExternos.tsx` (Extensão: `.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, BookOpen, Clock, ChevronRight, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function CursosExternos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'courses'),
        where('status', '==', 'aberto'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const allCourses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filtro de Grau (Hierarquia)
      const grauOrder = { 'Aprendiz': 1, 'Companheiro': 2, 'Mestre': 3 };
      const userGrauVal = (grauOrder as any)[user?.grau || 'Aprendiz'] || 1;
      
      const filtered = allCourses.filter((c: any) => {
        const courseGrauVal = (grauOrder as any)[c.grauMinimo || 'Aprendiz'] || 1;
        return userGrauVal >= courseGrauVal;
      });

      setCourses(filtered);
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <GraduationCap size={48} className="text-[#D4AF37] animate-pulse mb-4" />
        <p className="text-gray-400">Consultando Pergaminhos de Instrução...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37] flex items-center gap-3 mb-2" style={{fontFamily: 'Cinzel'}}>
            <GraduationCap size={32} />
            Escola de Sabedoria EAD
          </h1>
          <p className="text-gray-400">Ambiente de instrução contínua e aprimoramento filosófico-ritualístico.</p>
        </div>
        
        <div className="bg-[#1e293b]/30 p-4 rounded-xl border border-[#D4AF37]/20 flex items-center gap-3">
          <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
             <Sparkles size={20} className="text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Seu Grau Atual</p>
            <p className="text-sm font-bold text-white">{user?.grau}</p>
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="bg-[#1e293b]/20 border border-dashed border-gray-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-[#1e293b] rounded-full flex items-center justify-center mx-auto mb-4">
             <BookOpen size={32} className="text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-300">Nenhuma instrução disponível</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-2">No momento não há cursos ativos compatíveis com seu grau atual.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div 
              key={course.id}
              onClick={() => navigate(`/cursos/${course.id}`)}
              className="bg-[#1e293b]/30 border border-[#1e293b] rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 transition-all cursor-pointer group flex flex-col h-full active:scale-[0.98]"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]">
                    <GraduationCap size={24} />
                  </div>
                  <span className="bg-[#0A0E1A] text-[#D4AF37] text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-[#D4AF37]/20">
                    {course.grauMinimo}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-100 mb-2 group-hover:text-[#D4AF37] transition-colors line-clamp-2" style={{fontFamily: 'Cinzel'}}>
                  {course.titulo}
                </h3>
                
                <p className="text-sm text-gray-400 line-clamp-3 mb-6">
                  {course.descricao}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {course.cargaHoraria || '10h'}
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen size={14} />
                    {course.modulos?.length} Módulos
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-[#1e293b]/50 border-t border-[#1e293b] flex items-center justify-between group-hover:bg-[#D4AF37]/10 transition-all">
                <span className="text-sm font-bold text-[#D4AF37]">Iniciar Jornada</span>
                <ChevronRight size={18} className="text-[#D4AF37]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

```

---

## Arquivo: `src/pages/CursoDetail.tsx` (Extensão: `.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  ChevronLeft, GraduationCap, ChevronRight, PlayCircle, Lock, 
  CheckCircle2, FileText, ListChecks, HelpCircle, AlertCircle, 
  ArrowRight, Award, Loader2, Menu, X 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function CursoDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Quiz State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number, passed: boolean } | null>(null);

  useEffect(() => {
    if (!courseId) return;
    
    // Fetch Course
    const fetchCourse = async () => {
      const snap = await getDoc(doc(db, 'courses', courseId));
      if (snap.exists()) {
        const data = snap.data();
        
        // Verificação de Grau (Hierarquia)
        const grauOrder = { 'Aprendiz': 1, 'Companheiro': 2, 'Mestre': 3 };
        const userGrauVal = (grauOrder as any)[user?.grau || 'Aprendiz'] || 1;
        const courseGrauVal = (grauOrder as any)[data.grauMinimo || 'Aprendiz'] || 1;

        if (userGrauVal < courseGrauVal) {
          alert('Seu grau atual não permite o acesso a esta instrução.');
          navigate('/cursos');
          return;
        }

        setCourse(data);
        // Default to first lesson if none selected
        if (data.modulos?.[0]?.unidades?.[0]?.aulas?.[0]) {
          setActiveLesson({
            ...data.modulos[0].unidades[0].aulas[0],
            moduloId: data.modulos[0].id,
            unidadeId: data.modulos[0].unidades[0].id
          });
        }
      }
      setLoading(false);
    };

    // Listen to Progress
    const progressId = `${user?.uid}_${courseId}`;
    const unsub = onSnapshot(doc(db, 'courseProgress', progressId), (snap) => {
      if (snap.exists()) {
        setProgress(snap.data());
      } else {
        setProgress({ completedLessons: [], scores: {} });
      }
    }, (err: any) => {
      console.error("Error loading progress:", err);
      if (err?.code === 'resource-exhausted') {
         console.warn("Cota excedida no progresso do curso.");
      }
    });

    fetchCourse();
    return () => unsub();
  }, [courseId, user]);

  const isLessonLocked = (lessonId: string, moduloIdx: number, unidadeIdx: number, aulaIdx: number) => {
    // Primeira aula do primeiro módulo sempre aberta
    if (moduloIdx === 0 && unidadeIdx === 0 && aulaIdx === 0) return false;
    
    // Pegar a aula anterior
    let prevAulaId = '';
    if (aulaIdx > 0) {
      prevAulaId = course.modulos[moduloIdx].unidades[unidadeIdx].aulas[aulaIdx - 1].id;
    } else if (unidadeIdx > 0) {
      const prevUnidade = course.modulos[moduloIdx].unidades[unidadeIdx - 1];
      prevAulaId = prevUnidade.aulas[prevUnidade.aulas.length - 1].id;
    } else if (moduloIdx > 0) {
      const prevModulo = course.modulos[moduloIdx - 1];
      const lastUnidade = prevModulo.unidades[prevModulo.unidades.length - 1];
      prevAulaId = lastUnidade.aulas[lastUnidade.aulas.length - 1].id;
    }

    return !progress?.completedLessons?.includes(prevAulaId);
  };

  const handleCompleteLesson = async () => {
    if (!activeLesson || !courseId) return;
    
    const progressId = `${user?.uid}_${courseId}`;
    const newCompleted = [...(progress?.completedLessons || [])];
    if (!newCompleted.includes(activeLesson.id)) {
      newCompleted.push(activeLesson.id);
    }

    try {
      await setDoc(doc(db, 'courseProgress', progressId), {
        userId: user?.uid,
        courseId,
        completedLessons: newCompleted,
        lastAccessed: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  };

  const submitQuiz = async () => {
    if (!activeLesson.exercicios) return;
    
    let correct = 0;
    activeLesson.exercicios.forEach((ex: any) => {
      if (answers[ex.id] === ex.respostaCorreta) correct++;
    });

    const score = (correct / activeLesson.exercicios.length) * 100;
    const passed = score >= 75;

    setQuizResult({ score, passed });
    setQuizSubmitted(true);

    if (passed) {
      await handleCompleteLesson();
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#D4AF37]" size={48} /></div>;
  if (!course) return <div className="p-8 text-center text-gray-400">Curso não encontrado.</div>;

  return (
    <div className="flex h-[calc(100vh-120px)] bg-[#0A0E1A] rounded-2xl overflow-hidden border border-[#1e293b]">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-80 bg-[#0F172A] border-r border-[#1e293b] flex flex-col h-full z-20 absolute lg:relative shadow-2xl lg:shadow-none"
          >
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
              <h2 className="font-bold text-[#D4AF37] flex items-center gap-2">
                <GraduationCap size={18} /> Currículo
              </h2>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
              {course.modulos?.map((modulo: any, mIdx: number) => (
                <div key={modulo.id} className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                    Módulo {mIdx + 1}: {modulo.titulo}
                  </div>
                  
                  <div className="space-y-2">
                    {modulo.unidades?.map((unidade: any, uIdx: number) => (
                      <div key={unidade.id} className="space-y-1">
                        <div className="text-[11px] font-bold text-gray-400 px-2 mb-1 flex items-center gap-2">
                          <ChevronRight size={10} /> {unidade.titulo}
                        </div>
                        
                        <div className="space-y-0.5">
                          {unidade.aulas?.map((aula: any, aIdx: number) => {
                            const locked = isLessonLocked(aula.id, mIdx, uIdx, aIdx);
                            const completed = progress?.completedLessons?.includes(aula.id);
                            const active = activeLesson?.id === aula.id;
                            
                            return (
                              <button
                                key={aula.id}
                                disabled={locked}
                                onClick={() => {
                                  setActiveLesson({...aula, moduloId: modulo.id, unidadeId: unidade.id});
                                  setQuizSubmitted(false);
                                  setQuizResult(null);
                                  setAnswers({});
                                  if (window.innerWidth < 1024) setSidebarOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-all",
                                  active ? "bg-[#D4AF37] text-black font-bold" : "text-gray-400 hover:bg-[#1e293b]",
                                  locked && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                {completed ? <CheckCircle2 size={14} className={active ? "text-black" : "text-[#D4AF37]"} /> : 
                                 locked ? <Lock size={14} /> : <PlayCircle size={14} />}
                                <span className="truncate">{aula.titulo}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-black/40 border-t border-[#1e293b]">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] text-gray-500 uppercase font-bold">Progresso do Curso</span>
                 <span className="text-xs font-bold text-[#D4AF37]">
                   {Math.round(((progress?.completedLessons?.length || 0) / (course.modulos?.reduce((acc: number, m: any) => acc + m.unidades?.reduce((acc2: number, u: any) => acc2 + u.aulas?.length, 0), 0) || 1)) * 100)}%
                 </span>
               </div>
               <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-[#D4AF37] transition-all duration-1000"
                   style={{ width: `${((progress?.completedLessons?.length || 0) / (course.modulos?.reduce((acc: number, m: any) => acc + m.unidades?.reduce((acc2: number, u: any) => acc2 + u.aulas?.length, 0), 0) || 1)) * 100}%` }}
                 />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0F1C]">
        <div className="bg-[#1e293b]/50 p-4 border-b border-[#1e293b] flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-[#1e293b] rounded-lg text-gray-400">
               <Menu size={20} />
            </button>
            <div>
              <h1 className="text-sm font-bold text-gray-200 line-clamp-1">{course.titulo}</h1>
              <p className="text-[10px] text-[#D4AF37] uppercase tracking-widest">{activeLesson?.titulo}</p>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/cursos')}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} /> Sair
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20 flex flex-col items-center">
          <div className="w-full max-w-4xl space-y-12">
            
            {/* Lesson Content */}
            <div className="prose prose-invert prose-[#D4AF37] max-w-none">
              <ReactMarkdown 
                components={{
                  h1: ({node, ...props}) => <h1 className="text-3xl md:text-4xl text-[#D4AF37] mb-8 font-bold border-b border-[#D4AF37]/20 pb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl text-[#D4AF37] mt-12 mb-4 font-bold flex items-center gap-2" {...props} />,
                  p: ({node, ...props}) => <p className="text-gray-300 leading-relaxed text-lg mb-6 text-justify" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 text-gray-300 mb-8" {...props} />,
                  li: ({node, ...props}) => <li className="marker:text-[#D4AF37]" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-[#D4AF37] bg-[#D4AF37]/5 p-6 my-8 rounded-r-xl italic text-gray-400" {...props} />
                  )
                }}
              >
                {activeLesson?.conteudo}
              </ReactMarkdown>
            </div>

            {/* Exercises Section */}
            {activeLesson?.exercicios && activeLesson.exercicios.length > 0 && (
              <div className="mt-20 pt-20 border-t border-[#1e293b]">
                <div className="bg-[#1e293b]/20 rounded-3xl p-8 md:p-12 border border-[#D4AF37]/10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-[#D4AF37]/10 rounded-2xl text-[#D4AF37]">
                      <ListChecks size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Desafios de Compreensão</h3>
                      <p className="text-gray-500 text-sm">Responda para validar sua passagem para a próxima instrução.</p>
                    </div>
                  </div>

                  <div className="space-y-10">
                    {activeLesson.exercicios.map((ex: any, idx: number) => (
                      <div key={ex.id} className="space-y-4">
                        <div className="flex items-start gap-4">
                          <span className="text-[#D4AF37] font-bold text-lg">{idx + 1}.</span>
                          <p className="text-lg text-gray-200">{ex.pergunta}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 ml-8">
                          {ex.opcoes?.map((opt: string) => (
                            <button
                              key={opt}
                              disabled={quizSubmitted}
                              onClick={() => setAnswers({...answers, [ex.id]: opt})}
                              className={cn(
                                "flex items-center p-4 rounded-xl border text-left transition-all",
                                answers[ex.id] === opt 
                                  ? "bg-[#D4AF37]/20 border-[#D4AF37] text-white" 
                                  : "bg-black/20 border-gray-800 text-gray-400 hover:border-gray-600",
                                quizSubmitted && opt === ex.respostaCorreta && "bg-green-500/20 border-green-500 text-green-200",
                                quizSubmitted && answers[ex.id] === opt && opt !== ex.respostaCorreta && "bg-red-500/20 border-red-500 text-red-200"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-all",
                                answers[ex.id] === opt ? "border-[#D4AF37]" : "border-gray-700"
                              )}>
                                {answers[ex.id] === opt && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                              </div>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {quizResult && (
                    <div className={cn(
                      "mt-12 p-8 rounded-2xl border flex flex-col md:flex-row items-center gap-6 justify-between",
                      quizResult.passed ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className={cn("p-4 rounded-full", quizResult.passed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                          {quizResult.passed ? <Award size={40} /> : <AlertCircle size={40} />}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white">
                            {quizResult.passed ? "Membro Aprovado!" : "Instrução Necessária"}
                          </h4>
                          <p className="text-sm text-gray-400">
                             Você atingiu uma média de **{Math.round(quizResult.score)}%**. 
                             {quizResult.passed ? "A próxima lição já está disponível." : "Revise o conteúdo e tente novamente."}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizResult(null);
                          setAnswers({});
                        }}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
                      >
                        Refazer Teste
                      </button>
                    </div>
                  )}

                  {!quizSubmitted && (
                    <button 
                      onClick={submitQuiz}
                      disabled={Object.keys(answers).length < activeLesson.exercicios.length}
                      className="mt-12 w-full py-4 bg-[#D4AF37] text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 size={20} /> Validar Respostas
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Simple Completion button if no exercises */}
            {(!activeLesson?.exercicios || activeLesson.exercicios.length === 0) && (
              <div className="mt-20 pt-10 border-t border-[#1e293b] flex justify-center">
                 {!progress?.completedLessons?.includes(activeLesson.id) ? (
                    <button 
                      onClick={handleCompleteLesson}
                      className="bg-[#D4AF37] text-black px-12 py-4 rounded-2xl font-bold flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-[#D4AF37]/10"
                    >
                      <CheckCircle2 size={24} /> Concluir Instrução e Avançar
                    </button>
                 ) : (
                    <div className="flex flex-col items-center gap-4 text-green-400">
                      <div className="p-4 bg-green-500/10 rounded-full border border-green-500/20">
                        <CheckCircle2 size={48} />
                      </div>
                      <p className="font-bold tracking-widest uppercase text-xs">Instrução Concluída</p>
                    </div>
                 )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

```

---

## Arquivo: `src/pages/CalendarPage.tsx` (Extensão: `.tsx`)

```tsx
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { Calendar as CalendarIcon, Clock, MapPin, Bell, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const GRAUS = ['Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'];

interface AppEvent {
  id: string;
  titulo: string;
  data: string;
  hora: string;
  local: string;
  descricao: string;
  grauMinimo: string;
  status?: string;
}

export function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'events'),
          orderBy('data', 'asc')
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEvent));
        
        // Filter by user grade
        const userGradeIdx = GRAUS.indexOf(user.grau || 'Aprendiz');
        const accessibleEvents = fetched.filter(evt => {
           const evtGradeIdx = GRAUS.indexOf(evt.grauMinimo || 'Aprendiz');
           return userGradeIdx >= evtGradeIdx;
        });

        setEvents(accessibleEvents);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'events');
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [user]);

  const upcomingEvents = events.filter(evt => new Date(`${evt.data}T${evt.hora || '00:00'}`) >= new Date());
  const pastEvents = events.filter(evt => new Date(`${evt.data}T${evt.hora || '00:00'}`) < new Date());

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
        <div>
           <h1 className="text-3xl font-semibold text-[#D4AF37] mb-2">Calendário de Eventos</h1>
           <p className="text-gray-400">Acompanhe as sessões e eventos programados para o seu grau.</p>
        </div>
        <button 
           onClick={() => setNotifications(!notifications)}
           className={`hidden md:flex items-center gap-2 border px-4 py-2 rounded-lg text-sm transition-colors ${
              notifications ? 'bg-[#0F172A] border-[#1e293b] text-gray-300 hover:border-[#D4AF37]/50' : 'bg-transparent border-[#1e293b] text-gray-500 hover:text-gray-300'
           }`}
        >
           <Bell size={16} className={notifications ? "text-[#D4AF37]" : "text-gray-600"} /> 
           {notifications ? 'Notificações Ativadas' : 'Notificações Desativadas'}
        </button>
      </header>

      {/* Events List */}
      {loading ? (
         <div className="text-[#D4AF37] py-8 text-center">Carregando eventos...</div>
      ) : events.length === 0 ? (
         <div className="text-gray-500 py-12 text-center border border-dashed border-[#1e293b] rounded-xl flex flex-col items-center">
            <CalendarIcon size={48} className="mb-4 text-[#1e293b]" />
            <p>Nenhum evento programado para o seu grau no momento.</p>
         </div>
       ) : (
         <div className="space-y-12">
            {/* Próximos */}
            {upcomingEvents.length > 0 && (
               <section>
                  <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                     Próximos Eventos
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {upcomingEvents.map((evt) => (
                        <div key={evt.id} className={cn(
                           "bg-[#0A0E1A] border rounded-xl overflow-hidden flex flex-col group relative transition-all",
                           evt.status === 'cancelado' ? "border-red-500/50 opacity-80 grayscale" : "border-[#1e293b] hover:border-[#D4AF37]/50"
                        )}>
                           {evt.status !== 'cancelado' && <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#D4AF37] to-[#C9A227]"></div>}
                           
                           <div className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-3">
                                    <div className={cn(
                                       "w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold font-sans shadow-inner",
                                       evt.status === 'cancelado' ? "bg-red-900/20 text-red-500" : "bg-[#1e293b] text-[#D4AF37]"
                                    )}>
                                       <span className="text-xl leading-none">{evt.data.split('-')[2]}</span>
                                       <span className="text-[10px] uppercase font-medium">{new Date(evt.data).toLocaleString('pt-br', { month: 'short' }).replace('.', '')}</span>
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-2">
                                          <h3 className={cn(
                                             "text-xl font-semibold font-sans transition-colors",
                                             evt.status === 'cancelado' ? "text-gray-500 line-through decoration-red-500/50" : "text-gray-200 group-hover:text-[#D4AF37]"
                                          )}>{evt.titulo}</h3>
                                          {evt.status === 'cancelado' && (
                                             <span className="bg-red-900/50 text-red-500 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border border-red-500/30 flex items-center gap-1">
                                                <XCircle size={8} /> Cancelado
                                             </span>
                                          )}
                                       </div>
                                       <span className="text-xs uppercase font-bold tracking-widest text-[#D4AF37]">Grau: {evt.grauMinimo}</span>
                                    </div>
                                 </div>
                              </div>
                              
                              <p className="text-sm text-gray-400 mb-6 line-clamp-2">{evt.descricao}</p>
                              
                              <div className="flex flex-col gap-2 mt-auto border-t border-[#1e293b]/50 pt-4">
                                 <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <Clock size={14} className="text-gray-500" /> {evt.hora}
                                 </div>
                                 <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <MapPin size={14} className="text-gray-500" /> {evt.local}
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
            )}

            {/* Passados */}
            {pastEvents.length > 0 && (
               <section>
                  <h2 className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6 border-b border-[#1e293b] pb-2">
                     Histórico (Realizados)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                     {pastEvents.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((evt) => (
                        <div key={evt.id} className="bg-[#0B0B0C] border border-[#1e293b] rounded-xl overflow-hidden flex flex-col relative group">
                           <div className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-3">
                                    <div className="bg-[#1e293b]/50 text-gray-500 w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold font-sans">
                                       <span className="text-xl leading-none">{evt.data.split('-')[2]}</span>
                                       <span className="text-[10px] uppercase font-medium">{new Date(evt.data).toLocaleString('pt-br', { month: 'short' }).replace('.', '')}</span>
                                    </div>
                                    <div>
                                       <h3 className="text-lg font-semibold text-gray-400 font-sans line-through decoration-[#D4AF37]/30">{evt.titulo}</h3>
                                       <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-green-700 flex items-center gap-1 bg-green-900/10 px-1.5 rounded uppercase">
                                             <CheckCircle size={10} /> Realizado
                                          </span>
                                          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-600">Grau: {evt.grauMinimo}</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              <p className="text-xs text-gray-500 mb-4 line-clamp-1 italic">"{evt.descricao}"</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
            )}
         </div>
       )}
    </div>
  );
}

```

---

## Arquivo: `src/pages/HistoryPage.tsx` (Extensão: `.tsx`)

```tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { Calendar, Clock, Star, Landmark, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface HistoryEvent {
  id: string;
  data: string;
  titulo: string;
  descricao: string;
  tipo: 'marco' | 'atividade' | 'reuniao';
  grau?: string;
  detalhes?: string;
}

export function HistoryPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'history'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoryEvent));
        
        // Fix sort
        fetched.sort((a, b) => {
           // Fallback to timestamp if available
           const timeA = (a as any).criadoEm?.toMillis ? (a as any).criadoEm.toMillis() : 0;
           const timeB = (b as any).criadoEm?.toMillis ? (b as any).criadoEm.toMillis() : 0;
           if (timeA && timeB) return timeB - timeA;
           
           // parse dd/mm/yyyy
           const partsA = a.data?.split('/') || ['01','01','2000'];
           const partsB = b.data?.split('/') || ['01','01','2000'];
           const dateA = new Date(`${partsA[2]}-${partsA[1]}-${partsA[0]}T${(a as any).hora || '00:00'}:00`).getTime();
           const dateB = new Date(`${partsB[2]}-${partsB[1]}-${partsB[0]}T${(b as any).hora || '00:00'}:00`).getTime();
           return dateB - dateA;
        });
        
        // If empty, let's create a few generic events for the user based on creation date or defaults so it's not totally empty if they just joined
        if (fetched.length === 0) {
           const initialDate = user.createdAt ? new Date(user.createdAt.toMillis()).toLocaleDateString('pt-br') : new Date().toLocaleDateString('pt-br');
           setEvents([
              { id: '1', data: initialDate, titulo: `Iniciado no grau de Aprendiz`, descricao: 'Início da jornada maçônica na Loja ' + user.loja, tipo: 'marco', detalhes: 'Você foi iniciado e agora inicia sua jornada na Ordem Maçônica.' }
           ]);
        } else {
           setEvents(fetched);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'history');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
       case 'marco': return <Star size={16} className="text-[#D4AF37]" />;
       case 'reuniao': return <Landmark size={16} className="text-[#D4AF37]" />;
       default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
        <div>
           <h1 className="text-3xl font-semibold text-[#D4AF37] mb-2">Sua Linha do Tempo</h1>
           <p className="text-gray-400">Acompanhe todos os marcos e progressos de sua jornada maçônica.</p>
        </div>
      </header>

      {/* Timeline */}
      {loading ? (
         <div className="text-[#D4AF37] py-8 text-center">Carregando histórico...</div>
      ) : (
         <div className="relative pl-4 md:pl-8">
            {/* Vertical Line */}
            <div className="absolute left-10 md:left-14 top-4 bottom-4 w-px bg-gradient-to-b from-[#D4AF37] via-[#1e293b] to-transparent"></div>

            <div className="flex flex-col gap-6">
               {events.map((event, index) => (
                  <div key={event.id} className="relative flex items-start group">
                     {/* Timeline Node */}
                     <div className="absolute -left-6 md:-left-4 z-10">
                        <div className={cn(
                           "w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#0B0B0C] shadow-lg",
                           event.tipo === 'marco' ? 'bg-[#1e293b] ring-1 ring-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-[#0F172A]'
                        )}>
                           {getIcon(event.tipo)}
                        </div>
                     </div>

                     {/* Event Content */}
                     <div className="ml-16 w-full cursor-pointer" onClick={() => toggleExpand(event.id)}>
                        <div className={cn(
                           "bg-[#0A0E1A] border rounded-xl transition-all duration-300",
                           expandedId === event.id ? 'border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'border-[#1e293b] hover:border-[#1e293b]/80'
                        )}>
                           <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                 <div className="flex items-center gap-3 mb-1">
                                    <span className="text-sm font-medium text-[#D4AF37]">{event.data}</span>
                                    {event.tipo === 'marco' && (
                                       <span className="text-[10px] uppercase font-bold tracking-widest text-black bg-[#D4AF37] px-2 py-0.5 rounded">Marco</span>
                                    )}
                                 </div>
                                 <h3 className="text-lg font-semibold text-gray-200 font-sans">{event.titulo}</h3>
                                 <p className="text-sm text-gray-400 mt-1">{event.descricao}</p>
                              </div>
                              <div className="text-gray-500 hidden md:block">
                                 {expandedId === event.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              </div>
                           </div>

                           {/* Expanded Details */}
                           {expandedId === event.id && event.detalhes && (
                              <div className="px-5 pb-5 pt-2 border-t border-[#1e293b]/50 mt-2 text-sm text-gray-300 leading-relaxed bg-[#0F172A]/30 rounded-b-xl animate-in slide-in-from-top-2">
                                 {event.detalhes}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
}

```

---

## Arquivo: `src/pages/CadeiaUniaoPage.tsx` (Extensão: `.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { Heart, Send, Sparkles, ChevronDown, Sparkle, AlertCircle, Info, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function CadeiaUniaoPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Força Espiritual');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vibratingId, setVibratingId] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('Força Espiritual');
  const [editAnonymous, setEditAnonymous] = useState(false);
  const [updating, setUpdating] = useState(false);

  const categories = [
    'Oração & Prece',
    'Recuperação de Saúde',
    'Vibrações de Harmonia',
    'Força Espiritual',
    'Apoio Fraterno'
  ];

  const fetchRequests = async () => {
    try {
      const q = query(collection(db, 'cadeia_uniao'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() as any }));
      setRequests(list);
    } catch (err) {
      console.error('Erro ao buscar pedidos da Cadeia de União:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newTitle.trim() || !newDesc.trim()) {
      alert('Por favor, preencha o título e a descrição do seu pedido.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'cadeia_uniao'), {
        userId: user.uid,
        uid: user.uid,
        userName: isAnonymous ? 'Irmão em Segredo' : (user.nome || 'Nobre Irmão'),
        isAnonymous,
        title: newTitle.trim(),
        description: newDesc.trim(),
        category: newCategory,
        vibrantesCount: 0,
        vibrators: [],
        createdAt: serverTimestamp()
      });

      setNewTitle('');
      setNewDesc('');
      setIsAnonymous(false);
      alert('Seu pedido de vibrações foi enviado à egrégora da Cadeia de União!');
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar o pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVibrate = async (reqId: string, hasVibrated: boolean) => {
    if (!user) return;
    setVibratingId(reqId);
    
    try {
      const reqRef = doc(db, 'cadeia_uniao', reqId);
      const targetReq = requests.find(r => r.id === reqId);
      if (!targetReq) return;

      const currentVibrators = targetReq.vibrators || [];
      const isAlreadyVibrating = currentVibrators.includes(user.uid);

      let newCount = targetReq.vibrantesCount || 0;
      if (isAlreadyVibrating) {
        newCount = Math.max(0, newCount - 1);
        await updateDoc(reqRef, {
          vibrators: arrayRemove(user.uid),
          vibrantesCount: newCount
        });
      } else {
        newCount += 1;
        await updateDoc(reqRef, {
          vibrators: arrayUnion(user.uid),
          vibrantesCount: newCount
        });
      }

      setRequests(prev => prev.map(r => r.id === reqId ? {
        ...r,
        vibrators: isAlreadyVibrating ? r.vibrators.filter((uid: string) => uid !== user.uid) : [...(r.vibrators || []), user.uid],
        vibrantesCount: newCount
      } : r));

    } catch (err) {
      console.error(err);
    } finally {
      setVibratingId(null);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'cadeia_uniao', id));
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Erro ao excluir pedido:', err);
    }
  };

  const startEdit = (r: any) => {
    setEditingId(r.id);
    setEditTitle(r.title);
    setEditDesc(r.description);
    setEditCategory(r.category || 'Força Espiritual');
    setEditAnonymous(r.isAnonymous ?? false);
  };

  const handleUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !user) return;
    if (!editTitle.trim() || !editDesc.trim()) {
      alert('Por favor, preencha o título e a descrição.');
      return;
    }

    setUpdating(true);
    try {
      const reqRef = doc(db, 'cadeia_uniao', editingId);
      const updatedPayload = {
        title: editTitle.trim(),
        description: editDesc.trim(),
        category: editCategory,
        isAnonymous: editAnonymous,
        userName: editAnonymous ? 'Irmão em Segredo' : (user.nome || 'Nobre Irmão'),
      };

      await updateDoc(reqRef, {
        ...updatedPayload,
        updatedAt: serverTimestamp()
      });

      setRequests(prev => prev.map(r => r.id === editingId ? {
        ...r,
        ...updatedPayload,
        updatedAt: { toDate: () => new Date() }
      } : r));

      setEditingId(null);
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      alert('Erro ao atualizar o pedido.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 w-full h-full overflow-y-auto no-scrollbar font-sans text-left">
      
      {/* Header explicativo - Excluído do gestor, focado 100% no membro */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#0A0E1A] border-y border-[#D4AF37]/30 lg:border lg:rounded-xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 blur-3xl rounded-full"></div>
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className="p-3 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/30 shrink-0">
            <Sparkle size={32} className="text-[#D4AF37] animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#D4AF37] tracking-wide uppercase font-sans">
              Cadeia de União
            </h1>
            <p className="text-gray-300 text-sm mt-2 leading-relaxed">
              Diferente da <strong>Hospitalaria</strong> (que cuida de auxílio material), a 
              <strong> Cadeia de União</strong> espiritual é o espaço sagrado onde nos unimos em egrégora mental, 
              orações e envio de vibrações benfazejas para amparar os Irmãos em momentos de provação, 
              convalescença ou necessidade espiritual.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-yellow-400">
              <Info size={14} />
              <span>Qualquer obreiro pode postar ou enviar vibrações para fortalecer a corrente.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulário - Enviar novo pedido */}
        <div className="lg:col-span-5">
          <div className="bg-[#0F172A] border border-[#D4AF37]/20 rounded-xl p-6 sticky top-4 shadow-xl">
            <h2 className="text-lg font-medium text-[#D4AF37] mb-4 flex items-center gap-2">
              <Send size={18} />
              Novas Vibrações
            </h2>
            
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-semibold">
                  Tópico / Quem necessita?
                </label>
                <input 
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ex: Saúde de familiar ou Força Espiritual para mim"
                  className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all"
                  maxLength={60}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-semibold">
                  Categoria da Vibração
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c} value={c} className="bg-[#0F172A]">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-semibold">
                  Seu Pedido / Súplica
                </label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Descreva de forma fraterna para receber as orações dos Irmãos da oficina..."
                  rows={4}
                  className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg p-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all resize-none leading-relaxed"
                  maxLength={500}
                />
              </div>

              <div className="flex items-center gap-3 bg-black/30 p-3 rounded-lg border border-[#1e293b]">
                <input
                  type="checkbox"
                  id="chkAnon"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded border-[#1e293b] text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                />
                <label htmlFor="chkAnon" className="text-xs text-gray-300 select-none cursor-pointer">
                  Fazer pedido de forma reservada / anônima
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] text-black font-semibold uppercase tracking-wider py-3 rounded-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-xs"
              >
                {submitting ? 'Elevando preces...' : 'Elevar Pedido à Egrégora'}
              </button>
            </form>
          </div>
        </div>

        {/* Quadro de Correntes em Andamento */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
            <h2 className="text-lg font-medium text-white tracking-wide flex items-center gap-2">
              <Sparkles size={20} className="text-[#D4AF37]" />
              Correntes de Oração Ativas
            </h2>
            <span className="text-xs text-gray-400 font-mono">
              {requests.length} total
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-[#0F172A]/50 border border-[#1e293b] rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 border border-[#1e293b] border-dashed rounded-lg bg-[#0F172A]/40">
              <AlertCircle className="mx-auto text-gray-650 mb-3" size={40} />
              <p className="text-gray-400 text-sm">Harmonia perfeita. Nenhum pedido ativo na egrégora.</p>
              <p className="text-xs text-gray-650 mt-1">Insira um pedido à esquerda se algum Irmão precisar de amparo.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((r, idx) => {
                const alreadyVibrated = user ? (r.vibrators || []).includes(user.uid) : false;
                const isMyRequest = user && (r.userId === user.uid || r.uid === user.uid);
                const isEditing = editingId === r.id;

                if (isEditing) {
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#0F172A] border border-[#D4AF37]/75 rounded-xl p-5 relative overflow-hidden transition-all shadow-xl"
                    >
                      <form onSubmit={handleUpdateRequest} className="space-y-4">
                        <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-2">
                          <span className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37] font-cinzel">Editar Pedido de Vibrações</span>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Tópico / Quem necessita?</label>
                          <input 
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all"
                            maxLength={60}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Categoria</label>
                            <select
                              value={editCategory}
                              onChange={e => setEditCategory(e.target.value)}
                              className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-all cursor-pointer"
                            >
                              {categories.map(c => (
                                <option key={c} value={c} className="bg-[#0F172A] text-xs">{c}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-2.5 bg-black/30 px-3 py-2 rounded-lg border border-[#1e293b] self-end cursor-pointer">
                            <input
                              type="checkbox"
                              id={`chkEditAnon_${r.id}`}
                              checked={editAnonymous}
                              onChange={e => setEditAnonymous(e.target.checked)}
                              className="w-4 h-4 rounded border-[#1e293b] text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                            />
                            <label htmlFor={`chkEditAnon_${r.id}`} className="text-xs text-gray-300 select-none cursor-pointer">
                              Pedido Anônimo
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">Seu Pedido / Súplica</label>
                          <textarea
                            value={editDesc}
                            onChange={e => setEditDesc(e.target.value)}
                            rows={3}
                            className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all resize-none leading-relaxed font-sans"
                            maxLength={500}
                          />
                        </div>

                        <div className="flex justify-end gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3.5 py-1.5 border border-[#1e293b] bg-[#0A0E1A] hover:bg-white/5 text-gray-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={updating}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] text-black hover:brightness-110 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {updating ? 'Gravando...' : 'Salvar Alterações'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-[#0F172A] border border-[#1e293b]/70 hover:border-[#D4AF37]/30 rounded-xl p-5 relative overflow-hidden transition-all shadow-md group"
                  >
                    {/* Glowing light indicator if highly vibrated */}
                    {r.vibrantesCount >= 5 && (
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-pulse"></div>
                    )}

                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        {/* Categoria tag & Owner Actions */}
                        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                          <span className="inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                            {r.category || 'Vibração'}
                          </span>
                          
                          {isMyRequest && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEdit(r)}
                                className="text-gray-400 hover:text-[#D4AF37] p-1 rounded hover:bg-white/5 transition-all cursor-pointer"
                                title="Editar pedido"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteRequest(r.id)}
                                className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-all cursor-pointer"
                                title="Excluir pedido imediatamente"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-base font-semibold text-white group-hover:text-[#D4AF37] transition-all">
                          {r.title}
                        </h3>
                      </div>
                      
                      {/* Vibration indicators count */}
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Heart className={`w-4 h-4 ${alreadyVibrated ? 'fill-red-500 text-red-500' : 'text-[#D4AF37]/65 animate-pulse'}`} />
                          <span className="font-mono text-sm text-gray-200">
                            {r.vibrantesCount || 0}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 block">em oração</span>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mt-3 leading-relaxed break-words whitespace-pre-line">
                      {r.description}
                    </p>

                    <div className="border-t border-[#1e293b]/60 mt-4 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="text-xs text-gray-500 flex flex-wrap gap-x-2 gap-y-1">
                        <span>Por: <strong className="text-gray-300 font-medium">{r.userName || 'Reservado'}</strong></span>
                        <span className="text-gray-650">•</span>
                        <span>Postado em: {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recente'}</span>
                      </div>

                      <button
                        onClick={() => handleVibrate(r.id, alreadyVibrated)}
                        disabled={vibratingId === r.id}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                          alreadyVibrated 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                          : 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black'
                        }`}
                      >
                        <Heart className="w-4 h-4 fill-current shrink-0" />
                        {alreadyVibrated ? 'Abraçado em Corrente' : 'Elevar minhas Preces'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

```

---

## Arquivo: `src/pages/TreasuryPage.tsx` (Extensão: `.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { DollarSign, Send, CheckCircle, Clock, AlertCircle, FileText, Download, Copy, Check } from 'lucide-react';

export function TreasuryPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [remetentePix, setRemetentePix] = useState('');
  const [info, setInfo] = useState({ 
    pixKey: 'calepe@gmail.com', 
    pixName: 'Grande Oriente Maçônico (GOMA)', 
    amount: '100.00', 
    lodgeName: '',
    instructions: 'Por favor, realize a transferência pix correspondente à mensalidade do mês de referência. Após pagar, clique em Confirmar Pagamento para notificar o Tesoureiro e atualizar seu status.' 
  });

  const isOwner = ['gomau.ead@gmail.com', 'calepi@gmail.com', 'calepe@gmail.com'].includes((user?.email || '').toLowerCase().trim());

  useEffect(() => {
    if (!user) return;

    const loadTreasury = async () => {
      try {
        // Load settings
        const confRef = doc(db, 'configs', 'treasury');
        const confSnap = await getDoc(confRef);
        let baseAmount = '100.00';
        let instructionsText = '';
        if (confSnap.exists()) {
          const data = confSnap.data() as any;
          baseAmount = data.amount || '100.00';
          instructionsText = data.instructions || '';
        }

        let finalAmount = baseAmount;
        let lodgeNameText = user.loja || '';

        // Query configs/security to fetch Lodges and match custom monthly fee values
        try {
          const securitySnap = await getDoc(doc(db, "configs", "security"));
          if (securitySnap.exists()) {
            const data = securitySnap.data();
            if (data.lojas && Array.isArray(data.lojas)) {
              const matchedLoja = data.lojas.find((l: any) => {
                if (user.loja && l.nome && l.nome.toLowerCase().trim() === user.loja.toLowerCase().trim()) {
                  return true;
                }
                if (user.cim && l.prefixo === String(user.cim).substring(0, 2)) {
                  return true;
                }
                return false;
              });

              if (matchedLoja) {
                lodgeNameText = matchedLoja.nome;
                if (matchedLoja.mensalidade !== undefined && matchedLoja.mensalidade !== null && matchedLoja.mensalidade !== "") {
                  finalAmount = String(matchedLoja.mensalidade);
                }
              }
            }
          }
        } catch (errSec) {
          console.error("Erro ao carregar valor da mensalidade customizada da loja:", errSec);
        }

        setInfo(prev => ({
          ...prev,
          pixKey: confSnap.exists() ? (confSnap.data() as any).pixKey || prev.pixKey : prev.pixKey,
          pixName: confSnap.exists() ? (confSnap.data() as any).pixName || prev.pixName : prev.pixName,
          instructions: instructionsText || prev.instructions,
          amount: finalAmount,
          lodgeName: lodgeNameText
        }));

        // Load user's payments sem orderBy composto para evitar erro de índice
        const q = query(
          collection(db, 'mensalidades'), 
          where('uid', '==', user.uid)
        );
        const snaps = await getDocs(q);
        const list = snaps.docs.map(d => ({ id: d.id, ...d.data() as any }));
        list.sort((a, b) => (b.mesRef || '').localeCompare(a.mesRef || ''));
        setPayments(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTreasury();
  }, [user]);

  const handleConfirmPayment = async () => {
    if (!user) return;
    if (!remetentePix.trim()) {
      alert('Por favor, informe a identificação do pagamento (Nome do titular ou chave Pix) para que o Financeiro possa conferir o recebimento.');
      return;
    }
    setConfirming(true);
    
    const targetValor = info.amount || '100.00';
    try {
      await addDoc(collection(db, 'mensalidades'), {
        uid: user.uid,
        userName: user.nome || '',
        userEmail: user.email || '',
        userCim: user.cim || '',
        loja: user.loja || info.lodgeName || '',
        mesRef: month,
        valor: targetValor,
        comprovanteUrl: '',
        remetentePix: remetentePix.trim(),
        tipo: 'mensalidade',
        status: 'em_analise',
        dataEnvio: serverTimestamp()
      });

      // WhatsApp redirection message
      const message = `Olá Tesoureiro, acabei de realizar o pagamento da minha contribuição mensal!\n\n` +
                      `• Nome: ${user.nome || 'Nobre Irmão'}\n` +
                      `• CIM: ${user.cim || 'N/A'}\n` +
                      `• Oficina: ${user.loja || info.lodgeName || 'N/A'}\n` +
                      `• Competência: ${month}\n` +
                      `• Pix em nome de: ${remetentePix.trim()}\n` +
                      `• Valor: R$ ${targetValor}\n\n` +
                      `Por favor, realize a validação na área do Gestor!`;
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=5531994375772&text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');

      alert('Confirmação enviada! Você será redirecionado ao WhatsApp para notificar a Tesouraria.');
      setRemetentePix('');
      
      // refresh payments
      const q = query(
        collection(db, 'mensalidades'), 
        where('uid', '==', user.uid)
      );
      const snaps = await getDocs(q);
      const list = snaps.docs.map(d => ({ id: d.id, ...d.data() as any }));
      list.sort((a, b) => (b.mesRef || '').localeCompare(a.mesRef || ''));
      setPayments(list);
      
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar confirmação ou carregar histórico.');
    } finally {
      setConfirming(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado': return <CheckCircle className="text-green-500" size={18} />;
      case 'rejeitado': return <AlertCircle className="text-red-500" size={18} />;
      default: return <Clock className="text-yellow-500" size={18} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovado': return 'Pago';
      case 'rejeitado': return 'Recusado';
      default: return 'Em Análise';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 w-full h-full overflow-y-auto">
      {/* Aviso de Fase de Testes */}
      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="text-[#D4AF37] shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Fase de Homologação e Testes</h3>
          <p className="text-xs text-gray-300 mt-1 leading-relaxed">
            O módulo da Tesouraria / Financeiro está ativo em ambiente de homologação. Todos os obreiros podem visualizar as informações de contribuição, copiar a chave Pix e confirmar o pagamento para enviar a notificação instantânea de baixa técnica ao Tesoureiro.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-[#D4AF37] mb-2 flex items-center gap-3">
             <DollarSign size={32} />
             Tesouraria
          </h1>
          <p className="text-gray-400 text-sm">Controle as suas contribuições de mensalidades e confirme os seus pagamentos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Form */}
         <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-[#0F172A] border border-[#D4AF37]/30 rounded-xl p-6 relative overflow-hidden shadow-lg shadow-[#D4AF37]/5">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-3xl rounded-full"></div>
               
               <h2 className="text-lg font-medium text-white mb-4">Dados para Pagamento</h2>
               <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Chave PIX (E-mail / Copia e Cola)</p>
                    <div className="flex items-center gap-2">
                       <p className="text-[#D4AF37] font-mono bg-black/40 p-2 rounded border border-[#1e293b] select-all break-all text-xs max-h-32 overflow-y-auto flex-1">{info.pixKey || 'Não configurada'}</p>
                       <button
                          type="button"
                          onClick={() => {
                             if (info.pixKey) {
                                navigator.clipboard.writeText(info.pixKey);
                                setCopiedPix(true);
                                alert("Chave Pix copiada!");
                                setTimeout(() => setCopiedPix(false), 2000);
                             }
                          }}
                          className="p-2 bg-[#D4AF37] text-black hover:bg-[#C5A028] rounded-lg transition-colors flex items-center justify-center shrink-0"
                       >
                          {copiedPix ? <Check size={16} /> : <Copy size={16} />}
                       </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Beneficiário</p>
                    <p className="text-white text-sm">{info.pixName || 'Não configurado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Valor Mensalidade</p>
                    <p className="text-[#D4AF37] text-lg font-bold flex items-center gap-2 flex-wrap">
                      R$ {info.amount || '100,00'}
                      {info.lodgeName && (
                        <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full font-semibold border border-[#D4AF37]/30">
                          {info.lodgeName}
                        </span>
                      )}
                    </p>
                  </div>
                  {info.instructions && (
                     <div>
                       <p className="text-xs text-yellow-500 uppercase tracking-widest mb-1">Avisos / Vencimento</p>
                       <p className="text-gray-300 text-xs bg-yellow-500/10 p-3 rounded border border-yellow-500/20">{info.instructions}</p>
                     </div>
                  )}
               </div>
            </div>

            <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl p-6">
               <h2 className="text-lg font-medium text-white mb-4">Confirmar Pagamento</h2>
               
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Mês Referência</label>
                     <input 
                        type="month" 
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                     />
                  </div>

                  <div>
                     <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Quem fez o Pix? (Titular da Conta)</label>
                     <input 
                        type="text" 
                        value={remetentePix}
                        onChange={e => setRemetentePix(e.target.value)}
                        placeholder="Ex: Diogo Moura ou Pix da conta de Maria"
                        className="w-full bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37] placeholder-gray-650 text-sm"
                     />
                     <p className="text-[10px] text-gray-500">Informe o nome do titular pagador para que a Tesouraria de baixa síncrona fora da plataforma.</p>
                  </div>
                  
                  <button 
                     onClick={handleConfirmPayment}
                     disabled={confirming}
                     className="w-full bg-[#D4AF37] text-black font-semibold py-3 rounded-lg hover:bg-[#C5A028] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                     {confirming ? (
                        'Processando...'
                     ) : (
                        <>
                           <Send size={16} />
                           Confirmar Pagamento
                        </>
                     )}
                  </button>

                  <p className="text-[11px] text-gray-500 leading-relaxed text-center">
                     Após confirmar, abriremos o WhatsApp do Tesoureiro com os dados preenchidos para avisá-lo do pagamento.
                  </p>
               </div>
            </div>
         </div>

         {/* History */}
         <div className="lg:col-span-2">
            <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl p-6 h-full">
               <h2 className="text-lg font-medium text-white mb-6">Meu Histórico</h2>
               
               {loading ? (
                  <div className="animate-pulse flex flex-col gap-4">
                     {[1,2,3].map(i => <div key={i} className="h-16 bg-[#1e293b] rounded-lg"></div>)}
                  </div>
               ) : payments.length === 0 ? (
                  <div className="text-center py-12 border border-[#1e293b] border-dashed rounded-lg bg-[#0A0E1A]">
                     <FileText className="mx-auto text-gray-600 mb-3" size={32} />
                     <p className="text-gray-400">Nenhuma mensalidade registrada</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {payments.map(p => (
                        <div key={p.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-[#0A0E1A] border border-[#1e293b] gap-4 animate-in fade-in-50">
                           <div>
                              <div className="flex items-center gap-3 flex-wrap">
                                 <span className="font-medium text-white text-lg">{p.mesRef}</span>
                                 <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${p.status === 'aprovado' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : p.status === 'rejeitado' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                                    {getStatusIcon(p.status)} {getStatusText(p.status)}
                                 </span>
                                 {p.tipo && (
                                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${p.tipo === 'livro' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : p.tipo === 'assinatura' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                       {p.tipo === 'livro' ? 'Livro Premium' : p.tipo === 'assinatura' ? 'Assinatura' : 'Mensalidade'}
                                    </span>
                                 )}
                              </div>
                              <div className="text-sm text-gray-400 mt-1 space-y-1">
                                 <div>Valor: R$ {p.valor}</div>
                                 {p.remetentePix && (
                                    <div className="text-xs text-[#D4AF37]/85 font-sans">
                                       Pix enviado por: <span className="text-white font-medium">{p.remetentePix}</span>
                                    </div>
                                 )}
                              </div>
                              {p.comentarioGestor && (
                                 <div className="text-xs text-red-400 mt-2 bg-red-500/10 p-2 rounded border border-red-500/20">
                                    Nota: {p.comentarioGestor}
                                 </div>
                              )}
                           </div>
                           
                           <div className="flex flex-col items-end gap-2 text-xs text-gray-500">
                              <span>Enviado em: {p.dataEnvio?.toDate ? p.dataEnvio.toDate().toLocaleDateString('pt-BR') : ''}</span>
                              {p.comprovanteUrl && (
                                 <a href={p.comprovanteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#D4AF37] hover:underline">
                                    <Download size={14} /> Ver Comprovante Histórico
                                 </a>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>

      </div>
    </div>
  );
}

```

---

## Arquivo: `src/pages/gestor/GestorDashboard.tsx` (Extensão: `.tsx`)

```tsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Users,
  FileText,
  CheckCircle,
  GraduationCap,
  Calendar,
  Plus,
  Trash2,
  Upload,
  Link as LinkIcon,
  Compass,
  PlayCircle,
  Settings,
  Save,
  BookOpen,
  IdCard,
  UploadCloud,
  Download,
  Key,
  FileSpreadsheet,
  Loader2,
  ArrowRight,
  AlertCircle,
  Edit2,
  XCircle,
  Eye,
  User,
  MapPin,
  Award,
  RefreshCw,
  MessageSquare,
  DollarSign,
  BarChart3,
  Library,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { db, storage, auth } from "../../lib/firebase";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { handleFirestoreError, OperationType } from "../../lib/errorHandler";
import { GoogleGenAI, Type } from "@google/genai";
import { CourseGenerator } from "./CourseGenerator";
import { ForumConfigTab } from "./ForumConfigTab";
import { GestorLibrary } from "../../components/gestor/GestorLibrary";
import { GestorTreasury } from "../../components/gestor/GestorTreasury";
import { GestorValuation } from "../../components/gestor/GestorValuation";
import { DataManagement } from "../../components/gestor/DataManagement";
import AdminPermissionsManager from "../../components/gestor/AdminPermissionsManager";
import SegundoVigilanteView from "../../components/gestor/SegundoVigilanteView";
import * as XLSX from "xlsx";

import { SessionTimer } from "../../components/Layout";

const CIMCard = (props: any) => null;

export function GestorDashboard() {
  const { user } = useAuth();
  const userEmail = (user?.email || auth.currentUser?.email || "")
    .toLowerCase()
    .trim();
  const isOwner = [
    "gomau.ead@gmail.com",
    "calepi@gmail.com",
    "calepe@gmail.com",
  ].includes(userEmail);
  const isRestrictedFaltas =
    (user?.cim === "3330" ||
      user?.cim === "331" ||
      ["diogo.mourapedroso@gmail.com", "tazmaniacrvg@gmail.com"].includes(
        userEmail,
      )) &&
    user?.role !== "gestor" &&
    !isOwner;

  const isMaster = ["gomau.ead@gmail.com", "calepi@gmail.com", "calepe@gmail.com"].includes(userEmail) || user?.role === "gestor";
  const isDelegatedUser = !isMaster && user?.role !== 'gestor' && !isRestrictedFaltas && user?.delegatedPastas && user.delegatedPastas.length > 0;

  const initialActiveTab = isRestrictedFaltas
    ? "solicitacoes"
    : isDelegatedUser
    ? "segundo_vigilante"
    : "dashboard";

  const [activeTab, setActiveTab] = useState(initialActiveTab);

  // Filtros de Data para Relatório de Faltas
  const [dataInicioRelatorio, setDataInicioRelatorio] = useState("");
  const [dataFimRelatorio, setDataFimRelatorio] = useState("");

  // Data for Conteúdos
  const [contents, setContents] = useState<any[]>([]);
  const [showAddContent, setShowAddContent] = useState(false);
  const [newContent, setNewContent] = useState({
    titulo: "",
    tipo: "video",
    grauMinimo: "Aprendiz",
    descricao: "",
    url: "",
  });
  const [editingContent, setEditingContent] = useState<any | null>(null);
  const [submittingContent, setSubmittingContent] = useState(false);

  // Data for Cursos
  const [courses, setCourses] = useState<any[]>([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    titulo: "",
    descricao: "",
    cargaHoraria: "",
    grade: "",
    elegibilidade: "",
    registrationUrl: "",
    status: "aberto",
  });
  const [submittingCourse, setSubmittingCourse] = useState(false);
  const [seedingCourses, setSeedingCourses] = useState(false);

  // Data for Solicitações
  const [requests, setRequests] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);

  // Computação de listagem de obreiros ativos hoje para o card correspondente
  const getS = (l: any) =>
    l.timestamp?.seconds ||
    (l.timestamp instanceof Date ? l.timestamp.getTime() / 1000 : 0);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const logsDeHoje = accessLogs.filter((log: any) => {
    let dateObj = null;
    if (log.timestamp?.toDate) {
      dateObj = log.timestamp.toDate();
    } else if (log.timestamp instanceof Date) {
      dateObj = log.timestamp;
    } else if (
      typeof log.timestamp === "string" ||
      typeof log.timestamp === "number"
    ) {
      dateObj = new Date(log.timestamp);
    } else if (log.timestamp?.seconds) {
      dateObj = new Date(log.timestamp.seconds * 1000);
    }
    return dateObj && dateObj >= startOfToday;
  });

  const mLogMap = new Map();
  logsDeHoje.forEach((log) => {
    const key = (log.cim || log.email || log.nome || "").toLowerCase().trim();
    if (!key) return;

    const existing = mLogMap.get(key);
    if (!existing) {
      mLogMap.set(key, log);
    } else {
      if (getS(log) > getS(existing)) {
        mLogMap.set(key, log);
      }
    }
  });

  const acessosHojeList = Array.from(mLogMap.values());

  // Data for Eventos
  const [events, setEvents] = useState<any[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    titulo: "",
    data: "",
    hora: "",
    local: "",
    grauMinimo: "Aprendiz",
    descricao: "",
    generateMinutes: true,
    status: "ativo",
  });
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  // Data for Evolution Rules
  const [rules, setRules] = useState<any>({
    Aprendiz_Companheiro: {
      tempoMinimoMeses: 6,
      quantidadePranchas: 3,
      quantidadeInstrucoes: 12,
      presencaMinima: 75,
      id: "",
    },
    Companheiro_Mestre: {
      tempoMinimoMeses: 6,
      quantidadePranchas: 4,
      quantidadeInstrucoes: 15,
      presencaMinima: 75,
      id: "",
    },
  });
  const [savingRules, setSavingRules] = useState("");
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    grauOrigem: "",
    grauDestino: "",
    tempoMinimoMeses: 6,
    quantidadePranchas: 3,
    quantidadeInstrucoes: 12,
    presencaMinima: 75,
  });
  const [generalSettings, setGeneralSettings] = useState<{
    diasPrazoResumo: number;
    tempoSessaoMin: number;
    decMediaMinima?: number;
    decFrequenciaMinima?: number;
    decVisitasMinimas?: number;
    id: string;
  }>({
    diasPrazoResumo: 7,
    tempoSessaoMin: 60,
    decMediaMinima: 75,
    decFrequenciaMinima: 75,
    decVisitasMinimas: 3,
    id: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Data for Security Words
  const [securityWords, setSecurityWords] = useState<any[]>([
    { prefixo: "01", nome: "União e Força", palavraAtual: "", expiraEm: "", mensalidade: 35 },
    { prefixo: "03", nome: "Sabedoria de Salomão 03", palavraAtual: "", expiraEm: "", mensalidade: 35 },
    { prefixo: "33", nome: "Jus Véritas 33", palavraAtual: "", expiraEm: "", mensalidade: 35 },
    { prefixo: "77", nome: "Arquitetos da Prosperidade 77", palavraAtual: "", expiraEm: "", mensalidade: 35 },
  ]);
  const [savingSecurity, setSavingSecurity] = useState(false);

  // Data for Membros
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [viewingMember, setViewingMember] = useState<any | null>(null);
  const [viewingMemberLastAccess, setViewingMemberLastAccess] = useState<any>(null);
  const [viewingMemberLogs, setViewingMemberLogs] = useState<any[]>([]);

  const handleViewMember = async (member: any) => {
    setViewingMember(member);
    setViewingMemberLastAccess(null);
    setViewingMemberLogs([]);
    try {
      let qLogs;
      if (member.uid) {
         qLogs = query(
           collection(db, "accessLogs"),
           where("uid", "==", member.uid),
           orderBy("timestamp", "desc"),
           limit(10)
         );
      } else {
         qLogs = query(
           collection(db, "accessLogs"),
           where("cim", "==", member.cim || member.CIM || ""),
           orderBy("timestamp", "desc"),
           limit(10)
         );
      }
      const snap = await getDocs(qLogs);
      if (!snap.empty) {
        const logs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setViewingMemberLastAccess(logs[0]);
        setViewingMemberLogs(logs);
      }
    } catch (e) {
      console.warn("Erro ao buscar logs de acesso", e);
    }
  };

  const [importing, setImporting] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [updatingMember, setUpdatingMember] = useState(false);
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [memberSortField, setMemberSortField] = useState<
    "nome" | "cim" | "masonic" | "status"
  >("nome");
  const [memberSortDirection, setMemberSortDirection] = useState<
    "asc" | "desc"
  >("asc");

  // RESET BASE STATES
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // States for Inconsistencies Scan
  const [inconsistencies, setInconsistencies] = useState<{member: any, issues: string[]}[] | null>(null);
  const [showInconsistenciesModal, setShowInconsistenciesModal] = useState(false);
  const [isFixingLojas, setIsFixingLojas] = useState(false);

  // States for Smart Import
  const [showImportOptionsModal, setShowImportOptionsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDegreeFilter, setExportDegreeFilter] = useState("all");
  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const [importConflicts, setImportConflicts] = useState<any[]>([]);
  const [newMembersToImport, setNewMembersToImport] = useState<any[]>([]);
  const [showImportReview, setShowImportReview] = useState(false);
  const [excelEmails, setExcelEmails] = useState<Set<string>>(new Set());

  // Helper for Loja by CIM
  const getLojaNameByCIM = (cim: string) => {
    if (!cim) return "---";
    const prefix = String(cim).substring(0, 2);
    const matched = securityWords.find(l => String(l.prefixo).padStart(2, "0") === prefix);
    return matched ? matched.nome : "Loja Não Identificada";
  };

  const scanInconsistencies = () => {
    const list = members.map(m => {
        const issues = [];
        const correctLoja = getLojaNameByCIM(m.cim || "");
        if (!m.loja || m.loja !== correctLoja) issues.push(`Loja divergente (Atual: ${m.loja || "Nenhuma"} | Pelo CIM: ${correctLoja})`);
        if (!m.cpf) issues.push("CPF ausente");
        if (!m.cim) issues.push("CIM ausente");
        if (!m.email) issues.push("E-mail primário ausente");
        if (!m.dataIniciacao) issues.push("Data de iniciação ausente");
        return { member: m, issues };
    }).filter(x => x.issues.length > 0);
    setInconsistencies(list);
    setShowInconsistenciesModal(true);
  };

  const autoFixLojas = async () => {
    if (!inconsistencies) return;
    setIsFixingLojas(true);
    let count = 0;
    try {
      for (const inc of inconsistencies) {
        const correctLoja = getLojaNameByCIM(inc.member.cim || "");
        if (inc.member.loja !== correctLoja && correctLoja !== "Loja Não Identificada") {
          const userRef = doc(db, "users", inc.member.id);
          await updateDoc(userRef, { loja: correctLoja, updatedAt: serverTimestamp() });
          count++;
        }
      }
      alert(`✅ ${count} cadastros tiveram suas Lojas corrigidas/sincronizadas com o CIM com sucesso!`);
      setShowInconsistenciesModal(false);
      // the snapshot listener will automatically update the members list
    } catch (err: any) {
      console.error(err);
      alert("Erro ao corrigir lojas: " + err.message);
    } finally {
      setIsFixingLojas(false);
    }
  };

  // Mask Helpers
  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return "---";
    const cleanStr = dateStr.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) return cleanStr;
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const [year, month, day] = cleanStr.split("-");
      return `${day}/${month}/${year}`;
    }
    return cleanStr;
  };

  const formatDateToYYYYMMDD = (dateStr: string) => {
    if (!dateStr) return "";
    const cleanStr = dateStr.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) {
      const [day, month, year] = cleanStr.split("/");
      return `${year}-${month}-${day}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      return cleanStr;
    }
    return "";
  };

  // Data for CIM Generation
  const [generatingCIM, setGeneratingCIM] = useState<any | null>(null);
  const [cimData, setCimData] = useState({
    photoUrl: "",
    photoFile: null as File | null,
    oriente: "",
    potencia: "GOMAU",
    cimNumber: "",
    qrCodeSequence: "",
  });
  const [savingCim, setSavingCim] = useState(false);

  const [evaluatingRequest, setEvaluatingRequest] = useState<any | null>(null);
  const [requestComment, setRequestComment] = useState("");
  const [decisionType, setDecisionType] = useState<
    "aprovar" | "rejeitar" | null
  >(null);

  const baseTabs = [
    { id: "dashboard", label: "Dashboard", icon: GraduationCap },
    { id: "conteudos", label: "Arquivos", icon: FileText },
    { id: "cursos", label: "Cursos", icon: BookOpen },
    { id: "biblioteca", label: "Biblioteca", icon: Library },
    { id: "solicitacoes", label: "Aprovações", icon: CheckCircle },
    { id: "eventos", label: "Eventos", icon: Calendar },
    { id: "membros", label: "Membros", icon: Users },
    { id: "segundo_vigilante", label: "2° Vigilante", icon: Shield },
    { id: "forum", label: "Fórum / Instrutores", icon: MessageSquare },
    { id: "configuracoes", label: "Configurações", icon: Settings },
    ...(isOwner
      ? [{ id: "avaliacao", label: "Valuation do Sistema", icon: BarChart3 }]
      : []),
  ];

  const tabs = isRestrictedFaltas
    ? baseTabs.filter((t) => t.id === "solicitacoes")
    : isDelegatedUser
    ? baseTabs.filter((t) => {
        return (user?.delegatedPastas || []).some((pasta: string) => {
          const mappedId = pasta.toLowerCase().includes("2") ? "segundo_vigilante" : pasta.toLowerCase().replace(/\s+/g, "_");
          return t.id === mappedId;
        });
      })
    : baseTabs;

  useEffect(() => {
    loadContents();
    loadCourses();
    loadRequests();
    loadEvents();
    loadEvolutionRules();
    seedInitialSecurity();
    loadExcelEmails();

    // Listener em tempo real para accessLogs
    const qLogs = query(
      collection(db, "accessLogs"),
      orderBy("timestamp", "desc"),
      limit(150),
    );
    const unsubscribeLogs = onSnapshot(
      qLogs,
      (snap) => {
        setAccessLogs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
        );
      },
      (err) => {
        console.warn("Erro ao carregar accessLogs:", err);
      },
    );

    // Listener em tempo real para membros
    const qMembers = query(collection(db, "users"), orderBy("nome", "asc"));
    const unsubscribeMembers = onSnapshot(
      qMembers,
      (snap) => {
        const allDocs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        // Deduplicação em tempo real por e-mail (normalizado)
        // Prioriza registros com UID (logados) e com mais campos preenchidos
        const seenEmails = new Set();
        const uniqueList: any[] = [];

        const sortedDocs = [...allDocs].sort((a, b) => {
          if (a.uid && !b.uid) return -1;
          if (!a.uid && b.uid) return 1;
          return Object.keys(b).length - Object.keys(a).length;
        });

        sortedDocs.forEach((m) => {
          const emailKey = (m.email || "").toLowerCase().trim();
          if (
            emailKey &&
            !seenEmails.has(emailKey) &&
            ![
              "gomau.ead@gmail.com",
              "calepi@gmail.com",
              "calepe@gmail.com",
            ].includes(emailKey)
          ) {
            seenEmails.add(emailKey);
            uniqueList.push(m);
          }
        });

        // Reordenar por nome para exibição
        uniqueList.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

        setMembers(uniqueList);
        setLoadingMembers(false);

        // Acionamento automático da rotina de limpeza profunda se muitas duplicatas detectadas
        if (allDocs.length > uniqueList.length + 3) {
          setTimeout(() => handleGlobalCorrection(true), 5000);
        }
      },
      (err: any) => {
        console.error("Error loading members:", err);
        if (err?.code === "resource-exhausted") {
          console.warn("Cota excedida no dashboard.");
        }
        setLoadingMembers(false);
      },
    );

    return () => {
      unsubscribeMembers();
      unsubscribeLogs();
    };
  }, []);

  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    setLastRefresh(new Date());
  }, [members]);

  const loadMembers = async () => {
    // Agora o onSnapshot cuida disso, mas mantemos o loadingMembers para feedbacks visuais se necessário
    setLoadingMembers(false);
  };

  const loadExcelEmails = async (showSuccess = false) => {
    try {
      console.log("loadExcelEmails: Iniciando carregamento...");
      const response = await fetch(`/validados.xlsx?t=${Date.now()}`);
      if (!response.ok) {
        console.warn(
          `loadExcelEmails: Arquivo não encontrado (status ${response.status})`,
        );
        if (showSuccess)
          alert(
            `Arquivo 'validados.xlsx' não encontrado no servidor (Status ${response.status}).`,
          );
        return;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        console.warn(
          "loadExcelEmails: O arquivo /validados.xlsx retornou HTML.",
        );
        if (showSuccess)
          alert(
            "O servidor retornou HTML em vez de Excel. O arquivo 'validados.xlsx' pode estar ausente na pasta public.",
          );
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength < 100) {
        console.warn("loadExcelEmails: Arquivo muito pequeno.");
        if (showSuccess)
          alert(
            "O arquivo parece estar vazio ou corrompido (tamanho insuficiente).",
          );
        return;
      }

      try {
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), {
          type: "array",
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const excelData: any[] = XLSX.utils.sheet_to_json(worksheet);

        const emails = new Set<string>();
        excelData.forEach((row) => {
          let email =
            row["Email Vinculado"]?.toString().toLowerCase().trim() ||
            row["EMAIL VINCULADO"]?.toString().toLowerCase().trim() ||
            row["EMAIL"]?.toString().toLowerCase().trim() ||
            row["Email"]?.toString().toLowerCase().trim() ||
            row["email"]?.toString().toLowerCase().trim() ||
            row["E-mail"]?.toString().toLowerCase().trim() ||
            row["E-MAIL"]?.toString().toLowerCase().trim() ||
            row["USER"]?.toString().toLowerCase().trim() ||
            row["Usuario"]?.toString().toLowerCase().trim() ||
            row["Usuário"]?.toString().toLowerCase().trim() ||
            row["Login"]?.toString().toLowerCase().trim();

          if (!email) {
            const possibleEmail = Object.values(row).find(
              (val) =>
                val &&
                typeof val === "string" &&
                val.includes("@") &&
                val.includes("."),
            );
            if (possibleEmail)
              email = possibleEmail.toString().toLowerCase().trim();
          }

          if (email) emails.add(email);
        });
        setExcelEmails(emails);
        console.log(
          `loadExcelEmails: Carregados ${emails.size} emails de referência.`,
        );
        if (showSuccess)
          alert(
            `Sucesso! ${emails.size} registros carregados para comparação.`,
          );
      } catch (parseError) {
        console.error("loadExcelEmails: Erro ao processar XLSX.", parseError);
        if (showSuccess)
          alert(
            "Erro ao ler o arquivo Excel. Certifique-se de que é um .xlsx válido.",
          );
      }
    } catch (error) {
      console.error("loadExcelEmails: Erro de rede:", error);
      if (showSuccess) alert("Erro de conexão ao tentar buscar o arquivo.");
    }
  };

  const handleImportExcel = async (fileArrayBuffer?: ArrayBuffer) => {
    setImporting(true);
    try {
      let arrayBuffer: ArrayBuffer;

      if (fileArrayBuffer) {
        arrayBuffer = fileArrayBuffer;
      } else {
        console.log("handleImportExcel: Buscando validados.xlsx...");
        const response = await fetch(`/validados.xlsx?t=${Date.now()}`);

        if (!response.ok) {
          throw new Error(
            `Arquivo 'validados.xlsx' não encontrado (Status: ${response.status}). Certifique-se de que ele está na pasta 'public' da raiz.`,
          );
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error(
            "O servidor retornou uma página HTML. Isso acontece quando o arquivo Excel não existe e o servidor redireciona para a página principal.",
          );
        }

        arrayBuffer = await response.arrayBuffer();
      }

      let workbook;
      try {
        workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
      } catch (e) {
        console.error("XLSX Read Error:", e);
        throw new Error(
          "Não foi possível ler o arquivo Excel. Ele pode estar corrompido ou salvo em um formato incompatível (use .xlsx padrão).",
        );
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const excelData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (!excelData || excelData.length === 0) {
        throw new Error(
          "A planilha está vazia ou não possui o formato esperado.",
        );
      }

      console.log(`Lidas ${excelData.length} linhas do Excel. Processando...`);

      const conflicts: any[] = [];
      const newMembers: any[] = [];
      const identicals: any[] = [];

      const formatTitleCase = (str: string) => {
        if (!str) return "";
        return str
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };

      for (const row of excelData) {
        let originalEmail =
          row["Email Vinculado"]?.toString().toLowerCase().trim() ||
          row["EMAIL VINCULADO"]?.toString().toLowerCase().trim() ||
          row["EMAIL"]?.toString().toLowerCase().trim() ||
          row["Email"]?.toString().toLowerCase().trim() ||
          row["email"]?.toString().toLowerCase().trim() ||
          row["E-mail"]?.toString().toLowerCase().trim() ||
          row["E-MAIL"]?.toString().toLowerCase().trim() ||
          row["Usuário"]?.toString().toLowerCase().trim() ||
          row["Usuário Vinculado"]?.toString().toLowerCase().trim() ||
          row["User"]?.toString().toLowerCase().trim() ||
          row["Usuario"]?.toString().toLowerCase().trim() ||
          row["Login"]?.toString().toLowerCase().trim() ||
          row["login"]?.toString().toLowerCase().trim();

        if (!originalEmail) {
          const possibleEmail = Object.values(row).find(
            (val) =>
              val &&
              typeof val === "string" &&
              val.includes("@") &&
              val.includes(".") &&
              val.length > 5,
          );
          if (possibleEmail)
            originalEmail = (possibleEmail as string).toLowerCase().trim();
        }

        if (!originalEmail) {
          console.log("Linha pulada por falta de e-mail (Andrey Debug):", row);
          continue;
        }

        const targetEmail = originalEmail;

        let rawStatus = (
          row["Status"] ||
          row["STATUS"] ||
          row["status"] ||
          "Ativo"
        )
          .toString()
          .trim()
          .toLowerCase();
        // Correção amigável de erros de digitação comuns como "Atvo" e normalização de "Validado"
        const normalizedStatus =
          rawStatus === "validado" || rawStatus === "atvo"
            ? "Ativo"
            : rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

        const excelPayload = {
          nome: formatTitleCase(
            row["Nome"] ||
              row["NOME"] ||
              row["nome"] ||
              row["Membro"] ||
              row["Irmão"] ||
              row["IRMAO"] ||
              row["NOME COMPLETO"] ||
              row["Nome Completo"] ||
              row["NOME DO MEMBRO"] ||
              row["Nome do Membro"] ||
              "",
          ).trim(),
          email: targetEmail.toLowerCase().trim(),
          emailVinculado: originalEmail.toLowerCase().trim(),
          cim: (
            row["CIM"] ||
            row["Cim"] ||
            row["cim"] ||
            row["C.I.M"] ||
            row["Matrícula"] ||
            row["MATRICULA"] ||
            ""
          )
            .toString()
            .trim(),
          cpf: maskCPF(
            (row["CPF"] || row["Cpf"] || row["cpf"] || "").toString(),
          ),
          grau: (
            row["Grau"] ||
            row["GRAU"] ||
            row["Nível"] ||
            row["grau"] ||
            row["Grau do Obreiro"] ||
            "Aprendiz"
          )
            .toString()
            .trim(),
          cargo: (
            row["Cargo"] ||
            row["CARGO"] ||
            row["Função"] ||
            row["cargo"] ||
            row["Cargo em Loja"] ||
            "Membro"
          )
            .toString()
            .trim(),
          dataNascimento: (
            row["Data Nascimento"] ||
            row["Nascimento"] ||
            row["data_nascimento"] ||
            ""
          )
            .toString()
            .trim(),
          status: normalizedStatus,
          loja: getLojaNameByCIM((row["CIM"] || row["cim"] || "").toString().trim()),
          rito: row["Rito"] || row["RITO"] || row["rito"] || "Emulação",
          telefone: maskPhone(
            (
              row["Telefone"] ||
              row["TELEFONE"] ||
              row["telefone"] ||
              ""
            ).toString(),
          ),
          cidade: (row["Cidade"] || row["CIDADE"] || row["cidade"] || "")
            .toString()
            .trim(),
          uf: (row["UF"] || row["Uf"] || row["Estado"] || row["uf"] || "")
            .toString()
            .trim()
            .toUpperCase()
            .substring(0, 2),
          cep: maskCEP(
            (row["CEP"] || row["Cep"] || row["cep"] || "").toString(),
          ),
          rua: (row["Rua"] || row["RUA"] || row["Endereço"] || row["rua"] || "")
            .toString()
            .trim(),
          bairro: (row["Bairro"] || row["BAIRRO"] || row["bairro"] || "")
            .toString()
            .trim(),
          emergencia: (
            row["Emergência"] ||
            row["EMERGÊNCIA"] ||
            row["contato_emergencia"] ||
            ""
          )
            .toString()
            .trim(),
          foneEmergencia: maskPhone(
            (
              row["Fone Emergência"] ||
              row["FONE EMERGÊNCIA"] ||
              row["fone_emergencia"] ||
              ""
            ).toString(),
          ),
          qtdFilhos: Number(
            row["Qtd Filhos"] || row["Filhos"] || row["filhos"] || 0,
          ),
        };
        // Buscar membro existente por e-mail no estado local (já carregado no loadMembers)
        const existing = members.find(
          (m) => m.email?.toLowerCase() === targetEmail,
        );

        if (existing) {
          // Comparar campos
          const diffFields: string[] = [];
          const fieldsToCompare = [
            "nome",
            "cim",
            "cpf",
            "grau",
            "cargo",
            "loja",
            "rito",
            "dataNascimento",
            "status",
            "telefone",
            "cidade",
            "uf",
            "cep",
            "rua",
            "bairro",
            "emergencia",
            "foneEmergencia",
            "qtdFilhos",
          ];

          fieldsToCompare.forEach((field) => {
            const currentVal = existing[field]?.toString() || "";
            const excelVal =
              excelPayload[field as keyof typeof excelPayload]?.toString() ||
              "";

            if (currentVal !== excelVal) {
              diffFields.push(field);
            }
          });

          if (diffFields.length > 0) {
            conflicts.push({
              id: existing.id,
              email: targetEmail,
              nome: existing.nome,
              current: existing,
              excel: excelPayload,
              diffFields,
            });
          } else {
            identicals.push({ id: existing.id, ...excelPayload });
          }
        } else {
          newMembers.push(excelPayload);
        }
      }

      if (conflicts.length === 0 && newMembers.length === 0) {
        alert(
          `Sincronização Finalizada:\n\n- ${excelData.length} registros analisados.\n- ${identicals.length} já estão atualizados.\n- Nenhum novo registro ou divergência encontrada.\n\nDica: Verifique se os nomes das colunas na primeira linha batem com:\n'Nome', 'Email', 'CIM', 'CPF', 'Grau', 'Cargo', 'Telefone', 'Cidade', 'UF'.`,
        );
        setImporting(false);
      } else {
        // Atualizar também a lista de emails de referência local
        const emails = new Set<string>();
        excelData.forEach((row) => {
          let email =
            row["Email Vinculado"]?.toString().toLowerCase().trim() ||
            row["EMAIL VINCULADO"]?.toString().toLowerCase().trim() ||
            row["EMAIL"]?.toString().toLowerCase().trim() ||
            row["Email"]?.toString().toLowerCase().trim() ||
            row["email"]?.toString().toLowerCase().trim() ||
            row["E-mail"]?.toString().toLowerCase().trim() ||
            row["E-MAIL"]?.toString().toLowerCase().trim() ||
            row["USER"]?.toString().toLowerCase().trim() ||
            row["Usuário"]?.toString().toLowerCase().trim();

          if (!email) {
            const possibleEmail = Object.values(row).find(
              (val) =>
                typeof val === "string" &&
                val.includes("@") &&
                val.includes("."),
            );
            if (possibleEmail)
              email = possibleEmail.toString().toLowerCase().trim();
          }

          if (email) emails.add(email);
        });
        setExcelEmails(emails);

        setImportConflicts(conflicts);
        setNewMembersToImport(newMembers);
        setShowImportReview(true);
      }
    } catch (error: any) {
      console.error("Erro na importação:", error);
      alert(`Falha na importação: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleLocalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (arrayBuffer) {
          setShowImportOptionsModal(false);
          await handleImportExcel(arrayBuffer);
        } else {
          alert("Não foi possível ler o arquivo selecionado.");
          setImporting(false);
        }
      };
      reader.onerror = () => {
        alert("Erro no leitor de arquivos.");
        setImporting(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      alert(`Erro ao processar arquivo selecionado: ${err.message}`);
      setImporting(false);
    } finally {
      // Clear value so the same file can be uploaded again if needed
      e.target.value = "";
    }
  };

  const handleExportMembers = () => {
    try {
      const filtered = members.filter((m) => {
        if (exportDegreeFilter === "all") return true;
        if (exportDegreeFilter === "Aprendiz") return m.grau === "Aprendiz";
        if (exportDegreeFilter === "Companheiro") return m.grau === "Companheiro";
        if (exportDegreeFilter === "Mestre") return m.grau === "Mestre" || m.grau === "Mestre Instalado";
        return true;
      });

      if (filtered.length === 0) {
        alert("Nenhum membro encontrado com o filtro de grau selecionado.");
        return;
      }

      // Map complete list of fields
      const rows = filtered.map((m) => ({
        "CIM": m.cim || "",
        "Nome Completo": m.nome || "",
        "Grau": m.grau || "",
        "CPF": m.cpf || "",
        "Data de Nascimento": m.dataNascimento || "",
        "Telefone de Contato": m.telefone || "",
        "Endereço - Rua": m.rua || "",
        "Endereço - Número": m.numero || "",
        "Endereço - Complemento": m.complemento || "",
        "Endereço - Bairro": m.bairro || "",
        "Endereço - Cidade": m.cidade || "",
        "Endereço - Estado (UF)": m.uf || "",
        "Endereço - CEP": m.cep || "",
        "E-mail": m.email || "",
        "Cargo": m.cargo || "",
        "Estado Civil": m.estadoCivil || "",
        "Esposa": m.esposa || "",
        "Contato de Emergência": m.emergencia || "",
        "Telefone de Emergência": m.foneEmergencia || "",
        "Quantidade de Filhos": m.qtdFilhos || "0"
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Simple column widths optimization
      const maxLens = Object.keys(rows[0] || {}).reduce((acc: any, key: string) => {
        acc[key] = key.length;
        return acc;
      }, {});
      rows.forEach((row: any) => {
        Object.keys(row).forEach((key) => {
          const valStr = String(row[key] || "");
          if (valStr.length > (maxLens[key] || 0)) {
            maxLens[key] = valStr.length;
          }
        });
      });
      const cols = Object.keys(maxLens).map((key) => ({
        wch: Math.max(maxLens[key] + 4, 10)
      }));
      worksheet["!cols"] = cols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Membros GOMAU");

      const dateStr = new Date().toISOString().split("T")[0];
      const nameFilter = exportDegreeFilter === "all" ? "Todos" : exportDegreeFilter;
      const fileName = `Membros_GOMAU_${nameFilter}_${dateStr}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setShowExportModal(false);
    } catch (err: any) {
      console.error("Erro ao exportar membros:", err);
      alert(`Erro ao exportar: ${err.message}`);
    }
  };

  const confirmImport = async () => {
    setImporting(true);
    try {
      let updated = 0;
      let created = 0;

      // 1. Processar Conflitos (Update)
      for (const conflict of importConflicts) {
        await updateDoc(doc(db, "users", conflict.id), {
          ...conflict.excel,
          updatedAt: serverTimestamp(),
        });
        updated++;
      }

      // 2. Processar Novos Membros (Create/Upsert)
      for (const member of newMembersToImport) {
        if (!member.email) continue;

        const targetEmail = member.email.toLowerCase().trim();
        const cleanCPF = member.cpf.replace(/\D/g, "");

        // BUSCA ADICIONAL DE SEGURANÇA: Mesmo que tenha sido identificado como "Novo" no scan inicial,
        // vamos verificar novamente contra a lista carregada (que pode ter mudado ou ter CPFs batendo)
        const existing = members.find(
          (m) =>
            m.email?.toLowerCase() === targetEmail ||
            m.emailVinculado?.toLowerCase() === targetEmail ||
            (m.cpf && m.cpf.replace(/\D/g, "") === cleanCPF && cleanCPF !== ""),
        );

        const docId = existing ? existing.id : targetEmail;
        const userRef = doc(db, "users", docId);

        await setDoc(
          userRef,
          {
            ...member,
            role: existing?.role || "membro",
            grau: member.grau || existing?.grau || "Aprendiz",
            loja: getLojaNameByCIM(member.cim),
            rito: member.rito || existing?.rito || "Emulação",
            dataCadastro:
              existing?.dataCadastro || new Date().toISOString().split("T")[0],
            createdAt: existing?.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
            imported: true,
          },
          { merge: true },
        );

        created++;
      }

      alert(`Sucesso!\nAtualizados: ${updated}\nCriados: ${created}`);
      setShowImportReview(false);
      await loadMembers();
    } catch (err: any) {
      console.error("Erro crítico ao salvar importação:", err);
      try {
        const errorDetails = handleFirestoreError(
          err,
          OperationType.WRITE,
          "import/users",
        );
        console.error("Detalhes do erro Firestore:", errorDetails);
      } catch (e) {}
      alert(
        `Erro ao salvar dados importados: ${err.message || "Verifique o console para mais detalhes."}`,
      );
    } finally {
      setImporting(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || updatingMember) return;
    setUpdatingMember(true);
    try {
      // Verificação de CPF Único
      const cleanCpf = (editingMember.cpf || "").replace(/\D/g, "");
      if (cleanCpf) {
        const q = query(
          collection(db, "users"),
          where("cpf", "==", editingMember.cpf),
        );
        const snap = await getDocs(q);
        const duplicate = snap.docs.find((d) => d.id !== editingMember.id);
        if (duplicate) {
          alert(
            `ERRO: Este CPF já está vinculado ao e-mail ${duplicate.data().email}. Cada CPF deve ser único.`,
          );
          setUpdatingMember(false);
          return;
        }
      }

      const userRef = doc(db, "users", editingMember.id);
      const oldDoc = await getDoc(userRef);
      const oldData = oldDoc.data();

      const payload = {
        nome: editingMember.nome || "",
        grau: editingMember.grau || "Aprendiz",
        role: editingMember.role || "membro",
        loja: getLojaNameByCIM(editingMember.cim),
        rito: editingMember.rito || "Emulação",
        cim: editingMember.cim || "",
        cargo: editingMember.cargo || "Membro",
        status: editingMember.status || "Ativo",
        dataIniciacao: editingMember.dataIniciacao || "",
        cpf: editingMember.cpf || "",
        telefone: editingMember.telefone || "",
        dataNascimento: editingMember.dataNascimento || "",
        email: editingMember.email || "",
        emailVinculado:
          editingMember.emailVinculado || editingMember.email || "",
        cep: editingMember.cep || "",
        rua: editingMember.rua || "",
        numero: editingMember.numero || "",
        bairro: editingMember.bairro || "",
        cidade: editingMember.cidade || "",
        uf: editingMember.uf || "",
        estadoCivil: editingMember.estadoCivil || "Casado/a",
        esposa: editingMember.esposa || "",
        emergencia: editingMember.emergencia || "",
        foneEmergencia: editingMember.foneEmergencia || "",
        qtdFilhos: Number(editingMember.qtdFilhos) || 0,
        filhos: editingMember.filhos || [],
        frequencia: Number(editingMember.frequencia) || 0,
        visitas: Number(editingMember.visitas) || 0,
        condecoracoes: editingMember.condecoracoes || [],
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userRef, payload);

      // Feedback de sucesso
      alert("Cadastro do Ir∴ atualizado com sucesso!");

      // Histórico se houver mudança crítica
      if (oldData) {
        let historyTitle = "";
        let historyDesc = "";
        if (oldData.grau !== payload.grau) {
          historyTitle = "Mudança de Grau";
          historyDesc = `O Grau foi alterado de ${oldData.grau} para ${payload.grau} pelo Gestor.`;
        } else if (oldData.loja !== payload.loja) {
          historyTitle = "Mudança de Loja";
          historyDesc = `A Loja foi alterado de ${oldData.loja} para ${payload.loja} pelo Gestor.`;
        } else if (oldData.role !== payload.role) {
          historyTitle = "Mudança de Permissão";
          historyDesc = `A permissão foi alterada de ${oldData.role} para ${payload.role} pelo Gestor.`;
        }

        if (historyTitle) {
          await addDoc(collection(db, "history"), {
            userId: editingMember.id,
            tipo: "marco",
            titulo: historyTitle,
            descricao: historyDesc,
            data: new Date().toLocaleDateString("pt-br"),
            hora: new Date().toLocaleTimeString("pt-br", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            autor: "Gestor",
            criadoEm: serverTimestamp(),
          });
        }
      }

      setEditingMember(null);
      await loadMembers();
      console.log("Membro atualizado com sucesso");
    } catch (err: any) {
      console.error("Erro ao atualizar membro:", err);
      alert("Erro ao salvar: " + (err.message || "Erro desconhecido"));
      try {
        handleFirestoreError(
          err,
          OperationType.WRITE,
          `users/${editingMember?.id}`,
        );
      } catch (e) {}
    } finally {
      setUpdatingMember(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    setLoadingMembers(true);
    try {
      await deleteDoc(doc(db, "users", id));
      await loadMembers();
      alert(`Membro ${name} excluído com sucesso.`);
    } catch (err: any) {
      console.error("Erro ao excluir membro:", err);
      alert("Erro ao excluir membro.");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleOpenCim = (member: any) => {
    setGeneratingCIM(member);
    setCimData({
      photoUrl: member.cimCard?.photoUrl || "",
      photoFile: null,
      oriente: member.cimCard?.oriente || member.cidade || "",
      potencia: member.cimCard?.potencia || "GOMAU",
      cimNumber: member.cim || "",
      qrCodeSequence: member.cimCard?.qrCodeSequence || "",
    });
  };

  const handleSaveCim = async () => {
    if (!generatingCIM) return;
    setSavingCim(true);
    try {
      let finalPhotoUrl = cimData.photoUrl;

      if (cimData.photoFile) {
        const fileRef = ref(
          storage,
          `cim_photos/${generatingCIM.id}_${Date.now()}`,
        );
        await uploadBytes(fileRef, cimData.photoFile);
        finalPhotoUrl = await getDownloadURL(fileRef);
      }

      const userRef = doc(db, "users", generatingCIM.id);
      await updateDoc(userRef, {
        cim: cimData.cimNumber, // sync main object
        cimCard: {
          photoUrl: finalPhotoUrl,
          oriente: cimData.oriente,
          potencia: cimData.potencia,
          qrCodeSequence: cimData.qrCodeSequence,
          generated: true,
          updatedAt: serverTimestamp(),
        },
      });

      await addDoc(collection(db, "history"), {
        userId: generatingCIM.id,
        tipo: "marco",
        titulo: "CIM Gerada/Atualizada",
        descricao: `A Carteira de Identidade Maçônica foi gerada e disponibilizada.`,
        data: new Date().toLocaleDateString("pt-br"),
        hora: new Date().toLocaleTimeString("pt-br", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        autor: "Gestor",
        criadoEm: serverTimestamp(),
      });

      setGeneratingCIM(null);
      await loadMembers();
    } catch (err) {
      console.error("Error saving CIM:", err);
      try {
        handleFirestoreError(
          err,
          OperationType.WRITE,
          `users/${generatingCIM.id}`,
        );
      } catch (e) {}
    } finally {
      setSavingCim(false);
    }
  };

  const loadEvolutionRules = async () => {
    try {
      const snap = await getDocs(query(collection(db, "evolutionRules")));
      if (!snap.empty) {
        const fetchedRules: any = {}; // Reset to prevent only showing hardcoded initially
        snap.docs.forEach((d) => {
          const data = d.data();
          const key = `${data.grauOrigem}_${data.grauDestino}`;
          fetchedRules[key] = { ...data, id: d.id };
        });
        // Ensure default ones exist if not loaded
        if (!fetchedRules["Aprendiz_Companheiro"])
          fetchedRules["Aprendiz_Companheiro"] = rules["Aprendiz_Companheiro"];
        if (!fetchedRules["Companheiro_Mestre"])
          fetchedRules["Companheiro_Mestre"] = rules["Companheiro_Mestre"];

        setRules(fetchedRules);
      }

      const settingsSnap = await getDocs(query(collection(db, "settings")));
      settingsSnap.docs.forEach((d) => {
        if (d.id === "general") {
          setGeneralSettings({ ...(d.data() as any), id: d.id });
        }
      });

      const securitySnap = await getDoc(doc(db, "configs", "security"));
      if (securitySnap.exists()) {
        const data = securitySnap.data();
        if (data.lojas && Array.isArray(data.lojas)) {
          setSecurityWords(data.lojas.map((l: any) => ({
            ...l,
            mensalidade: l.mensalidade !== undefined ? Number(l.mensalidade) : 35,
            expiraEm: l.expiraEm ? (l.expiraEm.toDate ? new Date(l.expiraEm.toDate()).toISOString().split("T")[0] : new Date(l.expiraEm).toISOString().split("T")[0]) : ""
          })));
        } else {
          setSecurityWords(prev => {
            return prev.map(loja => {
              if (data.palavraAtual) {
                return {
                  ...loja,
                  palavraAtual: data.palavraAtual || "",
                  expiraEm: data.expiraEm ? data.expiraEm.toDate().toISOString().split("T")[0] : "",
                  mensalidade: 35
                };
              }
              return loja;
            });
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const seedInitialSecurity = async () => {
    try {
      const securitySnap = await getDoc(doc(db, "configs", "security"));
      if (!securitySnap.exists() || !(securitySnap.data() as any).lojas) {
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

        const initialLojas = [
          { prefixo: "01", nome: "União e Força", palavraAtual: "FORTITUDO", expiraEm: threeMonthsFromNow, mensalidade: 35 },
          { prefixo: "03", nome: "Sabedoria de Salomão 03", palavraAtual: "FORTITUDO", expiraEm: threeMonthsFromNow, mensalidade: 35 },
          { prefixo: "33", nome: "Jus Véritas 33", palavraAtual: "FORTITUDO", expiraEm: threeMonthsFromNow, mensalidade: 35 },
          { prefixo: "77", nome: "Arquitetos da Prosperidade 77", palavraAtual: "FORTITUDO", expiraEm: threeMonthsFromNow, mensalidade: 35 },
        ];

        await setDoc(doc(db, "configs", "security"), {
          lojas: initialLojas,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        setSecurityWords(initialLojas.map(l => ({
          ...l,
          expiraEm: l.expiraEm.toISOString().split("T")[0],
          mensalidade: 35
        })));
      }
    } catch (err) {
      console.error("Erro ao semear segurança inicial:", err);
    }
  };

  const saveGeneralSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(
        doc(db, "settings", "general"),
        {
          diasPrazoResumo: Number(generalSettings.diasPrazoResumo),
          tempoSessaoMin: Number(generalSettings.tempoSessaoMin || 60),
          decMediaMinima: Number(
            generalSettings.decMediaMinima !== undefined
              ? generalSettings.decMediaMinima
              : 75,
          ),
          decFrequenciaMinima: Number(
            generalSettings.decFrequenciaMinima !== undefined
              ? generalSettings.decFrequenciaMinima
              : 75,
          ),
          decVisitasMinimas: Number(
            generalSettings.decVisitasMinimas !== undefined
              ? generalSettings.decVisitasMinimas
              : 3,
          ),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      alert("Configurações Gerais salvas!");
    } catch (err: any) {
      console.error("Erro ao salvar config geral:", err);
      alert("Erro: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const saveSecurityWord = async () => {
    setSavingSecurity(true);
    try {
      const dbLojas = securityWords.map(l => {
        const { isNew, isEditing, ...rest } = l;
        return {
          ...rest,
          mensalidade: rest.mensalidade !== undefined && rest.mensalidade !== "" ? Number(rest.mensalidade) : 35,
          expiraEm: rest.expiraEm ? new Date(rest.expiraEm) : null,
        };
      });

      await setDoc(
        doc(db, "configs", "security"),
        {
          lojas: dbLojas,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      
      setSecurityWords(prev => prev.map(l => {
        const { isNew, isEditing, ...rest } = l;
        return rest;
      }));

      alert("Palavras Sagradas atualizadas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar palavra sagrada:", err);
      alert("Erro: " + err.message);
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleAddRule = () => {
    if (!newRule.grauOrigem || !newRule.grauDestino)
      return alert("Preencha origem e destino.");
    const key = `${newRule.grauOrigem}_${newRule.grauDestino}`;
    setRules({ ...rules, [key]: { ...newRule, id: "" } });
    setShowAddRule(false);
    setNewRule({
      grauOrigem: "",
      grauDestino: "",
      tempoMinimoMeses: 6,
      quantidadePranchas: 3,
      quantidadeInstrucoes: 12,
      presencaMinima: 75,
    });
  };

  const handleDeleteRule = async (key: string) => {
    try {
      const ruleDoc = rules[key];
      if (ruleDoc.id) {
        await deleteDoc(doc(db, "evolutionRules", ruleDoc.id));
      }
      const newRules = { ...rules };
      delete newRules[key];
      setRules(newRules);
    } catch (err) {
      console.error(err);
    }
  };

  const saveRule = async (
    key: string,
    grauOrigem: string,
    grauDestino: string,
  ) => {
    if (savingRules) return;
    setSavingRules(key);
    try {
      const ruleData = rules[key];
      const payload = {
        grauOrigem,
        grauDestino,
        tempoMinimoMeses: Number(ruleData.tempoMinimoMeses),
        quantidadePranchas: Number(ruleData.quantidadePranchas),
        quantidadeInstrucoes: Number(ruleData.quantidadeInstrucoes),
        presencaMinima: Number(ruleData.presencaMinima),
        updatedAt: serverTimestamp(),
      };

      if (ruleData.id) {
        await updateDoc(doc(db, "evolutionRules", ruleData.id), payload);
      } else {
        const docRef = await addDoc(collection(db, "evolutionRules"), payload);
        setRules({ ...rules, [key]: { ...rules[key], id: docRef.id } });
      }
      console.log("Regra de evolução salva");
    } catch (err: any) {
      console.error("Erro ao salvar regra:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, "evolutionRules");
      } catch (e) {}
    } finally {
      setSavingRules("");
    }
  };

  const seedDefaultCourses = async () => {
    setSeedingCourses(true);
    const defaultCourses = [
      // APRENDIZ
      {
        titulo: "Instrução I: O Primeiro Passo",
        descricao:
          "A recepção do neófito, o significado do despojamento dos metais e as primeiras impressões da Luz.",
        cargaHoraria: "10 horas",
        grade: "Ritualística / Simbologia",
        elegibilidade: "Aprendiz",
        registrationUrl: "",
        status: "fechado",
      },
      {
        titulo: "O Silêncio e a Coluna J",
        descricao:
          "O estudo profundo sobre o silêncio iniciático e a força representada pela primeira coluna.",
        cargaHoraria: "15 horas",
        grade: "Filosofia",
        elegibilidade: "Aprendiz",
        registrationUrl: "",
        status: "fechado",
      },
      {
        titulo: "Ferramentas de Trabalho: Maço e Cinzel",
        descricao:
          "A aplicação moral das ferramentas básicas na lapidação da Pedra Bruta.",
        cargaHoraria: "12 horas",
        grade: "Simbologia",
        elegibilidade: "Aprendiz",
        registrationUrl: "",
        status: "fechado",
      },
      {
        titulo: "O Pavimento de Mosaico e a Dualidade",
        descricao:
          "Contrastes da vida e a harmonia entre os opostos dentro do Templo.",
        cargaHoraria: "10 horas",
        grade: "Simbologia",
        elegibilidade: "Aprendiz",
        registrationUrl: "",
        status: "fechado",
      },
      {
        titulo: "História do G∴O∴M∴A∴U∴",
        descricao:
          "As origens da nossa potência, sua carta patente e missão na Maçonaria Universal.",
        cargaHoraria: "08 horas",
        grade: "História",
        elegibilidade: "Aprendiz",
        registrationUrl: "",
        status: "fechado",
      },
      // COMPANHEIRO
      {
        titulo: "As 7 Artes e Ciências Liberais",
        descricao:
          "Um mergulho na Gramática, Retórica, Lógica, Aritmética, Geometria, Música e Astronomia.",
        cargaHoraria: "40 horas",
        grade: "Ciência / Educação",
        elegibilidade: "Companheiro",
        registrationUrl: "",
        status: "fechado",
      },
      {
        titulo: "A Estrela Flamígera e a Letra G",
        descricao:
          "O gênio humano, a geometria e a presença do Criador no coração do homem.",
        cargaHoraria: "25 horas",
        grade: "Filosofia / Geometria",
        elegibilidade: "Companheiro",
        registrationUrl: "",
        status: "fechado",
      },
      {
        titulo: "O Trabalho Social do Companheiro",
        descricao:
          "A transição da Pedra Bruta para a Pedra Polida e o serviço à humanidade.",
        cargaHoraria: "20 horas",
        grade: "Ética",
        elegibilidade: "Companheiro",
        registrationUrl: "",
        status: "fechado",
      },
      {
        titulo: "A Escada em Caracol",
        descricao:
          "O simbolismo da subida, os degraus do conhecimento e a perseverança.",
        cargaHoraria: "15 horas",
        grade: "Simbologia",
        elegibilidade: "Companheiro",
        registrationUrl: "",
        status: "fechado",
      },
      // MESTRE
      {
        titulo: "A Lenda de Hiram Abiff",
        descricao:
          "O drama do terceiro grau, a fidelidade ao dever e a vitória sobre a morte.",
        cargaHoraria: "50 horas",
        grade: "Alta Filosofia",
        elegibilidade: "Mestre",
        registrationUrl: "",
        status: "fechado",
      },
      {
        titulo: "Gestão e Liderança de Lojas",
        descricao:
          "Como administrar uma oficina, as joias móveis e a responsabilidade das luzes.",
        cargaHoraria: "30 horas",
        grade: "Administração",
        elegibilidade: "Mestre",
        registrationUrl: "",
        status: "fechado",
      },
      {
        titulo: "A Imortalidade da Alma",
        descricao:
          "Reflexões sobre a vida após a vida e a continuidade da Obra do G∴A∴D∴U∴",
        cargaHoraria: "20 horas",
        grade: "Metafísica",
        elegibilidade: "Mestre",
        registrationUrl: "",
        status: "fechado",
      },
      {
        titulo: "O Exame dos Mestres",
        descricao:
          "Preparação para cargos eletivos e a profundidade da Terceira Câmara.",
        cargaHoraria: "15 horas",
        grade: "Liturgia Avançada",
        elegibilidade: "Mestre",
        registrationUrl: "",
        status: "fechado",
      },
    ];

    try {
      for (const c of defaultCourses) {
        await addDoc(collection(db, "courses"), {
          ...c,
          createdAt: serverTimestamp(),
        });
      }
      await loadCourses();
      alert("Trilhas de estudo GOMAU criadas com sucesso!");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao semear trilhas: " + err.message);
    } finally {
      setSeedingCourses(false);
    }
  };

  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [updatingCourse, setUpdatingCourse] = useState(false);

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || updatingCourse) return;
    setUpdatingCourse(true);
    try {
      const courseRef = doc(db, "courses", editingCourse.id);

      const updateData: any = {
        titulo: editingCourse.titulo || "",
        descricao: editingCourse.descricao || "",
        cargaHoraria: editingCourse.cargaHoraria || "",
        elegibilidade: editingCourse.elegibilidade || "Todos",
        status: editingCourse.status || "rascunho",
        registrationUrl: editingCourse.registrationUrl || "",
        updatedAt: serverTimestamp(),
      };

      // Só inclui campos que existem
      if (editingCourse.grade !== undefined)
        updateData.grade = editingCourse.grade;
      if (editingCourse.modulos !== undefined)
        updateData.modulos = editingCourse.modulos;
      if (editingCourse.configOriginal !== undefined)
        updateData.configOriginal = editingCourse.configOriginal;

      await updateDoc(courseRef, updateData);
      setEditingCourse(null);
      await loadCourses();
      alert("Curso atualizado com sucesso!");
    } catch (err: any) {
      console.error("Course Update Error:", err);
      alert("Erro ao atualizar curso: " + err.message);
    } finally {
      setUpdatingCourse(false);
    }
  };

  const [updatingAll, setUpdatingAll] = useState(false);

  const resetAllCourses = async () => {
    if (
      !confirm(
        "Esta ação irá FECHAR todos os cursos e REMOVER todos os links. Deseja continuar?",
      )
    )
      return;

    setUpdatingAll(true);
    try {
      const snap = await getDocs(collection(db, "courses"));
      const total = snap.docs.length;

      let processed = 0;
      for (const courseDoc of snap.docs) {
        await updateDoc(doc(db, "courses", courseDoc.id), {
          status: "fechado",
          registrationUrl: "",
          updatedAt: serverTimestamp(),
        });
        processed++;
      }

      await loadCourses();
      alert(
        `${processed} cursos foram atualizados para 'Fechado' e links removidos.`,
      );
    } catch (err: any) {
      console.error(err);
      alert("Erro na varredura: " + err.message);
    } finally {
      setUpdatingAll(false);
    }
  };

  const handleGlobalCorrection = async (silent = false) => {
    if (
      !silent &&
      !confirm(
        "Esta ação irá:\n1. REMOVER DUPLICADAS por e-mail\n2. Padronizar Loja e Rito\n3. Formatar Nomes\n4. Corrigir Status 'Validado' para 'Ativo'\n\nDeseja continuar?",
      )
    )
      return;
    if (!silent) setLoadingMembers(true);

    const formatTitleCase = (str: string) => {
      if (!str) return "";
      return str
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    try {
      const snap = await getDocs(collection(db, "users"));
      const allDocs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      let dedupeCount = 0;
      let correctionCount = 0;
      let orphanCount = 0;

      // 0. Identificar e Remover Órfãos (Sem e-mail ou sem nome)
      const orphanDocs = allDocs.filter((docObj) => {
        const hasEmail = !!(docObj.email || "").trim();
        const hasNome = !!(docObj.nome || "").trim();
        const isSelf = [
          "gomau.ead@gmail.com",
          "calepi@gmail.com",
          "calepe@gmail.com",
        ].includes((docObj.email || "").toLowerCase().trim());
        return !isSelf && (!hasEmail || !hasNome);
      });

      for (const docObj of orphanDocs) {
        console.log(
          `Removendo registro órfão/inválido: ID ${docObj.id}, Nome: ${docObj.nome}, Email: ${docObj.email}`,
        );
        await deleteDoc(doc(db, "users", docObj.id));
        orphanCount++;
        // Tirar da lista processada
        const idx = allDocs.findIndex((d) => d.id === docObj.id);
        if (idx > -1) allDocs.splice(idx, 1);
      }

      // 1. Identificar Duplicadas por CPF e E-mail (Case Insensitive)
      const emailGroups: { [key: string]: any[] } = {};
      const cpfGroups: { [key: string]: any[] } = {};

      allDocs.forEach((doc) => {
        const email = (doc.email || "").toLowerCase().trim();
        const vEmail = (doc.emailVinculado || "").toLowerCase().trim();
        const cleanCpf = (doc.cpf || "").replace(/\D/g, "");

        if (email) {
          if (!emailGroups[email]) emailGroups[email] = [];
          emailGroups[email].push(doc);
        }
        if (vEmail && vEmail !== email) {
          if (!emailGroups[vEmail]) emailGroups[vEmail] = [];
          if (!emailGroups[vEmail].find((d) => d.id === doc.id))
            emailGroups[vEmail].push(doc);
        }
        if (cleanCpf && cleanCpf.length === 11) {
          if (!cpfGroups[cleanCpf]) cpfGroups[cleanCpf] = [];
          cpfGroups[cleanCpf].push(doc);
        }
      });

      // Conjunto de IDs já marcados para exclusão para evitar double-delete
      const idsToDelete = new Set<string>();

      const processGroups = (groups: { [key: string]: any[] }) => {
        for (const key in groups) {
          const docsInGroup = groups[key].filter((d) => !idsToDelete.has(d.id));

          if (docsInGroup.length > 1) {
            // Temos duplicatas! Escolher o "Doc Mestre"
            docsInGroup.sort((a, b) => {
              // Prioridade 1: É o UID do registro oficial?
              const aIsUid = a.id === a.uid && !!a.uid;
              const bIsUid = b.id === b.uid && !!b.uid;
              if (aIsUid && !bIsUid) return -1;
              if (!aIsUid && bIsUid) return 1;

              // Prioridade 2: Cargo de Gestor
              if (a.role === "gestor" && b.role !== "gestor") return -1;
              if (a.role !== "gestor" && b.role === "gestor") return 1;

              // Prioridade 3: Mais campos preenchidos
              const aFields = Object.keys(a).length;
              const bFields = Object.keys(b).length;
              if (aFields > bFields) return -1;
              if (bFields > aFields) return 1;

              return 0;
            });

            const masterDoc = docsInGroup[0];
            const duplicates = docsInGroup.slice(1);

            for (const duplicate of duplicates) {
              idsToDelete.add(duplicate.id);
            }
          }
        }
      };

      processGroups(emailGroups);
      processGroups(cpfGroups);

      for (const idToDelete of idsToDelete) {
        console.log(`Removendo duplicata detectada: ID ${idToDelete}`);
        try {
          await deleteDoc(doc(db, "users", idToDelete));
          dedupeCount++;
        } catch (e) {
          console.error("Erro ao deletar duplicata:", e);
        }
      }

      // 2. Aplicar correções de padronização nos que sobraram
      const remainingDocs = allDocs.filter((d) => !idsToDelete.has(d.id));
      for (const member of remainingDocs) {
        let needsUpdate = false;
        const updates: any = {};

        // Migrar campos de e-mail mal nomeados (ex: "Email" para "email")
        const rawEmail =
          member.email ||
          member.Email ||
          member.EMAIL ||
          member["E-mail"] ||
          "";
        const cleanEmail = rawEmail.toString().toLowerCase().trim();

        if (cleanEmail && member.email !== cleanEmail) {
          updates.email = cleanEmail;
          needsUpdate = true;
        }

        const rawVEmail =
          member.emailVinculado ||
          member.EmailVinculado ||
          member["Email Vinculado"] ||
          member.Login ||
          "";
        const cleanVEmail = rawVEmail.toString().toLowerCase().trim();
        if (cleanVEmail && member.emailVinculado !== cleanVEmail) {
          updates.emailVinculado = cleanVEmail;
          needsUpdate = true;
        }

        // Garantir que emailVinculado existe e é igual ao email se estiver em branco
        if (!member.emailVinculado && cleanEmail) {
          updates.emailVinculado = cleanEmail;
          needsUpdate = true;
        }

        // Se o email principal estiver em branco mas existir o vinculado, inverte
        if (!cleanEmail && cleanVEmail) {
          updates.email = cleanVEmail;
          needsUpdate = true;
        }

        const formattedName = formatTitleCase(member.nome || "");
        if (member.nome !== formattedName) {
          updates.nome = formattedName;
          needsUpdate = true;
        }

        if (
          member.status?.toLowerCase() === "validado" ||
          member.status === "ativo"
        ) {
          if (member.status !== "Ativo") {
            updates.status = "Ativo";
            needsUpdate = true;
          }
        }

        // CPF Cleanup
        const rawCpf = member.cpf || "";
        const cleanCpf = rawCpf.replace(/\D/g, "");
        if (cleanCpf && rawCpf !== cleanCpf && cleanCpf.length === 11) {
          // We keep the mask for display but ensure it is stored normalized if possible
          // Actually, let's just make sure it exists
        }

        const correctLoja = getLojaNameByCIM(member.cim);
        if (
          member.loja !== correctLoja &&
          member.role !== "admin" &&
          member.role !== "gestor"
        ) {
          updates.loja = correctLoja;
          needsUpdate = true;
        }

        if (
          member.rito !== "Emulação" &&
          member.role !== "admin" &&
          member.role !== "gestor"
        ) {
          updates.rito = "Emulação";
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateDoc(doc(db, "users", member.id), {
            ...updates,
            updatedAt: serverTimestamp(),
          });
          correctionCount++;
        }
      }

      if (!silent) {
        alert(
          `Processamento Finalizado!\n- Registros Órfãos Deletados: ${orphanCount}\n- Duplicatas Removidas: ${dedupeCount}\n- Dados Padronizados: ${correctionCount}`,
        );
      }

      await loadMembers();
    } catch (err: any) {
      console.error("Erro na correção/deduplicação global:", err);
      if (!silent) alert("Erro: " + err.message);
    } finally {
      if (!silent) setLoadingMembers(false);
    }
  };

  const handleNuclearReset = async () => {
    if (resetConfirmText !== "LIBERAR") {
      alert(
        "Para confirmar, digite exatamente a palavra LIBERAR (em maiúsculas).",
      );
      return;
    }

    setIsResetting(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      let deleted = 0;
      const protectedEmails = [
        "gomau.ead@gmail.com",
        "calepi@gmail.com",
        "calepe@gmail.com",
      ];

      for (const d of snap.docs) {
        const data = d.data();
        const email = (data.email || "").toLowerCase().trim();

        if (!protectedEmails.includes(email)) {
          await deleteDoc(doc(db, "users", d.id));
          deleted++;
        }
      }

      alert(
        `ZERAGEM CONCLUÍDA!\n\n- ${deleted} registros de membros foram removidos.\n- Os e-mails administradores foram preservados.\n- Agora você pode importar a nova planilha sem conflitos.`,
      );
      setShowResetModal(false);
      setResetConfirmText("");
    } catch (err: any) {
      console.error("Erro no Nuclear Reset:", err);
      alert("Erro ao zerar base: " + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const loadCourses = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "courses"), orderBy("createdAt", "desc")),
      );
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingCourse) return;
    setSubmittingCourse(true);
    try {
      await addDoc(collection(db, "courses"), {
        ...newCourse,
        createdAt: serverTimestamp(),
      });
      setShowAddCourse(false);
      setNewCourse({
        titulo: "",
        descricao: "",
        cargaHoraria: "",
        grade: "",
        elegibilidade: "",
        registrationUrl: "",
        status: "aberto",
      });
      await loadCourses();
      console.log("Curso adicionado com sucesso");
    } catch (err: any) {
      console.error("Erro ao adicionar curso:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, "courses");
      } catch (e) {}
    } finally {
      setSubmittingCourse(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      await deleteDoc(doc(db, "courses", id));
      loadCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const loadEvents = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "events"), orderBy("data", "asc")),
      );
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const [showAddMember, setShowAddMember] = useState(false);
  const [showSmartPaste, setShowSmartPaste] = useState(false);
  const [smartPasteText, setSmartPasteText] = useState("");
  const [isProcessingSmartPaste, setIsProcessingSmartPaste] = useState(false);
  const [newMemberManual, setNewMemberManual] = useState({
    nome: "",
    email: "",
    grau: "Aprendiz",
    cargo: "Aspirante",
    cim: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    cidade: "",
    uf: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    estadoCivil: "Cidado/a",
    esposa: "",
    emergencia: "",
    foneEmergencia: "",
    qtdFilhos: "0",
  });
  const [submittingMember, setSubmittingMember] = useState(false);
  const [submittingEvent, setSubmittingEvent] = useState(false);

  const handleSmartPaste = async () => {
    if (!smartPasteText.trim()) return;
    setIsProcessingSmartPaste(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extraia os dados deste membro maçônico do texto abaixo e retorne APENAS um JSON válido seguindo estritamente o esquema.
            Texto: "${smartPasteText}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nome: { type: Type.STRING },
              email: { type: Type.STRING },
              cpf: { type: Type.STRING },
              dataNascimento: {
                type: Type.STRING,
                description: "Data no formato YYYY-MM-DD",
              },
              telefone: { type: Type.STRING },
              cidade: { type: Type.STRING },
              uf: { type: Type.STRING },
              cep: { type: Type.STRING },
              rua: { type: Type.STRING },
              numero: { type: Type.STRING },
              bairro: { type: Type.STRING },
              esposa: { type: Type.STRING },
              emergencia: { type: Type.STRING },
              foneEmergencia: { type: Type.STRING },
              qtdFilhos: { type: Type.STRING },
              estadoCivil: { type: Type.STRING },
            },
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error("Resposta vazia da IA");
      const data = JSON.parse(text);

      // Formatar dados recebidos
      setNewMemberManual((prev) => ({
        ...prev,
        ...data,
        nome: data.nome || prev.nome,
        cpf: data.cpf ? maskCPF(data.cpf) : prev.cpf,
        telefone: data.telefone ? maskPhone(data.telefone) : prev.telefone,
        cep: data.cep ? maskCEP(data.cep) : prev.cep,
        uf: (data.uf || "").toUpperCase().substring(0, 2),
        qtdFilhos: String(data.qtdFilhos || "0"),
        estadoCivil: [
          "Solteiro/a",
          "Casado/a",
          "Viúvo/a",
          "Divorciado/a",
        ].includes(data.estadoCivil)
          ? data.estadoCivil
          : prev.estadoCivil,
      }));

      setShowSmartPaste(false);
      setSmartPasteText("");
      alert(
        "Dados processados e preenchidos via IA! Por favor, revise antes de salvar.",
      );
    } catch (err) {
      console.error("Erro no Smart Paste:", err);
      alert(
        "Não foi possível processar o texto automaticamente. Tente colar os dados com mais clareza ou preencha manualmente.",
      );
    } finally {
      setIsProcessingSmartPaste(false);
    }
  };

  const handleAddMemberManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberManual.email || submittingMember) return;
    setSubmittingMember(true);
    try {
      const targetEmail = newMemberManual.email.toLowerCase().trim();
      const cleanCPF = newMemberManual.cpf.replace(/\D/g, "");

      // BUSCA CRÍTICA: Verifica se o membro já existe por e-mail ou CPF no estado local
      // Isso evita criar duplicatas se o usuário já tiver um registro por UID (ex: já logou)
      const existing = members.find(
        (m) =>
          m.email?.toLowerCase() === targetEmail ||
          m.emailVinculado?.toLowerCase() === targetEmail ||
          (m.cpf && m.cpf.replace(/\D/g, "") === cleanCPF && cleanCPF !== ""),
      );

      let docId = targetEmail;
      if (existing && existing.id) {
        console.log(
          "Membro existente encontrado. Atualizando ID:",
          existing.id,
        );
        docId = existing.id;
      }

      const userRef = doc(db, "users", docId);

      await setDoc(
        userRef,
        {
          ...newMemberManual,
          // Se já existir, NÃO sobrescrever campos fixos como role ou dataCadastro se já tiverem valor
          role: existing?.role || "membro",
          email: targetEmail,
          loja: getLojaNameByCIM(newMemberManual.cim),
          rito: "Emulação",
          status: existing?.status || "Ativo",
          dataCadastro:
            existing?.dataCadastro || new Date().toISOString().split("T")[0],
          updatedAt: serverTimestamp(),
          // Preserva o createdAt original se existir
          createdAt: existing?.createdAt || serverTimestamp(),
        },
        { merge: true },
      );

      setShowAddMember(false);
      setNewMemberManual({
        nome: "",
        email: "",
        grau: "Aprendiz",
        cargo: "Aspirante",
        cim: "",
        cpf: "",
        dataNascimento: "",
        telefone: "",
        cidade: "",
        uf: "",
        cep: "",
        rua: "",
        numero: "",
        bairro: "",
        estadoCivil: "Casado/a",
        esposa: "",
        emergencia: "",
        foneEmergencia: "",
        qtdFilhos: "0",
      });
      await loadMembers();
      alert(
        existing
          ? "Dados do membro atualizados com sucesso!"
          : "Membro adicionado com sucesso!",
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar membro.");
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingEvent) return;
    setSubmittingEvent(true);
    try {
      await addDoc(collection(db, "events"), {
        titulo: newEvent.titulo,
        data: newEvent.data,
        hora: newEvent.hora,
        local: newEvent.local,
        grauMinimo: newEvent.grauMinimo,
        descricao: newEvent.descricao,
        generateMinutes: newEvent.generateMinutes,
        status: "ativo",
        createdAt: serverTimestamp(),
      });
      setShowAddEvent(false);
      setNewEvent({
        titulo: "",
        data: "",
        hora: "",
        local: "",
        grauMinimo: "Aprendiz",
        descricao: "",
        generateMinutes: true,
        status: "ativo",
      });
      await loadEvents();
      console.log("Evento adicionado");
    } catch (err: any) {
      console.error("Erro ao adicionar evento:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, "events");
      } catch (e) {}
    } finally {
      setSubmittingEvent(false);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || submittingEvent) return;
    setSubmittingEvent(true);
    try {
      await updateDoc(doc(db, "events", editingEvent.id), {
        titulo: editingEvent.titulo,
        data: editingEvent.data,
        hora: editingEvent.hora,
        local: editingEvent.local,
        grauMinimo: editingEvent.grauMinimo,
        descricao: editingEvent.descricao,
        generateMinutes:
          editingEvent.generateMinutes !== undefined
            ? editingEvent.generateMinutes
            : true,
        status: editingEvent.status || "ativo",
        updatedAt: serverTimestamp(),
      });
      setEditingEvent(null);
      await loadEvents();
      console.log("Evento atualizado");
    } catch (err: any) {
      console.error("Erro ao atualizar evento:", err);
      try {
        handleFirestoreError(
          err,
          OperationType.WRITE,
          `events/${editingEvent.id}`,
        );
      } catch (e) {}
    } finally {
      setSubmittingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, "events", id));
      // Remove do estado local imediatamente para feedback visual instantâneo
      setEvents((prev) => prev.filter((e) => e.id !== id));
      console.log("Evento removido com sucesso");
    } catch (err) {
      console.error("Erro ao deletar evento:", err);
      alert("Erro ao excluir evento. Verifique as permissões.");
    }
  };

  const loadContents = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "contents"), orderBy("createdAt", "desc")),
      );
      setContents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const loadRequests = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "requests"), where("status", "==", "pendente")),
      );
      let data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      if (isRestrictedFaltas) {
        data = data.filter((d) => d.tipo === "Justificativa de Falta");
      }
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.url) {
      alert("Por favor, informe a URL do material.");
      return;
    }
    setSubmittingContent(true);
    try {
      if (editingContent) {
        await updateDoc(doc(db, "contents", editingContent.id), {
          titulo: newContent.titulo,
          tipo: newContent.tipo,
          grauMinimo: newContent.grauMinimo,
          descricao: newContent.descricao,
          fileUrl: newContent.url,
        });
        setEditingContent(null);
      } else {
        await addDoc(collection(db, "contents"), {
          titulo: newContent.titulo,
          tipo: newContent.tipo,
          grauMinimo: newContent.grauMinimo,
          obrigatorio: true,
          descricao: newContent.descricao,
          fileUrl: newContent.url,
          fileName: "Link Externo",
          createdAt: serverTimestamp(),
        });
      }

      setShowAddContent(false);
      setNewContent({
        titulo: "",
        tipo: "video",
        grauMinimo: "Aprendiz",
        descricao: "",
        url: "",
      });
      await loadContents();
      console.log("Conteúdo salvo");
    } catch (err: any) {
      console.error("Erro ao adicionar conteúdo:", err);
      alert("Erro ao subir arquivo: " + (err.message || "Erro desconhecido"));
      try {
        handleFirestoreError(err, OperationType.WRITE, "contents");
      } catch (e) {}
    } finally {
      setSubmittingContent(false);
    }
  };

  const handleDeleteContent = async (id: string) => {
    try {
      await deleteDoc(doc(db, "contents", id));
      loadContents();
    } catch (err) {
      console.error(err);
    }
  };

  const openEvaluateModal = (req: any) => {
    setEvaluatingRequest(req);
    setRequestComment("");
    setDecisionType(null);
  };

  const submitEvaluation = async (approved: boolean) => {
    if (!evaluatingRequest) return;
    const req = evaluatingRequest;

    if (!approved && !requestComment.trim()) {
      alert("O comentário é obrigatório em caso de rejeição.");
      return;
    }

    try {
      const status = approved ? "aprovado" : "rejeitado";
      // Add comentarioGestor field and analisadoEm timestamp
      await updateDoc(doc(db, "requests", req.id), {
        status,
        comentarioGestor: requestComment || null,
        analisadoEm: serverTimestamp(),
        dataResposta: new Date().toLocaleDateString("pt-br"),
        horaResposta: new Date().toLocaleTimeString("pt-br", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      await addDoc(collection(db, "history"), {
        userId: req.userId,
        titulo:
          req.tipo === "Prancha (Resumo/Estudo)"
            ? approved
              ? "Prancha Aprovada"
              : "Prancha Rejeitada"
            : approved
              ? "Solicitação Aprovada"
              : "Solicitação Rejeitada",
        descricao: `A solicitação "${req.descricao || req.tipo}" foi ${approved ? "aprovada" : "rejeitada"} pelo Gestor.`,
        data: new Date().toLocaleDateString("pt-br"),
        hora: new Date().toLocaleTimeString("pt-br", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        autor: "Gestor",
        tipo: "atividade",
        criadoEm: serverTimestamp(),
      });

      loadRequests();
      setEvaluatingRequest(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar solicitação.");
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <header className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-[#1e293b]/50 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#D4AF37] uppercase tracking-wider mb-1 truncate">
            Painel Master
          </h1>
          <p className="text-gray-400 text-xs tracking-wide">
            Controle unificado da plataforma maçônica
          </p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="lg:w-64 shrink-0 flex flex-col gap-1.5 p-3 rounded-xl bg-[#0A0E1A]/50 border border-[#1e293b] h-fit">
          <h3 className="text-[10px] uppercase font-bold text-gray-500 mb-2 px-3 tracking-widest">
            Navegação
          </h3>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-3 flex items-center gap-3 font-semibold text-xs uppercase tracking-wider rounded-lg transition-all w-full text-left font-sans outline-none",
                activeTab === tab.id
                  ? "bg-[#D4AF37] text-black shadow-md border border-[#D4AF37]"
                  : "text-gray-400 hover:bg-[#1e293b] border border-transparent hover:border-[#334155]",
              )}
            >
              <tab.icon
                size={16}
                className={
                  activeTab === tab.id
                    ? "text-black"
                    : "text-[#D4AF37]/70 shrink-0"
                }
              />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0 bg-[#0F172A] border border-[#1e293b] rounded-xl p-4 sm:p-8 min-h-[500px] shadow-xl">
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-medium text-gray-200">
                    Resumo da Oficina
                  </h2>
                  <p className="text-xs text-gray-500">
                    Métricas em tempo real e atividade dos membros
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-[#0A0E1A] px-3 py-1 rounded-full border border-[#1e293b]">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Sincronizado: {lastRefresh.toLocaleTimeString("pt-br")}
                </div>
              </div>

              {/* Estatísticas de Membros - DESTAQUE NO DASHBOARD */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div
                  onClick={() => {
                    setActiveTab("membros");
                    setMemberFilter("all");
                  }}
                  className="bg-[#0A0E1A] border border-[#1e293b] p-4 rounded-xl shadow-lg hover:border-[#D4AF37]/40 transition-all cursor-pointer group"
                >
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1 group-hover:text-[#D4AF37]">
                    Total de Obreiros
                  </p>
                  <p className="text-2xl font-bold text-[#D4AF37]">
                    {members.length}
                  </p>
                </div>

                <div className="bg-[#0A0E1A] border border-[#1e293b] p-4 rounded-xl shadow-lg relative group">
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">
                    Membros Validados
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-gray-200">
                      {excelEmails.size}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadExcelEmails(true);
                      }}
                      className="p-1.5 text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                      title="Recarregar validados.xlsx agora"
                    >
                      <RefreshCw
                        size={14}
                        className={importing ? "animate-spin" : ""}
                      />
                    </button>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setActiveTab("membros");
                    setMemberFilter("no-uid");
                  }}
                  className="bg-[#0A0E1A] border border-[#1e293b] p-4 rounded-xl shadow-lg hover:border-orange-500/40 cursor-pointer transition-all group"
                >
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1 group-hover:text-orange-500 font-bold transition-all">
                    Aguardando 1º Acesso
                  </p>
                  <p className="text-2xl font-bold text-orange-500">
                    {members.filter((m) => !m.uid).length}
                  </p>
                </div>
                <div
                  onClick={() => {
                    setActiveTab("membros");
                    setMemberFilter("Aprendiz");
                  }}
                  className="bg-[#0A0E1A] border border-[#1e293b] p-4 rounded-xl shadow-lg hover:border-[#D4AF37]/20 cursor-pointer transition-all group"
                >
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1 group-hover:text-white transition-all">
                    Aprendizes
                  </p>
                  <p className="text-2xl font-bold text-gray-200">
                    {members.filter((m) => m.grau === "Aprendiz").length}
                  </p>
                </div>
                <div
                  onClick={() => {
                    setActiveTab("membros");
                    setMemberFilter("Companheiro");
                  }}
                  className="bg-[#0A0E1A] border border-[#1e293b] p-4 rounded-xl shadow-lg hover:border-[#D4AF37]/20 cursor-pointer transition-all group"
                >
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1 group-hover:text-white transition-all">
                    Companheiros
                  </p>
                  <p className="text-2xl font-bold text-gray-200">
                    {members.filter((m) => m.grau === "Companheiro").length}
                  </p>
                </div>
                <div
                  onClick={() => {
                    setActiveTab("membros");
                    setMemberFilter("Mestre");
                  }}
                  className="bg-[#0A0E1A] border border-[#1e293b] p-4 rounded-xl shadow-lg hover:border-[#D4AF37]/40 cursor-pointer transition-all group"
                >
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1 group-hover:text-[#D4AF37] transition-all">
                    Mestres
                  </p>
                  <p className="text-2xl font-bold text-[#D4AF37]">
                    {members.filter((m) => m.grau === "Mestre").length}
                  </p>
                </div>
              </div>

              {/* News / Alerts Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-xl p-6">
                  <h3 className="text-[#D4AF37] font-medium mb-4 flex items-center gap-2">
                    <CheckCircle size={18} /> Aprovações Pendentes
                  </h3>
                  {requests.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      Nenhuma solicitação aguardando sua análise.
                    </p>
                  ) : (
                    <button
                      onClick={() => setActiveTab("solicitacoes")}
                      className="w-full bg-[#1e293b] p-4 rounded-lg flex justify-between items-center hover:bg-[#283548] transition-colors"
                    >
                      <span className="text-sm text-white">
                        Você possui {requests.length} solicitações para revisar
                      </span>
                      <ArrowRight size={16} className="text-[#D4AF37]" />
                    </button>
                  )}
                </div>

                <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-xl p-6">
                  <h3 className="text-[#D4AF37] font-medium mb-4 flex items-center gap-2">
                    <Calendar size={18} /> Próximos Eventos
                  </h3>
                  {events.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      Nenhum evento agendado em breve.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {events.slice(0, 2).map((ev: any) => (
                        <div
                          key={ev.id}
                          className="text-xs text-gray-300 flex justify-between border-b border-[#1e293b] pb-2"
                        >
                          <span>{ev.titulo}</span>
                          <span className="text-gray-500">{ev.data}</span>
                        </div>
                      ))}
                      <button
                        onClick={() => setActiveTab("eventos")}
                        className="text-[10px] text-[#D4AF37] hover:underline uppercase font-bold"
                      >
                        Ver agenda completa
                      </button>
                    </div>
                  )}
                </div>

                {/* Últimos Acessos */}
                <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-xl p-6">
                  <h3 className="text-[#D4AF37] font-medium mb-4 flex items-center gap-2">
                    <Users size={18} /> Acessaram Hoje
                  </h3>
                  {acessosHojeList.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      Nenhum irmão acessou a ferramenta hoje ainda. O registro
                      reinicia à meia-noite automaticamente.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {acessosHojeList.map((log: any) => (
                        <div
                          key={log.id}
                          className="text-xs flex justify-between border-b border-[#1e293b] pb-2 items-center"
                        >
                          <div className="flex flex-col">
                            <span className="text-gray-300 font-medium">
                              {log.nome || log.email || "Desconhecido"}
                            </span>
                            {log.cim && (
                              <span className="text-gray-600 text-[9px]">
                                CIM: {log.cim}
                              </span>
                            )}
                          </div>
                          <span className="text-gray-500 text-[10px]">
                            {(() => {
                              let dateObj = null;
                              if (log.timestamp?.toDate) {
                                dateObj = log.timestamp.toDate();
                              } else if (log.timestamp instanceof Date) {
                                dateObj = log.timestamp;
                              } else if (
                                typeof log.timestamp === "string" ||
                                typeof log.timestamp === "number"
                              ) {
                                dateObj = new Date(log.timestamp);
                              } else if (log.timestamp?.seconds) {
                                dateObj = new Date(
                                  log.timestamp.seconds * 1000,
                                );
                              }

                              if (!dateObj || isNaN(dateObj.getTime()))
                                return "Data recente";

                              return `Entrou ${dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
                            })()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "membros" &&
            (() => {
              const handleSort = (
                field: "nome" | "cim" | "masonic" | "status",
              ) => {
                if (memberSortField === field) {
                  setMemberSortDirection(
                    memberSortDirection === "asc" ? "desc" : "asc",
                  );
                } else {
                  setMemberSortField(field);
                  setMemberSortDirection("asc");
                }
              };

              const renderSortIndicator = (
                field: "nome" | "cim" | "masonic" | "status",
              ) => {
                if (memberSortField !== field)
                  return (
                    <span className="text-gray-600 ml-1 font-mono text-[9px] select-none">
                      ⇅
                    </span>
                  );
                return memberSortDirection === "asc" ? (
                  <span className="text-[#D4AF37] ml-1 font-mono text-[9px] select-none">
                    ▲
                  </span>
                ) : (
                  <span className="text-[#D4AF37] ml-1 font-mono text-[9px] select-none">
                    ▼
                  </span>
                );
              };

              const filteredMembers = members.filter((m) => {
                const matchesSearch =
                  (m.nome || "")
                    .toLowerCase()
                    .includes(memberSearch.toLowerCase()) ||
                  (m.email || "")
                    .toLowerCase()
                    .includes(memberSearch.toLowerCase()) ||
                  (m.cim || "")
                    .toLowerCase()
                    .includes(memberSearch.toLowerCase()) ||
                  (m.cpf || "").includes(memberSearch);

                if (!matchesSearch) return false;

                if (memberFilter === "all") return true;
                if (memberFilter === "no-uid") return !m.uid;
                if (memberFilter === "Aprendiz") return m.grau === "Aprendiz";
                if (memberFilter === "Companheiro")
                  return m.grau === "Companheiro";
                if (memberFilter === "Mestre")
                  return m.grau === "Mestre" || m.grau === "Mestre Instalado";

                return true;
              });

              // Apply sorting on filteredMembers
              filteredMembers.sort((a, b) => {
                let valA = "";
                let valB = "";

                if (memberSortField === "nome") {
                  valA = (a.nome || "").toLowerCase().trim();
                  valB = (b.nome || "").toLowerCase().trim();
                } else if (memberSortField === "cim") {
                  const cimA = String(a.cim || a.CIM || "").trim();
                  const cimB = String(b.cim || b.CIM || "").trim();
                  const comp = cimA.localeCompare(cimB, undefined, {
                    numeric: true,
                    sensitivity: "base",
                  });
                  return memberSortDirection === "asc" ? comp : -comp;
                } else if (memberSortField === "masonic") {
                  valA = ((a.grau || "") + " " + (a.loja || ""))
                    .toLowerCase()
                    .trim();
                  valB = ((b.grau || "") + " " + (b.loja || ""))
                    .toLowerCase()
                    .trim();
                } else if (memberSortField === "status") {
                  valA = (a.status || "").toLowerCase().trim();
                  valB = (b.status || "").toLowerCase().trim();
                }

                const compStr = valA.localeCompare(valB, undefined, {
                  sensitivity: "base",
                });
                return memberSortDirection === "asc" ? compStr : -compStr;
              });

              return (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-xl font-medium text-gray-200">
                        Gerenciamento de Membros
                      </h2>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        Listagem e controle de acesso
                        <span className="text-[#D4AF37] font-bold">
                          ({filteredMembers.length} IIr∴)
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:flex-none">
                        <input
                          type="text"
                          placeholder="Buscar Ir∴..."
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          className="w-full sm:w-64 bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-4 py-2 text-xs text-white focus:border-[#D4AF37]/50 outline-none transition-all pr-10"
                        />
                        {memberSearch && (
                          <button
                            onClick={() => setMemberSearch("")}
                            className="absolute right-2 top-1.5 p-1 text-gray-500 hover:text-white"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <select
                        value={memberFilter}
                        onChange={(e) => setMemberFilter(e.target.value)}
                        className="bg-[#0A0E1A] border border-[#1e293b] text-gray-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#D4AF37]/50 transition-all font-medium"
                      >
                        <option value="all">Todos</option>
                        <option value="no-uid">Aguardando 1º Acesso</option>
                        <option value="Aprendiz">Aprendizes</option>
                        <option value="Companheiro">Companheiros</option>
                        <option value="Mestre">Mestres</option>
                      </select>

                      <button
                        onClick={() => {
                          loadExcelEmails();
                          alert(
                            "Referência validados.xlsx recarregada com sucesso.",
                          );
                        }}
                        className="bg-[#1e293b] text-gray-300 border border-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium hover:bg-gray-800 transition-all flex-1 sm:flex-none justify-center"
                        title="Recarrega apenas a lista de emails para comparação (bolinha vermelha)"
                      >
                        <RefreshCw size={14} />
                        Referência
                      </button>
                      <button
                        onClick={() => handleGlobalCorrection(false)}
                        disabled={loadingMembers}
                        className="bg-[#1e293b] text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium hover:bg-[#D4AF37]/10 transition-all disabled:opacity-50 flex-1 sm:flex-none justify-center"
                        title="Corrige o acesso dos membros: Padroniza e-mails para minúsculo, remove duplicatas e resolve o erro 'E-mail não encontrado'."
                      >
                        {loadingMembers ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Settings size={14} />
                        )}
                        Sincronizar
                      </button>
                      <button
                        onClick={() => setShowImportOptionsModal(true)}
                        disabled={importing}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all disabled:opacity-50 flex-1 sm:flex-none justify-center cursor-pointer"
                        title="Importar lista de obreiros via excel (.xlsx)"
                      >
                        {importing ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <FileSpreadsheet size={14} />
                        )}
                        {importing ? "..." : "Excel"}
                      </button>
                      <button
                        onClick={() => scanInconsistencies()}
                        className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all flex-1 sm:flex-none justify-center cursor-pointer"
                        title="Varrer e mostrar inconsistências no cadastro de membros"
                      >
                        <AlertTriangle size={14} />
                        Inconsistências
                      </button>
                      <button
                        onClick={() => setShowExportModal(true)}
                        className="bg-[#D4AF37]/15 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/40 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all flex-1 sm:flex-none justify-center cursor-pointer"
                        title="Exportar base de membros por filtro de grau"
                      >
                        <Download size={14} />
                        Exportar
                      </button>
                      <input
                        type="file"
                        ref={excelFileInputRef}
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleLocalFileChange}
                      />
                      {isOwner && (
                        <button
                          onClick={() => setShowResetModal(true)}
                          className="bg-red-500/10 text-red-500 border border-red-500/30 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 flex-1 sm:flex-none justify-center"
                          title="Zerar base de dados (Exclui todos os membros exceto administradores mestres)"
                        >
                          <Trash2 size={14} />
                          Zerar
                        </button>
                      )}
                      <button
                        onClick={() => {
                          let nextCimNumeric = 1;
                          if (members.length > 0) {
                            const validCims = members
                              .map((m) =>
                                parseInt((m.cim || "").replace(/\D/g, ""), 10),
                              )
                              .filter((n) => !isNaN(n));
                            if (validCims.length > 0) {
                              nextCimNumeric = Math.max(...validCims) + 1;
                            }
                          }
                          setNewMemberManual((prev) => ({
                            ...prev,
                            cim: nextCimNumeric.toString(),
                          }));
                          setShowAddMember(true);
                        }}
                        className="bg-[#D4AF37] hover:scale-105 text-black px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all w-full sm:w-auto justify-center shadow-lg shadow-[#D4AF37]/20"
                      >
                        <Plus size={16} /> Novo Ir∴
                      </button>
                    </div>
                  </div>

                  {/* Import Excel Options Modal */}
                  {showImportOptionsModal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                      <div className="bg-[#1e293b] border border-[#D4AF37]/30 rounded-2xl max-w-sm w-full p-6 shadow-[0_0_50px_rgba(212,175,55,0.15)] animate-in zoom-in duration-300">
                        <div className="flex flex-col items-center text-center gap-3 mb-6">
                          <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37]">
                            <FileSpreadsheet size={32} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                              Importação de Membros
                            </h3>
                            <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest mt-1">
                              Escolha o Método de Importação
                            </p>
                          </div>
                        </div>

                        <p className="text-gray-300 mb-6 text-xs text-center leading-relaxed">
                          Sincronize a base de dados com a planilha de membros. Escolha fazer o upload do seu computador ou usar o arquivo de referência do servidor.
                        </p>

                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => {
                              excelFileInputRef.current?.click();
                            }}
                            className="w-full py-3.5 rounded-lg bg-green-600 font-bold hover:bg-green-700 hover:scale-[1.01] text-white transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                          >
                            <Upload size={16} />
                            FAZER UPLOAD DO COMPUTADOR
                          </button>

                          <button
                            onClick={async () => {
                              setShowImportOptionsModal(false);
                              await handleImportExcel();
                            }}
                            className="w-full py-3.5 rounded-lg bg-[#0A0E1A]/80 border border-[#D4AF37]/20 font-bold hover:bg-[#D4AF37]/10 hover:scale-[1.01] text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                          >
                            <Download size={16} className="text-[#D4AF37]" />
                            CONECTAR PLANILHA DO SERVIDOR
                          </button>

                          <button
                            onClick={() => setShowImportOptionsModal(false)}
                            className="w-full py-2 rounded-lg bg-transparent text-gray-400 hover:text-white transition-all text-xs mt-1"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Export Excel Modal */}
                  {showExportModal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                      <div className="bg-[#1e293b] border border-[#D4AF37]/40 rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(212,175,55,0.25)] animate-in zoom-in duration-300">
                        <div className="flex flex-col items-center text-center gap-3 mb-6">
                          <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37]">
                            <Download size={32} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                              Exportação de Dados
                            </h3>
                            <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest mt-1">
                              Gerar Planilha Oficial de Obreiros
                            </p>
                          </div>
                        </div>

                        <p className="text-gray-300 mb-6 text-xs text-center leading-relaxed font-medium">
                          Selecione o filtro de grau para exportar as fichas cadastrais completas no formato XLSX.
                        </p>

                        <div className="space-y-4 mb-6">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                              Filtro por Grau Maçônico
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: "all", label: "Todos", count: members.length },
                                { id: "Aprendiz", label: "Aprendizes", count: members.filter(m => m.grau === "Aprendiz").length },
                                { id: "Companheiro", label: "Companheiros", count: members.filter(m => m.grau === "Companheiro").length },
                                { id: "Mestre", label: "Mestres", count: members.filter(m => m.grau === "Mestre" || m.grau === "Mestre Instalado").length }
                              ].map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setExportDegreeFilter(opt.id)}
                                  className={cn(
                                    "p-3 rounded-lg border text-left transition-all flex flex-col justify-between h-20 outline-none cursor-pointer",
                                    exportDegreeFilter === opt.id
                                      ? "bg-[#D4AF37]/20 border-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/5"
                                      : "bg-[#0A0E1A]/60 border-[#1e293b] text-gray-400 hover:border-gray-700 hover:text-white"
                                  )}
                                >
                                  <span className="text-xs font-bold block">{opt.label}</span>
                                  <span className="text-[10px] opacity-75 mt-1 font-mono">({opt.count} Ir∴)</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="bg-[#0A0E1A]/80 border border-[#1e293b] rounded-xl p-4">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full inline-block"></span>
                              Colunas Incluídas na Planilha:
                            </h4>
                            <p className="text-[11px] text-gray-400 leading-relaxed font-light">
                              Nome Completo, Número do CIM, Grau Maçônico, CPF, Data de Nascimento, Telefone de Contato, Endereço Completo (Rua, Número, Complemento, Bairro, Cidade, Estado, CEP), E-mail, Cargo, Estado Civil, Esposa, Contatos de Emergência e Quantidade de Filhos.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowExportModal(false)}
                            className="flex-1 py-3 bg-transparent text-gray-400 hover:text-white hover:bg-white/5 font-bold rounded-lg transition-all text-xs border border-[#1e293b] cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleExportMembers}
                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 hover:scale-[1.02] text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                          >
                            <FileSpreadsheet size={16} />
                            BAIXAR PLANILHA
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inconsistencies Modal */}
                  {showInconsistenciesModal && inconsistencies && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                      <div className="bg-[#1e293b] border border-[#D4AF37]/40 rounded-2xl max-w-3xl w-full p-6 shadow-[0_0_50px_rgba(212,175,55,0.25)] flex flex-col max-h-[85vh] animate-in zoom-in duration-300">
                        <div className="flex flex-col items-center text-center gap-3 mb-6 shrink-0">
                          <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-500">
                            <AlertTriangle size={32} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                              Relatório de Inconsistências
                            </h3>
                            <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                              {inconsistencies.length} Membro(s) com pendências
                            </p>
                          </div>
                        </div>

                        <div className="overflow-y-auto pr-2 space-y-4 mb-6 custom-scrollbar">
                          {inconsistencies.length === 0 ? (
                            <div className="text-center text-gray-400 p-8 border border-[#1e293b] rounded-xl bg-black/30">
                              <p className="text-sm font-medium">Nenhuma inconsistência encontrada!</p>
                              <p className="text-xs mt-1">Todos os cadastros estão corretos e alinhados.</p>
                            </div>
                          ) : (
                            inconsistencies.map((inc, i) => (
                              <div key={i} className="bg-[#0A0E1A]/80 border border-[#1e293b] p-4 rounded-xl hover:border-red-500/30 transition-colors">
                                <div className="flex items-center justify-between mb-3 border-b border-[#1e293b] pb-2">
                                  <h4 className="font-bold text-white text-sm">{inc.member.nome || "Membro sem nome"}</h4>
                                  <span className="text-[10px] font-mono text-gray-500 bg-[#1e293b]/50 px-2 py-1 rounded">
                                    CIM: {inc.member.cim || "N/A"}
                                  </span>
                                </div>
                                <ul className="space-y-1.5">
                                  {inc.issues.map((issue, j) => (
                                    <li key={j} className="text-xs text-gray-300 flex items-start gap-2">
                                      <span className="text-red-500 mt-0.5">•</span>
                                      <span dangerouslySetInnerHTML={{ __html: issue.replace(/Loja divergente/g, '<strong class="text-red-400">Loja divergente</strong>') }}></span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex justify-between items-center shrink-0 pt-4 border-t border-[#1e293b]">
                          <button
                            onClick={() => setShowInconsistenciesModal(false)}
                            className="px-6 py-2 bg-[#1e293b] hover:bg-white/10 text-white font-bold rounded-lg transition-all border border-[#1e293b] cursor-pointer"
                          >
                            Fechar
                          </button>
                          
                          {inconsistencies.some(inc => inc.issues.some(i => i.includes("Loja divergente"))) && (
                            <button
                              onClick={autoFixLojas}
                              disabled={isFixingLojas}
                              className="px-6 py-2 bg-[#D4AF37] hover:scale-105 text-black font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                              title="Corrige automaticamente todas as Lojas divergentes com base no prefixo CIM"
                            >
                              {isFixingLojas ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" /> Corrigindo...
                                </>
                              ) : (
                                <>
                                  <AlertTriangle size={16} /> Corrigir Lojas
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reset Base Confirmation Modal */}
                  {showResetModal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                      <div className="bg-[#1e293b] border-2 border-red-500 rounded-2xl max-w-md w-full p-8 shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-in zoom-in duration-300">
                        <div className="flex flex-col items-center text-center gap-4 mb-8">
                          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
                            <AlertCircle size={40} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                              Ação Nuclear Digital
                            </h3>
                            <p className="text-red-400 text-xs font-bold uppercase tracking-widest mt-1">
                              Cuidado: Irreversível
                            </p>
                          </div>
                        </div>

                        <p className="text-gray-300 mb-8 text-sm text-center leading-relaxed font-medium">
                          Você está prestes a{" "}
                          <span className="text-white font-bold underline">
                            EXTERMINAR
                          </span>{" "}
                          todos os membros desta base de dados. Somente{" "}
                          <span className="text-[#D4AF37] font-bold">
                            GOMAU
                          </span>{" "}
                          e{" "}
                          <span className="text-[#D4AF37] font-bold">
                            CALEPI
                          </span>{" "}
                          sobreviverão.
                          <br />
                          <br />
                          Esta ação limpa o caminho para uma nova importação do
                          zero.
                        </p>

                        <div className="bg-black/40 p-5 rounded-xl mb-8 border border-white/5 space-y-3">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">
                            Digite o código de autorização:
                          </label>
                          <input
                            type="text"
                            value={resetConfirmText}
                            onChange={(e) =>
                              setResetConfirmText(e.target.value.toUpperCase())
                            }
                            placeholder="LIBERAR"
                            className="w-full bg-[#0A0E1A] border-2 border-red-500/30 rounded-lg px-4 py-3 text-white text-center font-black tracking-[0.3em] placeholder:text-gray-800 focus:outline-none focus:border-red-500 transition-all text-xl"
                          />
                        </div>

                        <div className="flex flex-col gap-3">
                          <button
                            onClick={handleNuclearReset}
                            disabled={
                              isResetting || resetConfirmText !== "LIBERAR"
                            }
                            className="w-full py-4 rounded-xl bg-red-600 text-white font-black hover:bg-red-700 transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 group"
                          >
                            {isResetting ? (
                              <Loader2 size={20} className="animate-spin" />
                            ) : (
                              <Trash2
                                size={20}
                                className="group-hover:scale-125 transition-transform"
                              />
                            )}
                            CONFIRMAR EXTERMÍNIO DE DADOS
                          </button>
                          <button
                            onClick={() => {
                              setShowResetModal(false);
                              setResetConfirmText("");
                            }}
                            className="w-full py-3 rounded-xl bg-transparent text-gray-400 font-bold hover:text-white transition-all text-sm"
                          >
                            Abortar Missão
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal para Adicionar Membro Manualmente */}
                  {showAddMember && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                      <div className="bg-[#0F172A] border border-[#D4AF37]/30 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-[#1e293b] flex justify-between items-center bg-[#111827]">
                          <div>
                            <h3 className="text-[#D4AF37] font-bold text-xl">
                              Adicionar Novo Membro
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-gray-500 text-xs text-nowrap">
                                Preencha todos os dados conforme a ficha de
                                cadastro
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowSmartPaste(!showSmartPaste)
                                }
                                className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-1 rounded border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition-all flex items-center gap-1 font-bold"
                              >
                                <UploadCloud size={12} />
                                IMPORTAÇÃO INTELIGENTE (COLAR TEXTO)
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowAddMember(false)}
                            className="text-gray-400 hover:text-white p-2"
                          >
                            ✕
                          </button>
                        </div>

                        <form
                          onSubmit={handleAddMemberManual}
                          className="p-6 overflow-y-auto space-y-8 flex-1"
                        >
                          {/* Area de Smart Paste */}
                          {showSmartPaste && (
                            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/30 p-4 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-4">
                              <div className="flex justify-between items-center">
                                <h5 className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">
                                  Colar Ficha de Cadastro (IA)
                                </h5>
                                <span className="text-gray-500 text-[9px]">
                                  Dica: Cole o texto do WhatsApp ou Ficha aqui.
                                </span>
                              </div>
                              <textarea
                                value={smartPasteText}
                                onChange={(e) =>
                                  setSmartPasteText(e.target.value)
                                }
                                placeholder="Ex: Nome: Fulano de Tal, CPF: 000.000... Endereço: Rua X, 123..."
                                className="w-full bg-[#0B0B0C] border border-[#D4AF37]/20 rounded-lg p-3 text-sm text-gray-300 h-24 focus:border-[#D4AF37]/50 outline-none transition-all"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowSmartPaste(false)}
                                  className="text-[10px] text-gray-500 hover:text-white px-3 py-1"
                                >
                                  Fechar
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSmartPaste}
                                  disabled={
                                    isProcessingSmartPaste ||
                                    !smartPasteText.trim()
                                  }
                                  className="bg-[#D4AF37] text-black text-[10px] font-bold px-4 py-1.5 rounded-lg flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                                >
                                  {isProcessingSmartPaste ? (
                                    <Loader2
                                      size={12}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <PlayCircle size={12} />
                                  )}
                                  PROCESSAR TEXTO E PREENCHER
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Seção 1: Dados Maçônicos */}
                          <div className="space-y-4">
                            <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                              Identificação Maçônica
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Nome Completo
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={newMemberManual.nome}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      nome: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="Nome do Ir∴"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  CIM (Registro)
                                </label>
                                <input
                                  type="text"
                                  value={newMemberManual.cim}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      cim: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="00.000"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  E-mail (Google)
                                </label>
                                <input
                                  type="email"
                                  required
                                  value={newMemberManual.email}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      email: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="email@gmail.com"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Grau
                                </label>
                                <select
                                  value={newMemberManual.grau}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      grau: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                >
                                  <option value="Aprendiz">Aprendiz</option>
                                  <option value="Companheiro">
                                    Companheiro
                                  </option>
                                  <option value="Mestre">Mestre</option>
                                  <option value="Mestre Instalado">
                                    Mestre Instalado
                                  </option>
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Cargo Atual
                                </label>
                                <input
                                  type="text"
                                  value={newMemberManual.cargo}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      cargo: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="Ex: Mestre de Cerimônias"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Seção 2: Dados Pessoais */}
                          <div className="space-y-4">
                            <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                              Dados Civis e Familiares
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  CPF
                                </label>
                                <input
                                  type="text"
                                  value={newMemberManual.cpf}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      cpf: maskCPF(e.target.value),
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="000.000.000-00"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Nascimento
                                </label>
                                <input
                                  type="date"
                                  value={newMemberManual.dataNascimento}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      dataNascimento: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Telefone
                                </label>
                                <input
                                  type="text"
                                  value={newMemberManual.telefone}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      telefone: maskPhone(e.target.value),
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="(00) 00000-0000"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Estado Civil
                                </label>
                                <select
                                  value={newMemberManual.estadoCivil}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      estadoCivil: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                >
                                  <option value="Solteiro/a">Solteiro/a</option>
                                  <option value="Casado/a">Casado/a</option>
                                  <option value="Viúvo/a">Viúvo/a</option>
                                  <option value="Divorciado/a">
                                    Divorciado/a
                                  </option>
                                </select>
                              </div>
                              <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Nome da Cunhada (Esposa)
                                </label>
                                <input
                                  type="text"
                                  value={newMemberManual.esposa}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      esposa: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="Nome da Esposa"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Qtd. de Filhos
                                </label>
                                <input
                                  type="number"
                                  value={newMemberManual.qtdFilhos}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      qtdFilhos: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  min="0"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Seção 3: Localização */}
                          <div className="space-y-4">
                            <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                              Endereço Residencial
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  CEP
                                </label>
                                <input
                                  type="text"
                                  value={newMemberManual.cep}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      cep: maskCEP(e.target.value),
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="00000-000"
                                />
                              </div>
                              <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Rua / Logradouro
                                </label>
                                <input
                                  type="text"
                                  value={newMemberManual.rua}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      rua: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="Nome da rua"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Número
                                </label>
                                <input
                                  type="text"
                                  value={newMemberManual.numero}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      numero: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="123"
                                />
                              </div>
                              <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Bairro
                                </label>
                                <input
                                  type="text"
                                  value={newMemberManual.bairro}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      bairro: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="Nome do bairro"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Cidade
                                </label>
                                <input
                                  type="text"
                                  value={newMemberManual.cidade}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      cidade: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="São Paulo"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  UF / Estado
                                </label>
                                <input
                                  type="text"
                                  maxLength={2}
                                  value={newMemberManual.uf}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      uf: e.target.value.toUpperCase(),
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white text-center"
                                  placeholder="SP"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Seção 4: Segurança e Emergência */}
                          <div className="space-y-4">
                            <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                              Contato de Emergência
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Nome do Contato
                                </label>
                                <input
                                  type="text"
                                  value={newMemberManual.emergencia}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      emergencia: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="Nome de quem avisar"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Telefone de Emergência
                                </label>
                                <input
                                  type="text"
                                  value={newMemberManual.foneEmergencia}
                                  onChange={(e) =>
                                    setNewMemberManual({
                                      ...newMemberManual,
                                      foneEmergencia: maskPhone(e.target.value),
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="(00) 00000-0000"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#1e293b] sticky bottom-0 bg-[#0F172A] pb-2">
                            <button
                              type="button"
                              onClick={() => setShowAddMember(false)}
                              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={submittingMember}
                              className="px-10 py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20"
                            >
                              {submittingMember ? (
                                <>
                                  <Loader2 className="animate-spin" size={18} />
                                  Processando...
                                </>
                              ) : (
                                "Salvar Cadastro Completo"
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Dashboard Statistics moved to Dashboard Tab */}

                  {/* Modal para Visualizar Ficha Completa */}
                  {viewingMember && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                      <div className="bg-[#0F172A] border border-[#D4AF37]/50 rounded-2xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col max-h-[95vh] animate-in zoom-in duration-300">
                        <div className="p-6 border-b border-[#1e293b] flex justify-between items-center bg-[#111827] relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent pointer-events-none" />
                          <div className="relative z-10">
                            <h3 className="text-[#D4AF37] font-bold text-xl flex items-center gap-2">
                              <Eye size={20} /> FICHA COMPLETA DO IRMÃO
                            </h3>
                            <p className="text-gray-500 text-xs mt-1">
                              Sincronizado com os registros da Loja
                            </p>
                          </div>
                          <button
                            onClick={() => setViewingMember(null)}
                            className="text-gray-400 hover:text-white p-2 relative z-10"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-10 flex-1">
                          {/* Cabeçalho de Identidade */}
                          <div className="flex flex-col md:flex-row gap-8 items-center border-b border-[#1e293b] pb-8">
                            <div className="w-32 h-32 rounded-2xl bg-[#0A0E1A] border-2 border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-4xl overflow-hidden shadow-lg shadow-black">
                              {viewingMember.photoUrl ||
                              viewingMember.photoURL ? (
                                <img
                                  src={
                                    viewingMember.photoUrl ||
                                    viewingMember.photoURL
                                  }
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                viewingMember.nome.charAt(0)
                              )}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                              <h2 className="text-3xl font-bold text-gray-100 mb-1">
                                {viewingMember.nome}
                              </h2>
                              <p className="text-[#D4AF37] font-medium tracking-widest uppercase text-xs mb-4">
                                {viewingMember.grau} |{" "}
                                {viewingMember.cargo || "Membro"}
                              </p>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-black/30 p-2 rounded-lg">
                                  <span className="block text-[9px] text-gray-500 uppercase font-bold">
                                    CIM
                                  </span>
                                  <span className="text-sm font-medium text-gray-300">
                                    {viewingMember.cim || "N/A"}
                                  </span>
                                </div>
                                <div className="bg-black/30 p-2 rounded-lg">
                                  <span className="block text-[9px] text-gray-500 uppercase font-bold">
                                    Loja
                                  </span>
                                  <span className="text-sm font-medium text-gray-300">
                                    {getLojaNameByCIM(viewingMember.cim)}
                                  </span>
                                </div>
                                <div className="bg-black/30 p-2 rounded-lg">
                                  <span className="block text-[9px] text-gray-500 uppercase font-bold">
                                    Iniciação
                                  </span>
                                  <span className="text-sm font-medium text-gray-300">
                                    {viewingMember.dataIniciacao || "---"}
                                  </span>
                                </div>
                                <div className="bg-black/30 p-2 rounded-lg">
                                  <span className="block text-[9px] text-gray-500 uppercase font-bold">
                                    Status
                                  </span>
                                  <span className="text-sm font-bold text-green-500">
                                    {viewingMember.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Coluna 1: Dados Pessoais */}
                            <div className="space-y-6">
                              <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <User size={14} /> Dados Pessoais
                              </h4>
                              <div className="space-y-4">
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-500 uppercase font-bold">
                                    CPF
                                  </span>
                                  <span className="text-gray-300 text-sm font-medium">
                                    {viewingMember.cpf || "---"}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-500 uppercase font-bold">
                                    Nascimento
                                  </span>
                                  <span className="text-gray-300 text-sm font-medium">
                                    {formatDateForDisplay(
                                      viewingMember.dataNascimento,
                                    )}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                                      Estado Civil
                                    </span>
                                    <span className="text-gray-300 text-sm font-medium">
                                      {viewingMember.estadoCivil || "---"}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                                      Contato
                                    </span>
                                    <span className="text-gray-300 text-sm font-medium">
                                      {viewingMember.telefone || "---"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-500 uppercase font-bold">
                                    Cônjuge (Esposa)
                                  </span>
                                  <span className="text-gray-300 text-sm font-medium">
                                    {viewingMember.esposa || "Não informada"}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-500 uppercase font-bold">
                                    E-mail de Acesso
                                  </span>
                                  <span className="text-gray-300 text-sm font-medium">
                                    {viewingMember.email}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-[#D4AF37] uppercase font-bold">
                                    Último Acesso
                                  </span>
                                  <span className="text-gray-300 text-sm font-medium">
                                    {viewingMemberLastAccess?.timestamp 
                                      ? new Date(
                                          viewingMemberLastAccess.timestamp.seconds * 1000 || 
                                          (viewingMemberLastAccess.timestamp.toDate && viewingMemberLastAccess.timestamp.toDate().getTime()) || 
                                          Date.now()
                                        ).toLocaleString('pt-BR') 
                                      : viewingMember.lastLogin 
                                        ? new Date(
                                            viewingMember.lastLogin.seconds * 1000 || 
                                            (viewingMember.lastLogin.toDate && viewingMember.lastLogin.toDate().getTime()) || 
                                            Date.now()
                                          ).toLocaleString('pt-BR')
                                        : "Nunca acessou"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Coluna 2: Localização e Família */}
                            <div className="space-y-6">
                              <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={14} /> Localização & Endereço
                              </h4>
                              <div className="bg-black/20 p-4 rounded-xl border border-[#1e293b] space-y-4">
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-500 font-bold uppercase">
                                    Logradouro
                                  </span>
                                  <span className="text-gray-300 text-sm">
                                    {viewingMember.rua || "---"}
                                    {viewingMember.numero
                                      ? `, ${viewingMember.numero}`
                                      : ""}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">
                                      Bairro
                                    </span>
                                    <span className="text-gray-300 text-sm">
                                      {viewingMember.bairro || "---"}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">
                                      CEP
                                    </span>
                                    <span className="text-gray-300 text-sm">
                                      {viewingMember.cep || "---"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-500 font-bold uppercase">
                                    Cidade/UF
                                  </span>
                                  <span className="text-gray-300 text-sm">
                                    {viewingMember.cidade
                                      ? `${viewingMember.cidade}/${viewingMember.uf}`
                                      : "---"}
                                  </span>
                                </div>
                              </div>

                              <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest flex items-center gap-2 pt-2">
                                <Award size={14} /> Dependentes (Filhos)
                              </h4>
                              <div className="space-y-2">
                                {!viewingMember.filhos ||
                                viewingMember.filhos.length === 0 ? (
                                  <p className="text-xs text-gray-500 italic">
                                    Nenhum filho cadastrado.
                                  </p>
                                ) : (
                                  viewingMember.filhos.map(
                                    (f: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex justify-between bg-black/40 p-2 rounded-lg border border-[#1e293b]"
                                      >
                                        <span className="text-xs text-gray-300">
                                          {f.nome}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                          {formatDateForDisplay(
                                            f.dataNascimento,
                                          )}
                                        </span>
                                      </div>
                                    ),
                                  )
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Condecorações do Membro */}
                          <div className="bg-[#0A0E1A] p-6 rounded-2xl border border-[#D4AF37]/20 mt-6">
                            <h4 className="text-base font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
                              <Award size={18} /> Condecorações do Ir∴
                            </h4>
                            {viewingMember.condecoracoes &&
                            viewingMember.condecoracoes.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {viewingMember.condecoracoes.map(
                                  (item: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"
                                    >
                                      🏅 {item} GOMAU
                                    </span>
                                  ),
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 italic">
                                Nenhuma condecoração atribuída ainda.
                              </span>
                            )}
                          </div>

                          {/* Histórico de Acessos */}
                          <div className="bg-[#0A0E1A] p-6 rounded-2xl border border-[#D4AF37]/20 mt-6">
                            <h4 className="text-base font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
                              <Key size={18} /> Histórico de Acessos Recentes
                            </h4>
                            {!viewingMemberLogs || viewingMemberLogs.length === 0 ? (
                              <p className="text-sm text-gray-500 italic">
                                Nenhum log de acesso recente encontrado para este Irmão.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {viewingMemberLogs.map((log: any, idx: number) => (
                                  <div
                                    key={log.id || idx}
                                    className="text-xs flex justify-between border-b border-[#1e293b] pb-2 items-center"
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-gray-300">
                                        {log.action || "Login realizado"}
                                      </span>
                                      <span className="text-gray-500 font-mono text-[10px]">
                                        {log.ip || "IP Oculto"}
                                      </span>
                                    </div>
                                    <span className="text-[#D4AF37] font-mono">
                                      {log.timestamp
                                        ? new Date(
                                            log.timestamp.seconds * 1000 ||
                                            (log.timestamp.toDate && log.timestamp.toDate().getTime()) ||
                                            Date.now()
                                          ).toLocaleString("pt-BR")
                                        : "---"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Seção de Emergência - Full Width */}
                          <div className="bg-red-900/10 border border-red-500/20 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                                <AlertCircle size={24} />
                              </div>
                              <div>
                                <h5 className="text-red-400 font-bold text-sm uppercase tracking-widest">
                                  Protocolo de Emergência
                                </h5>
                                <p className="text-gray-400 text-xs">
                                  Dados para contato imediato em caso de
                                  necessidade.
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-center md:items-end">
                              <span className="text-gray-200 font-bold text-lg">
                                {viewingMember.emergencia || "Não informado"}
                              </span>
                              <span className="text-red-400 font-mono font-bold text-xl">
                                {viewingMember.foneEmergencia || "---"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-[#111827] border-t border-[#1e293b] flex justify-end gap-3">
                          <button
                            onClick={() => setViewingMember(null)}
                            className="px-8 py-3 bg-[#1e293b] text-gray-300 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black transition-all"
                          >
                            Fechar Visualização
                          </button>
                          <button
                            onClick={() => {
                              setViewingMember(null);
                              setEditingMember(viewingMember);
                            }}
                            className="px-8 py-3 bg-[#D4AF37] text-black rounded-xl font-bold hover:scale-105 transition-all"
                          >
                            Editar Registro
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {editingMember && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                      <div className="bg-[#0F172A] border border-[#D4AF37]/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-[#1e293b] flex justify-between items-center">
                          <h3 className="text-[#D4AF37] font-medium text-lg">
                            Editar Dados Maçônicos: {editingMember.nome}
                          </h3>
                          <button
                            onClick={() => setEditingMember(null)}
                            className="text-gray-500 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>
                        <form
                          onSubmit={handleUpdateMember}
                          className="p-6 overflow-y-auto max-h-[70vh]"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Dados Maçônicos */}
                            <div className="space-y-4">
                              <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest border-b border-[#1e293b] pb-2">
                                Dados Maçônicos
                              </h4>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  E-mail de Acesso (Google)
                                </label>
                                <input
                                  type="text"
                                  value={editingMember.email || ""}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      email: e.target.value
                                        .toLowerCase()
                                        .trim(),
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                />
                                <p className="text-[10px] text-gray-500 ml-1">
                                  E-mail usado para login. Deve ser um e-mail
                                  Google válido.
                                </p>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  E-mail Vinculado (Planilha/Origem)
                                </label>
                                <input
                                  type="text"
                                  value={editingMember.emailVinculado || ""}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      emailVinculado: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                />
                                <p className="text-[10px] text-gray-500 ml-1">
                                  Usado para vincular dados importados.
                                </p>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Grau
                                </label>
                                <select
                                  value={editingMember.grau}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      grau: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                >
                                  <option value="Aprendiz">Aprendiz</option>
                                  <option value="Companheiro">
                                    Companheiro
                                  </option>
                                  <option value="Mestre">Mestre</option>
                                </select>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  CIM (Membro)
                                </label>
                                <input
                                  type="text"
                                  value={editingMember.cim || ""}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      cim: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Loja Base
                                </label>
                                <input
                                  type="text"
                                  value={getLojaNameByCIM(editingMember.cim)}
                                  disabled
                                  className="bg-black/50 border border-[#1e293b] rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                                  title="A Loja é determinada automaticamente pelos 2 primeiros dígitos do CIM."
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Rito
                                </label>
                                <input
                                  type="text"
                                  value={editingMember.rito || "REAA"}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      rito: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Cargo Atual
                                </label>
                                <input
                                  type="text"
                                  value={editingMember.cargo}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      cargo: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Data de Iniciação
                                </label>
                                <input
                                  type="date"
                                  value={editingMember.dataIniciacao || ""}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      dataIniciacao: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Status do Obreiro
                                </label>
                                <select
                                  value={editingMember.status}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      status: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                >
                                  <option value="ativo">Ativo</option>
                                  <option value="irregular">Irregular</option>
                                  <option value="adormecido">Adormecido</option>
                                </select>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-red-500 font-bold ml-1">
                                  Permissão de Acesso
                                </label>
                                <select
                                  value={editingMember.role || "membro"}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      role: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-red-900/50 rounded-lg px-4 py-2 text-white"
                                >
                                  <option value="membro">Membro Comum</option>
                                  <option value="gestor">
                                    Gestor (Painel Gestor)
                                  </option>
                                  <option value="admin">
                                    Administrador Master
                                  </option>
                                </select>
                                <p className="text-[9px] text-gray-500 ml-1">
                                  Cuidado ao alterar permissões administrativas.
                                </p>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-400 font-bold ml-1">
                                  Frequência em Reuniões (%)
                                </label>
                                <input
                                  type="number"
                                  value={
                                    editingMember.frequencia !== undefined
                                      ? editingMember.frequencia
                                      : 0
                                  }
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      frequencia: Number(e.target.value),
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-400 font-bold ml-1">
                                  Visitas Realizadas
                                </label>
                                <input
                                  type="number"
                                  value={
                                    editingMember.visitas !== undefined
                                      ? editingMember.visitas
                                      : 0
                                  }
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      visitas: Number(e.target.value),
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                />
                              </div>

                              <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[10px] uppercase text-[#D4AF37] font-bold ml-1">
                                  Condecorações do Obreiro
                                </label>
                                <select
                                  value={
                                    editingMember.condecoracoes &&
                                    editingMember.condecoracoes.includes(
                                      "Aprendiz Erudito",
                                    )
                                      ? "Aprendiz Erudito"
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const currentDecs =
                                      editingMember.condecoracoes || [];
                                    let newDecs = [...currentDecs];
                                    if (e.target.value === "Aprendiz Erudito") {
                                      if (
                                        !newDecs.includes("Aprendiz Erudito")
                                      ) {
                                        newDecs.push("Aprendiz Erudito");
                                      }
                                    } else {
                                      newDecs = newDecs.filter(
                                        (d) => d !== "Aprendiz Erudito",
                                      );
                                    }
                                    setEditingMember({
                                      ...editingMember,
                                      condecoracoes: newDecs,
                                    });
                                  }}
                                  className="bg-[#0B0B0C] border border-[#D4AF37]/30 rounded-lg px-4 py-2 text-[#D4AF37] font-bold"
                                >
                                  <option value="">Nenhuma</option>
                                  <option value="Aprendiz Erudito">
                                    🏅 Aprendiz Erudito GOMAU
                                  </option>
                                </select>
                              </div>
                            </div>

                            {/* Dados Pessoais */}
                            <div className="space-y-4">
                              <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest border-b border-[#1e293b] pb-2">
                                Dados Pessoais & Contato
                              </h4>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  CPF
                                </label>
                                <input
                                  type="text"
                                  value={editingMember.cpf || ""}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      cpf: maskCPF(e.target.value),
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="000.000.000-00"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Telefone / WhatsApp
                                </label>
                                <input
                                  type="text"
                                  value={editingMember.telefone || ""}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      telefone: maskPhone(e.target.value),
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="(00) 00000-0000"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Data de Nascimento
                                </label>
                                <input
                                  type="date"
                                  value={formatDateToYYYYMMDD(
                                    editingMember.dataNascimento,
                                  )}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      dataNascimento: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white outline-none focus:border-[#D4AF37]/50"
                                  style={{ colorScheme: "dark" }}
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Estado Civil
                                </label>
                                <select
                                  value={
                                    editingMember.estadoCivil || "Casado/a"
                                  }
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      estadoCivil: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                >
                                  <option value="Solteiro/a">Solteiro/a</option>
                                  <option value="Casado/a">Casado/a</option>
                                  <option value="Viúvo/a">Viúvo/a</option>
                                  <option value="Divorciado/a">
                                    Divorciado/a
                                  </option>
                                </select>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Cônjuge (Esposa)
                                </label>
                                <input
                                  type="text"
                                  value={editingMember.esposa || ""}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      esposa: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  placeholder="Nome da esposa"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Qtd Filhos
                                </label>
                                <input
                                  type="number"
                                  value={editingMember.qtdFilhos || 0}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      qtdFilhos: Number(e.target.value),
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  disabled
                                />
                              </div>

                              <div className="bg-[#1e293b]/30 p-3 rounded-lg border border-[#1e293b]">
                                <div className="flex justify-between items-center mb-2">
                                  <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                    Dados dos Filhos
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentFilhos =
                                        editingMember.filhos || [];
                                      setEditingMember({
                                        ...editingMember,
                                        filhos: [
                                          ...currentFilhos,
                                          { nome: "", dataNascimento: "" },
                                        ],
                                        qtdFilhos: currentFilhos.length + 1,
                                      });
                                    }}
                                    className="text-[10px] bg-[#1e293b] hover:bg-[#D4AF37] hover:text-black text-gray-300 font-bold px-2 py-1 rounded transition-colors block"
                                  >
                                    + Adicionar
                                  </button>
                                </div>
                                {(!editingMember.filhos ||
                                  editingMember.filhos.length === 0) && (
                                  <p className="text-[10px] text-gray-500 italic ml-1">
                                    Nenhum cadastrado.
                                  </p>
                                )}
                                <div className="space-y-2">
                                  {(editingMember.filhos || []).map(
                                    (filho: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex flex-col gap-2 bg-[#0B0B0C] p-2 rounded border border-[#1e293b]"
                                      >
                                        <input
                                          type="text"
                                          value={filho.nome}
                                          onChange={(e) => {
                                            const newFilhos = [
                                              ...editingMember.filhos,
                                            ];
                                            newFilhos[idx].nome =
                                              e.target.value;
                                            setEditingMember({
                                              ...editingMember,
                                              filhos: newFilhos,
                                            });
                                          }}
                                          className="bg-[#0F172A] border border-[#1e293b] rounded px-3 py-1 text-white text-xs w-full"
                                          placeholder="Nome Completo"
                                        />
                                        <div className="flex gap-2">
                                          <input
                                            type="date"
                                            value={filho.dataNascimento}
                                            onChange={(e) => {
                                              const newFilhos = [
                                                ...editingMember.filhos,
                                              ];
                                              newFilhos[idx].dataNascimento =
                                                e.target.value;
                                              setEditingMember({
                                                ...editingMember,
                                                filhos: newFilhos,
                                              });
                                            }}
                                            className="bg-[#0F172A] border border-[#1e293b] rounded px-3 py-1 text-white text-xs flex-1"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newFilhos =
                                                editingMember.filhos.filter(
                                                  (_: any, i: number) =>
                                                    i !== idx,
                                                );
                                              setEditingMember({
                                                ...editingMember,
                                                filhos: newFilhos,
                                                qtdFilhos: newFilhos.length,
                                              });
                                            }}
                                            className="px-2 bg-red-900/30 text-red-500 rounded text-xs hover:bg-red-500 hover:text-white"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                    CEP
                                  </label>
                                  <input
                                    type="text"
                                    value={editingMember.cep || ""}
                                    onChange={(e) =>
                                      setEditingMember({
                                        ...editingMember,
                                        cep: maskCEP(e.target.value),
                                      })
                                    }
                                    className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                    placeholder="00000-000"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                    UF
                                  </label>
                                  <input
                                    type="text"
                                    value={editingMember.uf || ""}
                                    onChange={(e) =>
                                      setEditingMember({
                                        ...editingMember,
                                        uf: e.target.value.toUpperCase(),
                                      })
                                    }
                                    className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                    maxLength={2}
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Cidade
                                </label>
                                <input
                                  type="text"
                                  value={editingMember.cidade || ""}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      cidade: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Bairro
                                </label>
                                <input
                                  type="text"
                                  value={editingMember.bairro || ""}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      bairro: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Rua / Logradouro
                                </label>
                                <input
                                  type="text"
                                  value={editingMember.rua || ""}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      rua: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                  Número
                                </label>
                                <input
                                  type="text"
                                  value={editingMember.numero || ""}
                                  onChange={(e) =>
                                    setEditingMember({
                                      ...editingMember,
                                      numero: e.target.value,
                                    })
                                  }
                                  className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                />
                              </div>
                            </div>

                            {/* Emergência */}
                            <div className="md:col-span-2 space-y-4 mt-2">
                              <h4 className="text-red-500 text-xs font-bold uppercase tracking-widest border-b border-[#1e293b] pb-2">
                                Contato de Emergência
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                    Nome de Emergência
                                  </label>
                                  <input
                                    type="text"
                                    value={editingMember.emergencia || ""}
                                    onChange={(e) =>
                                      setEditingMember({
                                        ...editingMember,
                                        emergencia: e.target.value,
                                      })
                                    }
                                    className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                    Fone de Emergência
                                  </label>
                                  <input
                                    type="text"
                                    value={editingMember.foneEmergencia || ""}
                                    onChange={(e) =>
                                      setEditingMember({
                                        ...editingMember,
                                        foneEmergencia: maskPhone(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                    placeholder="(00) 00000-0000"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[#1e293b]">
                            <button
                              type="button"
                              onClick={() => setEditingMember(null)}
                              className="px-6 py-2 text-gray-400 hover:bg-[#1e293b] rounded-lg font-medium"
                            >
                              Descartar
                            </button>
                            <button
                              type="submit"
                              disabled={updatingMember}
                              className="px-8 py-2 bg-[#D4AF37] text-black font-bold rounded-lg hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20"
                            >
                              <Save size={18} />{" "}
                              {updatingMember
                                ? "Salvando..."
                                : "Salvar Alterações Completas"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {false && generatingCIM && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
                      <div className="bg-[#0F172A] border border-[#D4AF37]/30 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col my-8">
                        <div className="p-6 border-b border-[#1e293b] flex justify-between items-center sticky top-0 bg-[#0F172A] z-20">
                          <h3 className="text-[#D4AF37] font-medium text-lg flex items-center gap-2">
                            <IdCard size={20} /> Identidade Maçônica:{" "}
                            {generatingCIM.nome}
                          </h3>
                          <button
                            onClick={() => setGeneratingCIM(null)}
                            className="text-gray-500 hover:text-white p-2"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex flex-col lg:flex-row p-6 gap-8">
                          {/* Formulário esquerda */}
                          <div className="flex-1 flex flex-col gap-4">
                            <h4 className="text-gray-300 font-medium mb-2 border-b border-[#1e293b] pb-2">
                              Informações da CIM
                            </h4>

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                Matrícula (CIM)
                              </label>
                              <input
                                type="text"
                                value={cimData.cimNumber}
                                onChange={(e) =>
                                  setCimData({
                                    ...cimData,
                                    cimNumber: e.target.value,
                                  })
                                }
                                className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                placeholder="00000000"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] uppercase text-gray-500 font-bold ml-1 text-[#D4AF37]">
                                Sequência Numérica (QR Code e Validação)
                              </label>
                              <input
                                type="text"
                                value={cimData.qrCodeSequence}
                                onChange={(e) =>
                                  setCimData({
                                    ...cimData,
                                    qrCodeSequence: e.target.value,
                                  })
                                }
                                className="bg-[#0B0B0C] border border-[#D4AF37]/50 rounded-lg px-4 py-2 text-white"
                                placeholder="Ex: 07883235710"
                              />
                              <p className="text-[10px] text-gray-500 px-1">
                                Este será o código listado com o QR Code. Se
                                deixado em branco, a Matrícula será visada.
                              </p>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                Oriente
                              </label>
                              <input
                                type="text"
                                value={cimData.oriente}
                                onChange={(e) =>
                                  setCimData({
                                    ...cimData,
                                    oriente: e.target.value,
                                  })
                                }
                                className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                placeholder="Cidade/UF"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                Potência
                              </label>
                              <input
                                type="text"
                                value={cimData.potencia}
                                onChange={(e) =>
                                  setCimData({
                                    ...cimData,
                                    potencia: e.target.value,
                                  })
                                }
                                className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                                placeholder="GOMAU"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                                Foto do Membro (Opcional)
                              </label>
                              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#1e293b] rounded-xl p-6 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      setCimData({
                                        ...cimData,
                                        photoFile: e.target.files[0],
                                        photoUrl: URL.createObjectURL(
                                          e.target.files[0],
                                        ),
                                      });
                                    }
                                  }}
                                />
                                <UploadCloud
                                  className="text-gray-400"
                                  size={24}
                                />
                                <span className="text-sm font-medium text-gray-400">
                                  {cimData.photoFile
                                    ? cimData.photoFile.name
                                    : cimData.photoUrl
                                      ? "Foto já enviada (clique para trocar)"
                                      : "Fazer upload da foto"}
                                </span>
                              </label>
                            </div>

                            <div className="mt-auto pt-6 flex gap-3">
                              <button
                                onClick={() => setGeneratingCIM(null)}
                                className="px-6 py-2 text-gray-400 hover:bg-[#1e293b] rounded-lg flex-1"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleSaveCim}
                                disabled={savingCim}
                                className="px-6 py-2 bg-[#D4AF37] text-black font-bold rounded-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20 flex-1"
                              >
                                <Save size={18} />{" "}
                                {savingCim
                                  ? "Salvando..."
                                  : "Salvar na Plataforma"}
                              </button>
                            </div>
                          </div>

                          {/* Pré-visualização direita */}
                          <div className="flex-[2] bg-black/50 border border-[#1e293b] rounded-xl overflow-hidden flex flex-col items-center justify-center p-8 min-h-[400px]">
                            <h4 className="text-gray-400 text-sm font-medium mb-4 uppercase tracking-widest self-start w-full text-center">
                              Pré-visualização
                            </h4>
                            <div className="scale-75 md:scale-95 lg:scale-100 origin-top flex justify-center w-full">
                              <CIMCard
                                nome={generatingCIM.nome}
                                grau={generatingCIM.grau}
                                loja={generatingCIM.loja}
                                oriente={cimData.oriente || "---"}
                                potencia={cimData.potencia || "---"}
                                matricula={cimData.cimNumber || "000000000"}
                                qrCodeSequence={cimData.qrCodeSequence}
                                photoUrl={cimData.photoUrl}
                                downloadable={true}
                                cpf={generatingCIM.cpf}
                                dataNascimento={generatingCIM.dataNascimento}
                                telefone={generatingCIM.telefone}
                                estadoCivil={generatingCIM.estadoCivil}
                                esposa={generatingCIM.esposa}
                                cargo={generatingCIM.cargo}
                                rito={generatingCIM.rito}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {showImportReview && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                      <div className="bg-[#0F172A] border border-[#D4AF37]/30 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-[#1e293b] bg-[#0A0E1A]">
                          <h3 className="text-[#D4AF37] font-bold text-xl flex items-center gap-2">
                            <FileSpreadsheet /> Revisão da Importação
                            (validados.xlsx)
                          </h3>
                          <p className="text-gray-400 text-xs mt-1">
                            Novos Membros: <b>{newMembersToImport.length}</b> |
                            Membros com Divergências:{" "}
                            <b>{importConflicts.length}</b>
                          </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#0F172A]">
                          {/* Novos Membros */}
                          {newMembersToImport.length > 0 && (
                            <div>
                              <h4 className="text-green-500 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Plus size={16} /> Novos Membros a serem
                                cadastrados
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {newMembersToImport.map((m, i) => (
                                  <div
                                    key={i}
                                    className="bg-[#1e293b]/30 border border-[#1e293b] p-3 rounded-lg"
                                  >
                                    <p className="text-white font-medium text-sm">
                                      {m.nome}
                                    </p>
                                    <p className="text-gray-500 text-[10px]">
                                      {m.email}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Conflitos de Dados */}
                          {importConflicts.length > 0 && (
                            <div>
                              <h4 className="text-yellow-500 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                <AlertCircle size={16} /> Divergências
                                Encontradas (Excel vs Banco)
                              </h4>
                              <div className="space-y-4">
                                {importConflicts.map((c, i) => (
                                  <div
                                    key={i}
                                    className="bg-[#1e293b]/40 border border-[#D4AF37]/20 p-4 rounded-xl"
                                  >
                                    <div className="flex justify-between items-center mb-3">
                                      <div>
                                        <p className="text-white font-bold">
                                          {c.nome}
                                        </p>
                                        <p className="text-gray-500 text-[10px]">
                                          {c.email}
                                        </p>
                                      </div>
                                      <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded font-bold uppercase">
                                        {c.diffFields.length} Alterações
                                        Encontradas
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                      {c.diffFields.map((field: string) => (
                                        <div
                                          key={field}
                                          className="flex items-center gap-3 text-xs p-2 bg-black/30 rounded border border-white/5"
                                        >
                                          <span className="text-gray-500 w-24 capitalize">
                                            {field}:
                                          </span>
                                          <span className="text-red-400 hidden sm:block truncate max-w-[150px]">
                                            {c.current[field] || "vazio"}
                                          </span>
                                          <ArrowRight
                                            size={14}
                                            className="text-gray-600"
                                          />
                                          <span className="text-green-400 font-medium">
                                            {c.excel[field] || "vazio"}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-6 border-t border-[#1e293b] bg-[#0A0E1A] flex justify-end gap-3">
                          <button
                            onClick={() => setShowImportReview(false)}
                            className="px-6 py-2 text-gray-400 hover:bg-[#1e293b] rounded-lg font-medium"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={confirmImport}
                            disabled={importing}
                            className="px-8 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-green-600/20"
                          >
                            {importing ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <CheckCircle />
                            )}
                            {importing
                              ? "Gravando..."
                              : "Confirmar e Sincronizar Tudo"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle sm:px-0">
                      <div className="overflow-hidden border border-[#1e293b]/50 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-[#1e293b]/50">
                          <thead>
                            <tr className="bg-[#0A0E1A]">
                              <th className="text-left py-4 px-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                                <button
                                  onClick={() => handleSort("nome")}
                                  className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors focus:outline-none"
                                >
                                  Membro {renderSortIndicator("nome")}
                                </button>
                              </th>
                              <th className="text-left py-4 px-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                                <button
                                  onClick={() => handleSort("cim")}
                                  className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors focus:outline-none"
                                >
                                  CIM {renderSortIndicator("cim")}
                                </button>
                              </th>
                              <th className="text-left py-4 px-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold hidden md:table-cell">
                                <button
                                  onClick={() => handleSort("masonic")}
                                  className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors focus:outline-none"
                                >
                                  Masonic Info {renderSortIndicator("masonic")}
                                </button>
                              </th>
                              <th className="text-left py-4 px-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                                <button
                                  onClick={() => handleSort("status")}
                                  className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors focus:outline-none"
                                >
                                  Status {renderSortIndicator("status")}
                                </button>
                              </th>
                              <th className="text-right py-4 px-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e293b]/50 bg-[#0F172A]/30">
                            {filteredMembers.map((member) => (
                              <tr
                                key={member.id}
                                className="hover:bg-[#1e293b]/20 transition-colors group"
                              >
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#1e293b] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-sm overflow-hidden flex-shrink-0">
                                      {member.photoUrl || member.photoURL ? (
                                        <img
                                          src={
                                            member.photoUrl || member.photoURL
                                          }
                                          alt={member.nome}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        member.nome.charAt(0)
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-medium text-gray-200 truncate">
                                          {member.nome}
                                        </p>
                                        {excelEmails.size > 0 &&
                                          !excelEmails.has(
                                            member.email?.toLowerCase().trim(),
                                          ) &&
                                          !excelEmails.has(
                                            member.emailVinculado
                                              ?.toLowerCase()
                                              .trim(),
                                          ) && (
                                            <span className="flex items-center gap-1 text-[8px] bg-red-900/40 text-red-400 border border-red-500/30 px-1 py-0.5 rounded font-bold uppercase animate-pulse">
                                              <AlertCircle size={8} /> Off-Sheet
                                            </span>
                                          )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 truncate">
                                        {member.email}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="text-xs font-mono text-[#D4AF37] font-bold">
                                    {member.cim || member.CIM || "—"}
                                  </span>
                                </td>
                                <td className="py-4 px-4 hidden md:table-cell">
                                  <div className="flex flex-col">
                                    <span className="text-xs text-[#D4AF37] font-medium">
                                      {member.grau}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      {member.loja}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span
                                    className={cn(
                                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest",
                                      member.status?.toLowerCase() ===
                                        "ativo" ||
                                        member.status?.toLowerCase() ===
                                          "validado"
                                        ? "bg-green-900/30 text-green-500 border border-green-500/30"
                                        : member.status?.toLowerCase() === "adormecido"
                                          ? "bg-yellow-900/30 text-yellow-500 border border-yellow-500/30"
                                          : "bg-red-900/30 text-red-500 border border-red-500/30",
                                    )}
                                  >
                                    {member.status?.toLowerCase() === "validado"
                                      ? "Ativo"
                                      : (member.status?.toLowerCase() === "adormecido" ? "Adormecido" : member.status)}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <div className="flex justify-end gap-1">
                                    <button
                                      onClick={() => handleViewMember(member)}
                                      className="p-1 sm:p-2 text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-all"
                                      title="Visualizar ficha completa"
                                    >
                                      <Eye size={18} />
                                    </button>
                                    <button
                                      onClick={() => {}}
                                      style={{ display: "none" }}
                                      className="p-1 sm:p-2 text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-all"
                                      title="Gerar Identidade Maçônica (CIM)"
                                    >
                                      <IdCard size={18} />
                                    </button>
                                    <button style={{ display: "none" }}>
                                      <Eye size={18} />
                                    </button>
                                    <button
                                      onClick={() => setEditingMember(member)}
                                      className="p-1 sm:p-2 text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-all"
                                      title="Editar dados maçônicos"
                                    >
                                      <Settings size={18} />
                                    </button>
                                    {isOwner && (
                                      <button
                                        onClick={() =>
                                          handleDeleteMember(
                                            member.id,
                                            member.nome,
                                          )
                                        }
                                        className="p-1 sm:p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        title="Excluir membro"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredMembers.length === 0 &&
                              !loadingMembers && (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="py-12 text-center text-gray-500"
                                  >
                                    Nenhum membro encontrado com os filtros
                                    atuais.
                                  </td>
                                </tr>
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          {activeTab === "conteudos" && (
            <div>
              <div className="flex justify-between items-center mb-6 sm:flex-row flex-col gap-4">
                <h2 className="text-xl font-medium text-gray-200">
                  Gerenciamento de Arquivos
                </h2>
                <button
                  onClick={() => setShowAddContent(!showAddContent)}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:scale-105 transition-transform w-full sm:w-auto justify-center"
                >
                  <Plus size={18} /> Novo Arquivo
                </button>
              </div>

              {showAddContent && (
                <form
                  onSubmit={handleAddContent}
                  className="bg-[#1e293b]/30 p-4 sm:p-6 rounded-xl border border-[#D4AF37]/30 mb-8 flex flex-col gap-4"
                >
                  <h3 className="text-[#D4AF37] font-medium mb-2">
                    {editingContent
                      ? "Editar Material"
                      : "Subir Novo Material (Vídeo, PDF, etc)"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                        Título
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Aula sobre Simbolismo"
                        value={newContent.titulo}
                        onChange={(e) =>
                          setNewContent({
                            ...newContent,
                            titulo: e.target.value,
                          })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                        required
                      />
                      <p className="text-[10px] text-gray-500 ml-1">
                        Nome claro e objetivo do material.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                        Tipo de Material
                      </label>
                      <select
                        value={newContent.tipo}
                        onChange={(e) =>
                          setNewContent({
                            ...newContent,
                            tipo: e.target.value as any,
                          })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                        required
                      >
                        <option value="video">Vídeo</option>
                        <option value="pdf">PDF / Apostila</option>
                        <option value="texto">Texto / Instrução</option>
                        <option value="reflexao">Reflexão</option>
                      </select>
                      <p className="text-[10px] text-gray-500 ml-1">
                        Formato do conteúdo.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                        Grau Mínimo
                      </label>
                      <select
                        value={newContent.grauMinimo}
                        onChange={(e) =>
                          setNewContent({
                            ...newContent,
                            grauMinimo: e.target.value,
                          })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                        required
                      >
                        <option value="Aprendiz">Aprendiz</option>
                        <option value="Companheiro">Companheiro</option>
                        <option value="Mestre">Mestre</option>
                      </select>
                      <p className="text-[10px] text-gray-500 ml-1">
                        Restringe quem pode visualizar este arquivo.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-gray-500 font-bold ml-1 text-[#D4AF37]">
                        URL do Material (Drive, OneDrive, etc)
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newContent.url || ""}
                        onChange={(e) =>
                          setNewContent({ ...newContent, url: e.target.value })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                        required
                      />
                      <p className="text-[10px] text-gray-500 ml-1">
                        Cole aqui o link do vídeo (YouTube) ou arquivo (Drive,
                        PDF web).
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase text-gray-500 font-bold ml-1">
                      Descrição
                    </label>
                    <textarea
                      placeholder="Explicação sucinta do que é este material..."
                      value={newContent.descricao}
                      onChange={(e) =>
                        setNewContent({
                          ...newContent,
                          descricao: e.target.value,
                        })
                      }
                      className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white h-24 resize-none"
                      required
                    />
                    <p className="text-[10px] text-gray-500 ml-1">
                      Ajude os membros a entenderem do que se trata antes de
                      abrir.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddContent(false);
                        setEditingContent(null);
                      }}
                      className="text-gray-400 px-4 py-2 hover:bg-[#1e293b] rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingContent}
                      className="bg-[#D4AF37] text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                      {submittingContent
                        ? "Salvando..."
                        : editingContent
                          ? "Salvar Alterações"
                          : "Salvar e Subir Arquivo"}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {contents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nenhum arquivo subido ainda.
                  </p>
                ) : null}
                {contents.map((c) => (
                  <div
                    key={c.id}
                    className="bg-[#1e293b]/20 p-4 rounded-lg flex justify-between items-center border border-[#1e293b] group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-black/40 flex items-center justify-center text-[#D4AF37]">
                        {c.tipo === "video" ? (
                          <PlayCircle size={20} />
                        ) : (
                          <FileText size={20} />
                        )}
                      </div>
                      <div>
                        <h4 className="text-gray-200 font-medium">
                          {c.titulo}
                        </h4>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                          {c.tipo} • {c.grauMinimo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={c.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-[#D4AF37] transition-colors"
                        title="Download / Abrir Arquivo"
                      >
                        <Download size={18} />
                      </a>
                      {(isOwner || user?.role === "gestor") && (
                        <>
                          <button
                            onClick={() => {
                              setEditingContent(c);
                              setNewContent({
                                titulo: c.titulo,
                                tipo: c.tipo,
                                grauMinimo: c.grauMinimo,
                                descricao: c.descricao,
                                url: c.fileUrl || "",
                              });
                              setShowAddContent(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Editar"
                          >
                            <Settings size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteContent(c.id)}
                            className="text-red-900 group-hover:text-red-500 p-2 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "cursos" && (
            <div>
              <div className="flex justify-between items-center mb-6 sm:flex-row flex-col gap-4">
                <h2 className="text-xl font-medium text-gray-200">
                  Gerenciamento de Cursos
                </h2>
                <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
                  <button
                    onClick={seedDefaultCourses}
                    disabled={seedingCourses}
                    className="bg-[#1e293b] text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#D4AF37]/10 transition-all justify-center"
                  >
                    <BookOpen size={18} />{" "}
                    {seedingCourses ? "Semeando..." : "Semear Trilhas GOMAU"}
                  </button>
                  <button
                    onClick={resetAllCourses}
                    disabled={updatingAll}
                    className="bg-red-900/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-red-900/40 transition-all justify-center"
                  >
                    <Trash2 size={18} />{" "}
                    {updatingAll ? "Limpando..." : "Limpar & Fechar Todos"}
                  </button>
                  <button
                    onClick={() => setShowAddCourse(!showAddCourse)}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:scale-105 transition-transform w-full sm:w-auto justify-center"
                  >
                    <Plus size={18} /> Novo Curso
                  </button>
                </div>
              </div>

              {editingCourse && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                  <div className="bg-[#0F172A] border border-[#D4AF37]/30 p-8 rounded-2xl w-full max-w-2xl shadow-2xl">
                    <h3
                      className="text-2xl font-semibold text-[#D4AF37] mb-6"
                      style={{ fontFamily: "Cinzel" }}
                    >
                      Editar Curso
                    </h3>
                    <form
                      onSubmit={handleUpdateCourse}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">
                          Título do Curso
                        </label>
                        <input
                          type="text"
                          value={editingCourse.titulo}
                          onChange={(e) =>
                            setEditingCourse({
                              ...editingCourse,
                              titulo: e.target.value,
                            })
                          }
                          className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">
                          Descrição
                        </label>
                        <textarea
                          value={editingCourse.descricao}
                          onChange={(e) =>
                            setEditingCourse({
                              ...editingCourse,
                              descricao: e.target.value,
                            })
                          }
                          className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white h-24"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">
                          Carga Horária
                        </label>
                        <input
                          type="text"
                          value={editingCourse.cargaHoraria}
                          onChange={(e) =>
                            setEditingCourse({
                              ...editingCourse,
                              cargaHoraria: e.target.value,
                            })
                          }
                          className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                          placeholder="ex: 20 horas"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">
                          Grau de Elegibilidade
                        </label>
                        <select
                          value={editingCourse.elegibilidade}
                          onChange={(e) =>
                            setEditingCourse({
                              ...editingCourse,
                              elegibilidade: e.target.value,
                            })
                          }
                          className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                          required
                        >
                          <option value="Aprendiz">Aprendiz</option>
                          <option value="Companheiro">Companheiro</option>
                          <option value="Mestre">Mestre</option>
                          <option value="Todos">Todos os Graus</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">
                          Status
                        </label>
                        <select
                          value={editingCourse.status}
                          onChange={(e) =>
                            setEditingCourse({
                              ...editingCourse,
                              status: e.target.value as any,
                            })
                          }
                          className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                        >
                          <option value="aberto">Aberto (Publicado)</option>
                          <option value="rascunho">Rascunho</option>
                          <option value="fechado">Fechado</option>
                          <option value="em_breve">Em Breve</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">
                          URL de Destino
                        </label>
                        <input
                          type="text"
                          value={editingCourse.registrationUrl}
                          onChange={(e) =>
                            setEditingCourse({
                              ...editingCourse,
                              registrationUrl: e.target.value,
                            })
                          }
                          className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                          placeholder="Link do PDF ou Vídeo"
                        />
                      </div>
                      <div className="flex justify-end gap-3 md:col-span-2 mt-4">
                        <button
                          type="button"
                          onClick={() => setEditingCourse(null)}
                          className="px-6 py-2 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={updatingCourse}
                          className="px-6 py-2 bg-[#D4AF37] text-black font-bold rounded-lg hover:scale-105 transition-transform flex items-center gap-2"
                        >
                          <Save size={18} />{" "}
                          {updatingCourse ? "Salvando..." : "Salvar Alterações"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {showAddCourse && (
                <form
                  onSubmit={handleAddCourse}
                  className="bg-[#1e293b]/30 p-4 sm:p-6 rounded-xl border border-[#D4AF37]/30 mb-8 flex flex-col gap-4"
                >
                  <h3 className="text-[#D4AF37] font-medium mb-2">
                    Cadastrar Novo Curso com Link
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Nome do Curso"
                        value={newCourse.titulo}
                        onChange={(e) =>
                          setNewCourse({ ...newCourse, titulo: e.target.value })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white font-sans"
                        required
                      />
                      <p className="text-[10px] text-gray-500 ml-1">
                        Ex: O que são Landmarks.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Carga Horária (ex: 20h)"
                        value={newCourse.cargaHoraria}
                        onChange={(e) =>
                          setNewCourse({
                            ...newCourse,
                            cargaHoraria: e.target.value,
                          })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                      />
                      <p className="text-[10px] text-gray-500 ml-1">
                        Esforço estimado para conclusão.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Público Alvo (ex: Todos os Graus)"
                        value={newCourse.elegibilidade}
                        onChange={(e) =>
                          setNewCourse({
                            ...newCourse,
                            elegibilidade: e.target.value,
                          })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                      />
                      <p className="text-[10px] text-gray-500 ml-1">
                        Quem deve fazer este curso?
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Grade de Ensino (ex: Simbolismo)"
                        value={newCourse.grade}
                        onChange={(e) =>
                          setNewCourse({ ...newCourse, grade: e.target.value })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                      />
                      <p className="text-[10px] text-gray-500 ml-1">
                        Categoria ou pilar do curso.
                      </p>
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-1">
                      <input
                        type="url"
                        placeholder="Link do Formulário de Inscrição (URL Externa)"
                        value={newCourse.registrationUrl}
                        onChange={(e) =>
                          setNewCourse({
                            ...newCourse,
                            registrationUrl: e.target.value,
                          })
                        }
                        className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-[#D4AF37]"
                        required
                      />
                      <p className="text-[10px] text-gray-500 ml-1">
                        URL de redirecionamento (Hotmart, Sympla, Google Forms,
                        etc).
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <textarea
                      placeholder="Descrição completa do curso, objetivos e informações adicionais..."
                      value={newCourse.descricao}
                      onChange={(e) =>
                        setNewCourse({
                          ...newCourse,
                          descricao: e.target.value,
                        })
                      }
                      className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white h-32 resize-none"
                      required
                    />
                    <p className="text-[10px] text-gray-500 ml-1">
                      Um breve texto motivando os irmãos a se inscreverem no
                      curso.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCourse(false)}
                      className="text-gray-400 px-4 py-2 hover:bg-[#1e293b] rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingCourse}
                      className="bg-[#D4AF37] text-black px-6 py-2 rounded-lg font-bold"
                    >
                      {submittingCourse ? "Salvando..." : "Publicar Curso"}
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-[#1e293b]/20 p-5 rounded-xl border border-[#1e293b] flex flex-col gap-3 group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                          <Compass size={20} />
                        </div>
                        <h4 className="text-gray-100 font-medium font-sans">
                          {course.titulo}
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingCourse(course)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                          title="Editar"
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-gray-600 hover:text-red-500 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {course.descricao}
                    </p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#1e293b]">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                        {course.cargaHoraria}
                      </span>
                      <a
                        href={course.registrationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[#D4AF37] font-bold flex items-center gap-1 hover:underline"
                      >
                        <LinkIcon size={12} /> Ver Link de Inscrição
                      </a>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <p className="col-span-full text-gray-500 text-center py-8">
                    Nenhum curso cadastrado.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "solicitacoes" && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-medium text-gray-200">
                  Aprovação de Solicitações e Pranchas
                </h2>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto p-4 sm:p-0 bg-[#0F172A] sm:bg-transparent rounded-lg border border-[#1e293b] sm:border-0 border-dashed">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold tracking-wider">
                      DE:
                    </span>
                    <input
                      type="date"
                      value={dataInicioRelatorio}
                      onChange={(e) => setDataInicioRelatorio(e.target.value)}
                      className="bg-[#1e293b] border border-[#334155] rounded px-2 py-1 text-xs text-gray-300"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold tracking-wider">
                      ATÉ:
                    </span>
                    <input
                      type="date"
                      value={dataFimRelatorio}
                      onChange={(e) => setDataFimRelatorio(e.target.value)}
                      className="bg-[#1e293b] border border-[#334155] rounded px-2 py-1 text-xs text-gray-300"
                    />
                  </div>
                  <button
                    title="Gerar Relatório de Justificativas de Falta"
                    onClick={async () => {
                      try {
                        const btn = document.getElementById(
                          "btn-relatorio-falta",
                        );
                        if (btn) btn.innerHTML = "Gerando...";

                        // 1. Fetch Users to map CIM with graceful fallback
                        const cimMap: Record<string, string> = {};
                        try {
                          const usersSnap = await getDocs(
                            collection(db, "users"),
                          );
                          usersSnap.docs.forEach((doc) => {
                            const d = doc.data();
                            if (d.uid) cimMap[d.uid] = d.cim;
                            cimMap[doc.id] = d.cim;
                          });
                        } catch (userListErr) {
                          console.warn(
                            "Nao foi possivel listar todos os usuarios de uma vez (regras de segurança), faremos busca individual por ID:",
                            userListErr,
                          );
                        }

                        // 2. Fetch requests
                        const q = query(
                          collection(db, "requests"),
                          where("tipo", "==", "Justificativa de Falta"),
                        );
                        const snap = await getDocs(q);

                        // 3. Filter by date logic
                        let docs = snap.docs.map((doc) => doc.data());

                        if (dataInicioRelatorio || dataFimRelatorio) {
                          docs = docs.filter((item) => {
                            // Obter data do item de forma segura
                            let dateObj = new Date(0);
                            if (item.criadoEm) {
                              if (typeof item.criadoEm.toDate === "function") {
                                dateObj = item.criadoEm.toDate();
                              } else if (
                                typeof item.criadoEm.toMillis === "function"
                              ) {
                                dateObj = new Date(item.criadoEm.toMillis());
                              } else if (item.criadoEm.seconds) {
                                dateObj = new Date(
                                  item.criadoEm.seconds * 1000,
                                );
                              } else {
                                const parsed = Date.parse(item.criadoEm);
                                if (!isNaN(parsed)) dateObj = new Date(parsed);
                              }
                            }

                            // Comparar apenas o dia/mês/ano no fuso local para evitar bugs de fuso horário
                            const itemYear = dateObj.getFullYear();
                            const itemMonth = dateObj.getMonth();
                            const itemDay = dateObj.getDate();
                            const itemTimeZero = new Date(
                              itemYear,
                              itemMonth,
                              itemDay,
                              0,
                              0,
                              0,
                              0,
                            ).getTime();

                            let valid = true;
                            if (dataInicioRelatorio) {
                              const parts = dataInicioRelatorio.split("-");
                              const dInit = new Date(
                                Number(parts[0]),
                                Number(parts[1]) - 1,
                                Number(parts[2]),
                                0,
                                0,
                                0,
                                0,
                              ).getTime();
                              if (itemTimeZero < dInit) valid = false;
                            }
                            if (dataFimRelatorio) {
                              const parts = dataFimRelatorio.split("-");
                              const dFim = new Date(
                                Number(parts[0]),
                                Number(parts[1]) - 1,
                                Number(parts[2]),
                                0,
                                0,
                                0,
                                0,
                              ).getTime();
                              if (itemTimeZero > dFim) valid = false;
                            }
                            return valid;
                          });
                        }

                        // 4. Sort locally
                        docs.sort((a, b) => {
                          const da = a.criadoEm?.toMillis
                            ? a.criadoEm.toMillis()
                            : 0;
                          const dbDate = b.criadoEm?.toMillis
                            ? b.criadoEm.toMillis()
                            : 0;
                          return dbDate - da; // desc
                        });

                        // 5. Generate TXT
                        let txt =
                          "GOMAU - RELATORIO DE JUSTIFICATIVAS DE FALTA\n";
                        txt +=
                          "GERADO EM: " +
                          new Date().toLocaleString("pt-br") +
                          "\n";
                        if (dataInicioRelatorio || dataFimRelatorio) {
                          txt += `PERIODO FILTRADO: ${dataInicioRelatorio ? dataInicioRelatorio.split("-").reverse().join("/") : "Início"} Até ${dataFimRelatorio ? dataFimRelatorio.split("-").reverse().join("/") : "Fim"}\n`;
                        }
                        txt +=
                          "========================================================================\n\n";

                        if (docs.length === 0) {
                          txt +=
                            "Nenhuma solicitacao de falta encontrada neste periodo.\n";
                        } else {
                          for (const data of docs) {
                            let cim = cimMap[data.userId];
                            // Se nao encontramos no mapa global, tentamos buscar o registro individual (permitido pelas regras)
                            if (!cim && data.userId) {
                              try {
                                const userDoc = await getDoc(
                                  doc(db, "users", data.userId),
                                );
                                if (userDoc.exists()) {
                                  const ud = userDoc.data();
                                  if (ud && ud.cim) {
                                    cim = ud.cim;
                                    cimMap[data.userId] = ud.cim;
                                  }
                                }
                              } catch (fetchUserErr) {
                                console.warn(
                                  "Sem permissao ou erro ao buscar usuario individualmente:",
                                  fetchUserErr,
                                );
                              }
                            }
                            if (!cim) cim = "Nao informado";

                            const dateObj = data.criadoEm?.toDate
                              ? data.criadoEm.toDate()
                              : new Date();
                            const dataEnvio =
                              dateObj.toLocaleDateString("pt-br") +
                              " " +
                              dateObj.toLocaleTimeString("pt-br");
                            const statusStr = (
                              data.status || "pendente"
                            ).toUpperCase();

                            txt += `NOME: ${data.userName || "Membro nao identificado"}\n`;
                            txt += `CIM: ${cim}\n`;
                            txt += `DATA DA SOLICITACAO: ${dataEnvio}\n`;
                            txt += `STATUS: ${statusStr}\n`;
                            txt += `------------------------------------------------------------------------\n`;
                            txt += `JUSTIFICATIVA:\n`;
                            txt += `${data.descricao || "Sem justificativa detalhada."}\n`;
                            txt += `\n========================================================================\n\n`;
                          }
                        }

                        const blob = new Blob([txt], {
                          type: "text/plain;charset=utf-8",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `relatorio-faltas-${new Date().toISOString().split("T")[0]}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);

                        if (btn)
                          btn.innerHTML =
                            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Baixar Relatório (Faltas)';
                      } catch (e) {
                        console.error(e);
                        alert("Erro ao gerar relatório. Tente novamente.");
                        const btn = document.getElementById(
                          "btn-relatorio-falta",
                        );
                        if (btn)
                          btn.innerHTML =
                            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Baixar Relatório (Faltas)';
                      }
                    }}
                    id="btn-relatorio-falta"
                    className="bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-white px-3 py-2 text-xs rounded-lg flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-colors"
                  >
                    <Download size={16} /> Baixar Relatório (Faltas)
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {requests.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">
                    Nenhuma solicitação pendente.
                  </p>
                ) : null}
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="bg-[#1e293b]/20 p-5 rounded-lg border border-[#D4AF37]/20 flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">
                            Solicitante:
                          </span>
                          <span className="text-sm text-gray-200 font-medium">
                            {r.userName || "Membro"}
                          </span>
                        </div>
                        <h4 className="text-gray-100 font-medium text-lg leading-tight mb-1">
                          {r.titulo || r.tipo}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider">
                            {r.tipo}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {r.criadoEm?.toDate
                              ? r.criadoEm
                                  .toDate()
                                  .toLocaleString("pt-br", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                              : "Recém enviado"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 bg-[#0B0B0C] p-3 rounded mt-2">
                      {r.descricao}
                    </p>
                    {r.arquivoUrl && (
                      <div className="mt-2">
                        <a
                          href={r.arquivoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-[#D4AF37] hover:underline flex items-center gap-1"
                        >
                          <FileText size={14} /> Baixar/Ver PDF Anexo
                        </a>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 mt-4 border-t border-[#1e293b] pt-4">
                      <button
                        onClick={() => openEvaluateModal(r)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#D4AF37] text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#D4AF37]/10 w-full sm:w-auto justify-center"
                      >
                        <CheckCircle size={18} />
                        Ver Solicitação
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === "eventos" && (
            <div>
              <div className="flex justify-between items-center mb-6 sm:flex-row flex-col gap-4">
                <h2 className="text-xl font-medium text-gray-200">
                  Gerenciamento de Eventos
                </h2>
                <button
                  onClick={() => setShowAddEvent(!showAddEvent)}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:scale-105 transition-transform w-full sm:w-auto justify-center"
                >
                  <Plus size={18} /> Novo Evento
                </button>
              </div>

              {showAddEvent && (
                <form
                  onSubmit={handleAddEvent}
                  className="bg-[#1e293b]/30 p-4 sm:p-6 rounded-xl border border-[#D4AF37]/30 mb-8 flex flex-col gap-4"
                >
                  <h3 className="text-[#D4AF37] font-medium mb-2">
                    Adicionar Novo Evento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Nome do Evento"
                        value={newEvent.titulo}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, titulo: e.target.value })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                        required
                      />
                      <p className="text-[10px] text-gray-500 ml-1">
                        Título claro do evento (Ex: Sessão Magna).
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <input
                        type="date"
                        value={newEvent.data}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, data: e.target.value })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                        required
                      />
                      <p className="text-[10px] text-gray-500 ml-1">
                        Data que ocorrerá o evento.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <input
                        type="time"
                        value={newEvent.hora}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, hora: e.target.value })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                        required
                      />
                      <p className="text-[10px] text-gray-500 ml-1">
                        Horário de início.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Local"
                        value={newEvent.local}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, local: e.target.value })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                        required
                      />
                      <p className="text-[10px] text-gray-500 ml-1">
                        Endereço da Loja ou Clube.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <select
                        value={newEvent.grauMinimo}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            grauMinimo: e.target.value,
                          })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                        required
                      >
                        <option value="Aprendiz">Acesso: Aprendiz +</option>
                        <option value="Companheiro">
                          Acesso: Companheiro +
                        </option>
                        <option value="Mestre">Acesso: Mestre +</option>
                      </select>
                      <p className="text-[10px] text-gray-500 ml-1">
                        Grau mínimo para o membro vizualizar e participar do
                        evento.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <textarea
                      placeholder="Descrição do evento..."
                      value={newEvent.descricao}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, descricao: e.target.value })
                      }
                      className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white h-24 resize-none"
                      required
                    />
                    <p className="text-[10px] text-gray-500 ml-1">
                      Especifique informações como traje, orientações, taxa (se
                      houver), etc.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-white bg-[#0A0E1A] p-3 rounded-xl border border-[#D4AF37]/10 cursor-pointer hover:border-[#D4AF37]/40 transition-all">
                      <input
                        type="checkbox"
                        checked={newEvent.generateMinutes}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            generateMinutes: e.target.checked,
                          })
                        }
                        className="accent-[#D4AF37] w-4 h-4 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-tighter">
                          Gravar Ata/Presença
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase font-medium">
                          Automação de registros
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddEvent(false)}
                      className="text-gray-400 px-4 py-2 hover:bg-[#1e293b] rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingEvent}
                      className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium"
                    >
                      {submittingEvent ? "Salvando..." : "Salvar Evento"}
                    </button>
                  </div>
                </form>
              )}

              {/* Modal de Edição de Evento */}
              {editingEvent && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                  <div className="bg-[#0F172A] border border-[#D4AF37]/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-[#1e293b] flex justify-between items-center">
                      <h3 className="text-[#D4AF37] font-medium text-lg">
                        Editar Evento
                      </h3>
                      <button
                        onClick={() => setEditingEvent(null)}
                        className="text-gray-500 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <form
                      onSubmit={handleUpdateEvent}
                      className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-400">
                            Título
                          </label>
                          <input
                            type="text"
                            value={editingEvent.titulo}
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                titulo: e.target.value,
                              })
                            }
                            className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-400">
                            Status
                          </label>
                          <select
                            value={editingEvent.status || "ativo"}
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                status: e.target.value,
                              })
                            }
                            className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                          >
                            <option value="ativo">Ativo (Confirmado)</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-400">Data</label>
                          <input
                            type="date"
                            value={editingEvent.data}
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                data: e.target.value,
                              })
                            }
                            className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-400">Hora</label>
                          <input
                            type="time"
                            value={editingEvent.hora}
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                hora: e.target.value,
                              })
                            }
                            className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-2">
                          <label className="text-xs text-gray-400">Local</label>
                          <input
                            type="text"
                            value={editingEvent.local}
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                local: e.target.value,
                              })
                            }
                            className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-2">
                          <label className="text-xs text-gray-400">
                            Grau Mínimo
                          </label>
                          <select
                            value={editingEvent.grauMinimo}
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                grauMinimo: e.target.value,
                              })
                            }
                            className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white"
                          >
                            <option value="Aprendiz">Aprendiz</option>
                            <option value="Companheiro">Companheiro</option>
                            <option value="Mestre">Mestre</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">
                          Descrição
                        </label>
                        <textarea
                          value={editingEvent.descricao}
                          onChange={(e) =>
                            setEditingEvent({
                              ...editingEvent,
                              descricao: e.target.value,
                            })
                          }
                          className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white h-32 resize-none"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-2 text-white bg-[#0B0B0C] p-4 rounded-xl border border-[#D4AF37]/10 cursor-pointer hover:border-[#D4AF37]/40 transition-all">
                          <input
                            type="checkbox"
                            checked={editingEvent.generateMinutes}
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                generateMinutes: e.target.checked,
                              })
                            }
                            className="accent-[#D4AF37] w-4 h-4 cursor-pointer"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-tighter">
                              Gravar Ata/Presença
                            </span>
                            <span className="text-[9px] text-gray-500 uppercase font-medium">
                              Automação de registros
                            </span>
                          </div>
                        </label>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setEditingEvent(null)}
                          className="px-6 py-2 text-gray-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={submittingEvent}
                          className="bg-[#D4AF37] text-black px-8 py-2 rounded-lg font-bold"
                        >
                          {submittingEvent ? "Salvando..." : "Atualizar Evento"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="space-y-8">
                {/* Eventos Próximos */}
                <div>
                  <h3 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest border-b border-[#1e293b] pb-2 mb-4">
                    Próximos Eventos
                  </h3>
                  <div className="space-y-4">
                    {events.filter((evt) => {
                      const evtDate = new Date(
                        `${evt.data}T${evt.hora || "00:00"}`,
                      );
                      return evtDate >= new Date();
                    }).length === 0 ? (
                      <p className="text-gray-500 text-center py-4 text-xs italic">
                        Nenhum evento futuro agendado.
                      </p>
                    ) : null}

                    {events
                      .filter((evt) => {
                        const evtDate = new Date(
                          `${evt.data}T${evt.hora || "00:00"}`,
                        );
                        return evtDate >= new Date();
                      })
                      .map((evt) => (
                        <div
                          key={evt.id}
                          className={cn(
                            "bg-[#1e293b]/20 p-4 rounded-lg flex justify-between items-center border transition-all",
                            evt.status === "cancelado"
                              ? "border-red-500/50 grayscale opacity-70"
                              : "border-[#1e293b] hover:border-[#D4AF37]/30",
                          )}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-gray-200 font-medium">
                                {evt.titulo}
                              </h4>
                              {evt.status === "cancelado" && (
                                <span className="bg-red-900/50 text-red-500 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border border-red-500/30 flex items-center gap-1">
                                  <XCircle size={8} /> Cancelado
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#D4AF37] uppercase">
                              {new Date(evt.data).toLocaleDateString("pt-br")}{" "}
                              às {evt.hora} • Grau: {evt.grauMinimo}
                            </p>
                            {evt.meetLink && (
                              <div className="flex items-center gap-1 text-[9px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded w-fit border border-green-500/20">
                                <PlayCircle size={10} /> Link do Meet disponível
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingEvent(evt)}
                              className="text-gray-400 hover:text-[#D4AF37] p-2 transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="text-red-900 hover:text-red-500 p-2 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Histórico de Eventos */}
                <div>
                  <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-[#1e293b] pb-2 mb-4">
                    Histórico de Eventos (Realizados)
                  </h3>
                  <div className="space-y-4 opacity-70">
                    {events.filter((evt) => {
                      const evtDate = new Date(
                        `${evt.data}T${evt.hora || "00:00"}`,
                      );
                      return evtDate < new Date();
                    }).length === 0 ? (
                      <p className="text-gray-500 text-center py-4 text-xs italic">
                        Nenhum evento passado encontrado.
                      </p>
                    ) : null}

                    {events
                      .filter((evt) => {
                        const evtDate = new Date(
                          `${evt.data}T${evt.hora || "00:00"}`,
                        );
                        return (
                          evtDate.getTime() <
                          new Date().setHours(new Date().getHours() + 1)
                        ); // Margem de 1h
                      })
                      .sort(
                        (a, b) =>
                          new Date(b.data).getTime() -
                          new Date(a.data).getTime(),
                      )
                      .filter((evt) => {
                        const evtDate = new Date(
                          `${evt.data}T${evt.hora || "00:00"}`,
                        );
                        return evtDate < new Date();
                      })
                      .map((evt) => (
                        <div
                          key={evt.id}
                          className="bg-[#0A0E1A] p-4 rounded-lg flex justify-between items-center border border-[#1e293b]"
                        >
                          <div className="flex flex-col gap-1">
                            <h4 className="text-gray-400 font-medium line-through decoration-[#D4AF37]/30">
                              {evt.titulo}
                            </h4>
                            <p className="text-[10px] text-gray-600 uppercase font-bold flex items-center gap-2">
                              {evt.status === "cancelado" ? (
                                <span className="text-red-500 flex items-center gap-1">
                                  <XCircle size={10} /> Cancelado em{" "}
                                  {new Date(evt.data).toLocaleDateString(
                                    "pt-br",
                                  )}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <CheckCircle size={10} /> Realizado em{" "}
                                  {new Date(evt.data).toLocaleDateString(
                                    "pt-br",
                                  )}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingEvent(evt)}
                              className="text-gray-600 hover:text-white p-2"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="text-red-900/50 hover:text-red-500 p-2 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "gerador" && <CourseGenerator />}

          {activeTab === "forum" && <ForumConfigTab />}

          {activeTab === "biblioteca" && <GestorLibrary />}

          {activeTab === "tesouraria" && <GestorTreasury />}

          {activeTab === "avaliacao" && <GestorValuation />}

          {activeTab === "segundo_vigilante" && (
            <SegundoVigilanteView members={members} currentUser={user} />
          )}

          {activeTab === "configuracoes" && (
            <div className="flex flex-col gap-8">
              <AdminPermissionsManager members={members} />

              <DataManagement />

              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-medium text-gray-200">
                    Regras de Evolução e Configurações Gerais
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Configure os requisitos mínimos para os membros progredirem
                    de grau e outras preferências da plataforma.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddRule(!showAddRule)}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <Plus size={18} /> Nova Regra de Grau
                </button>
              </div>

              {/* Form Nova Regra */}
              {showAddRule && (
                <div className="bg-[#1e293b]/50 border border-[#D4AF37]/50 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-bold text-[#D4AF37] mb-4">
                    Adicionar Nova Configuração de Grau
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-gray-400">
                        Grau Atual (Origem)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Mestre Instalado"
                        value={newRule.grauOrigem}
                        onChange={(e) =>
                          setNewRule({ ...newRule, grauOrigem: e.target.value })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full mt-1"
                      />
                      <p className="text-[10px] text-gray-500 ml-1">
                        Grau inicial do membro antes da evolução (Ex: Aprendiz).
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">
                        Grau Desejado (Destino)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Grau 4 (Mestre Secreto)"
                        value={newRule.grauDestino}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            grauDestino: e.target.value,
                          })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full mt-1"
                      />
                      <p className="text-[10px] text-gray-500 ml-1">
                        Qual grau o membro irá alcançar cumprindo os requisitos.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="text-xs text-gray-400">
                        Tempo Mínimo (Meses)
                      </label>
                      <input
                        type="number"
                        value={newRule.tempoMinimoMeses}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            tempoMinimoMeses: Number(e.target.value),
                          })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full mt-1"
                      />
                      <p className="text-[10px] text-gray-500 ml-1 mt-1">
                        Soma com a data de Iniciação/Elevação.
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Pranchas</label>
                      <input
                        type="number"
                        value={newRule.quantidadePranchas}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            quantidadePranchas: Number(e.target.value),
                          })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full mt-1"
                      />
                      <p className="text-[10px] text-gray-500 ml-1 mt-1">
                        Pranchas apresentadas via painel.
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">
                        Instruções
                      </label>
                      <input
                        type="number"
                        value={newRule.quantidadeInstrucoes}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            quantidadeInstrucoes: Number(e.target.value),
                          })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full mt-1"
                      />
                      <p className="text-[10px] text-gray-500 ml-1 mt-1">
                        Instruções presenciais.
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">
                        Presença (%)
                      </label>
                      <input
                        type="number"
                        value={newRule.presencaMinima}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            presencaMinima: Number(e.target.value),
                          })
                        }
                        className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full mt-1"
                      />
                      <p className="text-[10px] text-gray-500 ml-1 mt-1">
                        Check-in de presença mínimo.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddRule(false)}
                      className="text-gray-400 px-4 py-2 hover:bg-[#1e293b] rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddRule}
                      className="bg-[#D4AF37] text-black px-6 py-2 rounded-lg font-bold"
                    >
                      Adicionar Regra
                    </button>
                  </div>
                </div>
              )}

              {/* General Settings */}
              <div className="bg-[#1e293b]/20 border border-[#1e293b] rounded-xl p-6 mb-8 group hover:border-[#D4AF37]/50 transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#0A0E1A] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-200">
                      Configurações Gerais
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]">
                      Plataforma
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-6 items-end">
                  <div className="flex flex-col gap-1 flex-1">
                    <input
                      type="number"
                      value={generalSettings.tempoSessaoMin || 60}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          tempoSessaoMin: Number(e.target.value),
                        })
                      }
                      className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full sm:w-32 mb-4"
                    />
                    <label className="text-xs text-gray-400">
                      Prazo para cobrança de Resumo (Dias)
                    </label>
                    <p className="text-[10px] text-gray-500 mb-2">
                      Após o membro visualizar um material (PDF, Vídeo), quantos
                      dias o sistema aguardará para cobrar o envio de uma
                      prancha/resumo de absorção do conhecimento?
                    </p>
                    <input
                      type="number"
                      value={generalSettings.diasPrazoResumo}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          diasPrazoResumo: Number(e.target.value),
                        })
                      }
                      className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full sm:w-32"
                    />
                  </div>
                  <button
                    onClick={saveGeneralSettings}
                    disabled={savingSettings}
                    className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    <Save size={16} />{" "}
                    {savingSettings ? "Salvando..." : "Salvar Geral"}
                  </button>
                </div>
              </div>

              {/* Critérios de Condecorações */}
              <div className="bg-[#1e293b]/20 border border-[#1e293b] rounded-xl p-6 mb-8 group hover:border-[#D4AF37]/50 transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#0A0E1A] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-200">
                      Requisitos da Condecoração: Aprendiz Erudito
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]">
                      Condecorações GOMAU
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">
                      Média Mínima em Avaliações (%)
                    </label>
                    <p className="text-[9px] text-gray-500 mb-1">
                      Média necessária nos testes de instrução.
                    </p>
                    <input
                      type="number"
                      value={
                        generalSettings.decMediaMinima !== undefined
                          ? generalSettings.decMediaMinima
                          : 75
                      }
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          decMediaMinima: Number(e.target.value),
                        })
                      }
                      className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">
                      Frequência Mínima (%)
                    </label>
                    <p className="text-[9px] text-gray-500 mb-1">
                      Frequência presencial/oficial mínima.
                    </p>
                    <input
                      type="number"
                      value={
                        generalSettings.decFrequenciaMinima !== undefined
                          ? generalSettings.decFrequenciaMinima
                          : 75
                      }
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          decFrequenciaMinima: Number(e.target.value),
                        })
                      }
                      className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">
                      Quantidade Mínima de Visitas
                    </label>
                    <p className="text-[9px] text-gray-500 mb-1">
                      Visitas mínimas registradas em outras Lojas.
                    </p>
                    <input
                      type="number"
                      value={
                        generalSettings.decVisitasMinimas !== undefined
                          ? generalSettings.decVisitasMinimas
                          : 3
                      }
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          decVisitasMinimas: Number(e.target.value),
                        })
                      }
                      className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={saveGeneralSettings}
                    disabled={savingSettings}
                    className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    <Save size={16} />{" "}
                    {savingSettings ? "Salvando..." : "Salvar Critérios"}
                  </button>
                </div>
              </div>

              {/* Periodic Security Word Section by Loja */}
              <div className="bg-[#1e293b]/20 border border-[#1e293b] rounded-xl p-6 mb-8 group hover:border-[#D4AF37]/50 transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#0A0E1A] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                    <Key size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-200">
                      Segurança de Acesso por Loja
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]">
                      Palavras Sagradas do Trimestre
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  {securityWords.map((loja, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-4 sm:items-end bg-[#0B0B0C] p-4 rounded-xl border border-[#1e293b]/50 relative group">
                      {loja.isNew || loja.isEditing ? (
                        <>
                          <div className="flex-1">
                            <label className="text-xs text-gray-400 block mb-1">
                              Nome da Loja
                            </label>
                            <input
                              type="text"
                              value={loja.nome}
                              onChange={(e) => {
                                const newWords = [...securityWords];
                                newWords[index].nome = e.target.value;
                                setSecurityWords(newWords);
                              }}
                              className="bg-black/50 border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full"
                              placeholder="Ex: União e Força"
                            />
                          </div>

                          <div className="w-24 shrink-0">
                            <label className="text-xs text-gray-400 block mb-1 text-center">
                              Prefixo CIM
                            </label>
                            <input
                              type="text"
                              value={loja.prefixo}
                              onChange={(e) => {
                                const newWords = [...securityWords];
                                newWords[index].prefixo = e.target.value;
                                setSecurityWords(newWords);
                              }}
                              className="bg-black/50 border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full text-center"
                              placeholder="Ex: 01"
                              maxLength={2}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 min-w-[200px] mb-1">
                          <label className="text-xs text-gray-400 block mb-1">Nome da Loja</label>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-gray-200 truncate">
                              {loja.nome} <span className="text-xs text-[#D4AF37]">(Prefixo CIM: {loja.prefixo})</span>
                            </div>
                            <button
                              onClick={() => {
                                const newWords = [...securityWords];
                                newWords[index].isEditing = true;
                                setSecurityWords(newWords);
                              }}
                              className="text-gray-500 hover:text-[#D4AF37] transition-colors pb-1"
                              title="Editar Nome/Prefixo"
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 block mb-1">
                          Palavra Sagrada (Case-Insensitive)
                        </label>
                        <input
                          type="text"
                          value={loja.palavraAtual}
                          onChange={(e) => {
                            const newWords = [...securityWords];
                            newWords[index].palavraAtual = e.target.value;
                            setSecurityWords(newWords);
                          }}
                          className="bg-black/50 border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full"
                          placeholder="Ex: FORTITUDO"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-xs text-gray-400 block mb-1">
                          Data de Expiração
                        </label>
                        <input
                          type="date"
                          value={loja.expiraEm}
                          onChange={(e) => {
                            const newWords = [...securityWords];
                            newWords[index].expiraEm = e.target.value;
                            setSecurityWords(newWords);
                          }}
                          className="bg-black/50 border border-[#1e293b] rounded-lg px-4 py-2 text-white w-full"
                        />
                      </div>

                      <div className="w-24 shrink-0">
                        <label className="text-xs text-gray-400 block mb-1 text-center font-bold text-[#D4AF37]">
                          Mensalidade
                        </label>
                        <input
                          type="number"
                          value={loja.mensalidade !== undefined ? loja.mensalidade : 35}
                          onChange={(e) => {
                            const newWords = [...securityWords];
                            newWords[index].mensalidade = e.target.value === "" ? "" : Number(e.target.value);
                            setSecurityWords(newWords);
                          }}
                          className="bg-black/50 border border-[#D4AF37]/30 rounded-lg px-2 py-2 text-white w-full text-center focus:border-[#D4AF37] focus:outline-none"
                          placeholder="R$ 35"
                          min="0"
                        />
                      </div>

                      <button
                        onClick={() => {
                          const newWords = [...securityWords];
                          newWords.splice(index, 1);
                          setSecurityWords(newWords);
                        }}
                        className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors absolute right-2 top-2 sm:static sm:mb-1"
                        title="Remover Loja"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}

                  <div className="flex justify-between items-center mt-4 border-t border-[#1e293b] pt-6">
                    <button
                      onClick={() => {
                        setSecurityWords([
                          ...securityWords,
                          { prefixo: "", nome: "", palavraAtual: "", expiraEm: "", mensalidade: 35, isNew: true }
                        ]);
                      }}
                      className="bg-[#1e293b]/50 text-gray-300 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#1e293b] hover:text-white transition-colors text-sm"
                    >
                      <Plus size={16} /> Adicionar Loja
                    </button>
                    <button
                      onClick={saveSecurityWord}
                      disabled={savingSecurity}
                      className="bg-[#D4AF37] text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
                    >
                      <Save size={18} />{" "}
                      {savingSecurity ? "Atualizando..." : "Salvar Todas Palavras"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {Object.keys(rules).map((key) => {
                  const ruleData = rules[key];
                  const [origem, destino] = key.split("_");
                  return (
                    <div
                      key={key}
                      className="bg-[#1e293b]/20 border border-[#1e293b] rounded-xl p-6 group hover:border-[#D4AF37]/50 transition-all relative"
                    >
                      <button
                        onClick={() => handleDeleteRule(key)}
                        className="absolute top-4 right-4 text-red-900 hover:text-red-500 transition-colors"
                        title="Excluir Regra"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-[#0A0E1A] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                          <Settings size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-200">
                            {origem} → {destino}
                          </h3>
                          <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]">
                            Evolução de Grau
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-400">
                            Tempo Mínimo (Meses)
                          </label>
                          <input
                            type="number"
                            value={ruleData.tempoMinimoMeses}
                            onChange={(e) =>
                              setRules({
                                ...rules,
                                [key]: {
                                  ...rules[key],
                                  tempoMinimoMeses: e.target.value,
                                },
                              })
                            }
                            className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-32"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-400">
                            Pranchas Aprovadas
                          </label>
                          <input
                            type="number"
                            value={ruleData.quantidadePranchas}
                            onChange={(e) =>
                              setRules({
                                ...rules,
                                [key]: {
                                  ...rules[key],
                                  quantidadePranchas: e.target.value,
                                },
                              })
                            }
                            className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-32"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-400">
                            Instruções Obrigatórias
                          </label>
                          <input
                            type="number"
                            value={ruleData.quantidadeInstrucoes}
                            onChange={(e) =>
                              setRules({
                                ...rules,
                                [key]: {
                                  ...rules[key],
                                  quantidadeInstrucoes: e.target.value,
                                },
                              })
                            }
                            className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-32"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-400">
                            Presença Mínima (%)
                          </label>
                          <input
                            type="number"
                            value={ruleData.presencaMinima}
                            onChange={(e) =>
                              setRules({
                                ...rules,
                                [key]: {
                                  ...rules[key],
                                  presencaMinima: e.target.value,
                                },
                              })
                            }
                            className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-white w-32"
                          />
                        </div>

                        <div className="mt-4 pt-4 border-t border-[#1e293b] flex justify-end">
                          <button
                            onClick={() => saveRule(key, origem, destino)}
                            disabled={savingRules === key}
                            className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
                          >
                            <Save size={16} />{" "}
                            {savingRules === key
                              ? "Salvando..."
                              : "Salvar Regra"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Avaliação de Prancha Modal */}
          {evaluatingRequest && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-[#1e293b] flex justify-between items-center bg-[#0F172A]">
                  <div>
                    <h2 className="text-xl font-bold text-[#D4AF37] font-sans">
                      Análise de Solicitação
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Membro:{" "}
                      <span className="text-gray-200 font-medium">
                        {evaluatingRequest.userName || "Irmão"}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => setEvaluatingRequest(null)}
                    className="text-gray-500 hover:text-white transition-colors p-2"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                  <div className="flex flex-col gap-6">
                    {/* Tipo e Data */}
                    <div className="flex justify-between items-start">
                      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-3 py-1 rounded-full">
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">
                          {evaluatingRequest.tipo}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">
                          Enviado em
                        </p>
                        <p className="text-xs text-gray-400">
                          {evaluatingRequest.criadoEm?.toDate
                            ? evaluatingRequest.criadoEm
                                .toDate()
                                .toLocaleString("pt-br")
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {evaluatingRequest.tipo === "Envio de Prancha" ||
                    evaluatingRequest.tipo === "Prancha (Resumo/Estudo)" ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-1">
                            <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">
                              Número
                            </label>
                            <div className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-[#D4AF37] font-mono text-sm">
                              {evaluatingRequest.numero || "Pr∴ 01"}
                            </div>
                          </div>
                          <div className="md:col-span-3">
                            <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">
                              Título da Prancha
                            </label>
                            <div className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-gray-200 font-medium">
                              {evaluatingRequest.titulo || "Sem Título"}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">
                            Tema Central
                          </label>
                          <div className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-300 text-sm leading-relaxed italic">
                            "{evaluatingRequest.temaCentral || "Não informado"}"
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">
                            Símbolos Principais
                          </label>
                          <div className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-2 text-gray-300 text-sm">
                            {evaluatingRequest.simbolosPrincipais ||
                              "Não informado"}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">
                            Resumo / Texto Livre
                          </label>
                          <div className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-400 text-sm whitespace-pre-wrap min-h-[100px]">
                            {evaluatingRequest.descricao ||
                              "Nenhuma descrição fornecida."}
                          </div>
                        </div>

                        {evaluatingRequest.arquivoUrl && (
                          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                                <FileText size={20} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-200">
                                  Arquivo da Prancha
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  Clique para visualizar o material original
                                </p>
                              </div>
                            </div>
                            <a
                              href={evaluatingRequest.arquivoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-[#D4AF37] text-black text-xs font-bold rounded-lg hover:scale-105 transition-transform shadow-lg shadow-[#D4AF37]/10"
                            >
                              Visualizar Arquivo
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">
                            Descrição do Pedido
                          </label>
                          <div className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-300 text-sm leading-relaxed">
                            {evaluatingRequest.descricao}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-6 border-t border-[#1e293b]">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Feedback do Gestor{" "}
                        {decisionType === "rejeitar"
                          ? "(Obrigatório)"
                          : "(Opcional)"}
                      </label>
                      <textarea
                        value={requestComment}
                        onChange={(e) => setRequestComment(e.target.value)}
                        className="w-full bg-[#0B0B0C] border border-[#1e293b] rounded-lg px-4 py-3 text-gray-200 outline-none focus:border-[#D4AF37] transition-colors resize-none h-24"
                        placeholder="Digite orientações ou motivos da sua decisão..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-[#1e293b] flex flex-col sm:flex-row justify-end gap-3 bg-[#0F172A]">
                  <button
                    onClick={() => setEvaluatingRequest(null)}
                    className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                  >
                    Fechar sem decidir
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setDecisionType("rejeitar");
                        submitEvaluation(false);
                      }}
                      className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold bg-red-900/30 text-red-500 border border-red-500/50 hover:bg-red-900/50 transition-all flex items-center justify-center gap-2"
                    >
                      Rejeitar
                    </button>
                    <button
                      onClick={() => {
                        setDecisionType("aprovar");
                        submitEvaluation(true);
                      }}
                      className="flex-1 sm:flex-none px-8 py-2.5 rounded-xl font-bold bg-[#D4AF37] text-black hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20"
                    >
                      <CheckCircle size={18} />
                      Aprovar e Publicar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

```

---

## Arquivo: `src/pages/gestor/ForumConfigTab.tsx` (Extensão: `.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, GraduationCap, X } from 'lucide-react';

interface ForumInstructor {
  id: string;
  cim: string;
  nome: string;
  degrees: string[];
  addedBy: string;
}

export function ForumConfigTab() {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState<ForumInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newCim, setNewCim] = useState('');
  const [newNome, setNewNome] = useState('');
  const [degrees, setDegrees] = useState<string[]>(['Aprendiz']);

  useEffect(() => {
    loadInstructors();
  }, []);

  const loadInstructors = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'forumInstructors'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setInstructors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumInstructor)));
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar instrutores.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCim.trim() || !newNome.trim() || degrees.length === 0) {
      alert('Preencha o CIM, Nome e selecione pelo menos um grau.');
      return;
    }

    try {
      await addDoc(collection(db, 'forumInstructors'), {
        cim: newCim,
        nome: newNome,
        degrees,
        addedBy: user?.uid,
        createdAt: serverTimestamp()
      });
      setNewCim('');
      setNewNome('');
      setDegrees(['Aprendiz']);
      loadInstructors();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao adicionar instrutor.');
    }
  };

  const handleRemoveInstructor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'forumInstructors', id));
      loadInstructors();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao remover instrutor.');
    }
  };

  const toggleDegree = (deg: string) => {
    if (degrees.includes(deg)) {
      setDegrees(degrees.filter(d => d !== deg));
    } else {
      setDegrees([...degrees, deg]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#D4AF37] mb-2 flex items-center gap-2">
            <GraduationCap className="w-6 h-6" /> Gestão do Fórum
          </h2>
          <p className="text-gray-400">Designe Instrutores para responder às dúvidas dos IIr∴ nas salas do fórum.</p>
        </div>
      </div>

      <div className="bg-[#0A0E1A]/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:bg-[#0A0E1A]/60 transition-all">
        <h3 className="text-lg font-bold text-white mb-4">Adicionar Instrutor</h3>
        <form onSubmit={handleAddInstructor} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">CIM do Instrutor</label>
              <input
                type="text"
                value={newCim}
                onChange={e => setNewCim(e.target.value)}
                className="w-full bg-black/40 border-white/10 rounded-xl focus:border-[#D4AF37] focus:ring-[#D4AF37] text-white p-3"
                placeholder="Ex: 12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
              <input
                type="text"
                value={newNome}
                onChange={e => setNewNome(e.target.value)}
                className="w-full bg-black/40 border-white/10 rounded-xl focus:border-[#D4AF37] focus:ring-[#D4AF37] text-white p-3"
                placeholder="Ir∴ João da Silva"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Salas (Graus) que ele pode responder:</label>
            <div className="flex gap-4">
              {['Aprendiz', 'Companheiro', 'Mestre'].map(deg => (
                <button
                  type="button"
                  key={deg}
                  onClick={() => toggleDegree(deg)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                    degrees.includes(deg) 
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' 
                      : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  {deg}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="rounded-md bg-[#D4AF37] text-black hover:bg-[#D4AF37] hover:brightness-110 font-bold px-6 py-3">
            <Plus className="w-4 h-4 mr-2 inline-block" /> Adicionar Instrutor
          </button>
        </form>
      </div>

      <div className="bg-[#0A0E1A]/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">Instrutores Designados</h3>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : instructors.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Nenhum instrutor designado ainda.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/40 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">CIM</th>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Graus</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {instructors.map(inst => (
                  <tr key={inst.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-300">{inst.cim}</td>
                    <td className="px-6 py-4 text-white font-medium">{inst.nome}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {inst.degrees.map(d => (
                          <span key={d} className="px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded-md text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/20">
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemoveInstructor(inst.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                        title="Remover Instrutor"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

```

---

## Arquivo: `src/components/gestor/AdminPermissionsManager.tsx` (Extensão: `.tsx`)

```tsx
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

```

---

## Arquivo: `src/components/gestor/DataManagement.tsx` (Extensão: `.tsx`)

```tsx
import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { HardDriveDownload, ArrowRightLeft, Database, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export function DataManagement() {
   const [origemEmail, setOrigemEmail] = useState('');
   const [destinoEmail, setDestinoEmail] = useState('');
   
   const [isMigrating, setIsMigrating] = useState(false);
   const [isBackingUp, setIsBackingUp] = useState(false);
   const [migrationLog, setMigrationLog] = useState<string[]>([]);

   const [confirmMigrate, setConfirmMigrate] = useState(false);
   const [confirmBackup, setConfirmBackup] = useState(false);

   const addLog = (msg: string) => {
      setMigrationLog(prev => [...prev, msg]);
   };

   const handleBackup = async () => {
      setIsBackingUp(true);
      try {
         const collectionsToBackup = [
            'users', 'requests', 'forumTopics', 'forumReplies', 
            'mensalidades', 'history', 'reading_progress', 'courses', 'contents'
         ];
         
         const backupData: Record<string, any> = {};

         for (const colName of collectionsToBackup) {
            const snap = await getDocs(collection(db, colName));
            backupData[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
         }

         const jsonString = JSON.stringify(backupData, null, 2);
         const blob = new Blob([jsonString], { type: 'application/json' });
         const url = URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = `backup_gomau_${new Date().toISOString().split('T')[0]}.json`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);

         addLog('Backup realizado com sucesso e baixado.');
      } catch (err: any) {
         console.error('Erro no backup:', err);
         addLog('Erro no backup: ' + err.message);
      } finally {
         setIsBackingUp(false);
      }
   };

   const handleMigration = async () => {
      if (!origemEmail || !destinoEmail) {
         addLog('ERRO: Informe os dois e-mails (Origem e Destino).');
         return;
      }

      setIsMigrating(true);
      setMigrationLog([]);
      addLog(`Iniciando migração de: ${origemEmail} -> ${destinoEmail}`);

      try {
         // Buscar Origem
         const qOrigem = query(collection(db, 'users'), where('email', '==', origemEmail.trim().toLowerCase()));
         const snapOrigem = await getDocs(qOrigem);
         if (snapOrigem.empty) {
            throw new Error(`Usuário de Origem não encontrado (${origemEmail}) no banco.`);
         }
         const origemIds: string[] = [];
         snapOrigem.docs.forEach(d => {
            const data = d.data();
            if (data.uid) origemIds.push(data.uid);
            origemIds.push(d.id); // Add the doc ID as well just in case they used that
         });

         // Buscar Destino
         const qDestino = query(collection(db, 'users'), where('email', '==', destinoEmail.trim().toLowerCase()));
         const snapDestino = await getDocs(qDestino);
         if (snapDestino.empty) {
            throw new Error(`Usuário de Destino não encontrado (${destinoEmail}) no banco.`);
         }
         const destinoUser = snapDestino.docs[0].data();
         const destinoId = destinoUser.uid || snapDestino.docs[0].id;
         const destinoName = destinoUser.nome || '';
         const destinoCim = destinoUser.cim || '';
         const validOrigemIds = Array.from(new Set(origemIds)).filter(x => !!x);

         addLog(`IDs resolvidos: UIDs Origem(${validOrigemIds.join(', ')}) | UID Destino(${destinoId})`);

         if (validOrigemIds.length === 0) {
             throw new Error('Nenhum ID localizável para a conta de origem.');
         }

         const batch = writeBatch(db);
         let totalChanged = 0;

         // Migrar requests (Pranchas, etc) -> field: userId, userName
         addLog('Migrando requests...');
         const qReq = query(collection(db, 'requests'), where('userId', 'in', validOrigemIds));
         const snapReq = await getDocs(qReq);
         snapReq.forEach(d => {
            batch.update(doc(db, 'requests', d.id), { userId: destinoId, userName: destinoName });
            totalChanged++;
         });

         // Migrar forumTopics -> field: authorId, authorName, authorCim
         addLog('Migrando forumTopics...');
         const qTopics = query(collection(db, 'forumTopics'), where('authorId', 'in', validOrigemIds));
         const snapTopics = await getDocs(qTopics);
         snapTopics.forEach(d => {
            batch.update(doc(db, 'forumTopics', d.id), { authorId: destinoId, authorName: destinoName, authorCim: destinoCim });
            totalChanged++;
         });

         // Migrar forumReplies -> field: authorId, authorName, authorCim
         addLog('Migrando forumReplies...');
         const qReplies = query(collection(db, 'forumReplies'), where('authorId', 'in', validOrigemIds));
         const snapReplies = await getDocs(qReplies);
         snapReplies.forEach(d => {
            batch.update(doc(db, 'forumReplies', d.id), { authorId: destinoId, authorName: destinoName, authorCim: destinoCim });
            totalChanged++;
         });

         // Migrar history -> field: userId, userName
         addLog('Migrando history logs...');
         const qHist = query(collection(db, 'history'), where('userId', 'in', validOrigemIds));
         const snapHist = await getDocs(qHist);
         snapHist.forEach(d => {
            batch.update(doc(db, 'history', d.id), { userId: destinoId, userName: destinoName });
            totalChanged++;
         });

         // Migrar mensalidades -> field: uid, userName, userEmail, userCim
         addLog('Migrando mensalidades...');
         const qTrea = query(collection(db, 'mensalidades'), where('uid', 'in', validOrigemIds));
         const snapTrea = await getDocs(qTrea);
         snapTrea.forEach(d => {
            batch.update(doc(db, 'mensalidades', d.id), { uid: destinoId, userName: destinoName, userEmail: destinoUser.email, userCim: destinoCim });
            totalChanged++;
         });

         // Migrar reading_progress -> field: userId
         addLog('Migrando progresso de leitura...');
         const qRead = query(collection(db, 'reading_progress'), where('userId', 'in', validOrigemIds));
         const snapRead = await getDocs(qRead);
         snapRead.forEach(d => {
            batch.update(doc(db, 'reading_progress', d.id), { userId: destinoId });
            totalChanged++;
         });

         addLog(`Committing modificações (${totalChanged} registros)...`);
         if (totalChanged > 0) {
            await batch.commit();
         }
         addLog('MIGRAÇÃO COMPLETADA COM SUCESSO!');
         setOrigemEmail('');
      } catch (err: any) {
         console.error('Erro na migração:', err);
         addLog(`ERRO: ${err.message}`);
      } finally {
         setIsMigrating(false);
      }
   };

   return (
      <div className="space-y-6 font-sans">
         {/* LOG VIEW - moved to top so it's more visible on error */}
         {migrationLog.length > 0 && (
            <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl p-4 animate-in fade-in zoom-in-95 mb-4">
               <h4 className="text-xs text-white font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" /> Console de Execução
               </h4>
               <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                  {migrationLog.map((log, idx) => (
                     <div key={idx} className="text-[10px] font-mono text-gray-300">
                        <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                     </div>
                  ))}
               </div>
            </div>
         )}

         <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
               <Database className="text-[#D4AF37]" size={24} /> Gestão de Dados & Backup
            </h2>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* BACKUP OFFLINE */}
            <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] shadow-xl">
               <div className="mb-4 text-center pb-4 border-b border-[#1e293b]">
                  <HardDriveDownload size={40} className="mx-auto text-[#D4AF37] mb-2" />
                  <h3 className="font-bold text-gray-200 uppercase tracking-widest">Backup do Sistema (JSON)</h3>
                  <p className="text-xs text-gray-400 mt-2">Extração total de tabelas. Ideal para cópias de segurança locais e preservação dos metadados.</p>
               </div>
               <button 
                  onClick={() => {
                     setMigrationLog([]);
                     if (!confirmBackup) {
                        setConfirmBackup(true);
                        setTimeout(() => setConfirmBackup(false), 3000);
                     } else {
                        handleBackup();
                        setConfirmBackup(false);
                     }
                  }}
                  disabled={isBackingUp}
                  className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs transition-colors ${confirmBackup ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-white'}`}
               >
                  {isBackingUp ? <><Loader2 size={16} className="animate-spin" /> Gerando JSON...</> 
                  : confirmBackup ? "Tem Certeza? Baixar Agora" 
                  : <><HardDriveDownload size={16} /> Iniciar Download (Backup Offline)</>}
               </button>
            </div>

            {/* MIGRATION */}
            <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] shadow-xl flex flex-col">
               <div className="mb-4">
                  <h3 className="font-bold text-gray-200 uppercase tracking-wide flex items-center gap-2">
                     <ArrowRightLeft className="text-[#D4AF37]" size={18} /> Migração de Documentos (ID)
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1">Transfere pranchas, fóruns e faturas de uma conta antiga para uma nova, baseando-se no E-mail de cadastro de origem para o alvo.</p>
               </div>
               
               <div className="flex flex-col gap-3 flex-1 justify-center">
                  <div>
                     <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1 mb-1 block">E-mail de Origem</label>
                     <input 
                        type="email" 
                        value={origemEmail}
                        placeholder="ex: calepi@gmail.com"
                        onChange={e => setOrigemEmail(e.target.value)}
                        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-red-500"
                     />
                  </div>
                  <div>
                     <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1 mb-1 block">E-mail de Destino</label>
                     <input 
                        type="email" 
                        value={destinoEmail}
                        placeholder="ex: tazmaniacrvg@gmail.com"
                        onChange={e => setDestinoEmail(e.target.value)}
                        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-[#D4AF37]"
                     />
                  </div>
               </div>

               <button 
                  onClick={() => {
                     if (!origemEmail || !destinoEmail) return;
                     if (!confirmMigrate) {
                        setConfirmMigrate(true);
                        setTimeout(() => setConfirmMigrate(false), 3000);
                     } else {
                        handleMigration();
                        setConfirmMigrate(false);
                     }
                  }}
                  disabled={isMigrating || !origemEmail || !destinoEmail}
                  className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs transition-colors mt-4 disabled:opacity-50 ${confirmMigrate ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#D4AF37] hover:bg-[#C5A028] text-black'}`}
               >
                  {isMigrating ? <><Loader2 size={16} className="animate-spin" /> Trocando vínculos...</> 
                  : confirmMigrate ? 'Tem Certeza? (Ação Permanente)' 
                  : 'Iniciar Migração Completa'}
               </button>
            </div>
         </div>

         <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div>
               <h4 className="text-red-400 font-bold text-sm uppercase mb-1">Avisos de Integridade</h4>
               <ul className="text-xs text-red-500/80 space-y-1 list-disc pl-4">
                  <li>O Backup JSON armazena todas as tabelas em um formato unificado na sua máquina. A restauração/rollback deve ser feita manualmente (script próprio) em caso de emergência.</li>
                  <li>A migração vincula novas chaves (UID) nos registros antigos em tempo real. Esta função deve ser operada pelo Master e a responsabilidade pelas chaves de destino é incondicional.</li>
               </ul>
            </div>
         </div>
      </div>
   );
}

```

---

## Arquivo: `src/components/gestor/GestorLibrary.tsx` (Extensão: `.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Save, X, BookOpen, Link, Star, Lock, HelpCircle, Users, Unlock, CheckCircle2, Search, Coins, Sparkles, BookMarked } from 'lucide-react';
import toast from 'react-hot-toast';

const GRAUS = ['Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'];

export function GestorLibrary() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<'obras' | 'liberacoes'>('obras');
  const [users, setUsers] = useState<any[]>([]);
  const [userPayments, setUserPayments] = useState<{ [uid: string]: any[] }>({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [grauMinimo, setGrauMinimo] = useState('Aprendiz');
  const [categoria, setCategoria] = useState('Livro');
  const [preco, setPreco] = useState('R$ 49,90');
  const [isPaid, setIsPaid] = useState(false);
  const [urlDrive, setUrlDrive] = useState('');
  const [imagemCapa, setImagemCapa] = useState('');
  const [corCapa, setCorCapa] = useState('golden');
  const [whatsappPersonalizado, setWhatsappPersonalizado] = useState('');
  const [destaqueConversion, setDestaqueConversion] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchUsersAndPayments();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'library_items'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(fetched);
    } catch (err) {
      console.error("Erro ao carregar biblioteca virtual:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersAndPayments = async () => {
    setLoadingUsers(true);
    try {
      const snapUsers = await getDocs(collection(db, 'users'));
      const fetchedUsers = snapUsers.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedUsers = fetchedUsers
        .filter((u: any) => u.nome)
        .sort((a: any, b: any) => a.nome.localeCompare(b.nome));
      setUsers(sortedUsers);

      const snapPayments = await getDocs(collection(db, 'mensalidades'));
      const fetchedPayments = snapPayments.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const paymentsMap: { [uid: string]: any[] } = {};
      fetchedPayments.forEach((p: any) => {
        if (p.uid) {
          if (!paymentsMap[p.uid]) paymentsMap[p.uid] = [];
          paymentsMap[p.uid].push(p);
        }
      });
      setUserPayments(paymentsMap);
    } catch (err) {
      console.error("Erro ao carregar dados integrados da biblioteca:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const togglePremiumSubscription = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      const newStatus = !currentStatus;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, hasPremiumLibrary: newStatus } : u));
      await updateDoc(userRef, { hasPremiumLibrary: newStatus });
      toast.success(`Assinatura Premium ${newStatus ? 'ativada' : 'cancelada'} com sucesso!`);
    } catch (err) {
      console.error("Erro ao atualizar assinatura:", err);
      toast.error("Erro ao alterar assinatura premium.");
      fetchUsersAndPayments();
    }
  };

  const toggleBookUnlock = async (userId: string, bookId: string, currentUnlocked: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;
      
      let updatedList = targetUser.unlockedBooks || [];
      if (currentUnlocked) {
        updatedList = updatedList.filter((id: string) => id !== bookId);
      } else {
        if (!updatedList.includes(bookId)) {
          updatedList = [...updatedList, bookId];
        }
      }
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, unlockedBooks: updatedList } : u));
      await updateDoc(userRef, { unlockedBooks: updatedList });
      toast.success(`Acesso ${currentUnlocked ? 'revogado' : 'liberado'} com sucesso!`);
    } catch (err) {
      console.error("Erro ao atualizar desbloqueio:", err);
      toast.error("Erro ao salvar permissão.");
      fetchUsersAndPayments();
    }
  };

  const unlockAllPremiumForUser = async (userId: string) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;
      
      const premiumItemIds = items.filter(item => item.isPaid).map(item => item.id);
      if (premiumItemIds.length === 0) {
        toast.error("Nenhuma obra premium cadastrada para liberar.");
        return;
      }
      
      let updatedList = [...(targetUser.unlockedBooks || [])];
      premiumItemIds.forEach(id => {
        if (!updatedList.includes(id)) updatedList.push(id);
      });
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, unlockedBooks: updatedList } : u));
      await updateDoc(doc(db, 'users', userId), { unlockedBooks: updatedList });
      toast.success("Todas as obras premium foram liberadas para o irmão!");
    } catch (err) {
      console.error("Erro ao liberar todos:", err);
      toast.error("Falha ao liberar todas as obras.");
    }
  };

  const toggleAllLocksForUser = async (userId: string) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;
      
      const hasAny = (targetUser.unlockedBooks || []).length > 0;
      const updatedList = hasAny ? [] : items.filter(item => item.isPaid).map(item => item.id);
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, unlockedBooks: updatedList } : u));
      await updateDoc(doc(db, 'users', userId), { unlockedBooks: updatedList });
      toast.success(hasAny ? "Acessos premium revogados integralmente." : "Todas as obras foram liberadas de cortesia!");
    } catch (err) {
      console.error("Erro ao alternar acessos:", err);
      toast.error("Falha ao atualizar.");
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setTitulo(item.titulo || '');
    setDescricao(item.descricao || '');
    setGrauMinimo(item.grauMinimo || 'Aprendiz');
    setCategoria(item.categoria || 'Livro');
    setPreco(item.preco || 'R$ 49,90');
    setIsPaid(item.isPaid || false);
    setUrlDrive(item.urlDrive || '');
    setImagemCapa(item.imagemCapa || '');
    setCorCapa(item.corCapa || 'golden');
    setWhatsappPersonalizado(item.whatsappPersonalizado || '');
    setDestaqueConversion(item.destaqueConversion || false);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingItem(null);
    resetForm();
  };

  const resetForm = () => {
    setTitulo('');
    setDescricao('');
    setGrauMinimo('Aprendiz');
    setCategoria('Livro');
    setPreco('R$ 49,90');
    setIsPaid(false);
    setUrlDrive('');
    setImagemCapa('');
    setCorCapa('golden');
    setWhatsappPersonalizado('');
    setDestaqueConversion(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !urlDrive) {
      toast.error("Por favor, preencha o Título e o Link do Google Drive.");
      return;
    }

    setSubmitting(true);
    const payload = {
      titulo,
      descricao,
      grauMinimo,
      categoria,
      preco: isPaid ? preco : '',
      isPaid,
      urlDrive,
      imagemCapa,
      corCapa,
      whatsappPersonalizado,
      destaqueConversion,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingItem) {
        // Editar item existente
        await updateDoc(doc(db, 'library_items', editingItem.id), payload);
        toast.success("Documento da biblioteca atualizado com sucesso!");
      } else {
        // Criar novo item
        await addDoc(collection(db, 'library_items'), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        toast.success("Documento adicionado à biblioteca com sucesso!");
      }

      handleCancel();
      fetchItems();
    } catch (err) {
      console.error("Erro ao salvar documento na biblioteca:", err);
      toast.error("Erro ao salvar alteração.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'library_items', id));
      toast.success("Item removido imediatamente em silêncio.");
      // Atualiza o estado local imediatamente
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Erro ao remover documento:", err);
      toast.error("Erro ao remover documento.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Dual Tab Controller Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#1e293b]/20 p-5 rounded-2xl border border-white/5 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#D4AF37] flex items-center gap-2.5" style={{ fontFamily: 'Cinzel' }}>
            <BookOpen size={22} className="text-[#D4AF37]" />
            Atheneum — Biblioteca Secreta
          </h2>
          <p className="text-xs text-gray-400 mt-1">Gerencie tomos, rituais, de linhagem e envie chaves de liberação para os irmãos.</p>
        </div>
        <div className="flex bg-black/40 border border-white/10 p-0.5 rounded-xl w-full sm:w-auto self-stretch sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('obras'); setShowAddForm(false); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'obras' ? 'bg-[#D4AF37] text-black font-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <BookMarked size={14} />
            Acervo de Obras
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('liberacoes'); fetchUsersAndPayments(); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'liberacoes' ? 'bg-[#D4AF37] text-black font-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Users size={14} />
            Liberações ({users.length})
          </button>
        </div>
      </div>

      {activeTab === 'obras' ? (
        <>
          <div className="flex justify-between items-center bg-[#1e293b]/20 p-5 rounded-2xl border border-white/5">
            <div>
              <h2 className="text-xl font-semibold text-[#D4AF37] flex items-center gap-2" style={{ fontFamily: 'Cinzel' }}>
                <BookOpen size={22} />
                Gerenciar Biblioteca Digital
              </h2>
              <p className="text-xs text-gray-400 mt-1">Configure livros rituais, livros gerais do Oriente e materiais pagos ou gratuitos.</p>
            </div>
            <button 
              type="button"
              onClick={() => { setShowAddForm(!showAddForm); setEditingItem(null); resetForm(); }}
              className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:scale-[1.03] transition-all"
            >
              {showAddForm ? 'Voltar para Lista' : 'Adicionar Nova Obra'}
            </button>
          </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#0A0E1A]/60 border border-[#D4AF37]/30 rounded-2xl p-6 space-y-6 animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <h3 className="text-sm font-black text-white uppercase tracking-widest text-[#D4AF37]">
              {editingItem ? 'Editar Documento da Biblioteca' : 'Formulário de Nova Obra/Livro'}
            </h3>
            <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Título */}
            <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Título da Obra *</label>
              <input 
                type="text" 
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Regulamento Geral da Ordem Comentado"
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
                required
              />
            </div>

            {/* Categoria */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categoria</label>
              <select 
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
              >
                <option value="Livro">Livro</option>
                <option value="Ritual">Ritual</option>
                <option value="Artigo">Artigo Acadêmico</option>
                <option value="Apostila">Apostila de Apoio</option>
                <option value="Estudo">Estudo Maçônico</option>
              </select>
            </div>

            {/* Grau Mínimo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grau de Estudo Mínimo</label>
              <select 
                value={grauMinimo}
                onChange={e => setGrauMinimo(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
              >
                {GRAUS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Cor da capa */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cor Temática da Capa</label>
              <select 
                value={corCapa}
                onChange={e => setCorCapa(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
              >
                <option value="golden">Dourado / Preto Imperial</option>
                <option value="blue">Azul Real (Companheiro)</option>
                <option value="crimson">Vermelho Escarlate (Mestre)</option>
                <option value="jade">Verde Jade</option>
                <option value="charcoal">Cinza Mineral / Neutro</option>
              </select>
            </div>

            {/* Imagem de Capa Personalizada */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">URL da Imagem de Capa (Opcional)</label>
              <input 
                type="url" 
                value={imagemCapa}
                onChange={e => setImagemCapa(e.target.value)}
                placeholder="Ex e-capa: https://images.unsplash.com/..."
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
              />
            </div>

            {/* Link do Google Drive */}
            <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1">
                <Link size={12} /> Link do Google Drive *
              </label>
              <input 
                type="url" 
                value={urlDrive}
                onChange={e => setUrlDrive(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="bg-black/60 border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none font-mono"
                required
              />
            </div>

            {/* Configurações de Compra / Preço */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-4 col-span-1 md:col-span-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <Lock size={12} className="text-yellow-500" /> Cobrança Premium
                  </h4>
                  <p className="text-[10px] text-gray-500">Marque se os irmãos precisam pagar ou solicitar acesso específico no WhatsApp para abrir o link.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={isPaid}
                  onChange={e => setIsPaid(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D4AF37] bg-black accent-[#D4AF37]"
                />
              </div>

              {isPaid && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor do Livro</label>
                    <input 
                      type="text" 
                      value={preco}
                      onChange={e => setPreco(e.target.value)}
                      placeholder="Ex: R$ 39,90"
                      className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Texto do botão WhatsApp (Conversão)</label>
                    <input 
                      type="text" 
                      value={whatsappPersonalizado}
                      onChange={e => setWhatsappPersonalizado(e.target.value)}
                      placeholder="Ex: Quero liberar o livro de Hiram..."
                      className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Destaque de Conversão Principal */}
            <div className="col-span-1 md:col-span-3 flex items-center justify-between p-4 bg-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/20">
              <div className="flex items-start gap-3">
                <Star className="text-[#D4AF37] shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Exibir com Destaque no Topo da Biblioteca</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Se marcado, as informações e botões de conversão desta obra substituirão o cabeçalho premium principal da página da Biblioteca.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={destaqueConversion}
                onChange={e => setDestaqueConversion(e.target.checked)}
                className="w-4 h-4 rounded text-[#D4AF37] bg-black accent-[#D4AF37]"
              />
            </div>

            {/* Descrição Detalhada */}
            <div className="flex flex-col gap-1 col-span-1 md:col-span-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição Detalhada / Sinopse</label>
              <textarea 
                rows={4}
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Apresentação do livro, capítulos inclusos, as lições aprendidas ao desvendar a obra e importância na evolução científica do irmão..."
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#D4AF37]/60 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button 
              type="button" 
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-white uppercase transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="bg-[#D4AF37] hover:scale-[1.02] text-black px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 shadow-lg shadow-[#D4AF37]/20"
            >
              <Save size={14} /> {submitting ? 'Salvando...' : editingItem ? 'Salvar Edições' : 'Gravar Obra'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10">
          <p className="text-sm text-gray-400">Consultando inventário de obras...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#1e293b]/10 border border-dashed border-gray-800 rounded-2xl p-10 text-center">
          <p className="text-sm text-gray-500">Nenhum livro cadastrado na biblioteca ainda.</p>
        </div>
      ) : (
        <div className="bg-black/30 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1e293b]/40 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <th className="px-6 py-4">Título</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Público-alvo</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Capa</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1e293b]/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white uppercase tracking-wider font-sans">{item.titulo}</div>
                      <div className="text-[10px] text-gray-500 line-clamp-1 max-w-sm mt-0.5">{item.descricao || 'Sem descrição cadastrada'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium bg-[#1e293b]/50 px-2 py-1 rounded border border-white/5">{item.categoria}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-medium">
                      {item.grauMinimo}
                    </td>
                    <td className="px-6 py-4">
                      {item.isPaid ? (
                        <span className="text-yellow-500 font-bold bg-yellow-500/10 px-2.5 py-1 rounded border border-yellow-500/10">
                          {item.preco || 'Premium'}
                        </span>
                      ) : (
                        <span className="text-green-500 font-bold bg-green-500/10 px-2.5 py-1 rounded border border-green-500/10">
                          Gratuito
                        </span>
                      )}
                      {item.destaqueConversion && (
                        <span className="text-xs text-[#D4AF37] ml-2 font-black uppercase tracking-tighter" title="Destaque principal de conversão">★ Destaque</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] uppercase text-gray-500">
                      {item.corCapa || 'golden'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="text-gray-400 hover:text-[#D4AF37] p-2 hover:bg-[#1e293b]/40 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="text-red-900/50 hover:text-red-400 p-2 hover:bg-[#ef4444]/10 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      ) : (
        <>
          {/* SECURE PREMIUM UNLOCK & TREASURY ALIGNMENT BOARD */}
          <div className="bg-black/30 border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-semibold text-white tracking-wide text-sm uppercase flex items-center gap-1.5">
                  <Users size={16} className="text-[#D4AF37]" /> Liberações Manuais & Controle de Adimplência
                </h3>
                <p className="text-xs text-gray-400 mt-1">Conceda acessos estritos de pergaminhos ou rituais premium individualmente baseando-se no status mensal da tesouraria do irmão.</p>
              </div>

              {/* Real-time search for quick control */}
              <div className="relative w-full md:w-72">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por irmão ou CIM..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-xs text-white focus:outline-none focus:border-[#D4AF37] w-full"
                />
              </div>
            </div>

            {loadingUsers ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400 font-mono text-xs">Mergulhando nos arquivos das colunas para listar obreiros...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs border border-dashed border-white/5 rounded-xl">
                Nenhum obreiro cadastrado no sistema GOMAU.
              </div>
            ) : (
              <div className="space-y-4">
                {users
                  .filter(u => {
                    const term = userSearch.toLowerCase();
                    return (
                      (u.nome || '').toLowerCase().includes(term) ||
                      (u.email || '').toLowerCase().includes(term) ||
                      (u.cim || '').toLowerCase().includes(term)
                    );
                  })
                  .map(memberUser => {
                    const pList = userPayments[memberUser.id] || [];
                    const approvedPayments = pList.filter(p => p.status === 'aprovado');
                    const pendingPayments = pList.filter(p => p.status === 'em_analise');
                    
                    const premiumItems = items.filter(it => it.isPaid);
                    const unlockedCount = (memberUser.unlockedBooks || []).filter((id: string) => 
                      premiumItems.some(pi => pi.id === id)
                    ).length;

                    return (
                      <div 
                        key={memberUser.id} 
                        className="bg-[#0A0E1A]/40 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                      >
                        {/* Member overview */}
                        <div className="space-y-1 md:max-w-xs shrink-0 text-left">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white uppercase tracking-wider text-sm font-sans">{memberUser.nome}</h4>
                            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-black/50 text-[#D4AF37] border border-[#D4AF37]/20 font-mono">
                              {memberUser.grau}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-mono">{memberUser.email}</p>
                          <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-gray-500">
                            <span>CIM: {memberUser.cim || 'Não cadastrado'}</span>
                            <span className="text-[#D4AF37]">•</span>
                            <span>{memberUser.loja || 'Oriente'}</span>
                          </div>
                          
                          {/* Align Treasury monthly fee badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-2">
                            {approvedPayments.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                <CheckCircle2 size={10} className="text-green-400" />
                                Contribuinte ({approvedPayments.length} Ok)
                              </span>
                            ) : pendingPayments.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                <Coins size={10} className="text-yellow-400" />
                                Pix enviado (Validação)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                Sem faturas pagas
                              </span>
                            )}

                            {memberUser.hasPremiumLibrary ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-green-500 font-black bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/30">
                                <Sparkles size={10} className="text-green-500" />
                                PLANO PREMIUM (TUDO LIBERADO)
                              </span>
                            ) : unlockedCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-yellow-500 font-black bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                <Sparkles size={10} className="text-yellow-500" />
                                {unlockedCount} Obras Avulsas
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Premium Books releases grid */}
                        <div className="flex-1 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-left">Controle de Obras Premium:</p>
                          
                          {premiumItems.length === 0 ? (
                            <p className="text-xs text-gray-500 italic text-left">Nenhum tomo premium ou pago cadastrado no catálogo.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {premiumItems.map(book => {
                                const isUnlocked = (memberUser.unlockedBooks || []).includes(book.id);
                                return (
                                  <button
                                    key={book.id}
                                    type="button"
                                    onClick={() => toggleBookUnlock(memberUser.id, book.id, isUnlocked)}
                                    className={`p-2.5 rounded-xl border text-xs font-medium uppercase tracking-wider text-left transition-all flex items-center justify-between gap-2 hover:brightness-110 active:scale-95 ${isUnlocked ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border-yellow-500/35 text-[#D4AF37] font-bold' : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/10'}`}
                                  >
                                    <div className="truncate max-w-[140px]" title={book.titulo}>
                                      {book.titulo}
                                    </div>
                                    <div className="shrink-0">
                                      {isUnlocked ? (
                                        <Unlock size={12} className="text-[#D4AF37]" />
                                      ) : (
                                        <Lock size={12} className="text-gray-500" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Fast actions list under user */}
                        <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 justify-end items-stretch border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                          <button
                            type="button"
                            onClick={() => togglePremiumSubscription(memberUser.id, !!memberUser.hasPremiumLibrary)}
                            className={`${memberUser.hasPremiumLibrary ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30'} font-bold text-[10px] uppercase tracking-wider px-3.5 py-4 lg:py-2.5 rounded-xl transition-all font-sans shrink-0 whitespace-nowrap text-center`}
                          >
                            {memberUser.hasPremiumLibrary ? 'Revogar PLANO' : 'Ativar PLANO TOTAL'}
                          </button>
                          <button
                            type="button"
                            onClick={() => unlockAllPremiumForUser(memberUser.id)}
                            className="bg-yellow-500/10 hover:bg-yellow-300 text-yellow-500 hover:text-black border border-yellow-500/30 font-bold text-[10px] uppercase tracking-wider px-3.5 py-4 lg:py-2.5 rounded-xl transition-all font-sans shrink-0 whitespace-nowrap text-center"
                          >
                            Ativar Avulsos
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAllLocksForUser(memberUser.id)}
                            className="bg-black hover:bg-red-950/10 text-gray-400 hover:text-white border border-white/10 hover:border-white/20 font-bold text-[10px] uppercase tracking-wider px-3.5 py-4 lg:py-2.5 rounded-xl transition-all font-sans shrink-0 whitespace-nowrap text-center"
                          >
                            Inverter Tudo
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

```

---

## Arquivo: `src/components/gestor/GestorTreasury.tsx` (Extensão: `.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, updateDoc, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { Settings, Save, CheckCircle, AlertCircle, FileText, Download, Users, Search, PlusCircle, Check, X, CreditCard, Clock, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TreasurySituation } from './TreasurySituation';

export function GestorTreasury() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settings, setSettings] = useState({ pixKey: '', pixName: '', amount: '100.00', instructions: '' });
  const [filterMonth, setFilterMonth] = useState('');
  
  const [evaluatingPayment, setEvaluatingPayment] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Estados para o Lançamento Seletivo/Individual de Mensalidade
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [mSearch, setMSearch] = useState('');
  const [mMonth, setMMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [mAmount, setMAmount] = useState('100.00');
  const [mStatus, setMStatus] = useState('em_analise'); // 'em_analise' = Aguardando Validação, 'aprovado' = Pago
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    // Load config
    const loadSettings = async () => {
      const snap = await getDoc(doc(db, 'configs', 'treasury'));
      if (snap.exists()) {
        const data = snap.data() as any;
        setSettings(data);
        if (data.amount) {
          setMAmount(data.amount);
        }
      }
    };
    loadSettings();

    // Listen to payments
    const q = query(collection(db, 'mensalidades'), orderBy('dataEnvio', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() as any })));
      setLoading(false);
    });

    // Listen to GOMA members
    const qMembers = query(collection(db, 'users'), orderBy('nome', 'asc'));
    const unsubMembers = onSnapshot(qMembers, (snap) => {
      const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      // Deduplicação em tempo real por email
      const seen = new Set();
      const unique: any[] = [];
      const sorted = [...allDocs].sort((a, b) => {
         if (a.uid && !b.uid) return -1;
         if (!a.uid && b.uid) return 1;
         return 0;
      });
      for (const d of sorted) {
         const nameNorm = (d.nome || '').trim();
         const emailNorm = (d.email || '').toLowerCase().trim();
         if (!emailNorm) continue;
         if (!seen.has(emailNorm)) {
            seen.add(emailNorm);
            unique.push(d);
         }
      }
      setMembers(unique);
    });

    return () => {
      unsub();
      unsubMembers();
    };
  }, []);

  const handleLaunchIndividual = async () => {
    if (selectedMembers.length === 0) {
      alert('Por favor, selecione ao menos um irmão para efetuar o lançamento.');
      return;
    }
    setLaunching(true);
    try {
      let count = 0;
      for (const memberId of selectedMembers) {
        const m = members.find(x => x.id === memberId);
        if (!m) continue;
        
        await addDoc(collection(db, 'mensalidades'), {
          uid: m.uid || m.id,
          userName: m.nome || m.email || 'Nobre Irmão',
          userEmail: m.email || '',
          userCim: m.cim || 'N/A',
          mesRef: mMonth,
          valor: mAmount,
          comprovanteUrl: '',
          status: mStatus, // 'aprovado' ou 'em_analise'
          dataEnvio: serverTimestamp(),
          lancadoPorGestor: true
        });
        count++;
      }
      alert(`Mensalidade lançada com sucesso para ${count} irmão(s)!`);
      setSelectedMembers([]);
    } catch (err) {
      console.error(err);
      alert('Erro ao realizar o lançamento manual.');
    } finally {
      setLaunching(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'configs', 'treasury'), settings);
      alert('Configurações salvas!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleEvaluate = async (approved: boolean) => {
    if (!evaluatingPayment) return;
    try {
      // 1. Atualiza o status financeiro do lançamento
      await updateDoc(doc(db, 'mensalidades', evaluatingPayment.id), {
        status: approved ? 'aprovado' : 'rejeitado',
        comentarioGestor: approved ? null : rejectReason,
        dataAnalise: serverTimestamp()
      });

      // 2. Sincroniza a liberação dos itens da biblioteca ou pacote
      if (approved && evaluatingPayment.uid) {
        const userRef = doc(db, 'users', evaluatingPayment.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as any;

          if (evaluatingPayment.tipo === 'livro' && evaluatingPayment.itemId) {
            const currentUnlocked = userData.unlockedBooks || [];
            if (!currentUnlocked.includes(evaluatingPayment.itemId)) {
              await updateDoc(userRef, {
                unlockedBooks: [...currentUnlocked, evaluatingPayment.itemId]
              });
            }
          } else if (evaluatingPayment.tipo === 'assinatura') {
            await updateDoc(userRef, {
              hasPremiumLibrary: true,
              premiumPlanType: evaluatingPayment.mesRef || 'Assinatura',
              premiumPlanUnlockedAt: serverTimestamp()
            });
          }
        }
      }

      setEvaluatingPayment(null);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      alert('Erro ao processar o pagamento.');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
       await deleteDoc(doc(db, 'mensalidades', paymentId));
    } catch (error) {
       console.error('Error deleting payment:', error);
       alert('Erro ao excluir o registro.');
    }
  };

  const filteredPayments = payments.filter(p => !filterMonth || p.mesRef === filterMonth);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium text-gray-200">Gestão de Tesouraria</h2>
          <p className="text-xs text-gray-500">Administração de mensalidades e recebimentos via PIX</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Lançar Mensalidade Individual/Seleta */}
           <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-xl p-6 shadow-xl font-sans text-left flex flex-col justify-between">
              <div>
                 <h3 className="text-[#D4AF37] font-medium mb-4 flex items-center gap-2 text-base tracking-wide uppercase">
                    <PlusCircle size={18} /> {mStatus === 'em_analise' ? 'Lançar Nova Fatura' : 'Registrar Baixa Manual'}
                 </h3>
                 <p className="text-xs text-gray-500 mb-6 font-sans leading-relaxed">
                    {mStatus === 'em_analise' 
                       ? 'Emita solicitações de pagamento diretamente para um ou múltiplos irmãos selecionados. Eles verão o débito pendente na área da tesouraria.'
                       : 'Registre um pagamento já realizado por fora (em dinheiro, depósito direto, etc) para dar baixa imediata na tesouraria dos irmãos.'}
                 </p>

                 <div className="font-sans mb-6">
                    <label className="block text-gray-400 mb-2 text-xs uppercase font-medium">Modo de Operação</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                       <label className={cn("flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all", mStatus === 'em_analise' ? "bg-[#1e293b] border-[#D4AF37]" : "bg-[#0A0E1A] border-[#1e293b] hover:border-gray-600")}>
                          <input 
                             type="radio" 
                             name="mStatus" 
                             value="em_analise" 
                             checked={mStatus === 'em_analise'} 
                             onChange={() => setMStatus('em_analise')}
                             className="accent-[#D4AF37] w-4 h-4"
                          />
                          <span className="text-xs text-gray-300">Nova Cobrança (Pendente)</span>
                       </label>
                       <label className={cn("flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all", mStatus === 'aprovado' ? "bg-[#1e293b] border-green-600/70" : "bg-[#0A0E1A] border-[#1e293b] hover:border-gray-600")}>
                          <input 
                             type="radio" 
                             name="mStatus" 
                             value="aprovado" 
                             checked={mStatus === 'aprovado'} 
                             onChange={() => setMStatus('aprovado')}
                             className="accent-green-500 w-4 h-4"
                          />
                          <span className="text-xs text-gray-300">Dar Baixa (Já Pago)</span>
                       </label>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-sans mb-6">
                    <div>
                       <label className="block text-gray-400 mb-1.5 text-xs uppercase font-medium">Competência a {mStatus === 'em_analise' ? 'Cobrar' : 'Baixar'}</label>
                       <input 
                          type="month"
                          value={mMonth}
                          onChange={e => setMMonth(e.target.value)}
                          className="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37] transition-colors"
                       />
                    </div>
                    <div>
                       <label className="block text-gray-400 mb-1.5 text-xs uppercase font-medium">Valor (R$)</label>
                       <input 
                          type="text"
                          value={mAmount}
                          onChange={e => setMAmount(e.target.value)}
                          className="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37] transition-colors"
                          placeholder="100.00"
                       />
                    </div>
                 </div>

                 {/* Seleção dos obreiros */}
                 <div className="font-sans">
                    <div className="flex justify-between items-center mb-2">
                       <label className="block text-gray-400 text-xs uppercase font-medium">Selecionar Obreiros</label>
                       <div className="flex gap-2">
                          <button onClick={() => setSelectedMembers(members.map(x => x.id))} className="text-[10px] text-[#D4AF37] hover:underline uppercase font-bold">Todos</button>
                          <button onClick={() => setSelectedMembers([])} className="text-[10px] text-gray-500 hover:underline uppercase font-bold">Nenhum</button>
                       </div>
                    </div>
                    <div className="relative mb-3">
                       <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                       <input 
                          type="text"
                          value={mSearch}
                          onChange={e => setMSearch(e.target.value)}
                          placeholder="Pesquisar..."
                          className="w-full bg-[#1e293b] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                       />
                    </div>
                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar border border-[#1e293b] rounded-lg p-2 bg-[#0F172A]">
                       {(() => {
                          const filtered = members.filter(m => {
                             const nameMatches = (m.nome || '').toLowerCase().includes(mSearch.toLowerCase());
                             const cimMatches = (m.cim || '').toLowerCase().includes(mSearch.toLowerCase());
                             return nameMatches || cimMatches;
                          });

                          if (filtered.length === 0) return <p className="text-xs text-gray-500 italic py-4 text-center">Nenhum obreiro encontrado.</p>;

                          return filtered.map(m => {
                             const isChecked = selectedMembers.includes(m.id);
                             return (
                                <label key={m.id} className={cn("flex justify-between items-center px-3 py-2.5 rounded-lg border cursor-pointer transition-all", isChecked ? "bg-[#1e293b] border-[#D4AF37] shadow-sm" : "bg-[#0A0E1A] border-transparent hover:bg-[#1e293b]/50")}>
                                   <div className="flex items-center gap-3 min-w-0">
                                      <input 
                                         type="checkbox"
                                         checked={isChecked}
                                         onChange={() => {
                                            if (isChecked) setSelectedMembers(selectedMembers.filter(id => id !== m.id));
                                            else setSelectedMembers([...selectedMembers, m.id]);
                                         }}
                                         className="accent-[#D4AF37] w-4 h-4 rounded cursor-pointer"
                                      />
                                      <div className="truncate">
                                         <p className="text-xs text-gray-200 font-medium truncate">{m.nome}</p>
                                         <p className="text-[10px] text-gray-500 truncate">CIM: {m.cim || 'N/A'}</p>
                                      </div>
                                   </div>
                                </label>
                             );
                          });
                       })()}
                    </div>
                 </div>
              </div>

              <button 
                 type="button"
                 onClick={handleLaunchIndividual}
                 disabled={launching || selectedMembers.length === 0}
                 className={cn(
                    "mt-6 w-full text-black text-sm font-bold py-3.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wider flex items-center justify-center gap-2 font-sans shadow-lg",
                    mStatus === 'em_analise' ? "bg-[#D4AF37] hover:bg-[#C5A028]" : "bg-green-500 hover:bg-green-600"
                 )}
              >
                 {launching ? (
                    <>Processando...</>
                 ) : (
                    <>
                       <PlusCircle size={16} /> 
                       {mStatus === 'em_analise' 
                          ? `Emitir Fatura (${selectedMembers.length})` 
                          : `Registrar Pagamento (${selectedMembers.length})`}
                    </>
                 )}
              </button>
           </div>

           {/* Configurações PIX */}
           <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-xl p-6 flex flex-col justify-between shadow-xl">
             <div>
                <h3 className="text-gray-400 font-medium mb-6 flex items-center gap-2 text-sm tracking-widest uppercase">
                  <Settings size={16} /> Dados para Pagamento
                </h3>
                <div className="space-y-4 text-sm font-sans">
                   <div>
                      <label className="block text-gray-500 mb-1.5 text-xs font-semibold uppercase">Chave PIX Recebedora</label>
                      <textarea 
                         value={settings.pixKey} 
                         onChange={e => setSettings({...settings, pixKey: e.target.value})}
                         className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-white min-h-[60px] focus:border-[#D4AF37] transition-all no-scrollbar"
                         placeholder="Chave PIX ou código Copia e Cola..."
                      />
                   </div>
                   <div>
                      <label className="block text-gray-500 mb-1.5 text-xs font-semibold uppercase">Nome do Beneficiário</label>
                      <input 
                         type="text" 
                         value={settings.pixName} 
                         onChange={e => setSettings({...settings, pixName: e.target.value})}
                         className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-white focus:border-[#D4AF37] transition-all"
                         placeholder="Ex: Faculdade Maçônica"
                      />
                   </div>
                   <div>
                      <label className="block text-gray-500 mb-1.5 text-xs font-semibold uppercase">Valor Padrão (R$)</label>
                      <input 
                         type="text" 
                         value={settings.amount} 
                         onChange={e => setSettings({...settings, amount: e.target.value})}
                         className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-white focus:border-[#D4AF37] transition-all"
                      />
                   </div>
                   <div>
                      <label className="block text-gray-500 mb-1.5 text-xs font-semibold uppercase">Instruções aos Membros</label>
                      <textarea 
                         value={settings.instructions} 
                         onChange={e => setSettings({...settings, instructions: e.target.value})}
                         className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-white min-h-[80px] focus:border-[#D4AF37] transition-all no-scrollbar"
                         placeholder="Vencimentos e regras de atraso..."
                      />
                   </div>
                </div>
             </div>
             <button 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-gray-800 text-white border border-gray-600 font-medium py-3.5 rounded-lg hover:bg-gray-700 transition-colors uppercase tracking-wider text-xs"
             >
                {savingSettings ? 'Salvando...' : <><Save size={16} /> Salvar Parâmetros</>}
             </button>
           </div>

        </div>

        {/* Gestão de Comprovantes */}
        <div className="md:col-span-3 bg-[#0A0E1A] border border-[#1e293b] rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-[#D4AF37] font-medium flex items-center gap-2 text-base tracking-wide uppercase">
               <FileText size={18} /> Histórico de Confirmações
             </h3>
             <input 
                type="month" 
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="bg-[#1e293b] border border-[#334155] rounded px-3 py-1.5 text-white text-xs font-sans focus:outline-none focus:border-[#D4AF37]"
             />
          </div>

          <div className="space-y-3">
             {loading ? (
                <p className="text-gray-500 text-sm">Carregando histórico de pagamentos...</p>
             ) : filteredPayments.length === 0 ? (
                <div className="text-center py-12 border border-[#1e293b] border-dashed rounded-lg bg-[#0A0E1A]">
                   <FileText className="mx-auto text-gray-700 mb-2" size={32} />
                   <p className="text-gray-500 text-sm font-sans italic">Nenhum registro de pagamento para este período.</p>
                </div>
             ) : (
                filteredPayments.map(p => (
                   <div key={p.id} className="bg-[#0F172A] border border-[#1e293b] p-4 rounded-lg flex flex-col sm:flex-row justify-between gap-4 hover:border-[#D4AF37]/30 transition-all">
                      <div className="flex-1 font-sans">
                         <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-semibold text-white text-sm">{p.userName || p.userEmail}</span>
                            <span className="text-[10px] text-gray-400 px-2 py-0.5 rounded bg-[#1e293b]/70 font-mono">Mês: {p.mesRef}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                               p.status === 'aprovado' 
                                  ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                  : p.status === 'rejeitado' 
                                     ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                                     : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse'
                            }`}>
                               {p.status === 'aprovado' ? 'Pago' : p.status === 'rejeitado' ? 'Recusado' : 'Aguardando Validação'}{p.tipo && ` (${p.tipo === 'livro' ? 'Livro' : p.tipo === 'assinatura' ? 'Assinatura' : 'Mensalidade'})`}
                            </span>
                         </div>
                         <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>CIM: <strong className="text-[#D4AF37] font-mono">{p.userCim || 'N/A'}</strong></span>
                            <span>Valor: <strong>R$ {p.valor}</strong></span>
                            <span>Notificado em: <strong>{p.dataEnvio?.toDate ? p.dataEnvio.toDate().toLocaleDateString('pt-BR') : ''}</strong>{p.remetentePix && ` • Pix por: ${p.remetentePix}`}</span>
                         </div>
                      </div>

                      <div className="flex flex-row items-center gap-2 shrink-0">
                         {p.comprovanteUrl ? (
                            <a href={p.comprovanteUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 flex items-center gap-1 bg-[#1e293b] border border-[#334155] rounded text-white text-xs hover:bg-[#334155] w-full sm:w-auto justify-center font-sans">
                               <Download size={14} /> Ver Anexo
                            </a>
                         ) : (
                            <span className="text-[10px] text-gray-500 bg-black/40 px-2.5 py-1.5 rounded border border-[#1e293b] font-sans italic">
                               Confirmação Direta
                            </span>
                         )}
                         {p.status === 'em_analise' && (
                            <button onClick={() => setEvaluatingPayment(p)} className="px-3 py-1.5 bg-[#D4AF37] text-black text-xs font-bold rounded hover:bg-[#C5A028] w-full sm:w-auto transition-colors font-sans uppercase tracking-wider">
                               Validar
                            </button>
                         )}
                         <button onClick={() => handleDeletePayment(p.id)} className="p-1.5 border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/20 rounded transition-colors" title="Excluir Registro Permanente">
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </div>
                ))
             )}
          </div>
        </div>

      </div>

      <TreasurySituation members={members} payments={payments} />

      {/* Modal de Avaliação */}
      {evaluatingPayment && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0A0E1A] border-2 border-[#D4AF37]/30 rounded-xl p-6 max-w-md w-full shadow-2xl font-sans text-left">
               <h3 className="text-lg font-bold text-[#D4AF37] mb-4 uppercase tracking-wider">Validar Trânsito de Mensalidade</h3>
               
               <div className="bg-[#0F172A] p-4 rounded-lg border border-[#1e293b] mb-4 text-xs space-y-2 leading-relaxed">
                  <p className="text-gray-400">
                     O obreiro notificou o pagamento. Confirme as informações antes de dar a baixa no sistema:
                  </p>
                  <div className="border-t border-[#1e293b] pt-2 mt-2 text-sm text-white space-y-1">
                     <div>Membro: <strong>{evaluatingPayment.userName || evaluatingPayment.userEmail}</strong></div>
                     <div>CIM: <strong className="text-[#D4AF37]">{evaluatingPayment.userCim || 'N/A'}</strong></div>
                     <div>Referência/Item: <strong>{evaluatingPayment.mesRef}</strong></div>
                     {evaluatingPayment.tipo && (
                        <div>Tipo de Lançamento: <strong className="text-indigo-400 capitalize">{evaluatingPayment.tipo === 'livro' ? 'Livro / Curso' : evaluatingPayment.tipo === 'assinatura' ? 'Assinatura Biblioteca' : 'Mensalidade Geral'}</strong></div>
                     )}
                     <div>Valor a receber: <strong>R$ {evaluatingPayment.valor}</strong></div>
                     {evaluatingPayment.remetentePix && (
                        <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-2 rounded mt-2 text-xs text-gray-200">
                           Titular Pix Declarado: <span className="text-[#D4AF37] font-bold font-mono">{evaluatingPayment.remetentePix}</span>
                        </div>
                     )}
                  </div>
               </div>

               <div className="mb-6">
                  <label className="block text-gray-400 text-xs mb-2 uppercase font-medium">Motivo da Rejeição (Apenas se recusar)</label>
                  <textarea 
                     value={rejectReason}
                     onChange={e => setRejectReason(e.target.value)}
                     className="w-full h-20 bg-[#0F172A] border border-[#1e293b] rounded px-3 py-2 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                     placeholder="Ex: Valor não recebido em conta, dados de CIM incorretos..."
                  />
               </div>

               <div className="flex justify-end gap-3 font-sans">
                  <button onClick={() => setEvaluatingPayment(null)} className="px-3 py-2 rounded text-xs text-gray-400 hover:text-white hover:bg-[#1e293b] transition-colors uppercase font-bold">
                     Cancelar
                  </button>
                  <button onClick={() => handleEvaluate(false)} className="px-3 py-2 rounded text-xs bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 flex items-center gap-1 transition-colors uppercase font-bold">
                     <AlertCircle size={14} /> Recusar
                  </button>
                  <button onClick={() => handleEvaluate(true)} className="px-4 py-2 rounded text-xs bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 flex items-center gap-1 transition-colors uppercase font-bold">
                     <CheckCircle size={14} /> Confirmar Pagamento (Pago)
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}

```

---

## Arquivo: `src/components/gestor/TreasurySituation.tsx` (Extensão: `.tsx`)

```tsx
import React, { useState, useMemo } from 'react';
import { CheckCircle, AlertCircle, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export function TreasurySituation({ members, payments }: { members: any[], payments: any[] }) {
   const [search, setSearch] = useState('');
   const [filterMode, setFilterMode] = useState<'todos' | 'em_dia' | 'pendente'>('todos');

   const situationData = useMemo(() => {
      return members.map(m => {
         const userPayments = payments.filter(p => p.userId === m.id);
         const pendentes = userPayments.filter(p => p.status === 'em_analise' || p.status === 'rejeitado' || !p.status || p.status === 'pendente');
         
         return {
            ...m,
            pendentes,
            isEmDia: pendentes.length === 0,
         };
      });
   }, [members, payments]);

   const filteredSituation = situationData.filter(m => {
      const matchesSearch = (m.nome || '').toLowerCase().includes(search.toLowerCase()) || 
                            (m.cim || '').toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;

      if (filterMode === 'em_dia') return m.isEmDia;
      if (filterMode === 'pendente') return !m.isEmDia;
      
      return true;
   });

   return (
      <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-xl p-6 shadow-xl font-sans text-left mt-8">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-[#D4AF37] font-medium flex items-center gap-2 text-base tracking-wide uppercase">
               Situação dos Obreiros (Em Dia vs Pendentes)
            </h3>
         </div>

         <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
               <input 
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar por Irmão ou CIM..."
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
               />
            </div>
            
            <div className="flex gap-2 bg-[#1e293b]/50 p-1 rounded-lg border border-[#334155] shrink-0">
               <button 
                  onClick={() => setFilterMode('todos')}
                  className={cn("px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors", filterMode === 'todos' ? "bg-[#334155] text-white" : "text-gray-400 hover:text-gray-200")}
               >
                  Todos
               </button>
               <button 
                  onClick={() => setFilterMode('em_dia')}
                  className={cn("px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors", filterMode === 'em_dia' ? "bg-green-500/20 text-green-500" : "text-gray-400 hover:text-green-500")}
               >
                  Em Dia
               </button>
               <button 
                  onClick={() => setFilterMode('pendente')}
                  className={cn("px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors", filterMode === 'pendente' ? "bg-red-500/20 text-red-500" : "text-gray-400 hover:text-red-500")}
               >
                  Pendentes
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 border border-[#1e293b] p-2 rounded-xl bg-[#0F172A] max-h-[400px] overflow-y-auto no-scrollbar">
            {filteredSituation.length === 0 ? (
               <div className="col-span-full py-8 text-center border border-dashed border-[#1e293b] rounded-lg">
                  <p className="text-gray-500 text-sm">Nenhum irmão encontrado com esses filtros.</p>
               </div>
            ) : (
               filteredSituation.map(m => (
                  <div key={m.id} className={cn("p-4 rounded-lg border flex flex-col justify-between transition-colors", m.isEmDia ? "bg-[#0A0E1A] border-[#1e293b] hover:border-green-500/30" : "bg-red-500/5 border-red-500/20 hover:border-red-500/50")}>
                     <div>
                        <div className="flex justify-between items-start mb-2 gap-2">
                           <div className="font-semibold text-white text-sm truncate">{m.nome}</div>
                           {m.isEmDia ? (
                              <CheckCircle className="text-green-500 shrink-0" size={18} />
                           ) : (
                              <AlertCircle className="text-red-500 shrink-0" size={18} />
                           )}
                        </div>
                        <div className="text-xs text-gray-400 mb-3 font-mono">CIM: {m.cim || 'N/A'}</div>
                     </div>
                     
                     <div className="mt-auto">
                        {m.isEmDia ? (
                           <div className="text-[10px] text-green-500 bg-green-500/10 px-3 py-1.5 rounded inline-block font-bold uppercase tracking-wider">
                              Status: OK (Em Dia)
                           </div>
                        ) : (
                           <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Lançamentos Abertos:</span>
                              <div className="flex flex-wrap gap-1.5">
                                 {m.pendentes.map((p: any) => (
                                    <span key={p.id} className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/20 font-mono">
                                       {p.mesRef}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>
   );
}

```

---

## Arquivo: `src/components/CIMCard.tsx` (Extensão: `.tsx`)

```tsx
import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface CIMCardProps {
  nome: string;
  grau: string;
  loja: string;
  oriente: string;
  potencia: string;
  matricula: string;
  qrCodeSequence?: string;
  photoUrl?: string;
  downloadable?: boolean;
  cpf?: string;
  dataNascimento?: string;
  telefone?: string;
  estadoCivil?: string;
  esposa?: string;
  cargo?: string;
  rito?: string;
}

export const CIMCard: React.FC<CIMCardProps> = ({ 
  nome, 
  grau, 
  loja, 
  oriente, 
  potencia, 
  matricula, 
  qrCodeSequence, 
  photoUrl, 
  downloadable,
  cpf,
  dataNascimento,
  telefone,
  estadoCivil,
  esposa,
  cargo,
  rito
}) => {
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  
  const [frontBg, setFrontBg] = useState('/frente.png');
  const [backBg, setBackBg] = useState('/verso.png');

  // CPF with digits only for QR Code value (as requested)
  const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '';
  const qrCodeValue = cleanCpf || qrCodeSequence || matricula || '---';
  const validationCode = qrCodeSequence || matricula || '---';

  const downloadSide = async (elementRef: React.RefObject<HTMLDivElement | null>, sideName: string) => {
    if (!elementRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    
    try {
      const canvas = await html2canvas(elementRef.current, { 
        scale: 2, // 2x scale for print quality (1600x1010)
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `CIM_${sideName}_${nome.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch(err) {
      console.error(`Erro ao baixar ${sideName}:`, err);
      alert(`Não foi possível gerar a imagem do ${sideName}. Tente recarregar a página.`);
    }
  };

  const formatDateForDisplay = (dateStr?: string) => {
    if (!dateStr) return '---';
    const cleanStr = dateStr.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) return cleanStr;
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const [year, month, day] = cleanStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return cleanStr;
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="flex flex-col xl:flex-row gap-8 items-center justify-center w-full">
        
        {/* FRENTE CARD VIEW */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs uppercase font-bold tracking-widest text-[#D4AF37]">Frente (Anverso)</span>
          <div 
            className="relative overflow-hidden shadow-2xl rounded-2xl bg-[#0F172A] border border-[#D4AF37]/20"
            style={{ width: '400px', height: '253px' }}
          >
            <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
              <div 
                ref={frontCardRef} 
                className="bg-white relative overflow-hidden" 
                style={{ width: '800px', height: '505px' }}
              >
                  {/* Template Background */}
                  <img 
                    id="front-cim-bg"
                    src={frontBg} 
                    onError={() => {
                      if (frontBg === '/frente.png') {
                        setFrontBg('/template_cim.png');
                      }
                    }}
                    alt="Template Frente" 
                    crossOrigin="anonymous" 
                    className="absolute inset-0 w-full h-full object-cover z-0" 
                  />
                  
                  {/* Photo Box */}
                  <div className="absolute z-10 overflow-hidden rounded-[15px] bg-gray-100 border border-gray-300 flex items-center justify-center" style={{ left: '50px', top: '168px', width: '210px', height: '272px' }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt="Foto" crossOrigin="anonymous" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-400 font-bold uppercase text-xs text-center p-2">Sem Foto</div>
                    )}
                  </div>

                  {/* Text Overlay Section - Frente */}
                  <div className="absolute z-10 font-bold text-gray-900 text-[18px] font-sans whitespace-nowrap" style={{ left: '460px', top: '235px' }}>
                      {nome || '---'}
                  </div>
                  <div className="absolute z-10 font-bold text-gray-900 text-[18px] font-sans whitespace-nowrap" style={{ left: '460px', top: '272px' }}>
                      {grau || '---'}
                  </div>
                  <div className="absolute z-10 font-bold text-gray-900 text-[18px] font-sans whitespace-nowrap" style={{ left: '460px', top: '308px' }}>
                      {loja || '---'}
                  </div>
                  <div className="absolute z-10 font-bold text-gray-900 text-[18px] font-sans whitespace-nowrap" style={{ left: '460px', top: '346px' }}>
                      {oriente || '---'}
                  </div>
                  <div className="absolute z-10 font-bold text-gray-900 text-[18px] font-sans whitespace-nowrap" style={{ left: '460px', top: '383px' }}>
                      {potencia || 'GOMAU'}
                  </div>

                  {/* Matricula Bottom Line */}
                  <div className="absolute z-10 flex items-center justify-center" style={{ left: '460px', top: '416px', width: '265px' }}>
                       <span className="font-bold text-[#D4AF37] text-[18px] tracking-widest">{matricula || '---'}</span>
                  </div>

                  {/* QR Code - Encode CPF raw digits */}
                  <div className="absolute z-10 flex flex-col items-center justify-center bg-white p-1 rounded-md shadow-sm" style={{ right: '43px', top: '190px' }}>
                      <QRCodeSVG value={qrCodeValue} size={156} level="H" includeMargin={false} />
                  </div>
                  
                  {/* Validation sequence */}
                  <div className="absolute z-10 flex items-center justify-center" style={{ right: '35px', top: '365px', width: '170px' }}>
                       <span className="font-bold text-[#D4AF37] text-[16px] tracking-widest text-center">{validationCode}</span>
                  </div>
              </div>
            </div>
          </div>
          
          {downloadable && (
            <button 
              onClick={() => downloadSide(frontCardRef, 'Frente')}
              className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:scale-105 transition-transform shadow-lg shadow-[#D4AF37]/10"
            >
              Baixar Frente (Anverso)
            </button>
          )}
        </div>

        {/* VERSO CARD VIEW */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs uppercase font-bold tracking-widest text-[#D4AF37]">Verso (Reverso)</span>
          <div 
            className="relative overflow-hidden shadow-2xl rounded-2xl bg-[#0F172A] border border-[#D4AF37]/20"
            style={{ width: '400px', height: '253px' }}
          >
            <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
              <div 
                ref={backCardRef} 
                className="bg-white relative overflow-hidden" 
                style={{ width: '800px', height: '505px' }}
              >
                  {/* Template Background */}
                  <img 
                    id="back-cim-bg"
                    src={backBg} 
                    onError={() => {
                      if (backBg === '/verso.png') {
                        setBackBg('/carteira.png');
                      }
                    }}
                    alt="Template Verso" 
                    crossOrigin="anonymous" 
                    className="absolute inset-0 w-full h-full object-cover z-0" 
                  />
                  
                  {/* Card Values Overlay - Absolute positioned on Verso template lines */}
                  {/* Column 1 - Left fields */}
                  <div className="absolute z-10 flex flex-col gap-[14px]" style={{ left: '60px', top: '50px', width: '450px' }}>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">CIM (Matrícula)</span>
                      <span className="font-bold text-gray-900 text-[16px] leading-tight">{matricula || '---'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">CPF / Cadastro</span>
                      <span className="font-bold text-gray-900 text-[16px] leading-tight">{cpf || '---'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nascimento</span>
                      <span className="font-bold text-gray-900 text-[16px] leading-tight">{formatDateForDisplay(dataNascimento)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Estado Civil</span>
                      <span className="font-bold text-gray-900 text-[16px] leading-tight">{estadoCivil || '---'}</span>
                    </div>
                    {esposa && (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cônjuge (Esposa)</span>
                        <span className="font-bold text-gray-900 text-[16px] leading-tight truncate">{esposa}</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ritualística / Rito</span>
                      <span className="font-bold text-gray-900 text-[16px] leading-tight">{rito || '---'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cargo Atual</span>
                      <span className="font-bold text-gray-900 text-[16px] leading-tight">{cargo || 'Membro'}</span>
                    </div>
                  </div>

                  {/* QR Code section - Right columns */}
                  <div className="absolute z-10 flex flex-col items-center justify-center bg-white p-1 rounded-md shadow-sm" style={{ right: '60px', top: '150px' }}>
                      <QRCodeSVG value={qrCodeValue} size={156} level="H" includeMargin={false} />
                  </div>

                  <div className="absolute z-10 text-center" style={{ right: '50px', top: '325px', width: '180px' }}>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Validador de Segurança</span>
                    <span className="font-bold text-[#D4AF37] text-[15px] block font-mono tracking-widest leading-none mt-1">{validationCode}</span>
                  </div>

                  <div className="absolute z-10 text-center text-gray-900 font-bold text-[12px]" style={{ right: '50px', top: '420px', width: '180px' }}>
                     <div className="border-t border-gray-400 pt-1">
                       <span>GRÃO-MESTRE GOMAU</span>
                     </div>
                  </div>
              </div>
            </div>
          </div>
          
          {downloadable && (
            <button 
              onClick={() => downloadSide(backCardRef, 'Verso')}
              className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:scale-105 transition-transform shadow-lg shadow-[#D4AF37]/10"
            >
              Baixar Verso (Reverso)
            </button>
          )}
        </div>

      </div>
    </div>
  );
};


```

---

## Arquivo: `src/components/NotificationManager.tsx` (Extensão: `.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { Bell, Info, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function NotificationManager() {
  const { user } = useAuth();
  const [activeNotification, setActiveNotification] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    // Listener para eventos que o usuário deve ver (baseado no grau)
    const q = query(
      collection(db, 'events'),
      where('status', '==', 'ativo')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const now = new Date();
        const oneDayFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const readNotifications = userDoc.data()?.readNotifications || [];
        const readReminders = userDoc.data()?.readReminders || [];

        for (const change of snapshot.docChanges()) {
          const event = { id: change.doc.id, ...change.doc.data() } as any;
          
          // Verifica se o usuário tem o grau necessário
          const graus = ['Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'];
          const userGrauIndex = graus.indexOf(user.grau || 'Aprendiz');
          const eventGrauIndex = graus.indexOf(event.grauMinimo);

          if (userGrauIndex < eventGrauIndex) continue;

          const eventDate = new Date(`${event.data}T${event.hora || '00:00'}`);

          // Só processa notificações para eventos FUTUROS ou que ocorrem HOJE
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (eventDate < today) continue;

          // 1. Notificação de Novo Evento (se criado recentemente e não lido)
          if (change.type === 'added' && !readNotifications.includes(event.id)) {
            setActiveNotification({
              type: 'new',
              id: event.id,
              title: 'Novo Evento Agendado',
              message: `Um novo evento "${event.titulo}" foi marcado para o dia ${new Date(event.data).toLocaleDateString('pt-br')}.`,
              icon: <Bell className="text-[#D4AF37]" />
            });
            return; // Mostra uma por vez
          }

          // 2. Lembrete de 24h
          if (eventDate > now && eventDate <= oneDayFromNow && !readReminders.includes(event.id)) {
            setActiveNotification({
              type: 'reminder',
              id: event.id,
              title: 'Lembrete: Sessão em 24h',
              message: `O evento "${event.titulo}" ocorrerá em menos de 24h. Caso não consiga comparecer, por favor, comunique sua ausência à secretaria.`,
              icon: <AlertTriangle className="text-amber-500" />
            });
            return;
          }
        }
      } catch (err: any) {
         if (err?.code === 'resource-exhausted') {
            console.warn("Cota excedida no handler de notificação.");
         }
      }
    }, (err: any) => {
       if (err?.code === 'resource-exhausted') {
          console.warn("Cota do Firestore atingida nas notificações.");
       }
    });

    return () => unsubscribe();
  }, [user]);

  const handleAcknowledge = async () => {
    if (!user || !activeNotification) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const field = activeNotification.type === 'new' ? 'readNotifications' : 'readReminders';
      
      await updateDoc(userRef, {
        [field]: arrayUnion(activeNotification.id)
      });
      
      setActiveNotification(null);
    } catch (err) {
      console.error("Erro ao confirmar notificação:", err);
    }
  };

  return (
    <AnimatePresence>
      {activeNotification && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-[#0F172A] border border-[#D4AF37]/40 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-[#1e293b] p-3 rounded-xl border border-[#D4AF37]/20">
                  {activeNotification.icon}
                </div>
                <div>
                  <h3 className="text-[#D4AF37] font-bold text-lg leading-tight">{activeNotification.title}</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-sans">Notificação Obrigatória</p>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed mb-8 bg-[#1e293b]/30 p-4 rounded-lg border border-[#1e293b]">
                {activeNotification.message}
              </p>

              <button
                onClick={handleAcknowledge}
                className="w-full bg-[#D4AF37] hover:bg-[#C9A227] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#D4AF37]/10"
              >
                <CheckCircle size={20} />
                Compreendido (OK)
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

```

---

## Arquivo: `src/components/PWAInstallPrompt.tsx` (Extensão: `.tsx`)

```tsx
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

```

---

## Arquivo: `src/components/WelcomePopup.tsx` (Extensão: `.tsx`)

```tsx
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

```

---

## Arquivo: `src/lib/cropImage.ts` (Extensão: `.ts`)

```ts
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    if (!url.startsWith('data:')) {
      image.setAttribute('crossOrigin', 'anonymous')
    }
    image.src = url
  })

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<string | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  const rotRad = getRadianAngle(rotation)

  const bBoxWidth =
    Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height)
  const bBoxHeight =
    Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height)

  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  ctx.drawImage(image, 0, 0)

  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')

  if (!croppedCtx) {
    return null
  }

  // Set the output size
  croppedCanvas.width = 256
  croppedCanvas.height = 256

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    256,
    256
  )

  // Compress to relatively low quality to avoid exceeding 1MB
  return croppedCanvas.toDataURL('image/jpeg', 0.6)
}

```

---

