import "./style.css";
import { initIntro } from "./js/intro.js";
import { initConstellation } from "./js/constellation.js";
import { initDetails } from "./js/details.js";
import { initNav } from "./js/nav.js";

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
  // PANNEAU DÉTAILS PROJET (openDetails/closeDetails, carousel, tilt, Escape)
  // =========================================================================
  initDetails();

  // =========================================================================
  // SÉLECTEUR DE LANGUE (FR / EN)
  // (provisoirement ici — sera isolé dans src/js/lang.js)
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
  // (try/catch interne : ne bloque jamais le reste du site)
  // =========================================================================
  initConstellation();
});
