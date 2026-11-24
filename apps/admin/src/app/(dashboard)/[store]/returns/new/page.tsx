import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { NewReturn } from "@/features/orders/new-return";

export async function generateMetadata() {
  const t = await getTranslations("sales.newReturn");
  return { title: t("title") };
}

export default function Page() {
  return (
    <Suspense>
      <NewReturn />
    </Suspense>
  );
}
