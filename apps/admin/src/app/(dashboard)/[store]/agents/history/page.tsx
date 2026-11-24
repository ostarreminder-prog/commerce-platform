import { getTranslations } from "next-intl/server";
import { SessionHistory } from "@/features/studio/ops/history-view";

export async function generateMetadata() {
  const t = await getTranslations("studio");
  return { title: `${t("tabs.history")} · ${t("title")}` };
}

export default function Page() {
  return <SessionHistory />;
}
