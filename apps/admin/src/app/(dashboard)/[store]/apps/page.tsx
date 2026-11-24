import { getTranslations } from "next-intl/server";
import { AppsView } from "@/features/apps/apps-view";

export async function generateMetadata() {
  const t = await getTranslations("apps");
  return { title: t("title") };
}

export default function Page() {
  return <AppsView />;
}
