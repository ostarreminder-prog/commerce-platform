import { getTranslations } from "next-intl/server";
import { LocationsScreen } from "@/features/catalog/locations";

export async function generateMetadata() {
  const t = await getTranslations("catalog.locations");
  return { title: t("title") };
}

export default function Page() {
  return <LocationsScreen />;
}
