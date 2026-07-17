import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp, deleteApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getFirestore, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Shield, Database, Key, Settings, CheckCircle, RefreshCw, AlertTriangle, Server, Sparkles, UserCheck, ArrowRight, Trash2 } from 'lucide-react';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

export function FirebaseSetup() {
  const navigate = useNavigate();
  
  // Custom Configuration state
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [firestoreDatabaseId, setFirestoreDatabaseId] = useState('(default)');

  // Wizard States
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isSaved, setIsSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testError, setTestError] = useState<string | null>(null);
  const [usingDefault, setUsingDefault] = useState(true);

  // Step 2 Login State
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Step 3 Profile State
  const [gestorNome, setGestorNome] = useState('');
  const [gestorCim, setGestorCim] = useState('');
  const [gestorCpf, setGestorCpf] = useState('');
  const [gestorRito, setGestorRito] = useState('Emulação');
  const [gestorCargo, setGestorCargo] = useState('Mestre Instalado');
  const [palavraSagrada, setPalavraSagrada] = useState('FORTITUDO');
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Load existing custom config on mount
  useEffect(() => {
    const stored = localStorage.getItem('gomau_custom_firebase_config');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setApiKey(parsed.apiKey || '');
        setAuthDomain(parsed.authDomain || '');
        setProjectId(parsed.projectId || '');
        setStorageBucket(parsed.storageBucket || '');
        setMessagingSenderId(parsed.messagingSenderId || '');
        setAppId(parsed.appId || '');
        setFirestoreDatabaseId(parsed.firestoreDatabaseId || '(default)');
        setIsSaved(true);
        setUsingDefault(false);
        setActiveStep(2); // If already custom configured, proceed to login/seed
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Monitor Auth state of CURRENT initialized firebase app
  useEffect(() => {
    let firebaseConfig = defaultFirebaseConfig;
    const storedConfig = localStorage.getItem('gomau_custom_firebase_config');
    if (storedConfig) {
      try {
        firebaseConfig = JSON.parse(storedConfig);
      } catch (e) {}
    }

    try {
      // Initialize or get the default app
      let currentApp;
      const apps = getApps();
      if (apps.length > 0) {
        currentApp = apps[0];
      } else {
        currentApp = initializeApp(firebaseConfig);
      }
      
      const authInstance = getAuth(currentApp);
      const unsubscribe = authInstance.onAuthStateChanged((user) => {
        if (user) {
          setLoggedInUser(user);
          setActiveStep(3); // Advance to create profile
        } else {
          setLoggedInUser(null);
          if (storedConfig) {
            setActiveStep(2);
          } else {
            setActiveStep(1);
          }
        }
      });
      return unsubscribe;
    } catch (e) {
      console.error("Auth state monitor error:", e);
    }
  }, [isSaved]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestStatus('testing');
    setTestError(null);

    const newConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
      firestoreDatabaseId: firestoreDatabaseId.trim() === '' ? '(default)' : firestoreDatabaseId.trim()
    };

    if (!newConfig.apiKey || !newConfig.projectId) {
      setTestStatus('failed');
      setTestError('A Chave de API (apiKey) e o ID do Projeto (projectId) são obrigatórios.');
      return;
    }

    try {
      // Test the configuration by initializing a temporary app
      const testAppName = 'tempTestApp_' + Date.now();
      const tempApp = initializeApp(newConfig, testAppName);
      const tempAuth = getAuth(tempApp);
      const tempDb = getFirestore(tempApp, newConfig.firestoreDatabaseId);

      // Simple test to see if instance was created and we can do basic operations
      if (tempAuth && tempDb) {
        // Save to localStorage
        localStorage.setItem('gomau_custom_firebase_config', JSON.stringify(newConfig));
        setIsSaved(true);
        setUsingDefault(false);
        setTestStatus('success');
        
        // Clean up temp app
        await deleteApp(tempApp);

        // Force reload after 1.5s to reinitialize the main Firebase client
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setTestStatus('failed');
      setTestError(`Falha ao conectar: ${err.message || 'Verifique as credenciais.'}`);
    }
  };

  const handleRestoreDefault = () => {
    if (window.confirm("Deseja realmente voltar para o banco de dados padrão da plataforma GOMAU? Seus dados de teste atuais serão mantidos apenas na base customizada.")) {
      localStorage.removeItem('gomau_custom_firebase_config');
      localStorage.removeItem('gomau_security_configs');
      localStorage.removeItem('gomau_general_settings');
      localStorage.clear();
      sessionStorage.clear();
      
      setApiKey('');
      setAuthDomain('');
      setProjectId('');
      setStorageBucket('');
      setMessagingSenderId('');
      setAppId('');
      setFirestoreDatabaseId('(default)');
      
      setIsSaved(false);
      setUsingDefault(true);
      setActiveStep(1);
      
      alert("Banco de dados padrão restaurado! Reiniciando a plataforma...");
      window.location.reload();
    }
  };

  const handleStep2Login = async () => {
    setLoginLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      let storedConfig = localStorage.getItem('gomau_custom_firebase_config');
      let config = defaultFirebaseConfig;
      if (storedConfig) {
        config = JSON.parse(storedConfig);
      }

      const apps = getApps();
      const currentApp = apps[0] || initializeApp(config);
      const authInstance = getAuth(currentApp);

      await signInWithPopup(authInstance, provider);
    } catch (err: any) {
      console.error(err);
      alert(`Erro no login: ${err.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleInitializeAndSeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) return;
    if (!gestorNome || !gestorCim || !gestorCpf) {
      alert("Por favor, preencha todos os campos do perfil do Gestor.");
      return;
    }

    setSeedLoading(true);
    try {
      let storedConfig = localStorage.getItem('gomau_custom_firebase_config');
      let config = defaultFirebaseConfig;
      if (storedConfig) {
        config = JSON.parse(storedConfig);
      }

      const apps = getApps();
      const currentApp = apps[0] || initializeApp(config);
      const dbInstance = getFirestore(currentApp, config.firestoreDatabaseId);

      // 1. Seed general settings
      await setDoc(doc(dbInstance, 'settings', 'general'), {
        tempoSessaoMin: 60,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 2. Seed security config with default word and Loja
      const expDate = new Date();
      expDate.setMonth(expDate.getMonth() + 3); // 3 months validity
      
      await setDoc(doc(dbInstance, 'configs', 'security'), {
        lojas: [
          {
            nome: "Sua Loja Modelo GOMAU",
            prefixo: gestorCim.slice(0, 2) || "77",
            palavraAtual: palavraSagrada.trim().toUpperCase(),
            expiraEm: expDate
          }
        ],
        palavraAtual: palavraSagrada.trim().toUpperCase(),
        expiraEm: expDate,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 3. Seed user profile as primary Gestor
      await setDoc(doc(dbInstance, 'users', loggedInUser.uid), {
        uid: loggedInUser.uid,
        nome: gestorNome.trim(),
        email: loggedInUser.email.toLowerCase().trim(),
        role: 'gestor',
        status: 'Ativo',
        grau: 'Mestre',
        loja: 'Sua Loja Modelo GOMAU',
        rito: gestorRito,
        cargo: gestorCargo,
        cim: gestorCim.trim(),
        cpf: gestorCpf.trim(),
        createdAt: serverTimestamp(),
        lastOnline: serverTimestamp()
      }, { merge: true });

      setSeedSuccess(true);
      sessionStorage.setItem('ritual_completed', 'true');
      
      alert("🎉 Parabéns! Plataforma e Banco de Dados inicializados com sucesso! Você será redirecionado para o Painel Administrativo.");
      navigate('/');
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert(`Erro na inicialização automática do banco de dados: ${err.message}\nVerifique se as Regras de Segurança do Firestore permitem escrita para usuários logados.`);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030508] text-gray-200 font-sans py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-center">
      {/* Sacred geometric background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-[#D4AF37]/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-3xl mx-auto w-full bg-[#05070A]/95 border border-[#D4AF37]/30 rounded-3xl p-8 sm:p-10 shadow-[0_0_60px_rgba(212,175,55,0.08)] relative z-10">
        
        {/* Cardinal Corner Ornaments */}
        <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#D4AF37]/50"></div>
        <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#D4AF37]/50"></div>
        <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[#D4AF37]/50"></div>
        <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#D4AF37]/50"></div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex p-3 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/30 text-[#D4AF37] mb-4 animate-pulse">
            <Server size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white uppercase font-cinzel" style={{ fontFamily: 'Cinzel' }}>
            Assistente de Instalação
          </h1>
          <p className="text-xs text-gray-400 tracking-[0.25em] uppercase font-bold mt-1">
            Conexão e Inicialização do Firebase Independente
          </p>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent mx-auto mt-4"></div>
        </div>

        {/* Step Indicator bar */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className={`p-3 rounded-xl border transition-all text-center ${activeStep === 1 ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-white' : 'bg-black/40 border-[#1e293b] text-gray-500'}`}>
            <p className="text-[10px] font-black uppercase tracking-wider">Passo 1</p>
            <p className="text-xs font-bold mt-0.5">Conectar Banco</p>
          </div>
          <div className={`p-3 rounded-xl border transition-all text-center ${activeStep === 2 ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-white' : 'bg-black/40 border-[#1e293b] text-gray-500'}`}>
            <p className="text-[10px] font-black uppercase tracking-wider">Passo 2</p>
            <p className="text-xs font-bold mt-0.5">Identificar Gestor</p>
          </div>
          <div className={`p-3 rounded-xl border transition-all text-center ${activeStep === 3 ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-white' : 'bg-black/40 border-[#1e293b] text-gray-500'}`}>
            <p className="text-[10px] font-black uppercase tracking-wider">Passo 3</p>
            <p className="text-xs font-bold mt-0.5">Criar Estruturas</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-5 mb-8 flex gap-4 items-start">
          <Sparkles className="text-[#D4AF37] shrink-0 mt-0.5 animate-pulse" size={20} />
          <div className="text-xs leading-relaxed text-gray-300">
            <strong className="text-[#D4AF37]">Modo Versão Distribuível Ativo:</strong> Esta tela permite que compradores da plataforma GOMAU liguem o sistema ao seu próprio banco de dados Firebase de forma instantânea. Suas configurações atuais são salvas localmente e <strong>não afetam em nada a plataforma principal do vendedor</strong>.
          </div>
        </div>

        {/* STEP 1: CONFIGURE CREDENTIALS */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-[#D4AF37] uppercase tracking-wider">1. Credenciais do Firebase</h3>
                <p className="text-xs text-gray-400 mt-0.5">Insira os dados do aplicativo Web fornecidos no console do seu Firebase</p>
              </div>
              {!usingDefault && (
                <button
                  type="button"
                  onClick={handleRestoreDefault}
                  className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/30 text-red-300 hover:text-red-200 border border-red-500/20 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} />
                  Restaurar Padrão
                </button>
              )}
            </div>

            <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">API Key (Chave de API)</label>
                <input 
                  type="text" 
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-black/60 border border-[#1e293b] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Project ID (ID do Projeto)</label>
                <input 
                  type="text" 
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="meu-projeto-gomau"
                  className="w-full bg-black/60 border border-[#1e293b] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Auth Domain (Domínio de Autenticação)</label>
                <input 
                  type="text" 
                  required
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="meu-projeto-gomau.firebaseapp.com"
                  className="w-full bg-black/60 border border-[#1e293b] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Storage Bucket (Armazenamento)</label>
                <input 
                  type="text" 
                  required
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  placeholder="meu-projeto-gomau.appspot.com"
                  className="w-full bg-black/60 border border-[#1e293b] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Messaging Sender ID</label>
                <input 
                  type="text" 
                  required
                  value={messagingSenderId}
                  onChange={(e) => setMessagingSenderId(e.target.value)}
                  placeholder="82930281928"
                  className="w-full bg-black/60 border border-[#1e293b] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">App ID</label>
                <input 
                  type="text" 
                  required
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:82930281928:web:abcdef..."
                  className="w-full bg-black/60 border border-[#1e293b] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Firestore Database ID (Opcional - Deixe '(default)')</label>
                <input 
                  type="text" 
                  value={firestoreDatabaseId}
                  onChange={(e) => setFirestoreDatabaseId(e.target.value)}
                  placeholder="(default)"
                  className="w-full bg-black/60 border border-[#1e293b] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              {testError && (
                <div className="sm:col-span-2 bg-red-950/40 border border-red-500/30 text-red-200 p-4 rounded-xl text-xs flex gap-3 items-start">
                  <AlertTriangle className="text-red-400 shrink-0" size={16} />
                  <span>{testError}</span>
                </div>
              )}

              {testStatus === 'success' && (
                <div className="sm:col-span-2 bg-green-950/40 border border-green-500/30 text-green-200 p-4 rounded-xl text-xs flex gap-3 items-start">
                  <CheckCircle className="text-green-400 shrink-0" size={16} />
                  <span>Conexão bem-sucedida! Redirecionando para sincronização...</span>
                </div>
              )}

              <div className="sm:col-span-2 pt-4">
                <button
                  type="submit"
                  disabled={testStatus === 'testing' || testStatus === 'success'}
                  className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#c2a033] hover:to-[#b59223] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#D4AF37]/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {testStatus === 'testing' ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Testando Conexão e Salvando...
                    </>
                  ) : (
                    <>
                      <Database size={16} />
                      Salvar e Testar Conexão
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: LOG IN GESTOR ACCOUNT */}
        {activeStep === 2 && (
          <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-3 duration-500 py-4">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 flex items-center justify-center mx-auto mb-2">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#D4AF37] uppercase tracking-wider">Banco Conectado com Sucesso!</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                A plataforma agora está operando no seu novo Firebase. O próximo passo é fazer o Login com Google para que possamos obter seu UID e e-mail oficiais para criar sua conta de Gestor Principal.
              </p>

              <div className="pt-6">
                <button
                  onClick={handleStep2Login}
                  disabled={loginLoading}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loginLoading ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Aguardando Google Login...
                    </>
                  ) : (
                    <>
                      <UserCheck size={16} />
                      Autenticar Gestor com Google
                    </>
                  )}
                </button>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setActiveStep(1)}
                  className="text-gray-500 hover:text-white text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer"
                >
                  ← Voltar para Passo 1 (Editar Credenciais)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIGURE GESTOR PROFILE & SEED */}
        {activeStep === 3 && loggedInUser && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div>
              <h3 className="text-lg font-bold text-[#D4AF37] uppercase tracking-wider">3. Inicialização e Semeadura</h3>
              <p className="text-xs text-gray-400 mt-0.5">Preencha seus dados de Mestre Gestor. Nós criaremos todas as coleções do banco e seu perfil automaticamente.</p>
            </div>

            <div className="bg-black/40 border border-[#1e293b] p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                {loggedInUser.photoURL ? (
                  <img src={loggedInUser.photoURL} alt="Foto" className="w-10 h-10 rounded-full border border-[#D4AF37]/30" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-full flex items-center justify-center font-bold">
                    M
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-white leading-none">{loggedInUser.displayName || 'Mestre Obreiro'}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{loggedInUser.email}</p>
                </div>
              </div>
              <span className="bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                ADMIN CONECTADO
              </span>
            </div>

            <form onSubmit={handleInitializeAndSeed} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={gestorNome}
                  onChange={(e) => setGestorNome(e.target.value)}
                  placeholder="Nome do Mestre Gestor"
                  className="w-full bg-black/60 border border-[#1e293b] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">CIM (Cadastro do Obreiro)</label>
                <input 
                  type="text" 
                  required
                  value={gestorCim}
                  onChange={(e) => setGestorCim(e.target.value)}
                  placeholder="Ex: 777"
                  className="w-full bg-black/60 border border-[#1e293b] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">CPF do Gestor</label>
                <input 
                  type="text" 
                  required
                  value={gestorCpf}
                  onChange={(e) => setGestorCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full bg-black/60 border border-[#1e293b] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Palavra Sagrada Inicial (Acesso Trimestral)</label>
                <input 
                  type="text" 
                  required
                  value={palavraSagrada}
                  onChange={(e) => setPalavraSagrada(e.target.value)}
                  placeholder="Ex: FORTITUDO"
                  className="w-full bg-black/60 border border-[#1e293b] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white focus:outline-none uppercase font-mono tracking-widest"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Rito de Trabalho</label>
                <select 
                  value={gestorRito}
                  onChange={(e) => setGestorRito(e.target.value)}
                  className="w-full bg-black/60 border border-[#1e293b] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white focus:outline-none"
                >
                  <option value="Emulação">Rito de Emulação (York)</option>
                  <option value="REAA">R.E.A.A. (Escocês Antigo e Aceito)</option>
                  <option value="Adonhiramita">Rito Adonhiramita</option>
                  <option value="Schroeder">Rito Schroeder</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Cargo em Loja</label>
                <input 
                  type="text" 
                  required
                  value={gestorCargo}
                  onChange={(e) => setGestorCargo(e.target.value)}
                  className="w-full bg-black/60 border border-[#1e293b] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 pt-4">
                <button
                  type="submit"
                  disabled={seedLoading || seedSuccess}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {seedLoading ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Instalando e Configurando Banco de Dados...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Instalar Tabelas e Inicializar Plataforma
                    </>
                  )}
                </button>
              </div>

              <div className="sm:col-span-2 text-center pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    let storedConfig = localStorage.getItem('gomau_custom_firebase_config');
                    let config = defaultFirebaseConfig;
                    if (storedConfig) {
                      config = JSON.parse(storedConfig);
                    }
                    const apps = getApps();
                    const currentApp = apps[0] || initializeApp(config);
                    await signOut(getAuth(currentApp));
                    setLoggedInUser(null);
                    setActiveStep(2);
                  }}
                  className="text-gray-500 hover:text-white text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer"
                >
                  ← Desconectar Conta Google
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer/Navigation to normal login */}
        <div className="mt-10 pt-6 border-t border-[#1e293b]/50 text-center flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
            {isSaved ? "🟢 Servidor Customizado Conectado" : "⚪ Usando Conexão Padrão GOMAU"}
          </p>
          <button
            onClick={() => {
              navigate('/login');
              window.location.reload();
            }}
            className="text-[#D4AF37] hover:text-[#D4AF37]/80 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
          >
            Voltar para Tela de Login
            <ArrowRight size={12} />
          </button>
        </div>

      </div>
    </div>
  );
}
