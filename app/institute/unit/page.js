import { redirect } from "next/navigation";

// Old address for a unit's quotes; the study page now lives at /institute.
export default async function Page({ searchParams }) {
  const p = await searchParams;
  const b = parseInt(p?.b, 10), u = parseInt(p?.u, 10);
  redirect(b && u ? `/institute?b=${b}&u=${u}` : "/institute");
}
