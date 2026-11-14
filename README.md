# SKY BOUTIQUE — Elegance in Every Thread.

Luxury fashion e-commerce: Next.js 16 (App Router) · TypeScript · Tailwind v4 · Framer Motion · MongoDB/Mongoose · Razorpay · Cloudinary · WhatsApp.

## Quick start (local)

```bash
npm install
cp .env.example .env.local      # then edit (JWT_SECRET, admin credentials, keys)

npm run db        # terminal 1 — local MongoDB (no install needed), data kept in ./.data
npm run seed      # terminal 2 — categories, 24 sample products, coupons, banner, admin user
npm run dev       # http://localhost:3000
```

* Admin: **http://localhost:3000/admin** — `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`
  (defaults `admin@skyboutique.in` / `ChangeMe@123` — **change before going live**).
* Sample coupons: `WELCOME10` (10 %, min ₹999) · `FLAT500` (₹500 off, min ₹4,999).
* To use MongoDB Atlas instead, set `MONGODB_URI` and skip `npm run db`.
* `npm run seed:reset` wipes catalog/marketing data and re-seeds (customers & orders are kept).

## Environment variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | ≥ 32 random chars; signs the httpOnly session cookie |
| `NEXT_PUBLIC_SITE_URL` | Public URL (metadata, password-reset links) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin account created by `npm run seed` |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | Product/banner image uploads (in dev, falls back to `public/uploads`) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Online payments. Without them only Cash on Delivery works |
| `RAZORPAY_WEBHOOK_SECRET` | Optional: point a Razorpay webhook (`payment.captured`) to `/api/payments/webhook` |

## What's where

```
src/app/(store)   storefront  ·  (auth) login/register/reset  ·  admin/  dashboard  ·  api/  route handlers
src/models        13 Mongoose collections (+ newsletter subscribers)
src/services      pricing (single source of truth for money), orders (atomic stock), catalog, reports
src/lib           mongodb, auth (JWT cookie), api (validation/error/rate-limit/CSRF wrapper), razorpay, cloudinary
src/components    common · layout · home · products · cart · checkout · admin
scripts/          dev-db, seed, e2e (API smoke test)
```

## Security notes

* Passwords: bcrypt (cost 12). Session: signed JWT in an `HttpOnly`, `SameSite=Lax`, `Secure` (prod) cookie.
* Roles re-checked against the DB on every request; `/admin` guarded by `proxy.ts` **and** the admin layout **and** every `/api/admin/*` route.
* Prices, discounts, shipping and totals are computed only on the server (`services/pricing.ts`); client-sent prices are ignored.
* Stock is reserved with an atomic `findOneAndUpdate` (`stock >= qty`) so concurrent orders can never oversell; stock is released once on cancel/return/abandoned payment.
* Razorpay: payment success is never trusted from the browser — the HMAC signature is verified server-side (timing-safe), plus an optional signed webhook.
* Zod validation on every input; cross-origin mutating requests rejected; per-IP rate limiting (in-memory — swap for Redis/Upstash when running multiple instances); uploads validated by magic bytes + 5 MB cap; CSV export neutralises formula injection.

## Before going live

1. Set real `JWT_SECRET`, admin credentials, Razorpay live keys, Cloudinary keys, `NEXT_PUBLIC_SITE_URL`.
2. Replace the sample products/images (the seed uses generated placeholder artwork) via **Admin → Products**.
3. Password-reset emails: `/api/auth/forgot` currently logs the link (shown on screen only in dev) — connect an email provider (Resend/SES/SMTP) at the marked `TODO`.
4. Update WhatsApp number, contact info and shipping rules in **Admin → Website Content**.
5. Deploy (Vercel/any Node host) with MongoDB Atlas; run `npm run seed` once against production to create the admin user.

## Testing

`npm run typecheck` · `npm run lint` · `npm run build` · with the app running: `node scripts/e2e.mjs`
(33 API checks: pricing, coupons, auth/roles, CSRF, atomic stock under a parallel-order race, cancellation restock, admin CRUD).
