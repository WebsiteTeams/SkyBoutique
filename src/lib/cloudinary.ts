import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const MAX = 5 * 1024 * 1024;

/** Detect image type from magic bytes (never trust client MIME / extension). */
export function sniffImage(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: "png", mime: "image/png" };
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}

export async function uploadImage(file: File, folder = "sky-boutique"): Promise<string> {
  if (file.size > MAX) throw new Error("Image must be 5MB or smaller");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(buf);
  if (!type) throw new Error("Only JPEG, PNG or WebP images are allowed");

  const cloud = process.env.CLOUDINARY_CLOUD_NAME, key = process.env.CLOUDINARY_API_KEY, secret = process.env.CLOUDINARY_API_SECRET;
  if (cloud && key && secret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto.createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(buf)], { type: type.mime }), `upload.${type.ext}`);
    form.append("api_key", key);
    form.append("timestamp", timestamp);
    form.append("folder", folder);
    form.append("signature", signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error("Cloudinary upload failed");
    return ((await res.json()) as { secure_url: string }).secure_url;
  }

  if (process.env.NODE_ENV === "production") throw new Error("Cloudinary is not configured");
  // Dev fallback: local disk
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const name = `${crypto.randomUUID()}.${type.ext}`;
  await fs.writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}
