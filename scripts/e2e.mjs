// End-to-end API smoke test. Requires: db running, seeded, dev server on :3000.  Usage: node scripts/e2e.mjs
import crypto from "crypto";
const BASE = process.env.BASE || "http://localhost:3000";
let pass = 0, fail = 0;
const ok = (c, m, extra) => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${m}${!c && extra ? "  → " + JSON.stringify(extra) : ""}`); };

class Client {
  jar = "";
  async req(path, { method = "GET", json } = {}) {
    const r = await fetch(BASE + path, { method, redirect: "manual", headers: { ...(json ? { "Content-Type": "application/json" } : {}), cookie: this.jar, origin: BASE }, body: json ? JSON.stringify(json) : undefined });
    const sc = r.headers.getSetCookie?.() ?? [];
    for (const c of sc) { const [kv] = c.split(";"); const [k] = kv.split("="); this.jar = this.jar.split("; ").filter((x) => x && !x.startsWith(k + "=")).concat(kv).join("; "); }
    let data = null; try { data = await r.json(); } catch {}
    return { status: r.status, data };
  }
}

const guest = new Client(), admin = new Client(), cust = new Client();
const stamp = Date.now();

// products
const list = (await guest.req("/api/products?limit=50")).data.items;
const withStock = list.find((p) => p.variants.some((v) => v.stock >= 3));
const v = withStock.variants.find((x) => x.stock >= 3);
const unit = withStock.salePrice && withStock.salePrice < withStock.price ? withStock.salePrice : withStock.price;
ok(list.length >= 20, "catalog served from MongoDB", list.length);

// pricing is server-side and ignores client prices
let r = await guest.req("/api/cart/price", { method: "POST", json: { items: [{ productId: withStock._id, sku: v.sku, qty: 2, price: 1 }] } });
ok(r.status === 200 && r.data.subtotal === unit * 2, "server computes subtotal (client price ignored)", r.data);
r = await guest.req("/api/cart/price", { method: "POST", json: { items: [{ productId: withStock._id, sku: v.sku, qty: 2 }], coupon: "WELCOME10" } });
ok(r.data.couponApplied === "WELCOME10" || r.data.couponError, "coupon evaluated", r.data.couponError);
r = await guest.req("/api/cart/price", { method: "POST", json: { items: [{ productId: withStock._id, sku: v.sku, qty: 2 }], coupon: "NOPE" } });
ok(r.data.couponError === "Invalid coupon code", "invalid coupon rejected");

// admin protection
r = await guest.req("/api/admin/dashboard");
ok(r.status === 401, "admin API rejects anonymous", r.status);
r = await cust.req("/api/auth/register", { method: "POST", json: { name: "Test Customer", email: `t${stamp}@example.com`, password: "Passw0rd1", phone: "9876543210" } });
ok(r.status === 201, "customer registration", r.data);
r = await cust.req("/api/admin/dashboard");
ok(r.status === 403, "admin API rejects customer role", r.status);
r = await cust.req("/api/auth/register", { method: "POST", json: { name: "Dup User", email: `t${stamp}@example.com`, password: "Passw0rd1" } });
ok(r.status === 409, "duplicate email rejected", { s: r.status, d: r.data });
r = await guest.req("/api/auth/login", { method: "POST", json: { email: "admin@skyboutique.in", password: "wrong" } });
ok(r.status === 401, "bad password rejected");
r = await admin.req("/api/auth/login", { method: "POST", json: { email: "admin@skyboutique.in", password: "ChangeMe@123" } });
ok(r.status === 200 && r.data.user.role === "admin", "admin login");
r = await admin.req("/api/admin/dashboard");
ok(r.status === 200 && typeof r.data.revenue === "number", "admin dashboard");

// cross-origin mutating request blocked
const bad = await fetch(BASE + "/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json", origin: "https://evil.example" }, body: JSON.stringify({ email: "a@b.co" }) });
ok(bad.status === 403, "cross-origin POST blocked (CSRF)", bad.status);

// COD guest order + atomic stock
const before = (await guest.req(`/api/products/${withStock.slug}`)).data.product.variants.find((x) => x.sku === v.sku).stock;
const order = { items: [{ productId: withStock._id, sku: v.sku, qty: 2 }], paymentMethod: "cod", customer: { name: "Guest Buyer", email: `g${stamp}@example.com`, phone: "9876543210" }, shippingAddress: { address: "12 Test Street", city: "Chennai", state: "Tamil Nadu", pincode: "600001" } };
r = await guest.req("/api/orders", { method: "POST", json: order });
ok(r.status === 201 && /^SKY-\d{8}-/.test(r.data.orderNumber) && r.data.total >= unit * 2, "guest COD order created", r.data);
const orderNo = r.data.orderNumber;
const after = (await guest.req(`/api/products/${withStock.slug}`)).data.product.variants.find((x) => x.sku === v.sku).stock;
ok(after === before - 2, `stock decremented (${before} → ${after})`);

// overselling prevented
r = await guest.req("/api/orders", { method: "POST", json: { ...order, items: [{ productId: withStock._id, sku: v.sku, qty: after + 1 }] } });
ok(r.status === 409, "cannot order more than stock", r.data);
// concurrent race: 6 parallel orders of 1 unit against `after` units
const race = await Promise.all(Array.from({ length: after + 3 }, () => guest.req("/api/orders", { method: "POST", json: { ...order, items: [{ productId: withStock._id, sku: v.sku, qty: 1 }] } })));
const won = race.filter((x) => x.status === 201).length; console.log("race statuses", race.map((x) => x.status + (x.data?.error ? ":" + x.data.error.slice(0, 40) : "")).join(" | "));
const final = (await guest.req(`/api/products/${withStock.slug}`)).data.product.variants.find((x) => x.sku === v.sku).stock;
ok(won === after && final === 0, `race: ${race.length} parallel orders → ${won} succeeded, stock ${final} (never negative)`, { won, after, final });

// guest tracking needs email
r = await guest.req(`/api/orders/${orderNo}`);
ok(r.status === 404, "order hidden without email");
r = await guest.req(`/api/orders/${orderNo}?email=g${stamp}@example.com`);
ok(r.status === 200 && r.data.order.status === "confirmed", "guest can track with email");

// customer cancels -> stock restored
r = await guest.req(`/api/orders/${orderNo}`, { method: "PATCH", json: { action: "cancel", email: `g${stamp}@example.com` } });
ok(r.status === 200, "customer cancel");
const restored = (await guest.req(`/api/products/${withStock.slug}`)).data.product.variants.find((x) => x.sku === v.sku).stock;
ok(restored === 2, `stock restored on cancel (${restored})`);

// razorpay not configured -> clear error
r = await guest.req("/api/orders", { method: "POST", json: { ...order, items: [{ productId: withStock._id, sku: v.sku, qty: 1 }], paymentMethod: "razorpay" } });
ok(r.status === 503 || r.status === 201, "razorpay path responds sanely", r.status);

// payment verification rejects forged signature
r = await guest.req("/api/payments/verify", { method: "POST", json: { orderNumber: orderNo, razorpay_order_id: "order_fake12345", razorpay_payment_id: "pay_fake12345", razorpay_signature: "x".repeat(64) } });
ok([400, 404, 503].includes(r.status), "forged payment signature rejected", r.status);

// validation
r = await guest.req("/api/orders", { method: "POST", json: { ...order, customer: { ...order.customer, phone: "123" } } });
ok(r.status === 400, "invalid phone rejected");

// admin flows
r = await admin.req("/api/admin/orders?q=" + orderNo);
ok(r.data.items?.length === 1, "admin finds order by number");
const oid = r.data.items[0]._id;
r = await admin.req(`/api/admin/orders/${oid}`, { method: "PATCH", json: { status: "shipped", trackingNumber: "AWB1" } });
ok(r.status === 400, "cancelled order cannot be changed", r.data?.error);
r = await admin.req("/api/admin/reports?range=monthly");
ok(r.status === 200 && Array.isArray(r.data.series), "reports");
const csv = await fetch(BASE + "/api/admin/reports?format=csv", { headers: { cookie: admin.jar } });
ok(csv.status === 200 && (await csv.text()).includes("Order No"), "CSV export");
r = await admin.req("/api/admin/inventory?filter=out");
ok(r.status === 200 && r.data.items.every((x) => x.stock === 0), "inventory out-of-stock filter");
r = await admin.req("/api/admin/inventory", { method: "POST", json: { productId: withStock._id, sku: v.sku, mode: "set", quantity: 12, note: "e2e restock" } });
ok(r.status === 200 && r.data.stock === 12, "stock adjustment + log");

// admin creates product -> immediately public
const cats = (await admin.req("/api/admin/categories")).data.items;
r = await admin.req("/api/admin/products", { method: "POST", json: { name: `E2E Test Gown ${stamp}`, category: cats[0]._id, price: 5000, salePrice: 4000, description: "x", variants: [{ sku: `E2E-${stamp}`, size: "M", color: "Black", stock: 5 }], colors: [{ name: "Black", hex: "#000000" }], sizes: ["M"] } });
ok(r.status === 201, "admin creates product", r.data);
const slug = r.data.item.slug;
const pub = await guest.req(`/api/products/${slug}`);
ok(pub.status === 200, "new product instantly public");
r = await admin.req(`/api/admin/products/${r.data.item._id}`, { method: "DELETE" });
ok(r.status === 200, "admin deletes product");
ok((await guest.req(`/api/products/${slug}`)).status === 404, "deleted product gone from store");

// restore seeded stock
await admin.req("/api/admin/inventory", { method: "POST", json: { productId: withStock._id, sku: v.sku, mode: "set", quantity: before, note: "e2e restore" } });

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
