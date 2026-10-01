# 🏀 HoopMatch

> Reviews de zapatillas de basketball enfocadas en **rendimiento real en cancha**.  
> Sin filtros. Sin patrocinios. Solo lo que importa en la cancha.

---

## ¿Qué es HoopMatch?

HoopMatch es una web de reviews de zapatillas de basketball con foco en rendimiento real — no solo estética. Cada modelo es evaluado en 4 métricas clave y clasificado según tipo de jugador, para que encuentres exactamente lo que necesitas según tu posición y estilo de juego.

---

## ✨ Features

- 🔍 **Reviews completas** con puntuaciones en Grip, Comodidad, Durabilidad y Estilo
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
hoopmatch/
├── index.html          # Homepage — hero, cards, ranking, VS
├── comparar.html       # Vista de comparaciones directas
├── data/
│   └── zapatillas.js   # "Base de datos" — array con todos los modelos
└── img/
    ├── kyrie-infinity.png
    ├── harden-vol-7.png
    └── ...
```

---

## 🧱 Stack

| Capa     | Tecnología                                          |
| -------- | --------------------------------------------------- |
| Frontend | HTML5 + CSS3 + JavaScript (Vanilla)                 |
| Datos    | Array de objetos JS (`data/zapatillas.js`)          |
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

## 📦 Agregar una zapatilla nueva

Abre `data/zapatillas.js` y agrega un objeto al array:

```javascript
{
  id: "nombre-modelo",           // slug único, sin espacios
  marca: "Nike",
  nombre: "Nombre del Modelo",
  precio: 130,                   // precio en USD
  imagen: "img/nombre.png",
  descripcion: "Descripción corta para la card.",
  scores: {
    grip: 9.5,
    comodidad: 8.8,
    durabilidad: 8.2,
    estilo: 9.0
  },
  jugadores: {
    base: "yes",      // "yes" | "ok" | "no"
    escolta: "yes",
    alero: "ok",
    pivot: "no"
  },
  pros: ["Pro 1", "Pro 2", "Pro 3"],
  cons: ["Con 1", "Con 2"],
  tags: ["grip", "exterior", "base"],   // para filtros
  badge: "trending",                    // "trending" | "top" | "new"
  afiliado: "https://tu-link-afiliado.com"
}
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
- [ ] `comparar.html` — vista de comparaciones
- [ ] Refactorizar cards para leer desde `data/zapatillas.js`
- [ ] Páginas individuales por zapatilla
- [ ] Comparador interactivo (selección de modelos)
- [ ] Ranking por votación de usuarios
- [ ] Filtros por posición, precio y superficie

---

## 📄 Licencia

MIT — libre para usar y modificar.

---

<p align="center">
  Hecho con 🏀 por HoopMatch
</p>
