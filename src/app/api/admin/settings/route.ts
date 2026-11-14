import { route, body, ok } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { Settings } from "@/models";
import { settingsSchema } from "@/validations";
import { getPublicSettings } from "@/services/settings";

export const GET = route(async () => {
  await requireAdmin();
  await connectDB();
  return ok(await getPublicSettings());
});

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  return Object.entries(obj).reduce<Record<string, unknown>>((acc, [k, v]) => {
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(acc, flatten(v as Record<string, unknown>, `${prefix}${k}.`));
    else if (v !== undefined) acc[`${prefix}${k}`] = v;
    return acc;
  }, {});
}

export const PUT = route(async (req) => {
  await requireAdmin();
  const d = await body(req, settingsSchema);
  await connectDB();
  await Settings.updateOne({ key: "main" }, { $set: flatten(d) }, { upsert: true });
  return ok(await getPublicSettings());
});
