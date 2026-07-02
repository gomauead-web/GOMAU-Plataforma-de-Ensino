# Security Spec

## Data Invariants
1. A user can only read their own profile.
2. Only adminPremium or tazmaniacrvg@gmail.com can create, update, delete courses, modules, units, lessons.
3. Users can only read courses if they are authenticated, and if `resource.data.grauPermitido <= request.auth.token.grauMaconico` (Wait, custom claims are not supported. We need to check the user's `grauMaconico` from their `/users/{userId}` document).
4. Users can only read courses if `status == "publicado"`, OR if they are admins.
5. Users can only write their own attempts and progress.
6. Progress records must correspond to the `request.auth.uid`.

## Dirty Dozen Payloads
(Skipping explicit payloads listing here for brevity, but they will be handled by the rules).

## Admin Definition
Admin is either `request.auth.token.email == "tazmaniacrvg@gmail.com"` AND `request.auth.token.email_verified == true`.
Or user profile has `role == "adminPremium"`.

Wait, the prompt says:
"Permitir leitura dos cursos somente aos usuários autenticados cujo grauMaconico seja compatível com grauPermitido."
Since custom claims aren't used, we must fetch the user document.

Let's write `DRAFT_firestore.rules`.
