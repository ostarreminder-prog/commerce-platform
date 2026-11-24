# قواعد المشروع — Commerce Platform

Monorepo (pnpm + turbo) لمنصة تجارة إلكترونية سعودية — frontend فقط، بيانات mock داخل المتصفح عبر `@repo/api-client`.

## البنية

- `apps/admin` — لوحة التاجر · `apps/storefront` — المتجر · `apps/super-admin` — الإدارة العليا · `apps/partners` — بوابة المطورين
- ميزات كل تطبيق في `src/features/<feature>/`؛ مكوّناته المشتركة بين شاشتين+ تبقى في `src/components/`
- `packages/ui` — نظام التصميم + الترجمات المشتركة (`src/messages/{ar,en}.json`)
- `packages/contracts` — الأنواع · `packages/mocks` — البيانات · `packages/api-client` — طبقة الـ API (react-query)
- `packages/storefront-sections` — أقسام المتجر المشتركة (hero…footer): registry + zod schemas + مكوّنات + نماذج إعدادات + الثيمات الثلاثة — يستخدمها محرر التصميم (`/store-design`) والمتجر؛ عند إضافة حزمة جديدة لا تنسَ إضافتها لـ `content` في tailwind.config التطبيقات
- `e2e/` — اختبار دخان Playwright

## قواعد إلزامية

1. **مجلدات الميزات**: كل شاشة في `apps/<app>/src/features/<feature>/` وتضم مكوّناتها وhooksها. أي ملف يتجاوز ~250 سطراً يُقسّم. صفحات `app/` تبقى غلافاً رقيقاً (قيود Next.js).
2. **المكوّنات المشتركة**: أي مكوّن نقي يُستخدم في شاشتين+ ينتقل لـ `packages/ui` (أو `@repo/api-client` إن كان منطق بيانات). مكوّنات مرتبطة بطبقة التطبيق — تعتمد api-client/توجيه/صلاحيات (مثل EntityLink, Timeline, store-link في admin، وconsole-shell/badges في super-admin/partners، وcart-context/product-card في storefront) — تبقى في `apps/<app>/src/components/` — استثناء موثّق بسبب اعتمادها على طبقات خاصة بالتطبيق.
3. **ESLint يفرض** (`packages/config/eslint/rtl-plugin.js`):
   - `rtl/no-hardcoded-arabic` — ممنوع نص عربي مباشر في JSX (استخدم الترجمات)
   - `rtl/no-raw-colors` — ممنوع hex وألوان Tailwind الثابتة (`bg-blue-500`, `bg-white`, `bg-[#hex]`). فقط توكنات التصميم: `primary, secondary, muted, accent, destructive, success, warning, info, card, popover, sidebar, border, input, ring, foreground, background, overlay, paper, ink, wa-*, serp-*`
   - `rtl/no-physical-classes` — ممنوع `ml/mr/pl/pr/left/right/border-l/rounded-l/text-left` — فقط logical (`ms/me/ps/pe/start/end/border-s/e`)
   - `no-restricted-imports` — ممنوع استيراد `@repo/mocks` داخل `apps/` (فقط عبر `@repo/api-client`)
4. **النصوص**: كل نص مستخدم من `messages/{ar,en}.json` — المفاتيح متزامنة بين اللغتين. رسائل النظام الموحدة تحت `msg.*` في `packages/ui/src/messages` (انظر `docs/UI_MESSAGES.md`):
   - `useMsgToast()` → `mt.success(key, params, {undo})` / `mt.error(key, params, {retry})`
   - `<ConfirmDialog titleKey bodyKey confirmKey danger requireText? requireOtp? />`
   - `<MsgEmptyState emptyKey />` · `<PageError errorKey onRetry />` · `<Banner variant textKey|messageKey />`
   - zod → `msgErrorMap` من `@repo/ui/lib/zod-error-map` · أخطاء API → `apiErrorKey(code)`، أي code غير معروف = `common.server.error`
5. **Storybook**: `packages/ui` فيه stories لكل مكوّن بحالاته (toolbar يبدّل RTL/LTR وداكن/فاتح). شغّل: `pnpm --filter @repo/ui storybook`.
6. **Smoke test**: أي شاشة جديدة تُضاف مسارها في `e2e/tests/smoke.spec.ts`.

## التوكنات الخاصة

- `paper`/`ink` — أبيض/أسود ثابت للأسطح الملوّنة (أفاتار، معاينات)
- `wa-*` — ألوان محاكاة WhatsApp (simulator, معاينات القنوات)
- `serp-title`/`serp-url` — معاينة نتائج Google في محرر المنتج

## الأوامر

```bash
pnpm dev            # كل التطبيقات (3000-3003)
pnpm typecheck      # كل الحزم
pnpm lint           # كل الحزم
pnpm build          # بناء الإنتاج
cd e2e && pnpm test # دخان Playwright (يتطلب pnpm dev شغال)
pnpm --filter @repo/ui build-storybook
```

## ملاحظات

- تعديلات الحقول الافتراضية في react-query hooks تتبع `mutate([input])` (tuple).
- المسارات الـ admin مسبوقة بـ `/[store]` — استخدم `Link` من `@/components/store-link` للروابط الداخلية.
- لا git في هذا المجلد — لا تفترض وجود VCS.
