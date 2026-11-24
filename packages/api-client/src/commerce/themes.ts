import type {
  Domain, Menu, MenuItem, Page, SeoRedirect, StorefrontSeo, Theme, ThemeShare,
} from "@repo/contracts";
import type {
  PageInput, RedirectInput,
} from "./types";
import { seq, db, find, guard, persistShares, persistStorefront, publishThemeNow, pushVersion, respond, syncRead, tickThemeSchedule, uid, windowActivated } from "./db";

/**
 * Simulated DNS/SSL check — the mock can't query real DNS, so the outcome is
 * deterministic instead of magic: reserved TLDs (.invalid/.test/.local/.example)
 * and hostnames containing "bad" fail the verification stage; everything else
 * verifies, then SSL flips active a beat later. The UI labels this lifecycle
 * as simulated.
 */
const scheduleDomainCheck = (d: Domain) => {
  setTimeout(() => {
    const bad = /\.(invalid|test|local|example)$/.test(d.hostname) || d.hostname.includes("bad");
    d.verificationStatus = bad ? "failed" : "verified";
    persistStorefront();
    if (!bad) {
      setTimeout(() => {
        d.sslStatus = "active";
        persistStorefront();
      }, 1_500);
    }
  }, 3_000);
};

export const themesApi = {
  themes: {
    list: () =>
      syncRead<Theme[]>(() => {
        tickThemeSchedule();
        return db.themes;
      }),
    get: (id: string) => guard<Theme>(() => {
      tickThemeSchedule();
      return find(db.themes, id, "theme");
    }),
    update: (id: string, theme: Partial<Omit<Theme, "id">>) => guard(() => {
      const t = find(db.themes, id, "theme");
      Object.assign(t, theme, { id: t.id, status: "draft" as const });
      persistStorefront();
      return t;
    }),
    publish: (id: string, note = "") => guard(() => {
      tickThemeSchedule();
      const t = find(db.themes, id, "theme");
      /* A pending future schedule wins — the theme stays scheduled until its time. */
      if (t.scheduledPublish && +new Date(t.scheduledPublish.at) > Date.now()) return t;
      publishThemeNow(t, note || "publish");
      persistStorefront();
      return t;
    }),
    /** Set/clear the publish date — the schedule fires on read once `at` passes. */
    schedule: (id: string, at: string | null) => guard(() => {
      const t = find(db.themes, id, "theme");
      t.scheduledPublish = at ? { at } : null;
      persistStorefront();
      return t;
    }),
    /** Set/clear a temporary activation window — flips active on read when it hits. */
    setWindow: (id: string, window: { from: string; to: string } | null) => guard(() => {
      const t = find(db.themes, id, "theme");
      t.activeWindow = window;
      if (!window) windowActivated.delete(id);
      persistStorefront();
      return t;
    }),
    /**
     * Apply another theme's design to the live theme: the active theme's
     * current look is snapshotted as a version first (the "you can go back"
     * promise in the confirm dialog), then the source design replaces it as a
     * draft — the merchant reviews it in the editor and publishes to go live.
     */
    applyAsDraft: (id: string) => guard(() => {
      const src = find(db.themes, id, "theme");
      const target = db.themes.find((x) => x.status === "published" && x.id !== src.id) ?? db.themes.find((x) => x.id !== src.id);
      if (!target) throw new Error("no_target");
      pushVersion(target, "apply_snapshot");
      const design = structuredClone(src);
      Object.assign(target, {
        sections: design.sections,
        globals: design.globals,
        colorSchemes: design.colorSchemes,
        presets: design.presets,
        customTemplates: design.customTemplates,
        pageExperiences: design.pageExperiences,
        features: design.features,
        featureSettings: design.featureSettings,
        status: "draft" as const,
      });
      persistStorefront();
      return target;
    }),
    /** Clone as a new draft — strips schedule/window/versions. */
    duplicate: (id: string) => guard(() => {
      const src = find(db.themes, id, "theme");
      const copy: Theme = {
        ...structuredClone(src),
        id: uid("thm"),
        name: `${src.name} — copy`,
        status: "draft",
        versions: [],
        publishedAt: null,
        scheduledPublish: null,
        activeWindow: null,
      };
      db.themes.push(copy);
      persistStorefront();
      return copy;
    }),
    /** Rename without touching status (update() would demote a published theme). */
    rename: (id: string, name: string) => guard(() => {
      const t = find(db.themes, id, "theme");
      t.name = name;
      persistStorefront();
      return t;
    }),
    /** Delete is draft-only — a live theme can't be removed. */
    remove: (id: string) => guard(() => {
      const t = find(db.themes, id, "theme");
      if (t.status === "published") throw new Error("published");
      db.themes = db.themes.filter((x) => x.id !== id);
      db.themeShares = db.themeShares.filter((s) => s.themeId !== id);
      persistShares();
      persistStorefront();
      return { ok: true as const };
    }),
    /** Import a validated theme payload as a new draft (validation happens client-side). */
    importTheme: (theme: Theme) => guard(() => {
      const copy: Theme = {
        ...structuredClone(theme),
        id: uid("thm"),
        status: "draft",
        versions: [],
        publishedAt: null,
        scheduledPublish: null,
        activeWindow: null,
      };
      db.themes.push(copy);
      persistStorefront();
      return copy;
    }),
  },
  themeShares: {
    list: () => respond<ThemeShare[]>(db.themeShares),
    /** Create a share token for a draft — valid 7 days. */
    create: (themeId: string) => guard(() => {
      find(db.themes, themeId, "theme");
      const share: ThemeShare = {
        id: uid("shr"),
        token: uid("shk"),
        themeId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      db.themeShares.push(share);
      persistShares();
      return share;
    }),
    revoke: (token: string) => guard(() => {
      db.themeShares = db.themeShares.filter((s) => s.token !== token);
      persistShares();
      return { ok: true as const };
    }),
    /** Public resolution for the storefront preview — throws `expired`/`invalid`. */
    resolve: (token: string) => guard<Theme>(() => {
      const share = db.themeShares.find((s) => s.token === token);
      if (!share) throw new Error("invalid");
      if (+new Date(share.expiresAt) <= Date.now()) throw new Error("expired");
      return find(db.themes, share.themeId, "theme");
    }),
  },
  pages: {
    list: () => syncRead<Page[]>(() => db.pages),
    get: (id: string) => guard<Page>(() => find(db.pages, id, "page")),
    create: (input: PageInput) => guard(() => {
      if (!input.title.ar.trim() || !input.slug.trim()) throw new Error("required");
      if (db.pages.some((p) => p.slug === input.slug)) throw new Error("slug_taken");
      const p: Page = {
        id: uid("page"), title: input.title, slug: input.slug, content: input.content,
        seo: input.seo, status: input.status, showInMenu: input.showInMenu, templateId: input.templateId ?? null,
      };
      db.pages.push(p);
      persistStorefront();
      return p;
    }),
    update: (id: string, input: PageInput) => guard(() => {
      const p = find(db.pages, id, "page");
      if (db.pages.some((x) => x.id !== id && x.slug === input.slug)) throw new Error("slug_taken");
      Object.assign(p, { title: input.title, slug: input.slug, content: input.content, seo: input.seo, status: input.status, showInMenu: input.showInMenu, templateId: input.templateId ?? null });
      persistStorefront();
      return p;
    }),
    remove: (id: string) => guard(() => {
      find(db.pages, id, "page");
      db.pages = db.pages.filter((p) => p.id !== id);
      persistStorefront();
      return { ok: true as const };
    }),
  },
  menus: {
    list: () => syncRead<Menu[]>(() => db.menus),
    /** Create an extra menu for a location (header/footer). */
    create: (location: Menu["location"]) => guard(() => {
      const m: Menu = { id: uid("menu"), location, items: [] };
      db.menus.push(m);
      persistStorefront();
      return m;
    }),
    update: (id: string, items: MenuItem[]) => guard(() => {
      const m = find(db.menus, id, "menu");
      m.items = items;
      persistStorefront();
      return m;
    }),
    remove: (id: string) => guard(() => {
      const m = find(db.menus, id, "menu");
      /* Keep at least one menu per location — chrome needs a fallback. */
      if (db.menus.filter((x) => x.location === m.location).length <= 1) throw new Error("last_menu");
      db.menus = db.menus.filter((x) => x.id !== id);
      persistStorefront();
      return { ok: true as const };
    }),
  },
  domains: {
    list: () => syncRead<Domain[]>(() => db.domains),
    add: (hostname: string) => guard(() => {
      const host = hostname.trim().toLowerCase();
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) throw new Error("hostname");
      if (db.domains.some((d) => d.hostname === host)) throw new Error("taken");
      const labels = host.split(".");
      const sub = labels.length > 2 ? (labels[0] ?? "@") : "@";
      const dnsRecords: Domain["dnsRecords"] = [
        sub === "@" ? { type: "A", name: "@", value: "76.76.21.21" } : { type: "CNAME", name: sub, value: "stores.store.sa" },
        { type: "TXT", name: sub === "@" ? "_store-verify" : `_store-verify.${sub}`, value: `store-verify=${host.slice(0, 12)}-${(seq * 7).toString(16)}` },
      ];
      const d: Domain = { id: uid("dom"), hostname: host, type: "custom", verificationStatus: "pending", sslStatus: "pending", dnsRecords, isPrimary: db.domains.length === 0 };
      db.domains.push(d);
      persistStorefront();
      scheduleDomainCheck(d);
      return d;
    }),
    verify: (id: string) => guard(() => {
      const d = find(db.domains, id, "domain");
      d.verificationStatus = "pending";
      d.sslStatus = "pending";
      persistStorefront();
      scheduleDomainCheck(d);
      return d;
    }),
    setPrimary: (id: string) => guard(() => {
      const d = find(db.domains, id, "domain");
      if (d.verificationStatus !== "verified") throw new Error("unverified");
      db.domains.forEach((x) => { x.isPrimary = x.id === id; });
      persistStorefront();
      return d;
    }),
    remove: (id: string) => guard(() => {
      const d = find(db.domains, id, "domain");
      if (d.type === "subdomain") throw new Error("default_domain");
      db.domains = db.domains.filter((x) => x.id !== id);
      persistStorefront();
      return { ok: true as const };
    }),
  },
  seo: {
    get: () => syncRead<StorefrontSeo>(() => db.storefrontSeo),
    save: (input: StorefrontSeo) => guard(() => {
      Object.assign(db.storefrontSeo, input);
      persistStorefront();
      return db.storefrontSeo;
    }),
    redirects: () => syncRead<SeoRedirect[]>(() => db.seoRedirects),
    addRedirect: (input: RedirectInput) => guard(() => {
      const from = input.from.trim();
      const to = input.to.trim();
      if (!from.startsWith("/") || !to.startsWith("/")) throw new Error("path");
      if (db.seoRedirects.some((r) => r.from === from)) throw new Error("taken");
      const r: SeoRedirect = { id: uid("red"), from, to, createdAt: new Date().toISOString() };
      db.seoRedirects.unshift(r);
      persistStorefront();
      return r;
    }),
    removeRedirect: (id: string) => guard(() => {
      db.seoRedirects = db.seoRedirects.filter((r) => r.id !== id);
      persistStorefront();
      return { ok: true as const };
    }),
  },
};
