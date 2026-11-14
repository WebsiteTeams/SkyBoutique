/* Converts every SVG in public/seed to an 800x1000 PNG, removes the SVG, and repoints MongoDB records.
   Usage: npx tsx --env-file=.env.local scripts/svg-to-png.ts */
import fs from "fs";
import path from "path";
import sharp from "sharp";
import mongoose from "mongoose";
import { Product, Category, Banner } from "../src/models";

const DIR = path.join(process.cwd(), "public", "seed");
const sw = (v: string) => (v ? v.replace(/^(\/seed\/.*)\.svg$/, "$1.png") : v);

async function main() {
  let files = 0;
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".svg"))) {
    await sharp(path.join(DIR, f), { density: 192 }).resize(800, 1000, { fit: "cover" }).png({ compressionLevel: 9 }).toFile(path.join(DIR, f.replace(/\.svg$/, ".png")));
    fs.unlinkSync(path.join(DIR, f));
    files++;
  }
  console.log("Converted:", files);

  await mongoose.connect(process.env.MONGODB_URI!);
  let n = 0;
  for (const p of await Product.find({ images: /\.svg$/ })) { p.images = p.images.map(sw); await p.save(); n++; }
  for (const c of await Category.find({ image: /\.svg$/ })) { c.image = sw(c.image); await c.save(); n++; }
  for (const b of await Banner.find({ image: /\.svg$/ })) { b.image = sw(b.image); await b.save(); n++; }
  console.log("DB records updated:", n);
  await mongoose.disconnect();
}
main();
