/**
 * CategoryIcon
 * Usage: <CategoryIcon name="Audio" size={24} color="currentColor" />
 * Falls back to a generic tag icon for unknown categories (unless showFallback=false).
 *
 * Export hasCategoryIcon(name) to check if a specific icon exists.
 */

const icons = {

  /* ── PARENT CATEGORIES ───────────────────────────────────────────── */

  Accessories: (
    <g>
      {/* Headset stand — arch pole */}
      <path d="M9 22 L9 9 Q9 3 12 3 Q15 3 15 9 L15 22" />
      {/* Base */}
      <rect x="5" y="21" width="14" height="2" rx="1" />
      {/* Left ear cup draped on stand */}
      <path d="M9 11 Q6 11 6 14 Q6 17 9 17" />
      {/* Right ear cup draped on stand */}
      <path d="M15 11 Q18 11 18 14 Q18 17 15 17" />
    </g>
  ),

  Audio: (
    <g>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </g>
  ),

  Cables: (
    <g>
      {/* USB-A plug body */}
      <rect x="7" y="2" width="10" height="7" rx="1" />
      {/* Pin slots */}
      <line x1="10" y1="4.5" x2="10" y2="6.5" />
      <line x1="14" y1="4.5" x2="14" y2="6.5" />
      {/* Cable down */}
      <line x1="12" y1="9" x2="12" y2="14" />
      {/* Connector end */}
      <rect x="8" y="14" width="8" height="5" rx="1" />
      {/* Plug tip */}
      <line x1="12" y1="19" x2="12" y2="22" />
    </g>
  ),

  Coolers: (
    <g>
      {/* Heatsink fins */}
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <line x1="7"  y1="6" x2="7"  y2="18" />
      <line x1="10" y1="6" x2="10" y2="18" />
      <line x1="14" y1="6" x2="14" y2="18" />
      <line x1="17" y1="6" x2="17" y2="18" />
    </g>
  ),

  CPU: (
    <g>
      <rect x="5" y="5" width="14" height="14" rx="1" />
      <rect x="8" y="8" width="8" height="8" rx="0.5" />
      {/* Top pins */}
      <line x1="9"  y1="5" x2="9"  y2="2" />
      <line x1="12" y1="5" x2="12" y2="2" />
      <line x1="15" y1="5" x2="15" y2="2" />
      {/* Bottom pins */}
      <line x1="9"  y1="19" x2="9"  y2="22" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="15" y1="19" x2="15" y2="22" />
      {/* Left pins */}
      <line x1="5" y1="9"  x2="2" y2="9"  />
      <line x1="5" y1="12" x2="2" y2="12" />
      <line x1="5" y1="15" x2="2" y2="15" />
      {/* Right pins */}
      <line x1="19" y1="9"  x2="22" y2="9"  />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="19" y1="15" x2="22" y2="15" />
    </g>
  ),

  FAN: (
    <g>
      <circle cx="12" cy="12" r="2" />
      {/* Blade 1 — top */}
      <path d="M12 10 C11 7 9 3 12 2 C15 3 13 7 12 10z" />
      {/* Blade 2 — right */}
      <path d="M14 12 C17 11 21 9 22 12 C21 15 17 13 14 12z" />
      {/* Blade 3 — bottom */}
      <path d="M12 14 C13 17 15 21 12 22 C9 21 11 17 12 14z" />
      {/* Blade 4 — left */}
      <path d="M10 12 C7 13 3 15 2 12 C3 9 7 11 10 12z" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </g>
  ),

  'Gamepad Controllers': (
    <g>
      {/* Body */}
      <path d="M6 9h12l2 7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      {/* Left grip */}
      <path d="M6 9C5 7 3 6 3 9l1 7" />
      {/* Right grip */}
      <path d="M18 9C19 7 21 6 21 9l-1 7" />
      {/* D-pad */}
      <line x1="8"  y1="13" x2="11" y2="13" />
      <line x1="9.5" y1="11.5" x2="9.5" y2="14.5" />
      {/* Buttons */}
      <circle cx="15"   cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="17"   cy="13.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15"   cy="15" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="13"   cy="13.5" r="0.8" fill="currentColor" stroke="none" />
    </g>
  ),

  'Gaming Keyboards': (
    <g>
      <rect x="2" y="6" width="20" height="13" rx="2" />
      {/* Key row 1 */}
      <rect x="4.5" y="9"  width="2" height="2" rx="0.4" />
      <rect x="8"   y="9"  width="2" height="2" rx="0.4" />
      <rect x="11.5" y="9" width="2" height="2" rx="0.4" />
      <rect x="15"  y="9"  width="2" height="2" rx="0.4" />
      <rect x="18.5" y="9" width="1" height="2" rx="0.4" />
      {/* Key row 2 */}
      <rect x="4.5" y="12.5" width="2" height="2" rx="0.4" />
      <rect x="8"   y="12.5" width="2" height="2" rx="0.4" />
      {/* Spacebar */}
      <rect x="10.5" y="12.5" width="6" height="2" rx="0.4" />
      <rect x="18"  y="12.5" width="1.5" height="2" rx="0.4" />
    </g>
  ),

  'Gaming Mouse': (
    <g>
      {/* Body */}
      <path d="M12 2a6 6 0 0 0-6 6v8a6 6 0 0 0 12 0V8a6 6 0 0 0-6-6z" />
      {/* Centre line */}
      <line x1="12" y1="2" x2="12" y2="10" />
      {/* Scroll wheel */}
      <rect x="11" y="6" width="2" height="3" rx="1" />
    </g>
  ),

  'Graphics Cards': (
    <g>
      {/* PCB board */}
      <rect x="2" y="7" width="17" height="10" rx="1" />
      {/* Fan circle */}
      <circle cx="8" cy="12" r="3" />
      <line x1="8" y1="9"  x2="8"  y2="15" />
      <line x1="5" y1="12" x2="11" y2="12" />
      {/* Heatsink lines */}
      <line x1="14" y1="9"  x2="14" y2="15" />
      <line x1="16" y1="9"  x2="16" y2="15" />
      {/* PCIe connector at bottom */}
      <rect x="5" y="17" width="9" height="3" rx="0.5" />
      {/* Display outputs */}
      <rect x="19" y="9"  width="3" height="2" rx="0.5" />
      <rect x="19" y="12" width="3" height="2" rx="0.5" />
    </g>
  ),

  Monitors: (
    <g>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8"  y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      {/* Screen content hint */}
      <rect x="5" y="6" width="14" height="8" rx="1" />
    </g>
  ),

  Routers: (
    <g>
      {/* Box body */}
      <rect x="3" y="13" width="18" height="7" rx="2" />
      {/* LED dots */}
      <circle cx="7"  cy="16.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="16.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="16.5" r="1" fill="currentColor" stroke="none" />
      {/* Antennas */}
      <line x1="8"  y1="13" x2="6"  y2="7" />
      <line x1="16" y1="13" x2="18" y2="7" />
      {/* Wifi arcs */}
      <path d="M9.5 10.5a3.5 3.5 0 0 1 5 0" />
      <path d="M7.5 8.5a6.5 6.5 0 0 1 9 0" />
    </g>
  ),

  Storage: (
    <g>
      {/* HDD body */}
      <rect x="2" y="6" width="20" height="13" rx="2" />
      {/* Platter circle */}
      <circle cx="12" cy="12.5" r="4" />
      <circle cx="12" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
      {/* Read arm */}
      <line x1="15" y1="9.5" x2="12" y2="12.5" />
      {/* Screw dots */}
      <circle cx="4.5"  cy="8"    r="0.6" fill="currentColor" stroke="none" />
      <circle cx="19.5" cy="8"    r="0.6" fill="currentColor" stroke="none" />
      <circle cx="4.5"  cy="17.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="19.5" cy="17.5" r="0.6" fill="currentColor" stroke="none" />
    </g>
  ),

  'Wifi Card': (
    <g>
      {/* PCIe card body */}
      <rect x="2" y="10" width="14" height="10" rx="1" />
      {/* PCIe gold connector */}
      <rect x="4" y="18" width="10" height="2.5" rx="0.4" />
      {/* Bracket */}
      <path d="M16 11h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-3" />
      {/* Wifi signal (emanates from card top) */}
      <circle cx="9" cy="9"  r="1.2" fill="currentColor" stroke="none" />
      <path d="M5.5 7a5 5 0 0 1 7 0" />
      <path d="M3.5 5a8 8 0 0 1 11 0" />
    </g>
  ),

  /* ── SUB-CATEGORIES: AUDIO ───────────────────────────────────────── */

  Headphones: (
    <g>
      {/* Headband arc */}
      <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
      {/* Left ear cup */}
      <rect x="2" y="13" width="4" height="6" rx="2" />
      {/* Right ear cup */}
      <rect x="18" y="13" width="4" height="6" rx="2" />
    </g>
  ),

  'Wired earbuds': (
    <g>
      {/* Left bud */}
      <circle cx="7" cy="9" r="2.5" />
      <circle cx="7" cy="9" r="1" fill="currentColor" stroke="none" />
      {/* Right bud */}
      <circle cx="17" cy="9" r="2.5" />
      <circle cx="17" cy="9" r="1" fill="currentColor" stroke="none" />
      {/* Cable Y-split */}
      <path d="M7 11.5 Q7 15 12 15 Q17 15 17 11.5" />
      {/* Cable to device */}
      <line x1="12" y1="15" x2="12" y2="22" />
    </g>
  ),

  'Wired headset': (
    <g>
      {/* Headband */}
      <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
      {/* Ear cups */}
      <rect x="2" y="13" width="4" height="5" rx="2" />
      <rect x="18" y="13" width="4" height="5" rx="2" />
      {/* Mic boom from left cup */}
      <path d="M4 16 Q2 20 5 21" />
      {/* Mic capsule */}
      <rect x="4" y="20" width="4" height="2.5" rx="1" />
    </g>
  ),

  /* ── SUB-CATEGORIES: CABLES ──────────────────────────────────────── */

  'Display Port': (
    <g>
      {/* DP connector body — rectangle with angled right side */}
      <path d="M2 7h16l4 3.5v5H2V7z" />
      {/* Pin slots */}
      <line x1="5"  y1="10" x2="5"  y2="13" />
      <line x1="8"  y1="10" x2="8"  y2="13" />
      <line x1="11" y1="10" x2="11" y2="13" />
      <line x1="14" y1="10" x2="14" y2="13" />
      {/* Cable */}
      <line x1="12" y1="15.5" x2="12" y2="22" />
    </g>
  ),

  HDMI: (
    <g>
      {/* HDMI trapezoidal body — wide top, angled lower corners */}
      <path d="M3 6h18v9l-2.5 3H5.5L3 15V6z" />
      {/* Pin slots */}
      <line x1="6"  y1="9" x2="6"  y2="13" />
      <line x1="9"  y1="9" x2="9"  y2="13" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="15" y1="9" x2="15" y2="13" />
      <line x1="18" y1="9" x2="18" y2="13" />
      {/* Cable */}
      <line x1="12" y1="18" x2="12" y2="22" />
    </g>
  ),

  'Power Cable': (
    <g>
      {/* Prongs */}
      <line x1="10" y1="2" x2="10" y2="6" />
      <line x1="14" y1="2" x2="14" y2="6" />
      {/* Plug body */}
      <path d="M8 6h8v4a4 4 0 0 1-8 0V6z" />
      {/* Cable */}
      <line x1="12" y1="14" x2="12" y2="22" />
    </g>
  ),

  'Type C to C': (
    <g>
      {/* Top USB-C connector */}
      <rect x="8" y="2" width="8" height="5" rx="2.5" />
      <line x1="11" y1="3.5" x2="11" y2="5.5" />
      <line x1="13" y1="3.5" x2="13" y2="5.5" />
      {/* Cable */}
      <line x1="12" y1="7" x2="12" y2="17" />
      {/* Bottom USB-C connector (flipped) */}
      <rect x="8" y="17" width="8" height="5" rx="2.5" />
      <line x1="11" y1="18.5" x2="11" y2="20.5" />
      <line x1="13" y1="18.5" x2="13" y2="20.5" />
    </g>
  ),

  /* ── SUB-CATEGORIES: COOLERS ─────────────────────────────────────── */

  'AIO coolers': (
    <g>
      {/* Radiator block */}
      <rect x="2" y="2" width="20" height="9" rx="1" />
      {/* Radiator fins */}
      <line x1="6"  y1="2" x2="6"  y2="11" />
      <line x1="10" y1="2" x2="10" y2="11" />
      <line x1="14" y1="2" x2="14" y2="11" />
      <line x1="18" y1="2" x2="18" y2="11" />
      {/* Coolant tubes */}
      <path d="M5 11 Q4 16 8 17" />
      <path d="M19 11 Q20 16 16 17" />
      {/* Pump head */}
      <rect x="8" y="17" width="8" height="5" rx="2" />
      <circle cx="12" cy="19.5" r="1.5" />
    </g>
  ),

  'Air Coolers': (
    <g>
      {/* Tower heatsink body */}
      <rect x="4" y="3" width="16" height="15" rx="1" />
      {/* Fins */}
      <line x1="7"  y1="3" x2="7"  y2="18" />
      <line x1="10" y1="3" x2="10" y2="18" />
      <line x1="14" y1="3" x2="14" y2="18" />
      <line x1="17" y1="3" x2="17" y2="18" />
      {/* Mounting base */}
      <rect x="6" y="18" width="12" height="3" rx="0.5" />
      {/* Fan circle on front face */}
      <circle cx="12" cy="10.5" r="3.5" />
      <line x1="12" y1="7"  x2="12" y2="14" />
      <line x1="8.5" y1="10.5" x2="15.5" y2="10.5" />
    </g>
  ),

  /* ── SUB-CATEGORIES: GAMEPAD CONTROLLERS ────────────────────────── */

  'RGB Controllers': (
    <g>
      {/* Hub box */}
      <rect x="3" y="10" width="18" height="9" rx="2" />
      {/* Channel ports on top */}
      <rect x="5.5" y="7"  width="3" height="3.5" rx="0.5" />
      <rect x="10.5" y="7" width="3" height="3.5" rx="0.5" />
      <rect x="15.5" y="7" width="3" height="3.5" rx="0.5" />
      {/* RGB LED dots */}
      <circle cx="7"    cy="15" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12"   cy="15" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17"   cy="15" r="1.3" fill="currentColor" stroke="none" />
      {/* Glow rays above each dot */}
      <line x1="7"   y1="13.5" x2="7"   y2="12" />
      <line x1="12"  y1="13.5" x2="12"  y2="12" />
      <line x1="17"  y1="13.5" x2="17"  y2="12" />
    </g>
  ),

  'Mobile gamepad controllers': (
    <g>
      {/* Phone body */}
      <rect x="9" y="5" width="6" height="11" rx="1" />
      {/* Left grip arm */}
      <path d="M9 8 H4 Q3 8 3 9 V13 Q3 14 4 14 H9" />
      {/* Right grip arm */}
      <path d="M15 8 H20 Q21 8 21 9 V13 Q21 14 20 14 H15" />
      {/* D-pad left */}
      <line x1="4.5" y1="11.5" x2="7"   y2="11.5" />
      <line x1="5.8" y1="10"   x2="5.8" y2="13" />
      {/* Buttons right */}
      <circle cx="17.5" cy="10.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="19"   cy="11.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="12.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="16"   cy="11.5" r="0.7" fill="currentColor" stroke="none" />
      {/* Phone home bar */}
      <line x1="11" y1="15" x2="13" y2="15" />
    </g>
  ),

  'Wired gamepad controller': (
    <g>
      {/* Body */}
      <path d="M6 10h12l2 6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      {/* Grips */}
      <path d="M6 10C5 8 3.5 7 3.5 10l1 6" />
      <path d="M18 10C19 8 20.5 7 20.5 10l-1 6" />
      {/* USB cable from top */}
      <line x1="12" y1="10" x2="12" y2="5" />
      <rect x="10" y="3" width="4" height="2.5" rx="0.5" />
      {/* D-pad */}
      <line x1="8"  y1="14" x2="11" y2="14" />
      <line x1="9.5" y1="12.5" x2="9.5" y2="15.5" />
      {/* Buttons */}
      <circle cx="15"   cy="13" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="14.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="15"   cy="16" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="14.5" r="0.7" fill="currentColor" stroke="none" />
    </g>
  ),

  'Wireless gamepad controllers': (
    <g>
      {/* Body — shifted down to make room for signal */}
      <path d="M6 12h12l2 6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M6 12C5 10 3.5 9 3.5 12l1 6" />
      <path d="M18 12C19 10 20.5 9 20.5 12l-1 6" />
      {/* Wireless signal arcs */}
      <circle cx="12" cy="9" r="1" fill="currentColor" stroke="none" />
      <path d="M9.5 7.5a3.5 3.5 0 0 1 5 0" />
      <path d="M7.5 5.5a6.5 6.5 0 0 1 9 0" />
      {/* D-pad */}
      <line x1="8"  y1="16" x2="11" y2="16" />
      <line x1="9.5" y1="14.5" x2="9.5" y2="17.5" />
      {/* Buttons */}
      <circle cx="15"   cy="15" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="16.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="15"   cy="18" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="16.5" r="0.7" fill="currentColor" stroke="none" />
    </g>
  ),

  /* ── SUB-CATEGORIES: KEYBOARDS ───────────────────────────────────── */

  'Wired keyboards': (
    <g>
      <rect x="2" y="8" width="20" height="11" rx="2" />
      {/* Key row */}
      <rect x="4.5" y="11"  width="2"   height="2" rx="0.4" />
      <rect x="8"   y="11"  width="2"   height="2" rx="0.4" />
      <rect x="11.5" y="11" width="2"   height="2" rx="0.4" />
      <rect x="15"  y="11"  width="2"   height="2" rx="0.4" />
      <rect x="18.5" y="11" width="1"   height="2" rx="0.4" />
      {/* Spacebar */}
      <rect x="6"   y="14.5" width="10" height="2" rx="0.4" />
      {/* USB cable from top */}
      <line x1="12" y1="8" x2="12" y2="4" />
      <rect x="10" y="2" width="4" height="2.5" rx="0.5" />
    </g>
  ),

  'Wireless Keyboards': (
    <g>
      <rect x="2" y="9" width="20" height="11" rx="2" />
      {/* Key row */}
      <rect x="4.5" y="12"  width="2"   height="2" rx="0.4" />
      <rect x="8"   y="12"  width="2"   height="2" rx="0.4" />
      <rect x="11.5" y="12" width="2"   height="2" rx="0.4" />
      <rect x="15"  y="12"  width="2"   height="2" rx="0.4" />
      {/* Spacebar */}
      <rect x="6"   y="15.5" width="10" height="2" rx="0.4" />
      {/* Wireless signal above */}
      <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
      <path d="M9.5 5a4 4 0 0 1 5 0" />
      <path d="M7.5 3a7 7 0 0 1 9 0" />
    </g>
  ),

  /* ── SUB-CATEGORIES: MOUSE ───────────────────────────────────────── */

  'Wired Mouse': (
    <g>
      {/* Body */}
      <path d="M12 6a5 5 0 0 0-5 5v5a5 5 0 0 0 10 0v-5a5 5 0 0 0-5-5z" />
      {/* Centre line */}
      <line x1="12" y1="6"  x2="12" y2="13" />
      {/* Scroll wheel */}
      <rect x="11" y="9" width="2" height="3" rx="1" />
      {/* Cable from top */}
      <path d="M12 6 Q12 3 15 3" />
      <line x1="15" y1="3" x2="18" y2="3" />
    </g>
  ),

  'Wireless Mouse': (
    <g>
      {/* Body */}
      <path d="M12 6a5 5 0 0 0-5 5v5a5 5 0 0 0 10 0v-5a5 5 0 0 0-5-5z" />
      {/* Centre line */}
      <line x1="12" y1="6"  x2="12" y2="13" />
      {/* Scroll wheel */}
      <rect x="11" y="9" width="2" height="3" rx="1" />
      {/* Wireless signal top-right */}
      <path d="M15.5 6a3 3 0 0 1 0 4.5" />
      <path d="M17.5 4.5a5.5 5.5 0 0 1 0 7.5" />
    </g>
  ),

  /* ── SUB-CATEGORIES: ROUTERS / WIFI ──────────────────────────────── */

  'Premium Routers': (
    <g>
      {/* Box — slightly taller for premium feel */}
      <rect x="2" y="14" width="20" height="7" rx="2" />
      {/* 4 LED dots */}
      <circle cx="6"  cy="17.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9"  cy="17.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
      {/* 3 antennas (premium = tri-band) */}
      <line x1="7"  y1="14" x2="5"  y2="7" />
      <line x1="12" y1="14" x2="12" y2="6" />
      <line x1="17" y1="14" x2="19" y2="7" />
      {/* Wifi arcs */}
      <path d="M9.5 11a3.5 3.5 0 0 1 5 0" />
      <path d="M7.5 9a6.5 6.5 0 0 1 9 0" />
    </g>
  ),

  'Wifi antenna': (
    <g>
      {/* Pole */}
      <line x1="12" y1="22" x2="12" y2="11" />
      {/* Base */}
      <rect x="8" y="20" width="8" height="2.5" rx="1" />
      {/* Tip dot */}
      <circle cx="12" cy="10" r="1.2" fill="currentColor" stroke="none" />
      {/* Signal arcs from tip */}
      <path d="M8.5 8a5 5 0 0 1 7 0" />
      <path d="M6 5.5a8.5 8.5 0 0 1 12 0" />
    </g>
  ),

  'Wifi cards': (
    <g>
      {/* PCIe card body */}
      <rect x="3" y="8" width="14" height="10" rx="1" />
      {/* Gold PCIe connector */}
      <rect x="5" y="16" width="10" height="3" rx="0.4" />
      {/* Bracket slot on right */}
      <path d="M17 9h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2" />
      {/* Wifi chip dot + arcs */}
      <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <path d="M6.5 10a3.5 3.5 0 0 1 5 0" />
      <path d="M4.5 8a6.5 6.5 0 0 1 9 0" />
    </g>
  ),

  'Wifi PCIe adapters': (
    <g>
      {/* Horizontal PCIe card */}
      <rect x="2" y="7" width="17" height="9" rx="1" />
      {/* PCIe connector with gold fingers */}
      <rect x="3" y="15" width="15" height="3.5" rx="0.4" />
      <line x1="5"  y1="15" x2="5"  y2="18.5" />
      <line x1="7"  y1="15" x2="7"  y2="18.5" />
      <line x1="9"  y1="15" x2="9"  y2="18.5" />
      <line x1="11" y1="15" x2="11" y2="18.5" />
      <line x1="13" y1="15" x2="13" y2="18.5" />
      <line x1="15" y1="15" x2="15" y2="18.5" />
      {/* I/O bracket */}
      <path d="M19 8h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2" />
      {/* Wifi chip on board */}
      <rect x="4" y="9" width="5" height="4" rx="0.5" />
      <circle cx="6.5" cy="11" r="1" fill="currentColor" stroke="none" />
    </g>
  ),

  /* ── SUB-CATEGORIES: FANS ────────────────────────────────────────── */

  'RGB Fans': (
    <g>
      {/* Fan blades */}
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10 C11 7 9 3 12 2 C15 3 13 7 12 10z" />
      <path d="M14 12 C17 11 21 9 22 12 C21 15 17 13 14 12z" />
      <path d="M12 14 C13 17 15 21 12 22 C9 21 11 17 12 14z" />
      <path d="M10 12 C7 13 3 15 2 12 C3 9 7 11 10 12z" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      {/* Outer RGB ring (dashed = illuminated frame) */}
      <circle cx="12" cy="12" r="9" strokeDasharray="3 2" />
    </g>
  ),

  /* ── SUB-CATEGORIES: CPU ─────────────────────────────────────────── */

  AMD: (
    <g>
      {/* Chip body */}
      <rect x="4" y="4" width="16" height="16" rx="1" />
      {/* AMD "A" arrow motif */}
      <path d="M8 16 L12 8 L16 16" />
      <line x1="10.5" y1="13" x2="13.5" y2="13" />
      {/* Pins */}
      <line x1="9"  y1="4" x2="9"  y2="2" />
      <line x1="15" y1="4" x2="15" y2="2" />
      <line x1="9"  y1="20" x2="9"  y2="22" />
      <line x1="15" y1="20" x2="15" y2="22" />
      <line x1="4"  y1="9"  x2="2"  y2="9"  />
      <line x1="4"  y1="15" x2="2"  y2="15" />
      <line x1="20" y1="9"  x2="22" y2="9"  />
      <line x1="20" y1="15" x2="22" y2="15" />
    </g>
  ),

  Intel: (
    <g>
      {/* Chip body */}
      <rect x="4" y="4" width="16" height="16" rx="1" />
      {/* "i" motif */}
      <circle cx="12" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="10" y1="11" x2="14" y2="11" />
      <line x1="10" y1="17" x2="14" y2="17" />
      {/* Pins */}
      <line x1="9"  y1="4" x2="9"  y2="2" />
      <line x1="15" y1="4" x2="15" y2="2" />
      <line x1="9"  y1="20" x2="9"  y2="22" />
      <line x1="15" y1="20" x2="15" y2="22" />
      <line x1="4"  y1="9"  x2="2"  y2="9"  />
      <line x1="4"  y1="15" x2="2"  y2="15" />
      <line x1="20" y1="9"  x2="22" y2="9"  />
      <line x1="20" y1="15" x2="22" y2="15" />
    </g>
  ),

};

// Generic fallback icon (tag)
const FallbackIcon = (
  <g>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none" />
  </g>
);

/** Returns true if a hand-crafted icon exists for this category name */
export function hasCategoryIcon(name) {
  return Object.prototype.hasOwnProperty.call(icons, name);
}

export default function CategoryIcon({ name = '', size = 24, color = 'currentColor', style = {}, showFallback = true }) {
  const content = icons[name] ?? (showFallback ? FallbackIcon : null);
  if (!content) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {content}
    </svg>
  );
}
