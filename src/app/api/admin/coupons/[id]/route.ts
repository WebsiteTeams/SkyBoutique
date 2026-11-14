import { adminCrud } from "@/lib/admin-crud";
import { Coupon } from "@/models";
import { couponSchema } from "@/validations";

const prepare = (d: Record<string, unknown>) => ({ ...d, expiresAt: d.expiresAt ? new Date(d.expiresAt as string) : null });
export const { PUT, DELETE } = adminCrud({ model: Coupon, schema: couponSchema, prepare }).item;
