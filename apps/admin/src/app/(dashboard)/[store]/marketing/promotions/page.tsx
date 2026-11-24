import { getTranslations } from "next-intl/server";
import { PromotionsList } from "@/features/marketing/promotions";

export async function generateMetadata() {
  const t = await getTranslations("marketing.promotions");
  return { title: t("title") };
}

export default function Page() {
  return <PromotionsList />;
}
