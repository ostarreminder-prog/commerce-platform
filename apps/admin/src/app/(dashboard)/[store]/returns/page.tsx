import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ReturnsList } from "@/features/orders/returns";

export async function generateMetadata() {
  const t = await getTranslations("sales.returns");
  return { title: t("title") };
}

export default function Page() {
  return (
    <Suspense>
      <ReturnsList />
    </Suspense>
  );
}
