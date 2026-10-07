/* ==========================================================================
   HoopMatch · shoes.js
   Lógica compartida de las zapatillas. Los DATOS ya no viven aquí:
   salen de data/shoes.json, que genera `node js/build.js` desde data/shoes.csv
   (el CSV se exporta de Google Sheets). No edites shoes.json a mano.

   Cada página usa onShoesReady(() => { ... }) para arrancar cuando los datos ya cargaron.
   ========================================================================== */

const STAT_KEYS = ["grip", "comodidad", "amortiguacion", "durabilidad", "rendimiento"];

const STAT_LABELS = {
    grip: "Grip",
    comodidad: "Comodidad",
    amortiguacion: "Amortiguación",
    durabilidad: "Durabilidad",
    rendimiento: "Rendimiento",
};

/* Etiquetas cortas para el ranking */
const STAT_SHORT = {
    grip: "Grip",
    comodidad: "Comod.",
    amortiguacion: "Amort.",
    durabilidad: "Durab.",
    rendimiento: "Rend.",
};

const POSITIONS = ["base", "escolta", "alero", "pivot"];
const POSITION_LABELS = { base: "Base", escolta: "Escolta", alero: "Alero", pivot: "Pivot" };
const POSITION_ICONS = { base: "🏃", escolta: "🏹", alero: "🦅", pivot: "🏋️" };

/* ---------- Método de puntuación (una sola fuente para todas las páginas) ---------- */

const SCORE_METHOD = {
    version: "1.1",
    note: "Puntuaciones propias de HoopMatch, basadas en reviews de especialistas, mediciones de laboratorio y experiencia en cancha. No son notas proporcionadas por las marcas.",
};


/* true  → avgScore() es el rendimiento ponderado que ya calcula build.js (recomendado).
   false → promedio simple de las 6 categorías. */
const AUTO_RENDIMIENTO = true;


/* ---------- Carga de datos (data/shoes.json) ---------- */

const SHOES_URL = "data/shoes.json";
let SHOES = [];          /* completas: las que usa el sitio */
let SHOES_PENDING = [];  /* con datos incompletos: quedan en espera */
let SHOES_BY_ID = {};

const domReady = new Promise((resolve) => {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", resolve);
  else resolve();
});

/* Valores por defecto para campos opcionales */
function prepareShoe(s) {
  s.emoji = s.emoji || "👟";
  s.images = Array.isArray(s.images) ? s.images : (s.image ? [s.image] : []);
  s.image = s.image || s.images[0] || "";
  s.tagline = s.tagline || "";
  s.description = s.description || "";
  s.fit = s.fit || {};
  return s;
}

function showLoadError() {
  const box = document.createElement("div");
  box.setAttribute("role", "alert");
  box.style.cssText = "position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:9999;background:#14141f;color:#f0f0f8;border:1px solid #ff3d00;padding:1rem 1.25rem;font:0.95rem/1.5 sans-serif;";
  box.innerHTML = "<strong>No se pudieron cargar las zapatillas (data/shoes.json).</strong><br>" +
    "Si abres la web haciendo doble clic en el archivo, no funciona: usa un servidor local " +
    "(por ejemplo la extensión Live Server de VS Code, o <code>npx serve</code> en la carpeta del proyecto).";
  document.body.appendChild(box);
}

const shoesReady = fetch(SHOES_URL, { cache: "no-cache" })
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${SHOES_URL}`);
    return res.json();
  })
  .then((list) => {
    const all = list.map(prepareShoe);
    SHOES = all.filter((s) => missingFields(s).length === 0);
    SHOES_PENDING = all.filter((s) => missingFields(s).length > 0);
    SHOES.forEach(deriveExtras);
    SHOES_BY_ID = Object.fromEntries(SHOES.map((s) => [s.id, s]));
    if (SHOES_PENDING.length) {
      console.info("HoopMatch · zapatillas pendientes de completar (no se muestran todavía):",
        SHOES_PENDING.map((s) => `${s.name}: falta ${missingFields(s).join(", ")}`));
    }
    return true;
  })
  .catch((err) => {
    console.error("HoopMatch · error cargando los datos:", err);
    domReady.then(showLoadError);
    return false;
  });

/* Ejecuta cb cuando el DOM y los datos están listos (si la carga falla, no se ejecuta) */
function onShoesReady(cb) {
  Promise.all([shoesReady, domReady]).then(([ok]) => { if (ok) cb(); });
}


/* ---------- Zapatillas completas vs pendientes ---------- */

/* Campos que el sitio necesita para mostrar una zapatilla sin errores */
function missingFields(shoe) {
    const missing = [];
    const isNum = v => typeof v === "number" && !Number.isNaN(v);
    if (!shoe.scores || STAT_KEYS.some(k => !isNum(shoe.scores[k]))) missing.push("scores");
    if (!shoe.courts || !isNum(shoe.courts.indoor) || !isNum(shoe.courts.outdoor)) missing.push("courts");
    if (!shoe.positions || POSITIONS.some(p => !["yes", "ok", "no"].includes(shoe.positions[p])))
        missing.push("positions");
    if (!isNum(shoe.price)) missing.push("price");
    if (!isNum(shoe.weightG)) missing.push("weightG");
    return missing;
}

/* ---------- Cálculos derivados (una sola fórmula para todo el sitio) ---------- */

/* Puntuación total. Con AUTO_RENDIMIENTO es el rendimiento ponderado (grip 28%, amortiguación 24%,
   comodidad 18%, durabilidad 15%, soporte 15%). Si lo desactivas, vuelve al promedio de las 5 categorías. */
function avgScore(shoe) {
    if (AUTO_RENDIMIENTO) return shoe.scores.rendimiento;
    return STAT_KEYS.reduce((sum, k) => sum + shoe.scores[k], 0) / STAT_KEYS.length;
}

/*
  Índice calidad/precio = puntuación total ajustada por precio.
  Cada 50 USD por debajo de refPrice suma 1 punto; cada 50 por encima resta 1. Máximo 10.
  Ajusta estos dos números si quieres premiar más o menos el precio.
*/
const VALUE_CONFIG = { refPrice: 150, usdPerPoint: 50 };
function valueScore(shoe) {
    return Math.min(10, avgScore(shoe) + (VALUE_CONFIG.refPrice - shoe.price) / VALUE_CONFIG.usdPerPoint);
}

/* Convierte un número de cancha (0-10) en "yes" | "ok" | "no" */
function courtLabel(value) {
    if (value >= 8.5) return "yes";
    if (value >= 6.5) return "ok";
    return "no";
}

/* Etiquetas usadas por los filtros de la home (todas derivadas de los datos) */
function shoeTags(shoe) {
    const tags = [];
    if (shoe.scores.grip >= 8.8) tags.push("grip");
    if (valueScore(shoe) >= 9.0) tags.push("precio");
    if (shoe.courts.outdoor >= 7) tags.push("exterior");
    if (shoe.positions.base === "yes") tags.push("base");
    if (shoe.positions.pivot === "yes") tags.push("pivot");
    return tags;
}

function shortBrand(shoe) {
    return shoe.brand.replace(" Brand", "");
}


/* ---------- Textos y badges derivados de los números (ya no vienen del CSV) ---------- */

function deriveExtras(s) {
  const value = valueScore(s);
  const avg = avgScore(s);

  /* Las 2 categorías mejor puntuadas (rendimiento es un total, no una categoría) */
  const top = STAT_KEYS.filter((k) => k !== "rendimiento")
    .sort((a, b) => s.scores[b] - s.scores[a])
    .slice(0, 2);
  s.rankTags = top.map((k) => `Top ${STAT_LABELS[k]}`);

  if (s.price >= 180) s.badge = { text: "💎 Premium", cls: "badge-new" };
  else if (value >= 9.0) s.badge = { text: "⭐ Top C/P", cls: "badge-top" };
  else if (s.scores.grip >= 9.3) s.badge = { text: "🔥 Top Grip", cls: "badge-fire" };
  else if (avg >= 8.8) s.badge = { text: "🔥 Hot Pick", cls: "badge-fire" };
  else s.badge = { text: "✦ Recomendada", cls: "badge-new" };

  if (value >= 9.5) s.valueNote = "Mejor relación calidad/precio";
  else if (value >= 9.0) s.valueNote = `Muy buena relación C/P por $${s.price}`;
  else if (s.price >= 180) s.valueNote = "Premium: pagas tecnología y diseño";
  else s.valueNote = `Nota ${avg.toFixed(1)} por $${s.price}`;

  const out = s.courts.outdoor;
  if (out >= 8.5) s.outdoorNote = "Muy buena en exterior";
  else if (out >= 7) s.outdoorNote = "Sirve en exterior, desgaste medio";
  else if (out >= 6.5) s.outdoorNote = "Aceptable en exterior, la suela se desgasta";
  else s.outdoorNote = "Mejor guardarla para interior";
}
