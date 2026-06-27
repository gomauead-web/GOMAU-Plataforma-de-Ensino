# Instruções para o Assistente

Você está trabalhando na Plataforma Maçônica "G∴O∴M∴A∴U∴".
Sempre que fizer uma alteração em funcionalidades, regras de negócio ou estrutura do banco de dados (Firestore), você DEVE obrigatoriamente manter atualizados os seguintes arquivos:

1. `MANUAL_MESTRE_GOMAU.md`
2. `CLONE_PROMPT_GOMAU.md` (Você DEVE manter as instruções do prompt atualizadas e SEMPRE atualizar os CÓDIGOS FONTES que estão no final do arquivo).
3. `INTEGRACAO_CURSOS.md` (se envolver módulos de cursos ou LMS)

Além disso, sempre que você criar, inserir, atualizar, editar ou excluir qualquer funcionalidade que agregue valor comercial à plataforma, você DEVE AUTOMATICAMENTE atualizar o Valuation do sistema no arquivo `src/components/gestor/GestorValuation.tsx` adicionando ou modificando os cards correspondentes e recalculando o valor global.

O `MANUAL_MESTRE_GOMAU.md` é a documentação completa, funcional, técnica e educacional do sistema que deve refletir a "verdade absoluta" da plataforma no momento. Ele inclui a "Caixa Preta" técnica, tutoriais passo a passo para Membros e Gestores, histórico de atualizações e arquitetura.

## Regras de Atualização do Manual e Valuation

1. Se adicionar uma nova funcionalidade no Gestor ou Membro, adicione um tópico correspondente nos Manuais.
2. Atualize o Valuation (`GestorValuation.tsx`) atribuindo um valor financeiro correspondente à feature e somando ao total.
3. Se modificar campos do Firestore, atualize a seção de Banco de Dados/Arquitetura.
4. Se mudar fluxos (ex: como uma prancha é enviada e aprovada), descreva o novo fluxo e aponte no histórico.
5. NUNCA DEIXE ESTES ARQUIVOS FICAREM DESATUALIZADOS.

Mantenha o código modular e sempre utilize Tailwind, Typescript, e o framework atual (Vite+React). Siga o design system com base na cor `#D4AF37` (Dourado) e fundos escuros (`#0A0E1A`, `#0F172A`).
