import { getTranslations } from "next-intl/server";
import { LoyaltyScreen } from "@/features/marketing/loyalty";

export async function generateMetadata() {
  const t = await getTranslations("marketing.loyalty");
  return { title: t("title") };
}

export default function Page() {
  return <LoyaltyScreen />;
}
