import { adminCrud } from "@/lib/admin-crud";
import { Category, Product } from "@/models";
import { categorySchema } from "@/validations";
import { slugify } from "@/utils";
import { ApiError } from "@/lib/api";

const crud = adminCrud({
  model: Category,
  schema: categorySchema,
  prepare: (d) => ({ ...d, slug: (d.slug as string) || slugify(d.name as string) }),
  beforeDelete: async (id) => {
    const n = await Product.countDocuments({ category: id });
    if (n) throw new ApiError(409, `${n} product(s) use this category. Move or delete them first.`);
  },
});
export const { PUT, DELETE } = crud.item;
