import { adminCrud } from "@/lib/admin-crud";
import { Testimonial } from "@/models";
import { testimonialPatchSchema } from "@/validations";

// Full edit or a quick status-only change (show / hide) — only the fields sent are updated.
const crud = adminCrud({ model: Testimonial, schema: testimonialPatchSchema });
export const { PUT, DELETE } = crud.item;
