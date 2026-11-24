import { ListingTab } from "@/features/app-detail/listing-tab";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingTab id={id} />;
}
