// =========================================================================
// FOND ANIMÉ : CONSTELLATION (canvas derrière tout le contenu)
// Enveloppé dans try/catch pour ne jamais bloquer le reste du site
// =========================================================================
export function initConstellation() {
  try {
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

    // Resize throttlé via rAF : si une frame est déjà programmée, on saute
    // (l'événement resize peut tirer en rafale pendant un glissement de
    // fenêtre). resize() lui-même est inchangé : canvas + ré-init étoiles.
    let resizeRafId = null;

    window.addEventListener("resize", () => {
      if (resizeRafId !== null) return;
      resizeRafId = requestAnimationFrame(() => {
        resizeRafId = null;
        resize();
      });
    });
    resize();
    draw();
  } catch (e) {
    console.warn("Constellation désactivée :", e);
  }
}
