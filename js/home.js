/* ==========================================================================
   HoopMatch · home.js  (solo index.html)
   Todo se genera desde SHOES (js/shoes.js): no hay datos duplicados aquí.
   ========================================================================== */

const $ = (sel, root = document) => root.querySelector(sel);

/* ---------- TICKER ---------- */

function renderTicker() {
  const track = $("#tickerTrack");
  if (!track) return;
  const names = SHOES.map((s) => (s.brand === "Jordan Brand" ? s.name : `${s.brand} ${s.name}`));
  const oneSet = names.map((n) => `<span class="ticker-item">${n}</span><span class="ticker-sep">◆</span>`).join("");
  /* 4 copias: la animación mueve -50%, así el loop no deja huecos en pantallas anchas */
  track.innerHTML = oneSet.repeat(4);
}

/* ---------- CARDS ---------- */

const CARD_STATS = [
  ["grip", "fill-neon"],
  ["comodidad", "fill-blue"],
  ["durabilidad", "fill-yellow"],
  ["estilo", "fill-orange"],
];
const REC_ORDER = { yes: 0, ok: 1, no: 2 };
const REC_TAG = { yes: ["good", "✓"], ok: ["ok", "~"], no: ["bad", "✗"] };

function cardHTML(s, i) {
  const stats = CARD_STATS.map(([key, cls]) => {
    const v = s.scores[key];
    return `<div class="stat-row"><div class="stat-label">${STAT_LABELS[key]}</div><div class="stat-bar"><div class="stat-fill ${cls}" data-width="${v * 10}"></div></div><div class="stat-val">${fmt(v)}</div></div>`;
  }).join("");

  const players = POSITIONS.slice()
    .sort((a, b) => REC_ORDER[s.positions[a]] - REC_ORDER[s.positions[b]])
    .map((p) => {
      const [cls, icon] = REC_TAG[s.positions[p]];
      return `<span class="player-tag ${cls}">${icon} ${POSITION_LABELS[p]}</span>`;
    })
    .join("");

  return `
    <article class="shoe-card reveal reveal-delay-${i % 4}" data-id="${s.id}">
      <div class="card-img-wrap">
        <div class="card-badge ${s.badge.cls}">${s.badge.text}</div>
        <div class="card-rating-mini">${fmt(avgScore(s))}<span>/10</span></div>
        ${shoeVisual(s)}
      </div>
      <div class="card-body">
        <div class="card-brand">${s.brand}</div>
        <h3 class="card-name">${s.name}</h3>
        <div class="card-stats">${stats}</div>
        <div class="card-player">${players}</div>
        <div class="card-footer">
          <button type="button" class="btn-detail" data-open="${s.id}">Ver Review</button>
          <a class="btn-price" ${affiliateAttrs(s)}>💸 Ver Oferta</a>
        </div>
      </div>
    </article>`;
}

function renderCards(tag = "all") {
  const grid = $("#cardsGrid");
  const list = SHOES.filter((s) => tag === "all" || shoeTags(s).includes(tag));
  grid.innerHTML = list.length
    ? list.map(cardHTML).join("")
    : '<p class="cards-empty">Ninguna zapatilla cumple este filtro todavía.</p>';
  observeReveals(grid);
}

function initFilters() {
  const wrap = $("#filterWrap");
  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    wrap.querySelectorAll(".filter-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");
    renderCards(btn.dataset.filter);
  });

  /* Click en la card (menos en el link de oferta) abre la review */
  $("#cardsGrid").addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    const card = e.target.closest(".shoe-card");
    if (card) openModal(card.dataset.id);
  });
}

/* ---------- RANKINGS ---------- */

function topStat(s) {
  return STAT_KEYS.reduce((best, k) => (s.scores[k] > s.scores[best] ? k : best), STAT_KEYS[0]);
}

function rankItemHTML(pos, s, tags, scores) {
  const scoreBlocks = scores
    .map(([num, label]) => `<div class="rank-score"><div class="rank-score-num">${num}</div><div class="rank-score-label">${label}</div></div>`)
    .join("");
  return `
    <div class="rank-item rank-${pos} reveal reveal-delay-${Math.min(pos - 1, 4)}">
      <div class="rank-num">${String(pos).padStart(2, "0")}</div>
      <div class="rank-shoe-img">${shoeVisual(s)}</div>
      <div class="rank-info">
        <div class="rank-brand">${s.brand}</div>
        <div class="rank-name">${s.name}</div>
        <div class="rank-tags">${tags.map((t) => `<span class="rank-tag">${t}</span>`).join("")}</div>
      </div>
      <div class="rank-scores">${scoreBlocks}</div>
      <a class="rank-cta" ${affiliateAttrs(s)}>⚡ Ver Precio</a>
    </div>`;
}

function renderRankings() {
  const byTotal = SHOES.slice().sort((a, b) => avgScore(b) - avgScore(a)).slice(0, 5);
  $("#tab-general").innerHTML = byTotal
    .map((s, i) => {
      const k = topStat(s);
      return rankItemHTML(i + 1, s, s.rankTags, [[fmt(s.scores[k]), STAT_SHORT[k]], [fmt(avgScore(s)), "Total"]]);
    })
    .join("");

  const byValue = SHOES.slice().sort((a, b) => valueScore(b) - valueScore(a)).slice(0, 3);
  $("#tab-precio").innerHTML = byValue
    .map((s, i) => rankItemHTML(i + 1, s, [s.valueNote, formatPrice(s.price)], [[fmt(valueScore(s)), "C/P"]]))
    .join("");

  const byOutdoor = SHOES.slice().sort((a, b) => b.courts.outdoor - a.courts.outdoor).slice(0, 3);
  $("#tab-exterior").innerHTML = byOutdoor
    .map((s, i) => rankItemHTML(i + 1, s, [s.outdoorNote], [[fmt(s.courts.outdoor), "Exterior"]]))
    .join("");

  observeReveals($("#ranking"));
}

function initTabs() {
  const tabs = $("#rankingTabs");
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    tabs.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    ["general", "precio", "exterior"].forEach((t) => {
      $("#tab-" + t).hidden = t !== btn.dataset.tab;
    });
    observeReveals($("#tab-" + btn.dataset.tab));
  });
}

/* ---------- MODAL ---------- */

const REC_CLASS = { yes: "rec-yes", ok: "rec-ok", no: "rec-no" };
const REC_ICON = { yes: "✓", ok: "~", no: "✗" };
let lastFocus = null;

function openModal(id) {
  const s = SHOES_BY_ID[id];
  if (!s) return;
  lastFocus = document.activeElement;

  const scores = STAT_KEYS.map(
    (k) => `<div class="modal-score-row"><div class="modal-score-header"><span class="modal-score-label">${STAT_LABELS[k]}</span><span class="modal-score-val">${fmt(s.scores[k])}/10</span></div><div class="modal-bar"><div class="modal-fill" data-width="${s.scores[k] * 10}"></div></div></div>`
  ).join("");

  const recs = POSITIONS.map(
    (p) => `<div class="player-rec-tag ${REC_CLASS[s.positions[p]]}">${REC_ICON[s.positions[p]]} ${POSITION_LABELS[p]}</div>`
  ).join("");

  $("#modalInner").innerHTML = `
    <div class="modal-header">
      <div class="modal-shoe-img">${shoeVisual(s)}</div>
      <div>
        <div class="modal-brand">${s.brand}</div>
        <h3 class="modal-name" id="modalTitle">${s.name}</h3>
        <div class="modal-tagline">${s.tagline} ${s.description}</div>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-section-title">Puntuaciones · Total ${fmt(avgScore(s))}/10</div>
      <div class="modal-scores">${scores}</div>
      <div class="modal-section-title">Pros y Contras</div>
      <div class="pros-cons">
        <ul class="pros-list">${s.pros.map((p) => `<li>${p}</li>`).join("")}</ul>
        <ul class="cons-list">${s.cons.map((c) => `<li>${c}</li>`).join("")}</ul>
      </div>
      <div class="modal-section-title">¿Para qué tipo de jugador?</div>
      <div class="player-recs">${recs}</div>
      <div class="modal-cta-row">
        <span class="modal-price">Precio aprox: <strong>${formatPrice(s.price)}</strong> · ${s.weightG} g</span>
        <a ${affiliateAttrs(s)} class="btn-price">🔥 Ver Mejor Precio Hoy</a>
      </div>
    </div>`;

  $("#modalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
  $("#modalClose").focus();
  setTimeout(() => animateBarsIn($("#modalInner")), 100);
}

function closeModal() {
  $("#modalOverlay").classList.remove("open");
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
}

function initModal() {
  const overlay = $("#modalOverlay");
  $("#modalClose").addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") return closeModal();
    /* Mantener el foco dentro del modal */
    if (e.key === "Tab") {
      const focusables = overlay.querySelectorAll("a[href], button:not([disabled])");
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderTicker();
  renderCards();
  renderRankings();
  initFilters();
  initTabs();
  initModal();
});
