import { getTranslations } from "next-intl/server";
import { CopilotSettingsPanel } from "@/features/settings/copilot-settings";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";

export async function generateMetadata() {
  const t = await getTranslations("msg.copilot.settings");
  return { title: t("title") };
}

export default function Page() {
  return (
    <SettingsScaffold section="copilot">
      <CopilotSettingsPanel />
    </SettingsScaffold>
  );
}
