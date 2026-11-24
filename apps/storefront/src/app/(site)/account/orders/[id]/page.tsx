import { OrderTrackView } from "@/features/order/order-track-view";

export default async function AccountOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderTrackView token={id} confirmation={false} />;
}
