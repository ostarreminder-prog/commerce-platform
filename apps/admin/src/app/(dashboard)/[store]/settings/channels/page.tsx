import { getTranslations } from "next-intl/server";
import { ChannelsPanel } from "@/features/settings/channels-panel";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("nav.channels")} · ${t("title")}` };
}

export default function Page() {
  return (
    <SettingsScaffold section="channels">
      <ChannelsPanel />
    </SettingsScaffold>
  );
}
