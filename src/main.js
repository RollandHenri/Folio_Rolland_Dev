document.addEventListener("DOMContentLoaded", () => {

  // Toujours revenir en haut de page à l'actualisation / chargement
  window.scrollTo(0, 0);

  // Cache par session : les animations ne se jouent qu'une fois par session
  const ANIMATIONS_DONE_KEY = "folioAnimationsDone";
  const animationsAlreadyDone = sessionStorage.getItem(ANIMATIONS_DONE_KEY) === "1";

  if (animationsAlreadyDone) {
    const unveilScreen = document.getElementById("unveil-screen");
    const heroIntroOverlay = document.getElementById("hero-intro-overlay");
    if (unveilScreen) unveilScreen.remove();
    if (heroIntroOverlay) heroIntroOverlay.remove();
    document.body.classList.add("is-loaded");
    document.documentElement.classList.remove("is-animating");
    document.body.classList.remove("is-animating");
    window.scrollTo(0, 0);
  } else {
    // Verrouillage du scroll X et Y pendant toute l'animation (chargement + intro hero)
    document.documentElement.classList.add("is-animating");
    document.body.classList.add("is-animating");

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

  // =========================================================================
  // GESTION DU LOADER & INTRO
  // =========================================================================
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
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 12) + 4;

    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);

      if (unveilCounter) unveilCounter.textContent = "100";
      if (unveilFill) unveilFill.style.width = "100%";


      // Attente du délai paramétré (500ms) une fois le chargement à 100%
      setTimeout(() => {
        triggerUnveilAndHeroIntro();
      }, HERO_INTRO_CONFIG.LOADER_PAUSE_BEFORE_INTRO);

      return;
    }

    if (unveilCounter)
      unveilCounter.textContent = progress.toString().padStart(2, "0");
    if (unveilFill) unveilFill.style.width = `${progress}%`;
  }, 40);

  // Séquence principale d'animation introductive
  // Séquence principale d'animation introductive
  function triggerUnveilAndHeroIntro() {

    // 1. Fait disparaître la barre et le chiffre du loader
    unveilScreen.classList.add("is-leaving");

    // 2. Active instantanément l'overlay d'intro (qui est au-dessus avec z-index: 10000)
    if (heroIntroOverlay) {
      heroIntroOverlay.classList.add("is-active");
    }

    // Récupération des images depuis la section Projets
    const projectImgs = document.querySelectorAll(".project-card__img");
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
      setTimeout(() => {
        el.style.transition = "none";
        el.style.opacity = "1";
        el.style.transform = "scale(0.2)";

        // Forcer un reflow pour que l'état initial soit peint avant la transition
        el.offsetHeight;

        // Propulsion vers l'extérieur + zoom
        el.style.transition = `transform ${HERO_INTRO_CONFIG.IMAGE_EJECT_DURATION}ms cubic-bezier(0.25, 1, 0.5, 1), opacity ${HERO_INTRO_CONFIG.IMAGE_EJECT_DURATION}ms ease-out`;
        el.style.transform = `translate(${targetX}px, ${targetY}px) scale(${HERO_INTRO_CONFIG.IMAGE_ZOOM_MAX})`;
        el.style.opacity = "0";
      }, delay);
    });

    // --- PHASE 2 : Apparition du H1 au centre & Zoom géant jusqu'à sortir ---
    const totalImagesTime =
      imgElements.length * HERO_INTRO_CONFIG.IMAGE_STAGGER_DELAY + 200;


    setTimeout(() => {
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
    }, totalImagesTime);

    // --- PHASE 3 : Révélation du site & Fondu du Hero ---
    const totalIntroTime =
      totalImagesTime +
      HERO_INTRO_CONFIG.H1_ZOOM_DURATION +
      HERO_INTRO_CONFIG.BLANK_PAUSE;


    setTimeout(() => {

      // Dévoilement du site principal sous l'overlay
      unveilScreen.classList.add("is-opened");
      document.body.classList.add("is-loaded");

      // Nettoyage de l'écran de chargement et de l'overlay
      setTimeout(() => {

        if (unveilScreen) unveilScreen.remove();
        if (heroIntroOverlay) heroIntroOverlay.remove();
        // Déverrouillage du scroll X et Y une fois l'animation du héros terminée
        document.documentElement.classList.remove("is-animating");
        document.body.classList.remove("is-animating");

        // Marquer les animations comme vues pour cette session
        sessionStorage.setItem(ANIMATIONS_DONE_KEY, "1");

        // Revenir en haut de page après l'animation
        window.scrollTo(0, 0);
      }, 300);

      // Délai avant l'apparition du Hero en fondu et le dézoom du H1
      setTimeout(() => {

        // Apparition en fondu des éléments du Hero (Rôle, Tagline, Boutons)
        heroFadeItems.forEach((item, idx) => {
          setTimeout(() => {
            item.classList.add("is-visible");
          }, idx * 150);
        });

        // --- PHASE 4 : Dézoom et chute du H1 principal avec rebond ---
        setTimeout(() => {

          if (heroTitle) {
            heroTitle.classList.remove("is-hidden-initial");
            heroTitle.classList.add("animate-drop-dezoom");
          }
        }, HERO_INTRO_CONFIG.HERO_FADE_TO_H1_DROP_DELAY);
      }, HERO_INTRO_CONFIG.HERO_APPEAR_DELAY);
    }, totalIntroTime);
  }
  } // fin du else (animations non vues cette session)

  // =========================================================================
  // GESTION DE L'ANNÉE DANS LE FOOTER
  // =========================================================================
  const yearEl = document.getElementById("footer-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }

  // =========================================================================
  // MODALE PROJETS (DIALOG NATIF)
  // =========================================================================
  const dialog = document.getElementById("project-dialog");
  const dialogCloseBtn = dialog?.querySelector(".project-dialog__close");
  const dialogTitle = document.getElementById("dialog-title");
  const dialogDesc = document.getElementById("dialog-desc");
  const dialogLink = document.getElementById("dialog-link");

  const projectsData = {
    1: {
      title: "Atlas — Plateforme e-commerce",
      desc: "Boutique headless complète : catalogue performant, paiement sécurisé et back-office unifié.",
      link: "#",
    },
    2: {
      title: "Pulse — Tableau de bord temps réel",
      desc: "Suivi d'indicateurs live et graphiques analytiques haute performance dédiés aux équipes ops.",
      link: "#",
    },
    3: {
      title: "Flux — Application collaborative",
      desc: "Outil de gestion de projet collaboratif en temps réel conçu pour les équipes distribuées.",
      link: "#",
    },
    4: {
      title: "Nebula — Plateforme de streaming",
      desc: "Diffusion vidéo haute définition avec recommandation IA.",
      link: "#",
    },
    5: {
      title: "Orbit — Outil de productivité",
      desc: "Organisation de tâches et collaboration en équipe simplifiée.",
      link: "#",
    },
    6: {
      title: "Zen — Application bien-être",
      desc: "Méditation guidée et suivi du sommeil personnalisé.",
      link: "#",
    },
  };

  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const id = card.getAttribute("data-project");
      const data = projectsData[id];

      if (data && dialog) {
        dialogTitle.textContent = data.title;
        dialogDesc.textContent = data.desc;
        dialogLink.href = data.link;
        dialog.showModal();
      }
    });
  });

  if (dialogCloseBtn && dialog) {
    dialogCloseBtn.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => {
      const rect = dialog.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        dialog.close();
      }
    });
  }

  // =========================================================================
  // SÉLECTEUR DE LANGUE (FR / EN)
  // =========================================================================
  const langBtnFr = document.querySelector('[data-lang="fr"]');
  const langBtnEn = document.querySelector('[data-lang="en"]');
  let currentLang = "fr";

  function updateLangUI() {
    langBtnFr.classList.toggle("lang-btn--active", currentLang === "fr");
    langBtnEn.classList.toggle("lang-btn--active", currentLang === "en");
  }

  if (langBtnFr && langBtnEn) {
    langBtnFr.addEventListener("click", () => {
      if (currentLang !== "fr") {
        currentLang = "fr";
        updateLangUI();
      }
    });

    langBtnEn.addEventListener("click", () => {
      if (currentLang !== "en") {
        currentLang = "en";
        updateLangUI();
      }
    });
  }

  // =========================================================================
  // PROJETS : MODALE (CLIC SUR CARTE)
  // =========================================================================

  // =========================================================================
  // PROJETS : APPARITION EN FONDU AU SCROLL
  // =========================================================================
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, index * 350);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const projectsSection = document.getElementById("projects");
  if (projectsSection) {
    const revealBlock = projectsSection.querySelector(".reveal-block");
    const cards = projectsSection.querySelectorAll(".project-card");

    if (revealBlock) observer.observe(revealBlock);
    cards.forEach((card) => observer.observe(card));
  }
});
