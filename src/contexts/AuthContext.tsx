import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { MASTER_ADMINS, TEST_USERS } from '../constants';

export interface AppUser {
  uid: string;
  nome: string;
  email: string;
  role: 'membro' | 'gestor' | 'admin';
  grau: string;
  loja: string;
  rito: string;
  cim: string;
  dataIniciacao?: string;
  cargo: string;
  status: string;
  telefone?: string;
  endereco?: string;
  photoUrl?: string;
  cpf?: string;
  dataNascimento?: string;
  emailVinculado?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  bairro?: string;
  rua?: string;
  numero?: string;
  estadoCivil?: string;
  esposa?: string;
  emergencia?: string;
  foneEmergencia?: string;
  qtdFilhos?: number;
  filhos?: { nome: string, dataNascimento: string }[];
  palavraSeguranca?: string;
  palavraUpdatedAt?: any;
  createdAt: any;
  lastOnline?: any;
  unlockedBooks?: string[];
  hasPremiumLibrary?: boolean;
  frequencia?: number;
  visitas?: number;
  condecoracoes?: string[];
  delegatedPastas?: string[];
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  sessionTimeout: number;
  logout: () => Promise<void>;
  dbQuotaExceeded?: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, sessionTimeout: 60, logout: async () => {}, dbQuotaExceeded: false });

export const useAuth = () => useContext(AuthContext);

// Configuração de Segurança: Tempo de inatividade antes do logout automático (em milissegundos)
const INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutos por padrão

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(60); // Padrão 60 minutos (atendendo pedido)
  const [dbQuotaExceeded, setDbQuotaExceeded] = useState(false);

  const logout = async () => {
    console.log("Executando Logout Geral...");
    sessionStorage.clear();
    localStorage.clear();
    try {
      await signOut(auth);
    } catch(e) {
      console.error('Erro no signOut:', e);
    }
    setUser(null);
    // Force clear indexedDB firebase local storage just in case
    try {
      indexedDB.deleteDatabase('firebaseLocalStorageDb');
    } catch(e) {}
  };

  const updateUserWithCache = (newUser: AppUser | null, uidArg?: string) => {
    setUser(newUser);
    if (newUser) {
      const uid = newUser.uid || uidArg;
      if (uid) {
        localStorage.setItem('gomau-profile-' + uid, JSON.stringify(newUser));
      }
      localStorage.setItem('gomau-last-profile', JSON.stringify(newUser));
    }
  };

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;
    let unsubscribeDelegations: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth State Changed:", firebaseUser?.email || "null");
      
      // Fetch dynamic settings early with local storage cache to minimize reads
      let loadedSettings = false;
      const cacheKeySettings = "gomau_general_settings";
      const cachedSettings = localStorage.getItem(cacheKeySettings);
      if (cachedSettings) {
        try {
          const parsed = JSON.parse(cachedSettings);
          // Cache validity: 1 hour
          if (Date.now() - parsed.timestamp < 1 * 60 * 60 * 1000) {
            if (parsed.data && parsed.data.tempoSessaoMin) {
              setSessionTimeout(parsed.data.tempoSessaoMin);
              loadedSettings = true;
            }
          }
        } catch (e) {}
      }

      if (!loadedSettings) {
        try {
          const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
          if (settingsDoc.exists()) {
             const sData = settingsDoc.data();
             if (sData.tempoSessaoMin) {
                setSessionTimeout(sData.tempoSessaoMin);
             }
             try {
               localStorage.setItem(cacheKeySettings, JSON.stringify({
                 timestamp: Date.now(),
                 data: sData
               }));
             } catch(se) {}
          }
        } catch (e: any) {
          console.warn("Failed to fetch custom session timeout, using default 60min", e);
          const isQuota = e?.code === 'resource-exhausted' || (e?.message && e.message.includes('Quota limit exceeded')) || (e?.message && e.message.includes('quota'));
          if (isQuota) {
             setDbQuotaExceeded(true);
          }
        }
      }

      if (firebaseUser) {
        // Cancel existing doc and delegation listeners
        if (unsubscribeDoc) unsubscribeDoc();
        if (unsubscribeDelegations) {
          unsubscribeDelegations();
          unsubscribeDelegations = null;
        }

        // Inicializa o timer de sessão global
        const SESSION_DURATION = sessionTimeout * 60 * 1000;
        const currentExpiresAt = localStorage.getItem('session_expires_at');
        if (!currentExpiresAt || parseInt(currentExpiresAt) < Date.now()) {
           localStorage.setItem('session_expires_at', (Date.now() + SESSION_DURATION).toString());
        }
        
        // SWR (Stale-While-Revalidate): Carregar dados em cache imediatamente
        const cachedProfileKey = 'gomau-profile-' + firebaseUser.uid;
        const cachedProfile = localStorage.getItem(cachedProfileKey) || localStorage.getItem('gomau-last-profile');
        let profileLoadedFromSWR = false;

        if (cachedProfile) {
          try {
            const parsed = JSON.parse(cachedProfile);
            if (parsed && parsed.uid === firebaseUser.uid) {
              console.log("SWR: Carregando perfil em cache imediatamente:", parsed.email);
              setUser(parsed);
              setLoading(false);
              profileLoadedFromSWR = true;
            }
          } catch (e) {
            console.error("Erro ao ler cache SWR do perfil:", e);
          }
        }

        if (!profileLoadedFromSWR) {
          setLoading(true);
        }
        console.log("Starting Auth Flow for:", firebaseUser.email);
        
        const originalEmail = firebaseUser.email || '';
        const cleanEmail = originalEmail.toLowerCase().trim();
        const isMaster = MASTER_ADMINS.includes(cleanEmail) || 
                         ['tazmaniacrvg@gmail.com', 'diogo.mourapedroso@gmail.com'].includes(cleanEmail);

        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);

          // First, check once if doc exists to handle resilient search
          const initialCheck = await getDoc(userDocRef);

          if (initialCheck.exists()) {
            console.log("Profile found by UID. Starting listener...");
            // Define a listener for real-time updates
            interface AuthUpdateHandler {
              (docSnap: any): void;
            }
            
            const handleUpdate: AuthUpdateHandler = (docSnap) => {
              if (docSnap.exists()) {
                const dbUser = docSnap.data();
                const userCimStr = dbUser.cim?.toString().trim();
                const isUserMaster = isMaster || userCimStr === '331' || userCimStr === '3330';
                const role = (isUserMaster || dbUser.role === 'gestor') ? 'gestor' : 'membro';
                
                const baseUser = { email: cleanEmail || dbUser.email || dbUser.emailVinculado || '', ...dbUser, uid: firebaseUser.uid, role } as AppUser;
                
                if (dbUser.cim) {
                  const cimStr = dbUser.cim.toString().trim();
                  const qDelegations = query(collection(db, 'adminPermissions'), where('cim', '==', cimStr));
                  
                  if (unsubscribeDelegations) {
                    unsubscribeDelegations();
                  }

                  unsubscribeDelegations = onSnapshot(qDelegations, (delegationSnap) => {
                    const delegatedPastas = delegationSnap.docs.map(d => d.data().pasta);
                    updateUserWithCache({ ...baseUser, delegatedPastas });
                    setLoading(false);
                  }, (err) => {
                    console.warn("Erro ao buscar delegações real-time:", err);
                    updateUserWithCache({ ...baseUser, delegatedPastas: [] });
                    setLoading(false);
                  });
                } else {
                  updateUserWithCache({ ...baseUser, delegatedPastas: [] });
                  setLoading(false);
                }
              }
            };

            const { onSnapshot: firestoreOnSnapshot } = await import('firebase/firestore');
            unsubscribeDoc = firestoreOnSnapshot(userDocRef, handleUpdate, (err: any) => {
              console.error("Firestore onSnapshot Error:", err);
              if (err?.code === 'resource-exhausted') {
                 console.warn("Cota do Firestore atingida no listener do perfil.");
              }
            });
            
            // Initial cleanup logic (Skip redundant cleanup queries if recently executed within 7 days)
            const cleanupKey = `gomau_cleanup_done_${firebaseUser.uid}`;
            const lastCleanup = localStorage.getItem(cleanupKey);
            let shouldCleanup = true;
            if (lastCleanup) {
              try {
                const parsedCleanup = JSON.parse(lastCleanup);
                if (Date.now() - parsedCleanup.timestamp < 7 * 24 * 60 * 60 * 1000) {
                  shouldCleanup = false;
                }
              } catch (e) {}
            }

            if (shouldCleanup) {
              const dbUser = initialCheck.data();
              const cleanCPF = dbUser.cpf ? dbUser.cpf.replace(/\D/g, '') : '';
              
              const qCleanup1 = query(collection(db, 'users'), where('email', '==', originalEmail));
              const qCleanup2 = query(collection(db, 'users'), where('email', '==', cleanEmail));
              
              const cleanupPromises: Promise<any>[] = [getDocs(qCleanup1), getDocs(qCleanup2)];
              if (cleanCPF) {
                cleanupPromises.push(getDocs(query(collection(db, 'users'), where('cpf', '==', dbUser.cpf))));
              }
              
              Promise.all(cleanupPromises).then(results => {
                const allToCleanup = results.flatMap(snap => snap.docs);
                const uniqueToCleanup = allToCleanup.filter((doc, index, self) => 
                   index === self.findIndex(d => d.id === doc.id) && doc.id !== firebaseUser.uid
                );
                uniqueToCleanup.forEach(async docSnap => {
                   try { 
                      console.log("Cleaning up redundant doc during login:", docSnap.id);
                      await deleteDoc(doc(db, 'users', docSnap.id)); 
                   } catch (e) {}
                });
                try {
                  localStorage.setItem(cleanupKey, JSON.stringify({ timestamp: Date.now() }));
                } catch(se) {}
              }).catch(e => console.error("Error in cleanupPromises:", e));
            }

          } else {
            console.log("UID não encontrado. Iniciando busca resiliente por E-mail...");
            // Resilient search logic (remains mostly same but will trigger onSnapshot once linked)
            const emailDocRef = doc(db, 'users', cleanEmail);
            const emailDoc = await getDoc(emailDocRef);
            
            let foundData: any = null;
            let sourceId: string | null = null;

            if (emailDoc.exists()) {
              foundData = emailDoc.data();
              sourceId = emailDoc.id;
            } else {
              const originalDoc = await getDoc(doc(db, 'users', originalEmail.trim()));
              if (originalDoc.exists()) {
                foundData = originalDoc.data();
                sourceId = originalDoc.id;
              } else {
                const queries = [
                  getDocs(query(collection(db, 'users'), where('email', '==', cleanEmail))),
                  getDocs(query(collection(db, 'users'), where('email', '==', originalEmail.trim()))),
                  getDocs(query(collection(db, 'users'), where('emailVinculado', '==', cleanEmail))),
                ];
                const results = await Promise.all(queries);
                const match = results.flatMap(s => s.docs).find(d => {
                  const e1 = (d.data().email || '').toLowerCase().trim();
                  const e2 = (d.data().emailVinculado || '').toLowerCase().trim();
                  return e1 === cleanEmail || e2 === cleanEmail;
                });
                if (match) {
                  foundData = match.data();
                  sourceId = match.id;
                }
              }
            }

            if (foundData) {
              console.log("Membro reconhecido. Vinculando UID e iniciando listener.");
              const newUser = {
                ...foundData,
                uid: firebaseUser.uid,
                updatedAt: serverTimestamp()
              };
              await setDoc(userDocRef, newUser, { merge: true });
              
              if (sourceId && sourceId !== firebaseUser.uid) {
                try { await deleteDoc(doc(db, 'users', sourceId)); } catch(e) {}
              }

              // Start listener now that doc is created
              const { onSnapshot: firestoreOnSnapshot } = await import('firebase/firestore');
              unsubscribeDoc = firestoreOnSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                  const dbUser = docSnap.data();
                  const userCimStr = dbUser.cim?.toString().trim();
                  const isUserMaster = isMaster || userCimStr === '331' || userCimStr === '3330';
                  const role = (isUserMaster || dbUser.role === 'gestor') ? 'gestor' : 'membro';
                  const baseUser = { email: cleanEmail || dbUser.email || dbUser.emailVinculado || '', ...dbUser, uid: firebaseUser.uid, role } as AppUser;

                  if (dbUser.cim) {
                    const cimStr = dbUser.cim.toString().trim();
                    const qDelegations = query(collection(db, 'adminPermissions'), where('cim', '==', cimStr));
                    
                    if (unsubscribeDelegations) {
                      unsubscribeDelegations();
                    }

                    unsubscribeDelegations = onSnapshot(qDelegations, (delegationSnap) => {
                      const delegatedPastas = delegationSnap.docs.map(d => d.data().pasta);
                      updateUserWithCache({ ...baseUser, delegatedPastas });
                      setLoading(false);
                    }, (err) => {
                      console.warn("Erro ao buscar delegações real-time:", err);
                      updateUserWithCache({ ...baseUser, delegatedPastas: [] });
                      setLoading(false);
                    });
                  } else {
                    updateUserWithCache({ ...baseUser, delegatedPastas: [] });
                    setLoading(false);
                  }
                }
              }, (err: any) => {
                console.error("Firestore onSnapshot Error:", err);
                if (err?.code === 'resource-exhausted') {
                   console.warn("Cota do Firestore atingida no listener do perfil.");
                }
              });
            } else {
              // New user (maybe Master)
              if (isMaster) {
                const adminUser: AppUser = {
                  uid: firebaseUser.uid,
                  nome: firebaseUser.displayName || 'Mestre Gestor',
                  email: cleanEmail,
                  role: 'gestor',
                  status: 'Ativo',
                  grau: 'Mestre',
                  loja: 'Jus Veritas 33',
                  rito: 'Emulação',
                  cargo: 'Mestre Instalado',
                  cim: '',
                  delegatedPastas: [],
                  createdAt: serverTimestamp() as any
                };
                try {
                  await setDoc(userDocRef, adminUser);
                } catch(setErr) {
                   console.error("Erro ao salvar perfil do Mestre no BD. Criando sessão local...", setErr);
                }
                // The setDoc will trigger the snapshot if we set it up, but for master we can just set state
                updateUserWithCache(adminUser);
                setLoading(false);
              } else {
                console.warn("Acesso Negado: Membro não encontrado.");
                setUser(null);
                setLoading(false);
              }
            }
          }
        } catch (error: any) {
          console.error("Erro crítico na leitura de perfil do AuthContext:", error);
          const isQuota = error?.code === 'resource-exhausted' || (error?.message && error.message.includes('Quota limit exceeded')) || (error?.message && error.message.includes('quota'));
          if (isQuota) {
             console.warn("Cota do Firestore excedida (resource-exhausted).");
             setDbQuotaExceeded(true);
          }

          // Recuperação Dinâmica Offline: Caso falhe a leitura do Firestore, tenta carregar o último perfil do cache local
          const cachedProfile = localStorage.getItem('gomau-profile-' + firebaseUser.uid) || localStorage.getItem('gomau-last-profile');
          if (cachedProfile) {
            try {
              const parsed = JSON.parse(cachedProfile);
              console.log("Modo de Emergência: Carregando perfil do cache devido a erro de conexão:", parsed.email);
              updateUserWithCache(parsed);
              setLoading(false);
              return;
            } catch (parseErr) {
              console.error("Erro ao analisar perfil no modo de emergência:", parseErr);
            }
          }

          if (isMaster) {
             console.warn("Entrando no modo fallback para Mestre (DB Quota atingida ou erro).");
             const fallbackMaster: AppUser = {
                uid: firebaseUser.uid,
                nome: firebaseUser.displayName || 'Mestre Gestor',
                email: cleanEmail,
                role: 'gestor',
                status: 'Ativo',
                grau: 'Mestre',
                loja: 'Jus Veritas 33',
                rito: 'Emulação',
                cargo: 'Mestre',
                cim: '',
                createdAt: new Date().toISOString()
             };
             updateUserWithCache(fallbackMaster);
          } else {
             setUser(null);
          }
          setLoading(false);
        }
      } else {
        if (unsubscribeDoc) unsubscribeDoc();
        if (unsubscribeDelegations) {
          unsubscribeDelegations();
          unsubscribeDelegations = null;
        }
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
      if (unsubscribeDelegations) unsubscribeDelegations();
    };
  }, []);

  // Monitor de Inatividade (Auto-Logout)
  useEffect(() => {
    if (!user?.uid) return;

    let timer: any;

    const logoutUser = async () => {
      console.warn("Sessão expirada por inatividade. Limpando dados...");
      await logout();
      window.location.href = '/login?reason=timeout';
    };

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      const timeoutMs = sessionTimeout * 60 * 1000;
      timer = setTimeout(logoutUser, timeoutMs);
    };

    // Eventos para detectar atividade (Mouse, Teclado, Touch e Scroll)
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Inicia o timer
    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [user?.uid, sessionTimeout]);

  const contextValue = React.useMemo(() => ({
    user,
    loading,
    sessionTimeout,
    logout,
    dbQuotaExceeded
  }), [user, loading, sessionTimeout, dbQuotaExceeded]);

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
