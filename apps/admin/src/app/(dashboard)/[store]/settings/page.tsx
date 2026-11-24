import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ store: string }> }) {
  const { store } = await params;
  redirect(`/${store}/settings/general`);
}
