/* ==========================================================================
   HoopMatch · compare.js  (solo compare.html)
   Lee los datos de SHOES (js/shoes.js). Admite enlaces tipo compare.html?a=kyrie&b=harden
   ========================================================================== */

const $ = (id) => document.getElementById(id);

const COLORS = { a: "#00e5ff", b: "#bf5fff" };

const PRESETS = [
  ["kyrie", "harden", "Kyrie vs Harden"],
  ["jordan", "lebron", "Jordan 36 vs LeBron 21"],
  ["curry", "kyrie", "Curry 11 vs Kyrie"],
  ["harden", "freak", "Harden vs Freak 5"],
  ["jordan", "kyrie", "Jordan 36 vs Kyrie"],
  ["lebron", "freak", "LeBron 21 vs Freak 5"],
];

const REC_SCORE = { yes: 3, ok: 1, no: 0 };
const TAG_TEXT = { yes: "✓ Sí", ok: "~ Regular", no: "✗ No" };

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/* ---------- SELECTORES ---------- */

function initSelectors() {
  const options = SHOES.map((s) => `<option value="${s.id}">${shortBrand(s)} · ${s.name}</option>`).join("");
  ["selectA", "selectB"].forEach((id) => $(id).insertAdjacentHTML("beforeend", options));

  $("presetsList").innerHTML = PRESETS.map(
    ([a, b, label]) => `<button type="button" class="preset-btn" data-a="${a}" data-b="${b}">${label}</button>`
  ).join("");
  $("presetsList").addEventListener("click", (e) => {
    const btn = e.target.closest(".preset-btn");
    if (btn) loadPreset(btn.dataset.a, btn.dataset.b);
  });

  $("selectA").addEventListener("change", onSelectChange);
  $("selectB").addEventListener("change", onSelectChange);
  $("compareBtn").addEventListener("click", runCompare);
}

function onSelectChange() {
  const a = $("selectA").value;
  const b = $("selectB").value;
  updatePreview("A", a);
  updatePreview("B", b);
  const same = a && a === b;
  $("compareBtn").disabled = !(a && b && !same);
  $("compareHint").textContent = same ? "Elige dos modelos distintos" : "";
}

function updatePreview(side, id) {
  const prev = $("preview" + side);
  if (!id) { prev.classList.remove("visible"); return; }
  const s = SHOES_BY_ID[id];
  $("previewEmoji" + side).innerHTML = shoeVisual(s);
  $("previewBrand" + side).textContent = s.brand;
  $("previewName" + side).textContent = s.name;
  $("previewScore" + side).textContent = fmt(avgScore(s));
  prev.classList.add("visible");
}

function loadPreset(a, b) {
  $("selectA").value = a;
  $("selectB").value = b;
  onSelectChange();
  runCompare();
}

/* ---------- COMPARAR ---------- */

function runCompare() {
  const aId = $("selectA").value;
  const bId = $("selectB").value;
  if (!aId || !bId || aId === bId) return;

  const a = SHOES_BY_ID[aId];
  const b = SHOES_BY_ID[bId];
  const results = $("compareResults");

  /* URL compartible (puede fallar al abrir el archivo directo con file://) */
  try { history.replaceState(null, "", `?a=${aId}&b=${bId}`); } catch (_) {}

  results.classList.remove("visible");
  void results.offsetWidth; /* reinicia la animación de entrada */

  buildWinnerBanner(a, b);
  buildDualBars(a, b);
  buildSpecsTable(a, b);
  buildProsCons(a, b);
  buildRecGrid(a, b);
  buildCTA(a, b);

  results.classList.add("visible");
  results.scrollIntoView({ behavior: "smooth", block: "start" });
  drawRadar(a, b);
  setTimeout(animateDualBars, 150);
}

/* ---------- GANADOR ---------- */

function buildWinnerBanner(a, b) {
  const aAvg = avgScore(a);
  const bAvg = avgScore(b);
  const nameEl = $("winnerName");
  const scoreEl = $("winnerScore");

  if (Math.abs(aAvg - bAvg) < 0.05) {
    nameEl.textContent = "Empate técnico";
    nameEl.style.color = "var(--neon)";
    scoreEl.textContent = fmt(aAvg);
    scoreEl.style.color = "var(--neon)";
    $("winnerReason").textContent = `${a.name} y ${b.name} están igualadas en rendimiento global`;
    return;
  }

  const aWins = aAvg > bAvg;
  const winner = aWins ? a : b;
  const color = aWins ? "var(--col-a)" : "var(--col-b)";
  const cats = STAT_KEYS.filter((k) => k !== "rendimiento"); /* rendimiento es el total, no una categoría */
  const topKey = cats.reduce((best, k) => (winner.scores[k] > winner.scores[best] ? k : best), cats[0]);

  nameEl.textContent = winner.name;
  nameEl.style.color = color;
  scoreEl.textContent = fmt(Math.max(aAvg, bAvg));
  scoreEl.style.color = color;
  $("winnerReason").textContent = `Destacada en ${STAT_LABELS[topKey]} (${fmt(winner.scores[topKey])}/10) · Precio aprox. ${formatPrice(winner.price)}`;
}

/* ---------- BARRAS DOBLES ---------- */

function buildDualBars(a, b) {
  $("dualBars").innerHTML = STAT_KEYS.map((key) => {
    const vA = a.scores[key];
    const vB = b.scores[key];
    return `
      <div class="compare-stat-item">
        <div class="compare-stat-header">
          <div class="compare-stat-val val-a">${fmt(vA)}${vA > vB ? '<span class="win-mark">✓</span>' : ""}</div>
          <div class="compare-stat-name">${STAT_LABELS[key]}</div>
          <div class="compare-stat-val val-b">${vB > vA ? '<span class="win-mark">✓</span>' : ""}${fmt(vB)}</div>
        </div>
        <div class="dual-bar-wrap">
          <div class="bar-half bar-half-a"><div class="bar-fill-a" data-width="${vA * 10}"></div></div>
          <div class="bar-center"></div>
          <div class="bar-half bar-half-b"><div class="bar-fill-b" data-width="${vB * 10}"></div></div>
        </div>
      </div>`;
  }).join("");
}

function animateDualBars() {
  document.querySelectorAll(".bar-fill-a, .bar-fill-b").forEach((el) => {
    el.style.width = (el.dataset.width || 0) + "%";
  });
}

/* ---------- RADAR (con HiDPI y relleno translúcido) ---------- */

function drawRadar(a, b) {
  const canvas = $("radarCanvas");
  const ctx = canvas.getContext("2d");
  const SIZE = 480;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, SIZE, SIZE);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = (SIZE / 2) * 0.72;
  const N = STAT_KEYS.length;
  const step = (Math.PI * 2) / N;
  const offset = -Math.PI / 2;
  const point = (i, ratio) => [cx + Math.cos(offset + i * step) * R * ratio, cy + Math.sin(offset + i * step) * R * ratio];

  /* Anillos */
  [0.2, 0.4, 0.6, 0.8, 1].forEach((level) => {
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const [x, y] = point(i, level);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  /* Ejes */
  for (let i = 0; i < N; i++) {
    const [x, y] = point(i, 1);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.stroke();
  }

  const drawShape = (shoe, color, alpha) => {
    ctx.beginPath();
    STAT_KEYS.forEach((key, i) => {
      const [x, y] = point(i, shoe.scores[key] / 10);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = hexToRgba(color, alpha);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    STAT_KEYS.forEach((key, i) => {
      const [x, y] = point(i, shoe.scores[key] / 10);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#07070f";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  };
  drawShape(a, COLORS.a, 0.15);
  drawShape(b, COLORS.b, 0.12);

  /* Etiquetas */
  ctx.font = "bold 11px 'Barlow Condensed', sans-serif";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "2px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#9090b0";
  STAT_KEYS.forEach((key, i) => {
    const [x, y] = point(i, (R + 26) / R);
    ctx.fillText(STAT_LABELS[key].toUpperCase(), x, y);
  });

  /* Leyenda centrada */
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  ctx.font = "13px 'Barlow Condensed', sans-serif";
  ctx.textAlign = "left";
  const legY = SIZE - 14;
  const wA = ctx.measureText(a.name).width;
  const wB = ctx.measureText(b.name).width;
  const total = 10 + 8 + wA + 32 + 10 + 8 + wB;
  let x = (SIZE - total) / 2;
  [[a, COLORS.a, wA], [b, COLORS.b, wB]].forEach(([shoe, color, w]) => {
    ctx.beginPath();
    ctx.arc(x + 5, legY, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = "#f0f0f8";
    ctx.fillText(shoe.name, x + 18, legY);
    x += 18 + w + 32;
  });
}

/* ---------- TABLA DE ESPECIFICACIONES ---------- */

function buildSpecsTable(a, b) {
  $("thA").textContent = a.name;
  $("thB").textContent = b.name;

  const statRows = STAT_KEYS.map((key) => {
    const vA = a.scores[key];
    const vB = b.scores[key];
    return `<tr>
      <td>${STAT_LABELS[key]}</td>
      <td><span class="spec-rating spec-a">${fmt(vA)}</span>${vA > vB ? '<span class="winner-check">✓</span>' : ""}</td>
      <td><span class="spec-rating spec-b">${fmt(vB)}</span>${vB > vA ? '<span class="winner-check">✓</span>' : ""}</td>
    </tr>`;
  });

  const tag = (v) => `<span class="spec-tag tag-${courtLabel(v)}">${TAG_TEXT[courtLabel(v)]}</span>`;
  const text = (v) => `<span style="color:var(--text)">${v}</span>`;

  const specRows = [
    ["Fiabilidad de las notas", a, b, confidenceBadge],
    ["Peso", `${a.weightG} g`, `${b.weightG} g`, text],
    ["Tipo de suela", a.sole, b.sole, text],
    ["Tecnología cushion", a.cushion, b.cushion, text],
    ["Soporte tobillo", a.ankle.label, b.ankle.label, text],
    ["Interior (cancha)", a.courts.indoor, b.courts.indoor, tag],
    ["Exterior (calle)", a.courts.outdoor, b.courts.outdoor, tag],
    ["Precio aprox.", formatPrice(a.price), formatPrice(b.price), text],
    ["Ideal para", a.bestFor, b.bestFor, text],
  ].map(([label, vA, vB, render]) => `<tr><td>${label}</td><td>${render(vA)}</td><td>${render(vB)}</td></tr>`);

  $("specsBody").innerHTML = statRows.concat(specRows).join("");
  $("methodNote").innerHTML = methodNoteHTML([a, b]);
}

/* ---------- PROS / CONTRAS ---------- */

function buildProsCons(a, b) {
  $("prosConsGrid").innerHTML = [a, b]
    .map(
      (s, i) => `
      <div class="pc-card">
        <div class="pc-card-header">
          <div class="pc-shoe-icon">${shoeVisual(s)}</div>
          <div>
            <div class="pc-brand ${i === 0 ? "ba" : "bb"}">${s.brand}</div>
            <div class="pc-shoe-name">${s.name}</div>
          </div>
        </div>
        <div class="pc-divider">Ventajas</div>
        <ul class="pc-list pros">${s.pros.map((p) => `<li>${p}</li>`).join("")}</ul>
        <div class="cons-section">
          <div class="pc-divider">Desventajas</div>
          <ul class="pc-list cons">${s.cons.map((c) => `<li>${c}</li>`).join("")}</ul>
        </div>
      </div>`
    )
    .join("");
}

/* ---------- RECOMENDACIÓN POR POSICIÓN ---------- */

function buildRecGrid(a, b) {
  $("recGrid").innerHTML = POSITIONS.map((pos) => {
    const sA = REC_SCORE[a.positions[pos]];
    const sB = REC_SCORE[b.positions[pos]];
    let name, cls;
    if (sA > sB) { name = a.name; cls = "rec-winner-a"; }
    else if (sB > sA) { name = b.name; cls = "rec-winner-b"; }
    else { name = sA === 0 ? "Ninguna" : "Empate"; cls = "rec-winner-tie"; }
    return `<div class="rec-card">
      <div class="rec-card-icon">${POSITION_ICONS[pos]}</div>
      <div class="rec-card-pos">${POSITION_LABELS[pos]}</div>
      <div class="rec-card-winner ${cls}">Mejor: <span>${name}</span></div>
    </div>`;
  }).join("");
}

/* ---------- CTA (afiliados) ---------- */

function buildCTA(a, b) {
  $("ctaRow").innerHTML = `
    <a ${affiliateAttrs(a)} class="cta-btn cta-a">🔥 Ver precio ${a.name}</a>
    <a ${affiliateAttrs(b)} class="cta-btn cta-b">🔥 Ver precio ${b.name}</a>`;
}

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  initSelectors();
  const params = new URLSearchParams(location.search);
  const a = params.get("a");
  const b = params.get("b");
  if (SHOES_BY_ID[a] && SHOES_BY_ID[b] && a !== b) loadPreset(a, b);
});
