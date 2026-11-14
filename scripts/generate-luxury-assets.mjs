import sharp from "sharp";
import fs from "fs";
import path from "path";

const PUBLIC = path.join(process.cwd(), "public");
const SEED = path.join(PUBLIC, "seed");

// 1. Delete public/icon.svg if it exists
const svgPath = path.join(PUBLIC, "icon.svg");
if (fs.existsSync(svgPath)) {
  fs.unlinkSync(svgPath);
  console.log("Deleted public/icon.svg successfully.");
}

// 2. Generate 512x512 Luxury Crest Icon (PNG)
const crestSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#24133A"/>
      <stop offset="55%" stop-color="#140924"/>
      <stop offset="100%" stop-color="#090410"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE8A3"/>
      <stop offset="25%" stop-color="#E2BA64"/>
      <stop offset="50%" stop-color="#BE8E37"/>
      <stop offset="75%" stop-color="#F7DF88"/>
      <stop offset="100%" stop-color="#9E6E20"/>
    </linearGradient>
    <linearGradient id="goldSoft" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#A87928"/>
      <stop offset="50%" stop-color="#F2D785"/>
      <stop offset="100%" stop-color="#CF9E40"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background rounded canvas -->
  <rect width="512" height="512" rx="104" fill="url(#bg)"/>
  
  <!-- Outer subtle gold border -->
  <rect x="18" y="18" width="476" height="476" rx="90" fill="none" stroke="url(#gold)" stroke-width="1.8" opacity="0.6"/>
  <rect x="28" y="28" width="456" height="456" rx="82" fill="none" stroke="url(#goldSoft)" stroke-width="0.8" stroke-dasharray="6,4" opacity="0.4"/>

  <!-- Corner Ornamental Accents -->
  <g stroke="url(#gold)" stroke-width="1.2" fill="none" opacity="0.75">
    <path d="M 52 74 L 74 74 L 74 52"/>
    <circle cx="74" cy="74" r="2" fill="url(#gold)"/>
    <path d="M 460 74 L 438 74 L 438 52"/>
    <circle cx="438" cy="74" r="2" fill="url(#gold)"/>
    <path d="M 52 438 L 74 438 L 74 460"/>
    <circle cx="74" cy="438" r="2" fill="url(#gold)"/>
    <path d="M 460 438 L 438 438 L 438 460"/>
    <circle cx="438" cy="438" r="2" fill="url(#gold)"/>
  </g>

  <!-- Central Double Circular Frame -->
  <circle cx="256" cy="246" r="176" fill="none" stroke="url(#gold)" stroke-width="2.2" opacity="0.85"/>
  <circle cx="256" cy="246" r="166" fill="none" stroke="url(#goldSoft)" stroke-width="1" stroke-dasharray="4,5" opacity="0.6"/>

  <!-- Ornate Crown / Coronet Top Motif -->
  <g transform="translate(256, 122)" filter="url(#glow)">
    <!-- Crown base -->
    <path d="M -36 18 Q 0 14 36 18 L 30 24 Q 0 20 -30 24 Z" fill="url(#gold)"/>
    <!-- Crown spires & pearls -->
    <path d="M -32 16 L -38 -2 L -20 8 L 0 -12 L 20 8 L 38 -2 L 32 16 Q 0 10 -32 16 Z" fill="url(#gold)"/>
    <circle cx="0" cy="-16" r="3.5" fill="#FFE8A3"/>
    <circle cx="-38" cy="-5" r="2.8" fill="#FFE8A3"/>
    <circle cx="38" cy="-5" r="2.8" fill="#FFE8A3"/>
    <circle cx="-20" cy="5" r="2" fill="#FFE8A3"/>
    <circle cx="20" cy="5" r="2" fill="#FFE8A3"/>
  </g>

  <!-- Central Monogram: S & B in Royal Serif -->
  <!-- Back letter B -->
  <text x="278" y="286" font-family="'Cinzel', 'Playfair Display', 'Cormorant Garamond', 'Georgia', serif" font-size="160" font-weight="700" fill="url(#goldSoft)" text-anchor="middle" opacity="0.75" letter-spacing="-4">B</text>
  <!-- Front letter S with gold gradient -->
  <text x="234" y="278" font-family="'Cinzel', 'Playfair Display', 'Cormorant Garamond', 'Georgia', serif" font-size="172" font-weight="700" fill="url(#gold)" text-anchor="middle" letter-spacing="-4">S</text>

  <!-- Sparkles / Stars -->
  <g fill="url(#gold)">
    <!-- Left star -->
    <path d="M 125 246 Q 133 246 133 238 Q 133 246 141 246 Q 133 246 133 254 Q 133 246 125 246 Z"/>
    <!-- Right star -->
    <path d="M 371 246 Q 379 246 379 238 Q 379 246 387 246 Q 379 246 379 254 Q 379 246 371 246 Z"/>
    <circle cx="133" cy="246" r="1.5" fill="#FFF"/>
    <circle cx="379" cy="246" r="1.5" fill="#FFF"/>
  </g>

  <!-- Ribbon / Arch Banner for "SKY BOUTIQUE" -->
  <g transform="translate(0, 50)">
    <path d="M 130 316 Q 256 332 382 316 L 396 348 Q 256 366 116 348 Z" fill="#180C26" stroke="url(#gold)" stroke-width="1.2"/>
    <text x="256" y="340" font-family="'Cinzel', 'Playfair Display', 'Georgia', serif" font-size="17" font-weight="600" fill="url(#gold)" text-anchor="middle" letter-spacing="6">SKY BOUTIQUE</text>
  </g>

  <!-- Subtitle -->
  <text x="256" y="440" font-family="'Montserrat', 'Inter', sans-serif" font-size="10.5" font-weight="500" fill="#E2BA64" text-anchor="middle" letter-spacing="7" opacity="0.85">HAUTE COUTURE · EST. 2026</text>
  <circle cx="256" cy="458" r="2" fill="url(#gold)" opacity="0.6"/>
</svg>
`;

// 3. Generate Horizontal Brand Logo SVG (800x200 PNG)
const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200" viewBox="0 0 800 200">
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE8A3"/>
      <stop offset="30%" stop-color="#E2BA64"/>
      <stop offset="70%" stop-color="#BE8E37"/>
      <stop offset="100%" stop-color="#F7DF88"/>
    </linearGradient>
    <radialGradient id="crestBg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#24133A"/>
      <stop offset="100%" stop-color="#090410"/>
    </radialGradient>
  </defs>

  <!-- Left Icon Emblem (size ~ 140x140) -->
  <g transform="translate(40, 30)">
    <rect width="140" height="140" rx="34" fill="url(#crestBg)" stroke="url(#gold)" stroke-width="1.5"/>
    <circle cx="70" cy="70" r="54" fill="none" stroke="url(#gold)" stroke-width="1" stroke-dasharray="3,3" opacity="0.6"/>
    <!-- Crown -->
    <path d="M 52 44 L 50 34 L 60 38 L 70 28 L 80 38 L 90 34 L 88 44 Z" fill="url(#gold)"/>
    <circle cx="70" cy="26" r="2" fill="#FFE8A3"/>
    <!-- Monogram -->
    <text x="78" y="88" font-family="'Cinzel', 'Playfair Display', serif" font-size="52" font-weight="700" fill="url(#gold)" text-anchor="middle" opacity="0.6">B</text>
    <text x="62" y="85" font-family="'Cinzel', 'Playfair Display', serif" font-size="56" font-weight="700" fill="url(#gold)" text-anchor="middle">S</text>
    <text x="70" y="118" font-family="'Cinzel', 'Playfair Display', serif" font-size="7" font-weight="600" fill="url(#gold)" text-anchor="middle" letter-spacing="2">EST. 2026</text>
  </g>

  <!-- Right Typography -->
  <g transform="translate(210, 0)">
    <text x="0" y="98" font-family="'Cinzel', 'Playfair Display', 'Cormorant Garamond', 'Georgia', serif" font-size="58" font-weight="600" fill="url(#gold)" letter-spacing="14">SKY BOUTIQUE</text>
    <line x1="2" y1="116" x2="520" y2="116" stroke="url(#gold)" stroke-width="1" opacity="0.4"/>
    <text x="4" y="142" font-family="'Montserrat', 'Inter', sans-serif" font-size="13" font-weight="400" fill="#E2BA64" letter-spacing="9" opacity="0.9">HAUTE COUTURE &amp; HERITAGE WEAVES</text>
  </g>
</svg>
`;

// 4. Generate High-Fashion Editorial Hero Banner (800x1000 PNG)
const heroEditorialSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <radialGradient id="heroBg" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#2D1146"/>
      <stop offset="45%" stop-color="#19072B"/>
      <stop offset="100%" stop-color="#090212"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE8A3"/>
      <stop offset="35%" stop-color="#DFB45E"/>
      <stop offset="70%" stop-color="#A87522"/>
      <stop offset="100%" stop-color="#FCEAB3"/>
    </linearGradient>
    <linearGradient id="sareeSilk" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#820038"/>
      <stop offset="40%" stop-color="#550024"/>
      <stop offset="75%" stop-color="#2E0013"/>
      <stop offset="100%" stop-color="#140008"/>
    </linearGradient>
    <pattern id="zariMotif" width="50" height="50" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <circle cx="25" cy="25" r="3" fill="#DFB45E" opacity="0.3"/>
      <path d="M 25 15 Q 30 25 35 25 Q 25 30 25 35 Q 20 25 15 25 Q 25 20 25 15 Z" fill="#DFB45E" opacity="0.2"/>
    </pattern>
  </defs>

  <rect width="800" height="1000" fill="url(#heroBg)"/>

  <!-- Ornate Arch Border Framing -->
  <path d="M 40 960 L 40 400 Q 40 50 400 50 Q 760 50 760 400 L 760 960 Z" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.6"/>
  <path d="M 52 960 L 52 405 Q 52 65 400 65 Q 748 65 748 405 L 748 960 Z" fill="none" stroke="url(#gold)" stroke-width="0.8" stroke-dasharray="6,4" opacity="0.35"/>

  <!-- Editorial Silhouette & Silk Drape -->
  <g transform="translate(400, 520)">
    <!-- Radiance Aura -->
    <ellipse cx="0" cy="-60" rx="220" ry="290" fill="#6A1B9A" opacity="0.18"/>
    
    <!-- Flowing Saree Pallu / Silhouette -->
    <path d="M -130 -220 C -70 -260 70 -260 130 -220 C 160 -100 210 120 180 380 L -180 380 C -210 120 -160 -100 -130 -220 Z" fill="url(#sareeSilk)"/>
    <path d="M -130 -220 C -70 -260 70 -260 130 -220 C 160 -100 210 120 180 380 L -180 380 C -210 120 -160 -100 -130 -220 Z" fill="url(#zariMotif)"/>

    <!-- Gold Zari Border Hem -->
    <path d="M -180 340 Q 0 355 180 340 L 180 380 Q 0 395 -180 380 Z" fill="url(#gold)"/>
    
    <!-- Pleats & Draping Lines -->
    <path d="M 0 -160 C 20 0 10 240 30 340" stroke="url(#gold)" stroke-width="1.5" fill="none" opacity="0.5"/>
    <path d="M -45 -140 C -30 20 -40 220 -20 340" stroke="url(#gold)" stroke-width="1.2" fill="none" opacity="0.4"/>
    <path d="M 45 -140 C 60 20 50 220 70 340" stroke="url(#gold)" stroke-width="1.2" fill="none" opacity="0.4"/>

    <!-- Royal Gold Choker / Jewellery Accents -->
    <ellipse cx="0" cy="-210" rx="35" ry="12" fill="none" stroke="url(#gold)" stroke-width="3"/>
    <circle cx="0" cy="-196" r="4" fill="url(#gold)"/>
  </g>

  <!-- Haute Couture Label Overlay -->
  <g transform="translate(400, 160)">
    <text x="0" y="0" font-family="'Cinzel', 'Playfair Display', serif" font-size="14" font-weight="600" fill="url(#gold)" text-anchor="middle" letter-spacing="8">ROYAL HERITAGE EDIT</text>
    <text x="0" y="44" font-family="'Playfair Display', Georgia, serif" font-size="34" font-style="italic" font-weight="400" fill="#FFFFFF" text-anchor="middle">Pure Kanchipuram &amp; Banarasi</text>
    <line x1="-80" y1="64" x2="80" y2="64" stroke="url(#gold)" stroke-width="1" opacity="0.6"/>
  </g>

  <!-- Editorial Badge Bottom -->
  <g transform="translate(400, 880)">
    <rect x="-180" y="-30" width="360" height="60" rx="30" fill="#140620" stroke="url(#gold)" stroke-width="1.2" opacity="0.9"/>
    <text x="0" y="6" font-family="'Montserrat', sans-serif" font-size="11" font-weight="600" fill="url(#gold)" text-anchor="middle" letter-spacing="4">HANDCRAFTED IN INDIA</text>
  </g>
</svg>
`;

// 5. Generate Royal Bridal Promo Banner (800x1000 PNG)
const promoBridalSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <radialGradient id="promoBg" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#3A081D"/>
      <stop offset="50%" stop-color="#20030E"/>
      <stop offset="100%" stop-color="#0A0105"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE8A3"/>
      <stop offset="35%" stop-color="#DFB45E"/>
      <stop offset="70%" stop-color="#A87522"/>
      <stop offset="100%" stop-color="#FCEAB3"/>
    </linearGradient>
    <linearGradient id="bridalRed" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#99002B"/>
      <stop offset="60%" stop-color="#60001B"/>
      <stop offset="100%" stop-color="#2D000C"/>
    </linearGradient>
  </defs>

  <rect width="800" height="1000" fill="url(#promoBg)"/>

  <!-- Ornate Luxury Frame -->
  <rect x="35" y="35" width="730" height="930" rx="20" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.7"/>
  <rect x="47" y="47" width="706" height="906" rx="14" fill="none" stroke="url(#gold)" stroke-width="0.8" stroke-dasharray="5,4" opacity="0.4"/>

  <!-- Bridal Lehenga Silhouette -->
  <g transform="translate(400, 520)">
    <!-- Bridal Flared Skirt -->
    <path d="M -70 -120 L 70 -120 L 260 360 C 130 390 -130 390 -260 360 Z" fill="url(#bridalRed)"/>
    
    <!-- Zardozi Embroidery Panels -->
    <g stroke="url(#gold)" stroke-width="1.5" fill="none" opacity="0.65">
      <path d="M 0 -120 L 0 375"/>
      <path d="M -25 -120 L -90 370"/>
      <path d="M 25 -120 L 90 370"/>
      <path d="M -50 -120 L -180 365"/>
      <path d="M 50 -120 L 180 365"/>
      <!-- Scalloped Hem -->
      <path d="M -260 340 Q -230 360 -200 340 Q -170 360 -140 340 Q -110 360 -80 340 Q -50 360 -20 340 Q 10 360 40 340 Q 70 360 100 340 Q 130 360 160 340 Q 190 360 220 340 Q 250 360 260 340" stroke-width="3"/>
    </g>

    <!-- Choli Bodice & Dupatta Drape -->
    <path d="M -60 -230 L 60 -230 L 75 -130 L -75 -130 Z" fill="#750021"/>
    <!-- Diagonally draped sheer gold net dupatta -->
    <path d="M -110 -210 Q 0 -130 190 260 L 220 220 Q 20 -150 -70 -240 Z" fill="url(#gold)" opacity="0.35"/>
  </g>

  <!-- Editorial Typography -->
  <g transform="translate(400, 150)">
    <text x="0" y="0" font-family="'Cinzel', serif" font-size="14" font-weight="600" fill="url(#gold)" text-anchor="middle" letter-spacing="8">THE BRIDAL TROUSSEAU</text>
    <text x="0" y="44" font-family="'Playfair Display', Georgia, serif" font-size="36" font-style="italic" font-weight="400" fill="#FFFFFF" text-anchor="middle">Heirloom Zardozi &amp; Raw Silk</text>
    <line x1="-70" y1="64" x2="70" y2="64" stroke="url(#gold)" stroke-width="1" opacity="0.6"/>
  </g>

  <g transform="translate(400, 880)">
    <rect x="-170" y="-28" width="340" height="56" rx="28" fill="#1C030C" stroke="url(#gold)" stroke-width="1.2"/>
    <text x="0" y="6" font-family="'Montserrat', sans-serif" font-size="11" font-weight="600" fill="url(#gold)" text-anchor="middle" letter-spacing="4">BESPOKE BRIDAL COUTURE</text>
  </g>
</svg>
`;

async function run() {
  console.log("Generating luxury PNG assets...");

  // 1. icon.png (512x512)
  await sharp(Buffer.from(crestSvg))
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, "icon.png"));
  console.log("Created public/icon.png");

  // 2. apple-icon.png (180x180)
  await sharp(Buffer.from(crestSvg))
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, "apple-icon.png"));
  console.log("Created public/apple-icon.png");

  // 3. favicon.png (64x64)
  await sharp(Buffer.from(crestSvg))
    .resize(64, 64)
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, "favicon.png"));
  console.log("Created public/favicon.png");

  // 4. logo.png (800x200)
  await sharp(Buffer.from(logoSvg))
    .resize(800, 200)
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, "logo.png"));
  console.log("Created public/logo.png");

  // 5. hero-1.png & promo-1.png in seed
  if (fs.existsSync(SEED)) {
    await sharp(Buffer.from(heroEditorialSvg))
      .resize(800, 1000)
      .png({ compressionLevel: 9 })
      .toFile(path.join(SEED, "hero-1.png"));
    console.log("Created public/seed/hero-1.png");

    await sharp(Buffer.from(promoBridalSvg))
      .resize(800, 1000)
      .png({ compressionLevel: 9 })
      .toFile(path.join(SEED, "promo-1.png"));
    console.log("Created public/seed/promo-1.png");
  }

  console.log("All luxury PNG assets generated successfully!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

