import { getTranslations } from "next-intl/server";
import { DangerPanel } from "@/features/settings/danger-panel";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("nav.danger")} · ${t("title")}` };
}

export default function Page() {
  return (
    <SettingsScaffold section="danger">
      <DangerPanel />
    </SettingsScaffold>
  );
}
