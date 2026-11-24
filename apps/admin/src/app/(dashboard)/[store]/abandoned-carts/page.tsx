import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AbandonedCartsList } from "@/features/orders/abandoned-carts";

export async function generateMetadata() {
  const t = await getTranslations("sales.carts");
  return { title: t("title") };
}

export default function Page() {
  return (
    <Suspense>
      <AbandonedCartsList />
    </Suspense>
  );
}
