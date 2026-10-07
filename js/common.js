/* ==========================================================================
   HoopMatch · common.js
   Utilidades que usan todas las páginas.
   ========================================================================== */

/* ---------- Helpers de presentación ---------- */

const fmt = (n) => n.toFixed(1);
const formatPrice = (n) => `$${n} USD`;

/* Foto real si existe, emoji si no */
function shoeVisual(shoe) {
  if (shoe.image) {
    return `<img class="shoe-img" src="${shoe.image}" alt="${shoe.brand} ${shoe.name}" loading="lazy" decoding="async" />`;
  }
  return `<span class="shoe-emoji" aria-hidden="true">${shoe.emoji}</span>`;
}

/* Atributos de un link de afiliado. Mientras sea "#" no abre pestaña nueva. */
function affiliateAttrs(shoe) {
  const url = shoe.affiliate || "#";
  if (url === "#") return 'href="#"';
  return `href="${url}" target="_blank" rel="sponsored noopener noreferrer"`;
}

/* ---------- Nota "Cómo puntuamos" ---------- */

/* Pie de página de index, compare y quiz */
function methodNoteHTML() {
  return `<strong>Cómo puntuamos.</strong> ${SCORE_METHOD.note}`;
}

/* ---------- Cursor personalizado (solo con mouse) ---------- */

(function initCursor() {
  const cursor = document.getElementById("cursor");
  const ring = document.getElementById("cursorRing");
  if (!cursor || !ring) return;

  const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!hasMouse) {
    cursor.remove();
    ring.remove();
    return;
  }

  document.body.classList.add("custom-cursor");
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx - 6 + "px";
    cursor.style.top = my - 6 + "px";
  });

  (function animateRing() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.left = rx - 18 + "px";
    ring.style.top = ry - 18 + "px";
    requestAnimationFrame(animateRing);
  })();
})();

/* ---------- Animaciones al hacer scroll ---------- */

function animateBarsIn(el) {
  el.querySelectorAll(".stat-fill, .modal-fill").forEach((f) => {
    if (f.dataset.width) f.style.width = f.dataset.width + "%";
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      animateBarsIn(entry.target);
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.1 }
);

/* Llamar de nuevo después de insertar contenido dinámico */
function observeReveals(root = document) {
  root.querySelectorAll(".reveal:not(.visible)").forEach((el) => revealObserver.observe(el));
}

document.addEventListener("DOMContentLoaded", () => observeReveals());
