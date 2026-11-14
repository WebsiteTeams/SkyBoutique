import { Testimonial } from "@/models";
import { connectDB } from "@/lib/mongodb";
import { toJSON } from "@/utils";

export type PublicTestimonial = { _id: string; name: string; city: string; text: string; rating: number };

/** Only admin-approved testimonials are ever returned to the storefront. */
export async function listApprovedTestimonials(limit = 12): Promise<PublicTestimonial[]> {
  await connectDB();
  const rows = await Testimonial.find({ status: "approved" }).sort({ createdAt: -1 }).limit(limit).select("name city text rating").lean();
  return toJSON(rows) as PublicTestimonial[];
}
