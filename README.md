# NOCTIS — Electric Architecture

> A premium, minimal, single-page scrollytelling website for **NOCTIS**, a fictional electric performance vehicle brand.
> Mood: *A city in total blackout at night where the car's light is the only light in the world.*

---

## ⚡ Overview

NOCTIS is built strictly with vanilla web standards — zero frameworks, zero external JavaScript libraries, and zero build steps:
- **Core:** Pure HTML5, Vanilla CSS, Vanilla JavaScript.
- **Scrollytelling:** High-performance `<canvas>` scrubbing driven by `requestAnimationFrame` with lerp smoothing.
- **Design Philosophy:** Flat solid colors, 1px hairlines, pure photography, and typography. No gradients, no glassmorphism, no glows, and no drop shadows.

---

## 🏎️ Features

- **Hero Scrollytelling Sequence (600vh):**
  - Seamless 600-frame scroll-scrubbed canvas.
  - Telemetry HUD: Real-time velocity (`000 → 118 KM/H`), displacement (`0.0 → 4.2 KM`), and active phase (`01/04`).
  - Text chapters timed to empty sky areas.
  - Smooth 5% fade to pure black at sequence conclusion.
- **Statement Section (100vh):**
  - Viewport-progress-driven word-by-word reveal: *"Every part was designed to disappear into one line of light."*
- **Dismantle Scrollytelling Sequence (350vh):**
  - 200-frame sticky canvas breaking the vehicle into its core engineering components.
  - Interactive technical callouts fading in after 70% scroll with 1px xenon hairlines: Light, Body, Drive, Battery.
- **Model Lineup Accordion (100vh):**
  - 5-slide interactive accordion: **GT-E**, **S**, **X**, **R**, **ONE**.
  - Smooth `flex-grow` transitions, 6% horizontal slide-in entrance, and 0.06s line-by-line staggered text reveal.
  - Active exterior finish swatches and keyboard accessibility (arrow key navigation).
- **Custom Headlight Cursor:**
  - 6px xenon dot inside a 28px ring following the mouse with 0.18 lerp.
  - Morphs into a 44×2px horizontal light bar with contextual mono labels (`VIEW`, `RESERVE`, `MENU`, `OPEN`, `CONFIGURE`).
  - Mousedown bright flash feedback.
- **Dual-Tier Resolution:**
  - Desktop: 1600px wide WebP frames (Quality 78).
  - Mobile: 960px wide WebP frames (Quality 72).
  - Responsive contain-fit on portrait viewports, cover-fit on landscape viewports.
- **Film Grain & Preloader:**
  - Offscreen 128×128 procedural noise tile shifted at ~8fps (3.5% opacity).
  - Center-out expanding xenon line with 000–100 progress counter.

---

## 🛠️ Tech Stack & Design Tokens

- **Fonts:** Archivo (Display with width axis 125%), Inter (Body), JetBrains Mono (HUD/Labels).
- **Colors:**
  - `--asphalt`: `#07080A` (Background)
  - `--graphite`: `#121418`
  - `--fog`: `#8A8F98`
  - `--bone`: `#EDEAE4` (Text)
  - `--xenon`: `#CFE3FF` (Light accent)
  - `--taillight`: `#E1251B` (Tick accent)
  - `--hairline`: `rgba(237, 234, 228, 0.12)`
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)`

---

## 🚀 Running Locally

Clone the repository and serve it using any local static file server:

```bash
git clone https://github.com/prudhvi2921/bikeweb.git
cd bikeweb
```

Using Python:
```bash
python -m http.server 8080
```

Or using VS Code Live Server / Node `npx serve`. Open `http://localhost:8080/` in your browser.

---

## 📄 License

Study project. All assets and branding are fictional studies.
