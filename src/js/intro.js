import { safeGet, safeSet } from "./storage.js";

// Cache par session : les animations ne se jouent qu'une fois par session
const ANIMATIONS_DONE_KEY = "folioAnimationsDone";

// =========================================================================
// CONFIGURATIONS DE L'ANIMATION HERO INTRO (À MODIFIER POUR PEAUFINER)
// =========================================================================
const HERO_INTRO_CONFIG = {
  // Temps de pause une fois 100% atteint avant de lancer l'animation (en ms) -> 0.5s
  LOADER_PAUSE_BEFORE_INTRO: 500,

  // Distance de projection des images vers l'extérieur (en pixels)
  EJECT_DISTANCE: 900,

  // Échelle de zoom max des cartes lors de leur rapprochement
  IMAGE_ZOOM_MAX: 3.5,

  // Durée de projection de chaque carte image (en millisecondes)
  IMAGE_EJECT_DURATION: 1300,

  // Décalage/délai entre l'éjection de chaque carte (en ms)
  IMAGE_STAGGER_DELAY: 200,

  // Échelle initiale minimale du H1 avant son zoom
  H1_ZOOM_START: 0.1,

  // Échelle finale géante du H1 pour le faire sortir de l'écran par zoom
  H1_ZOOM_MAX: 18.0,

  // Durée de l'animation de zoom du H1 (en ms)
  H1_ZOOM_DURATION: 950,

  // Pause d'écran plein après la sortie du H1 avant le fondu du Hero (en ms)
  BLANK_PAUSE: 150,

  // Délai avant l'apparition du Hero en fondu et le dézoom du H1 (en ms)
  HERO_APPEAR_DELAY: 300,

  // Décalage entre le fondu des sous-éléments du Hero et le dézoom du H1 (en ms)
  HERO_FADE_TO_H1_DROP_DELAY: 400,

  // Angles de direction pour l'éjection des cartes (en degrés)
  EJECT_ANGLES: [-135, -45, 135, 45, -90, 90],
};

// Déverrouille le scroll (X et Y) et ramène la page en haut sans animation.
// Unique et idempotente : appelée en sortie normale de la séquence, dans le
// catch global ci-dessous et par le failsafe setTimeout(releaseScrollLock, 8000).
function releaseScrollLock() {
  document.documentElement.classList.remove("is-animating");
  document.body.classList.remove("is-animating");
  window.scrollTo({ top: 0, behavior: "instant" });
}

// =========================================================================
// GESTION DU LOADER & INTRO
// Séquence loader → unveil → intro hero.
// { onDone } est appelé quand le site est révélé : fin normale de la
// séquence, chemin « animations déjà vues cette session » ou révélation
// de secours après une erreur.
// =========================================================================
export function initIntro({ onDone } = {}) {
  const done = typeof onDone === "function" ? onDone : () => {};

  // La révélation du site ne doit se produire qu'une seule fois,
  // quel que soit le chemin (normal, secours, failsafe).
  let revealed = false;
  let failsafeTimer;
  let interval;

  // Notification de fin : une erreur levée dans onDone ne doit jamais
  // bloquer la révélation du site.
  const notifyDone = () => {
    try {
      done();
    } catch (e) {
      // Silencieux volontaire : onDone n'est qu'un hook de notification.
    }
  };

  // Révélation de secours : si la séquence échoue (catch global ou erreur
  // dans l'une de ses étapes asynchrones), le site s'affiche quand même
  // et le scroll est déverrouillé.
  const revealFallback = (error) => {
    if (revealed) return;
    revealed = true;
    clearTimeout(failsafeTimer);
    clearInterval(interval);
    console.warn("Séquence d'intro interrompue, site révélé en secours :", error);

    // Révélation « best effort » : même si le DOM est indisponible, on
    // garantit la classe is-loaded, le déverrouillage du scroll et onDone.
    try {
      const unveilScreen = document.getElementById("unveil-screen");
      const heroIntroOverlay = document.getElementById("hero-intro-overlay");
      if (unveilScreen) unveilScreen.remove();
      if (heroIntroOverlay) heroIntroOverlay.remove();
    } catch (e) {
      // Best-effort : le retrait des couches ne doit rien casser d'autre.
    }

    try {
      document.body.classList.add("is-loaded");
    } catch (e) {
      // Best-effort.
    }

    try {
      releaseScrollLock();
    } catch (e) {
      // Best-effort : le failsafe aura au moins tenté le déverrouillage.
    }

    notifyDone();
  };

  // Enveloppe chaque étape asynchrone de la séquence : toute exception
  // déclenche la révélation de secours au lieu d'un site bloqué.
  const guarded = (fn) => (...args) => {
    try {
      fn(...args);
    } catch (error) {
      revealFallback(error);
    }
  };

  try {
    // Accessibilité : si l'utilisateur préfère réduire les animations, on
    // saute entièrement loader et intro — contenu visible immédiatement,
    // sans aucune animation ni délai, et sans jamais verrouiller le scroll.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const unveilScreen = document.getElementById("unveil-screen");
      const heroIntroOverlay = document.getElementById("hero-intro-overlay");
      if (unveilScreen) unveilScreen.remove();
      if (heroIntroOverlay) heroIntroOverlay.remove();
      document.body.classList.add("is-loaded");
      safeSet(ANIMATIONS_DONE_KEY, "1");
      releaseScrollLock();
      notifyDone();
      return;
    }

    const animationsAlreadyDone = safeGet(ANIMATIONS_DONE_KEY) === "1";

    if (animationsAlreadyDone) {
      const unveilScreen = document.getElementById("unveil-screen");
      const heroIntroOverlay = document.getElementById("hero-intro-overlay");
      if (unveilScreen) unveilScreen.remove();
      if (heroIntroOverlay) heroIntroOverlay.remove();
      document.body.classList.add("is-loaded");
      releaseScrollLock();
      notifyDone();
      return;
    }

    // Verrouillage du scroll X et Y pendant toute l'animation (chargement + intro hero)
    document.documentElement.classList.add("is-animating");
    document.body.classList.add("is-animating");

    // Failsafe : quoi qu'il arrive, le scroll est déverrouillé au bout de 8s
    failsafeTimer = setTimeout(releaseScrollLock, 8000);

    const unveilScreen = document.getElementById("unveil-screen");
    const unveilCounter = document.getElementById("unveil-counter");
    const unveilFill = document.getElementById("unveil-fill");
    const heroIntroOverlay = document.getElementById("hero-intro-overlay");
    const heroTitle = document.getElementById("hero-title");
    const heroFadeItems = document.querySelectorAll(".hero-fade-item");

    // Masquer initialement le H1 du Hero du flux document
    if (heroTitle) {
      heroTitle.classList.add("is-hidden-initial");
    }

    let progress = 0;

    // Animation du compteur du loader
    interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 4;

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        if (unveilCounter) unveilCounter.textContent = "100";
        if (unveilFill) unveilFill.style.width = "100%";

        // Attente du délai paramétré (500ms) une fois le chargement à 100%
        setTimeout(
          guarded(triggerUnveilAndHeroIntro),
          HERO_INTRO_CONFIG.LOADER_PAUSE_BEFORE_INTRO
        );

        return;
      }

      if (unveilCounter)
        unveilCounter.textContent = progress.toString().padStart(2, "0");
      if (unveilFill) unveilFill.style.width = `${progress}%`;
    }, 40);

    // Sortie normale : nettoyage des couches, déverrouillage du scroll
    // et mémorisation de la session.
    const completeSequence = () => {
      if (revealed) return;
      revealed = true;
      clearTimeout(failsafeTimer);
      if (unveilScreen) unveilScreen.remove();
      if (heroIntroOverlay) heroIntroOverlay.remove();
      releaseScrollLock();
      // Marquer les animations comme vues pour cette session
      safeSet(ANIMATIONS_DONE_KEY, "1");
      notifyDone();
    };

    // Séquence principale d'animation introductive
    function triggerUnveilAndHeroIntro() {
      // 1. Fait disparaître la barre et le chiffre du loader
      if (unveilScreen) {
        unveilScreen.classList.add("is-leaving");
      }

      // 2. Active instantanément l'overlay d'intro (qui est au-dessus avec z-index: 10000)
      if (heroIntroOverlay) {
        heroIntroOverlay.classList.add("is-active");
      }

      // Récupération des images depuis la section Projets
      const projectImgs = document.querySelectorAll(".card__img");
      const imgElements = [];

      // Chaque image du projet est clonée une seule fois dans l'overlay
      projectImgs.forEach((img) => {
        const el = document.createElement("div");
        el.className = "hero-intro-overlay__img";

        // Copie du style de fond de l'image d'origine
        const computedStyle = window.getComputedStyle(img);
        el.style.backgroundImage = computedStyle.backgroundImage;
        el.style.backgroundColor = computedStyle.backgroundColor;

        heroIntroOverlay.appendChild(el);
        imgElements.push(el);
      });

      // Création de l'élément H1 temporaire au centre de l'overlay (sécurisé, sans innerHTML)
      const overlayTitle = document.createElement("h1");
      overlayTitle.className = "hero-intro-overlay__title";

      const baseText = heroTitle
        ? heroTitle.textContent.replace(/-Dev/i, "").replace(/-DEV/i, "")
        : "Rolland";
      overlayTitle.appendChild(document.createTextNode(baseText));

      const devSpan = document.createElement("span");
      devSpan.textContent = "-DEV";
      overlayTitle.appendChild(devSpan);

      heroIntroOverlay.appendChild(overlayTitle);

      // --- PHASE 1 : Dispersion des images avec effet de zoom rapproché ---
      imgElements.forEach((el, index) => {
        const angleDeg =
          HERO_INTRO_CONFIG.EJECT_ANGLES[
            index % HERO_INTRO_CONFIG.EJECT_ANGLES.length
          ];
        const angleRad = (angleDeg * Math.PI) / 180;
        const targetX = Math.cos(angleRad) * HERO_INTRO_CONFIG.EJECT_DISTANCE;
        const targetY = Math.sin(angleRad) * HERO_INTRO_CONFIG.EJECT_DISTANCE;

        const delay = index * HERO_INTRO_CONFIG.IMAGE_STAGGER_DELAY;

        // Apparition initiale au centre
        setTimeout(guarded(() => {
          el.style.transition = "none";
          el.style.opacity = "1";
          el.style.transform = "scale(0.2)";

          // Forcer un reflow pour que l'état initial soit peint avant la transition
          el.offsetHeight;

          // Propulsion vers l'extérieur + zoom
          el.style.transition = `transform ${HERO_INTRO_CONFIG.IMAGE_EJECT_DURATION}ms cubic-bezier(0.25, 1, 0.5, 1), opacity ${HERO_INTRO_CONFIG.IMAGE_EJECT_DURATION}ms ease-out`;
          el.style.transform = `translate(${targetX}px, ${targetY}px) scale(${HERO_INTRO_CONFIG.IMAGE_ZOOM_MAX})`;
          el.style.opacity = "0";
        }), delay);
      });

      // --- PHASE 2 : Apparition du H1 au centre & Zoom géant jusqu'à sortir ---
      const totalImagesTime =
        imgElements.length * HERO_INTRO_CONFIG.IMAGE_STAGGER_DELAY + 200;

      setTimeout(guarded(() => {
        // Apparition au centre
        overlayTitle.style.transition = "none";
        overlayTitle.style.opacity = "1";
        overlayTitle.style.transform = `scale(${HERO_INTRO_CONFIG.H1_ZOOM_START})`;

        // Forcer un reflow pour que l'état initial soit peint avant la transition
        overlayTitle.offsetHeight;

        // Zoom puissant jusqu'à disparition complète par l'avant
        overlayTitle.style.transition = `transform ${HERO_INTRO_CONFIG.H1_ZOOM_DURATION}ms cubic-bezier(0.7, 0, 0.84, 0), opacity ${HERO_INTRO_CONFIG.H1_ZOOM_DURATION}ms ease-in`;
        overlayTitle.style.transform = `scale(${HERO_INTRO_CONFIG.H1_ZOOM_MAX})`;
        overlayTitle.style.opacity = "0";
      }), totalImagesTime);

      // --- PHASE 3 : Révélation du site & Fondu du Hero ---
      const totalIntroTime =
        totalImagesTime +
        HERO_INTRO_CONFIG.H1_ZOOM_DURATION +
        HERO_INTRO_CONFIG.BLANK_PAUSE;

      setTimeout(guarded(() => {
        // Dévoilement du site principal sous l'overlay
        if (unveilScreen) {
          unveilScreen.classList.add("is-opened");
        }
        document.body.classList.add("is-loaded");

        // Nettoyage de l'écran de chargement et de l'overlay + déverrouillage
        // du scroll X et Y une fois l'animation du héros terminée
        setTimeout(guarded(completeSequence), 450);

        // Délai avant l'apparition du Hero en fondu et le dézoom du H1
        setTimeout(guarded(() => {
          // Apparition en fondu des éléments du Hero (Rôle, Tagline, Boutons)
          heroFadeItems.forEach((item, idx) => {
            setTimeout(guarded(() => {
              item.classList.add("is-visible");
            }), idx * 150);
          });

          // --- PHASE 4 : Dézoom et chute du H1 principal avec rebond ---
          setTimeout(guarded(() => {
            if (heroTitle) {
              heroTitle.classList.remove("is-hidden-initial");
              heroTitle.classList.add("animate-drop-dezoom");
            }
          }), HERO_INTRO_CONFIG.HERO_FADE_TO_H1_DROP_DELAY);
        }), HERO_INTRO_CONFIG.HERO_APPEAR_DELAY);
      }), totalIntroTime);
    }
  } catch (error) {
    // Catch global de la séquence : le site s'affiche quand même
    revealFallback(error);
  }
}
