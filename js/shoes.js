/* ==========================================================================
   HoopMatch · shoes.js
   ÚNICA fuente de datos. index, compare (y el futuro quiz) leen de aquí.
   Para agregar una zapatilla: copia un objeto, cambia los valores y listo.
   ========================================================================== */

const STAT_KEYS = ["grip", "comodidad", "amortiguacion", "durabilidad", "estilo", "rendimiento"];

const STAT_LABELS = {
    grip: "Grip",
    comodidad: "Comodidad",
    amortiguacion: "Amortiguación",
    durabilidad: "Durabilidad",
    estilo: "Estilo",
    rendimiento: "Rendimiento",
};

/* Etiquetas cortas para el ranking */
const STAT_SHORT = {
    grip: "Grip",
    comodidad: "Comod.",
    amortiguacion: "Amort.",
    durabilidad: "Durab.",
    estilo: "Estilo",
    rendimiento: "Rend.",
};

const POSITIONS = ["base", "escolta", "alero", "pivot"];
const POSITION_LABELS = { base: "Base", escolta: "Escolta", alero: "Alero", pivot: "Pivot" };
const POSITION_ICONS = { base: "🏃", escolta: "🏹", alero: "🦅", pivot: "🏋️" };

/*
  Campos por zapatilla
  - scores:   escribe SOLO grip, comodidad, amortiguacion, durabilidad y estilo (0 a 10, mejor en pasos de 0.5).
              "rendimiento" se CALCULA solo (ver AUTO_RENDIMIENTO): déjalo en null o ponle cualquier valor, se sobrescribe.
  - status / confidence / sources / lastVerified: trazabilidad de las notas. Si no los pones, la zapatilla queda
              como status "provisional" y confidence "baja" (la web muestra "En revisión").
              Para verificarla: ≥3 reviews independientes en sources.lab / sources.playtests (URLs),
              status: "verificada", confidence: "media" | "alta" y lastVerified: "AAAA-MM-DD".
  - supportScore: (opcional) nota 0-10 de soporte/estabilidad. Si falta, se deriva de ankle.level.
  - courts:   agarre por tipo de cancha (0-10). El texto Sí / Regular / No se deriva de aquí.
              OJO: son valores estimados a partir de tus pros/contras. Reemplázalos con tus tests reales.
  - weightG:  peso en gramos (número, para el futuro algoritmo del quiz)
  - ankle:    soporte de tobillo. level: 1 (bajo) a 3 (alto)
  - price:    precio aprox. en USD (número)
  - positions: "yes" | "ok" | "no" por posición
  - image:    ruta a una foto real (ej: "img/kyrie.png"). Si está vacío se usa el emoji.
  - affiliate: link de afiliado. Mientras sea "#" el botón no abre nada.
  - Una zapatilla con scores, courts, positions, price o weightG sin completar (null) se ignora hasta que la completes.
  - fit:      avisos que usa el quiz (salen de tus "contras"). Todos opcionales:
              heavy (jugadores de +95 kg), fast (estilo explosivo / bases), inside (pívots / juego físico),
              wide (pie ancho), size (consejo de talla, solo informa),
              dust: { note, from } → from: 1 avisa con polvo, 2 solo con cancha muy polvorienta o húmeda.
*/
const SHOES_ALL = [
    {
        id: "kyrie",
        brand: "Nike",
        name: "Kyrie Infinity",
        emoji: "👟",
        image: "",
        tagline: "La zapatilla con mejor grip de la cancha.",
        description: "Diseñada para bases explosivos que necesitan control total en cada corte.",
        scores: { grip: 9.5, comodidad: 8.8, amortiguacion: 8.5, durabilidad: 8.2, estilo: 9.0, rendimiento: 9.3 },
        courts: { indoor: 9.5, outdoor: 7.2 },
        weightG: 390,
        sole: "Rubber multidireccional",
        cushion: "Zoom Air unidad",
        ankle: { label: "Medio-alto", level: 2.5 },
        price: 130,
        bestFor: "Bases / Escoltas",
        pros: [
            "Grip excepcional en cancha limpia",
            "Respuesta rápida en cambios de dirección",
            "Perfil bajo y estable",
            "Tracción multidireccional",
        ],
        cons: ["Pierde grip en canchas con polvo", "No apta para jugadores pesados", "Durabilidad media-baja"],
        positions: { base: "yes", escolta: "yes", alero: "ok", pivot: "no" },
        badge: { text: "🔥 Trending", cls: "badge-fire" },
        rankTags: ["Mejor Grip", "Perfil Bajo"],
        valueNote: "Grip top a precio medio",
        outdoorNote: "Sirve en exterior, desgaste medio",
        fit: { heavy: "No apta para jugadores pesados", dust: { note: "Pierde grip en canchas con polvo", from: 1 } },
        affiliate: "#",
    },
    {
        id: "harden",
        brand: "Adidas",
        name: "Harden Vol. 7",
        emoji: "👟",
        image: "",
        tagline: "La mejor relación calidad/precio del año.",
        description: "Amortiguación premium y grip consistente para todo tipo de jugador.",
        scores: { grip: 9.2, comodidad: 9.1, amortiguacion: 9.3, durabilidad: 7.8, estilo: 8.5, rendimiento: 8.8 },
        courts: { indoor: 9.2, outdoor: 6.5 },
        weightG: 420,
        sole: "Continental rubber",
        cushion: "Lightstrike Pro",
        ankle: { label: "Bajo-medio", level: 1.5 },
        price: 110,
        bestFor: "Bases / Aleros",
        pros: [
            "Increíble amortiguación Lightstrike",
            "Grip consistente en todo terreno",
            "Excelente calidad/precio",
            "Cómoda desde el primer uso",
        ],
        cons: [
            "Suela desgasta rápido en exterior",
            "Falta soporte en tobillo",
            "Talla pequeña (pedir medio número más)",
        ],
        positions: { base: "yes", escolta: "ok", alero: "yes", pivot: "no" },
        badge: { text: "⭐ Top C/P", cls: "badge-top" },
        rankTags: ["Calidad/Precio", "Amortiguación"],
        valueNote: "Mejor relación C/P del año",
        outdoorNote: "Cómoda, pero la suela se desgasta",
        fit: { size: "Talla pequeña: pide medio número más" },
        affiliate: "#",
    },
    {
        id: "jordan",
        brand: "Jordan Brand",
        name: "Air Jordan 36",
        emoji: "🏀",
        image: "",
        tagline: "El modelo más completo de Jordan en años.",
        description: "Combina estilo icónico con tecnología de rendimiento de alto nivel.",
        scores: { grip: 8.7, comodidad: 9.3, amortiguacion: 9.5, durabilidad: 9.0, estilo: 9.6, rendimiento: 8.9 },
        courts: { indoor: 8.7, outdoor: 4.0 },
        weightG: 460,
        sole: "XDR rubber",
        cushion: "Cushion Eclipse + placa carbono",
        ankle: { label: "Alto", level: 3 },
        price: 185,
        bestFor: "Aleros / Pivots",
        pros: [
            "Diseño icónico con calidad premium",
            "Placa de fibra de carbono",
            "Durabilidad superior",
            "Amortiguación brutal",
        ],
        cons: ["Precio muy alto", "Tiempo de rodaje necesario", "Grip mediocre en cancha mojada"],
        positions: { base: "ok", escolta: "ok", alero: "yes", pivot: "yes" },
        badge: { text: "✦ Premium", cls: "badge-new" },
        rankTags: ["Mejor Estilo", "Máx Amortiguación"],
        valueNote: "Premium: pagas diseño y placa",
        outdoorNote: "Mejor guardarla para interior",
        fit: { dust: { note: "Grip mediocre en cancha mojada", from: 2 } },
        affiliate: "#",
    },
    {
        id: "curry",
        brand: "Under Armour",
        name: "Curry 11",
        emoji: "👟",
        image: "",
        tagline: "Hecha para los bases más rápidos de la cancha.",
        description: "Ligera, reactiva y con grip diseñado para movimientos de guardia.",
        scores: { grip: 8.9, comodidad: 8.6, amortiguacion: 8.4, durabilidad: 8.4, estilo: 8.0, rendimiento: 8.7 },
        courts: { indoor: 8.9, outdoor: 6.8 },
        weightG: 350,
        sole: "Herringbone pattern",
        cushion: "Flow Pro",
        ankle: { label: "Bajo", level: 1 },
        price: 160,
        bestFor: "Bases",
        pros: [
            "Extremadamente ligera",
            "Excelente para cortes rápidos",
            "Flow Pro muy reactivo",
            "Buena estabilidad lateral",
        ],
        cons: ["Estilo divisivo", "Poco soporte para pies anchos", "No recomendada para juego interior"],
        positions: { base: "yes", escolta: "ok", alero: "no", pivot: "no" },
        badge: { text: "🔥 Hot Pick", cls: "badge-fire" },
        rankTags: ["Para Bases", "Movimientos Rápidos"],
        valueNote: "Rendimiento premium, precio medio-alto",
        outdoorNote: "Uso ocasional en exterior",
        fit: { wide: "Poco soporte para pies anchos", inside: "No recomendada para juego interior" },
        affiliate: "#",
    },
    {
        id: "lebron",
        brand: "Nike",
        name: "LeBron 21",
        emoji: "👟",
        image: "",
        tagline: "La zapatilla más durable del mercado.",
        description: "Para jugadores que necesitan soporte máximo y comodidad durante 40 minutos.",
        scores: { grip: 8.4, comodidad: 9.5, amortiguacion: 9.6, durabilidad: 9.3, estilo: 8.8, rendimiento: 8.6 },
        courts: { indoor: 8.6, outdoor: 8.6 },
        weightG: 520,
        sole: "Multi-surface rubber",
        cushion: "Air Max + Zoom",
        ankle: { label: "Alto", level: 3 },
        price: 200,
        bestFor: "Aleros / Pivots",
        pros: [
            "Comodidad insuperable en partido completo",
            "Máxima durabilidad",
            "Soporte de tobillo excelente",
            "Air Max brutal",
        ],
        cons: ["Muy pesada para juego rápido", "Grip no destaca", "Precio premium"],
        positions: { base: "no", escolta: "ok", alero: "yes", pivot: "yes" },
        badge: { text: "⭐ Top Power", cls: "badge-top" },
        rankTags: ["Más Durable", "Jugadores Pesados"],
        valueNote: "Inversión en durabilidad",
        outdoorNote: "Suela multi-superficie",
        fit: { fast: "Muy pesada para juego rápido" },
        affiliate: "#",
    },
    {
        id: "freak",
        brand: "Nike",
        name: "Zoom Freak 5",
        emoji: "👟",
        image: "",
        tagline: "Para el jugador versátil que hace de todo.",
        description: "Equilibrio entre grip, comodidad y durabilidad a precio razonable.",
        scores: { grip: 8.8, comodidad: 8.4, amortiguacion: 8.3, durabilidad: 8.6, estilo: 8.2, rendimiento: 8.5 },
        courts: { indoor: 8.8, outdoor: 8.8 },
        weightG: 430,
        sole: "Freak traction pattern",
        cushion: "Zoom Air dual unidad",
        ankle: { label: "Medio", level: 2 },
        price: 120,
        bestFor: "Aleros / Pivots",
        pros: ["Muy versátil", "Buena tracción interior y exterior", "Precio accesible", "Zoom Air reactivo"],
        cons: ["Diseño poco llamativo", "Falta identidad visual", "Cushion menos reactivo que Kyrie"],
        positions: { base: "ok", escolta: "ok", alero: "yes", pivot: "yes" },
        badge: { text: "✦ Recomendada", cls: "badge-new" },
        rankTags: ["Versátil", "Precio Accesible"],
        valueNote: "Versátil y accesible",
        outdoorNote: "Tracción interior y exterior",
        fit: {},
        affiliate: "#",
    },

    /* ==========================================================================
     ZAPATILLAS PENDIENTES
     Datos objetivos tomados de RunRepeat (vía Perplexity). Mientras les falte algo
     (scores, courts, positions, price o weightG) la web las IGNORA y la consola del
     navegador avisa qué falta. Cuando completes todo, aparecen solas en la home,
     el comparador y el quiz.
     ========================================================================== */
    {
        id: "sabrina3",
        brand: "Nike",
        name: "Sabrina 3",
        releaseYear: 2025,
        emoji: "👟",
        image: "",
        tagline: "Ligera y de perfil bajo para sentir la cancha.",
        description: "Pensada para bases y escoltas que priorizan court feel y respuesta.",
        scores: {
            grip: null,
            comodidad: null,
            amortiguacion: null,
            durabilidad: null,
            estilo: null,
            rendimiento: null,
        },
        courts: {
            indoor: null,
            outdoor: null,
        } /* RunRepeat: tracción fiable en parquet limpio; NO recomendada para exterior */,
        weightG: 352 /* US 9, medido por RunRepeat */,
        sole: "Goma de perfil bajo (26.1 mm talón / 20.6 mm antepié)",
        cushion: "Perfil bajo, absorción media (96 SA talón / 74 SA antepié)",
        ankle: { label: "Bajo", level: 1 },
        price: 135 /* USD. Lanzamiento jul-2025: $130 (Blueprint); colorways posteriores $135 */,
        bestFor: "Bases / Escoltas",
        pros: [
            "Peso bajo para una zapatilla de rendimiento",
            "Plataforma baja con contacto directo con la cancha",
            "Buena estabilidad lateral y contención",
            "Tracción fiable en parquet limpio",
        ],
        cons: [
            "Absorción de impactos relativamente baja",
            "No recomendada para cancha exterior",
            "No recomendada para pies anchos",
        ],
        positions: null /* PENDIENTE. Sugerencia mía según bestFor: base yes, escolta yes, alero ok, pivot no */,
        badge: { text: "✦ Ligera", cls: "badge-new" },
        rankTags: ["Perfil Bajo", "Court Feel"],
        valueNote: "Court feel con peso bajo",
        outdoorNote: "No recomendada para exterior",
        fit: {
            heavy: "Absorción de impactos baja para jugadores pesados",
            inside: "No es la mejor opción para juego interior físico",
            wide: "No recomendada para pies anchos",
        },
        affiliate: "#",
    },
    {
        id: "twowxy5",
        brand: "New Balance",
        name: "Two WXY v5",
        releaseYear: 2024 /* lanzamiento oficial: 13-sep-2024 */,
        emoji: "👟",
        image: "",
        tagline: "Versátil y estable, con muy buena relación calidad/precio.",
        description: "Para aleros versátiles y jugadores que priorizan estabilidad y soporte.",
        scores: {
            grip: null,
            comodidad: null,
            amortiguacion: null,
            durabilidad: null,
            estilo: null,
            rendimiento: null,
        },
        courts: {
            indoor: null,
            outdoor: null,
        } /* RunRepeat: apta para streetball ocasional; buena durabilidad de suela y tracción en exterior */,
        weightG: 390 /* RunRepeat (laboratorio). La ficha de una tienda indica 398 g */,
        sole: "Goma con patrón de tracción circular (fricción 0.74)",
        cushion: "FuelCell + Fresh Foam X, mediasuela dividida (101 SA en talón)",
        ankle: {
            label: "Medio-alto",
            level: 2.5,
        } /* Perplexity decía "Medio"; collar alto y WearTesters la incluye en su lista de mejor soporte de tobillo */,
        price: 120 /* USD, precio oficial de New Balance en el lanzamiento */,
        bestFor: "Aleros / Jugadores que buscan soporte",
        pros: [
            "Contención lateral y estabilidad sobresalientes",
            "Base amplia y muy estable para aterrizajes",
            "Buena absorción de impactos",
            "Antepié flexible pese a la rigidez estructural",
        ],
        cons: ["Puede requerir un periodo de adaptación", "Ofrece poco court feel"],
        positions: null /* PENDIENTE. Sugerencia mía según bestFor: base ok, escolta ok, alero yes, pivot yes */,
        badge: { text: "⭐ Estabilidad", cls: "badge-top" },
        rankTags: ["Estabilidad", "Soporte"],
        valueNote: "Estabilidad y soporte",
        outdoorNote: "Apta para streetball ocasional",
        /* RunRepeat: talla fiel y ajuste "bastante generoso" para ancho D (puntera 93.7 mm). Es un dato positivo, no un aviso, así que no va en fit. */
        fit: {},
        affiliate: "#",
    },
    {
        id: "kd18",
        brand: "Nike",
        name: "KD 18",
        releaseYear: 2025,
        emoji: "👟",
        image: "",
        tagline: "Tracción y amortiguación premium para el alero móvil.",
        description: "Para aleros y pívots móviles que buscan agarre y protección de impactos.",
        scores: {
            grip: null,
            comodidad: null,
            amortiguacion: null,
            durabilidad: null,
            estilo: null,
            rendimiento: null,
        },
        courts: {
            indoor: null,
            outdoor: null,
        } /* RunRepeat: fricción 0.89 en parquet; aceptable para exterior, no la más resistente en asfalto */,
        weightG: 422 /* US 9, medido por RunRepeat */,
        sole: "Goma de alta fricción (0.89 en parquet), outrigger lateral",
        cushion: "Cushlon + Air Zoom Strobel + Zoom Air en antepié",
        ankle: { label: "Bajo-medio", level: 1.5 },
        price: 155 /* USD. Lanzamiento abr-2025: $160; la mayoría de colorways $155; algunas ediciones $165-170 */,
        bestFor: "Aleros / Pívots móviles",
        pros: [
            "Tracción excepcional en cancha",
            "Gran absorción de impactos en talón y antepié",
            "Retorno de energía alto",
            "Contención, bloqueo de talón y estabilidad lateral sólidos",
        ],
        cons: ["Más pesada que la media (422 g)", "No recomendada para pies anchos"],
        positions: null /* PENDIENTE. Sugerencia mía según bestFor: base ok, escolta ok, alero yes, pivot yes */,
        badge: { text: "🔥 Tracción", cls: "badge-fire" },
        rankTags: ["Tracción", "Amortiguación"],
        valueNote: "Premium en tracción y amortiguación",
        outdoorNote: "Aceptable para exterior",
        fit: { fast: "Pesa 422 g: no es la más ligera para juego rápido", wide: "No recomendada para pies anchos" },
        affiliate: "#",
    },
    {
        id: "gthustle3",
        brand: "Nike",
        name: "G.T. Hustle 3",
        releaseYear: 2024,
        emoji: "👟",
        image: "",
        tagline: "Máxima absorción de impactos con peso contenido.",
        description: "Para pívots, jugadores pesados y quienes priorizan proteger las articulaciones.",
        scores: {
            grip: null,
            comodidad: null,
            amortiguacion: null,
            durabilidad: null,
            estilo: null,
            rendimiento: null,
        },
        courts: { indoor: null, outdoor: null } /* RunRepeat: tracción buena; sin datos de exterior */,
        weightG: 370 /* US 9, medido por RunRepeat */,
        sole: "Goma con base ancha (116.5 mm antepié)",
        cushion: "Zoom Air grande en antepié (117 SA talón / 120 SA antepié)",
        ankle: { label: "Bajo-medio", level: 1.5 },
        price: 190 /* USD. Lanzamiento jul-2024: $180; la mayoría de colorways posteriores $190 (ediciones especiales $200+) */,
        bestFor: "Pívots / Jugadores pesados",
        pros: [
            "Absorción de impactos excepcional",
            "Retorno de energía muy alto en antepié",
            "Peso bajo para tanta amortiguación",
            "Buen soporte de talón y plataforma estable",
        ],
        cons: ["Poco court feel", "Puede sentirse alta o inestable para jugadores ligeros", "Precio de gama alta"],
        positions: null /* PENDIENTE. Sugerencia mía según bestFor: base no, escolta ok, alero ok, pivot yes */,
        badge: { text: "⭐ Protección", cls: "badge-top" },
        rankTags: ["Máx Amortiguación", "Jugadores Pesados"],
        valueNote: "Máxima absorción con peso contenido",
        outdoorNote: "Sin datos de exterior",
        /* "fast" se usa aquí como aviso para jugadores ligeros / bases (el motor lo muestra a estilo explosivo o base) */
        fit: { fast: "Puede sentirse alta o inestable para jugadores ligeros" },
        affiliate: "#",
    },
    {
        id: "luka77",
        brand: "Jordan Brand",
        name: "Luka .77",
        releaseYear: 2025,
        emoji: "👟",
        image: "",
        tagline: "Suela a prueba de asfalto a precio contenido.",
        description: "Para bases y escoltas de exterior que buscan durabilidad sin gastar de más.",
        scores: {
            grip: null,
            comodidad: null,
            amortiguacion: null,
            durabilidad: null,
            estilo: null,
            rendimiento: null,
        },
        courts: {
            indoor: null,
            outdoor: null,
        } /* RunRepeat: tracción 0.83, solo 0.4 mm de desgaste (Dremel): la más clara para exterior del lote */,
        weightG: 349 /* US 9, medido por RunRepeat */,
        sole: "Goma de exterior (fricción 0.83, desgaste 0.4 mm)",
        cushion: "Perfil bajo y firme, absorción de impactos limitada",
        ankle: { label: "Bajo-medio", level: 1.5 },
        price: 105 /* USD. Lanzamiento abr-2025: $100; precio estándar actual $105 */,
        bestFor: "Bases / Escoltas (exterior)",
        pros: [
            "Excelente resistencia de la suela en asfalto y cemento",
            "Tracción muy alta en exterior e interior",
            "Peso ligero para una zapatilla resistente",
            "Buena ventilación y soporte lateral para su precio",
        ],
        cons: ["Absorción de impactos baja", "Retorno de energía poco estimulante", "Sensación firme bajo el pie"],
        positions: null /* PENDIENTE. Sugerencia mía según bestFor: base yes, escolta yes, alero ok, pivot no */,
        badge: { text: "🔥 Exterior", cls: "badge-fire" },
        rankTags: ["Exterior", "Precio Accesible"],
        valueNote: "Resistente en exterior a precio contenido",
        outdoorNote: "Suela muy resistente (0.4 mm de desgaste)",
        fit: {
            heavy: "Absorción de impactos baja para jugadores pesados",
            inside: "No prioriza la protección de impactos del juego interior físico",
        },
        affiliate: "#",
    },
    {
        id: "witness9",
        brand: "Nike",
        name: "LeBron Witness 9",
        releaseYear: 2024 /* StockX la lista con lanzamiento oct-2024 (Perplexity decía 2025); revísalo */,
        emoji: "👟",
        image: "",
        tagline: "Resistente, estable y barata: una opción seria para exterior.",
        description:
            "Para jugadores pesados y de exterior que buscan estabilidad, tracción y durabilidad a precio contenido.",
        scores: {
            grip: null,
            comodidad: null,
            amortiguacion: null,
            durabilidad: null,
            estilo: null,
            rendimiento: null,
        },
        courts: {
            indoor: null,
            outdoor: null,
        } /* RunRepeat: fricción 0.84; solo 0.6 mm de desgaste (Dremel); "muy recomendable" para exterior */,
        weightG: 428 /* RunRepeat, review individual (una guía suya cita 418 g) */,
        sole: "Goma de 4.4 mm, tracción multidireccional (fricción 0.84, desgaste 0.6 mm)",
        cushion: "ReactX (99 SA talón / 75 SA antepié)",
        ankle: {
            label: "Bajo-medio",
            level: 1.5,
        } /* OJO: Perplexity también habla de "soporte de tobillo muy alto"; verifica el corte */,
        price: 105 /* USD, precio estándar */,
        bestFor: "Jugadores pesados / Aleros / Exterior",
        pros: [
            "Mediasuela ReactX con buena respuesta para su precio",
            "Estabilidad muy alta",
            "Tracción de suela sobresaliente",
            "Durabilidad en exterior excelente para su precio",
        ],
        cons: ["Más pesada que la media", "Transpirabilidad limitada", "Materiales con sensación menos premium"],
        positions: null /* PENDIENTE. Sugerencia mía según bestFor: base no, escolta ok, alero yes, pivot yes */,
        badge: { text: "⭐ Resistente", cls: "badge-top" },
        rankTags: ["Exterior", "Pie Ancho"],
        valueNote: "Durabilidad y estabilidad por poco dinero",
        outdoorNote: "Muy recomendable: solo 0.6 mm de desgaste",
        /* Pie ancho: RunRepeat la describe de ajuste amplio y la recomienda como opción económica para pie ancho (dato positivo, no va en fit) */
        fit: { fast: "Más pesada que la media (428 g): menos indicada para juego ultrarrápido" },
        affiliate: "#",
    },
    {
        id: "damex",
        brand: "Adidas",
        name: "Dame X",
        releaseYear: 2025 /* lanzamiento 3-jul-2025 */,
        emoji: "👟",
        image: "",
        tagline: "Tracción en interior y soporte sólido por menos de $100.",
        description:
            "Para bases y escoltas recreativos, y para quienes empiezan: agarre y estabilidad a precio contenido.",
        scores: {
            grip: null,
            comodidad: null,
            amortiguacion: null,
            durabilidad: null,
            estilo: null,
            rendimiento: null,
        },
        courts: { indoor: null, outdoor: null } /* RunRepeat: tracción interior excelente; sin datos de exterior */,
        weightG: 414 /* RunRepeat */,
        sole: "Goma con patrón generativo (tracción interior excelente)",
        cushion: "Lightstrike de perfil bajo (absorción y retorno limitados)",
        ankle: { label: "Bajo-medio", level: 1.5 },
        price: 95 /* USD. adidas confirmó $95 en el lanzamiento (algunas fuentes dicen $90) */,
        bestFor: "Bases / Escoltas recreativos",
        pros: [
            "Tracción interior excelente",
            "Estructura de soporte muy sólida",
            "Buen bloqueo y seguridad para cortes rápidos",
            "Precio por debajo de $100",
        ],
        cons: ["Peso superior a la media", "Absorción de impactos limitada", "Retorno de energía limitado"],
        positions: null /* PENDIENTE. Sugerencia mía según bestFor: base yes, escolta yes, alero ok, pivot no */,
        badge: { text: "💸 Económica", cls: "badge-top" },
        rankTags: ["Menos de $100", "Tracción Interior"],
        valueNote: "Lightstrike por menos de $100",
        outdoorNote: "Pensada para interior",
        fit: { heavy: "RunRepeat la desaconseja para jugadores pesados: amortiguación de bajo perfil" },
        affiliate: "#",
    },
    {
        id: "gtcutacademy",
        brand: "Nike",
        name: "G.T. Cut Academy",
        releaseYear: 2024 /* lanzamiento ene-2024. Existe una "Zoom GT Cut Academy 2" (2025-26, también $95): considera cuál prefieres incluir */,
        emoji: "👟",
        image: "",
        tagline: "Ligera y con Zoom Air en el antepié, por menos de $100.",
        description: "Para bases y escoltas rápidos con presupuesto limitado.",
        scores: {
            grip: null,
            comodidad: null,
            amortiguacion: null,
            durabilidad: null,
            estilo: null,
            rendimiento: null,
        },
        courts: {
            indoor: null,
            outdoor: null,
        } /* RunRepeat: materiales menos duraderos; sin pruebas de abrasión, tratarla como indoor */,
        weightG: 342 /* RunRepeat */,
        sole: "Goma orientada a cambios de dirección",
        cushion: "Zoom Air en antepié",
        ankle: { label: "Bajo", level: 1 },
        price: 95 /* USD, precio estándar */,
        bestFor: "Bases / Escoltas rápidos",
        pros: [
            "Peso ligero para baloncesto de rendimiento",
            "Buen lockdown y contención lateral",
            "Zoom Air delantero con sensación de impulso",
            "Precio económico dentro de la línea G.T. Cut",
        ],
        cons: ["Materiales menos duraderos que alternativas más caras", "Upper de tacto básico"],
        positions: null /* PENDIENTE. Sugerencia mía según bestFor: base yes, escolta yes, alero ok, pivot no */,
        badge: { text: "💸 Económica", cls: "badge-top" },
        rankTags: ["Ligera", "Zoom Air"],
        valueNote: "Zoom Air y 342 g por $95",
        outdoorNote: "Pensada para interior",
        fit: {},
        affiliate: "#",
    },
    {
        id: "lebron23",
        brand: "Nike",
        name: "LeBron 23",
        releaseYear: 2025 /* lanzamiento 2-dic-2025 */,
        emoji: "👟",
        image: "",
        tagline: "ZoomX de longitud completa para el jugador potente.",
        description: "Modelo premium de LeBron: amortiguación ZoomX con bloqueo y soporte para jugadores físicos.",
        scores: {
            grip: null,
            comodidad: null,
            amortiguacion: null,
            durabilidad: null,
            estilo: null,
            rendimiento: null,
        },
        courts: { indoor: null, outdoor: null } /* sin datos de laboratorio de tracción ni de exterior */,
        weightG: 439 /* RunRepeat (The Hoops Geek: 440 g) */,
        sole: "Goma con estructura de soporte y bloqueo (sin datos de laboratorio)",
        cushion: "ZoomX de longitud completa, tipo drop-in (según Nike)",
        ankle: { label: "Bajo-medio", level: 1.5 },
        price: 210 /* USD. Lanzamiento dic-2025: $210; algunas ediciones $200-235 */,
        bestFor: "Aleros / Pívots móviles",
        pros: [
            "Mediasuela ZoomX drop-in de longitud completa",
            "Bloqueo y soporte destacados",
            "Construcción orientada a jugadores físicos",
        ],
        cons: ["Peso elevado", "Precio alto"],
        positions: null /* PENDIENTE. Sugerencia mía según bestFor: base no, escolta ok, alero yes, pivot yes */,
        badge: { text: "💎 Premium", cls: "badge-new" },
        rankTags: ["ZoomX", "Premium"],
        valueNote: "Premium: ZoomX y soporte a $210",
        outdoorNote: "Sin datos de exterior",
        fit: { fast: "Pesa unos 439 g: no es para quien busca el mínimo peso" },
        affiliate: "#",
    },
    {
        id: "aone",
        brand: "Nike",
        name: "A'One",
        releaseYear: 2025 /* debut may-2025 (primera firma de A'ja Wilson) */,
        emoji: "👟",
        image: "",
        tagline: "Amortiguación y tracción de nivel alto por poco más de $100.",
        description: "Primera firma de A'ja Wilson: soporte, amortiguación y agarre a precio medio.",
        scores: {
            grip: null,
            comodidad: null,
            amortiguacion: null,
            durabilidad: null,
            estilo: null,
            rendimiento: null,
        },
        courts: {
            indoor: null,
            outdoor: null,
        } /* RunRepeat: fricción 0.72, tracción "muy fiable"; sin datos concluyentes de exterior */,
        weightG: 366 /* RunRepeat (Perplexity no lo había encontrado). Se vende en tallas de mujer: verifica la equivalencia de talla */,
        sole: "Goma multidireccional (fricción 0.72)",
        cushion: "Cushlon 3.0 de longitud completa (109 SA talón / 85 SA antepié)",
        ankle: { label: "Bajo-medio", level: 1.5 },
        price: 115 /* USD. Lanzamiento may-2025: $110; colorways posteriores $115 */,
        bestFor: "Bases / Escoltas / Aleros",
        pros: [
            "Excelente absorción de impactos de talón a punta",
            "Tracción multidireccional fiable",
            "Peso por debajo de la media para tanta amortiguación",
            "Soporte y estabilidad (talón rígido y shank de TPU)",
        ],
        cons: [
            "Ventilación insuficiente en partidos largos",
            "Talla pequeña: pide media talla más",
            "Materiales poco premium",
        ],
        positions:
            null /* PENDIENTE. Sugerencia mía según bestFor y una review que la recomienda para aleros: base yes, escolta yes, alero yes, pivot ok */,
        badge: { text: "⭐ Valor", cls: "badge-top" },
        rankTags: ["Amortiguación", "Tracción"],
        valueNote: "Amortiguación excelente por $115",
        outdoorNote: "Sin datos concluyentes de exterior",
        fit: {
            size: "Talla pequeña: pide media talla más",
            wide: "Antepié ajustado: si tienes pie ancho, sube media talla",
        },
        affiliate: "#",
    },
];

/* ---------- Método de puntuación (una sola fuente para todas las páginas) ---------- */

const SCORE_METHOD = {
    version: "1.0",
    reviewerMinimum: 3,
    note: "Puntuaciones propias de HoopMatch, calculadas a partir de mediciones de laboratorio y del consenso de al menos tres reviews especializadas. No son notas proporcionadas por las marcas.",
    provisionalNote: "Puntuaciones en revisión: aún no tienen las fuentes mínimas verificadas.",
};

const CONFIDENCE_LABELS = { baja: "Confianza baja", media: "Confianza media", alta: "Confianza alta" };

/* true  → rendimiento = media ponderada de abajo (recomendado).
   false → se usa el rendimiento que escribas a mano en cada zapatilla. */
const AUTO_RENDIMIENTO = true;
const RENDIMIENTO_WEIGHTS = { grip: 0.28, amortiguacion: 0.24, comodidad: 0.18, durabilidad: 0.15, soporte: 0.15 };

/* Soporte/estabilidad 0-10: tu supportScore si existe; si no, se deriva del corte (ankle.level 1-3 → 6.3-8.8).
   Es una estimación: reemplázala con supportScore cuando tengas datos de las reviews. */
function supportScore(shoe) {
    if (typeof shoe.supportScore === "number") return shoe.supportScore;
    if (!shoe.ankle || typeof shoe.ankle.level !== "number") return null;
    return 5 + shoe.ankle.level * 1.25;
}

/* Rendimiento global ponderado. Devuelve null si falta algún dato (la zapatilla queda pendiente). */
function computeRendimiento(shoe) {
    if (!shoe.scores) return null;
    let total = 0;
    for (const [k, w] of Object.entries(RENDIMIENTO_WEIGHTS)) {
        const v = k === "soporte" ? supportScore(shoe) : shoe.scores[k];
        if (typeof v !== "number" || Number.isNaN(v)) return null;
        total += v * w;
    }
    return Math.round(total * 10) / 10;
}

/* Valores por defecto de trazabilidad + rendimiento calculado (antes de separar completas y pendientes) */
SHOES_ALL.forEach(s => {
    s.status = s.status ?? "provisional";
    s.confidence = s.confidence ?? "baja";
    s.sources = s.sources ?? { lab: [], playtests: [] };
    s.lastVerified = s.lastVerified ?? null;
    if (AUTO_RENDIMIENTO && s.scores) s.scores.rendimiento = computeRendimiento(s);
});

function isProvisional(shoe) {
    return shoe.status !== "verificada";
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

/* El sitio solo usa las completas; las demás quedan en espera */
const SHOES = SHOES_ALL.filter(s => missingFields(s).length === 0);
const SHOES_PENDING = SHOES_ALL.filter(s => missingFields(s).length > 0);

if (SHOES_PENDING.length && typeof console !== "undefined") {
    console.info(
        "HoopMatch · zapatillas pendientes de completar (no se muestran todavía):",
        SHOES_PENDING.map(s => `${s.name}: falta ${missingFields(s).join(", ")}`),
    );
}

const SHOES_BY_ID = Object.fromEntries(SHOES.map(s => [s.id, s]));

/* ---------- Cálculos derivados (una sola fórmula para todo el sitio) ---------- */

/* Puntuación total. Con AUTO_RENDIMIENTO es el rendimiento ponderado (grip 28%, amortiguación 24%,
   comodidad 18%, durabilidad 15%, soporte 15%). Si lo desactivas, vuelve al promedio de las 6 categorías. */
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
