import { adminCrud } from "@/lib/admin-crud";
import { Banner } from "@/models";
import { bannerSchema } from "@/validations";

export const { PUT, DELETE } = adminCrud({ model: Banner, schema: bannerSchema }).item;
