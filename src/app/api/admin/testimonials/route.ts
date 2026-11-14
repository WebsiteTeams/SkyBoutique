import { adminCrud } from "@/lib/admin-crud";
import { Testimonial } from "@/models";
import { testimonialSchema } from "@/validations";

const crud = adminCrud({
  model: Testimonial,
  schema: testimonialSchema,
  filter: (sp) => {
    const s = sp.get("status");
    return s === "approved" || s === "hidden" ? { status: s } : {};
  },
});
export const { GET, POST } = crud.collection;
