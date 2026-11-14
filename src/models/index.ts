import mongoose, { Schema, type Model } from "mongoose";

// Loosely typed on purpose: Mongoose 9 schema/document type inference makes tsc exhaust memory on schemas this size.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const { ObjectId } = Schema.Types;
const opts = { timestamps: true } as const;

function model(name: string, schema: Schema<Any>): Model<Any> {
  return (mongoose.models[name] as Model<Any>) || (mongoose.model(name, schema) as unknown as Model<Any>);
}

/* ---------- Users ---------- */
const userSchema = new Schema<Any>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "admin"], default: "customer", index: true },
    blocked: { type: Boolean, default: false },
    resetToken: { type: String, select: false },
    resetExpires: { type: Date, select: false },
  },
  opts,
);
export const User = model("User", userSchema);

/* ---------- Categories ---------- */
const categorySchema = new Schema<Any>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    visible: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  opts,
);
export const Category = model("Category", categorySchema);

/* ---------- Products ---------- */
const variantSchema = new Schema<Any>(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    size: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);
const productSchema = new Schema<Any>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    category: { type: ObjectId, ref: "Category", required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    images: { type: [String], default: [] },
    colors: { type: [{ name: String, hex: String, _id: false }], default: [] },
    sizes: { type: [String], default: [] },
    variants: { type: [variantSchema], default: [] },
    fabric: { type: String, default: "" },
    specifications: { type: [{ key: String, value: String, _id: false }], default: [] },
    featured: { type: Boolean, default: false, index: true },
    bestseller: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false },
    published: { type: Boolean, default: true, index: true },
    soldCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  opts,
);
productSchema.index({ "variants.sku": 1 }, { unique: true, sparse: true });
productSchema.index({ name: "text", description: "text", fabric: "text" });
export const Product = model("Product", productSchema);

/* ---------- Orders ---------- */
const orderItemSchema = new Schema<Any>(
  {
    product: { type: ObjectId, ref: "Product" },
    name: String,
    slug: String,
    image: String,
    sku: String,
    size: String,
    color: String,
    price: Number, // unit price snapshot
    qty: Number,
  },
  { _id: false },
);
const orderSchema = new Schema<Any>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: ObjectId, ref: "User", index: true },
    customer: { name: String, email: { type: String, lowercase: true, index: true }, phone: String },
    shippingAddress: { address: String, city: String, state: String, pincode: String },
    items: [orderItemSchema],
    subtotal: Number,
    discount: Number,
    shipping: Number,
    total: Number,
    couponCode: String,
    paymentMethod: { type: String, enum: ["razorpay", "cod"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded", "refund_pending"], default: "pending", index: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"],
      default: "pending",
      index: true,
    },
    stockReleased: { type: Boolean, default: false },
    razorpayOrderId: { type: String, index: true, sparse: true },
    timeline: [{ status: String, note: String, at: { type: Date, default: Date.now }, _id: false }],
    trackingNumber: String,
    refundAmount: Number,
    refundNote: String,
  },
  opts,
);
orderSchema.index({ createdAt: -1 });
export const Order = model("Order", orderSchema);

/* ---------- Carts ---------- */
const cartSchema = new Schema<Any>(
  {
    user: { type: ObjectId, ref: "User", required: true, unique: true },
    items: [{ productId: String, sku: String, qty: { type: Number, min: 1, max: 20 }, _id: false }],
  },
  opts,
);
export const Cart = model("Cart", cartSchema);

/* ---------- Wishlists ---------- */
const wishlistSchema = new Schema<Any>(
  { user: { type: ObjectId, ref: "User", required: true, unique: true }, products: [{ type: ObjectId, ref: "Product" }] },
  opts,
);
export const Wishlist = model("Wishlist", wishlistSchema);

/* ---------- Coupons ---------- */
const couponSchema = new Schema<Any>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    expiresAt: Date,
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  opts,
);
export const Coupon = model("Coupon", couponSchema);

/* ---------- Reviews ---------- */
const reviewSchema = new Schema<Any>(
  {
    product: { type: ObjectId, ref: "Product", required: true, index: true },
    user: { type: ObjectId, ref: "User", required: true },
    name: String,
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 1500 },
    approved: { type: Boolean, default: true },
  },
  opts,
);
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
export const Review = model("Review", reviewSchema);

/* ---------- Addresses ---------- */
const addressSchema = new Schema<Any>(
  {
    user: { type: ObjectId, ref: "User", required: true, index: true },
    label: { type: String, default: "Home" },
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    isDefault: { type: Boolean, default: false },
  },
  opts,
);
export const Address = model("Address", addressSchema);

/* ---------- Banners ---------- */
const bannerSchema = new Schema<Any>(
  {
    type: { type: String, enum: ["hero", "promo"], required: true, index: true },
    title: { type: String, required: true },
    subtitle: String,
    image: { type: String, default: "" },
    ctaLabel: String,
    ctaLink: String,
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  opts,
);
export const Banner = model("Banner", bannerSchema);

/* ---------- Payments ---------- */
const paymentSchema = new Schema<Any>(
  {
    order: { type: ObjectId, ref: "Order", required: true, index: true },
    method: { type: String, enum: ["razorpay", "cod"] },
    amount: Number,
    status: { type: String, enum: ["created", "paid", "failed", "refunded"], default: "created" },
    razorpayOrderId: { type: String, index: true, sparse: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
  },
  opts,
);
export const Payment = model("Payment", paymentSchema);

/* ---------- Inventory logs ---------- */
const inventoryLogSchema = new Schema<Any>(
  {
    product: { type: ObjectId, ref: "Product", index: true },
    productName: String,
    sku: String,
    change: Number,
    before: Number,
    after: Number,
    reason: { type: String, enum: ["order", "cancel", "return", "manual", "initial"] },
    note: String,
    ref: String,
    by: { type: ObjectId, ref: "User" },
  },
  opts,
);
inventoryLogSchema.index({ createdAt: -1 });
export const InventoryLog = model("InventoryLog", inventoryLogSchema);

/* ---------- Settings (singleton) ---------- */
const settingsSchema = new Schema<Any>(
  {
    key: { type: String, default: "main", unique: true },
    storeName: { type: String, default: "SKY BOUTIQUE" },
    tagline: { type: String, default: "Elegance in Every Thread." },
    announcement: { type: String, default: "Free shipping on orders above ₹2,999 · Use code WELCOME10 for 10% off" },
    whatsappNumber: { type: String, default: "919999999999" },
    contact: { email: { type: String, default: "hello@skyboutique.in" }, phone: { type: String, default: "+91 99999 99999" }, address: { type: String, default: "12, Fashion Street, Chennai, Tamil Nadu 600001" }, hours: { type: String, default: "Mon–Sat, 10:00 – 20:00" } },
    social: { instagram: { type: String, default: "https://instagram.com" }, facebook: { type: String, default: "https://facebook.com" }, youtube: { type: String, default: "" }, pinterest: { type: String, default: "" } },
    about: { title: { type: String, default: "Our Story" }, body: { type: String, default: "SKY BOUTIQUE was born from a love of heritage weaves and modern silhouettes. Every piece is hand-selected for its craftsmanship, drape and the way it makes you feel." } },
    footerText: { type: String, default: "Elegance in Every Thread." },
    testimonials: { type: [{ name: String, city: String, text: String, rating: { type: Number, default: 5 }, _id: false }], default: [] },
    shipping: { flatRate: { type: Number, default: 99 }, freeAbove: { type: Number, default: 2999 } },
    codEnabled: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 5 },
  },
  opts,
);
export const Settings = model("Settings", settingsSchema);

/* ---------- Newsletter ---------- */
const subscriberSchema = new Schema<Any>({ email: { type: String, required: true, unique: true, lowercase: true } }, opts);
export const Subscriber = model("Subscriber", subscriberSchema);

export async function getSettings() {
  const s = await Settings.findOneAndUpdate({ key: "main" }, { $setOnInsert: { key: "main" } }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
  return s;
}

/* ---------- Testimonials (written by an admin; only "approved" ones are shown on the home page) ---------- */
const testimonialSchema = new Schema<Any>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, required: true, trim: true, maxlength: 600 },
    status: { type: String, enum: ["approved", "hidden"], default: "approved", index: true },
  },
  opts,
);
testimonialSchema.index({ status: 1, createdAt: -1 });
export const Testimonial = model("Testimonial", testimonialSchema);
