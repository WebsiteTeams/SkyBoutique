import { z } from "zod";

const str = (max = 200) => z.string().trim().max(max);
// strip angle brackets as basic sanitisation — React escapes output anyway
const clean = (max = 200) => str(max).transform((s) => s.replace(/[<>]/g, ""));

export const phoneSchema = z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");
export const pinSchema = z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code");
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(100).regex(/[A-Za-z]/, "Include a letter").regex(/\d/, "Include a number");

export const registerSchema = z.object({
  name: clean(100).pipe(z.string().min(2, "Enter your name")),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: phoneSchema.optional().or(z.literal("")),
  password: passwordSchema,
});
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(100) });
export const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email() });
export const resetSchema = z.object({ token: z.string().min(20).max(200), password: passwordSchema });
export const profileSchema = z.object({
  name: clean(100).pipe(z.string().min(2)),
  phone: phoneSchema.optional().or(z.literal("")),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional().or(z.literal("")),
});

export const addressSchema = z.object({
  label: clean(30).optional(),
  name: clean(100).pipe(z.string().min(2, "Enter name")),
  phone: phoneSchema,
  address: clean(300).pipe(z.string().min(5, "Enter address")),
  city: clean(80).pipe(z.string().min(2, "Enter city")),
  state: clean(80).pipe(z.string().min(2, "Enter state")),
  pincode: pinSchema,
  isDefault: z.boolean().optional(),
});

export const cartLineSchema = z.object({
  productId: z.string().min(1).max(40),
  sku: z.string().min(1).max(60),
  qty: z.number().int().min(1).max(20),
});
export const pricingSchema = z.object({ items: z.array(cartLineSchema).max(50), coupon: z.string().trim().max(30).optional() });

export const checkoutSchema = z.object({
  items: z.array(cartLineSchema).min(1, "Your cart is empty").max(50),
  coupon: z.string().trim().max(30).optional(),
  paymentMethod: z.enum(["razorpay", "cod"]),
  customer: z.object({
    name: clean(100).pipe(z.string().min(2, "Enter your full name")),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    phone: phoneSchema,
  }),
  shippingAddress: z.object({
    address: clean(300).pipe(z.string().min(5, "Enter your address")),
    city: clean(80).pipe(z.string().min(2, "Enter city")),
    state: clean(80).pipe(z.string().min(2, "Enter state")),
    pincode: pinSchema,
  }),
});

export const verifyPaymentSchema = z.object({
  orderNumber: z.string().min(5).max(40),
  razorpay_order_id: z.string().min(5).max(100),
  razorpay_payment_id: z.string().min(5).max(100),
  razorpay_signature: z.string().min(10).max(200),
});

export const productSchema = z
  .object({
    name: clean(200).pipe(z.string().min(2)),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers, hyphens").optional(),
    description: z.string().max(5000).default(""),
    category: z.string().min(1, "Select a category"),
    price: z.number().min(1, "Enter a price").max(10_000_000),
    salePrice: z.number().min(0).max(10_000_000).nullish(),
    images: z.array(z.string().max(500)).max(10).default([]),
    colors: z.array(z.object({ name: clean(40).pipe(z.string().min(1)), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) })).max(20).default([]),
    sizes: z.array(clean(20)).max(20).default([]),
    variants: z
      .array(z.object({ sku: clean(60).pipe(z.string().min(1)), size: clean(20).pipe(z.string().min(1)), color: clean(40).pipe(z.string().min(1)), stock: z.number().int().min(0).max(100000) }))
      .max(200)
      .default([]),
    fabric: clean(200).default(""),
    specifications: z.array(z.object({ key: clean(60), value: clean(200) })).max(30).default([]),
    featured: z.boolean().default(false),
    bestseller: z.boolean().default(false),
    trending: z.boolean().default(false),
    published: z.boolean().default(true),
  })
  .refine((p) => !p.salePrice || p.salePrice < p.price, { message: "Sale price must be lower than regular price", path: ["salePrice"] })
  .refine((p) => new Set(p.variants.map((v) => v.sku.toUpperCase())).size === p.variants.length, { message: "Variant SKUs must be unique", path: ["variants"] });

export const categorySchema = z.object({
  name: clean(80).pipe(z.string().min(2)),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
  description: clean(500).default(""),
  image: z.string().max(500).default(""),
  visible: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const couponSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "3–30 letters, numbers, - or _"),
    type: z.enum(["percent", "fixed"]),
    value: z.number().positive(),
    minOrder: z.number().min(0).default(0),
    maxDiscount: z.number().min(0).default(0),
    expiresAt: z.string().nullish(),
    usageLimit: z.number().int().min(0).default(0),
    active: z.boolean().default(true),
  })
  .refine((c) => c.type !== "percent" || c.value <= 100, { message: "Percentage cannot exceed 100", path: ["value"] });

export const bannerSchema = z.object({
  type: z.enum(["hero", "promo"]),
  title: clean(150).pipe(z.string().min(1)),
  subtitle: clean(300).optional(),
  image: z.string().max(500).default(""),
  ctaLabel: clean(40).optional(),
  ctaLink: z.string().max(300).optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"] as const;
export const orderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded", "refund_pending"]).optional(),
  trackingNumber: clean(60).optional(),
  note: clean(300).optional(),
  refundAmount: z.number().min(0).optional(),
});

export const stockAdjustSchema = z.object({
  productId: z.string(),
  sku: z.string(),
  mode: z.enum(["set", "add"]),
  quantity: z.number().int().min(-100000).max(100000),
  note: clean(200).optional(),
});

export const settingsSchema = z.object({
  storeName: clean(80).optional(),
  tagline: clean(150).optional(),
  announcement: clean(200).optional(),
  whatsappNumber: z.string().regex(/^\+?\d[\d\s-]{7,16}$/, "Enter a valid WhatsApp number").optional(),
  contact: z.object({ email: z.string().email().or(z.literal("")), phone: clean(40), address: clean(300), hours: clean(100) }).partial().optional(),
  social: z.object({ instagram: z.string().max(300), facebook: z.string().max(300), youtube: z.string().max(300), pinterest: z.string().max(300) }).partial().optional(),
  about: z.object({ title: clean(100), body: z.string().max(5000) }).partial().optional(),
  footerText: clean(300).optional(),
  testimonials: z.array(z.object({ name: clean(80), city: clean(80), text: clean(500), rating: z.number().min(1).max(5) })).max(20).optional(),
  shipping: z.object({ flatRate: z.number().min(0), freeAbove: z.number().min(0) }).optional(),
  codEnabled: z.boolean().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export const reviewSchema = z.object({ rating: z.number().int().min(1).max(5), comment: clean(1500).optional() });
export const newsletterSchema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email") });

export const testimonialSchema = z.object({
  name: clean(80).pipe(z.string().min(2, "Enter the customer's name")),
  city: clean(80).optional().default(""),
  rating: z.number().int().min(1).max(5),
  text: clean(600).pipe(z.string().min(10, "Please write at least 10 characters")),
  status: z.enum(["approved", "hidden"]).default("approved"),
});

/** For updates: every field optional and NO defaults, so a status-only change never overwrites other fields. */
export const testimonialPatchSchema = z
  .object({
    name: clean(80).pipe(z.string().min(2, "Enter the customer's name")),
    city: clean(80),
    rating: z.number().int().min(1).max(5),
    text: clean(600).pipe(z.string().min(10, "Please write at least 10 characters")),
    status: z.enum(["approved", "hidden"]),
  })
  .partial();
