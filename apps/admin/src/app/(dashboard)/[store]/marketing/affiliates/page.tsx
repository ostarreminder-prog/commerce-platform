import { getTranslations } from "next-intl/server";
import { AffiliatesScreen } from "@/features/marketing/affiliates";

export async function generateMetadata() {
  const t = await getTranslations("marketing.affiliates");
  return { title: t("title") };
}

export default function Page() {
  return <AffiliatesScreen />;
}
