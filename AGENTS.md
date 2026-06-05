# Instruções para o Assistente

Você está trabalhando na Plataforma Maçônica "G∴O∴M∴A∴U∴".
Sempre que fizer uma alteração em funcionalidades, regras de negócio ou estrutura do banco de dados (Firestore), você DEVE obrigatoriamente manter atualizado o arquivo `MANUAL_MESTRE_GOMAU.md`.

O `MANUAL_MESTRE_GOMAU.md` é a documentação completa, funcional, técnica e educacional do sistema que deve refletir a "verdade absoluta" da plataforma no momento. Ele inclui a "Caixa Preta" técnica, tutoriais passo a passo para Membros e Gestores, histórico de atualizações e arquitetura.

## Regras de Atualização do Manual
1. Se adicionar uma nova funcionalidade no Gestor ou Membro, adicione um tópico correspondente.
2. Se modificar campos do Firestore, atualize a seção de Banco de Dados/Arquitetura.
3. Se mudar fluxos (ex: como uma prancha é enviada e aprovada), descreva o novo fluxo e aponte no histórico.
4. NUNCA DEIXE ESTE ARQUIVO FICAR DESATUALIZADO.

Mantenha o código modular e sempre utilize Tailwind, Typescript, e o framework atual (Vite+React). Siga o design system com base na cor `#D4AF37` (Dourado) e fundos escuros (`#0A0E1A`, `#0F172A`).
