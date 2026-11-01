/**
 * NOCTIS Configuration
 * All section heights, chapter ranges, frame counts, frame paths and callout positions.
 */

const CONFIG = {
  // Brand tokens
  brand: {
    name: "NOCTIS",
    tagline: "Drive the night.",
    year: 2026,
    fictionalNotice: "© 2026 NOCTIS. FICTIONAL AUTOMOTIVE STUDY."
  },

  // Scrollytelling Frames
  frames: {
    hero: {
      count: 600,
      desktopPath: (index) => `assets/frames/hero/frame_${String(index).padStart(4, '0')}.webp`,
      mobilePath: (index) => `assets/frames/hero-mobile/frame_${String(index).padStart(4, '0')}.webp`,
      preloadInitial: 40 // Preload first 40 frames before revealing page
    },
    dismantle: {
      count: 200,
      desktopPath: (index) => `assets/frames/dismantle/frame_${String(index).padStart(4, '0')}.webp`,
      mobilePath: (index) => `assets/frames/dismantle-mobile/frame_${String(index).padStart(4, '0')}.webp`
    }
  },

  // Section Heights
  sections: {
    heroHeightVh: 600,       // 600vh scroll container
    statementHeightVh: 100,  // 100vh
    dismantleHeightVh: 350,  // 350vh scroll container
    lineupHeightVh: 100,     // 100vh
    reserveHeightVh: 100     // 100vh
  },

  // Hero Scrollytelling Chapters
  heroChapters: [
    {
      id: "chap-1",
      start: 0.00,
      end: 0.16,
      fadeEnd: 0.18,
      type: "intro",
      title: "NOCTIS",
      subtitle: "The city is asleep.",
      hint: "SCROLL TO WAKE IT",
      align: "center"
    },
    {
      id: "chap-2",
      start: 0.22,
      end: 0.40,
      fadeEnd: 0.44,
      type: "statement",
      lines: ["It doesn't need", "the city's light."],
      align: "top-left"
    },
    {
      id: "chap-3",
      start: 0.50,
      end: 0.68,
      fadeEnd: 0.72,
      type: "statement",
      lines: ["It brings", "its own."],
      align: "top-right"
    },
    {
      id: "chap-4",
      start: 0.80,
      end: 1.00,
      type: "reveal",
      title: "GT-E",
      specs: "0–100 KM/H 3.1S · 640 KM RANGE · DUAL MOTOR",
      ctaText: "Discover the GT-E",
      ctaHref: "#lineup",
      align: "bottom-left"
    }
  ],

  // Left-Edge HUD Metrics for Hero
  hud: {
    maxSpeedKmH: 118,
    maxDistanceKm: 4.2
  },

  // Dismantle Callouts (appear sequentially between 70% and 100% progress)
  dismantleCallouts: [
    {
      id: "callout-light",
      label: "LIGHT",
      desc: "Single-line LED signature",
      trigger: 0.72,
      dotX: 74, // percentage of canvas width in landscape
      dotY: 34, // percentage of canvas height
      lineDirection: "top-right",
      labelOffsetX: 30,
      labelOffsetY: -24
    },
    {
      id: "callout-body",
      label: "BODY",
      desc: "Carbon composite monocoque",
      trigger: 0.79,
      dotX: 47,
      dotY: 28,
      lineDirection: "top-left",
      labelOffsetX: -140,
      labelOffsetY: -35
    },
    {
      id: "callout-drive",
      label: "DRIVE",
      desc: "Dual axial-flux motors, 680 kW",
      trigger: 0.86,
      dotX: 28,
      dotY: 66,
      lineDirection: "bottom-left",
      labelOffsetX: -160,
      labelOffsetY: 25
    },
    {
      id: "callout-battery",
      label: "BATTERY",
      desc: "110 kWh structural pack",
      trigger: 0.93,
      dotX: 49,
      dotY: 74,
      lineDirection: "bottom-right",
      labelOffsetX: 35,
      labelOffsetY: 25
    }
  ],

  // Lineup Models
  lineup: [
    {
      id: "gt-e",
      number: "01",
      name: "GT-E",
      subtitle: "The grand tourer.",
      specs: [
        { label: "RANGE", value: "640 KM" },
        { label: "0–100 KM/H", value: "3.1 S" },
        { label: "POWER", value: "680 KW" }
      ],
      image: "assets/cars/gt-e.webp",
      alt: "NOCTIS GT-E matte graphite electric grand tourer coupe",
      swatches: ["#121418", "#EDEAE4", "#1E2A38", "#2E1114"]
    },
    {
      id: "s",
      number: "02",
      name: "S",
      subtitle: "Four doors, no compromise.",
      specs: [
        { label: "RANGE", value: "600 KM" },
        { label: "0–100 KM/H", value: "3.6 S" },
        { label: "POWER", value: "520 KW" }
      ],
      image: "assets/cars/s.webp",
      alt: "NOCTIS S satin bone white electric sport sedan",
      swatches: ["#EDEAE4", "#121418", "#1E2A38", "#333A42"]
    },
    {
      id: "x",
      number: "03",
      name: "X",
      subtitle: "Higher, never heavier.",
      specs: [
        { label: "RANGE", value: "560 KM" },
        { label: "0–100 KM/H", value: "4.2 S" },
        { label: "POWER", value: "480 KW" }
      ],
      image: "assets/cars/x.webp",
      alt: "NOCTIS X midnight blue electric coupe SUV",
      swatches: ["#101C2E", "#121418", "#EDEAE4", "#2B323B"]
    },
    {
      id: "r",
      number: "04",
      name: "R",
      subtitle: "Built for the track.",
      specs: [
        { label: "RANGE", value: "420 KM" },
        { label: "0–100 KM/H", value: "2.4 S" },
        { label: "POWER", value: "900 KW" }
      ],
      image: "assets/cars/r.webp",
      alt: "NOCTIS R satin black electric track coupe with rear wing",
      swatches: ["#0B0C0E", "#22252A", "#E1251B", "#EDEAE4"]
    },
    {
      id: "one",
      number: "05",
      name: "ONE",
      subtitle: "The future, early.",
      specs: [
        { label: "RANGE", value: "CONCEPT" },
        { label: "0–100 KM/H", value: "CONCEPT" },
        { label: "POWER", value: "CONCEPT" }
      ],
      image: "assets/cars/one.webp",
      alt: "NOCTIS ONE liquid silver electric concept hypercar",
      swatches: ["#CFD5DD", "#121418", "#4A525D", "#EDEAE4"]
    }
  ]
};

// Expose globally
window.CONFIG = CONFIG;
