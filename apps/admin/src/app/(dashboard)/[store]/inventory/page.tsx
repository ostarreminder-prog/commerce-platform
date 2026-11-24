import { getTranslations } from "next-intl/server";
import { InventoryList } from "@/features/catalog/inventory";

export async function generateMetadata() {
  const t = await getTranslations("catalog.inventory");
  return { title: t("title") };
}

export default function Page() {
  return <InventoryList />;
}
