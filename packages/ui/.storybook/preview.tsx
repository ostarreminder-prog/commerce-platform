import type { Preview } from "@storybook/react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import * as React from "react";
import ar from "../src/messages/ar.json";
import en from "../src/messages/en.json";
import "../src/styles/globals.css";

const messages = { ar, en } as const;

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    backgrounds: { disable: true },
  },
  globalTypes: {
    locale: {
      name: "Locale",
      defaultValue: "ar",
      toolbar: {
        icon: "globe",
        items: [
          { value: "ar", title: "العربية (RTL)", right: "ar" },
          { value: "en", title: "English (LTR)", right: "en" },
        ],
      },
    },
    theme: {
      name: "Theme",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
  decorators: [
    (Story, ctx) => {
      const locale = (ctx.globals.locale as "ar" | "en") ?? "ar";
      const theme = (ctx.globals.theme as "light" | "dark") ?? "light";
      React.useEffect(() => {
        document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = locale;
        document.documentElement.classList.toggle("dark", theme === "dark");
      }, [locale, theme]);
      return (
        <NextIntlClientProvider locale={locale} messages={messages[locale]}>
          <ThemeProvider attribute="class" forcedTheme={theme}>
            <Story />
          </ThemeProvider>
        </NextIntlClientProvider>
      );
    },
  ],
};
export default preview;
