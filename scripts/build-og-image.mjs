/**
 * Generate the Open Graph share card.
 *
 * Every link someone texts or posts to r/DelawareBeaches renders as a card,
 * and without an image that card is a gray box — which is a real cost when
 * word of mouth is the entire distribution plan.
 *
 * One static card rather than per-page images: per-page cards need a rendering
 * service or a headless browser in CI, and the marginal gain over a strong
 * branded card is small. The page title sits next to the image in every unfurl
 * anyway.
 *
 * Run: node scripts/build-og-image.mjs  (or npm run og)
 * Output: public/og.png, 1200×630.
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const W = 1200;
const H = 630;

const C = {
  abyss: "#0C2A27",
  marsh: "#14453D",
  tide: "#1D6E64",
  surf: "#6FB3A8",
  sand: "#F0E4CE",
  shell: "#FBF5E9",
  ochre: "#D99441",
  red: "#C0392B",
};

/* Wave chop, same broken-rule treatment as the site's poster band. */
const chop = [
  [40, 470, 150], [230, 470, 80], [400, 470, 190], [640, 470, 90],
  [790, 470, 210], [1040, 470, 130],
  [0, 496, 110], [170, 496, 200], [420, 496, 80], [560, 496, 230],
  [850, 496, 120], [1020, 496, 160],
]
  .map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="4" fill="${C.surf}" opacity="0.7"/>`)
  .join("");

/* Snow fence along the dune line — the most recognisable object on this coast. */
const fence = Array.from({ length: 42 }, (_, i) => {
  const x = 10 + i * 30;
  return `<line x1="${x}" y1="516" x2="${x + 5}" y2="556" stroke="${C.marsh}" stroke-width="4" stroke-linecap="round"/>`;
}).join("");

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.abyss}"/>

  <!-- Sky bands -->
  <rect y="330" width="${W}" height="70" fill="${C.marsh}"/>
  <rect y="400" width="${W}" height="34" fill="${C.tide}"/>
  <circle cx="1010" cy="150" r="66" fill="${C.ochre}"/>
  <rect y="96" width="${W}" height="3" fill="${C.tide}" opacity="0.5"/>
  <rect y="107" width="${W}" height="2" fill="${C.tide}" opacity="0.3"/>

  <!-- Bay, then sand -->
  <rect y="434" width="${W}" height="86" fill="${C.marsh}"/>
  ${chop}
  <rect y="520" width="${W}" height="20" fill="${C.tide}"/>
  <rect y="540" width="${W}" height="90" fill="${C.sand}"/>
  ${fence}

  <!-- Registration rules, top and bottom -->
  <rect width="${W}" height="10" fill="${C.ochre}"/>
  <rect y="10" width="${W}" height="5" fill="${C.tide}"/>

  <!-- Mark: horseshoe crab in a diamond -->
  <g transform="translate(72,58) scale(1.55)">
    <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="${C.marsh}"/>
    <path d="M50 5 L95 50 L50 95 L5 50 Z" fill="${C.ochre}"/>
    <clipPath id="dia"><path d="M50 9 L91 50 L50 91 L9 50 Z"/></clipPath>
    <g clip-path="url(#dia)">
      <rect width="100" height="100" fill="${C.abyss}"/>
      <rect y="67" width="100" height="33" fill="${C.tide}"/>
      <path d="M50 24 C67 24 78 36 78 50 L77 54 L67 54 L70 57 L65 58 L68 62 L63 63
               L65 67 L59 68 L57 72 L51 74 L50.8 88 L49.2 88 L49 74 L43 72
               L41 68 L35 67 L37 63 L32 62 L35 58 L30 57 L33 54 L23 54 L22 50
               C22 36 33 24 50 24 Z" fill="${C.sand}"/>
      <path d="M50 31v20" stroke="${C.abyss}" stroke-width="2.2" opacity="0.5" fill="none" stroke-linecap="round"/>
      <path d="M40 37l-3 13" stroke="${C.abyss}" stroke-width="1.7" opacity="0.32" fill="none" stroke-linecap="round"/>
      <path d="M60 37l3 13" stroke="${C.abyss}" stroke-width="1.7" opacity="0.32" fill="none" stroke-linecap="round"/>
    </g>
  </g>

  <text x="262" y="132" font-family="Zilla Slab, Georgia, serif" font-size="40" font-weight="700"
        fill="${C.shell}" letter-spacing="-0.5">Delaware Field Guide</text>
  <text x="262" y="172" font-family="IBM Plex Mono, monospace" font-size="20" font-weight="500"
        fill="${C.surf}" letter-spacing="2.4">CHECKED AND DATED</text>

  <text x="72" y="272" font-family="Zilla Slab, Georgia, serif" font-size="66" font-weight="700"
        fill="${C.shell}" letter-spacing="-1.8">Where your dog is legal</text>
  <text x="72" y="344" font-family="Zilla Slab, Georgia, serif" font-size="66" font-weight="700"
        fill="${C.ochre}" letter-spacing="-1.8">on the Delaware coast</text>

  <!-- Walker and dog on the sand, same geometry as the site -->
  <g fill="${C.abyss}" transform="translate(820,472) scale(1.15)">
    <circle cx="30" cy="30" r="11"/>
    <rect x="21" y="42" width="19" height="36" rx="9"/>
    <rect x="21" y="74" width="7" height="30" rx="3.5" transform="rotate(10 24 74)"/>
    <rect x="33" y="74" width="7" height="30" rx="3.5" transform="rotate(-12 36 74)"/>
    <rect x="38" y="48" width="30" height="6" rx="3" transform="rotate(18 38 48)"/>
    <path d="M68 58q20 8 38 15" stroke="${C.abyss}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M112 76c-8-1-13-6-14-14" stroke="${C.abyss}" stroke-width="6" stroke-linecap="round" fill="none"/>
    <rect x="108" y="74" width="46" height="19" rx="9.5"/>
    <rect x="113" y="86" width="7" height="24" rx="3.5" transform="rotate(20 116 86)"/>
    <rect x="126" y="86" width="7" height="22" rx="3.5" transform="rotate(-16 129 86)"/>
    <rect x="140" y="86" width="7" height="24" rx="3.5" transform="rotate(18 143 86)"/>
    <circle cx="163" cy="69" r="11"/>
    <rect x="167" y="67" width="18" height="8.5" rx="4.25"/>
    <path d="M153 59l12-4-4 13z"/>
    <rect x="151" y="71" width="5.5" height="15" rx="2" fill="${C.ochre}"/>
  </g>

  <rect y="${H - 15}" width="${W}" height="5" fill="${C.tide}"/>
  <rect y="${H - 10}" width="${W}" height="10" fill="${C.ochre}"/>
</svg>`;

const out = "public/og.png";
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
console.log(`  ✓ ${out} — ${W}×${H}`);
