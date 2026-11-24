import { getTranslations } from "next-intl/server";
import { AppStoreView } from "@/features/apps/app-store-view";

export async function generateMetadata() {
  const t = await getTranslations("apps");
  return { title: t("storeTitle") };
}

export default function Page() {
  return <AppStoreView />;
}
