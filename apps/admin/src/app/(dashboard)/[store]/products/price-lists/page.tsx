import { getTranslations } from "next-intl/server";
import { PriceListsScreen } from "@/features/catalog/price-lists";

export async function generateMetadata() {
  const t = await getTranslations("catalog.priceLists");
  return { title: t("title") };
}

export default function Page() {
  return <PriceListsScreen />;
}
