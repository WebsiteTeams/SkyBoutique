/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Model } from "mongoose";
import type { ZodType } from "zod";
import { route, body, ok, ApiError, paging, query } from "./api";
import { connectDB } from "./mongodb";
import { requireAdmin } from "./auth";
import { toJSON } from "@/utils";

/** Small factory for simple admin-only CRUD collections (categories, banners, coupons). */
export function adminCrud<T>(opts: {
  model: Model<T>;
  schema: ZodType<Record<string, unknown>>;
  sort?: Record<string, 1 | -1>;
  prepare?: (data: Record<string, unknown>, existingId?: string) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeDelete?: (id: string) => Promise<void>;
  filter?: (sp: URLSearchParams) => Record<string, unknown>;
}) {
  const { model, schema, sort = { createdAt: -1 }, prepare, beforeDelete, filter } = opts;
  return {
    collection: {
      GET: route(async (req) => {
        await requireAdmin();
        await connectDB();
        const sp = query(req);
        const { page, limit, skip } = paging(sp, 50);
        const f = filter?.(sp) ?? {};
        const [items, total] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (model as any).find(f).sort(sort).skip(skip).limit(limit).lean(),
          model.countDocuments(f),
        ]);
        return ok({ items: toJSON(items), total, page, pages: Math.ceil(total / limit) });
      }),
      POST: route(async (req) => {
        await requireAdmin();
        let data = await body(req, schema);
        await connectDB();
        if (prepare) data = await prepare(data);
        return ok({ item: toJSON(await (model as any).create(data)) }, 201);
      }),
    },
    item: {
      PUT: route(async (req, ctx) => {
        await requireAdmin();
        const { id } = await ctx.params;
        let data = await body(req, schema);
        await connectDB();
        if (prepare) data = await prepare(data, id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = await (model as any).findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true });
        if (!doc) throw new ApiError(404, "Not found");
        return ok({ item: toJSON(doc) });
      }),
      DELETE: route(async (_req, ctx) => {
        await requireAdmin();
        const { id } = await ctx.params;
        await connectDB();
        if (beforeDelete) await beforeDelete(id);
        await model.findByIdAndDelete(id);
        return ok();
      }),
    },
  };
}
