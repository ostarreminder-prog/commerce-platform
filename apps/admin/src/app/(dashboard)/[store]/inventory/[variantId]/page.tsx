import { getTranslations } from "next-intl/server";
import { InventoryVariantDetail } from "@/features/catalog/inventory";

export async function generateMetadata() {
  const t = await getTranslations("catalog.inventoryMovements");
  return { title: t("title") };
}

export default function Page() {
  return <InventoryVariantDetail />;
}
