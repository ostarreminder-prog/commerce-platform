import { AnalyticsTab } from "@/features/app-detail/analytics-tab";

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AnalyticsTab id={id} />;
}
