/* ==========================================================================
   HoopMatch · quiz.js  (solo quiz.html)
   Preguntas, navegación y pantalla de resultados. El cálculo vive en recommender.js.
   Los ids de cada opción deben coincidir con las claves de RULES / SUPPORT / COURT / BUDGETS.
   ========================================================================== */

const $ = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- PREGUNTAS ---------- */

const QUESTIONS = [
  {
    id: "posicion", short: "Posición",
    title: "¿Qué posición juegas?",
    hint: "Elige la que más juegas, aunque a veces cambies.",
    options: [
      { id: "base", icon: "🏃", label: "Base", desc: "Llevas el balón y diriges el juego" },
      { id: "escolta", icon: "🏹", label: "Escolta", desc: "Anotas desde fuera y te mueves sin balón" },
      { id: "alero", icon: "🦅", label: "Alero", desc: "Juegas tanto por fuera como por dentro" },
      { id: "pivot", icon: "🏋️", label: "Pívot", desc: "Juegas cerca del aro: rebote, poste y contacto" },
    ],
  },
  {
    id: "estilo", short: "Estilo",
    title: "¿Cómo describirías tu estilo de juego?",
    hint: "Piensa en lo que más haces en un partido normal.",
    options: [
      { id: "explosivo", icon: "⚡", label: "Explosivo", desc: "Aceleras, penetras y cambias de ritmo" },
      { id: "tirador", icon: "🎯", label: "Tirador", desc: "Vives del tiro y de los movimientos sin balón" },
      { id: "fisico", icon: "💪", label: "Físico", desc: "Juegas de espaldas, reboteas y buscas el contacto" },
      { id: "defensor", icon: "🛡️", label: "Defensor", desc: "Deslizamientos, robos y marcas exigentes" },
      { id: "todoterreno", icon: "🔁", label: "Todoterreno", desc: "Haces un poco de todo" },
    ],
  },
  {
    id: "peso", short: "Peso",
    title: "¿Cuánto pesas?",
    hint: "Sirve para estimar el impacto que recibe la zapatilla. Todo se calcula en tu navegador: no se guarda ni se envía.",
    options: [
      { id: "w1", icon: "🪶", label: "Menos de 65 kg", desc: "Complexión ligera" },
      { id: "w2", icon: "⚖️", label: "65 – 80 kg", desc: "Complexión media" },
      { id: "w3", icon: "🧱", label: "80 – 95 kg", desc: "Complexión fuerte" },
      { id: "w4", icon: "🏔️", label: "Más de 95 kg", desc: "Complexión pesada" },
    ],
  },
  {
    id: "soporte", short: "Tobillo",
    title: "¿Cuánto soporte de tobillo necesitas?",
    hint: "Equivale al corte de la zapatilla: alto, medio o bajo.",
    options: [
      { id: "alto", icon: "🔒", label: "Máximo soporte", desc: "Tobillos delicados o esguinces previos. Corte alto" },
      { id: "medio", icon: "🎚️", label: "Soporte medio", desc: "Equilibrio entre sujeción y movilidad. Corte medio" },
      { id: "libre", icon: "🕊️", label: "Libertad total", desc: "Prefiero moverme sin ataduras. Corte bajo" },
    ],
  },
  {
    id: "cancha", short: "Cancha",
    title: "¿Dónde juegas casi siempre?",
    hint: "El exterior desgasta mucho más la suela.",
    options: [
      { id: "cubierta", icon: "🏟️", label: "Pista cubierta", desc: "Parqué, tarima o goma" },
      { id: "calle", icon: "🌆", label: "Cancha exterior", desc: "Cemento, asfalto o pista callejera" },
      { id: "mixta", icon: "🔀", label: "Un poco de ambas", desc: "Uso mixto, dentro y fuera" },
    ],
  },
  {
    id: "polvo", short: "Superficie",
    title: "¿Cómo suele estar la superficie?",
    hint: "El polvo y la humedad son lo que más afecta al agarre.",
    options: [
      { id: "limpia", icon: "✨", label: "Limpia y seca", desc: "Se barre o se limpia con frecuencia" },
      { id: "polvo", icon: "🌫️", label: "Con algo de polvo", desc: "Se nota un poco al frenar" },
      { id: "mala", icon: "💧", label: "Muy polvorienta o húmeda", desc: "Resbala con facilidad" },
    ],
  },
  {
    id: "frecuencia", short: "Frecuencia",
    title: "¿Con qué frecuencia juegas?",
    hint: "Cuanto más juegas, más importan la durabilidad y la comodidad.",
    options: [
      { id: "ocasional", icon: "🌙", label: "Ocasional", desc: "Una vez por semana o menos" },
      { id: "regular", icon: "📅", label: "Regular", desc: "De dos a tres veces por semana" },
      { id: "intenso", icon: "🔥", label: "Intenso", desc: "Cuatro o más veces por semana" },
    ],
  },
  {
    id: "pie", short: "Pie",
    title: "¿Cómo es tu pie?",
    hint: "Si dudas, piensa en cómo te quedan normalmente las zapatillas deportivas.",
    options: [
      { id: "ancho", icon: "↔️", label: "Ancho", desc: "Suelo necesitar más espacio en la horma" },
      { id: "normal", icon: "👣", label: "Normal", desc: "Las hormas estándar me van bien" },
      { id: "estrecho", icon: "🤏", label: "Estrecho", desc: "Suelo tener holgura a los lados" },
    ],
  },
  {
    id: "prioridad", short: "Prioridad",
    title: "¿Qué es lo que más te importa?",
    hint: "Elige una sola: es lo que más peso tendrá en el resultado.",
    options: [
      { id: "grip", icon: "🧲", label: "Grip", desc: "Frenar y cambiar de dirección sin resbalar" },
      { id: "amortiguacion", icon: "☁️", label: "Amortiguación", desc: "Proteger rodillas y talones en cada salto" },
      { id: "comodidad", icon: "🛋️", label: "Comodidad", desc: "Que se sienta bien de principio a fin" },
      { id: "durabilidad", icon: "🔩", label: "Durabilidad", desc: "Que aguante muchos partidos" },
      { id: "ligereza", icon: "🪽", label: "Ligereza", desc: "Sentirme rápido y con el pie suelto" },
      { id: "estilo", icon: "😎", label: "Estilo", desc: "Que se vea bien dentro y fuera de la cancha" },
    ],
  },
  {
    id: "presupuesto", short: "Presupuesto",
    title: "¿Cuál es tu presupuesto máximo?",
    hint: "Precios aproximados en USD.",
    options: [
      { id: "b120", icon: "💵", label: "Hasta $120", desc: "Opciones accesibles" },
      { id: "b150", icon: "💵", label: "Hasta $150", desc: "Gama media" },
      { id: "b190", icon: "💰", label: "Hasta $190", desc: "Gama alta" },
      { id: "libre", icon: "💎", label: "Sin límite", desc: "Quiero la que mejor encaje, cueste lo que cueste" },
    ],
  },
];

const state = { step: 0, answers: {} };

/* ---------- Utilidades ---------- */

function optionLabel(qId, optId) {
  const q = QUESTIONS.find((x) => x.id === qId);
  const o = q && q.options.find((x) => x.id === optId);
  return o ? o.label : "";
}

function setBanner(show) {
  $("quizShell").hidden = !show;
  $("resultsView").hidden = show;
}

function shareUrl() {
  const code = QUESTIONS.map((q) => state.answers[q.id]).join(",");
  return location.href.split("#")[0].split("?")[0] + "?r=" + code;
}

function readSharedAnswers() {
  const raw = new URLSearchParams(location.search).get("r");
  if (!raw) return null;
  const parts = raw.split(",");
  if (parts.length !== QUESTIONS.length) return null;
  const answers = {};
  for (let i = 0; i < QUESTIONS.length; i++) {
    if (!QUESTIONS[i].options.some((o) => o.id === parts[i])) return null;
    answers[QUESTIONS[i].id] = parts[i];
  }
  return answers;
}

function updateUrl(withAnswers) {
  try {
    history.replaceState(null, "", withAnswers ? shareUrl() : location.pathname);
  } catch (_) {
    /* con file:// algunos navegadores lo bloquean; no afecta al quiz */
  }
}

/* ---------- Pasos ---------- */

function renderStep(focusTitle = true) {
  const q = QUESTIONS[state.step];
  const total = QUESTIONS.length;
  const current = state.answers[q.id];

  $("stepCount").textContent = `Pregunta ${state.step + 1} de ${total}`;
  $("stepTopic").textContent = q.short;
  $("progressFill").style.width = ((state.step + 1) / total) * 100 + "%";
  $("progressTrack").setAttribute("aria-valuenow", Math.round(((state.step + 1) / total) * 100));

  $("stepTitle").textContent = q.title;
  $("stepHint").textContent = q.hint;

  const opts = $("options");
  opts.dataset.count = q.options.length;
  opts.innerHTML = q.options
    .map(
      (o) => `
      <button type="button" class="option" data-id="${o.id}" aria-pressed="${current === o.id}">
        <span class="option-icon" aria-hidden="true">${o.icon}</span>
        <span class="option-text">
          <span class="option-label">${o.label}</span>
          <span class="option-desc">${o.desc}</span>
        </span>
        <span class="option-check" aria-hidden="true">✓</span>
      </button>`
    )
    .join("");

  $("backBtn").style.visibility = state.step === 0 ? "hidden" : "visible";
  $("nextBtn").style.visibility = current ? "visible" : "hidden";
  $("nextBtn").textContent = state.step === total - 1 ? "Ver mi resultado →" : "Siguiente →";

  const card = $("stepCard");
  card.classList.remove("enter");
  void card.offsetWidth; /* reinicia la animación */
  card.classList.add("enter");

  if (focusTitle) $("stepTitle").focus({ preventScroll: true });

  const shell = $("quizShell");
  if (shell.getBoundingClientRect().top < 0) {
    shell.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
}

function selectOption(optId) {
  const q = QUESTIONS[state.step];
  state.answers[q.id] = optId;
  $("options").querySelectorAll(".option").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === optId)));
  $("nextBtn").style.visibility = "visible";
  setTimeout(goNext, reduceMotion ? 0 : 260);
}

function goNext() {
  if (!state.answers[QUESTIONS[state.step].id]) return;
  if (state.step < QUESTIONS.length - 1) {
    state.step++;
    renderStep();
  } else {
    finish();
  }
}

function goBack() {
  if (state.step === 0) return;
  state.step--;
  renderStep();
}

/* ---------- Carga y resultado ---------- */

function finish() {
  $("stepView").hidden = true;
  $("loadingView").hidden = false;
  const delay = reduceMotion ? 0 : 1700;
  setTimeout(() => {
    $("loadingView").hidden = true;
    $("stepView").hidden = false;
    showResults();
  }, delay);
}

function showResults() {
  const data = recommend(state.answers);
  $("resultsView").innerHTML = resultsHTML(data);
  setBanner(false);
  updateUrl(true);
  window.scrollTo({ top: 0, behavior: "auto" });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll(".match-fill").forEach((el) => { el.style.width = el.dataset.width + "%"; });
  }));
}

const list = (items, cls) => `<ul class="${cls}">${items.map((t) => `<li>${t}</li>`).join("")}</ul>`;

function mainCardHTML(r, second) {
  const s = r.shoe;
  return `
    <article class="result-main">
      <div class="result-visual">
        <span class="rank-flag">#1 · Tu mejor opción</span>
        ${shoeVisual(s)}
      </div>
      <div class="result-info">
        <div class="result-brand">${s.brand}</div>
        <h3 class="result-name">${s.name}</h3>
        <p class="result-tagline">${s.tagline}</p>
        <div class="match">
          <div class="match-num">${r.match}<span>%</span></div>
          <div class="match-side">
            <div class="match-label">Afinidad contigo</div>
            <div class="match-bar"><div class="match-fill" data-width="${r.match}"></div></div>
          </div>
        </div>
        <div>
          <h4 class="result-sub">Por qué encaja contigo</h4>
          ${list(r.reasons, "reason-list")}
        </div>
        ${r.warnings.length ? `<div><h4 class="result-sub">A tener en cuenta</h4>${list(r.warnings, "warn-list")}</div>` : ""}
        <div class="result-meta"><strong>${formatPrice(s.price)}</strong> · ${s.weightG} g · Soporte ${s.ankle.label.toLowerCase()}</div>
        <div class="result-actions">
          <a ${affiliateAttrs(s)} class="qbtn qbtn-primary">🔥 Ver mejor precio hoy</a>
          ${second ? `<a href="compare.html?a=${s.id}&b=${second.shoe.id}" class="qbtn qbtn-ghost">⚡ Comparar con ${second.shoe.name}</a>` : ""}
        </div>
      </div>
    </article>`;
}

function runnerCardHTML(r, pos, first) {
  const s = r.shoe;
  return `
    <article class="runner-card">
      <div class="runner-top">
        <div class="runner-visual">${shoeVisual(s)}</div>
        <div class="runner-id">
          <div class="runner-rank">#${pos} · ${s.brand}</div>
          <h3 class="runner-name">${s.name}</h3>
        </div>
        <div class="runner-match">${r.match}%<small>afinidad</small></div>
      </div>
      ${list(r.reasons.slice(0, 2), "reason-list")}
      ${r.warnings.length ? list(r.warnings.slice(0, 2), "warn-list") : ""}
      <div class="result-meta"><strong>${formatPrice(s.price)}</strong> · ${s.weightG} g</div>
      <div class="result-actions">
        <a ${affiliateAttrs(s)} class="qbtn qbtn-primary qbtn-small">🔥 Ver precio</a>
        <a href="compare.html?a=${first.shoe.id}&b=${s.id}" class="qbtn qbtn-ghost qbtn-small">⚡ Comparar con #1</a>
      </div>
    </article>`;
}

function stretchHTML(st, budget) {
  const s = st.shoe;
  const extra = s.price - budget;
  return `
    <div class="stretch-card">
      <div>
        <div class="stretch-label">Si puedes estirar el presupuesto</div>
        <div class="stretch-name">${s.name} · ${st.match}% de afinidad</div>
        <p class="stretch-text">Cuesta unos $${extra} más que tu límite, pero encaja mejor con tu perfil: ${st.reasons[0].charAt(0).toLowerCase() + st.reasons[0].slice(1)}.</p>
      </div>
      <a ${affiliateAttrs(s)} class="qbtn qbtn-ghost">Ver precio · ${formatPrice(s.price)}</a>
    </div>`;
}

function resultsHTML({ results, stretch, budget }) {
  const chips = QUESTIONS.map((q) => `<span class="chip"><b>${q.short}</b>${optionLabel(q.id, state.answers[q.id])}</span>`).join("");

  const head = `
    <div class="results-head">
      <div class="quiz-label">Tu resultado</div>
      <h2 class="results-title">TUS ZAPATILLAS <span class="dim">IDEALES</span></h2>
      <p class="results-sub">Calculado con tus ${QUESTIONS.length} respuestas y las puntuaciones propias de HoopMatch.</p>
      <div class="profile-chips">${chips}</div>
    </div>`;

  const tools = `
    <div class="results-tools">
      <button type="button" class="qbtn qbtn-ghost qbtn-small" data-action="edit">← Editar respuestas</button>
      <button type="button" class="qbtn qbtn-ghost qbtn-small" data-action="restart">↻ Repetir el test</button>
      <button type="button" class="qbtn qbtn-ghost qbtn-small" data-action="copy">🔗 Copiar enlace</button>
    </div>
    <p class="results-note">La afinidad es una estimación relativa al catálogo actual (${SHOES.length} modelos), no una garantía de ajuste: pruébate las zapatillas siempre que puedas. Nada de lo que respondes se guarda ni se envía.</p>
    <p class="method-note">${methodNoteHTML(SHOES)}</p>`;

  if (!results.length) {
    return `${head}
      <div class="results-empty">
        <h3 class="results-title" style="font-size:2rem">Ninguna zapatilla entra en ese presupuesto</h3>
        <p>Prueba con un límite más alto o revisa el ranking de calidad/precio.</p>
        <button type="button" class="qbtn qbtn-primary" data-action="edit">Cambiar respuestas</button>
      </div>${tools}`;
  }

  const [first, second, third] = results;
  const runners = [second, third].filter(Boolean);

  return `${head}
    ${mainCardHTML(first, second)}
    ${runners.length ? `<div class="results-section-label">Otras buenas opciones</div>
      <div class="runner-grid">${runners.map((r, i) => runnerCardHTML(r, i + 2, first)).join("")}</div>` : ""}
    ${stretch ? stretchHTML(stretch, budget) : ""}
    ${tools}`;
}

/* ---------- Acciones de la pantalla de resultados ---------- */

async function copyLink(btn) {
  const url = shareUrl();
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(url);
    btn.textContent = "✓ Enlace copiado";
  } catch (_) {
    window.prompt("Copia este enlace:", url);
  }
  setTimeout(() => { btn.textContent = original; }, 2000);
}

function editAnswers() {
  state.step = 0;
  setBanner(true);
  renderStep(false);
  window.scrollTo({ top: 0, behavior: "auto" });
}

function restart() {
  state.answers = {};
  state.step = 0;
  updateUrl(false);
  setBanner(true);
  renderStep(false);
  window.scrollTo({ top: 0, behavior: "auto" });
}

/* ---------- INIT ---------- */

onShoesReady(() => {
  $("options").addEventListener("click", (e) => {
    const btn = e.target.closest(".option");
    if (btn) selectOption(btn.dataset.id);
  });
  $("backBtn").addEventListener("click", goBack);
  $("nextBtn").addEventListener("click", goNext);

  $("resultsView").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "edit") editAnswers();
    if (btn.dataset.action === "restart") restart();
    if (btn.dataset.action === "copy") copyLink(btn);
  });

  /* Enlace compartido: ?r=base,explosivo,w2,... abre directamente el resultado */
  const shared = readSharedAnswers();
  if (shared) {
    state.answers = shared;
    renderStep(false);
    showResults();
  } else {
    renderStep(false);
  }
});
