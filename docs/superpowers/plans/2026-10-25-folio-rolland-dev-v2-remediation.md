# Plan de remédiation — Folio Rolland Dev V2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** Corriger les blocants de production et finaliser les fonctionnalités inachevées (carrousel, i18n, nav mobile, accessibilité), sans casser l'intention visuelle du site.

**Architecture :** Site statique Vite vanilla (aucune dépendance runtime). On active le bundling (`type="module"`), on découpe `main.js` (691 lignes) en modules ES par responsabilité (intro, détails, constellation, nav, lang données projets), puis on corrige les défauts fonctionnels dans ces modules dédiés.

**Tech Stack :** Vite 8, HTML/CSS/JS vanilla, aucun framework, déploiement à la racine du domaine (`base` par défaut `"/"`, chemins `/assets/...` conservés).

**Spec :** rapport de revue du projet (session du 2026-10-25). Réponses utilisateur : couleurs des cartes = placeholders ; i18n FR/EN à rendre fonctionnel ; déploiement à la racine. Décisions validées : texte du plan exécuté en ordre T1→T12 ; les 6 cartes restent en HTML statique avec `data-i18n` (pas de rendu JS des cartes) ; textes EN rédigés dans ce plan (Annexe A).

## Global Constraints

- Aucune dépendance runtime ajoutée (vanilla only).
- Ne jamais exposer le site sans JS : le loader doit disparaître même en cas d'erreur (failsafe obligatoire).
- `prefers-reduced-motion: reduce` doit court-circuiter loader + intro + tilt 3D.
- Tout contrôle interactif doit être atteignable au clavier (Tab/Entrée/Échap) avec focus visible et retour de focus.
- Pas de `innerHTML` avec des données non statiques.
- Un commit par tâche.
- Les 6 cartes projets restent en HTML statique (`index.html`), traduites via attributs `data-i18n`.
- Données du panneau détails dans `src/data/projects.js`, bilingue (fr/en) pour `title`, `desc`, `caption`.

## Review Focus (risques les plus probables à l'usage)

| Condition | Comportement attendu | Tâche |
|---|---|---|
| Build de prod servi en ligne | Le JS est bundlé et exécuté ; pas d'écran noir résiduel | T1 |
| `sessionStorage` indisponible (Safari privé) | Le site fonctionne normalement, animations simplement rejouées | T2 |
| Intro qui plante (exception JS) | Le scroll se déverrouille et le contenu s'affiche | T2 |
| Mobile 360px | Nav utilisable, aucun élément coupé | T4 |
| Clavier seul | Ouvrir un projet, naviguer le panneau, fermer avec Échap, focus rendu à la carte | T5, T6 |

---

### Task 1 — Réparer le build de production (critique C1)

**Fichiers :** `index.html:202`

- [ ] `<script src="/src/main.js">` → `<script type="module" src="/src/main.js"></script>`.
- [ ] La balise `<link rel="stylesheet" href="/src/style.css">` reste en place (Vite la hash correctement).

**Vérification :**
- [ ] `npm run build` → `dist/assets/` contient un fichier `.js` et `dist/index.html` référence `/assets/…js` (plus aucune occurrence de `/src/`).
- [ ] `npx vite preview` : compteur du loader qui avance, étoiles qui bougent, cartes cliquables.
- [ ] Commit : `fix: bundle main.js as ES module in production`

### Task 2 — Robustesse de l'intro + découpage modulaire (critiques C4, M8, M4, M11)

**Fichiers :** créer `src/js/intro.js`, `src/js/constellation.js`, `src/js/nav.js` (stub vide, complété en T4), `src/js/lang.js` (stub, complété en T8), `src/js/details.js` (bloc panneau + projetsData extraits de `main.js`, complétés en T5-T7), `src/data/projects.js` (créé en T7 — stub acceptable ici ? non : T2 déplace `projectsData` tel quel vers `src/data/projects.js` exporté), réécrire `src/main.js` en point d'entrée qui importe les modules.

**Interfaces :**
- Produit : `intro.js` → `initIntro({ onDone })` ; `constellation.js` → `initConstellation()` ; `details.js` → `initDetails()` ; `nav.js` → `initNav()` ; `lang.js` → `initLang()` ; `projects.js` → `export const projectsData`.
- Main simplifié : imports + appels, plus la gestion de l'année footer.

**Contenu :**
- [ ] Helper stockage sûr : `safeGet(key)` / `safeSet(key, val)` enveloppés dans `try/catch` (retour `null` / no-op en cas d'échec) — remplacent `sessionStorage.getItem`/`setItem` actuels (lignes 7-8 et 217 de l'ancien main.js).
- [ ] `unveilScreen` vérifié avant chaque usage (ligne 110 de l'ancien main.js : `unveilScreen.classList.add("is-leaving")` sans garde).
- [ ] `releaseScrollLock()` unique : retire `is-animating` de `html` et `body` + `window.scrollTo({ top: 0, behavior: "instant" })` — appelée en sortie normale, dans un `catch` global de la séquence, et par un `setTimeout(releaseScrollLock, 8000)` de sécurité.
- [ ] `import "./style.css"` ajouté dans `main.js` ; garder aussi le `<link>` dans `index.html` (évite le FOUC en dev — décision libre, sans impact fonctionnel).
- [ ] `src/data/projects.js` reprend `projectsData` EXACTEMENT tel quel (mêmes clés/valeurs).
- [ ] Commit : `refactor: split main.js into modules and harden intro sequence`

**Vérification :**
- [ ] `npm run build` OK + `npx vite preview` : en navigation normale l'intro se joue, au 2ᵉ chargement dans la même session il est sauté.
- [ ] Au refresh, retour en haut SANS animation visible (corrige M4).
- [ ] Test régression `sessionStorage` : simuler une exception en tête de fichier (temporairement, hors commit) → le site s'affiche quand même, scroll déverrouillé.

### Task 3 — Respecter `prefers-reduced-motion` (majeur M5)

**Fichiers :** `src/js/intro.js`

- [ ] Si `matchMedia("(prefers-reduced-motion: reduce)").matches` au chargement : retirer `#unveil-screen` et `#hero-intro-overlay`, ajouter `is-loaded` au body, marquer la session « faite », `releaseScrollLock()`. Aucune animation, aucun délai.
- [ ] Cas normal : inchangé.

**Vérification :**
- [ ] DevTools → Rendering → émuler `prefers-reduced-motion: reduce` → recharger : contenu visible immédiatement, sans loader ni overlay.
- [ ] Émulation désactivée → comportement normal.
- [ ] Commit : `feat: skip loader and intro when reduced motion is preferred`

### Task 4 — Navigation mobile (critique C2)

**Fichiers :** `index.html` (bouton burger après `.lang-selector`), `src/js/nav.js`, `src/style.css`

- [ ] Bouton `<button class="nav__toggle" aria-expanded="false" aria-controls="nav-list" aria-label="Menu">` ; la `ul.nav__list` reçoit `id="nav-list"`.
- [ ] JS : bascule `.nav__list.is-open` + `aria-expanded` ; fermeture au clic d'un lien et à Échap ; fermeture automatique au passage ≥ 701px (listener `matchMedia("(min-width: 701px)")`).
- [ ] CSS `@media (max-width: 700px)` : `.nav__list` en colonne, masqué par défaut (`display:none` → `.is-open{display:flex}`), positionné sous le header ; header en `flex-wrap` pour éviter tout débordement.

**Vérification :**
- [ ] Viewport 360px : menu visible via burger, liens cliquables, `document.documentElement.scrollWidth <= window.innerWidth`.
- [ ] Clavier : Tab atteint le burger, Entrée ouvre, Échap ferme.
- [ ] Commit : `feat: accessible mobile navigation`

### Task 5 — Cartes projets activables au clavier (critique C3)

**Fichiers :** `index.html` (6 cartes), `src/js/details.js`

- [ ] Remplacer `<a class="project-card__link" href="#">` par `<a class="project-card__link" href="#project-details" aria-haspopup="dialog" data-project="N">Voir le cas</a>` ; le handler d'ouverture écoute ce lien (plus l'article) avec `preventDefault`.
- [ ] L'article garde le tilt 3D mais n'est plus le déclencheur.
- [ ] `openDetails` stocke `lastFocused = document.activeElement` ; `closeDetails` fait `lastFocused?.focus({ preventScroll: true })` (corrige M14).

**Vérification :**
- [ ] Tab jusqu'à une carte → Entrée ouvre le panneau ; Échap ferme et le focus revient sur le lien.
- [ ] Aucun `href="#"` restant dans `index.html`.
- [ ] Commit : `feat: open project details from a real, keyboard-accessible link`

### Task 6 — Panneau détails : vraie fenêtre modale (majeur M2)

**Fichiers :** `src/js/details.js`, `src/style.css`

- [ ] Ouverture : `mainContent.hidden = true` (ou `inert`), `document.body.classList.add("details-open")` → CSS `overflow: hidden` sur body, focus sur le bouton retour.
- [ ] Piège de focus : `keydown` Tab dans le panneau → cycle entre premier et dernier élément focusable du panneau.
- [ ] Fermeture : retire `hidden`/classe, rend le focus à `lastFocused`, garde le `scrollIntoView` existant (avec respect de `prefers-reduced-motion` déjà en place).

**Vérification :**
- [ ] Clavier : Tab ne sort jamais du panneau ouvert ; Échap ferme ; arrière-plan non atteignable et non scrollable ; retour de focus correct.
- [ ] Commit : `feat: real modal behavior for project details panel`

### Task 7 — Carrousel fonctionnel + rendu sécurisé (majeurs M1, M9)

**Fichiers :** `src/js/details.js`, `src/data/projects.js` (ajout champ `captions: string[]` aligné sur `colors`)

- [ ] `renderCarousel(data)` / `updateCarousel(index)` : `carouselTrack.scrollTo({ left: offsetDeLItemActif, behavior: reduce ? "auto" : "smooth" })`, `#details-main-img` en `backgroundColor = data.colors[index]`, `#details-caption` = `data.captions[index]`.
- [ ] Remplacer les `innerHTML` (tags + carrousel) par des créations de nœuds (`document.createElement`) — l'`id` du projet reste la clé de `projectsData`.
- [ ] Boutons prev/next conservent leur logique ; ajout des flèches ←/→ quand le panneau est ouvert.

**Vérification :**
- [ ] Ouvrir un projet → « next » fait défiler la vignette active ET change l'image principale + la légende ; « prev » idem ; extrémités désactivent les boutons.
- [ ] Commit : `feat: working carousel syncing main image and caption`

### Task 8 — i18n FR/EN fonctionnelle (majeur M3)

**Fichiers :** `src/js/lang.js` (dictionnaire fr/en + `applyLang`), `src/data/projects.js` (champs `title/desc/caption` → objets `{fr, en}`), `index.html` (attributs `data-i18n` sur textes statiques), `src/main.js` (câblage).

- [ ] `applyLang(lang)` : pour chaque `[data-i18n]` → `textContent = dict[lang][clé]` ; `data-i18n-aria` → `aria-label` ; `data-i18n-placeholder` si besoin ; met `document.documentElement.lang`.
- [ ] Persistance `localStorage` via `safeGet/safeSet` ; défaut = langue du navigateur (`navigator.language.startsWith("en") ? "en" : "fr"`).
- [ ] Boutons FR/EN câblés sur `applyLang` (remplace le toggle de classe) ; le panneau détails ouvert se met à jour si on change de langue.
- [ ] Les 6 cartes restent en HTML statique avec `data-i18n="projects.1.title"` etc.
- [ ] Les textes EN viennent de l'Annexe A (verbatim).

**Vérification :**
- [ ] Clic EN → tous les textes visibles (nav, hero, à propos, cartes, panneau ouvert, footer) en anglais, `lang="en"` ; recharger → choix conservé ; clic FR → retour complet.
- [ ] Commit : `feat: functional FR/EN language switcher`

### Task 9 — Performances (majeur M6)

**Fichiers :** `src/style.css`, `src/js/details.js`, `src/js/constellation.js`

- [ ] `will-change` retiré de `.project-card` (base) → appliqué sur `.project-card:hover` seulement ; idem `.hero__name` (ou retiré — animation courte).
- [ ] Tilt 3D : `getBoundingClientRect()` calculé une fois sur `pointerenter`/`mouseenter`, réutilisé dans `mousemove` ; écritures groupées dans un `requestAnimationFrame` ; désactivé si `(pointer: coarse)` ou `prefers-reduced-motion: reduce`.
- [ ] Constellation : `resize` throttle via `requestAnimationFrame`.

**Vérification :**
- [ ] DevTools Performance sur ~10 s de survol des cartes : pas de layout thrashing massif ; nombre de couches stable.
- [ ] Commit : `perf: remove permanent will-change layers and cache layout reads`

### Task 10 — Nettoyage CSS + timing reveal (majeurs M7, M10, M13)

**Fichiers :** `src/style.css`, `src/js/intro.js`, `index.html`

- [ ] Réduire la transition `.unveil` à 0.45s et retirer l'élément au bout de 450ms (aligner JS et CSS) — le reveal redevient visible.
- [ ] Supprimer `--projects-pin`, la media-query `position: static` de `.projects__sticky`, le `min-height` dupliqué de `.hero`, le markup `.tech-list__mask`.
- [ ] `#ffa95d` codé en dur → token `--c-accent-soft` dans `:root`.
- [ ] Couleur de la marque sur le loader : passer à `var(--c-bg)` (contraste ≥ 4.5:1).

**Vérification :**
- [ ] Recharger → le reveal du loader se voit.
- [ ] `grep -r "projects-pin\|tech-list__mask" src/` → 0 résultat.
- [ ] Commit : `style: remove dead CSS, fix loader reveal timing and contrast`

### Task 11 — Métadonnées (mineur M12)

**Fichiers :** `index.html`, `public/favicon.svg` (créé)

- [ ] `meta name="description"`, Open Graph + Twitter card, `meta name="theme-color"` = `#fafaf7`, favicon SVG lié dans le `<head>`.
- [ ] Contenu : `Rolland — Dev, front-end developer in Saint-Nazaire: clear, fast, and emotional web experiences.` (version EN de l'Annexe A).

**Vérification :**
- [ ] `npm run build` → `dist/favicon.svg` présent ; inspection du `<head>`.
- [ ] Commit : `feat: meta tags and favicon`

### Task 12 (optionnel) — Outillage qualité

**Fichiers :** `package.json`, `.prettierrc`

- [ ] `devDependencies` : `prettier` (+ script `"format"`), `.prettierrc` (2 espaces, double quotes, semi).
- [ ] Commit : `chore: add prettier`

---

## Annexe A — Textes EN (dictionnaire `src/js/lang.js`, verbatim)

**Nav / chrome**

```
nav.about:    fr "À propos"        en "About"
nav.projects: fr "Projets"         en "Projects"
nav.contact:  fr "Contact"         en "Contact"
```

**Hero**

```
hero.role:          fr "Développeur front-end"                              en "Front-end developer"
hero.tagline:       fr "Des expériences web claires, rapides et émotionnelles." en "Clear, fast, and emotional web experiences."
hero.cta.projects:  fr "Voir les projets"                                   en "See projects"
hero.cta.contact:   fr "Me contacter"                                       en "Get in touch"
```

**À propos**

```
about.title: fr "À propos" en "About"
about.text:  fr "Développeur front-end basé à Saint Nazaire, je conçois des interfaces web sur mesure. Spécialisé dans la performance et le design éditorial, j'accompagne startups et équipes produit du premier wireframe à la mise en production."
             en "A front-end developer based in Saint-Nazaire, I craft bespoke web interfaces. Specialised in performance and editorial design, I support startups and product teams from the first wireframe to production."
```

**Cartes (HTML statique, clés `projects.N.title` / `projects.N.desc` / `projects.N.link`)**

| N | title en | desc en | link en |
|---|---|---|---|
| 1 | Atlas — E-commerce platform | Headless storefront: unified catalogue, checkout and back-office. | View case |
| 2 | Pulse — Real-time dashboard | Live KPI tracking and high-performance analytics for ops teams. | View case |
| 3 | Flux — Collaborative app | Real-time collaborative project management built for distributed teams. | View case |
| 4 | Nebula — Streaming platform | High-definition video delivery with AI recommendations. | View case |
| 5 | Orbit — Productivity tool | Simplified task management and team collaboration. | View case |
| 6 | Zen — Wellness app | Guided meditation and personalised sleep tracking. | View case |

**Panneau détails / UI**

```
details.back:           fr "Retour aux projets"   en "Back to projects"
details.prev:           fr "Image précédente"     en "Previous image"
details.next:           fr "Image suivante"       en "Next image"
details.visit:          fr "Voir le site"         en "Visit site"
details.announce:       fr "Détails du projet : {title}"  en "Project details: {title}"
details.titleFallback:  fr "Titre du projet"      en "Project title"
details.descFallback:   fr "Résumé du projet..."  en "Project summary..."
```

**projectsData — `caption` (par index, aligné sur `colors`)**

| N | caption en |
|---|---|
| 1 | Preview of the Atlas headless store |
| 2 | The Pulse dashboard in real time |
| 3 | The Flux collaborative interface |
| 4 | The Nebula video player |
| 5 | The Orbit dashboard |
| 6 | The Zen wellness interface |

**projectsData — `desc` (versions longues)** : identiques aux descriptions de cartes du tableau ci-dessus.

**Meta description (T11)** : `Rolland — Dev, front-end developer in Saint-Nazaire: clear, fast, and emotional web experiences.`
