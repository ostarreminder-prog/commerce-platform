import { AppDetail } from "@/features/apps/app-detail";

export default async function Page({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  return <AppDetail appId={appId} />;
}
