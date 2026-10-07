#!/usr/bin/env node
/**
 * HoopMatch — build.js
 * (sources, confidence y verified se validan pero NO se escriben en shoes.json:
 *  son de uso interno y no se muestran ni se publican en la web)
 * Lee data/shoes.csv (exportado de Google Sheets), valida y genera data/shoes.json
 * Imágenes: por cada zapatilla crea la carpeta img/<id>/ (junto a la carpeta data/).
 *   Deja ahí 3 a 4 fotos (webp, jpg, png o avif); la primera por orden de nombre (1.webp)
 *   es la principal. build.js las detecta solas y las guarda en shoes.json (image + images).
 *   La columna "image" del CSV queda solo como respaldo si la carpeta está vacía.
 * Uso:  node build.js [entrada.csv] [salida.json]
 * Sin dependencias: solo Node.js.
 *
 * - El id sale solo de brand + name (ej. "nike-kyrie-infinity"). Si rellenas la columna
 *   opcional id_manual, esa tiene prioridad (útil para no romper un link ya publicado).
 * - Campos con varios valores (pros, contras, fuentes) se separan con punto y coma ( ; ).
 */
const fs = require("fs");
const path = require("path");

const INPUT = process.argv[2] || "data/shoes.csv";
const OUTPUT = process.argv[3] || "data/shoes.json";

/* ── Rendimiento calculado (mismos pesos que usaba shoes.js; deben sumar 1) ── */
const WEIGHTS = { grip: 0.28, cushioning: 0.24, comfort: 0.18, durability: 0.15, support: 0.15 };

/* columna del CSV → clave que usa la web */
const SCORE_KEYS = {
  grip: "grip", comfort: "comodidad", cushioning: "amortiguacion",
  durability: "durabilidad",
};
const SCORE_COLS = Object.keys(SCORE_KEYS);
const COURT_COLS = ["court_indoor", "court_outdoor"]; // notas 0-10 por tipo de cancha
const LEVEL_COLS = ["pos_base", "pos_escolta", "pos_alero", "pos_pivot"];
const LEVELS = ["yes", "ok", "no"];
const CONFIDENCE = ["alta", "media", "baja"];
const REQUIRED = [
  "brand", "name", "price_usd", "weight_g", "outsole", "cushion",
  "ankle_support", "ankle_level", "ideal_for", "pros", "cons", "confidence", "verified",
];
const OPTIONAL_COLS = [
  "tagline", "description", "release_year", "support_score",
  "fit_heavy", "fit_fast", "fit_inside", "fit_wide", "fit_size", "fit_dust_note", "fit_dust_from",
  "sources", "affiliate_url", "image", "id_manual",
];

/* ── Parser CSV (RFC 4180: comillas, comas y saltos de línea dentro de campos) ── */
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const list = (v) => (v || "").split(";").map((s) => s.trim()).filter(Boolean);
const round1 = (n) => Math.round(n * 10) / 10;
const slugify = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* ── Lectura ── */
if (!fs.existsSync(INPUT)) {
  console.error(`✗ No existe ${INPUT}. Exporta tu Google Sheet como CSV y guárdalo ahí.`);
  process.exit(1);
}
const rows = parseCSV(fs.readFileSync(INPUT, "utf8")).filter((r) => r.some((c) => c.trim() !== ""));
const header = rows.shift().map((h) => h.trim());
const records = rows.map((r, i) => {
  const o = { _line: i + 2 };
  header.forEach((h, j) => (o[h] = (r[j] || "").trim()));
  OPTIONAL_COLS.forEach((c) => { if (o[c] === undefined) o[c] = ""; });
  o.id = o.id_manual || slugify(`${o.brand} ${o.name}`);
  return o;
});

/* ── Validación ── */
const errors = [];
const warnings = [];
const seen = new Set();
const err = (r, msg) => errors.push(`Fila ${r._line} (${r.id || "sin id"}): ${msg}`);
const warn = (r, msg) => warnings.push(`Fila ${r._line} (${r.id || "sin id"}): ${msg}`);

for (const col of [...REQUIRED, ...SCORE_COLS, ...COURT_COLS, ...LEVEL_COLS]) {
  if (!header.includes(col)) errors.push(`Falta la columna "${col}" en el CSV.`);
}

/* Una fila con notas, canchas, posiciones, precio o peso vacíos queda "pendiente":
   se avisa y se deja fuera del JSON hasta que la completes. */
const ready = [];
const NEEDED = [...SCORE_COLS, ...COURT_COLS, ...LEVEL_COLS, "price_usd", "weight_g"];
if (!errors.length) {
  for (const r of records) {
    const missing = NEEDED.filter((c) => r[c] === "");
    if (missing.length) warn(r, `pendiente (no se publica): falta ${missing.join(", ")}`);
    else ready.push(r);
  }
}

if (!errors.length) {
  for (const r of ready) {
    for (const col of REQUIRED) if (!r[col]) err(r, `falta "${col}"`);

    if (!r.id) err(r, `no se pudo generar el id (revisa brand y name)`);
    else {
      if (r.id_manual && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.id)) err(r, `id_manual "${r.id}" debe ser minúsculas, números y guiones`);
      if (seen.has(r.id)) err(r, `id duplicado "${r.id}" (cambia el name o rellena id_manual)`);
      seen.add(r.id);
    }
    const verified = r.verified.toLowerCase();

    for (const col of [...SCORE_COLS, ...COURT_COLS]) {
      const v = Number(r[col]);
      if (r[col] === "" || Number.isNaN(v)) err(r, `"${col}" debe ser un número`);
      else if (v < 0 || v > 10) err(r, `"${col}" = ${v} fuera de 0–10`);
      else if ((v * 2) % 1 !== 0) {
        // Paso de 0.5: error si está "verificada"; aviso mientras sea provisional
        if (verified === "si") err(r, `"${col}" = ${v} debe ir en pasos de 0.5`);
        else warn(r, `"${col}" = ${v} no va en pasos de 0.5`);
      }
    }

    for (const col of LEVEL_COLS) {
      if (!LEVELS.includes(r[col])) err(r, `"${col}" debe ser yes, ok o no (tiene "${r[col]}")`);
    }

    if (!(Number(r.price_usd) > 0)) err(r, `price_usd debe ser un número mayor que 0`);
    if (!(Number(r.weight_g) > 0)) err(r, `weight_g debe ser un número mayor que 0`);
    const lvl = Number(r.ankle_level);
    if (Number.isNaN(lvl) || lvl < 1 || lvl > 3) err(r, `ankle_level debe ser un número de 1 (bajo) a 3 (alto)`);
    if (r.support_score !== "" && !(Number(r.support_score) >= 0 && Number(r.support_score) <= 10)) err(r, `support_score debe ir de 0 a 10`);
    if (r.release_year !== "" && !/^\d{4}$/.test(r.release_year)) err(r, `release_year debe ser un año de 4 cifras`);
    if (r.fit_dust_note && !["1", "2"].includes(r.fit_dust_from)) err(r, `fit_dust_from debe ser 1 o 2 si hay fit_dust_note`);
    if (r.confidence && !CONFIDENCE.includes(r.confidence)) err(r, `confidence debe ser alta, media o baja`);

    if (r.verified && !["si", "no"].includes(verified)) err(r, `verified debe ser si o no`);
    const sources = list(r.sources);
    if (sources.some((s) => !/^https?:\/\//.test(s))) err(r, `todas las fuentes deben ser URLs (http/https)`);
    if (verified === "si" && sources.length < 3) err(r, `marcada "verificada" con solo ${sources.length} fuente(s); se necesitan 3`);

    if (list(r.pros).length < 2) warn(r, `menos de 2 pros`);
    if (list(r.cons).length < 2) warn(r, `menos de 2 contras`);
    if (!r.affiliate_url) warn(r, `sin link de afiliado`);
  }
}

if (warnings.length) {
  console.warn(`⚠ ${warnings.length} aviso(s):`);
  warnings.forEach((w) => console.warn("  - " + w));
}
if (errors.length) {
  console.error(`\n✗ ${errors.length} error(es). No se generó ${OUTPUT}:`);
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
}

/* ── Carpetas de imágenes: img/<id>/ por cada zapatilla de la hoja ── */
const IMG_ROOT = path.join(path.resolve(path.dirname(OUTPUT), ".."), "img");
const IMG_EXT = /\.(webp|jpe?g|png|avif)$/i;
const IMG_MAX_KB = 400;
const imgNotes = [];
const SAFE_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const createdFolders = [];

for (const r of records) {
  if (!SAFE_ID.test(r.id)) continue;
  const dir = path.join(IMG_ROOT, r.id);
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); createdFolders.push(r.id); }
}

function shoeImages(r) {
  const dir = path.join(IMG_ROOT, r.id);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => !f.startsWith(".")) : [];
  const valid = files.filter((f) => IMG_EXT.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  files.filter((f) => !IMG_EXT.test(f)).forEach((f) => imgNotes.push(`${r.id}: "${f}" no es webp/jpg/png/avif y se ignora`));
  valid.forEach((f) => {
    const kb = fs.statSync(path.join(dir, f)).size / 1024;
    if (kb > IMG_MAX_KB) imgNotes.push(`${r.id}: ${f} pesa ${Math.round(kb)} KB; conviene dejarla bajo ${IMG_MAX_KB} KB (webp)`);
  });
  if (valid.length) return valid.map((f) => `img/${r.id}/${f}`);
  if (r.image) return [r.image]; // respaldo: ruta escrita a mano en el CSV
  return [];
}

/* ── Conversión: mismo formato de objeto que usa shoes.js (lista ordenada como la hoja) ── */
const out = ready.map((r) => {
  const n = (c) => Number(r[c]);
  const support = r.support_score !== "" ? n("support_score") : 5 + n("ankle_level") * 1.25;
  const rendimiento = round1(
    n("grip") * WEIGHTS.grip + n("cushioning") * WEIGHTS.cushioning + n("comfort") * WEIGHTS.comfort +
    n("durability") * WEIGHTS.durability + support * WEIGHTS.support
  );

  const scores = {};
  for (const [col, key] of Object.entries(SCORE_KEYS)) scores[key] = n(col);
  scores.rendimiento = rendimiento;

  const fit = {};
  if (r.fit_heavy) fit.heavy = r.fit_heavy;
  if (r.fit_fast) fit.fast = r.fit_fast;
  if (r.fit_inside) fit.inside = r.fit_inside;
  if (r.fit_wide) fit.wide = r.fit_wide;
  if (r.fit_size) fit.size = r.fit_size;
  if (r.fit_dust_note) fit.dust = { note: r.fit_dust_note, from: n("fit_dust_from") };

  const images = shoeImages(r);
  if (!images.length) imgNotes.push(`${r.id}: sin imágenes (pon fotos en img/${r.id}/)`);
  else if (images.length < 3) imgNotes.push(`${r.id}: ${images.length} imagen(es); lo ideal son 3 a 4`);

  const shoe = {
    id: r.id,
    brand: r.brand,
    name: r.name,
    emoji: "👟",
    image: images[0] || "",
    images,
    tagline: r.tagline,
    description: r.description,
    scores,
    courts: { indoor: n("court_indoor"), outdoor: n("court_outdoor") },
    weightG: n("weight_g"),
    sole: r.outsole,
    cushion: r.cushion,
    ankle: { label: r.ankle_support, level: n("ankle_level") },
    price: n("price_usd"),
    bestFor: r.ideal_for,
    pros: list(r.pros),
    cons: list(r.cons),
    positions: {
      base: r.pos_base, escolta: r.pos_escolta, alero: r.pos_alero, pivot: r.pos_pivot,
    },
    fit,
    affiliate: r.affiliate_url || "#",
  };
  if (r.release_year) shoe.releaseYear = n("release_year");
  if (r.support_score !== "") shoe.supportScore = n("support_score");
  return shoe;
});

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
if (createdFolders.length) console.log(`📁 ${createdFolders.length} carpeta(s) nueva(s) en ${path.relative(process.cwd(), IMG_ROOT) || "img"}/: ${createdFolders.join(", ")}`);
if (imgNotes.length) {
  console.warn(`📷 ${imgNotes.length} aviso(s) de imágenes:`);
  imgNotes.forEach((n) => console.warn("  - " + n));
}
fs.writeFileSync(OUTPUT, JSON.stringify(out, null, 2) + "\n");
console.log(
  `✓ ${ready.length} zapatilla(s) publicadas → ${OUTPUT}` +
  (records.length > ready.length ? ` (${records.length - ready.length} pendiente(s) sin publicar)` : "")
);
