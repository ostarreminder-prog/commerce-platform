import { getTranslations } from "next-intl/server";
import { CouponsList } from "@/features/marketing/coupons";

export async function generateMetadata() {
  const t = await getTranslations("marketing.coupons");
  return { title: t("title") };
}

export default function Page() {
  return <CouponsList />;
}
