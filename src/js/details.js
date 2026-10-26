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
    detailsPanel.hidden = false;

    lastFocused = document.activeElement;
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
}
