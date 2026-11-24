import { getTranslations } from "next-intl/server";
import { RegionalPanel } from "@/features/settings/regional-panel";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("nav.regional")} · ${t("title")}` };
}

export default function Page() {
  return (
    <SettingsScaffold section="regional">
      <RegionalPanel />
    </SettingsScaffold>
  );
}
