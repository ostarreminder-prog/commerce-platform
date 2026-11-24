import { SettingsTab } from "@/features/app-detail/settings-tab";

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SettingsTab id={id} />;
}
