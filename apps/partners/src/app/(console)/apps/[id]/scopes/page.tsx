import { ScopesTab } from "@/features/app-detail/scopes-tab";

export default async function ScopesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ScopesTab id={id} />;
}
