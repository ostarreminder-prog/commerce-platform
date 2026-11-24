import { getTranslations } from "next-intl/server";
import { ShippingView } from "@/features/shipping/shipping-view";

export async function generateMetadata() {
  const t = await getTranslations("shipping");
  return { title: t("title") };
}

export default function Page() {
  return <ShippingView />;
}
