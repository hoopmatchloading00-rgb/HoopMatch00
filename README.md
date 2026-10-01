# 🏀 HoopMatch

> Reviews de zapatillas de basketball enfocadas en **rendimiento real en cancha**.  
> Sin filtros. Sin patrocinios. Solo lo que importa en la cancha.

---

## ¿Qué es HoopMatch?

HoopMatch es una web de reviews de zapatillas de basketball con foco en rendimiento real — no solo estética. Cada modelo se puntúa en 5 categorías (grip, comodidad, amortiguación, durabilidad y estilo) más un rendimiento global calculado, y se clasifica según tipo de jugador, para que encuentres exactamente lo que necesitas según tu posición y estilo de juego.

---

## ✨ Features

- 🔍 **Reviews completas** con puntuaciones, nivel de confianza y fuentes
- 🎯 **Quiz de recomendación** (`quiz.html`): 10 preguntas → zapatillas que encajan con tu perfil
- 👤 **Sistema de tipo de jugador** — Base, Escolta, Alero, Pivot
- 🏆 **Ranking oficial** con tabs: General / Calidad-Precio / Exteriores
- ⚡ **Comparador cara a cara** entre modelos
- 🔎 **Filtros rápidos** por categoría (Mejor Grip, Exteriores, Calidad/Precio, etc.)
- 💸 **Links de afiliados** integrados en cada zapatilla
- 📱 **Responsive** — mobile + desktop
- 🎨 **Diseño urbano** estilo streetwear / basketball culture

---

## 🗂️ Estructura del proyecto

```
HoopMatch/
├── index.html        # Home: hero, cards, ranking
├── compare.html      # Comparador cara a cara
├── quiz.html         # Test de recomendación
├── css/              # styles.css (compartido) + home / compare / quiz
├── js/
│   ├── shoes.js      # ÚNICA fuente de datos + método de puntuación
│   ├── common.js     # utilidades compartidas
│   ├── home.js · compare.js · quiz.js
│   └── recommender.js  # motor del quiz
└── img/              # fotos de zapatillas
```

---

## 🧱 Stack

| Capa     | Tecnología                                          |
| -------- | --------------------------------------------------- |
| Frontend | HTML5 + CSS3 + JavaScript (Vanilla)                 |
| Datos    | Array de objetos JS (`js/shoes.js`)                 |
| Fuentes  | Google Fonts — Bebas Neue, Barlow Condensed, Barlow |
| Hosting  | Vercel / Netlify                                    |
| Backend  | ❌ No requerido                                     |

---

## 🎨 Diseño

**Paleta de colores:**

| Token     | Color     | Uso                                   |
| --------- | --------- | ------------------------------------- |
| `--neon`  | `#BF5FFF` | Botones, badges, acciones primarias   |
| `--cyan`  | `#00E5FF` | Logo, títulos, ratings, scores        |
| `--neon2` | `#FF3D00` | Sección VS, alertas, "no recomendada" |
| `--bg`    | `#07070F` | Fondo principal                       |

**Tipografía:**

- `Bebas Neue` — Títulos y headings grandes
- `Barlow Condensed` — Labels, badges, navegación
- `Barlow` — Cuerpo de texto

---

## 📊 Sistema de puntuación

Las notas son **propias de HoopMatch** (0–10, en pasos de 0.5), calculadas a partir de mediciones de laboratorio y del consenso de **al menos 3 reviews independientes**. No son notas de las marcas.

- Se escriben 5 notas: `grip`, `comodidad`, `amortiguacion`, `durabilidad`, `estilo`.
- `rendimiento` se **calcula solo**: grip 28 % · amortiguación 24 % · comodidad 18 % · durabilidad 15 % · soporte 15 % (pesos en `RENDIMIENTO_WEIGHTS`, interruptor `AUTO_RENDIMIENTO`).
- Cada zapatilla lleva `status`, `confidence`, `sources` y `lastVerified`. Sin fuentes verificadas, la web la muestra como **"En revisión · Confianza baja"**.
- Una zapatilla con `scores`, `courts`, `positions`, `price` o `weightG` sin completar (`null`) no se muestra todavía; la consola del navegador avisa qué falta.

---

## 📦 Agregar una zapatilla nueva

Abre `js/shoes.js`, copia un objeto de `SHOES_ALL` y cambia los valores. Los campos están documentados en el comentario de arriba del archivo. Para marcarla como verificada:

```javascript
status: "verificada",
confidence: "media",            // "baja" | "media" | "alta"
sources: {
  lab: ["https://…"],           // mediciones de laboratorio
  playtests: ["https://…", "https://…", "https://…"],  // ≥3 reviews independientes
},
lastVerified: "2026-10-01",
```

---

## 🚀 Correr localmente

No requiere instalación. Abre directamente en el navegador:

```bash
# Opción 1 — abrir directo
open index.html

# Opción 2 — servidor local (recomendado para evitar problemas con imports JS)
npx serve .
# o
python -m http.server 8080
```

---

## 📈 Roadmap

- [x] Homepage con hero, cards, ranking y VS
- [x] Diseño urbano con paleta morado + cian
- [x] Filtros por categoría
- [x] Modal de detalle por zapatilla
- [x] `compare.html` — comparador interactivo
- [x] Cards, ranking y quiz leen de `js/shoes.js`
- [x] `quiz.html` — test de recomendación
- [ ] Completar fuentes y verificar las notas de cada modelo
- [ ] Páginas individuales por zapatilla
- [ ] Ranking por votación de usuarios
- [ ] Filtros por posición, precio y superficie

---

## 📄 Licencia

MIT — libre para usar y modificar.

---

<p align="center">
  Hecho con 🏀 por HoopMatch
</p>
