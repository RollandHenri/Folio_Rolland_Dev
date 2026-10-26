// =========================================================================
// DONNÉES DES PROJETS (consommées par le panneau détails — src/js/details.js)
// Champs bilingues : title / desc / caption / captions sont des objets
// { fr, en } ; captions est un objet { fr, en } de tableaux alignés 1:1
// sur colors. tech / link / color / colors sont langues-indépendants.
// =========================================================================
export const projectsData = {
  1: {
    title: { fr: "Atlas — Plateforme e-commerce", en: "Atlas — E-commerce platform" },
    desc: {
      fr: "Boutique headless complète : catalogue performant, paiement sécurisé et back-office unifié.",
      en: "Headless storefront: unified catalogue, checkout and back-office."
    },
    tech: ["React", "Node.js", "Stripe", "PostgreSQL"],
    link: "https://example.com/atlas",
    color: "#ff4d00",
    colors: ["#ff4d00", "#c43500", "#ff6b35"],
    captions: {
      fr: ["Aperçu de la boutique headless Atlas", "Catalogue et filtres de recherche", "Tunnel de paiement sécurisé"],
      en: ["Preview of the Atlas headless store", "Catalogue and search filters", "Secure checkout tunnel"]
    },
    caption: { fr: "Aperçu de la boutique headless Atlas", en: "Preview of the Atlas headless store" }
  },
  2: {
    title: { fr: "Pulse — Tableau de bord temps réel", en: "Pulse — Real-time dashboard" },
    desc: {
      fr: "Suivi d'indicateurs live et graphiques analytiques haute performance dédiés aux équipes ops.",
      en: "Live KPI tracking and high-performance analytics for ops teams."
    },
    tech: ["Vue", "D3.js", "WebSocket", "Redis"],
    link: "https://example.com/pulse",
    color: "#10b981",
    colors: ["#10b981", "#059669", "#34d399"],
    captions: {
      fr: ["Tableau de bord Pulse en temps réel", "Graphiques analytiques en direct", "Vue des alertes ops"],
      en: ["The Pulse dashboard in real time", "Live analytics charts", "Ops alerts view"]
    },
    caption: { fr: "Tableau de bord Pulse en temps réel", en: "The Pulse dashboard in real time" }
  },
  3: {
    title: { fr: "Flux — Application collaborative", en: "Flux — Collaborative app" },
    desc: {
      fr: "Outil de gestion de projet collaboratif en temps réel conçu pour les équipes distribuées.",
      en: "Real-time collaborative project management built for distributed teams."
    },
    tech: ["React", "Firebase", "TypeScript", "Tailwind"],
    link: "https://example.com/flux",
    color: "#3b82f6",
    colors: ["#3b82f6", "#2563eb", "#60a5fa"],
    captions: {
      fr: ["Interface collaborative Flux", "Édition en temps réel", "Vue équipe distribuée"],
      en: ["The Flux collaborative interface", "Real-time editing", "Distributed team view"]
    },
    caption: { fr: "Interface collaborative Flux", en: "The Flux collaborative interface" }
  },
  4: {
    title: { fr: "Nebula — Plateforme de streaming", en: "Nebula — Streaming platform" },
    desc: {
      fr: "Diffusion vidéo haute définition avec recommandation IA.",
      en: "High-definition video delivery with AI recommendations."
    },
    tech: ["React", "Node.js", "AWS", "Python"],
    link: "https://example.com/nebula",
    color: "#a855f7",
    colors: ["#a855f7", "#9333ea", "#c084fc"],
    captions: {
      fr: ["Lecteur vidéo Nebula", "Catalogue et recommandations", "Lecture haute définition"],
      en: ["The Nebula video player", "Catalogue and recommendations", "High-definition playback"]
    },
    caption: { fr: "Lecteur vidéo Nebula", en: "The Nebula video player" }
  },
  5: {
    title: { fr: "Orbit — Outil de productivité", en: "Orbit — Productivity tool" },
    desc: {
      fr: "Organisation de tâches et collaboration en équipe simplifiée.",
      en: "Simplified task management and team collaboration."
    },
    tech: ["Vue", "Nuxt", "Supabase", "JavaScript"],
    link: "https://example.com/orbit",
    color: "#f59e0b",
    colors: ["#f59e0b", "#d97706", "#fbbf24"],
    captions: {
      fr: ["Tableau de bord Orbit", "Gestion des tâches", "Vue collaboration d'équipe"],
      en: ["The Orbit dashboard", "Task management", "Team collaboration view"]
    },
    caption: { fr: "Tableau de bord Orbit", en: "The Orbit dashboard" }
  },
  6: {
    title: { fr: "Zen — Application bien-être", en: "Zen — Wellness app" },
    desc: {
      fr: "Méditation guidée et suivi du sommeil personnalisé.",
      en: "Guided meditation and personalised sleep tracking."
    },
    tech: ["React Native", "Expo", "Node.js", "MongoDB"],
    link: "https://example.com/zen",
    color: "#14b8a6",
    colors: ["#14b8a6", "#0d9488", "#5eead4"],
    captions: {
      fr: ["Interface Zen bien-être", "Sessions de méditation guidée", "Suivi du sommeil"],
      en: ["The Zen wellness interface", "Guided meditation sessions", "Sleep tracking"]
    },
    caption: { fr: "Interface Zen bien-être", en: "The Zen wellness interface" }
  }
};
