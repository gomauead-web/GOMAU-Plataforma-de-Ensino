# 🏗️ Manual de Construção e Engenharia - Plataforma G∴O∴M∴A∴U∴

Este manual é um guia técnico de engenharia de software para reconstruir, manter e escalar a **Plataforma Maçônica G∴O∴M∴A∴U∴** do absoluto zero. Ele documenta todas as decisões de arquitetura, configurações de ambiente, modelagem de dados no Firestore, lógica de algoritmos complexos, diretrizes de segurança (OWASP) e otimização de performance empregadas no projeto.

---

## 🧭 1. Visão Geral da Arquitetura e Tech Stack

A plataforma foi desenvolvida utilizando uma arquitetura moderna de **Single Page Application (SPA)**, altamente responsiva, segura e com persistência resiliente em tempo real (offline-first).

*   **Runtime e Compilação:** Node.js (v18+) com **Vite** para empacotamento ultrarrápido, HMR (Hot Module Replacement) otimizado e compilação de produção enxuta.
*   **Linguagem:** **TypeScript** (Strict Mode) para tipagem estática rigorosa, minimização de erros de runtime e autocomplemento preciso em IDEs.
*   **Interface e UI Engine:** **React 18+** utilizando componentes funcionais estruturados e ganchos (Hooks) nativos e customizados.
*   **Design System e Estilização:** **Tailwind CSS** para estilização direta via classes utilitárias, garantindo consistência visual de alta fidelidade (Dourado `#D4AF37` sobre fundo escuro slate `#0A0E1A` / `#0F172A`).
*   **Ícones:** Biblioteca **Lucide React** para vetorização leve de todos os símbolos e indicadores do sistema.
*   **Visualização de Dados:** **Recharts** para construção de gráficos analíticos responsivos na telemetria e tesouraria.
*   **Banco de Dados e Segurança de Dados:** **Google Firebase Firestore** estruturado de maneira não relacional e protegido por regras granulares declarativas (`firestore.rules`).
*   **Autenticação:** **Firebase Authentication** com suporte a persistência local persistida e logins federados Google OAuth.
*   **Armazenamento de Mídia:** **Firebase Storage** para uploads seguros de peças de arquitetura (Pranchas), comprovantes de tesouraria e fotos de perfil.

---

## 🛠️ 2. Configuração de Ambiente e Inicialização

### 2.1. Arquivos de Configuração do Projeto

#### `package.json`
Gerencia scripts e dependências vitais.
```json
{
  "name": "react-example",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "tsc --noEmit",
    "preview": "vite preview"
  },
  "dependencies": {
    "firebase": "^10.8.0",
    "lucide-react": "^0.344.0",
    "recharts": "^2.12.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.1",
    "motion": "^11.0.8"
  },
  "devDependencies": {
    "@types/react": "^18.2.56",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.2.2",
    "vite": "^5.1.4"
  }
}
```

#### `tsconfig.json`
Configurações rigorosas do compilador TypeScript para garantir tipagem limpa:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

#### `vite.config.ts`
Configura o Vite para processar a injeção do plugin React e gerenciar o roteamento dinâmico:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  }
});
```

### 2.2. Variáveis de Ambiente (`.env.example`)
Variáveis obrigatórias para inicialização do ecossistema Firebase:
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## 🗄️ 3. Modelagem de Dados NoSQL (Estrutura do Firestore)

Como o Firestore é um banco de dados NoSQL baseado em documentos e coleções, a modelagem foi estruturada para suportar queries de leitura rápida, relatórios agregados eficientes e isolamento de privilégios.

```
📁 Coleções Principais
├── 📄 users (ID do documento: UID do Firebase Auth ou E-mail do usuário)
├── 📄 accessLogs (ID: Auto-gerado pelo Firestore)
├── 📄 attendance (ID: Auto-gerado)
├── 📄 courses (ID: Auto-gerado)
├── 📄 officersNotifications (ID: Auto-gerado)
├── 📄 evolutionRules (ID: Auto-gerado ou Fixo)
├── 📄 history (ID: Auto-gerado)
├── 📄 events (ID: Auto-gerado)
└── 📄 treasury (ID: Auto-gerado)
```

### 3.1. Dicionário de Coleções e Campos

#### Coleção: `users`
Contém a ficha cadastral de cada obreiro, seus privilégios de acesso e status maçônico.
*   `uid` (string, opcional): UID gerado pelo Firebase Authentication.
*   `email` (string, obrigatório): E-mail de login.
*   `nome` (string, obrigatório): Nome completo do Ir∴.
*   `cim` (string, obrigatório): Cadastro de Identificação Maçônica.
*   `grau` (number, obrigatório): `1` (Aprendiz), `2` (Companheiro), `3` (Mestre).
*   `cpf` (string, obrigatório): CPF formatado para conferência de segurança no login.
*   `dataNascimento` (string, obrigatório): No formato `AAAA-MM-DD` para o desafio de idade.
*   `isMaster` (boolean): `true` se possuir acesso irrestrito de Gestor/Administrador.
*   `roles` (array of strings): Lista de permissões granulares (ex: `['vigilante_2', 'tesoureiro', 'forum_instructor']`).
*   `isAdimplente` (boolean): Flag de controle financeiro.
*   `lastActive` (timestamp): Última atualização de heartbeat.
*   `createdAt` (timestamp): Data de criação da ficha.

#### Coleção: `accessLogs`
Registra a telemetria comportamental de acessos da plataforma (utilizada no painel do Gestor).
*   `uid` (string): UID do usuário (exceto se for admin master).
*   `nome` (string): Nome do Ir∴.
*   `cim` (string): CIM do Ir∴.
*   `timestamp` (timestamp): Instante exato do acesso.
*   `device` (string): Identificação básica do navegador/plataforma.

#### Coleção: `courses`
Centraliza os cursos da plataforma EAD e lições geradas pela IA (`CourseGenerator`).
*   `titulo` (string): Nome do curso/módulo.
*   `grauMinimo` (number): Grau mínimo de acesso (`1`, `2` ou `3`).
*   `descricao` (string): Resumo do programa.
*   `aulas` (array of objects):
    *   `id` (string): Identificador único da aula.
    *   `titulo` (string): Título da lição.
    *   `conteudo` (string): Texto de estudo formatado em Markdown.
*   `quizzes` (array of objects):
    *   `pergunta` (string): Enunciado da questão.
    *   `opcoes` (array of strings): Alternativas possíveis.
    *   `respostaCorreta` (number): Índice da alternativa correta.

#### Coleção: `treasury`
Registros financeiros individuais e globais da Loja.
*   `uid` (string): ID do usuário associado à parcela.
*   `ano` (number): Ano financeiro de exercício.
*   `mensalidades` (array of objects):
    *   `mes` (number): De `1` a `12`.
    *   `valor` (number): Custo da mensalidade.
    *   `status` (string): `'pago'`, `'pendente'`, `'atrasado'`.
    *   `dataPagamento` (timestamp, opcional): Data da transação.
    *   `comprovanteUrl` (string, opcional): Link no Storage.

---

## 🏗️ 4. Fluxo de Construção Passo a Passo

Para reproduzir a plataforma em um novo ambiente ou infraestrutura limpa, siga rigorosamente a sequência de desenvolvimento descrita abaixo.

### Passo 1: Configuração do Core Firebase (`src/lib/firebase.ts`)
Responsável pela inicialização dos SDKs e estabelecimento de conexões com cache local persistente para suporte offline resiliente.
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// Inicialização do Firestore com cache local avançado em múltiplas abas
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
export const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence);
```

### Passo 2: Contexto de Autenticação (`src/contexts/AuthContext.tsx`)
O coração lógico do controle de sessões e "Self-Healing Database" (autolimpeza de registros duplicados e migração de perfis temporários). Ele utiliza `useMemo` para mitigar renderizações em ciclo no React.

```typescript
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserData {
  uid: string;
  email: string;
  nome: string;
  cim: string;
  grau: number;
  isMaster: boolean;
  roles?: string[];
  isAdimplente: boolean;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  sessionTimeout: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // Timeout de sessão em 20 minutos de inatividade
      timeoutId = setTimeout(() => {
        setSessionTimeout(true);
        signOut(auth);
      }, 20 * 60 * 1000);
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetTimer));
    resetTimer();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        try {
          // Motor de autolimpeza e migração de registros órfãos
          const userDocRef = doc(db, 'users', fbUser.uid);
          let userSnap = await getDoc(userDocRef);

          if (!userSnap.exists()) {
            // Verifica se o secretário criou uma ficha prévia usando apenas o e-mail
            const q = query(collection(db, 'users'), where('email', '==', fbUser.email));
            const querySnap = await getDocs(q);

            if (!querySnap.empty) {
              const oldDoc = querySnap.docs[0];
              const oldData = oldDoc.data();
              
              // Migra dados para a chave UID oficial e apaga o registro temporário/duplicado
              await setDoc(userDocRef, {
                ...oldData,
                uid: fbUser.uid,
                updatedAt: serverTimestamp()
              });
              
              if (oldDoc.id !== fbUser.uid) {
                await deleteDoc(doc(db, 'users', oldDoc.id));
              }
              userSnap = await getDoc(userDocRef);
            }
          }

          if (userSnap.exists()) {
            const data = userSnap.data() as UserData;
            setUser(data);
            
            // Grava o acesso na telemetria (Se não for MASTER)
            if (!data.isMaster) {
              await setDoc(doc(collection(db, 'accessLogs')), {
                uid: fbUser.uid,
                nome: data.nome,
                cim: data.cim,
                timestamp: serverTimestamp()
              });
            }
          } else {
            // Bloqueia tentativas de login sem cadastro na base pela secretaria
            await signOut(auth);
            setUser(null);
          }
        } catch (err) {
          console.error("Auth context error:", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const contextValue = useMemo(() => ({
    user,
    loading,
    sessionTimeout,
    logout
  }), [user, loading, sessionTimeout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### Passo 3: O Ritual de Login (`src/pages/Login.tsx`)
Estrutura multifatorial visual de login sequencial. O usuário é submetido ao teste de CPF, Data de Nascimento e à validação da Palavra Semestral ativa antes de ver o Dashboard.

### Passo 4: Painel de Telemetria Expansível (`src/components/gestor/TelemetryView.tsx`)
Implementa gráficos do `recharts` otimizados para renderização em tela cheia via Portal Modal. Evita requisições Firebase excessivas através de agregação server-side nativa (`getCountFromServer` do Firebase Firestore).

### Passo 5: Motor de Valuation do Software (`src/components/gestor/GestorValuation.tsx`)
Componente que cataloga e soma o valor patrimonial de cada recurso construído no ecossistema de software da Loja.

---

## 🔒 5. Segurança do Banco de Dados (`firestore.rules`)

A segurança é modelada em camadas estritas na borda do Firestore, usando o conceito de **Global Safety Net** para impedir vazamentos acidentais.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. Bloqueio Global contra vazamentos
    match /{document=**} {
      allow read, write: if false;
    }

    // Função de checagem de privilégios de Gestor
    function isMaster() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isMaster == true;
    }

    // 2. Regras para Coleção de Usuários
    match /users/{userId} {
      allow read: if request.auth != null;
      // Impede que o usuário comum altere seu próprio Grau ou se declare Master/Adimplente
      allow update: if request.auth != null && request.auth.uid == userId && 
        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['grau', 'isMaster', 'isAdimplente', 'cim']);
      allow write: if isMaster();
    }

    // 3. Regras para Telemetria
    match /accessLogs/{logId} {
      allow create: if request.auth != null;
      allow read, write: if isMaster();
    }

    // 4. Regras para Cursos e EAD
    match /courses/{courseId} {
      // Regra de segredo maçônico na borda do banco de dados
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.grau >= resource.data.grauMinimo;
      allow write: if isMaster();
    }
    
    // 5. Regras para Financeiro / Tesouraria
    match /treasury/{treasuryId} {
      allow read: if request.auth != null && (request.auth.uid == resource.data.uid || isMaster());
      allow write: if isMaster();
    }
  }
}
```

---

## 📈 6. Engenharia de Performance e Otimizações

Para manter a plataforma rodando de maneira suave em conexões móveis fracas e dispositivos de menor processamento, as seguintes otimizações foram cravadas no código:

1.  **Evitar Re-renders Cíclicos:** Toda a passagem de dados de estado globais (como perfil de usuário logado) é encapsulada em `React.useMemo` no provedor de contexto. Isso impede que alterações na árvore de componentes de baixo nível invalidem o estado de autenticação de topo.
2.  **Proteção Anti-Custos (Firestore Abusing Prevention):**
    *   No painel do gestor e nos gráficos, queries de listagem pura foram substituídas pela API `getCountFromServer` do Firestore. Essa chamada calcula a agregação na infraestrutura do Google Cloud e retorna um único número inteiro, custando apenas uma fração de centavo e sem baixar gigabytes de documentos JSON para o navegador.
    *   Sempre que um documento de telemetria histórica é solicitado, é injetado programaticamente um limite de `limit(500)` para impedir que loops de requisições ou spam de leituras de banco gerem surtos de custos de faturamento.
3.  **Visualizadores de Gráficos Responsivos:** Os componentes de gráficos Recharts são envelopados em `<ResponsiveContainer width="100%" height="100%">` aninhados em grades CSS fixas. Isso previne bugs comuns de estiramento do gráfico que quebram o layout do navegador.

---

## 🚀 7. Guia de Deploy e Manutenção

Para compilar e colocar o sistema em ambiente de produção (Cloud Run ou static hosting):

1.  **Garantir integridade estática:** Execute `npm run lint`. O linter do TypeScript analisará todo o projeto em busca de variáveis sem uso ou erros de tipagem.
2.  **Gerar arquivos estáticos compilados:** Execute `npm run build`. O Vite processará a minificação e compressão do Javascript/CSS, cuspindo os arquivos finais na pasta `/dist`.
3.  **Deploy das regras do Firestore:** Toda vez que houver alteração de escopo, atualize as regras usando a ferramenta do painel administrativo ou CLI: `firebase deploy --only firestore:rules`.

Este manual estabelece o **State-of-the-Art** de engenharia de software empregado na Plataforma G∴O∴M∴A∴U∴, garantindo que qualquer arquiteto ou desenvolvedor possa replicá-la com total maestria e sem pontos cegos técnicos.
