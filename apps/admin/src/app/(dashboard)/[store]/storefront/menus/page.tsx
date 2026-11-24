import { getTranslations } from "next-intl/server";
import { MenusView } from "@/features/storefront/menus/menus-view";

export async function generateMetadata() {
  const t = await getTranslations("storefront.menus");
  return { title: t("title") };
}

export default function Page() {
  return <MenusView />;
}
