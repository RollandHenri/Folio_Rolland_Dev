// =========================================================================
// NAVIGATION MOBILE (menu burger)
// Bascule .nav__list.is-open + aria-expanded sur le bouton, fermeture au
// clic sur un lien, à la touche Échap, et au passage du viewport à ≥ 701px.
// =========================================================================
export function initNav() {
  const toggle = document.querySelector(".nav__toggle");
  const list = document.getElementById("nav-list");

  if (!toggle || !list) return;

  function closeNav() {
    list.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    const isOpen = list.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Fermeture au clic sur n'importe quel lien de la liste
  list.addEventListener("click", (event) => {
    if (event.target.closest(".nav__link")) closeNav();
  });

  // Fermeture à la touche Échap (menu ouvert uniquement)
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && list.classList.contains("is-open")) {
      closeNav();
    }
  });

  // Fermeture automatique quand le viewport repasse en desktop (≥ 701px)
  const desktopQuery = window.matchMedia("(min-width: 701px)");
  desktopQuery.addEventListener("change", (event) => {
    if (event.matches) closeNav();
  });
}
