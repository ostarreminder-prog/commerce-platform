import { getTranslations } from "next-intl/server";
import { CopilotPage } from "@/features/copilot/copilot-page";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("copilot") };
}

export default function Page() {
  return <CopilotPage />;
}
