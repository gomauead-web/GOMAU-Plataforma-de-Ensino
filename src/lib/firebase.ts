import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

// Tenta ler configuração customizada do localStorage para suporte a cópias de terceiros
let firebaseConfig: any = defaultFirebaseConfig;
const storedConfig = localStorage.getItem('gomau_custom_firebase_config');
if (storedConfig) {
  try {
    const parsed = JSON.parse(storedConfig);
    if (parsed && parsed.apiKey && parsed.projectId) {
      firebaseConfig = parsed;
      console.log("Firebase carregado com configuração CUSTOMIZADA do localStorage.");
    }
  } catch (e) {
    console.error("Erro ao ler configuração customizada do Firebase:", e);
  }
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configurar persistência local para melhor suporte em iframes
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Ativa cache persistente offline no Firestore para resiliência extra
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, firebaseConfig.firestoreDatabaseId || '(default)');
} catch (e) {
  console.warn("Navegador não suporta indexDB multi-tab, instanciando Firestore padrão:", e);
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
}

export const db = firestoreDb;
export const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);

// Silenciar teste de conexão ruidoso para evitar alarmes falsos de configuração offline
async function testConnection() {
  try {
    // Tenta uma consulta silenciosa sem forçar getDocFromServer, permitindo leitura do cache
    await getDoc(doc(db, 'test', 'connection'));
  } catch (error) {
    console.log("Firestore operando em modo offline resiliente.", error);
  }
}
testConnection();
