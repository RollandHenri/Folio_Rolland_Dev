// =========================================================================
// SÉLECTEUR DE LANGUE (FR / EN)
// Dictionnaire fr/en + applyLang : attributs data-i18n (textContent),
// data-i18n-aria (aria-label), état actif des boutons FR/EN et
// documentElement.lang. Le choix est persisté via les helpers sécurisés
// de storage.js (safeGet/safeSet) et un événement "folio:langchange"
// est émis après chaque application pour que l'UI ouverte se re-render.
// =========================================================================
import { safeGet, safeSet } from "./storage.js";

const LANG_KEY = "folioLang";

// Textes FR = contenu actuel de index.html (verbatim) ; textes EN = Annexe A.
const dict = {
  fr: {
    "nav.about": "À propos",
    "nav.projects": "Projets",
    "nav.contact": "Contact",
    "nav.menu": "Menu",
    "hero.role": "Développeur front-end",
    "hero.tagline": "Des expériences web claires, rapides et émotionnelles.",
    "hero.cta.projects": "Voir les projets",
    "hero.cta.contact": "Me contacter",
    "about.title": "À propos",
    "about.text":
      "Développeur front-end basé à Saint Nazaire, je conçois des interfaces web sur mesure. Spécialisé dans la performance et le design éditorial, j’accompagne startups et équipes produit du premier wireframe à la mise en production.",
    "projects.title": "Projets",
    "contact.title": "Contact",
    "details.back": "Retour aux projets",
    "details.prev": "Image précédente",
    "details.next": "Image suivante",
    "details.visit": "Voir le site",
    "details.titleFallback": "Titre du projet",
    "details.descFallback": "Résumé du projet...",
    "projects.1.title": "Atlas — Plateforme e-commerce",
    "projects.1.desc": "Boutique headless : catalogue, paiement et back-office unifiés.",
    "projects.1.link": "Voir le cas",
    "projects.2.title": "Pulse — Tableau de bord temps réel",
    "projects.2.desc": "Suivi d’indicateurs live pour une équipe ops.",
    "projects.2.link": "Voir le cas",
    "projects.3.title": "Flux — Application collaborative",
    "projects.3.desc": "Gestion de projet collaborative pour une équipe distribuée.",
    "projects.3.link": "Voir le cas",
    "projects.4.title": "Nebula — Plateforme de streaming",
    "projects.4.desc": "Diffusion vidéo haute définition avec recommandation IA.",
    "projects.4.link": "Voir le cas",
    "projects.5.title": "Orbit — Outil de productivité",
    "projects.5.desc": "Organisation de tâches et collaboration en équipe simplifiée.",
    "projects.5.link": "Voir le cas",
    "projects.6.title": "Zen — Application bien-être",
    "projects.6.desc": "Méditation guidée et suivi du sommeil personnalisé.",
    "projects.6.link": "Voir le cas",
  },
  en: {
    "nav.about": "About",
    "nav.projects": "Projects",
    "nav.contact": "Contact",
    "nav.menu": "Menu",
    "hero.role": "Front-end developer",
    "hero.tagline": "Clear, fast, and emotional web experiences.",
    "hero.cta.projects": "See projects",
    "hero.cta.contact": "Get in touch",
    "about.title": "About",
    "about.text":
      "A front-end developer based in Saint-Nazaire, I craft bespoke web interfaces. Specialised in performance and editorial design, I support startups and product teams from the first wireframe to production.",
    "projects.title": "Projects",
    "contact.title": "Contact",
    "details.back": "Back to projects",
    "details.prev": "Previous image",
    "details.next": "Next image",
    "details.visit": "Visit site",
    "details.titleFallback": "Project title",
    "details.descFallback": "Project summary...",
    "projects.1.title": "Atlas — E-commerce platform",
    "projects.1.desc": "Headless storefront: unified catalogue, checkout and back-office.",
    "projects.1.link": "View case",
    "projects.2.title": "Pulse — Real-time dashboard",
    "projects.2.desc": "Live KPI tracking and high-performance analytics for ops teams.",
    "projects.2.link": "View case",
    "projects.3.title": "Flux — Collaborative app",
    "projects.3.desc": "Real-time collaborative project management built for distributed teams.",
    "projects.3.link": "View case",
    "projects.4.title": "Nebula — Streaming platform",
    "projects.4.desc": "High-definition video delivery with AI recommendations.",
    "projects.4.link": "View case",
    "projects.5.title": "Orbit — Productivity tool",
    "projects.5.desc": "Simplified task management and team collaboration.",
    "projects.5.link": "View case",
    "projects.6.title": "Zen — Wellness app",
    "projects.6.desc": "Guided meditation and personalised sleep tracking.",
    "projects.6.link": "View case",
  },
};

let currentLang = "fr";

export function getLang() {
  return currentLang;
}

function applyLang(lang) {
  currentLang = lang;

  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const value = dict[lang][el.getAttribute("data-i18n")];
    if (value != null) el.textContent = value;
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const value = dict[lang][el.getAttribute("data-i18n-aria")];
    if (value != null) el.setAttribute("aria-label", value);
  });

  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.classList.toggle("lang-btn--active", btn.getAttribute("data-lang") === lang);
  });

  safeSet(LANG_KEY, lang);

  window.dispatchEvent(new CustomEvent("folio:langchange", { detail: { lang } }));
}

export function initLang() {
  // Choix persisté, sinon langue du navigateur, sinon français.
  const stored = safeGet(LANG_KEY);
  const initial =
    stored === "en" || stored === "fr"
      ? stored
      : navigator.language?.startsWith("en")
        ? "en"
        : "fr";

  applyLang(initial);

  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyLang(btn.getAttribute("data-lang"));
    });
  });
}
