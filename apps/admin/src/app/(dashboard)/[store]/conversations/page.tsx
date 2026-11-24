import { redirect } from "next/navigation";

export default async function Page({ params, searchParams }: { params: Promise<{ store: string }>; searchParams: Promise<Record<string, string>> }) {
  const { store } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams(sp).toString();
  redirect(`/${store}/inbox${qs ? `?${qs}` : ""}`);
}
