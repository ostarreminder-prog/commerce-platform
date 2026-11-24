import { InstallationDetail } from "@/features/apps/installation-detail";

export default async function Page({ params }: { params: Promise<{ installationId: string }> }) {
  const { installationId } = await params;
  return <InstallationDetail installationId={installationId} />;
}
