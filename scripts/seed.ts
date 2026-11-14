/* Seeds MongoDB with categories, sample products, coupons, banners and the admin user.
   Usage: npm run seed            (idempotent: only inserts what is missing)
          npm run seed:reset      (wipes catalog/marketing data first; keeps customers & orders)  */
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import sharp from "sharp";
import { User, Category, Product, Coupon, Banner, Settings } from "../src/models";

const reset = process.argv.includes("--reset");
const OUT = path.join(process.cwd(), "public", "seed");
fs.mkdirSync(OUT, { recursive: true });

/* ---------- artwork: tonal editorial SVG placeholders (replace with real photography via Admin → Products) ---------- */
type Kind = "saree" | "kurti" | "chudidhar" | "western" | "bridal" | "designer" | "accessory";
const SHAPES: Record<Kind, string> = {
  saree: "M150 60 C170 40 230 40 250 60 L262 150 C300 200 330 330 300 470 L120 470 C110 360 140 250 168 160 Z M168 160 C230 190 290 200 330 170 L336 205 C290 240 220 240 160 205 Z",
  kurti: "M140 70 L175 55 C190 75 210 75 225 55 L260 70 L318 170 L284 188 L262 150 L270 330 L292 470 L108 470 L130 330 L138 150 L116 188 L82 170 Z",
  chudidhar: "M140 70 L175 55 C190 75 210 75 225 55 L260 70 L312 160 L282 178 L262 145 L268 290 L120 290 L138 145 L118 178 L88 160 Z M130 290 L190 290 L184 480 L150 480 Z M210 290 L270 290 L250 480 L216 480 Z",
  western: "M165 55 L185 70 C195 82 205 82 215 70 L235 55 L252 160 L322 470 L78 470 L148 160 Z",
  bridal: "M160 50 L182 66 C195 80 205 80 218 66 L240 50 L252 150 L212 190 L388 480 L12 480 L188 190 L148 150 Z",
  designer: "M150 60 L196 48 C230 70 256 110 252 160 L300 260 L360 470 L120 470 L152 300 L120 200 C112 140 126 90 150 60 Z",
  accessory: "M100 230 L300 230 L320 400 L80 400 Z M130 230 C130 150 270 150 270 230 L250 230 C250 180 150 180 150 230 Z",
};
function art(kind: Kind, hex: string, variant: number, label: string) {
  const dark = shade(hex, -38), light = shade(hex, 70);
  const bg1 = variant === 0 ? "#F7F3FF" : light, bg2 = variant === 0 ? "#EADFFB" : shade(hex, 40);
  const pattern = variant === 1
    ? `<defs><pattern id="p" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="6" cy="6" r="2.2" fill="${light}" opacity=".7"/><circle cx="19" cy="19" r="1.4" fill="${light}" opacity=".5"/></pattern></defs>`
    : "";
  const fill = variant === 1 ? `url(#p)` : "none";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" role="img" aria-label="${label}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
<linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hex}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs>
${pattern}<rect width="400" height="500" fill="url(#g)"/>
<ellipse cx="200" cy="480" rx="130" ry="10" fill="#4B0082" opacity=".10"/>
<g transform="${variant === 2 ? "translate(-40 -30) scale(1.2)" : ""}"><path d="${SHAPES[kind]}" fill="url(#d)" fill-rule="evenodd"/><path d="${SHAPES[kind]}" fill="${fill}" fill-rule="evenodd"/></g>
<text x="200" y="40" text-anchor="middle" font-family="Georgia,serif" font-size="11" letter-spacing="5" fill="#4B0082" opacity=".55">SKY BOUTIQUE</text></svg>`;
}
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + amt));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, "0")).join("");
}
function writeArt(file: string, svg: string) { fs.writeFileSync(path.join(OUT, file), svg); return `/seed/${file.replace(/\.svg$/, ".png")}`; }

/** Rasterise every generated SVG to an 800x1000 PNG, then remove the SVG source. */
async function convertToPng() {
  for (const f of fs.readdirSync(OUT).filter((x) => x.endsWith(".svg"))) {
    await sharp(path.join(OUT, f), { density: 192 }).resize(800, 1000, { fit: "cover" }).png({ compressionLevel: 9 }).toFile(path.join(OUT, f.replace(/\.svg$/, ".png")));
    fs.unlinkSync(path.join(OUT, f));
  }
}

const COLORS: Record<string, string> = {
  Royal: "#7200F5", Plum: "#4B0082", Ivory: "#E9E0D0", Rose: "#D46A8C", Emerald: "#0F7B5F", Navy: "#1F2A5A", Black: "#222222", Gold: "#C79A3B", Blush: "#E8B7C3", Mustard: "#D9A21B", Teal: "#127C84", Wine: "#7B1E3A", Lilac: "#B79BE8",
};

type Seed = { name: string; cat: string; kind: Kind; price: number; sale?: number; colors: string[]; sizes: string[]; fabric: string; desc: string; flags?: ("featured" | "bestseller" | "trending")[]; sold?: number };
const STD = ["S", "M", "L", "XL"], FREE = ["Free Size"], ACC = ["One Size"];
const PRODUCTS: Seed[] = [
  { name: "Kanchipuram Silk Saree", cat: "sarees", kind: "saree", price: 18500, sale: 15999, colors: ["Royal", "Wine", "Emerald"], sizes: FREE, fabric: "Pure Kanchipuram silk", desc: "A heirloom-quality Kanchipuram silk saree with a hand-woven zari border and rich pallu. Unstitched blouse piece included.", flags: ["featured", "bestseller"], sold: 48 },
  { name: "Banarasi Georgette Saree", cat: "sarees", kind: "saree", price: 9800, sale: 7999, colors: ["Rose", "Ivory", "Plum"], sizes: FREE, fabric: "Banarasi georgette", desc: "Featherlight Banarasi georgette with intricate floral jaal and a scalloped border. Effortless drape for festive evenings.", flags: ["trending"], sold: 31 },
  { name: "Organza Floral Saree", cat: "sarees", kind: "saree", price: 6400, colors: ["Blush", "Lilac"], sizes: FREE, fabric: "Soft organza", desc: "Translucent organza saree with hand-painted florals and a delicate satin border.", flags: ["trending"], sold: 12 },
  { name: "Cotton Silk Handloom Saree", cat: "sarees", kind: "saree", price: 4200, sale: 3499, colors: ["Mustard", "Teal"], sizes: FREE, fabric: "Cotton silk blend", desc: "Breathable handloom cotton-silk with a contrast temple border. Perfect from office to occasion.", sold: 22 },
  { name: "Embroidered Anarkali Kurti", cat: "kurtis", kind: "kurti", price: 3200, sale: 2499, colors: ["Plum", "Teal", "Rose"], sizes: STD, fabric: "Chanderi cotton", desc: "Flowing Anarkali kurti with thread embroidery at the yoke and a graceful flared hem.", flags: ["featured", "bestseller"], sold: 64 },
  { name: "Straight Cut Cotton Kurti", cat: "kurtis", kind: "kurti", price: 1599, colors: ["Ivory", "Navy", "Mustard"], sizes: STD, fabric: "Pure cotton", desc: "A wardrobe staple: clean straight cut, side slits and a relaxed fit in soft breathable cotton.", flags: ["bestseller"], sold: 90 },
  { name: "Block Print Kurti Set", cat: "kurtis", kind: "kurti", price: 2899, sale: 2299, colors: ["Royal", "Emerald"], sizes: STD, fabric: "Hand block-printed cotton", desc: "Artisan block-printed kurti paired with matching palazzo. Naturally dyed, wonderfully soft.", flags: ["trending"], sold: 27 },
  { name: "Silk Blend Festive Kurti", cat: "kurtis", kind: "kurti", price: 3999, sale: 3299, colors: ["Wine", "Gold"], sizes: STD, fabric: "Silk blend", desc: "Rich silk blend kurti with gota-patti trim — made for celebrations.", sold: 15 },
  { name: "Churidar Suit Set", cat: "chudidhars", kind: "chudidhar", price: 4599, sale: 3799, colors: ["Navy", "Rose", "Emerald"], sizes: STD, fabric: "Cotton satin", desc: "Three-piece churidar set: embroidered kurta, fitted churidar and a matching dupatta.", flags: ["featured"], sold: 33 },
  { name: "Patiala Salwar Suit", cat: "chudidhars", kind: "chudidhar", price: 3899, colors: ["Mustard", "Plum"], sizes: STD, fabric: "Crepe", desc: "Voluminous Patiala salwar with a contrast kurta. Comfortable, graceful, joyful.", sold: 19 },
  { name: "Straight Pant Suit Set", cat: "chudidhars", kind: "chudidhar", price: 3299, sale: 2799, colors: ["Black", "Teal"], sizes: STD, fabric: "Viscose rayon", desc: "Smart straight-pant suit with a printed dupatta; ideal for work and weekends.", flags: ["trending"], sold: 21 },
  { name: "Satin Midi Dress", cat: "western-wear", kind: "western", price: 3499, sale: 2799, colors: ["Black", "Lilac", "Wine"], sizes: STD, fabric: "Satin", desc: "A bias-cut satin midi with a sculpted neckline and fluid movement. Dinner-ready.", flags: ["featured", "trending"], sold: 40 },
  { name: "Wrap Dress", cat: "western-wear", kind: "western", price: 2799, colors: ["Royal", "Ivory"], sizes: STD, fabric: "Crepe", desc: "Flattering wrap silhouette with a tie waist and gentle flare.", flags: ["bestseller"], sold: 58 },
  { name: "Tailored Co-ord Set", cat: "western-wear", kind: "western", price: 4299, sale: 3599, colors: ["Navy", "Blush"], sizes: STD, fabric: "Stretch poly-blend", desc: "Structured blazer-and-trouser co-ord for confident, polished days.", sold: 17 },
  { name: "Ruffle Maxi Dress", cat: "western-wear", kind: "western", price: 3799, colors: ["Rose", "Emerald"], sizes: STD, fabric: "Georgette", desc: "Tiered ruffles and a flowing maxi length — romantic and effortless.", flags: ["trending"], sold: 25 },
  { name: "Bridal Lehenga", cat: "bridal-collection", kind: "bridal", price: 68000, sale: 59999, colors: ["Wine", "Royal"], sizes: STD, fabric: "Raw silk with zardozi", desc: "Heavily embroidered bridal lehenga in raw silk with zardozi and sequin work, net dupatta and a custom-fit blouse.", flags: ["featured"], sold: 6 },
  { name: "Bridal Silk Saree", cat: "bridal-collection", kind: "bridal", price: 32000, sale: 28999, colors: ["Rose", "Gold"], sizes: FREE, fabric: "Pure silk, gold zari", desc: "A wedding-day silk saree with a broad gold zari border and rich pallu.", flags: ["bestseller"], sold: 9 },
  { name: "Reception Gown", cat: "bridal-collection", kind: "bridal", price: 24500, sale: 21999, colors: ["Plum", "Blush"], sizes: STD, fabric: "Net with satin lining", desc: "A show-stopping reception gown with a fitted bodice and sweeping skirt.", sold: 5 },
  { name: "Designer Cape Gown", cat: "designer-wear", kind: "designer", price: 14500, sale: 12999, colors: ["Black", "Royal"], sizes: STD, fabric: "Crepe with organza cape", desc: "An asymmetric gown finished with a detachable organza cape — a statement for gala nights.", flags: ["featured", "trending"], sold: 11 },
  { name: "Sequin Indo-Western Set", cat: "designer-wear", kind: "designer", price: 11800, colors: ["Gold", "Wine"], sizes: STD, fabric: "Sequin net", desc: "Sequin-embellished top with a draped skirt; contemporary glamour with Indian roots.", sold: 8 },
  { name: "Handcrafted Potli Bag", cat: "accessories", kind: "accessory", price: 1899, sale: 1499, colors: ["Wine", "Gold", "Emerald"], sizes: ACC, fabric: "Silk with beadwork", desc: "Hand-beaded potli with a drawstring closure and a golden chain handle.", flags: ["bestseller"], sold: 52 },
  { name: "Kundan Jhumka Earrings", cat: "accessories", kind: "accessory", price: 1299, colors: ["Gold", "Rose"], sizes: ACC, fabric: "Brass, kundan, pearl drops", desc: "Statement kundan jhumkas with pearl drops. Lightweight enough for all-day wear.", flags: ["trending"], sold: 70 },
  { name: "Banarasi Silk Dupatta", cat: "accessories", kind: "accessory", price: 2499, sale: 1999, colors: ["Royal", "Ivory"], sizes: ACC, fabric: "Banarasi silk", desc: "Zari-woven dupatta to elevate any ensemble.", sold: 29 },
  { name: "Pearl Layered Necklace", cat: "accessories", kind: "accessory", price: 2199, colors: ["Ivory"], sizes: ACC, fabric: "Freshwater pearls, gold-plated", desc: "Three-strand pearl necklace with an adjustable clasp.", sold: 14 },
];

const CATEGORIES = [
  { name: "Sarees", slug: "sarees", description: "Handwoven silks, organzas and everyday drapes." },
  { name: "Kurtis", slug: "kurtis", description: "Embroidered, printed and tailored for every day." },
  { name: "Chudidhars", slug: "chudidhars", description: "Complete sets in elegant, comfortable fits." },
  { name: "Western Wear", slug: "western-wear", description: "Modern silhouettes, dressed up or down." },
  { name: "Bridal Collection", slug: "bridal-collection", description: "Heirloom pieces for the most beautiful day." },
  { name: "Designer Wear", slug: "designer-wear", description: "Statement pieces from our design studio." },
  { name: "Accessories", slug: "accessories", description: "Bags, jewellery and finishing touches." },
  { name: "New Arrivals", slug: "new-arrivals", description: "The latest additions to the boutique." },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Connected to MongoDB");

  if (reset) {
    await Promise.all([Category.deleteMany({}), Product.deleteMany({}), Coupon.deleteMany({}), Banner.deleteMany({})]);
    console.log("Catalog data wiped");
  }

  // Admin
  const email = (process.env.ADMIN_EMAIL || "admin@skyboutique.in").toLowerCase();
  const pw = process.env.ADMIN_PASSWORD || "ChangeMe@123";
  if (!(await User.exists({ email }))) {
    await User.create({ name: "Boutique Admin", email, role: "admin", password: await bcrypt.hash(pw, 12) });
    console.log(`Admin created: ${email} / ${pw}  (change this password!)`);
  }

  // Demo customer (shown on the customer login page in development)
  const custEmail = "customer@skyboutique.in";
  if (!(await User.exists({ email: custEmail }))) {
    await User.create({ name: "Demo Customer", email: custEmail, role: "customer", password: await bcrypt.hash("Customer@123", 12) });
    console.log(`Customer created: ${custEmail} / Customer@123`);
  }

  // Categories
  const catIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const kind: Kind = ({ sarees: "saree", kurtis: "kurti", chudidhars: "chudidhar", "western-wear": "western", "bridal-collection": "bridal", "designer-wear": "designer", accessories: "accessory", "new-arrivals": "designer" } as Record<string, Kind>)[c.slug];
    const hex = ["#7200F5", "#D46A8C", "#127C84", "#4B0082", "#7B1E3A", "#1F2A5A", "#C79A3B", "#B79BE8"][i];
    const image = writeArt(`cat-${c.slug}.svg`, art(kind, hex, 0, c.name));
    const doc = await Category.findOneAndUpdate({ slug: c.slug }, { $setOnInsert: { ...c, image, sortOrder: i, visible: true } }, { upsert: true, returnDocument: "after" });
    catIds[c.slug] = doc._id;
  }

  // Products
  let created = 0;
  for (const [idx, s] of PRODUCTS.entries()) {
    const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (await Product.exists({ slug })) continue;
    const code = slug.split("-").map((w) => w[0]).join("").toUpperCase() + String(idx + 1).padStart(2, "0");
    const images = [0, 1, 2].map((v) => writeArt(`${slug}-${v + 1}.svg`, art(s.kind, COLORS[s.colors[0]], v, s.name)));
    const variants = s.colors.flatMap((c) =>
      s.sizes.map((sz) => ({ sku: `SKY-${code}-${c.slice(0, 3).toUpperCase()}-${sz.replace(/\s/g, "").toUpperCase()}`, size: sz, color: c, stock: Math.floor(Math.random() * 14) + (Math.random() < 0.1 ? 0 : 2) })),
    );
    variants[0].stock = 0 + (idx % 7 === 0 ? 0 : 8); // guarantee a few sold-out/low examples for demoing alerts
    await Product.create({
      name: s.name, slug, description: s.desc, category: catIds[s.cat], price: s.price, salePrice: s.sale, images,
      colors: s.colors.map((c) => ({ name: c, hex: COLORS[c] })), sizes: s.sizes, variants, fabric: s.fabric,
      specifications: [{ key: "Fabric", value: s.fabric }, { key: "Care", value: s.cat === "accessories" ? "Wipe with a soft dry cloth" : "Dry clean recommended" }, { key: "Origin", value: "Made in India" }],
      featured: s.flags?.includes("featured") ?? false, bestseller: s.flags?.includes("bestseller") ?? false, trending: s.flags?.includes("trending") ?? false,
      soldCount: s.sold ?? 0, published: true,
    });
    created++;
  }
  console.log(`Products created: ${created}`);

  // Coupons
  for (const c of [
    { code: "WELCOME10", type: "percent", value: 10, minOrder: 999, maxDiscount: 1000 },
    { code: "FLAT500", type: "fixed", value: 500, minOrder: 4999 },
  ] as const) await Coupon.updateOne({ code: c.code }, { $setOnInsert: { ...c, active: true } }, { upsert: true });

  // Banners
  if (!(await Banner.countDocuments())) {
    await Banner.insertMany([
      { type: "hero", title: "Discover Your Signature Style", subtitle: "Explore timeless fashion, elegant collections and styles that make every moment special.", image: writeArt("hero-1.svg", art("saree", "#7200F5", 0, "Hero")), ctaLabel: "Explore Collection", ctaLink: "/shop", sortOrder: 0 },
      { type: "promo", title: "The Wedding Edit", subtitle: "Bridal lehengas, silks and gowns — up to 15% off this season.", image: writeArt("promo-1.svg", art("bridal", "#4B0082", 1, "Promo")), ctaLabel: "Shop Bridal", ctaLink: "/shop?category=bridal-collection", sortOrder: 0 },
    ]);
  }

  // Settings (with testimonials)
  await Settings.updateOne(
    { key: "main" },
    {
      $setOnInsert: {
        key: "main",
        testimonials: [
          { name: "Priya R.", city: "Chennai", text: "The Kanchipuram saree was even more beautiful in person. Packaging and delivery were flawless.", rating: 5 },
          { name: "Ananya S.", city: "Bengaluru", text: "Perfect fit and gorgeous fabric. My go-to boutique for every festival now.", rating: 5 },
          { name: "Meera K.", city: "Hyderabad", text: "Ordered my bridal lehenga here — the team was patient, helpful and the quality is exquisite.", rating: 5 },
        ],
      },
    },
    { upsert: true },
  );

  await convertToPng();
  console.log("Seed complete ✔");
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
