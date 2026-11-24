import { PlanDetailView } from "@/features/plans/plan-detail-view";

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlanDetailView id={id} />;
}
