import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Award,
  Landmark,
  Eye,
  FileText,
  Calendar,
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  Lock,
  Cake,
  Send,
  X,
  Sparkles,
  MessageSquare,
  Download,
  Shield,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { handleFirestoreError, OperationType } from "../lib/errorHandler";

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [recentAtvs, setRecentAtvs] = useState<any[]>([]);
  const [recentContents, setRecentContents] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);

  const [rule, setRule] = useState<any>(null);
  const [pranchasAprovadas, setPranchasAprovadas] = useState(0);
  const [mesesComoMembro, setMesesComoMembro] = useState(0);

  const [pendingReadings, setPendingReadings] = useState<any[]>([]);
  const [diasPrazoResumo, setDiasPrazoResumo] = useState(7);

  // States for Birthday felicitations
  const [selectedUserForWishes, setSelectedUserForWishes] = useState<
    any | null
  >(null);
  const [wishesText, setWishesText] = useState("");
  const [sendingWishes, setSendingWishes] = useState(false);
  const [congratulatedIds, setCongratulatedIds] = useState<
    Record<string, boolean>
  >({});
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [officerAlerts, setOfficerAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.cim) return;
    const userCimStr = user.cim.toString().trim();
    if (!userCimStr) return;

    const q = query(
      collection(db, "officersNotifications"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const allAlerts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const active = allAlerts.filter((alert: any) => {
          const targets = alert.targets || [];
          const readBy = alert.readBy || [];
          return targets.includes(userCimStr) && !readBy.includes(userCimStr);
        });
        setOfficerAlerts(active);
      },
      (err) => {
        console.warn("Erro ao carregar alertas de oficiais:", err);
      }
    );

    return () => unsubscribe();
  }, [user?.cim]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!user?.cim) return;
    const userCimStr = user.cim.toString().trim();
    try {
      const alertRef = doc(db, "officersNotifications", alertId);
      await updateDoc(alertRef, {
        readBy: arrayUnion(userCimStr)
      });
      setOfficerAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success("Alerta confirmado com sucesso!");
    } catch (e) {
      console.error("Erro ao confirmar alerta:", e);
      toast.error("Erro ao confirmar alerta.");
    }
  };

  const [settings, setSettings] = useState<any>(null);
  const [loadingDecCriteria, setLoadingDecCriteria] = useState(true);
  const [decProgress, setDecProgress] = useState({
    pctBiblioteca: 100,
    totalAprendiz: 0,
    completedCount: 0,
    averageScore: 0,
  });

  useEffect(() => {
    if (!user?.uid) return;
    const calcDecRequirements = async () => {
      try {
        const cacheKeyDec = `gomau_dec_progress_${user.uid}`;
        const cachedDec = localStorage.getItem(cacheKeyDec);
        if (cachedDec) {
          try {
            const parsed = JSON.parse(cachedDec);
            if (Date.now() - parsed.timestamp < 5 * 60 * 1000) { // 5 minutos
              setDecProgress(parsed.data);
              setLoadingDecCriteria(false);
              return;
            }
          } catch (e) {
            console.warn("Erro ao ler cache de decProgress:", e);
          }
        }

        // Library completeness with 1-hour cache to avoid reading all contents on every render
        const cacheKeyContents = "gomau_contents_aprendiz";
        const cachedContents = localStorage.getItem(cacheKeyContents);
        let aprendizConts: any[] = [];
        let loadedContentsFromCache = false;

        if (cachedContents) {
          try {
            const parsed = JSON.parse(cachedContents);
            if (Date.now() - parsed.timestamp < 1 * 60 * 60 * 1000) { // 1 hora
              aprendizConts = parsed.data;
              loadedContentsFromCache = true;
            }
          } catch (e) {
            console.warn("Erro ao decodificar cache de conteúdos:", e);
          }
        }

        if (!loadedContentsFromCache) {
          const contentsSnap = await getDocs(query(collection(db, "contents")));
          const allConts = contentsSnap.docs.map((doc) => ({
            id: doc.id,
            grauMinimo: doc.data().grauMinimo
          }));
          aprendizConts = allConts.filter(
            (c: any) => c.grauMinimo === "Aprendiz",
          );
          try {
            localStorage.setItem(cacheKeyContents, JSON.stringify({
              timestamp: Date.now(),
              data: aprendizConts
            }));
          } catch (storageErr) {
            console.warn("Falha ao salvar cache de conteúdos:", storageErr);
          }
        }

        const readingsSnap = await getDocs(
          query(
            collection(db, "reading_progress"),
            where("userId", "==", user.uid),
          ),
        );
        const userReads = readingsSnap.docs.map((doc) => doc.data() as any);
        const readIds = new Set(userReads.map((r: any) => r.contentId));

        const totalAp = aprendizConts.length;
        const compCount = aprendizConts.filter((c: any) =>
          readIds.has(c.id),
        ).length;
        const pctBib =
          totalAp > 0 ? Math.round((compCount / totalAp) * 100) : 100;

        // Course Progress Average
        const courseProgressSnap = await getDocs(
          query(
            collection(db, "courseProgress"),
            where("userId", "==", user.uid),
          ),
        );
        const progressList = courseProgressSnap.docs.map(
          (doc) => doc.data() as any,
        );
        let totalScores = 0;
        let scoresCount = 0;
        progressList.forEach((p: any) => {
          if (p.scores) {
            Object.values(p.scores).forEach((val: any) => {
              totalScores += Number(val);
              scoresCount++;
            });
          }
        });
        const avgScore =
          scoresCount > 0
            ? Math.round(totalScores / scoresCount)
            : progressList.some(
                  (p: any) =>
                    p.completedLessons && p.completedLessons.length > 0,
                )
              ? 80
              : 0;

        const resultData = {
          pctBiblioteca: pctBib,
          totalAprendiz: totalAp,
          completedCount: compCount,
          averageScore: avgScore,
        };

        setDecProgress(resultData);

        try {
          localStorage.setItem(cacheKeyDec, JSON.stringify({
            timestamp: Date.now(),
            data: resultData
          }));
        } catch (storageErr) {
          console.warn("Falha ao salvar cache de decProgress:", storageErr);
        }
      } catch (err) {
        console.error("Error calculating condecorações metrics:", err);
      } finally {
        setLoadingDecCriteria(false);
      }
    };
    calcDecRequirements();
  }, [user]);

  useEffect(() => {
    async function loadData() {
      if (!user?.uid) return;
      
      // Load recent contents with cache (15 minutes)
      let contents: any[] = [];
      let loadedContentsCache = false;
      const cacheKeyRecentContents = "gomau_recent_contents";
      const cachedRecentContents = localStorage.getItem(cacheKeyRecentContents);
      if (cachedRecentContents) {
        try {
          const parsed = JSON.parse(cachedRecentContents);
          if (Date.now() - parsed.timestamp < 15 * 60 * 1000) { // 15 mins
            contents = parsed.data;
            loadedContentsCache = true;
          }
        } catch (e) {
          console.warn("Erro ao ler cache de recentContents:", e);
        }
      }

      if (!loadedContentsCache) {
        try {
          const qContents = query(collection(db, "contents"), limit(3));
          const contentsSnap = await getDocs(qContents);
          contents = contentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          localStorage.setItem(cacheKeyRecentContents, JSON.stringify({
            timestamp: Date.now(),
            data: contents
          }));
        } catch (err) {
          console.error("Erro ao carregar conteúdos recentes:", err);
        }
      }
      setRecentContents(contents);

      // Load recent history
      const qHistory = query(
        collection(db, "history"),
        where("userId", "==", user.uid),
        orderBy("data", "desc"),
        limit(5),
      );
      const historySnap = await getDocs(qHistory);
      setRecentAtvs(historySnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Fetch General Settings with cache (1 hour)
      let settingsData: any = null;
      let loadedSettingsCache = false;
      const cacheKeySettings = "gomau_general_settings";
      const cachedSettings = localStorage.getItem(cacheKeySettings);
      if (cachedSettings) {
        try {
          const parsed = JSON.parse(cachedSettings);
          if (Date.now() - parsed.timestamp < 1 * 60 * 60 * 1000) { // 1 hour
            settingsData = parsed.data;
            loadedSettingsCache = true;
          }
        } catch (e) {
          console.warn("Erro ao ler cache de generalSettings:", e);
        }
      }

      if (!loadedSettingsCache) {
        try {
          const settingsDoc = await getDoc(doc(db, "settings", "general"));
          if (settingsDoc.exists()) {
            settingsData = settingsDoc.data();
            localStorage.setItem(cacheKeySettings, JSON.stringify({
              timestamp: Date.now(),
              data: settingsData
            }));
          }
        } catch (e) {
          console.log("No general settings found or error fetching", e);
        }
      }

      if (settingsData) {
        setSettings(settingsData);
        if (settingsData.diasPrazoResumo) {
          setDiasPrazoResumo(settingsData.diasPrazoResumo);
        }
      }

      // Fetch pending readings
      try {
        const qReadings = query(
          collection(db, "reading_progress"),
          where("userId", "==", user.uid),
          where("status", "==", "pendente"),
        );
        const readingsSnap = await getDocs(qReadings);
        setPendingReadings(
          readingsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        );
      } catch (e) {
        console.log("No reading progress found or error fetching", e);
      }

      // Time in role
      if (user.createdAt) {
        const joinedOn = user.createdAt?.toDate
          ? user.createdAt.toDate()
          : new Date(user.createdAt);

        if (!isNaN(joinedOn.getTime())) {
          const now = new Date();
          const diffInMonths =
            (now.getFullYear() - joinedOn.getFullYear()) * 12 +
            now.getMonth() -
            joinedOn.getMonth();
          setMesesComoMembro(Math.max(0, diffInMonths));
        } else {
          setMesesComoMembro(0);
        }
      }

      if (user.grau !== "Mestre") {
        // Fetch rules with cache (1 hour)
        let ruleData: any = null;
        let loadedRulesCache = false;
        const cacheKeyRules = `gomau_rules_${user.grau}`;
        const cachedRules = localStorage.getItem(cacheKeyRules);
        if (cachedRules) {
          try {
            const parsed = JSON.parse(cachedRules);
            if (Date.now() - parsed.timestamp < 1 * 60 * 60 * 1000) { // 1 hour
              ruleData = parsed.data;
              loadedRulesCache = true;
            }
          } catch (e) {
            console.warn("Erro ao ler cache de rules:", e);
          }
        }

        if (!loadedRulesCache) {
          try {
            const qRules = query(
              collection(db, "evolutionRules"),
              where("grauOrigem", "==", user.grau),
            );
            const rulesSnap = await getDocs(qRules);
            if (!rulesSnap.empty) {
              ruleData = rulesSnap.docs[0].data();
              localStorage.setItem(cacheKeyRules, JSON.stringify({
                timestamp: Date.now(),
                data: ruleData
              }));
            }
          } catch (errRules) {
            console.error("Erro ao carregar regras de evolução:", errRules);
          }
        }

        if (ruleData) {
          setRule(ruleData);
        }

        // Fetch approved pranchas for progress
        const qPranchas = query(
          collection(db, "requests"),
          where("userId", "==", user.uid),
          where("status", "==", "aprovado"),
        );
        const pranchasSnap = await getDocs(qPranchas);
        const pranchasCount = pranchasSnap.docs.filter((d) =>
          d.data().tipo?.toLowerCase().includes("prancha"),
        ).length;
        setPranchasAprovadas(pranchasCount);
      }

      // Fetch Birthdays of the Month with cache
      try {
        const cacheKeyBirthdays = "gomau_monthly_birthdays";
        const cachedBirthdays = localStorage.getItem(cacheKeyBirthdays);
        const currentMonth = new Date().getMonth() + 1;
        let monthlyBirthdays: any[] = [];
        let loadedBirthdaysFromCache = false;

        if (cachedBirthdays) {
          try {
            const parsed = JSON.parse(cachedBirthdays);
            // Cache is valid if it's the same month and was saved less than 12 hours ago
            if (parsed.month === currentMonth && (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000)) {
              monthlyBirthdays = parsed.data;
              loadedBirthdaysFromCache = true;
            }
          } catch (e) {
            console.warn("Erro ao ler cache de aniversariantes:", e);
          }
        }

        if (!loadedBirthdaysFromCache) {
          const usersSnap = await getDocs(query(collection(db, "users")));
          monthlyBirthdays = usersSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() as any) }))
            .filter((u) => {
              if (!u.dataNascimento) return false;
              let month = -1;
              if (u.dataNascimento.includes("-")) {
                month = parseInt(u.dataNascimento.split("-")[1]);
              } else if (u.dataNascimento.includes("/")) {
                month = parseInt(u.dataNascimento.split("/")[1]);
              }
              return month === currentMonth;
            })
            .sort((a, b) => {
              const getDay = (dateStr: string) => {
                if (dateStr.includes("-")) return parseInt(dateStr.split("-")[2]);
                if (dateStr.includes("/")) return parseInt(dateStr.split("/")[0]);
                return 0;
              };
              return getDay(a.dataNascimento) - getDay(b.dataNascimento);
            });
          
          try {
            localStorage.setItem(cacheKeyBirthdays, JSON.stringify({
              month: currentMonth,
              timestamp: Date.now(),
              data: monthlyBirthdays
            }));
          } catch (storageErr) {
            console.warn("Falha ao salvar cache de aniversariantes:", storageErr);
          }
        }

        setBirthdays(monthlyBirthdays);

        // Detect if logged-in user is celebrating their birthday today
        const hasBirthdayToday =
          user?.dataNascimento &&
          (() => {
            let day = -1;
            let month = -1;
            if (user.dataNascimento.includes("-")) {
              month = parseInt(user.dataNascimento.split("-")[1]);
              day = parseInt(user.dataNascimento.split("-")[2]);
            } else if (user.dataNascimento.includes("/")) {
              month = parseInt(user.dataNascimento.split("/")[1]);
              day = parseInt(user.dataNascimento.split("/")[0]);
            }
            const now = new Date();
            return day === now.getDate() && month === now.getMonth() + 1;
          })();

        const getTodayDateStr = () => {
          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, "0");
          const dd = String(now.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        };
        const todayStr = getTodayDateStr();

        if (hasBirthdayToday) {
          const qReceived = query(
            collection(db, "birthday_messages"),
            where("toUserId", "==", user.uid),
            where("dateStr", "==", todayStr),
          );
          try {
            const snap = await getDocs(qReceived);
            const msgs = snap.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as any),
            }));
            msgs.sort((a, b) => {
              const tA = a.sentAt?.toDate ? a.sentAt.toDate().getTime() : 0;
              const tB = b.sentAt?.toDate ? b.sentAt.toDate().getTime() : 0;
              return tB - tA;
            });
            setReceivedMessages(msgs);
          } catch (errReceived) {
            console.error(
              "Error loading received birthday messages:",
              errReceived,
            );
          }
        }

        // Check who we have congratulated today
        try {
          const qSent = query(
            collection(db, "birthday_messages"),
            where("fromUserId", "==", user.uid),
            where("dateStr", "==", todayStr),
          );
          const sentSnap = await getDocs(qSent);
          const sentMap: Record<string, boolean> = {};
          sentSnap.docs.forEach((doc) => {
            sentMap[doc.data().toUserId] = true;
          });
          setCongratulatedIds(sentMap);
        } catch (errSent) {
          console.error("Error loading sent messages:", errSent);
        }
      } catch (e) {
        console.error("Error loading birthdays:", e);
      }
    }
    loadData();
  }, [user]);

  // Calculate Progress %
  let progressPercentage = 100;
  let missingPranchas = 0;
  let missingMonths = 0;

  if (user?.grau === "Mestre") {
    progressPercentage = 100;
  } else if (rule) {
    const reqPranchas = rule.quantidadePranchas || 1;
    const reqMeses = rule.tempoMinimoMeses || 1;
    const pctPranchas = Math.min(100, (pranchasAprovadas / reqPranchas) * 100);
    const pctMeses = Math.min(100, (mesesComoMembro / reqMeses) * 100);
    // Average of the two for a general progress visualization (ignoring instrucoes/presenca for now as they are static mocks)
    progressPercentage = Math.round((pctPranchas + pctMeses) / 2);
    missingPranchas = Math.max(0, reqPranchas - pranchasAprovadas);
    missingMonths = Math.max(0, reqMeses - mesesComoMembro);
  } else if (user?.grau !== "Mestre") {
    progressPercentage = 0; // Wait for rule to load
  }

  // Birthday helpers and actions
  const isUserBirthdayToday = (birthdateStr?: string) => {
    if (!birthdateStr) return false;
    let day = -1;
    let month = -1;
    if (birthdateStr.includes("-")) {
      month = parseInt(birthdateStr.split("-")[1]);
      day = parseInt(birthdateStr.split("-")[2]);
    } else if (birthdateStr.includes("/")) {
      month = parseInt(birthdateStr.split("/")[1]);
      day = parseInt(birthdateStr.split("/")[0]);
    }
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() + 1;
  };

  const hasBirthdayToday =
    user?.dataNascimento && isUserBirthdayToday(user.dataNascimento);

  const genericSuggestions = [
    "Desejo muita luz, saúde e vigor na sua caminhada de vida, meu Irmão!",
    "Que o G∴A∴D∴U∴ derrame ricas bênçãos sobre sua vida, lar e família!",
    "Parabéns, meu querido Irmão! Paz, harmonia, sabedoria e prosperidade sempre.",
    "Grande abraço fraterno pelo seu dia! Vida longa ao nobre obreiro!",
  ];

  // States and hooks for manual PWA Installation
  const [deferredPrompt, setDeferredPrompt] = useState<any>(
    (window as any).deferredPWAInstallPrompt || null,
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    const localFlag = localStorage.getItem("pwa-installed-gomau") === "true";
    return isStandalone || localFlag;
  });
  const [showAutoInstallOverlay, setShowAutoInstallOverlay] =
    useState<boolean>(false);
  const [isPreparingInstallation, setIsPreparingInstallation] =
    useState<boolean>(false);

  useEffect(() => {
    // Crab and parse the URL search parameters to bypass iframe storage partitioning
    const searchParams = new URLSearchParams(window.location.search);
    const isAutoPromptUrl = searchParams.get("pwa-auto-prompt") === "true";
    if (isAutoPromptUrl) {
      localStorage.setItem("pwa-auto-prompt", "true");
      // Clean URL search parameters to keep the client's address clean and professional
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("pwa-auto-prompt");
      window.history.replaceState({}, "", cleanUrl.toString());
    }

    // Detect if running in standalone/installed mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    const localFlag = localStorage.getItem("pwa-installed-gomau") === "true";
    const currentlyInstalled = isStandalone || localFlag;
    setIsInstalled(currentlyInstalled);

    // Check if we came with the auto-prompt flag active in localStorage
    const shouldAutoPrompt = localStorage.getItem("pwa-auto-prompt") === "true";
    const isInIframe = window.self !== window.top;
    if (shouldAutoPrompt && !isInIframe && !currentlyInstalled) {
      setShowAutoInstallOverlay(true);
      // Trigger auto install sequence securely after a short render delay
      setTimeout(() => {
        handleForceInstall();
      }, 600);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPWAInstallPrompt = e;
    };

    window.addEventListener("beforeinstallprompt", handler);

    const customHandler = (e: any) => {
      setDeferredPrompt(e.detail);
      (window as any).deferredPWAInstallPrompt = e.detail;
    };
    window.addEventListener("pwa-prompt-ready", customHandler as EventListener);

    const onAppInstalled = () => {
      setIsInstalled(true);
      localStorage.setItem("pwa-installed-gomau", "true");
      toast.success("GOMAU instalado com sucesso!");
      setShowAutoInstallOverlay(false);
      localStorage.removeItem("pwa-auto-prompt");
    };

    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener(
        "pwa-prompt-ready",
        customHandler as EventListener,
      );
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleForceInstall = async () => {
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      localStorage.setItem("pwa-auto-prompt", "true");
      // Secure URL-based propagation to bypass Chrome storage isolation on iframe environments
      const url = new URL(window.location.href);
      url.searchParams.set("pwa-auto-prompt", "true");
      window.open(url.toString(), "_blank");
      toast.success("Abrindo GOMAU em aba principal segura...", { icon: "🚀" });
      return;
    }

    // Let's grab the prompt from state or global window namespace
    let promptObj = deferredPrompt || (window as any).deferredPWAInstallPrompt;
    if (promptObj) {
      try {
        promptObj.prompt();
        const { outcome } = await promptObj.userChoice;
        if (outcome === "accepted") {
          setDeferredPrompt(null);
          (window as any).deferredPWAInstallPrompt = null;
          setIsInstalled(true);
          localStorage.setItem("pwa-installed-gomau", "true");
          setShowAutoInstallOverlay(false);
          localStorage.removeItem("pwa-auto-prompt");
        }
      } catch (err) {
        console.error("PWA install error:", err);
      }
      return;
    }

    // Active polling waiting loop for modern Chrome compatibility
    setIsPreparingInstallation(true);
    toast("Ativando instalador do Chrome...", { icon: "⚙️", duration: 2500 });

    // Explicitly trigger service worker registration one more time to force Chrome metadata alignment
    if ("serviceWorker" in navigator) {
      try {
        const base = (window as any).pwaBasePath || "/";
        await navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
      } catch (swErr) {
        console.log("SW hot registration skip:", swErr);
      }
    }

    // Poll for up to 4 seconds to catch deferred prompt when browser registers the PWA criteria
    let elapsed = 0;
    const pollInterval = setInterval(async () => {
      elapsed += 150;
      promptObj = deferredPrompt || (window as any).deferredPWAInstallPrompt;

      if (promptObj) {
        clearInterval(pollInterval);
        setIsPreparingInstallation(false);
        try {
          promptObj.prompt();
          const { outcome } = await promptObj.userChoice;
          if (outcome === "accepted") {
            setDeferredPrompt(null);
            (window as any).deferredPWAInstallPrompt = null;
            setIsInstalled(true);
            localStorage.setItem("pwa-installed-gomau", "true");
            setShowAutoInstallOverlay(false);
            localStorage.removeItem("pwa-auto-prompt");
          }
        } catch (promptErr) {
          console.error("Erro ao invocar prompt nativo carregado:", promptErr);
        }
      } else if (elapsed >= 4000) {
        clearInterval(pollInterval);
        setIsPreparingInstallation(false);

        // Fallback if browser absolutely doesn't support automatic API trigger (like Incognito tab)
        const isIOS =
          /iPad|iPhone|iPod/.test(navigator.userAgent) &&
          !(window as any).MSStream;
        if (isIOS) {
          toast(
            'No iOS, clique em "Compartilhar" e depois "Adicionar à Tela de Início".',
            { icon: "ℹ️" },
          );
        } else {
          toast(
            'Clique nos 3 pontinhos do menu do Chrome e clique em "Instalar Aplicativo".',
            { icon: "ℹ️" },
          );
        }
      }
    }, 150);
  };

  const handleSendWishes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForWishes || !user || !wishesText.trim()) return;

    setSendingWishes(true);
    try {
      const getTodayDateStr = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };
      const payload = {
        toUserId: selectedUserForWishes.id,
        fromUserId: user.uid,
        fromUserName: user.nome || "Nobre Irmão",
        fromUserGrau: user.grau || "Aprendiz",
        message: wishesText.trim(),
        sentAt: serverTimestamp(),
        dateStr: getTodayDateStr(),
      };

      await addDoc(collection(db, "birthday_messages"), payload);

      setCongratulatedIds((prev) => ({
        ...prev,
        [selectedUserForWishes.id]: true,
      }));
      setSelectedUserForWishes(null);
      setWishesText("");

      toast.success(
        `Parabéns enviados com sucesso para o Ir∴ ${selectedUserForWishes.nome}!`,
      );
    } catch (err) {
      console.error("Erro ao enviar congratulações:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, "birthday_messages");
      } catch (inner) {
        toast.error("Erro ao enviar felicitação ao Irmão.");
      }
    } finally {
      setSendingWishes(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Overlay de Instalação Automática Segura (Para Mobile) */}
      {showAutoInstallOverlay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0A0E1A]/95 backdrop-blur-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,transparent_70%)] pointer-events-none"></div>

          <div className="relative w-full max-w-lg p-8 sm:p-10 rounded-3xl border-2 border-[#D4AF37] bg-gradient-to-b from-[#12192c] to-[#0a0e1a] shadow-[0_0_60px_rgba(212,175,55,0.3)] text-center animate-in scale-in duration-300">
            {/* Botão de Fechar */}
            <button
              onClick={() => {
                setShowAutoInstallOverlay(false);
                localStorage.removeItem("pwa-auto-prompt");
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors cursor-pointer text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              &times;
            </button>

            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#AA841B] flex items-center justify-center text-black mb-6 shadow-[0_0_25px_rgba(212,175,55,0.5)] animate-pulse">
              <Download size={38} className="stroke-[2.5]" />
            </div>

            <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest font-sans px-3 py-1 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20">
              Instalação de Alta Performance
            </span>

            <h2 className="text-white text-xl sm:text-2xl font-black uppercase tracking-wider font-cinzel mt-4">
              Instalar G∴O∴M∴A∴U∴ no Celular
            </h2>

            <p className="text-xs text-gray-400 mt-3 max-w-sm mx-auto leading-relaxed font-sans">
              Pronto para a fixação permanente na sua tela de início. Clique no
              botão abaixo para concluir a instalação oficial instantaneamente.
            </p>

            <div className="mt-8">
              <button
                onClick={handleForceInstall}
                disabled={isPreparingInstallation}
                className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-[#D4AF37] text-black font-black rounded-2xl hover:bg-white hover:text-black hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-widest shadow-xl shadow-[#D4AF37]/30 cursor-pointer animate-pulse"
              >
                {isPreparingInstallation ? (
                  <>
                    <span className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin"></span>
                    ATIVANDO INSTALADOR DO CHROME...
                  </>
                ) : (
                  <>
                    <Download size={16} className="stroke-[3]" /> CONCLUIR
                    INSTALAÇÃO
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#D4AF37]/15 gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-100 flex items-center gap-3 truncate tracking-wider font-cinzel">
            PAINEL DO IR∴
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-widest mt-1.5 font-sans font-semibold">
            Templo de Estudos & Acompanhamento de Evolução
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
              if (confirm("Deseja encerrar sua sessão?")) {
                await logout();
                navigate("/login");
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-950/20 text-rose-400 border border-red-900/40 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest cursor-pointer shadow-md"
          >
            <Lock size={14} /> Fechar Sessão
          </button>
        </div>
      </header>

      {/* Alertas de Oficiais da Loja */}
      {officerAlerts.length > 0 && (
        <div id="officers-alerts-container" className="flex flex-col gap-4 mb-8 mt-4 animate-fade-in">
          {officerAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-gradient-to-r from-amber-950/20 to-[#0F172A] border-l-4 border-[#D4AF37] p-5 rounded-r-xl border border-y-[#D4AF37]/30 border-r-[#D4AF37]/30 shadow-lg shadow-[#D4AF37]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                  <Shield size={18} className="animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#D4AF37] tracking-wider uppercase">
                      {alert.sender || "Oficial ∴"}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      • {alert.timestamp ? new Date(alert.timestamp).toLocaleDateString("pt-BR") + " " + new Date(alert.timestamp).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'}) : "Agora"}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white mt-1 uppercase tracking-wide">
                    Você tem uma convocação / escala!
                  </h3>
                  <p className="text-xs text-gray-300 mt-1.5 whitespace-pre-line leading-relaxed font-medium">
                    {alert.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAcknowledgeAlert(alert.id)}
                className="shrink-0 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black font-black px-4 py-2 rounded-lg text-[11px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/10 cursor-pointer self-end sm:self-center"
              >
                Ciente & Confirmar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quadro de Aniversário do Próprio Membro (Temporário para data correta) */}
      {hasBirthdayToday && (
        <div className="bg-gradient-to-b from-[#1E293B]/90 to-[#0F172A]/95 border border-[#D4AF37] p-6 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.18)] mb-8">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Cake size={160} className="text-[#D4AF37]" strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.3)] text-[#D4AF37] animate-bounce shrink-0">
                <Cake size={24} />
              </div>
              <div>
                <h2 className="text-[#D4AF37] font-black uppercase tracking-widest text-base sm:text-lg font-cinzel">
                  Feliz Aniversário, Meu Irmão!
                </h2>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold font-sans">
                  A G∴O∴M∴A∴U∴ celebra a sua vida e caminhada iniciática
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-3xl mb-6 font-serif italic">
              "Que o Grande Arquiteto do Universo derrame sobre sua
              inteligência, saúde e vigor abundantes bênçãos. Receba o fraterno
              abraço e os sinceros cumprimentos de seus amados Irmãos de jornada
              hoje."
            </p>

            <div className="border-t border-[#D4AF37]/20 pt-5">
              <h3 className="text-[#D4AF37] uppercase font-bold tracking-wider text-[11px] mb-4 flex items-center gap-2 font-cinzel">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                Mensagens de Felicitações dos IIr∴ ({receivedMessages.length})
              </h3>

              {receivedMessages.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-black/30 border border-white/5 font-serif italic text-xs text-gray-500">
                  Os votos de carinho e fraternidade dos seus Irmãos aparecerão
                  aqui ao longo do dia...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
                  {receivedMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-xl bg-black/50 border border-[#D4AF37]/10 flex flex-col gap-2 shadow-inner"
                    >
                      <p className="text-gray-100 text-xs sm:text-sm font-serif leading-relaxed italic">
                        "{msg.message}"
                      </p>
                      <div className="flex items-center justify-between text-[10px] mt-1 border-t border-white/5 pt-2">
                        <span className="text-[#D4AF37] font-semibold font-cinzel">
                          Ir∴ {msg.fromUserName}
                        </span>
                        <span className="text-gray-500 font-mono text-[9px]">
                          {msg.fromUserGrau}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aniversariantes do Mês */}
      {birthdays.length > 0 && (
        <div className="bg-[#0A0E1A]/60 backdrop-blur-xl border border-[#D4AF37]/25 p-6 rounded-2xl relative overflow-hidden shadow-2xl">
          {/* Sacred geometry visual hints */}
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
            <Cake size={140} className="text-[#D4AF37]" strokeWidth={1} />
          </div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D4AF37]/15 rounded-xl flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/25">
                <Cake size={18} />
              </div>
              <div>
                <h3 className="text-[#D4AF37] font-black uppercase tracking-widest text-[#D4AF37] text-xs font-cinzel">
                  Aniversariantes do Mês
                </h3>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold header-decor">
                  Celebrando a saúde e egrégora dos nossos IIr∴
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {birthdays.map((b) => {
                const day = b.dataNascimento.includes("-")
                  ? b.dataNascimento.split("-")[2]
                  : b.dataNascimento.split("/")[0];
                const isToday = parseInt(day) === new Date().getDate();
                const isMe = b.id === user?.uid;
                const alreadyCongratulated = congratulatedIds[b.id];

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      if (isToday && !isMe && !alreadyCongratulated) {
                        setSelectedUserForWishes(b);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 select-none",
                      isToday
                        ? isMe
                          ? "bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.15)] opacity-95"
                          : alreadyCongratulated
                            ? "bg-slate-900/40 border-slate-700/30 opacity-70"
                            : "bg-[#D4AF37]/10 border-[#D4AF37]/45 shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:border-[#D4AF37]/90 active:scale-[0.98] cursor-pointer"
                        : "bg-black/40 border-[#D4AF37]/10 hover:border-[#D4AF37]/30",
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#05070A] border border-[#D4AF37]/20 flex items-center justify-center text-xs font-black text-[#D4AF37] flex-shrink-0">
                      {day}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-slate-100 truncate">
                        {b.nome}
                      </p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                        {b.grau}
                      </p>
                    </div>

                    {isToday && (
                      <div
                        className="flex items-center gap-1.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isMe ? (
                          <span className="text-[9px] text-[#D4AF37] font-black uppercase tracking-wider animate-pulse bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-1.5 py-0.5 rounded">
                            Seu Dia!
                          </span>
                        ) : alreadyCongratulated ? (
                          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                            Enviado
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserForWishes(b);
                            }}
                            type="button"
                            className="text-[9px] bg-[#D4AF37] text-black font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all shadow hover:brightness-110 active:scale-95 cursor-pointer"
                          >
                            Felicitar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal / Popup de Parabenizar com Framer Motion */}
      <AnimatePresence>
        {selectedUserForWishes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-[#0A0E1A] border border-[#D4AF37] w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.25)] relative"
            >
              {/* Gold Top line */}
              <div className="h-1.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

              {/* Close button */}
              <button
                onClick={() => {
                  setSelectedUserForWishes(null);
                  setWishesText("");
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-[#D4AF37] transition-all p-1.5 bg-black/50 border border-white/5 rounded-lg"
              >
                <X size={16} />
              </button>

              <form
                onSubmit={handleSendWishes}
                className="p-6 sm:p-7 flex flex-col gap-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/25 shrink-0 mt-0.5">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-slate-100 font-extrabold uppercase tracking-wide text-sm font-cinzel">
                      Parabenizar Irmão
                    </h3>
                    <p className="text-xs text-[#D4AF37] font-semibold font-serif italic mt-0.5">
                      Ir∴ {selectedUserForWishes.nome}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Envie votos fraternizados para fortalecer nossa egrégora.
                    </p>
                  </div>
                </div>

                {/* Suggestions Quick Tags */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-sans flex items-center gap-1.5">
                    <MessageSquare size={11} className="text-[#D4AF37]" />{" "}
                    Sugestões de Votos Fraternos:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {genericSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setWishesText(s)}
                        className="text-[10.5px] text-left text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 bg-black/40 hover:bg-black/60 border border-white/5 py-1.5 px-3 rounded-lg transition-all truncate shrink-0 cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message input area */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-sans">
                    Sua Mensagem:
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={wishesText}
                    onChange={(e) => setWishesText(e.target.value)}
                    placeholder="Escreva seus votos fraternos de saúde, sabedoria e prosperidade..."
                    className="w-full bg-black/60 border border-[#D4AF37]/25 focus:border-[#D4AF37] rounded-xl text-xs text-white p-3.5 outline-none font-serif leading-relaxed placeholder-slate-600 focus:shadow-[0_0_10px_rgba(212,175,55,0.15)] transition-all resize-none"
                    maxLength={400}
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserForWishes(null);
                      setWishesText("");
                    }}
                    className="px-4 py-2.5 bg-transparent border border-white/10 text-gray-400 rounded-xl hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={sendingWishes || !wishesText.trim()}
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#D4AF37] hover:brightness-110 disabled:brightness-50 disabled:cursor-not-allowed text-black font-extrabold rounded-xl transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-[#D4AF37]/20"
                  >
                    {sendingWishes ? (
                      "Enviando..."
                    ) : (
                      <>
                        Enviar <Send size={11} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Grau */}
        <div className="bg-[#0A0E1A]/60 backdrop-blur-xl border border-[#D4AF37]/30 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[145px] transition-all hover:border-[#D4AF37]/60 group shadow-xl">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-40"></div>
          <Award
            className="text-[#D4AF37]/80 mb-3 group-hover:scale-110 transition-transform"
            size={28}
          />
          <h3 className="text-[9px] tracking-[0.2em] font-black text-[#D4AF37] uppercase mb-1.5 font-cinzel">
            GRAU ATUAL
          </h3>
          <p className="text-lg font-black text-slate-200 tracking-wider uppercase font-cinzel">
            {user?.grau}
          </p>
        </div>

        {/* Cargo */}
        <div className="bg-[#0A0E1A]/60 backdrop-blur-xl border border-[#D4AF37]/15 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[145px] transition-all hover:border-[#D4AF37]/35 group shadow-xl sm:order-3 lg:order-none">
          <Eye
            className="text-slate-400 mb-3 group-hover:scale-110 transition-transform"
            size={28}
          />
          <h3 className="text-[9px] tracking-[0.2em] font-black text-slate-500 uppercase mb-1.5 font-cinzel">
            CARGO EM OFÍCIO
          </h3>
          <p className="text-base font-bold text-slate-300 tracking-wide uppercase">
            {user?.cargo || "Nenhum"}
          </p>
        </div>

        {/* Progresso do Grau */}
        <div className="bg-[#0A0E1A]/60 backdrop-blur-xl border border-[#D4AF37]/15 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center min-h-[145px] col-span-1 sm:col-span-2 sm:order-2 lg:order-none shadow-xl hover:border-[#D4AF37]/30 transition-all">
          <TrendingUp
            className="text-[#D4AF37] absolute right-6 top-6 opacity-[0.05] pointer-events-none"
            size={56}
          />
          <div className="w-full">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-[9px] tracking-[0.15em] font-black text-slate-500 uppercase font-cinzel">
                Evolução do Obreiro
              </h3>
              <span className="text-base font-black text-[#D4AF37] tracking-wider font-mono">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-black/45 border border-white/5 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="bg-[#D4AF37] h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(212,175,55,0.7)]"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>

            {user?.grau === "Mestre" ? (
              <div className="flex items-center gap-2 text-xs font-serif italic text-[#D4AF37]/90">
                <Award size={13} className="shrink-0" /> Plenitude maçônica e
                magistério alcançados.
              </div>
            ) : !rule ? (
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                Aguardando regras sob sigilo...
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  {missingMonths <= 0 ? (
                    <CheckCircle
                      size={12}
                      className="text-emerald-500 shrink-0"
                    />
                  ) : (
                    <Lock size={12} className="text-[#D4AF37]/70 shrink-0" />
                  )}
                  <span
                    className={
                      missingMonths <= 0
                        ? "text-slate-500 line-through font-medium"
                        : "text-slate-400 font-medium"
                    }
                  >
                    Tempo: {mesesComoMembro} / {rule.tempoMinimoMeses} meses
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  {missingPranchas <= 0 ? (
                    <CheckCircle
                      size={12}
                      className="text-emerald-500 shrink-0"
                    />
                  ) : (
                    <Lock size={12} className="text-[#D4AF37]/70 shrink-0" />
                  )}
                  <span
                    className={
                      missingPranchas <= 0
                        ? "text-slate-500 line-through font-medium"
                        : "text-slate-400 font-medium"
                    }
                  >
                    Pranchas: {pranchasAprovadas} / {rule.quantidadePranchas}{" "}
                    aprovadas
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <Lock size={12} className="text-[#D4AF37]/40 shrink-0" />
                  <span className="text-slate-500 font-medium">
                    Instruções: Sob tutela regulamentar /{" "}
                    {rule.quantidadeInstrucoes}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Two columns: Conteúdos and Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Últimos Conteúdos */}
        <div className="bg-[#0A0E1A]/50 backdrop-blur-xl border border-[#D4AF37]/15 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-5 border-b border-[#D4AF37]/15 flex justify-between items-center bg-black/10">
            <h2 className="text-xs tracking-widest font-black uppercase text-[#D4AF37] font-cinzel">
              Instruções de Estudo
            </h2>
            <button
              onClick={() => navigate("/contents")}
              className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Ver Biblioteca →
            </button>
          </div>
          <div className="p-6 flex flex-col gap-4">
            {recentContents.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 font-mono uppercase tracking-widest">
                Nenhum conteúdo sob sigilo revelado.
              </p>
            ) : (
              recentContents.map((content) => (
                <div
                  key={content.id}
                  className="flex gap-4 p-4 rounded-xl bg-black/45 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all duration-300 items-start group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#05070A] border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] flex-shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                    {content.tipo === "video" ? (
                      <BookOpen size={16} />
                    ) : (
                      <FileText size={16} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] uppercase tracking-widest text-[#D4AF37]/90 border border-[#D4AF37]/30 px-1.5 py-0.5 rounded font-mono font-bold bg-[#D4AF37]/5">
                        {content.tipo}
                      </span>
                    </div>
                    <h4 className="text-slate-200 font-bold text-xs truncate uppercase tracking-wide">
                      {content.titulo}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {content.descricao}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Últimas Atividades */}
        <div className="bg-[#0A0E1A]/50 backdrop-blur-xl border border-[#D4AF37]/15 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-5 border-b border-[#D4AF37]/15 flex justify-between items-center bg-black/10">
            <h2 className="text-xs tracking-widest font-black uppercase text-[#D4AF37] font-cinzel">
              Cadeia de Registros
            </h2>
            <button
              onClick={() => navigate("/history")}
              className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-[#D4AF37] transition-colors cursor-pointer font-sans"
            >
              Histórico →
            </button>
          </div>
          <div className="p-6 flex flex-col gap-5">
            {recentAtvs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 font-mono uppercase tracking-widest">
                Nenhum registro de atividades gravado.
              </p>
            ) : (
              recentAtvs.map((atv, i) => (
                <div key={atv.id} className="flex gap-4 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-lg bg-[#05070A] border border-[#D4AF37]/20 flex items-center justify-center text-slate-400 z-10 relative shadow-inner">
                      <Clock size={12} className="text-[#D4AF37]/70" />
                    </div>
                    {i < recentAtvs.length - 1 && (
                      <div className="w-[1px] h-full bg-[#D4AF37]/10 absolute top-8 bottom-[-20px]"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-3 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-slate-300 font-bold text-xs uppercase tracking-wide truncate">
                        {atv.titulo}
                      </h4>
                      <span className="text-[9px] text-slate-500 font-mono tracking-tighter shrink-0">
                        {atv.data}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {atv.descricao}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
