import { getTranslations } from "next-intl/server";
import { GiftCardsScreen } from "@/features/marketing/gift-cards";

export async function generateMetadata() {
  const t = await getTranslations("marketing.giftCards");
  return { title: t("title") };
}

export default function Page() {
  return <GiftCardsScreen />;
}
