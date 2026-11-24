import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { OrdersList } from "@/features/orders/orders-list";

export async function generateMetadata() {
  const t = await getTranslations("sales.orders");
  return { title: t("title") };
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersList />
    </Suspense>
  );
}
