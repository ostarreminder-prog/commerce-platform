import { getTranslations } from "next-intl/server";

const TOKENS = [
  { key: "primary", bg: "bg-primary", fg: "text-primary-foreground" },
  { key: "secondary", bg: "bg-secondary", fg: "text-secondary-foreground" },
  { key: "muted", bg: "bg-muted", fg: "text-muted-foreground" },
  { key: "accent", bg: "bg-accent", fg: "text-accent-foreground" },
  { key: "destructive", bg: "bg-destructive", fg: "text-destructive-foreground" },
  { key: "success", bg: "bg-success", fg: "text-success-foreground" },
  { key: "warning", bg: "bg-warning", fg: "text-warning-foreground" },
  { key: "info", bg: "bg-info", fg: "text-info-foreground" },
  { key: "background", bg: "bg-background border", fg: "text-foreground" },
  { key: "card", bg: "bg-card border", fg: "text-card-foreground" },
  { key: "border", bg: "bg-border", fg: "text-foreground" },
] as const;

export async function ColorTokens() {
  const t = await getTranslations("designSystem.colors");
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {TOKENS.map((token) => (
        <li key={token.key} className="overflow-hidden rounded-lg border">
          <div className={`flex h-20 items-end p-3 ${token.bg} ${token.fg}`}>
            <span className="text-sm font-medium">{t(token.key)}</span>
          </div>
          <div className="bg-card px-3 py-2">
            <code dir="ltr" className="text-muted-foreground text-xs">
              --{token.key}
            </code>
          </div>
        </li>
      ))}
    </ul>
  );
}
