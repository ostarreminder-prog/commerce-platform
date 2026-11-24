import { getTranslations } from "next-intl/server";
import { LiveMonitor } from "@/features/studio/ops/live-view";

export async function generateMetadata() {
  const t = await getTranslations("studio");
  return { title: `${t("tabs.live")} · ${t("title")}` };
}

export default function Page() {
  return <LiveMonitor />;
}
