import { projectsData } from "../data/projects.js";

// =========================================================================
// PANNEAU DÉTAILS PROJET (même page, fondu gauche → droite)
// Regroupe tout ce qui concerne le panneau : openDetails/closeDetails,
// carousel, clic sur carte, tilt 3D au survol et touche Escape.
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
    carouselPrev.disabled = index === 0;
    carouselNext.disabled = index >= data.colors.length - 1;

    const items = carouselTrack.querySelectorAll(".carousel__item");
    items.forEach((item, i) => {
      item.classList.toggle("active", i === index);
    });

    detailsMainImg.style.backgroundColor = data.colors[index];
    detailsCaption.textContent = data.captions?.[index] ?? data.caption;

    const activeItem = items[index];
    if (!activeItem) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    carouselTrack.scrollTo({
      left: activeItem.offsetLeft - carouselTrack.offsetLeft,
      behavior: prefersReduced ? "auto" : "smooth"
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

    // Rendu sécurisé : nœuds créés via createElement + textContent
    // (aucune écriture HTML directe) pour les tags et les vignettes.
    detailsTags.replaceChildren(
      ...data.tech.map((t) => {
        const s = document.createElement("span");
        s.textContent = t;
        return s;
      })
    );

    carouselTrack.replaceChildren(
      ...data.colors.map((color, i) => {
        const item = document.createElement("div");
        item.className = "carousel__item";
        if (i === 0) item.classList.add("active");
        item.style.backgroundColor = color;
        return item;
      })
    );
    updateCarousel(carouselIndex);

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

    const announce = document.createElement("div");
    announce.setAttribute("aria-live", "polite");
    announce.className = "sr-only";
    announce.textContent = `Détails du projet : ${data.title}`;
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

  document.querySelectorAll(".project-card").forEach((card) => {
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
