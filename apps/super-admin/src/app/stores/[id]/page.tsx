import { StoreDetailView } from "@/features/store-detail/store-detail-view";

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoreDetailView id={id} />;
}
