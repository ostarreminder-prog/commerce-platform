import { getTranslations } from "next-intl/server";
import { CopilotHistoryView } from "@/features/copilot/history-view";

export async function generateMetadata() {
  const t = await getTranslations("msg.copilot.historyPage");
  return { title: t("title") };
}

export default function Page() {
  return <CopilotHistoryView />;
}
