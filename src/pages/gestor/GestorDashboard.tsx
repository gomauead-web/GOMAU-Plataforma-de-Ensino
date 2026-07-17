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
  Activity,
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
import { TelemetryView } from "../../components/gestor/TelemetryView";
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
    !isOwner &&
    userEmail !== "tazmaniacrvg@gmail.com";

  const isMaster = ["gomau.ead@gmail.com", "calepi@gmail.com", "calepe@gmail.com"].includes(userEmail) || user?.role === "gestor";
  const isDelegatedUser = !isMaster && user?.role !== 'gestor' && !isRestrictedFaltas && user?.delegatedPastas && user.delegatedPastas.length > 0;

  const initialActiveTab = isRestrictedFaltas
    ? "solicitacoes"
    : isDelegatedUser
    ? "segundo_vigilante"
    : "dashboard";

  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [selectedFeedbackFilter, setSelectedFeedbackFilter] = useState<string>("all");

  const handleMarkFeedbackRead = async (id: string, currentRead: boolean) => {
    try {
      await updateDoc(doc(db, "developerFeedback", id), { read: !currentRead });
    } catch (err) {
      console.error("Erro ao alternar leitura do feedback:", err);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm("Deseja realmente remover esta mensagem permanentemente?")) return;
    try {
      await deleteDoc(doc(db, "developerFeedback", id));
    } catch (err) {
      console.error("Erro ao deletar feedback:", err);
    }
  };

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
    const cimStr = String(cim).trim();
    
    // Sort securityWords by prefix length descending to match longest first (e.g. "77" before "7")
    const sortedLojas = [...securityWords].sort((a, b) => {
      const lenA = String(a.prefixo || "").trim().length;
      const lenB = String(b.prefixo || "").trim().length;
      return lenB - lenA;
    });

    const matched = sortedLojas.find(l => {
      const pref = String(l.prefixo || "").trim();
      if (!pref) return false;
      if (cimStr.startsWith(pref)) return true;
      
      // Check pad with "0"
      const prefPad = pref.padStart(2, '0');
      if (cimStr.startsWith(prefPad)) return true;
      
      // Check single digit
      if (pref.startsWith('0') && pref.length === 2) {
        const prefSingle = pref.substring(1);
        if (cimStr.startsWith(prefSingle)) return true;
      }
      return false;
    });

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
    { id: "telemetria", label: "Telemetria", icon: Activity },
    { id: "forum", label: "Fórum / Instrutores", icon: MessageSquare },
    { id: "configuracoes", label: "Configurações", icon: Settings },
    ...(isOwner || isMaster || user?.role === "gestor"
      ? [
          { id: "developer_feedback", label: "Fale com o Dev", icon: MessageSquare },
          { id: "avaliacao", label: "Valuation do Sistema", icon: BarChart3 }
        ]
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
    loadEvents();
    loadEvolutionRules();
    seedInitialSecurity();
    loadExcelEmails();

    // Listener em tempo real para solicitações
    const unsubRequests = onSnapshot(query(collection(db, "requests"), where("status", "==", "pendente")), (snap) => {
      let data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      if (isRestrictedFaltas) {
        data = data.filter((d) => d.tipo === "Justificativa de Falta");
      }
      setRequests(data);
    }, (err) => console.error("Erro real-time requests:", err));

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

    const unsubFeedbacks = onSnapshot(
      query(collection(db, "developerFeedback"), orderBy("createdAt", "desc")),
      (snap) => {
        setFeedbacks(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      },
      (err) => console.error("Erro real-time feedbacks:", err)
    );

    return () => {
      unsubscribeMembers();
      unsubscribeLogs();
      unsubFeedbacks();
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

  const loadRequests = () => {};

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
              {/* Notificação Fale com o Dev */}
              {feedbacks.filter((f) => !f.read).length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center animate-bounce">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Cinzel' }}>Mensagem ao Desenvolvedor</h4>
                      <p className="text-xs text-gray-300">Você possui <strong>{feedbacks.filter((f) => !f.read).length}</strong> nova(s) mensagem(ns) não lida(s) de crítica, sugestão ou bug.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("developer_feedback")}
                    className="px-4 py-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#D4AF37]/10 cursor-pointer shrink-0"
                  >
                    Abrir Canal Dev
                  </button>
                </div>
              )}
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

          {activeTab === "telemetria" && <TelemetryView />}

          {activeTab === "developer_feedback" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
                <div>
                  <h2 className="text-xl font-bold text-[#D4AF37] font-serif" style={{ fontFamily: 'Cinzel' }}>Mensagens ao Desenvolvedor</h2>
                  <p className="text-xs text-gray-400 mt-1">Críticas, sugestões, bugs e acessos enviados pelos obreiros da oficina</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Filtrar Categoria:</span>
                  <select
                    value={selectedFeedbackFilter}
                    onChange={(e) => setSelectedFeedbackFilter(e.target.value)}
                    className="bg-[#0A0E1A] text-xs text-gray-300 border border-[#1e293b] rounded-lg p-2 focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="all">Todas as Mensagens</option>
                    <option value="critica">Críticas</option>
                    <option value="sugestao">Sugestões</option>
                    <option value="dica">Dicas</option>
                    <option value="bug">Erros / Bugs</option>
                    <option value="acesso">Dificuldade de Acesso</option>
                    <option value="unread">Não Lidas</option>
                  </select>
                </div>
              </div>

              {/* Feedbacks Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0A0E1A] border border-[#1e293b] p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total de Mensagens</p>
                  <p className="text-xl font-bold text-[#D4AF37] mt-1">{feedbacks.length}</p>
                </div>
                <div className="bg-[#0A0E1A] border border-red-500/20 p-4 rounded-xl shadow-[inset_0_0_10px_rgba(239,68,68,0.05)]">
                  <p className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Não Lidas / Novas</p>
                  <p className="text-xl font-bold text-red-400 mt-1">{feedbacks.filter(f => !f.read).length}</p>
                </div>
                <div className="bg-[#0A0E1A] border border-orange-500/20 p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Bugs & Erros</p>
                  <p className="text-xl font-bold text-orange-400 mt-1">{feedbacks.filter(f => f.category === 'bug').length}</p>
                </div>
                <div className="bg-[#0A0E1A] border border-emerald-500/20 p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Sugestões & Dicas</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">
                    {feedbacks.filter(f => f.category === 'sugestao' || f.category === 'dica').length}
                  </p>
                </div>
              </div>

              {/* Feedback list */}
              <div className="space-y-4">
                {feedbacks.filter(f => {
                  if (selectedFeedbackFilter === 'all') return true;
                  if (selectedFeedbackFilter === 'unread') return !f.read;
                  return f.category === selectedFeedbackFilter;
                }).length === 0 ? (
                  <div className="text-center py-12 bg-[#0A0E1A] border border-[#1e293b] rounded-2xl">
                    <p className="text-sm text-gray-500">Nenhuma mensagem encontrada para este filtro.</p>
                  </div>
                ) : (
                  feedbacks
                    .filter(f => {
                      if (selectedFeedbackFilter === 'all') return true;
                      if (selectedFeedbackFilter === 'unread') return !f.read;
                      return f.category === selectedFeedbackFilter;
                    })
                    .map((fb) => {
                      const categoryLabels: { [key: string]: { label: string, color: string } } = {
                        critica: { label: 'Crítica', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
                        sugestao: { label: 'Sugestão', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                        dica: { label: 'Dica', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                        bug: { label: 'Erro / Bug', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
                        acesso: { label: 'Acesso', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' }
                      };
                      const catInfo = categoryLabels[fb.category] || { label: fb.category, color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };

                      return (
                        <div
                          key={fb.id}
                          className={cn(
                            "bg-[#0A0E1A] border rounded-2xl p-6 transition-all space-y-4",
                            fb.read 
                              ? "border-[#1e293b]" 
                              : "border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.05)] bg-[#0A0E1A]/95"
                          )}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={cn("px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border rounded-full", catInfo.color)}>
                                {catInfo.label}
                              </span>
                              {!fb.read && (
                                <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider">
                                  Nova
                                </span>
                              )}
                              <span className="text-[10px] text-gray-500 font-mono">
                                {fb.createdAt?.toDate ? fb.createdAt.toDate().toLocaleString('pt-BR') : 'Agora mesmo'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => handleMarkFeedbackRead(fb.id, fb.read)}
                                className={cn(
                                  "flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer",
                                  fb.read
                                    ? "bg-slate-900 border-[#1e293b] text-gray-400 hover:text-white"
                                    : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                )}
                              >
                                {fb.read ? "Marcar não Lida" : "Marcar como Lida"}
                              </button>
                              <button
                                onClick={() => handleDeleteFeedback(fb.id)}
                                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                title="Excluir mensagem permanentemente"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>

                          <div className="bg-[#0F172A] border border-[#1e293b]/75 rounded-xl p-4 text-sm text-gray-200 leading-relaxed break-words whitespace-pre-wrap font-sans">
                            {fb.message}
                          </div>

                          <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 font-sans">
                            <span>Autor: <strong className="text-gray-300 font-medium">{fb.senderName}</strong></span>
                            {fb.senderCim && <span>CIM: <strong className="text-gray-300 font-medium">{fb.senderCim}</strong></span>}
                            <span>E-mail: <strong className="text-gray-300 font-medium">{fb.senderEmail}</strong></span>
                            {fb.senderLoja && <span>Loja: <strong className="text-gray-300 font-medium">{fb.senderLoja}</strong></span>}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

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
