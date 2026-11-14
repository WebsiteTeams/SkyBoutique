/* Downloads real stock photos from Unsplash into public/seed as PNG.
   Usage: node --env-file=.env.local scripts/fetch-unsplash-images.mjs */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!KEY) { console.error("UNSPLASH_ACCESS_KEY missing"); process.exit(1); }
const OUT = path.join(process.cwd(), "public", "seed");
fs.mkdirSync(OUT, { recursive: true });

const PRODUCTS = {
  "kanchipuram-silk-saree": "woman wearing silk saree india",
  "banarasi-georgette-saree": "woman pink saree traditional",
  "organza-floral-saree": "woman floral saree elegant",
  "cotton-silk-handloom-saree": "woman cotton saree india",
  "embroidered-anarkali-kurti": "woman anarkali dress indian",
  "straight-cut-cotton-kurti": "woman kurti indian ethnic wear",
  "block-print-kurti-set": "woman printed kurta ethnic",
  "silk-blend-festive-kurti": "woman festive kurta indian",
  "churidar-suit-set": "woman salwar suit indian",
  "patiala-salwar-suit": "woman punjabi suit salwar",
  "straight-pant-suit-set": "woman indian suit set ethnic",
  "satin-midi-dress": "woman satin midi dress fashion",
  "wrap-dress": "woman wrap dress fashion",
  "tailored-co-ord-set": "woman coord set blazer fashion",
  "ruffle-maxi-dress": "woman ruffle maxi dress",
  "bridal-lehenga": "indian bride lehenga",
  "bridal-silk-saree": "indian bride silk saree wedding",
  "reception-gown": "woman evening gown reception",
  "designer-cape-gown": "woman designer gown cape fashion",
  "sequin-indo-western-set": "woman sequin outfit fashion",
  "handcrafted-potli-bag": "embroidered clutch bag",
  "kundan-jhumka-earrings": "gold earrings jewelry",
  "banarasi-silk-dupatta": "silk scarf fabric",
  "pearl-layered-necklace": "pearl necklace jewelry",
};
const CATS = {
  "cat-sarees": "woman saree portrait",
  "cat-kurtis": "woman kurti portrait ethnic",
  "cat-chudidhars": "woman salwar suit portrait",
  "cat-western-wear": "woman western dress fashion",
  "cat-bridal-collection": "indian bride portrait",
  "cat-designer-wear": "woman designer gown fashion",
  "cat-accessories": "indian jewellery accessories",
  "cat-new-arrivals": "fashion boutique clothing rack",
};

const used = new Set();
async function search(query, n, orientation) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=30&orientation=${orientation}&content_filter=high`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${KEY}`, "Accept-Version": "v1" } });
  if (!res.ok) throw new Error(`Unsplash ${res.status} for "${query}": ${await res.text()}`);
  const { results } = await res.json();
  const picks = [];
  for (const p of results) { if (!used.has(p.id)) { used.add(p.id); picks.push(p); if (picks.length === n) break; } }
  if (picks.length < n) throw new Error(`Only ${picks.length}/${n} photos for "${query}"`);
  return picks;
}
async function save(photo, file, w, h) {
  const buf = Buffer.from(await (await fetch(`${photo.urls.raw}&w=1800&fm=jpg&q=85`)).arrayBuffer());
  await sharp(buf).resize(w, h, { fit: "cover", position: "attention" }).png({ compressionLevel: 9 }).toFile(path.join(OUT, file));
  console.log("saved", file);
}
const credits = [];
const credit = (file, p) => credits.push(`${file}\t${p.user.name}\t${p.links.html}`);

for (const [slug, q] of Object.entries(PRODUCTS)) {
  if ([1,2,3].every((i) => fs.existsSync(path.join(OUT, `${slug}-${i}.png`)))) { console.log("skip", slug); continue; }
  const picks = await search(q, 3, "portrait");
  for (let i = 0; i < 3; i++) { const f = `${slug}-${i + 1}.png`; await save(picks[i], f, 900, 1200); credit(f, picks[i]); }
}
for (const [name, q] of Object.entries(CATS)) {
  const [p] = await search(q, 1, "portrait"); await save(p, `${name}.png`, 800, 1000); credit(`${name}.png`, p);
}
const [hero] = await search("fashion boutique women ethnic wear", 1, "landscape"); await save(hero, "hero-1.png", 1920, 1080); credit("hero-1.png", hero);
const [promo] = await search("indian wedding bride lehenga", 1, "landscape"); await save(promo, "promo-1.png", 1600, 900); credit("promo-1.png", promo);
fs.writeFileSync(path.join(OUT, "CREDITS.txt"), "Photos from Unsplash (https://unsplash.com)\n\n" + credits.join("\n") + "\n");
console.log("done:", credits.length, "images");
