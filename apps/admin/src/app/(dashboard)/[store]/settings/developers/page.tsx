import { getTranslations } from "next-intl/server";
import { DevelopersPanel } from "@/features/settings/developers-panel";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("nav.developers")} · ${t("title")}` };
}

export default function Page() {
  return (
    <SettingsScaffold section="developers">
      <DevelopersPanel />
    </SettingsScaffold>
  );
}
