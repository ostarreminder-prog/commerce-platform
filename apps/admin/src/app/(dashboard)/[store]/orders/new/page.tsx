import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { NewOrder } from "@/features/orders/new-order";

export async function generateMetadata() {
  const t = await getTranslations("sales.newOrder");
  return { title: t("title") };
}

export default function NewOrderPage() {
  return (
    <Suspense>
      <NewOrder />
    </Suspense>
  );
}
