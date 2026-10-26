import { initIntro } from "./js/intro.js";
import { initConstellation } from "./js/constellation.js";
import { initNav } from "./js/nav.js";
import { initLang } from "./js/lang.js";

document.addEventListener("DOMContentLoaded", () => {
  // Toujours revenir en haut de page à l'actualisation / chargement,
  // sans animation visible (corrige le scroll fluide parasite au refresh)
  window.scrollTo({ top: 0, behavior: "instant" });

  // Séquence loader / unveil / intro hero, robustifiée : accès sécurisé au
  // sessionStorage, catch global et failsafe de déverrouillage du scroll.
  initIntro({
    onDone: () => {
      // Le site est révélé : rien à faire ici pour l'instant.
    },
  });

  // =========================================================================
  // GESTION DE L'ANNÉE DANS LE FOOTER
  // =========================================================================
  const yearEl = document.getElementById("footer-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }

  // =========================================================================
  // NAVIGATION MOBILE (menu burger)
  // =========================================================================
  initNav();

  // =========================================================================
  // SÉLECTEUR DE LANGUE (FR / EN) — dictionnaire, boutons et persistance
  // (voir src/js/lang.js)
  // =========================================================================
  initLang();

  // =========================================================================
  // PROJETS : APPARITION EN FONDU AU SCROLL
  // =========================================================================
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -200px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const cardIndex = Array.from(
          document.querySelectorAll(".project-card")
        ).indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, cardIndex * 400);
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
  // (try/catch interne : ne bloque jamais le reste du site)
  // =========================================================================
  initConstellation();
});
