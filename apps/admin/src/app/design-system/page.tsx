import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@repo/ui/components/locale-switcher";
import { PageHeader } from "@repo/ui/components/page-header";
import { ThemeToggle } from "@repo/ui/components/theme-toggle";
import { setLocale } from "@/actions/locale";
import { BadgesDemo } from "./_components/badges-demo";
import { ButtonsDemo } from "./_components/buttons-demo";
import { CardsDemo } from "./_components/cards-demo";
import { ColorTokens } from "./_components/color-tokens";
import { DS_SECTIONS, DsSection } from "./_components/ds-section";
import { FormDemo } from "./_components/form-demo";
import { MiscDemo } from "./_components/misc-demo";
import { MoneyDemo } from "./_components/money-demo";
import { OverlaysDemo } from "./_components/overlays-demo";
import { StatesDemo } from "./_components/states-demo";
import { TableDemo } from "./_components/table-demo";
import { Typography } from "./_components/typography";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("designSystem");
  return { title: t("title") };
}

export default async function DesignSystemPage() {
  const t = await getTranslations("designSystem");
  return (
    <div className="container py-8 lg:py-12">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <LocaleSwitcher onLocaleChange={setLocale} />
            <ThemeToggle />
          </>
        }
      />
      <div className="mt-10 grid gap-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <nav aria-label={t("toc")} className="hidden lg:block">
          <div className="sticky top-8 space-y-1">
            <p className="text-muted-foreground mb-2 text-xs font-semibold">{t("toc")}</p>
            {DS_SECTIONS.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground block rounded-md px-3 py-1.5 text-sm transition-colors"
              >
                {t(`sections.${id}.title`)}
              </a>
            ))}
          </div>
        </nav>
        <main className="min-w-0 space-y-10">
          <DsSection id="colors">
            <ColorTokens />
          </DsSection>
          <DsSection id="typography">
            <Typography />
          </DsSection>
          <DsSection id="buttons">
            <ButtonsDemo />
          </DsSection>
          <DsSection id="badges">
            <BadgesDemo />
          </DsSection>
          <DsSection id="forms">
            <FormDemo />
          </DsSection>
          <DsSection id="money">
            <MoneyDemo />
          </DsSection>
          <DsSection id="cards">
            <CardsDemo />
          </DsSection>
          <DsSection id="states">
            <StatesDemo />
          </DsSection>
          <DsSection id="table">
            <TableDemo />
          </DsSection>
          <DsSection id="overlays">
            <OverlaysDemo />
          </DsSection>
          <DsSection id="misc">
            <MiscDemo />
          </DsSection>
        </main>
      </div>
    </div>
  );
}
