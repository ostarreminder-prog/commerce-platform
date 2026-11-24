import { getTranslations } from "next-intl/server";
import { CopilotTasksView } from "@/features/copilot/tasks-view";

export async function generateMetadata() {
  const t = await getTranslations("msg.copilot.tasks");
  return { title: t("title") };
}

export default function Page() {
  return <CopilotTasksView />;
}
