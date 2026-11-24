import { getTranslations } from "next-intl/server";
import { ChannelsView } from "@/features/studio/ops/channels-view";

export async function generateMetadata() {
  const t = await getTranslations("studio");
  return { title: `${t("tabs.channels")} · ${t("title")}` };
}

export default function Page() {
  return <ChannelsView />;
}
