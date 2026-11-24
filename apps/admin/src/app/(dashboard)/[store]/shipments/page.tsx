import { getTranslations } from "next-intl/server";
import { ShipmentsView } from "@/features/shipments/shipments-view";

export async function generateMetadata() {
  const t = await getTranslations("shipments");
  return { title: t("title") };
}

export default function Page() {
  return <ShipmentsView />;
}
