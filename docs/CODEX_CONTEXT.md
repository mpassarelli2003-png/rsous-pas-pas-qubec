# Contexte Codex — finaliser la migration hors Blink

## Situation actuelle

Application : `resous-pas-a-pas-quebec`

Dépôt :

```text
mpassarelli2003-png/rsous-pas-pas-qubec
```

Stack : React, Vite, TypeScript, Tailwind, TanStack Router, Vercel.

La migration hors Blink est avancée, mais le build Vercel échoue encore.

## Objectif

Terminer la migration pour que l’application soit autonome :

- pas d’import `@blinkdotnew/*`;
- pas de dépendance `@blinkdotnew/*` dans `package.json`;
- pas d’import CSS Blink;
- `npm run build` doit réussir;
- l’interface actuelle doit être conservée autant que possible.

## État vérifié

`package.json` ne contient plus les dépendances Blink suivantes :

```json
"@blinkdotnew/react"
"@blinkdotnew/sdk"
"@blinkdotnew/ui"
```

Le build utilise :

```json
"prebuild": "node scripts/migrate-ui-imports.mjs",
"build": "vite build"
```

Le module UI local existe :

```text
src/lib/ui.tsx
src/lib/blink-ui-shim.tsx
```

`src/lib/ui.tsx` contient :

```ts
export * from './blink-ui-shim';
```

Le CSS Blink a été retiré de `src/index.css`.

## Erreur actuelle connue

Vercel signale des exports manquants :

```text
[MISSING_EXPORT] "AppShell" is not exported by "src/lib/ui.tsx".
src/Shell.tsx:13:10

import { AppShell, AppShellSidebar, AppShellMain, MobileSidebarTrigger } from "@/lib/ui";
```

Composants probablement à ajouter localement :

```text
AppShell
AppShellSidebar
AppShellMain
MobileSidebarTrigger
```

Fichier concerné :

```text
src/Shell.tsx
```

## Travail demandé

1. Exécuter :

```bash
npm install
npm run build
```

2. Corriger l’erreur actuelle en ajoutant des versions locales simples et robustes des composants manquants dans :

```text
src/lib/blink-ui-shim.tsx
```

ou dans :

```text
src/lib/ui.tsx
```

3. Relancer :

```bash
npm run build
```

4. Continuer jusqu’à ce que le build réussisse.

5. Ajouter tout autre composant UI local manquant au besoin.

## Contraintes

- Ne pas réinstaller `@blinkdotnew/react`, `@blinkdotnew/sdk` ou `@blinkdotnew/ui`.
- Ne pas réintroduire d’import `@blinkdotnew/*`.
- Ne pas supprimer les pages principales pour contourner les erreurs.
- Garder l’application React/Vite/Tailwind autonome.
- Priorité : build fonctionnel et interface stable.

## Routes à préserver

```text
/
/select
/solve/$problemId
/progress
/settings
/admin/login
/admin
```

## Prompt recommandé

```text
Lis docs/CODEX_CONTEXT.md.

Objectif : terminer la migration de l’application hors Blink.

Exécute npm install puis npm run build. Corrige les erreurs de build jusqu’à ce que npm run build réussisse.

Erreur actuelle connue : AppShell, AppShellSidebar, AppShellMain et MobileSidebarTrigger ne sont pas exportés par src/lib/ui.tsx, mais sont utilisés dans src/Shell.tsx.

Contraintes :
- ne réinstalle pas @blinkdotnew/react, @blinkdotnew/sdk ou @blinkdotnew/ui;
- ne réintroduis aucun import @blinkdotnew/*;
- conserve l’app React/Vite/Tailwind autonome;
- ajoute les composants UI manquants localement dans src/lib/blink-ui-shim.tsx ou src/lib/ui.tsx;
- ne supprime pas les pages principales pour contourner les erreurs;
- relance npm run build après chaque correction importante;
- à la fin, donne la liste des fichiers modifiés et le résultat exact du build.
```
