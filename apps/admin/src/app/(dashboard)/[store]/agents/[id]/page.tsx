import { AgentDetailView } from "@/features/studio/agent-detail-view";

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AgentDetailView id={id} />;
}
