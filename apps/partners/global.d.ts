import type uiMessages from "@repo/ui/messages/ar.json";
import type appMessages from "./messages/ar.json";
import type { Locale } from "@repo/ui/lib/format";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof uiMessages & typeof appMessages;
  }
}
