import { route, ok, ApiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

export const POST = route(
  async (req) => {
    await requireAdmin();
    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File).slice(0, 10);
    if (!files.length) throw new ApiError(400, "No files provided");
    const urls: string[] = [];
    for (const f of files) {
      try {
        urls.push(await uploadImage(f));
      } catch (e) {
        throw new ApiError(400, e instanceof Error ? e.message : "Upload failed");
      }
    }
    return ok({ urls });
  },
  { limit: 30 },
);
