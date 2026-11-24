import { OrderTrackView } from "@/features/order/order-track-view";

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <OrderTrackView token={token} />;
}
