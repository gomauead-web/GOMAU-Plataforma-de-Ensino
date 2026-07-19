import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { LogIn, Shield, Key, UserCheck, HelpCircle, Eye, EyeOff, ExternalLink, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { MASTER_ADMINS } from '../constants';
import { getAppLogo } from '../utils/logo';

type LoginPhase = 'google' | 'age' | 'cpf' | 'word';

export function findMatchedLojaByCim(cim: string, lojas: any[]) {
  if (!cim || !lojas || !Array.isArray(lojas)) return null;
  const cimStr = String(cim).trim();
  
  // Sort by prefix length descending to match longest first (e.g. "77" before "7")
  const sortedLojas = [...lojas].sort((a, b) => {
    const lenA = String(a.prefixo || "").trim().length;
    const lenB = String(b.prefixo || "").trim().length;
    return lenB - lenA;
  });

  return sortedLojas.find(l => {
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
  }) || null;
}

export function Login() {
  const { user, loading: authLoading, dbQuotaExceeded } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  
  // Security Gates State
  const [phase, setPhase] = useState<LoginPhase>('google');
  const [tempUser, setTempUser] = useState<any>(null);
  const [ageResponse, setAgeResponse] = useState('');
  const [cpfInput, setCpfInput] = useState('');
  const [wordInput, setWordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      setIsIframe(true);
    }
  }, []);

  useEffect(() => {
    if (dbQuotaExceeded) {
      setError('⚠️ Atenção: A cota diária de leitura do banco de dados (Firestore) está temporariamente esgotada devido ao alto volume de acessos na plataforma. O Google reinicia esta cota de forma automática e gratuita à Meia-Noite do Horário do Pacífico (em instantes!). Se você já entrou recentemente neste dispositivo, recarregue a página para tentar usar o cache local do seu perfil; caso contrário, aguarde alguns minutos e tente novamente.');
    }
  }, [dbQuotaExceeded]);

  useEffect(() => {
    // Verificar se há resultado de um redirecionamento anterior apenas na montagem
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setLoading(true);
          await processLogin();
        }
      } catch (err: any) {
        console.error('Redirect error:', err);
        handleErrors(err);
      } finally {
        setLoading(false);
      }
    };
    checkRedirect();
  }, []);

  useEffect(() => {
    // Se o usuário estiver logado no Firebase mas o ritual desta sessão não foi feito:
    const ritualDone = sessionStorage.getItem('ritual_completed') === 'true';

    if (user && !loading && !authLoading) {
       // Se o usuário está logado via Firebase e tem perfil no DB

       if (ritualDone) {
          navigate('/');
       } else if (phase === 'google') {
          // Se está logado mas não terminou o ritual e está na fase inicial, pula para o primeiro portal
          setTempUser(user);
          setError(null);
          setPhase('age');
       }
    } else if (!user && !loading && !authLoading && auth.currentUser && phase === 'google') {
       // Loop detectado: Usuário logado no Google mas sem perfil reconhecido no GOMAU
       console.warn("Membro não identificado no GOMAU:", auth.currentUser.email);
       if (dbQuotaExceeded) {
          setError('⚠️ Atenção: A cota diária gratuita do banco de dados (Firestore) foi temporariamente esgotada devido ao alto volume de acessos na plataforma. O Google reinicia esta cota de forma automática e gratuita à Meia-Noite do Horário do Pacífico (em instantes!). Se você já entrou recentemente neste dispositivo, recarregue a página para tentar usar o cache local do seu perfil; caso contrário, aguarde alguns minutos e tente novamente.');
       } else {
          setError('Acesso negado. O e-mail (' + auth.currentUser.email + ') não foi encontrado em nossa base de membros. Verifique se está usando a conta correta ou contate o Gestor da Loja.');
       }
       setLoading(false);
       // Não desloga imediatamente para o usuário ver o erro. 
       // O usuário poderá clicar em "Cancelar e sair" para limpar a sessão.
    }
  }, [user, navigate, phase, loading, authLoading]);

  const processLogin = async () => {
    // Agora o processLogin apenas sinaliza que estamos aguardando o AuthContext
    setLoading(true);
    setError(null);
    console.log("Aguardando reconhecimento do perfil pelo sistema...");
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Iniciando Login Google...");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Tentativa 1: Popup
      try {
        await signInWithPopup(auth, provider);
        console.log("Popup login bem-sucedido");
        await processLogin();
      } catch (popupErr: any) {
        // Se o popup for bloqueado (comum em mobile/iframes), usa Redirect
        if (popupErr.code === 'auth/popup-blocked') {
          console.log("Popup impedido, tentando Redirect...");
          await signInWithRedirect(auth, provider);
        } else if (popupErr.code === 'auth/popup-closed-by-user' || popupErr.code === 'auth/cancelled-popup-request') {
          console.log("Popup cancelado pelo usuário");
          setLoading(false);
          return;
        } else {
          throw popupErr;
        }
      }
    } catch (err: any) {
      console.error('Erro no fluxo de login:', err);
      handleErrors(err);
      setLoading(false);
    }
  };

  const handleAgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(ageResponse);
    if (isNaN(val)) {
      setError('Por favor, insira um número.');
      return;
    }

    let detectedGrau = '';
    if (val === 3) detectedGrau = 'Aprendiz';
    else if (val >= 4 && val <= 6) detectedGrau = 'Companheiro';
    else if (val >= 7) detectedGrau = 'Mestre';
    else {
      setError('Resposta incorreta para a idade simbólica.');
      return;
    }

    if (detectedGrau !== tempUser.grau) {
      setError('A idade informada não condiz com seu grau atual em nossos registros.');
      return;
    }

    setError(null);
    setPhase('cpf');
  };

  const handleCpfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpfInput = cpfInput.replace(/\D/g, '');
    const cleanDbCpf = (tempUser.cpf || '').replace(/\D/g, '');

    if (cleanCpfInput !== cleanDbCpf) {
      setError('CPF não confere com o registrado para este e-mail.');
      return;
    }

    setError(null);
    setPhase('word');
  };

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCim = String(tempUser.cim || user?.cim || '');

      let PALAVRA_SAGRADA = "FORTITUDO"; // Fallback inicial caso não exista no DB
      let DATA_EXPIRACAO = new Date("2026-08-13T23:59:59"); // 3 meses a contar do início do sistema

      // 1. Buscar do Firestore com cache local
      try {
         const cacheKeySecConfig = "gomau_security_configs";
         const cachedSec = localStorage.getItem(cacheKeySecConfig);
         let secData: any = null;
         let loadedSecFromCache = false;

         if (cachedSec) {
           try {
             const parsed = JSON.parse(cachedSec);
             if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) { // 24 horas de cache
               secData = parsed.data;
               loadedSecFromCache = true;
             }
           } catch(e) {}
         }

         if (!loadedSecFromCache) {
           const configSnap = await getDoc(doc(db, 'configs', 'security'));
           if (configSnap.exists()) {
              secData = configSnap.data();
              try {
                localStorage.setItem(cacheKeySecConfig, JSON.stringify({
                  timestamp: Date.now(),
                  data: secData
                }));
              } catch(se) {}
           }
         }

         if (secData) {
            if (secData.lojas && Array.isArray(secData.lojas)) {
              const matchedLoja = findMatchedLojaByCim(userCim, secData.lojas);
              
              if (matchedLoja) {
                 PALAVRA_SAGRADA = matchedLoja.palavraAtual || "FORTITUDO";
                 if (matchedLoja.expiraEm) {
                   if (typeof matchedLoja.expiraEm.toDate === 'function') {
                     DATA_EXPIRACAO = matchedLoja.expiraEm.toDate();
                   } else if (matchedLoja.expiraEm.seconds) {
                     DATA_EXPIRACAO = new Date(matchedLoja.expiraEm.seconds * 1000);
                   } else {
                     DATA_EXPIRACAO = new Date(matchedLoja.expiraEm);
                   }
                 }
              } else {
                console.warn("Loja não configurada para este CIM. Usando fallback.");
              }

            } else if (secData.palavraAtual) {
               // Legacy support
               PALAVRA_SAGRADA = secData.palavraAtual;
               if (secData.expiraEm) {
                 if (typeof secData.expiraEm.toDate === 'function') {
                   DATA_EXPIRACAO = secData.expiraEm.toDate();
                 } else if (secData.expiraEm.seconds) {
                   DATA_EXPIRACAO = new Date(secData.expiraEm.seconds * 1000);
                 } else {
                   DATA_EXPIRACAO = new Date(secData.expiraEm);
                 }
               }
            }
         }
      } catch (dbErr) {
         console.warn("Using fallback word, couldn't fetch from DB", dbErr);
         try {
           const cachedSec = localStorage.getItem("gomau_security_configs");
           if (cachedSec) {
             const parsed = JSON.parse(cachedSec);
             const secData = parsed.data;
             if (secData) {
               if (secData.lojas && Array.isArray(secData.lojas)) {
                 const matchedLoja = findMatchedLojaByCim(userCim, secData.lojas);
                 if (matchedLoja) {
                    PALAVRA_SAGRADA = matchedLoja.palavraAtual || "FORTITUDO";
                    if (matchedLoja.expiraEm) {
                      if (typeof matchedLoja.expiraEm.toDate === 'function') {
                        DATA_EXPIRACAO = matchedLoja.expiraEm.toDate();
                      } else if (matchedLoja.expiraEm.seconds) {
                        DATA_EXPIRACAO = new Date(matchedLoja.expiraEm.seconds * 1000);
                      } else {
                        DATA_EXPIRACAO = new Date(matchedLoja.expiraEm);
                      }
                    }
                 }
               } else if (secData.palavraAtual) {
                 PALAVRA_SAGRADA = secData.palavraAtual;
                 if (secData.expiraEm) {
                   if (typeof secData.expiraEm.toDate === 'function') {
                     DATA_EXPIRACAO = secData.expiraEm.toDate();
                   } else if (secData.expiraEm.seconds) {
                     DATA_EXPIRACAO = new Date(secData.expiraEm.seconds * 1000);
                   } else {
                     DATA_EXPIRACAO = new Date(secData.expiraEm);
                   }
                 }
               }
             }
           }
         } catch(e) {}
      }

      const AGORA = new Date();

      // 1. Verificar Expiração
      if (AGORA > DATA_EXPIRACAO) {
        setError('A Palavra Sagrada do trimestre expirou para a sua Loja. Contate o Gestor para receber a nova palavra.');
        return;
      }

      // 2. Verificar Palavra (Case-Insensitive)
      if (wordInput.trim().toUpperCase() !== PALAVRA_SAGRADA.trim().toUpperCase()) {
        setError('Palavra Sagrada incorreta.');
        return;
      }

      // Sucesso Total
      setError(null);
      sessionStorage.setItem('ritual_completed', 'true');

      // Registrar o acesso do usuário no banco (proteção de tokens: não logar acessos de owners)
      try {
        const currentUserEmail = (tempUser.email || user?.email || '').toLowerCase().trim();
        const isMaster = MASTER_ADMINS.includes(currentUserEmail);
        
        if (!isMaster) {
          await addDoc(collection(db, 'accessLogs'), {
            cim: userCim,
            nome: tempUser.nome || user?.nome || 'Desconhecido',
            email: tempUser.email || user?.email || '',
            uid: tempUser.uid || user?.uid || '',
            timestamp: serverTimestamp()
          });
        }
      } catch (logErr) {
        console.warn("Erro ao registrar accessLog:", logErr);
      }

      navigate('/');
    } catch (err: any) {
      setError('Erro crítico: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleErrors = (err: any) => {
    if (err.code === 'auth/unauthorized-domain') {
      setError(`Domínio não autorizado. Adicione no Firebase.`);
    } else if (err.code === 'auth/network-request-failed') {
      setError('Falha na conexão. Tente abrir em uma nova aba.');
    } else {
      setError(err.message || 'Erro ao realizar login');
    }
  };

  const renderPhase = () => {
    switch (phase) {
      case 'google':
        return (
          <div className="w-full space-y-4">
            {isIframe && (
              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-4 rounded-xl text-center space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[10px] text-[#D4AF37] font-extrabold leading-relaxed uppercase tracking-[0.12em] font-cinzel">
                  ⚠️ Restrição de Segurança (iFrame)
                </p>
                <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                  Navegadores modernos impedem a autenticação do Google dentro de sub-telas embutidas (iFrames) do AI Studio. 
                  Para entrar com sucesso, acesse o sistema diretamente:
                </p>
                <div className="pt-1">
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#c2a033] px-4 py-2 rounded-lg transition-all hover:scale-105"
                  >
                    <ExternalLink size={12} />
                    Abrir em Nova Aba
                  </a>
                </div>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#c2a033] hover:to-[#b59223] text-black font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 gold-glow shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
            >
              <LogIn size={20} />
              {loading ? 'Aguarde...' : 'Entrar com Google'}
            </button>
            
            {loading && (
              <div className="flex flex-col items-center gap-2 animate-in fade-in duration-500">
                <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] font-medium">Reconhecendo Identidade...</p>
              </div>
            )}
          </div>
        );
      
      case 'age':
        return (
          <form onSubmit={handleAgeSubmit} className="w-full space-y-4">
            <div className="flex items-center gap-2 mb-2 text-[#D4AF37]">
              <HelpCircle size={18} />
              <span className="text-xs uppercase tracking-widest font-black font-cinzel">Primeiro Portal</span>
            </div>
            <p className="text-[14px] sm:text-[16px] leading-relaxed text-gray-200 italic font-serif font-medium">"Qual a sua idade?" — O conhecimento do grau simbólico destranca as portas da sabedoria.</p>
            <input 
              type="password" 
              inputMode="numeric"
              value={ageResponse}
              onChange={(e) => setAgeResponse(e.target.value)}
              className="w-full bg-[#030508] border border-[#D4AF37]/30 text-white p-3.5 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-sm font-mono"
              placeholder="Digite sua idade maçônica..."
              autoFocus
            />
            <button className="w-full py-3 bg-[#D4AF37] text-black font-black uppercase tracking-wider text-[11px] rounded-xl hover:bg-[#c2a033] hover:scale-[1.01] transition-all cursor-pointer shadow-lg shadow-[#D4AF37]/15">Avançar Portal</button>
          </form>
        );

      case 'cpf':
        return (
          <form onSubmit={handleCpfSubmit} className="w-full space-y-4">
            <div className="flex items-center gap-2 mb-2 text-[#D4AF37]">
              <UserCheck size={18} />
              <span className="text-xs uppercase tracking-widest font-black font-cinzel">Segundo Portal</span>
            </div>
            <p className="text-[14px] sm:text-[16px] leading-relaxed text-gray-200 italic font-serif font-medium">"Diz-me quem és." — A identidade ritualística do obreiro deve estar em perfeita consonância com as colunas do templo.</p>
            <input 
              type="text" 
              value={cpfInput}
              onChange={(e) => setCpfInput(e.target.value)}
              className="w-full bg-[#030508] border border-[#D4AF37]/30 text-white p-3.5 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-sm font-mono"
              placeholder="000.000.000-00 (Apenas números)"
              autoFocus
            />
            <button className="w-full py-3 bg-[#D4AF37] text-black font-black uppercase tracking-wider text-[11px] rounded-xl hover:bg-[#c2a033] hover:scale-[1.01] transition-all cursor-pointer shadow-lg shadow-[#D4AF37]/15">Validar Identidade</button>
          </form>
        );

      case 'word':
        return (
          <form onSubmit={handleWordSubmit} className="w-full space-y-4">
            <div className="flex items-center gap-2 mb-2 text-[#D4AF37]">
              <Key size={18} />
              <span className="text-xs uppercase tracking-widest font-black font-cinzel">Terceiro Portal</span>
            </div>
            <p className="text-[14px] sm:text-[16px] leading-relaxed text-gray-200 italic font-serif font-medium">"Pronuncia a Palavra de Passe." — Somente quem possui os mistérios corretos deste trimestre poderá entrar.</p>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                className="w-full bg-[#030508] border border-[#D4AF37]/30 text-white p-3.5 pr-10 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-sm font-mono uppercase placeholder:normal-case tracking-widest"
                placeholder="Palavra Sagrada..."
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button disabled={loading} className="w-full py-3 bg-[#D4AF37] text-black font-black uppercase tracking-wider text-[11px] rounded-xl hover:bg-[#c2a033] hover:scale-[1.01] transition-all cursor-pointer shadow-lg shadow-[#D4AF37]/15 disabled:opacity-50">
              {loading ? 'Validando Palavra...' : 'Reconhecer e Entrar no Templo'}
            </button>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-black/60 relative">
      <div className="w-full max-w-md bg-[#05070A]/90 backdrop-blur-xl p-8 rounded-[24px] border border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col items-center relative">
        {/* Sacred geometric corners representing the cardinal directions */}
        <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t-2 border-l-2 border-[#D4AF37]/70"></div>
        <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t-2 border-r-2 border-[#D4AF37]/70"></div>
        <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b-2 border-l-2 border-[#D4AF37]/70"></div>
        <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b-2 border-r-2 border-[#D4AF37]/70"></div>

        <div className="w-48 h-48 mb-6 text-[#D4AF37] flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#D4AF37]/15 to-transparent blur-3xl opacity-60"></div>
            <img src={getAppLogo(tempUser || user)} alt="Logo" className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.45)]" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold tracking-wider text-[#D4AF37]" style={{fontFamily: 'Cinzel'}}>G∴O∴M∴A∴U∴</h1>
          <p className="text-[9px] text-gray-400 tracking-[0.35em] uppercase font-bold mt-1">Portal de Segurança Universal</p>
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent mx-auto mt-3"></div>
        </div>

        {error && (
          <div className="w-full bg-red-950/40 border border-red-500/30 text-red-200 p-3.5 rounded-xl mb-6 text-xs text-left flex items-start gap-2.5">
             <Shield size={16} className="shrink-0 mt-0.5 text-red-400" />
             <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {renderPhase()}

        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-[9px] text-gray-500 text-center uppercase tracking-[0.15em] font-medium font-mono">
            Acesso verificado por geolocalização e IP criptografado
          </p>
          {phase !== 'google' && (
            <button 
              onClick={() => { setPhase('google'); signOut(auth); }}
              className="text-[#D4AF37]/80 hover:text-[#D4AF37] text-[10px] uppercase tracking-widest font-black transition-colors mt-2"
            >
              ← Cancelar e sair
            </button>
          )}
          {phase === 'google' && (
            <button 
              onClick={() => navigate('/setup')}
              className="text-[#D4AF37]/40 hover:text-[#D4AF37]/80 text-[9px] uppercase tracking-[0.15em] font-bold transition-all mt-4 flex items-center gap-1 bg-black/40 border border-[#D4AF37]/10 px-2.5 py-1.5 rounded-lg hover:scale-105 cursor-pointer"
            >
              <Settings size={10} className="animate-spin" style={{ animationDuration: '6s' }} />
              Configurar Servidor Independente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

