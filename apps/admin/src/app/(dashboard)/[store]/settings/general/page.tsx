import { getTranslations } from "next-intl/server";
import { GeneralPanel } from "@/features/settings/general-panel";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("nav.general")} · ${t("title")}` };
}

export default function Page() {
  return (
    <SettingsScaffold section="general">
      <GeneralPanel />
    </SettingsScaffold>
  );
}
