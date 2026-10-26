import { projectsData } from "../data/projects.js";
import { getLang } from "./lang.js";

// =========================================================================
// PANNEAU DÉTAILS PROJET (même page, fondu gauche → droite)
// Regroupe tout ce qui concerne le panneau : openDetails/closeDetails,
// carousel, clic sur le lien de la carte, tilt 3D au survol et touche
// Escape. Les textes sont bilingues (projectsData { fr, en }) : la langue
// courante vient de getLang() et le panneau ouvert se re-remplit à chaque
// changement de langue (événement "folio:langchange").
// =========================================================================
export function initDetails() {
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

  let currentProjectId = null;
  let carouselIndex = 0;
  let lastFocused = null;

  // SEULE source de vérité de l'affichage du carrousel : état des
  // boutons, vignette active, image principale, légende et défilement
  // horizontal de la vignette active (respecte prefers-reduced-motion).
  function updateCarousel(index) {
    if (!carouselTrack || !currentProjectId) return;
    const data = projectsData[currentProjectId];
    const lang = getLang();
    carouselPrev.disabled = index === 0;
    carouselNext.disabled = index >= data.colors.length - 1;

    const items = carouselTrack.querySelectorAll(".carousel__item");
    items.forEach((item, i) => {
      item.classList.toggle("active", i === index);
    });

    detailsMainImg.style.backgroundColor = data.colors[index];
    detailsCaption.textContent = data.captions[lang][index] ?? data.caption[lang];

    const activeItem = items[index];
    if (!activeItem) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    carouselTrack.scrollTo({
      left: activeItem.offsetLeft - carouselTrack.offsetLeft,
      behavior: prefersReduced ? "auto" : "smooth"
    });
  }

  // Remplissage du panneau (titre, description, lien, tags, légende) pour
  // le projet id, dans la langue courante. Appelé à l'ouverture ET à chaque
  // changement de langue tant que le panneau reste ouvert.
  function fillDetails(id) {
    const data = projectsData[id];
    if (!data) return;
    const lang = getLang();

    detailsTitle.textContent = data.title[lang];
    detailsDesc.textContent = data.desc[lang];
    detailsLink.href = data.link;

    // Rendu sécurisé : nœuds créés via createElement + textContent
    // (aucune écriture HTML directe) pour les tags.
    detailsTags.replaceChildren(
      ...data.tech.map((t) => {
        const s = document.createElement("span");
        s.textContent = t;
        return s;
      })
    );

    updateCarousel(carouselIndex);
  }

  function openDetails(id) {
    const data = projectsData[id];
    if (!data || !detailsPanel) return;

    currentProjectId = id;
    carouselIndex = 0;

    // Rendu sécurisé : nœuds créés via createElement + style
    // (aucune écriture HTML directe) pour les vignettes du carrousel.
    carouselTrack.replaceChildren(
      ...data.colors.map((color, i) => {
        const item = document.createElement("div");
        item.className = "carousel__item";
        if (i === 0) item.classList.add("active");
        item.style.backgroundColor = color;
        return item;
      })
    );
    fillDetails(id);

    // Capture du focus AVANT de masquer main : masquer l'ancêtre du
    // lien déclencheur réinitialise activeElement sur <body>.
    lastFocused = document.activeElement;

    // Vraie modale : le contenu principal quitte l'arbre (plus
    // focusable ni lisible) et le scroll du body est verrouillé
    // (voir body.details-open dans style.css).
    if (mainContent) mainContent.hidden = true;
    document.body.classList.add("details-open");

    detailsPanel.setAttribute("aria-hidden", "false");
    detailsPanel.hidden = false;

    detailsBack.focus();

    const lang = getLang();
    const announce = document.createElement("div");
    announce.setAttribute("aria-live", "polite");
    announce.className = "sr-only";
    announce.textContent =
      lang === "en"
        ? `Project details: ${data.title[lang]}`
        : `Détails du projet : ${data.title[lang]}`;
    detailsPanel.appendChild(announce);
    setTimeout(() => announce.remove(), 1000);
  }

  function closeDetails() {
    if (!detailsPanel || !mainContent) return;

    detailsPanel.hidden = true;
    detailsPanel.setAttribute("aria-hidden", "true");
    mainContent.hidden = false;
    document.body.classList.remove("details-open");

    const projectsSection = document.getElementById("projects");
    if (projectsSection) {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      projectsSection.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
    }

    lastFocused?.focus({ preventScroll: true });

    currentProjectId = null;
  }

  // Changement de langue (boutons FR/EN) pendant que le panneau est ouvert :
  // on relance le remplissage pour que titre, description, lien et légende
  // suivent la nouvelle langue (les couleurs/vignettes ne changent pas).
  window.addEventListener("folio:langchange", () => {
    if (!currentProjectId || !detailsPanel || detailsPanel.hidden) return;
    fillDetails(currentProjectId);
  });

  // Ouverture du panneau : le déclencheur est le lien "Voir le cas"
  // (focusable au clavier) ; l'article ne porte plus que le tilt 3D.
  document.addEventListener("click", (e) => {
    const link = e.target.closest?.(".project-card__link");
    if (!link) return;
    e.preventDefault();
    const id =
      link.getAttribute("data-project") ||
      link.closest(".project-card")?.getAttribute("data-project");
    if (id) openDetails(id);
  });

  // Tilt 3D : désactivé sur pointeur grossier (tactile) et si l'utilisateur
  // préfère réduire les animations. Les MediaQueryList sont "vivantes" :
  // .matches est relu à chaque événement, sans recréer l'objet.
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.querySelectorAll(".project-card").forEach((card) => {
    // Rotation 3D de la carte qui suit le curseur au survol.
    // Perf : le rect est mesuré UNE fois par session de survol
    // (pointerenter) puis réutilisé dans mousemove — plus aucun
    // getBoundingClientRect dans la boucle de déplacement, et les
    // écritures des variables CSS sont groupées dans un rAF
    // (une frame au maximum, la dernière position du curseur gagne).
    // Si la page défile pendant le survol (listener "scroll" ci-dessous),
    // le rect est re-mesuré : une lecture par frame de scroll au maximum,
    // jamais dans mousemove.
    let rect = null;
    let rafId = null;
    let lastMove = null;
    let scrollRafId = null;

    const tiltDisabled = () =>
      coarsePointer.matches || reducedMotion.matches;

    card.addEventListener("pointerenter", () => {
      if (tiltDisabled()) return;
      rect = card.getBoundingClientRect();
    });

    card.addEventListener("mousemove", (e) => {
      if (tiltDisabled() || !rect) return;
      lastMove = { x: e.clientX, y: e.clientY };
      if (rafId !== null) return; // une frame déjà programmée : on saute
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!rect || !lastMove) return;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const x = lastMove.x - rect.left;
        const y = lastMove.y - rect.top;

        const maxRotate = 10; // degrés max d'inclinaison
        const rotateY = ((x - centerX) / centerX) * maxRotate;
        const rotateX = -((y - centerY) / centerY) * maxRotate;

        card.style.setProperty("--rotate-x", `${rotateX}deg`);
        card.style.setProperty("--rotate-y", `${rotateY}deg`);
      });
    });

    card.addEventListener("mouseleave", () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      rect = null;
      lastMove = null;
      card.style.setProperty("--rotate-x", "0deg");
      card.style.setProperty("--rotate-y", "0deg");
    });

    // Rect périmé en cours de survol : si la page défile alors que le
    // curseur reste immobile sur la carte, pointerenter/leave ne sont
    // pas redéclenchés et le rect en cache ne correspond plus à
    // l'écran (l'inclinaison dérive de ~10° par demi-hauteur de scroll,
    // sans clamp ni correction de sens). On RE-MESURE plutôt qu'on
    // n'invalide : un pointeur immobile ne redéclenche pas fiablement
    // pointerenter, donc l'inclinaison resterait figée. Même throttle
    // que le reste du fichier (une frame rAF en attente max), listener
    // passif, et aucun travail hors survol actif (rect non null).
    window.addEventListener(
      "scroll",
      () => {
        if (rect === null || scrollRafId !== null) return;
        scrollRafId = requestAnimationFrame(() => {
          scrollRafId = null;
          if (rect === null) return; // survol terminé avant la frame
          rect = card.getBoundingClientRect();
        });
      },
      { passive: true }
    );
  });

  if (detailsBack) {
    detailsBack.addEventListener("click", closeDetails);
  }

  detailsPanel?.addEventListener("click", (e) => {
    if (e.target === detailsPanel) closeDetails();
  });

  document.addEventListener("keydown", (e) => {
    if (!detailsPanel || detailsPanel.hidden) return;

    if (e.key === "Escape") {
      closeDetails();
      return;
    }

    // Flèches ←/→ : navigation du carrousel (uniquement panneau ouvert,
    // donc un projet est actif). Même logique de bornage que les boutons.
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const data = projectsData[currentProjectId];
      if (!data) return;
      e.preventDefault();
      const max = data.colors.length - 1;
      carouselIndex =
        e.key === "ArrowLeft"
          ? Math.max(0, carouselIndex - 1)
          : Math.min(max, carouselIndex + 1);
      updateCarousel(carouselIndex);
      return;
    }

    if (e.key !== "Tab") return;

    // Piège de focus : tant que le panneau est ouvert (role="dialog"
    // + aria-modal), Tab / Shift+Tab doit cycler entre le premier et le
    // dernier élément focusable du panneau, sans jamais ressortir.
    const focusables = Array.from(
      detailsPanel.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hidden);

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || !detailsPanel.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !detailsPanel.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  });

  carouselPrev?.addEventListener("click", () => {
    if (!currentProjectId) return;
    carouselIndex = Math.max(0, carouselIndex - 1);
    updateCarousel(carouselIndex);
  });

  carouselNext?.addEventListener("click", () => {
    if (!currentProjectId) return;
    const data = projectsData[currentProjectId];
    carouselIndex = Math.min(data.colors.length - 1, carouselIndex + 1);
    updateCarousel(carouselIndex);
  });
}
