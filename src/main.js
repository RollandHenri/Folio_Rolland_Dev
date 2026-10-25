document.addEventListener("DOMContentLoaded", () => {
  // Toujours revenir en haut de page à l'actualisation / chargement
  window.scrollTo(0, 0);

  // Cache par session : les animations ne se jouent qu'une fois par session
  const ANIMATIONS_DONE_KEY = "folioAnimationsDone";
  const animationsAlreadyDone =
    sessionStorage.getItem(ANIMATIONS_DONE_KEY) === "1";

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
  // PANNEAU DÉTAILS PROJET (même page, fondu gauche → droite)
  // =========================================================================
  const detailsPanel = document.getElementById("project-details");
  const detailsBack = detailsPanel?.querySelector(".project-details__back");
  const detailsTitle = document.getElementById("details-title");
  const detailsTags = document.getElementById("details-tags");
  const detailsDesc = document.getElementById("details-desc");
  const detailsLink = document.getElementById("details-link");
  const detailsMainImg = document.getElementById("details-main-img");
  const detailsCaption = document.getElementById("details-caption");
  const carouselTrack = document.getElementById("carousel-track");
  const carouselPrev = document.querySelector(".carousel__btn--prev");
  const carouselNext = document.querySelector(".carousel__btn--next");
  const mainContent = document.querySelector("main");

  const projectsData = {
    1: {
      title: "Atlas — Plateforme e-commerce",
      desc: "Boutique headless complète : catalogue performant, paiement sécurisé et back-office unifié.",
      tech: ["React", "Node.js", "Stripe", "PostgreSQL"],
      link: "https://example.com/atlas",
      color: "#ff4d00",
      colors: ["#ff4d00", "#c43500", "#ff6b35"],
      caption: "Aperçu de la boutique headless Atlas"
    },
    2: {
      title: "Pulse — Tableau de bord temps réel",
      desc: "Suivi d'indicateurs live et graphiques analytiques haute performance dédiés aux équipes ops.",
      tech: ["Vue", "D3.js", "WebSocket", "Redis"],
      link: "https://example.com/pulse",
      color: "#10b981",
      colors: ["#10b981", "#059669", "#34d399"],
      caption: "Tableau de bord Pulse en temps réel"
    },
    3: {
      title: "Flux — Application collaborative",
      desc: "Outil de gestion de projet collaboratif en temps réel conçu pour les équipes distribuées.",
      tech: ["React", "Firebase", "TypeScript", "Tailwind"],
      link: "https://example.com/flux",
      color: "#3b82f6",
      colors: ["#3b82f6", "#2563eb", "#60a5fa"],
      caption: "Interface collaborative Flux"
    },
    4: {
      title: "Nebula — Plateforme de streaming",
      desc: "Diffusion vidéo haute définition avec recommandation IA.",
      tech: ["React", "Node.js", "AWS", "Python"],
      link: "https://example.com/nebula",
      color: "#a855f7",
      colors: ["#a855f7", "#9333ea", "#c084fc"],
      caption: "Lecteur vidéo Nebula"
    },
    5: {
      title: "Orbit — Outil de productivité",
      desc: "Organisation de tâches et collaboration en équipe simplifiée.",
      tech: ["Vue", "Nuxt", "Supabase", "JavaScript"],
      link: "https://example.com/orbit",
      color: "#f59e0b",
      colors: ["#f59e0b", "#d97706", "#fbbf24"],
      caption: "Tableau de bord Orbit"
    },
    6: {
      title: "Zen — Application bien-être",
      desc: "Méditation guidée et suivi du sommeil personnalisé.",
      tech: ["React Native", "Expo", "Node.js", "MongoDB"],
      link: "https://example.com/zen",
      color: "#14b8a6",
      colors: ["#14b8a6", "#0d9488", "#5eead4"],
      caption: "Interface Zen bien-être"
    }
  };

  let currentProjectId = null;
  let carouselIndex = 0;

  function updateCarouselButtons() {
    if (!carouselTrack || !currentProjectId) return;
    const data = projectsData[currentProjectId];
    carouselPrev.disabled = carouselIndex === 0;
    carouselNext.disabled = carouselIndex >= data.colors.length - 1;

    const items = carouselTrack.querySelectorAll(".carousel__item");
    items.forEach((item, i) => {
      item.classList.toggle("active", i === carouselIndex);
    });
  }

  function openDetails(id) {
    const data = projectsData[id];
    if (!data || !detailsPanel) return;

    currentProjectId = id;
    carouselIndex = 0;

    detailsTitle.textContent = data.title;
    detailsDesc.textContent = data.desc;
    detailsLink.href = data.link;
    detailsMainImg.style.backgroundColor = data.color;
    detailsCaption.textContent = data.caption;

    detailsTags.innerHTML = data.tech.map((t) => `<span>${t}</span>`).join("");

    carouselTrack.innerHTML = data.colors
      .map(
        (color, i) =>
          `<div class="carousel__item${i === 0 ? ' active' : ''}" style="background-color: ${color};"></div>`
      )
      .join("");
    updateCarouselButtons();

    detailsPanel.setAttribute("aria-hidden", "false");

    if (mainContent) {
      mainContent.classList.add("is-exiting");
      mainContent.classList.add("is-dimmed");
    }

    setTimeout(() => {
      if (mainContent) mainContent.hidden = true;
      detailsPanel.hidden = false;
      detailsPanel.classList.add("is-entering");

      detailsBack.focus();

      const announce = document.createElement("div");
      announce.setAttribute("aria-live", "polite");
      announce.className = "sr-only";
      announce.textContent = `Détails du projet : ${data.title}`;
      detailsPanel.appendChild(announce);
      setTimeout(() => announce.remove(), 1000);
    }, 200);
  }

  function closeDetails() {
    if (!detailsPanel || !mainContent) return;

    detailsPanel.classList.remove("is-entering");
    detailsPanel.classList.add("is-exiting");

    setTimeout(() => {
      detailsPanel.hidden = true;
      detailsPanel.classList.remove("is-exiting");
      detailsPanel.setAttribute("aria-hidden", "true");

      mainContent.classList.remove("is-exiting");
      mainContent.classList.remove("is-dimmed");
      mainContent.hidden = false;
      mainContent.offsetHeight; // forcer le reflow pour relancer l'animation
      mainContent.classList.add("is-entering");

      setTimeout(() => {
        mainContent.classList.remove("is-entering");
      }, 200);

      const projectsSection = document.getElementById("projects");
      if (projectsSection) {
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        projectsSection.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
      }

      const lastCard = document.querySelector(`[data-project="${currentProjectId}"]`);
      if (lastCard) lastCard.focus();

      currentProjectId = null;
    }, 200);
  }

  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const id = card.getAttribute("data-project");
      openDetails(id);
    });

    // Rotation 3D de la carte qui suit la curseur au survol
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxRotate = 10; // degrés max d'inclinaison
      const rotateY = ((x - centerX) / centerX) * maxRotate;
      const rotateX = -((y - centerY) / centerY) * maxRotate;

      card.style.setProperty("--rotate-x", `${rotateX}deg`);
      card.style.setProperty("--rotate-y", `${rotateY}deg`);
    });

    card.addEventListener("mouseleave", () => {
      card.style.setProperty("--rotate-x", "0deg");
      card.style.setProperty("--rotate-y", "0deg");
    });
  });

  if (detailsBack) {
    detailsBack.addEventListener("click", closeDetails);
  }

  detailsPanel?.addEventListener("click", (e) => {
    if (e.target === detailsPanel) closeDetails();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && detailsPanel && !detailsPanel.hidden) {
      closeDetails();
    }
  });

  carouselPrev?.addEventListener("click", () => {
    if (!currentProjectId) return;
    carouselIndex = Math.max(0, carouselIndex - 1);
    updateCarouselButtons();
  });

  carouselNext?.addEventListener("click", () => {
    if (!currentProjectId) return;
    const data = projectsData[currentProjectId];
    carouselIndex = Math.min(data.colors.length - 1, carouselIndex + 1);
    updateCarouselButtons();
  });

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

  // =========================================================================
  // FOND ANIMÉ : CONSTELLATION (canvas derrière tout le contenu)
  // Enveloppé dans try/catch pour ne jamais bloquer le reste du site
  // =========================================================================
  try {
    (function initConstellation() {
      const canvas = document.getElementById("constellation-bg");
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      let width, height;
      let stars = [];
      let mouse = { x: -9999, y: -9999 };

      // ═══════════════════════════════════════════════════════════════════════════
      // PARAMÈTRES DE RÉGLAGE DE L'ANIMATION CONSTELLATION
      // ═══════════════════════════════════════════════════════════════════════════
      // Nombre total d'étoiles affichées sur le fond
      const STAR_COUNT = 56;
      // Distance max (px) pour tracer une ligne de connexion entre deux étoiles
      const CONNECT_DIST = 280;

      // Rayon (px) dans lequel une étoile est "capturée" par la souris
      const CAPTURE_DIST = 60;

      // Nombre d'étoiles capturées nécessaires pour déclencher une explosion de groupe
      const MAX_CAPTURED = 10;

      // Vitesse d'attraction fluide vers la souris (0 = immobile, 1 = instantané)
      const ATTRACTION_SPEED = 0.08;

      // Force de propulsion de l'explosion de groupe (plus haut = plus violent)
      const EXPLODE_FORCE = 25;

      // Amorti de l'explosion (0.92 = ralentissement progressif après propulsion)
      const EXPLODE_DAMPING = 0.92;

      // Vitesse de retour vers la position d'origine après explosion (0.03 = lent)
      const RETURN_SPEED = 0.06;
      // ═══════════════════════════════════════════════════════════════════════════

      function resize() {
        const dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        initStars();
      }

      function initStars() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
          stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            baseX: Math.random() * width,
            baseY: Math.random() * height,
            radius: Math.random() * 1.5 + 1.5,
            alpha: Math.random() * 0.4 + 0.4,
            explodeVx: 0,
            explodeVy: 0,
            explodeTimer: 0,
            captured: false,
          });
        }
      }

      function draw() {
        ctx.clearRect(0, 0, width, height);

        // --- Détection des étoiles capturées par la souris ---
        const capturedStars = [];
        stars.forEach((star) => {
          const dx = mouse.x - star.x;
          const dy = mouse.y - star.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CAPTURE_DIST && star.explodeTimer === 0) {
            star.captured = true;
            capturedStars.push(star);
          } else {
            star.captured = false;
          }
        });

        // --- Explosion de groupe : quand MAX_CAPTURED étoiles sont capturées ---
        if (capturedStars.length >= MAX_CAPTURED) {
          capturedStars.forEach((star) => {
            const angle = Math.atan2(star.y - mouse.y, star.x - mouse.x);
            star.explodeVx = Math.cos(angle) * EXPLODE_FORCE;
            star.explodeVy = Math.sin(angle) * EXPLODE_FORCE;
            star.explodeTimer = 30;
            star.captured = false;
          });
        }

        stars.forEach((star, i) => {
          // --- Phase explosion : si un timer est actif ---
          if (star.explodeTimer > 0) {
            star.x += star.explodeVx;
            star.y += star.explodeVy;
            star.explodeVx *= EXPLODE_DAMPING;
            star.explodeVy *= EXPLODE_DAMPING;
            star.explodeTimer--;

            // Retour progressif vers la position d'origine après l'explosion
            const dx = star.baseX - star.x;
            const dy = star.baseY - star.y;
            star.x += dx * RETURN_SPEED;
            star.y += dy * RETURN_SPEED;
          } else if (star.captured) {
            // --- Attraction fluide vers la souris (lerp doux) ---
            const dx = mouse.x - star.x;
            const dy = mouse.y - star.y;
            star.x += dx * ATTRACTION_SPEED;
            star.y += dy * ATTRACTION_SPEED;
          } else {
            // --- Mouvement propre de l'étoile (déplacement continu) ---
            star.x += star.vx;
            star.y += star.vy;

            // Rebond sur les bords de l'écran
            if (star.x < 0 || star.x > width) star.vx *= -1;
            if (star.y < 0 || star.y > height) star.vy *= -1;
          }

          // Dessin de l'étoile
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 77, 0, ${star.alpha})`;
          ctx.fill();

          // Lignes de connexion (y compris pendant l'explosion de groupe)
          if (!star.captured) {
            for (let j = i + 1; j < stars.length; j++) {
              const other = stars[j];
              if (other.captured || other.explodeTimer > 0) continue;

              const ddx = other.x - star.x;
              const ddy = other.y - star.y;
              const d = Math.sqrt(ddx * ddx + ddy * ddy);

              if (d < CONNECT_DIST) {
                const opacity = 1 - d / CONNECT_DIST;
                ctx.beginPath();
                ctx.moveTo(star.x, star.y);
                ctx.lineTo(other.x, other.y);
                ctx.strokeStyle = `rgba(255, 77, 0, ${opacity * 0.4})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
              }
            }
          }
        });

        requestAnimationFrame(draw);
      }

      window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      });

      window.addEventListener("mouseleave", () => {
        mouse.x = -9999;
        mouse.y = -9999;
      });

      window.addEventListener("resize", resize);
      resize();
      draw();
    })();
  } catch (e) {
    console.warn("Constellation désactivée :", e);
  }
});
