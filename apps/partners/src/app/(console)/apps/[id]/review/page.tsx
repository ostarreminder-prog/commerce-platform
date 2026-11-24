import { ReviewTab } from "@/features/app-detail/review-tab";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReviewTab id={id} />;
}
