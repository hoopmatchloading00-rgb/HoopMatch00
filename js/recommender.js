/* ==========================================================================
   HoopMatch · recommender.js
   Motor del quiz. No toca el DOM: recibe respuestas y devuelve resultados.

   Cómo funciona
   1. Cada respuesta ajusta la IMPORTANCIA (peso) de 9 atributos.
   2. Los datos de cada zapatilla se normalizan de 0 a 10 dentro del catálogo,
      así una diferencia de grip pesa lo mismo que una de peso o soporte.
   3. Soporte de tobillo y ligereza se puntúan por cercanía a lo que la persona
      necesita (más no siempre es mejor). El resto: más es mejor.
   4. Afinidad = promedio ponderado (0-100) +/- ajustes por posición y avisos.
   5. Se filtra por presupuesto y se propone una opción "si estiras el presupuesto".

   Para cambiar el comportamiento edita los números de RULES y de las constantes
   de abajo; no hace falta tocar la lógica.
   ========================================================================== */

/* Peso base de cada atributo (importancia inicial) */
const BASE_WEIGHTS = {
  grip: 1, comodidad: 1, amortiguacion: 1, durabilidad: 1,
  rendimiento: 1, soporte: 1, ligereza: 1, cancha: 1,
};

/* Cuánto suma cada respuesta a la importancia de cada atributo */
const RULES = {
  posicion: {
    base:    { grip: 0.5, ligereza: 0.5 },
    escolta: { grip: 0.3, ligereza: 0.3 },
    alero:   { rendimiento: 0.4 },
    pivot:   { amortiguacion: 0.7, soporte: 0.7, durabilidad: 0.3 },
  },
  estilo: {
    explosivo:   { grip: 1, ligereza: 0.5, amortiguacion: 0.3 },
    tirador:     { comodidad: 0.5, rendimiento: 0.3 },
    fisico:      { durabilidad: 0.5, amortiguacion: 0.7, soporte: 0.7 },
    defensor:    { grip: 1, soporte: 0.5 },
    todoterreno: { rendimiento: 0.5 },
  },
  peso: {
    w1: { ligereza: 0.3 },
    w2: {},
    w3: { amortiguacion: 0.5, soporte: 0.3, durabilidad: 0.3 },
    w4: { amortiguacion: 1, soporte: 0.7, durabilidad: 0.5 },
  },
  cancha: {
    cubierta: {},
    calle:    { durabilidad: 1 },
    mixta:    { durabilidad: 0.5 },
  },
  polvo: {
    limpia: {},
    polvo:  { grip: 0.5 },
    mala:   { grip: 1.2 },
  },
  frecuencia: {
    ocasional: { durabilidad: -0.4 },
    regular:   {},
    intenso:   { durabilidad: 1, comodidad: 0.5 },
  },
  pie: {
    ancho:    { comodidad: 0.5 },
    normal:   {},
    estrecho: {},
  },
};

/* Soporte de tobillo: valor buscado (0 = libre, 10 = máximo) y cuánto importa */
const SUPPORT = {
  alto:  { target: 10, weight: 2.5 },
  medio: { target: 5,  weight: 1.2 },
  libre: { target: 0,  weight: 1.5 },
};

/* Tipo de cancha: qué dato usar y cuánto importa que la suela encaje */
const COURT = {
  cubierta: { mode: "indoor",  weight: 1.5 },
  calle:    { mode: "outdoor", weight: 2.5 },
  mixta:    { mode: "mixed",   weight: 1.8 },
};

/* Ligereza buscada según estilo (0 = pesada y estable, 10 = ultraligera) y ajuste por peso corporal */
const LIGHT_TARGET = { explosivo: 9, tirador: 7, defensor: 6, todoterreno: 5, fisico: 2 };
const LIGHT_BODY_ADJ = { w1: 1, w2: 0, w3: -1, w4: -2 };

const PRIORITY_BOOST = 2.5;
const BUDGETS = { b120: 120, b150: 150, b190: 190, libre: Infinity };
const STRETCH_MAX_RATIO = 1.25;  /* hasta +25% del presupuesto */
const STRETCH_MIN_GAIN = 3;      /* solo se propone si mejora al menos 3 puntos */
const POSITION_ADJ = { yes: 5, ok: 0, no: -10 };
const NOTE_PENALTY = 4;          /* puntos que resta cada aviso de tus "contras" */
const DUST_LEVEL = { limpia: 0, polvo: 1, mala: 2 };

/* Calibración del porcentaje mostrado: con solo unas pocas zapatillas, la peor caería a valores
   injustamente bajos. Se muestra DISPLAY_FLOOR + afinidad * DISPLAY_SCALE (el orden no cambia). */
const DISPLAY_FLOOR = 35;
const DISPLAY_SCALE = 0.65;

/* ---------- Perfil: respuestas -> pesos y objetivos ---------- */

function buildProfile(a) {
  const w = { ...BASE_WEIGHTS };
  const add = (k, v) => { w[k] = Math.max(0.2, w[k] + v); };

  Object.keys(RULES).forEach((q) => {
    const rule = RULES[q][a[q]] || {};
    Object.entries(rule).forEach(([k, v]) => add(k, v));
  });

  const support = SUPPORT[a.soporte] || SUPPORT.medio;
  w.soporte = support.weight + (w.soporte - BASE_WEIGHTS.soporte); /* conserva lo que sumaron posición/estilo/peso */

  const court = COURT[a.cancha] || COURT.cubierta;
  w.cancha = court.weight;

  let lightTarget = (LIGHT_TARGET[a.estilo] ?? 5) + (LIGHT_BODY_ADJ[a.peso] ?? 0);
  if (a.prioridad === "ligereza") lightTarget = 10;
  lightTarget = Math.min(10, Math.max(0, lightTarget));

  if (w[a.prioridad] !== undefined) add(a.prioridad, PRIORITY_BOOST);

  return { w, targets: { soporte: support.target, ligereza: lightTarget }, courtMode: court.mode };
}

/* ---------- Normalización 0-10 dentro del catálogo ---------- */

function rawAttrs(s, courtMode) {
  const court = courtMode === "indoor" ? s.courts.indoor : courtMode === "outdoor" ? s.courts.outdoor : (s.courts.indoor + s.courts.outdoor) / 2;
  return {
    grip: s.scores.grip,
    comodidad: s.scores.comodidad,
    amortiguacion: s.scores.amortiguacion,
    durabilidad: s.scores.durabilidad,
    rendimiento: s.scores.rendimiento,
    soporte: s.ankle.level,
    ligereza: -s.weightG,
    cancha: court,
  };
}

function normalizedTable(shoes, courtMode) {
  const raws = shoes.map((s) => rawAttrs(s, courtMode));
  const table = {};
  Object.keys(BASE_WEIGHTS).forEach((k) => {
    const vals = raws.map((r) => r[k]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    shoes.forEach((s, i) => {
      table[s.id] = table[s.id] || {};
      table[s.id][k] = max === min ? 5 : ((raws[i][k] - min) / (max - min)) * 10;
    });
  });
  return table;
}

/* ---------- Avisos: salen de los "contras" que ya escribiste en shoes.js (campo fit) ---------- */

function buildWarnings(s, a) {
  const out = [];
  let penalties = 0;
  const fit = s.fit || {};
  const push = (text, penalize = true) => { out.push(text); if (penalize) penalties++; };

  if (s.positions[a.posicion] === "no") push("No es la mejor opción para tu posición");
  if (fit.heavy && a.peso === "w4") push(fit.heavy);
  if (fit.fast && (a.estilo === "explosivo" || a.posicion === "base")) push(fit.fast);
  if (fit.inside && (a.estilo === "fisico" || a.posicion === "pivot")) push(fit.inside);
  if (fit.wide && a.pie === "ancho") push(fit.wide);
  if (fit.dust && DUST_LEVEL[a.polvo] >= fit.dust.from) push(fit.dust.note);

  if (s.courts.outdoor < 7) {
    if (a.cancha === "calle") push("Su suela sufre en cemento y se desgasta rápido");
    else if (a.cancha === "mixta") push("Úsala en exterior solo de vez en cuando", false);
  }
  if (a.frecuencia === "intenso" && s.scores.durabilidad < 8.3) {
    push(`Durabilidad ${fmt(s.scores.durabilidad)}/10: con tu ritmo la cambiarás antes`, false);
  }
  if (fit.size) push(fit.size, false); /* consejo de talla: informa, no penaliza */

  return { warnings: out, penalties: out.length ? penalties : 0 };
}

/* ---------- Razones: por qué encaja ---------- */

const COURT_NAME = { cubierta: "pista cubierta", calle: "cancha exterior", mixta: "uso mixto" };

function reasonFor(k, s, a) {
  switch (k) {
    case "grip": return `Grip ${fmt(s.scores.grip)}/10 para ${a.polvo === "mala" ? "superficies difíciles" : "frenar y cambiar de dirección"}`;
    case "amortiguacion": return `Amortiguación ${fmt(s.scores.amortiguacion)}/10 para absorber el impacto`;
    case "comodidad": return `Comodidad ${fmt(s.scores.comodidad)}/10 partido tras partido`;
    case "durabilidad": return `Durabilidad ${fmt(s.scores.durabilidad)}/10${a.frecuencia === "intenso" ? ": aguanta tu ritmo de juego" : ""}`;
    case "rendimiento": return `Rendimiento ${fmt(s.scores.rendimiento)}/10 en cancha`;
    case "soporte": return `Soporte de tobillo ${s.ankle.label.toLowerCase()}, como lo necesitas`;
    case "ligereza": return `Peso de ${s.weightG} g, acorde a cómo juegas`;
    case "cancha": return `Suela que responde en ${COURT_NAME[a.cancha] || "tu cancha"}`;
    default: return "";
  }
}

/* ---------- Evaluación de una zapatilla ---------- */

function evaluate(s, a, profile, table) {
  const n = table[s.id];
  let num = 0;
  let den = 0;
  const contrib = [];

  Object.keys(profile.w).forEach((k) => {
    const isTarget = k === "soporte" || k === "ligereza";
    const fitVal = isTarget ? 10 - Math.abs(n[k] - profile.targets[k]) : n[k];
    num += profile.w[k] * fitVal;
    den += profile.w[k] * 10;
    contrib.push({ k, fitVal, score: profile.w[k] * fitVal, w: profile.w[k] });
  });

  const { warnings, penalties } = buildWarnings(s, a);
  let match = (num / den) * 100 + (POSITION_ADJ[s.positions[a.posicion]] ?? 0) - penalties * NOTE_PENALTY;
  match = Math.max(1, Math.min(99, Math.round(DISPLAY_FLOOR + match * DISPLAY_SCALE)));

  /* Razones: los atributos que más importan a la persona y donde esta zapatilla rinde bien */
  const reasons = contrib
    .filter((c) => c.w >= 1.2 && c.fitVal >= 6.5)
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
    .map((c) => reasonFor(c.k, s, a));
  if (reasons.length < 2) {
    contrib.sort((x, y) => y.score - x.score).slice(0, 2 - reasons.length).forEach((c) => reasons.push(reasonFor(c.k, s, a)));
  }

  return { shoe: s, match, reasons, warnings };
}

/* ---------- API pública ---------- */

function recommend(a, shoes = SHOES) {
  const profile = buildProfile(a);
  const table = normalizedTable(shoes, profile.courtMode);
  const budget = BUDGETS[a.presupuesto] ?? Infinity;

  const scored = shoes.map((s) => evaluate(s, a, profile, table));
  const byMatch = (x, y) => y.match - x.match;

  const results = scored.filter((r) => r.shoe.price <= budget).sort(byMatch).slice(0, 3);

  let stretch = null;
  if (Number.isFinite(budget) && results.length) {
    const candidate = scored
      .filter((r) => r.shoe.price > budget && r.shoe.price <= budget * STRETCH_MAX_RATIO)
      .sort(byMatch)[0];
    if (candidate && candidate.match >= results[0].match + STRETCH_MIN_GAIN) stretch = candidate;
  }

  return { results, stretch, budget };
}
