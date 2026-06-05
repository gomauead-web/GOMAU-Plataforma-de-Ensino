# Prompt Mestre de Clonagem e Especificação Técnica: G∴O∴M∴A∴U∴

Este arquivo serve como um **Prompt de Engenharia Direta (Copié-Collé)** para alimentar qualquer Inteligência Artificial (ex: Gemini, Claude, GPT, v0) com o objetivo de recriar, do zero, a **Plataforma Maçônica G∴O∴M∴A∴U∴** com 100% de compatibilidade em termos de banco de dados, design, segurança e motores de lógica de negócios.

---

## 📋 PROMPT DE INSTRUÇÃO PARA CÔNCLAVE DE IAs (CLONE SYSTEM)

```text
Você é um Engenheiro de Software Full-Stack Sênior encarregado de construir a "Plataforma Maçônica G∴O∴M∴A∴U∴".
O sistema deve ser desenvolvido utilizando React 18+ (Vite), TypeScript, Tailwind CSS e Firebase (Firestore e Authentication).

Siga rigorosamente as diretrizes visuais, regras de segurança maçônica, arquitetura de coleções do banco e motores de IA descritos abaixo.

---

### 1. ESTÉTICA & DESIGN SYSTEM (Royal Black & Gold)
A plataforma deve emanar solenidade, mistério, seriedade e prestígio.
- **Paleta de Cores:**
  - Fundo principal extremamente escuro (Imperial Midnight): `#0A0E1A` ou `#05070F`
  - Painéis, containers e cards: `#0F172A` ou `#1E293B` com bordas sutis em `#1E293B` (slate-800)
  - Destaques, botões primários e tipografia display (Masonic Gold): `#D4AF37`
  - Textos de corpo secundários: tons de cinza elegantes (`text-gray-400`, `text-gray-300`)
- **Tipografia:** 
  - Títulos solenes em fontes display modernas com espaçamento nítido e "tracking-tight".
  - Fontes monoespaçadas (JetBrains Mono/Fira Code) para dados e indicadores administrativos.
- **Componentes:** Bordas arredondadas (rounded-xl), efeitos discretos de vidro fosco (backdrop-blur) e transições suaves de hover que iluminam as bordas douradas.

---

### 2. ARQUITETURA DO BANCO DE DADOS (Firestore)
Para total integridade de dados e retrocompatibilidade com o sistema GOMAU atual, utilize exatamente os seguintes esquemas de coleções:

#### 2.1 Coleção: `users` (Document ID = E-mail original minúsculo OU UID do usuário oficial após login)
*Nota técnica: No primeiro login, as contas importadas de e-mail são buscadas em cascata e unificadas sob o UID do Firebase.*
- `uid`: string (UID do Firebase Auth)
- `nome`: string (Formatado em Title Case, ex: "João Silva")
- `email`: string (Sempre minúsculo)
- `cpf`: string
- `cim`: string (Número da carteira)
- `grau`: string ("Aprendiz", "Companheiro" ou "Mestre")
- `role`: string ("membro" ou "gestor")
- `loja`: string (Padrão: "Jus Veritas 33")
- `rito`: string (Padrão: "Emulação")
- `cargo`: string (ex: "Membro", "Venerável Mestre", "Instrutor")
- `status`: string (Padrão: "ativo")
- `dataNascimento`: string
- `telefone`: string
- `estadoCivil`: string
- `esposa`: string
- `qtdFilhos`: number
- `cep`: string
- `rua`: string
- `numero`: string
- `bairro`: string
- `cidade`: string
- `uf`: string
- `emergencia`: string (Nome do contato)
- `foneEmergencia`: string
- `avatarUrl`: string (Foto do membro)
- `createdAt`: Timestamp ou ISO string
- `updatedAt`: Timestamp ou ISO string
- `readNotifications`: array de strings (IDs de notificações confirmadas pelo membro)
- `readReminders`: array de strings (IDs de avisos confirmados)

#### 2.2 Coleção: `requests` (Pranchas de Trabalho e Pedidos Adms)
- `id`: string gerada
- `solicitanteEmail`: string
- `solicitanteUid`: string
- `solicitanteNome`: string
- `solicitanteGrau`: string
- `tipo`: string ("prancha", "falta", "hospitalaria", "certidao", "quitte")
- `titulo`: string (ex: "Simbologia do Altar dos Perfumes")
- `numeroPrancha`: string (ex: "Pr∴ 01")
- `temaCentral`: string
- `simbolosPrincipais`: string
- `descricao`: string (Texto livre do pedido ou link para o arquivo da prancha se colar url externa)
- `fileUrl`: string (Link para o PDF da prancha arquivada)
- `status`: string ("pendente", "aprovado", "rejeitado")
- `criadoEm`: Timestamp
- `analisadoEm`: Timestamp (quando o gestor dá o parecer)
- `comentarioGestor`: string (Obrigatório se rejeitado)
- `dataResposta`: string

#### 2.3 Coleção: `contents` (Materiais de Estudo e Biblioteca)
- `id`: string
- `titulo`: string
- `tipo`: string ("pdf" ou "video")
- `url`: string (Link do player do youtube ou link iframe de preview do Google Drive)
- `grauMinimo`: string ("Aprendiz", "Companheiro" ou "Mestre")
- `descricao`: string
- `criadoEm`: Timestamp

#### 2.4 Coleção: `evolutionRules` (Regras de Interstício p/ Subir de Grau)
- `id`: string ("Aprendiz" ou "Companheiro")
- `intersticioMeses`: number
- `quantidadeTrabalhos`: number
- `updatedAt`: Timestamp

#### 2.5 Coleção: `configs`
- Documento: `security` (Controle do Portal)
  - `palavraSagrada`: string (Padrão: "FORTITUDO")
  - `dataExpiracao`: string (Formato YYYY-MM-DD)
- Documento: `generator` (Gerador de Cursos com IA)
  - `model`: string
  - `profundidade`: string ("básico", "médio", "profundo")
  - `complexidade`: string
  - `linguagem`: string

#### 2.6 Coleção: `courses` (Cursos do Universo EAD gerados por IA)
- `id`: string
- `titulo`: string
- `descricao`: string
- `grauElegivel`: string ("Aprendiz", "Companheiro" ou "Mestre")
- `cargaHoraria`: string
- `createdAt`: Timestamp
- `aulas`: array de objetos contemplando:
  - `id`: string
  - `titulo`: string
  - `conteudo`: string (em Markdown completo)
  - `duracao`: string
- `quiz`: array de objetos:
  - `id`: string
  - `pergunta`: string
  - `opcoes`: array de strings
  - `respostaCorreta`: number (índice da opção correta)

#### 2.7 Coleção: `courseProgress` (Progresso no EAD)
- `id`: string (uid_courseId)
- `uid`: string
- `courseId`: string
- `aulasConcluidas`: array de strings (IDs das aulas)
- `quizRespondido`: boolean
- `quizResultado`: number (nota/percentual)
- `dataConclusao`: Timestamp

#### 2.8 Coleção: `accessLogs` (Registros de Login)
- `id`: string
- `uid`: string
- `nome`: string
- `email`: string
- `cim`: string
- `timestamp`: Date/Timestamp

#### 2.9 Coleção: `sessions`
- Documento ID correspondente ao evento/reunião
  - Sub-coleção: `attendance` (Presenças assinadas eletronicamente na Loja)
    - `id`: string
    - `nome`: string
    - `cim`: string
    - `grau`: string
    - `horaEntrada`: string

---

### 3. CAMADA DE SEGURANÇA AVANÇADA (O Triplo Portal)
Nenhum usuário deve ler dados do sistema (exceto Login) sem passar pelos Portais Sequenciais.
- **Portais de Login:**
  1. **Google Auth:** Executa a verificação. Se o e-mail não constar no banco (ou no Excel), bloqueia imediatamente o acesso.
  2. **Enigma da Idade Maçônica:** Uma pergunta dinâmica baseada no grau cadastrado do obreiro. Ex: Se Aprendiz, pergunta "Qual a idade de um Aprendiz?". Se Companheiro, "Qual a idade de um Companheiro?". O sistema valida de forma discreta (ex: 3, 5, 7 anos).
  3. **CPF / Portal de Identificação:** Valida se o CPF digitado bate exatamente com a base oficial.
  4. **Palavra Sagrada Corrente:** O usuário deve digitar a Palavra Sagrada válida recuperada do Firestore em `configs/security`. O gestor pode alterar a palavra no painel de administração.
- **Bypass Master Exclusivo:** O e-mail `gomau.ead@gmail.com` de Venerável de Honra tem bypass total automático, pulando enigma, CPF e Palavra ao entrar.
- **Bloqueio de Download & Cópia (Sigilo Máximo):**
  - No visualizador de documentos do Templo, o clique do botão direito do mouse deve ser bloqueado (`onContextMenu={(e) => e.preventDefault()}`).
  - Desabilitar atalhos: `Ctrl+S`, `Ctrl+P`, `Ctrl+C`, `Ctrl+U`, `Ctrl+J` e tecla `F12`.
  - Exibir popup com overlay translúcido se tentarem printar ou inspecionar: *"Documento Protegido - Protocolo G∴O∴M∴A∴U∴"*.
- **Auto-Logout por Inatividade:** Se o teclado, mouse ou toque permanecer inativo por mais de **10 minutos**, o sistema força o logout do Firebase, destrói sessões no `sessionStorage` e pede login novamente.

---

### 4. MOTORES DO SISTEMA (A "Caixa Preta" de Lógica)

#### 4.1 Canvas CIM Engine
O sistema gera dinamicamente a Carteira de Identidade Maçônica (CIM Digital):
- Mescla uma imagem de fundo estática (`template_cim.png` localizada na pasta public) com a foto do membro (avatar).
- Desenha em um `<canvas>` HTML5 textos estilizados contendo: Nome do Obreiro (Title Case), CIM, Grau, Loja, Data de Emissão, Data de Iniciação e QR Code contendo as informações de validação maçonica.
- Permite download como PNG pelo próprio membro e visualização de frente e verso.

#### 4.2 Engine de Evolução (Progress Tracker)
Mapeia se o obreiro cumpriu todas as metas de seu grau:
1. Compara a quantidade de documentos em `requests` com `tipo === 'prancha' && status === 'aprovado'` com a meta parametrizada em `evolutionRules`.
2. Calcula a data de Iniciação contra a meta de meses em `evolutionRules`.
3. Oferece um checklist no Dashboard avisando, por exemplo, "Faltam 2 pranchas de instruções" ou "Falta cumprir 3 meses de interstício".

#### 4.3 Motor Generativo de Treinamentos (Gemini Integration)
Na Área do Gestor, o Venerável ou Instrutor pode inserir um tema (ex: "As Colunas do Templo") e configurar complexidade:
- Realiza uma chamada segura via servidor express ou backend-proxy integrando o SDK `@google/genai` (Modelo recomendado: `gemini-3.1-pro-preview`).
- O retorno obrigatoriamente deve ser um JSON estruturado com título do curso, carga horária, lições formatadas em Markdown e um Quiz de 5 questões integradas.
- O Gestor visualiza um feed em formato de Terminal de Logs em tempo real com o a evolução da IA, que salva de forma asíncrona no Firestore em `courses/`.

---

### 5. GUIA DE CONCILIAÇÃO INTELIGENTE (Excel + Login Link)
Para evitar que existam duplicatas quando membros de uma planilha externa (`/public/validados.xlsx`) entram no sistema:
- O Gestor tem o botão **"Importar Excel"**, que lê dados como `CPF`, `Email`, `Nome`, `CIM` e pré-popula a coleção `users`.
- Quando o membro loga com sua conta Google, se o e-mail (lowercase e trimmed) coincidir com algum documento pré-cadastrado na coleção `users`, o sistema migra e mescla os dados para o novo documento identificado pelo `UID` do Firebase Auth e exclui com segurança o e-mail órfão anterior para evitar redundâncias na tabela.

```
```

Copie e cole as instruções deste prompt mestre para recriar com precisão cirúrgica a aplicação em qualquer ambiente, gerando uma experiência unificada e verdadeiramente sublime.
