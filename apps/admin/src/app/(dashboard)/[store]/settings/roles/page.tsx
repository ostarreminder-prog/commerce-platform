import { getTranslations } from "next-intl/server";
import { RolesPanel } from "@/features/settings/roles-panel";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("nav.roles")} · ${t("title")}` };
}

export default function Page() {
  return (
    <SettingsScaffold section="roles">
      <RolesPanel />
    </SettingsScaffold>
  );
}
