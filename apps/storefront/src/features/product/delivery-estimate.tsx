"use client";

import * as React from "react";
import { Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { SAUDI_CITIES } from "@repo/contracts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useStoreFeatures } from "@/lib/features";

const CITY_KEY = "nakhla-city";

/** City → [min, max] delivery days fixture (maps to the store's shipping zones). */
const CITY_DAYS: Record<string, [number, number]> = {
  الرياض: [1, 2],
  جدة: [2, 3],
  "مكة المكرمة": [2, 3],
  "المدينة المنورة": [2, 4],
  الدمام: [2, 3],
  الخبر: [2, 3],
  الظهران: [2, 3],
  القطيف: [2, 4],
};
const DEFAULT_DAYS: [number, number] = [3, 5];

const dayLabel = (offset: number, locale: string) =>
  new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { weekday: "long" }).format(
    new Date(Date.now() + offset * 86_400_000),
  );

/** "يوصلك بين {day} و{day}" + a persisted city select (geolocate is stubbed to the saved/default city). */
export function DeliveryEstimate() {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { on } = useStoreFeatures();
  const [city, setCity] = React.useState<string>("الرياض");

  React.useEffect(() => {
    /* TODO(geolocation): resolve the visitor's city via geo-IP; until then we
     * restore the persisted choice (default الرياض). */
    const saved = localStorage.getItem(CITY_KEY);
    if (saved && (SAUDI_CITIES as readonly string[]).includes(saved)) setCity(saved);
  }, []);

  const pick = (c: string) => {
    setCity(c);
    localStorage.setItem(CITY_KEY, c);
  };

  if (!on("deliveryEstimate")) return null;
  const [from, to] = CITY_DAYS[city] ?? DEFAULT_DAYS;

  return (
    <div className="space-y-2 rounded-lg border p-3 text-sm">
      <div className="flex items-center gap-2">
        <Truck className="text-primary size-4 shrink-0" aria-hidden />
        <span>{t("deliveryBetween", { from: dayLabel(from, locale), to: dayLabel(to, locale) })}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">{t("deliveryCity")}</span>
        <Select value={city} onValueChange={pick}>
          <SelectTrigger className="h-8 w-36" aria-label={t("chooseCity")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SAUDI_CITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
