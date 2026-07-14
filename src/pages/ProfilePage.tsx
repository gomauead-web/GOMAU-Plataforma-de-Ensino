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
import { TroncoBeneficencia } from "../components/TroncoBeneficencia";
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

  // Sincronizar dados locais com o objeto User (que agora é atualizado via Realtime no AuthContext)� atualizado via Realtime no AuthContext)
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

      {/* Tronco de Beneficência Digital */}
      <div className="mt-6">
        <TroncoBeneficencia />
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
                src="/carteira.png"
                alt="Carteira Maçônica"
                className="w-[800px] max-w-full h-auto object-contain rounded-2xl shadow-2xl border border-[#D4AF37]/20"
              />
            </div>
          </div>
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
