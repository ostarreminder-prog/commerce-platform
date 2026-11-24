import { AppReviewDetail } from "@/features/apps-review/app-review-detail";

export default async function AppReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppReviewDetail id={id} />;
}
