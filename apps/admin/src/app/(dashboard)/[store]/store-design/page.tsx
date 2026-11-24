import { getTranslations } from "next-intl/server";
import { StoreDesignView } from "@/features/store-design/store-design-view";

export async function generateMetadata() {
  const t = await getTranslations("storeDesign");
  return { title: t("title") };
}

export default function Page() {
  return <StoreDesignView />;
}
