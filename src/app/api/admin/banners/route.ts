import { adminCrud } from "@/lib/admin-crud";
import { Banner } from "@/models";
import { bannerSchema } from "@/validations";

export const { GET, POST } = adminCrud({ model: Banner, schema: bannerSchema, sort: { type: 1, sortOrder: 1 } }).collection;
