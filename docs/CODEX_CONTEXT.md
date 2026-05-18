# Contexte pour Codex — Migration hors Blink

## Objectif général

L’application `resous-pas-a-pas-quebec` doit devenir complètement indépendante de Blink.

Elle doit fonctionner comme une application React/Vite autonome, déployée sur Vercel à partir de GitHub.

Objectif final :

- aucun import `@blinkdotnew/*`;
- aucune dépendance `@blinkdotnew/*` dans `package.json`;
- aucun import CSS Blink;
- build Vercel fonctionnel avec `npm run build`;
- interface conservée autant que possible;
- ne pas réintroduire Blink.

## Dépôt

Repository :

```text
mpassarelli2003-png/rsous-pas-pas-qubec
```

Stack actuelle :

- React
- Vite
- TypeScript
- Tailwind
- TanStack Router
- Vercel

## Changements déjà faits

Les providers Blink ont été retirés de `src/main.tsx`.

Les anciennes dépendances suivantes ont été retirées de `package.json` :

```json
"@blinkdotnew/react"
"@blinkdotnew/sdk"
"@blinkdotnew/ui"
```

Un module UI local a été créé :

```text
src/lib/ui.tsx
src/lib/blink-ui-shim.tsx
```

Le fichier `src/lib/ui.tsx` réexporte actuellement le shim local.

Le CSS Blink a été retiré de `src/index.css`.

Ancienne ligne supprimée :

```css
@import '@blinkdotnew/ui/styles';
```

Un script de migration a été ajouté :

```text
scripts/migrate-ui-imports.mjs
```

Il remplace les imports :

```ts
from '@blinkdotnew/ui'
```

par :

```ts
from '@/lib/ui'
```

Le script est exécuté avant le build grâce à :

```json
"prebuild": "node scripts/migrate-ui-imports.mjs"
```

## Erreurs Vercel récentes

### Erreur CSS Blink corrigée

Vercel échouait sur une résolution PostCSS liée à :

```css
@import '@blinkdotnew/ui/styles';
```

Correction appliquée : l’import CSS Blink a été retiré de `src/index.css`.

### Erreur import Blink corrigée partiellement

Vercel échouait sur :

```text
Rollup failed to resolve import "@blinkdotnew/ui"
from "/src/components/AppSidebarShell.tsx"
```

Correction appliquée :

- `src/components/AppSidebarShell.tsx` importe maintenant depuis `@/lib/ui`;
- `src/lib/blink-ui-shim.tsx` exporte maintenant :
  - `Avatar`
  - `AvatarFallback`
  - `Tooltip`
  - `TooltipProvider`
  - `TooltipTrigger`
  - `TooltipContent`
  - support du variant `primary` dans `Button`

### Erreur actuelle à corriger

Le build Vercel échoue maintenant avec :

```text
[MISSING_EXPORT] "AppShell" is not exported by "src/lib/ui.tsx".
src/Shell.tsx:13:10

import { AppShell, AppShellSidebar, AppShellMain, MobileSidebarTrigger } from "@/lib/ui";
```

Autres exports manquants probables :

```text
AppShell
AppShellSidebar
AppShellMain
MobileSidebarTrigger
```

## Travail demandé à Codex

1. Exécuter :

```bash
npm install
npm run build
```

2. Corriger toutes les erreurs de build liées à la migration hors Blink.

3. Ne pas réinstaller `@blinkdotnew/*`.

4. Ne pas réintroduire :

```ts
@blinkdotnew/ui
@blinkdotnew/react
@blinkdotnew/sdk
```

5. Ajouter dans `src/lib/ui.tsx` ou `src/lib/blink-ui-shim.tsx` les composants locaux manquants si nécessaire.

6. Relancer :

```bash
npm run build
```

jusqu’à ce que le build réussisse.

7. Vérifier ensuite les pages principales :

```text
/
/select
/solve/$problemId
/progress
/settings
/admin/login
/admin
```

## Priorité

La priorité n’est pas de refaire le design.

La priorité est :

1. build Vercel fonctionnel;
2. app indépendante de Blink;
3. interface stable;
4. aucun retour aux dépendances Blink.

## Attention

Ne pas corriger seulement l’erreur visible. Il faut exécuter le build, corriger, relancer, corriger, relancer jusqu’à succès.

Ne pas supprimer des pages ou composants pour “faire passer” le build.

Si un composant UI manque, créer une version locale simple et robuste.

## Prompt recommandé à donner à Codex

```text
Lis docs/CODEX_CONTEXT.md.

Objectif : terminer proprement la migration de l’application hors Blink.

Exécute npm install puis npm run build. Corrige toutes les erreurs de build jusqu’à ce que npm run build réussisse.

Contraintes :
- ne réinstalle jamais @blinkdotnew/react, @blinkdotnew/sdk ou @blinkdotnew/ui;
- ne réintroduis aucun import @blinkdotnew/*;
- conserve l’app React/Vite/Tailwind autonome;
- si des composants UI sont manquants, ajoute des versions locales dans src/lib/ui.tsx ou src/lib/blink-ui-shim.tsx;
- ne supprime pas les pages principales pour contourner les erreurs;
- à la fin, donne la liste des fichiers modifiés et le résultat exact du build.

Commence par l’erreur actuelle :
[MISSING_EXPORT] AppShell, AppShellSidebar, AppShellMain, MobileSidebarTrigger are not exported by src/lib/ui.tsx, used in src/Shell.tsx.
```
