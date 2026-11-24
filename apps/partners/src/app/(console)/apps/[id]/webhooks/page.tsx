import { WebhooksTab } from "@/features/app-detail/webhooks-tab";

export default async function WebhooksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WebhooksTab id={id} />;
}
