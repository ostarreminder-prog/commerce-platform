import { getTranslations } from "next-intl/server";
import { CustomerProfile } from "@/features/customers/customers";

export async function generateMetadata() {
  const t = await getTranslations("customers.profile");
  return { title: t("title") };
}

export default function Page() {
  return <CustomerProfile />;
}
