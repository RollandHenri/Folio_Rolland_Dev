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

  //============================================================================
  // Gestion de la section Projects
  //============================================================================

  const cardGrid = document.getElementById("cardGrid");
  const cards = document.querySelectorAll(".card");
  const modalOverlay = document.getElementById("modalOverlay");
  const expandedCard = document.getElementById("expandedCard");
  const btnBack = document.getElementById("btnBack");

  const modalTitle = document.getElementById("modalTitle");
  const modalImage = document.getElementById("modalImage");
  const modalDescription = document.getElementById("modalDescription");
  const modalTechs = document.getElementById("modalTechs");
  const btnVisit = document.getElementById("btnVisit");

  let activeCard = null;
  let flipState = null;
  let pendingTimeouts = [];

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();

      // Annuler tous les timers de fermeture en attente pour éviter qu'ils ne cassent la nouvelle ouverture
      pendingTimeouts.forEach((id) => clearTimeout(id));
      pendingTimeouts = [];

      // Réinitialiser l'état de l'ouverture précédente pour que le premier clic fonctionne
      expandedCard.classList.remove("active", "fading-out");
      modalOverlay.classList.remove("active");
      expandedCard.style.transition = "";
      expandedCard.style.transform = "";
      expandedCard.style.top = "";
      expandedCard.style.left = "";
      expandedCard.style.width = "";
      expandedCard.style.height = "";
      expandedCard.style.borderRadius = "";
      activeCard = null;
      flipState = null;

      activeCard = card;
      const dataNode = card.querySelector(".card-detail-data");

      cardGrid.classList.add("no-hover");

      // FIRST (F)
      const firstRect = card.getBoundingClientRect();

      modalTitle.textContent = dataNode.dataset.title;
      modalImage.style.backgroundImage = `url('${dataNode.dataset.image}')`;
      modalDescription.textContent = dataNode.dataset.description;
      btnVisit.href = dataNode.dataset.url;

      modalTechs.replaceChildren();
      const techArray = dataNode.dataset.techs.split(",");
      techArray.forEach((tech) => {
        const badge = document.createElement("span");
        badge.className = "tech-badge";
        badge.textContent = tech;
        modalTechs.appendChild(badge);
      });

      // LAST (L)
      const gridRect = cardGrid.getBoundingClientRect();
      const targetWidth = gridRect.width * 0.8;
      const targetHeight = gridRect.height * 0.8 * 1.2;
      const targetTop = gridRect.top + (gridRect.height - targetHeight) / 2;
      const targetLeft = gridRect.left + (gridRect.width - targetWidth) / 2;

      // Décalage de l'overlay par rapport au viewport (top:10%, left:10% du wrapper)
      const overlayTop = gridRect.top + gridRect.height * 0.1;
      const overlayLeft = gridRect.left + gridRect.width * 0.1;

      expandedCard.style.width = `${targetWidth}px`;
      expandedCard.style.height = `${targetHeight}px`;

      // INVERT (I)
      const scaleX = firstRect.width / targetWidth;
      const scaleY = firstRect.height / targetHeight;
      const translateX = firstRect.left - targetLeft;
      const translateY = firstRect.top - targetTop;

      flipState = {
        translateX,
        translateY,
        scaleX,
        scaleY,
        targetTop,
        targetLeft,
      };

      expandedCard.style.transition = "none";
      expandedCard.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`;
      expandedCard.style.top = `${targetTop - overlayTop}px`;
      expandedCard.style.left = `${targetLeft - overlayLeft}px`;
      expandedCard.style.borderRadius = `${12 / scaleX}px`;

      expandedCard.classList.remove("fading-out");
      card.classList.add("ghost");
      modalOverlay.classList.add("active");
      expandedCard.classList.add("active");

      expandedCard.offsetHeight;

      // PLAY (P)
      expandedCard.style.transition =
        "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), border-radius 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease";
      expandedCard.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
      expandedCard.style.borderRadius = "16px";

      cardGrid.classList.add("blurred");
    });
  });

  // Séquence de fermeture douce et étagée
  function closeModal() {
    if (!activeCard || !flipState) return;

    // Retirer active immédiatement pour couper le fond gris
    modalOverlay.classList.remove("active");

    // Cacher immédiatement le fond gris pour éviter tout résidu visuel
    const backdrop = document.querySelector(".modal-backdrop");
    if (backdrop) {
      backdrop.style.display = "none";
    }

    // 1. Début du mouvement de repli de la carte (durée 1.2s)
    expandedCard.style.transition =
      "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), border-radius 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease";
    expandedCard.style.transform = `translate3d(${flipState.translateX}px, ${flipState.translateY}px, 0) scale(${flipState.scaleX}, ${flipState.scaleY})`;
    expandedCard.style.borderRadius = `${12 / flipState.scaleX}px`;

    cardGrid.classList.remove("blurred");
    cardGrid.classList.remove("no-hover");

    // 2. À 0.7s : La carte réduite commence à fondre vers 0 en 0.3s (Terminé à 1.0s)
    pendingTimeouts.push(setTimeout(() => {
      expandedCard.classList.add("fading-out");
    }, 700));

    // 3. Dès 0.4s : Toutes les cartes retrouvent leur état normal (ghost retiré)
    pendingTimeouts.push(setTimeout(() => {
      document.querySelectorAll(".card").forEach((c) => c.classList.remove("ghost"));
    }, 400));

    // 4. À 1.5s (fin complète des 0.3s d'apparition de la carte originale) : Nettoyage final
    pendingTimeouts.push(setTimeout(() => {
      expandedCard.classList.remove("active", "fading-out");
      activeCard = null;
      flipState = null;
      cardGrid.classList.remove("no-hover");
    }, 1500));
  }

  btnBack.addEventListener("click", closeModal);

  // Fermer en cliquant sur le fond de l'overlay (en dehors de la carte)
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === document.querySelector(".modal-backdrop")) {
      closeModal();
    }
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
    rootMargin: "0px 0px 0px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const cardIndex = Array.from(
          document.querySelectorAll(".project-card"),
        ).indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, cardIndex * 150);
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
