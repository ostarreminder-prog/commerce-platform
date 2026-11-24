import { getTranslations } from "next-intl/server";
import { AgentsOverview } from "@/features/studio/overview-view";

export async function generateMetadata() {
  const t = await getTranslations("studio");
  return { title: t("title") };
}

export default function AgentsPage() {
  return <AgentsOverview />;
}
