# تقرير واجهة المستخدم — كما بُنيت فعلياً

> وُلّد آلياً بواسطة `scripts/ui-report.mjs` في **24‏/11‏/2026، 2:02:43 م** — المصدر: الكود لا المواصفات.

## أ. الملخص

| التطبيق | المسارات (page.tsx) | مسارات الدخان | تغطية COVERAGE |
|---|---|---|---|
| لوحة التاجر `apps/admin` | 102 | 87 | 100✅ 0⚠️ 0❌ |
| المتجر `apps/storefront` | 26 | 26 | 19✅ 0⚠️ 0❌ |
| الإدارة العليا `apps/super-admin` | 19 | 19 | 19✅ 0⚠️ 0❌ |
| بوابة المطورين `apps/partners` | 13 | 13 | 13✅ 0⚠️ 0❌ |

| بند | الرقم |
|---|---|
| مكوّنات `@repo/ui` | 50 (stories: 33) |
| أقسام المتجر | 22 قسماً · 24 نوع بلوك · 3 ثيمات |
| أدوات Copilot | 240 (106 قراءة / 107 كتابة / 27 خطرة) — تغطية 227/238 عملية api (95%) |
| سيناريوهات Copilot | 12 تاجر + 5 منصة |
| كيانات contracts | 133 واجهة |
| Hooks في api-client | 337 |
| ملفات > 250 سطراً | 19 من 917 |
| TODO/FIXME | 2 |

**نتائج الفحوص:** typecheck ✅ · lint ✅ · contracts ✅ · e2e: 254 ناجح / 1 فاشل

## ب. الشاشات لكل تطبيق

### لوحة التاجر — `apps/admin`

**شجرة التنقل:**

- بدون مجموعة
  - `/` (home)
- مجموعة **sales**
  - `/orders` (orders)
  - `/returns` (returns)
  - `/abandoned-carts` (abandonedCarts)
  - `/customers` (customers)
- مجموعة **catalog**
  - `/products` (products)
  - `/reviews` (reviews)
  - `/categories` (categories)
  - `/collections` (collections)
  - `/brands` (brands)
  - `/inventory` (inventory)
  - `/inventory/locations` (locations)
  - `/products/price-lists` (priceLists)
  - `/imports` (imports)
- مجموعة **ai**
  - `/copilot` (copilot)
  - `/inbox` (inbox)
  - `/approvals` (approvals)
  - `/agents` (agents)
  - `/knowledge` (knowledge)
- مجموعة **operations**
  - `/shipments` (shipments)
  - `/invoices` (invoices)
- مجموعة **growth**
  - `/marketing/coupons` (coupons)
  - `/marketing/promotions` (promotions)
  - `/marketing/loyalty` (loyalty)
  - `/marketing/gift-cards` (giftCards)
  - `/marketing/affiliates` (affiliates)
  - `/reports` (reports)
- مجموعة **store**
  - `/storefront/themes` (storefront)
  - `/store-design` (storeDesign)
  - `/storefront/pages` (pages)
  - `/storefront/menus` (menus)
  - `/storefront/domains` (domains)
  - `/storefront/seo` (seo)
  - `/media` (media)
  - `/apps` (apps)
  - `/apps/store` (appStore)
  - `/settings/general` (settings)

| المسار | الملف | سطور | دخان | تغطية | HTTP | لقطة |
|---|---|---|---|---|---|---|
| `/[store]/[...rest]` | `[...rest]/page.tsx` | 23 | — | ✅ | — | — |
| `/[store]/abandoned-carts/[id]` | `[id]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/[store]/abandoned-carts` | `abandoned-carts/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/agents/[id]` | `[id]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/[store]/agents/channels` | `channels/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/agents/history/[id]` | `[id]/page.tsx` | 7 | — | ✅ | — | — |
| `/[store]/agents/history` | `history/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/agents/live` | `live/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/agents` | `agents/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/agents/test` | `test/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/approvals` | `approvals/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/apps/[installationId]` | `[installationId]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/[store]/apps` | `apps/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/apps/store/[appId]` | `[appId]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/[store]/apps/store` | `store/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/brands` | `brands/page.tsx` | 12 | ✅ | — | — | — |
| `/[store]/categories` | `categories/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/collections/[id]` | `[id]/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/collections/new` | `new/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/collections` | `collections/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/conversations` | `conversations/page.tsx` | 9 | ✅ | ✅ | — | — |
| `/[store]/copilot/history` | `history/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/copilot` | `copilot/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/copilot/tasks` | `tasks/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/customers/[id]` | `[id]/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/customers` | `customers/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/imports/[id]` | `[id]/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/imports` | `imports/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/inbox/[conversationId]` | `[conversationId]/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/inbox` | `inbox/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/inventory/[variantId]` | `[variantId]/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/inventory/locations` | `locations/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/inventory` | `inventory/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/invoices/[id]` | `[id]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/[store]/invoices` | `invoices/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/knowledge/[id]` | `[id]/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/knowledge` | `knowledge/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/marketing/affiliates/[id]` | `[id]/page.tsx` | 6 | — | ✅ | — | — |
| `/[store]/marketing/affiliates` | `affiliates/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/marketing/coupons/[id]` | `[id]/page.tsx` | 12 | — | ✅ | — | — |
| `/[store]/marketing/coupons` | `coupons/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/marketing/gift-cards/[id]` | `[id]/page.tsx` | 6 | — | ✅ | — | — |
| `/[store]/marketing/gift-cards` | `gift-cards/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/marketing/loyalty` | `loyalty/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/marketing` | `marketing/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/[store]/marketing/promotions` | `promotions/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/media` | `media/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/notifications` | `notifications/page.tsx` | 12 | ✅ | — | — | — |
| `/[store]/onboarding/[step]` | `[step]/page.tsx` | 16 | ✅ | ✅ | — | — |
| `/[store]/onboarding` | `onboarding/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/[store]/orders/[id]` | `[id]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/[store]/orders/new` | `new/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/orders` | `orders/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]` | `[store]/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/[store]/products/[id]` | `[id]/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/products/new` | `new/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/products` | `products/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/products/price-lists` | `price-lists/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/reports/[type]` | `[type]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/[store]/reports` | `reports/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/returns/[id]` | `[id]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/[store]/returns/new` | `new/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/returns` | `returns/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/reviews` | `reviews/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/audit` | `audit/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/billing` | `billing/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/channels` | `channels/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/copilot` | `copilot/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/danger` | `danger/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/developers` | `developers/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/general` | `general/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/maintenance` | `maintenance/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/notifications` | `notifications/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings` | `settings/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/[store]/settings/payments` | `payments/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/profile` | `profile/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/regional` | `regional/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/roles` | `roles/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/shipping` | `shipping/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/staff` | `staff/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/taxes` | `taxes/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/settings/verification` | `verification/page.tsx` | 17 | ✅ | ✅ | — | — |
| `/[store]/shipments/[id]` | `[id]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/[store]/shipments` | `shipments/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/shipping` | `shipping/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/store-design` | `store-design/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/storefront/domains` | `domains/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/storefront/menus` | `menus/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/storefront/pages/[id]` | `[id]/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/storefront/pages` | `pages/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/storefront/seo` | `seo/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/[store]/storefront/themes` | `themes/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/design-system` | `design-system/page.tsx` | 93 | — | ✅ | — | — |
| `/dev/messages` | `messages/page.tsx` | 108 | — | ✅ | — | — |
| `/forgot` | `forgot/page.tsx` | 12 | — | ✅ | — | — |
| `/invite/[token]` | `[token]/page.tsx` | 13 | — | ✅ | — | — |
| `/login` | `login/page.tsx` | 12 | — | ✅ | — | — |
| `/mfa` | `mfa/page.tsx` | 12 | — | ✅ | — | — |
| `/` | `app/page.tsx` | 6 | — | ✅ | — | — |
| `/signup` | `signup/page.tsx` | 12 | — | ✅ | — | — |
| `/signup/store` | `store/page.tsx` | 12 | — | ✅ | — | — |
| `/signup/verify` | `verify/page.tsx` | 12 | — | ✅ | — | — |

### المتجر — `apps/storefront`

**شجرة التنقل:**

- بدون مجموعة
  - `/products/${p.id}` (/products/${p.id})
  - `/` (/)
  - `/wishlist` (/wishlist)
  - `/cart` (/cart)
  - `/c/${c.slug}` (/c/${c.slug})
  - `/brands` (/brands)
  - `/offers` (/offers)

| المسار | الملف | سطور | دخان | تغطية | HTTP | لقطة |
|---|---|---|---|---|---|---|
| `/account/addresses` | `addresses/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/account/login` | `login/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/account/orders/[id]` | `[id]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/account/orders` | `orders/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/account/profile` | `profile/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/account/rewards` | `rewards/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/brands/[id]` | `[id]/page.tsx` | 7 | ✅ | — | — | — |
| `/brands` | `brands/page.tsx` | 6 | ✅ | — | — | — |
| `/c/[slug]` | `[slug]/page.tsx` | 13 | ✅ | ✅ | — | — |
| `/cart` | `cart/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/checkout` | `checkout/page.tsx` | 11 | ✅ | ✅ | — | — |
| `/compare` | `compare/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/contact` | `contact/page.tsx` | 6 | ✅ | — | — | — |
| `/faq` | `faq/page.tsx` | 6 | ✅ | — | — | — |
| `/gift-cards` | `gift-cards/page.tsx` | 6 | ✅ | — | — | — |
| `/offers` | `offers/page.tsx` | 6 | ✅ | — | — | — |
| `/order/[token]` | `[token]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/p/[slug]` | `[slug]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/` | `(site)/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/pages/[slug]` | `[slug]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/products/[id]` | `[id]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/returns/request` | `request/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/search` | `search/page.tsx` | 11 | ✅ | ✅ | — | — |
| `/track` | `track/page.tsx` | 11 | ✅ | — | — | — |
| `/wishlist` | `wishlist/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/preview` | `preview/page.tsx` | 11 | ✅ | ✅ | — | — |

### الإدارة العليا — `apps/super-admin`

**شجرة التنقل:**

- بدون مجموعة
  - `/` (overview)
  - `/copilot` (copilot)
  - `/stores` (tenants)
  - `/plans` (plans)
  - `/subscriptions` (subscriptions)
  - `/usage` (usage)
  - `/ai-usage` (ai)
  - `/apps-review` (appsReview)
  - `/partners` (partners)
  - `/providers` (providers)
  - `/jobs` (jobs)
  - `/logs` (logs)
  - `/flags` (flags)
  - `/themes` (themes)
  - `/team` (team)

| المسار | الملف | سطور | دخان | تغطية | HTTP | لقطة |
|---|---|---|---|---|---|---|
| `/ai-usage` | `ai-usage/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/apps-review/[id]` | `[id]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/apps-review` | `apps-review/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/copilot` | `copilot/page.tsx` | 12 | ✅ | ✅ | — | — |
| `/flags` | `flags/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/jobs` | `jobs/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/logs` | `logs/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/` | `app/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/partners` | `partners/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/plans/[id]` | `[id]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/plans` | `plans/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/providers` | `providers/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/stores/[id]` | `[id]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/stores` | `stores/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/subscriptions` | `subscriptions/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/team` | `team/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/tenants` | `tenants/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/themes` | `themes/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/usage` | `usage/page.tsx` | 6 | ✅ | ✅ | — | — |

### بوابة المطورين — `apps/partners`

**شجرة التنقل:**

- بدون مجموعة
  - `/` (overview)
  - `/apps` (apps)
  - `/test-stores` (testStores)
  - `/docs` (docs)

| المسار | الملف | سطور | دخان | تغطية | HTTP | لقطة |
|---|---|---|---|---|---|---|
| `/apps/[id]/analytics` | `analytics/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/apps/[id]/listing` | `listing/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/apps/[id]` | `[id]/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/apps/[id]/review` | `review/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/apps/[id]/scopes` | `scopes/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/apps/[id]/settings` | `settings/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/apps/[id]/webhooks` | `webhooks/page.tsx` | 7 | ✅ | ✅ | — | — |
| `/apps/new` | `new/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/apps` | `apps/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/docs` | `docs/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/` | `(console)/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/test-stores` | `test-stores/page.tsx` | 6 | ✅ | ✅ | — | — |
| `/signup` | `signup/page.tsx` | 6 | ✅ | ✅ | — | — |

## ج. نظام التصميم

- التوكنات المعرّفة في `packages/ui/src/styles/globals.css` (+ الوضع الداكن): **96** متغير — أبرزها: `--primary`، `--primary-foreground`، `--background`، `--foreground`، `--card-foreground`، `--popover-foreground`، `--secondary-foreground`، `--muted-foreground`، `--accent-foreground`، `--destructive-foreground`، `--success-foreground`، `--warning-foreground`، `--info-foreground`، `--sidebar-foreground`.
- preset مشترك: `packages/config/tailwind/preset.ts` — القاعدة: توكنات فقط، ESLint يمنع الألوان الخام.

| المكوّن | الملف | ملفات تستخدمه |
|---|---|---|
| Button | `button.tsx` | 242 |
| Card | `card.tsx` | 207 |
| Label | `label.tsx` | 171 |
| Input | `input.tsx` | 149 |
| Skeleton | `skeleton.tsx` | 141 |
| Badge | `badge.tsx` | 132 |
| Dialog | `dialog.tsx` | 121 |
| Select | `select.tsx` | 114 |
| msg-toast | `msg-toast.tsx` | 103 |
| Money | `money.tsx` | 97 |
| EmptyState | `empty-state.tsx` | 94 |
| Table | `table.tsx` | 67 |
| StatusBadge | `status-badge.tsx` | 66 |
| Form | `form.tsx` | 61 |
| PageHeader | `page-header.tsx` | 58 |
| DataState | `data-state.tsx` | 57 |
| Textarea | `textarea.tsx` | 43 |
| ConfirmDialog | `confirm-dialog.tsx` | 42 |
| Alert | `alert.tsx` | 41 |
| Switch | `switch.tsx` | 40 |
| Checkbox | `checkbox.tsx` | 34 |
| Avatar | `avatar.tsx` | 30 |
| MediaThumb | `media-thumb.tsx` | 29 |
| DataTable | `data-table.tsx` | 26 |
| Tabs | `tabs.tsx` | 25 |
| ErrorState | `error-state.tsx` | 23 |
| MsgEmptyState | `msg-empty-state.tsx` | 23 |
| Banner | `banner.tsx` | 19 |
| Popover | `popover.tsx` | 17 |
| RadioGroup | `radio-group.tsx` | 17 |
| StatCard | `stat-card.tsx` | 17 |
| Separator | `separator.tsx` | 15 |
| DropdownMenu | `dropdown-menu.tsx` | 14 |
| ProductImage | `product-image.tsx` | 11 |
| Sheet | `sheet.tsx` | 11 |
| Progress | `progress.tsx` | 10 |
| PageError | `page-error.tsx` | 9 |
| LocaleSwitcher | `locale-switcher.tsx` | 8 |
| ThemeToggle | `theme-toggle.tsx` | 7 |
| OrderChannelIcon | `order-channel-icon.tsx` | 4 |
| UIProviders | `providers.tsx` | 4 |
| Command | `command.tsx` | 3 |
| Kbd | `kbd.tsx` | 3 |
| ScrollArea | `scroll-area.tsx` | 3 |
| ImageCropDialog | `image-crop-dialog.tsx` | 2 |
| ImageField | `image-field.tsx` | 2 |
| MediaPicker | `media-picker.tsx` | 2 |
| WorkspaceShell | `workspace-shell.tsx` | 2 |
| Toaster | `toaster.tsx` | 0 |
| TooltipProvider | `tooltip.tsx` | 0 |

## د. أقسام المتجر ونظام الثيمات

**الأقسام (22):** `header`، `footer`، `hero`، `slider`، `categories`، `featured-products`، `banner`، `image-text`، `testimonials`، `features`، `faq`، `newsletter`، `main-product`، `rich-text`، `video`، `collage`، `logo-list`، `contact-form`، `map`، `countdown`، `tabs`، `recently-viewed`

**أنواع البلوكات (24):** `heading`، `text`، `button`، `image`، `icon-item`، `badge`، `divider`، `slide`، `testimonial`، `qa`، `feature`، `title`، `price`، `variant-picker`، `quantity`، `buy-button`، `description`، `accordion`، `social-link`، `logo`، `tab`، `promo-card`، `product-card`، `hotspot`

**الثيمات:** `fashion`، `generic`، `perfume` (perfume هو الافتراضي).
**القوالب:** home · product · category · cart · page + قوالب هبوط مخصصة (`ThemeCustomTemplate`).

**الـ presets لكل ثيم:**
- fashion: تسوّقي الجديد، العبايات، أثواب وشماغ، إكسسوارات
- generic: محمّصة أسبوعياً، تسوّق الآن
- perfume: تشكيلة العود الملكية، تسوّق العطور، أبو فهد، الجوهرة، محمد، عود كمبودي، ورد طائفي، مسك طهارة، بخور ملكي، عنبر

**مميزات المتجر (15):** `wishlist`، `compare`، `reviews`، `quickView`، `quickFilters`، `recentlyViewed`، `stickyBuyBar`، `scarcity`، `viewersNow`، `deliveryEstimate`، `sizeGuide`، `backInStock`، `installments`، `share`، `backToTop`

**أدوات المحرر:** تراجع/إعادة، حفظ تلقائي، تحديد من المعاينة، نسخ/لصق، اختصارات، معاينة بأجهزة (mobile/tablet/desktop)، أنظمة ألوان لكل قسم، سجل نسخ، جدولة نشر، روابط معاينة، لوحة جودة، «صمم بالـ AI» (واجهة فقط — توليد محلي).

## هـ. الوكلاء و Copilot

- شاشات الوكلاء في admin: `/agents` (قائمة، محرر، قنوات، مباشر، سجل، اختبار) — بياناتها من `studioApi` (mock).
- **تغطية الأدوات: 227/238 عملية api (95%)** — تولّدت 240 أداة من جدول `API_GEN_SPEC` (`packages/copilot/src/registry-data.ts` + مولّد `tool-gen.ts`)؛ الأدوات اليدوية الغنية تُعفى من التوليد عند تعارض الاسم.
- سيناريوهات التاجر (12): `price-up-category`، `add-staff`، `create-returns-agent`، `request-order-approval`، `delete-archived-products`، `schedule-daily-summary`، `low-stock-alert`، `dormant-customers-coupon`، `ramadan-prep`، `top5-products`، `open-filtered-orders`، `sales-drop-analysis`
- سيناريوهات المنصة (5): `new-stores-count`، `abnormal-ai-usage`، `suspend-store`، `retry-failed-jobs`، `monthly-report`

**الأدوات / العمليات لكل نطاق:**

| النطاق | الأدوات / العمليات | النسبة |
|---|---|---|
| `session` (الجلسة الحالية) | 1/1 | 100% |
| `stores` (متجر) | 2/2 | 100% |
| `roles` (دور) | 5/5 | 100% |
| `staff` (موظف) | 7/7 | 100% |
| `categories` (تصنيف) | 4/4 | 100% |
| `products` (منتج) | 10/9 | 111% |
| `collections` (تشكيلة) | 4/4 | 100% |
| `inventory` (مخزون) | 5/5 | 100% |
| `imports` (مهمة استيراد) | 3/3 | 100% |
| `media` (وسائط) | 5/5 | 100% |
| `customers` (عميل) | 7/7 | 100% |
| `abandonedCarts` (سلة متروكة) | 5/5 | 100% |
| `notifications` (تنبيه) | 2/2 | 100% |
| `backInStock` (طلب إشعار توفر) | 2/2 | 100% |
| `coupons` (كوبون) | 5/5 | 100% |
| `promotions` (عرض ترويجي) | 4/4 | 100% |
| `analytics` (تحليلات) | 1/1 | 100% |
| `audit` (سجل تدقيق) | 1/1 | 100% |
| `copilotTasks` (مهمة مساعد) | 6/6 | 100% |
| `copilotSettings` (إعدادات المساعد) | 2/2 | 100% |
| `copilotConversations` (محادثة مساعد) | 6/6 | 100% |
| `orders` (طلب) | 15/14 | 107% |
| `shipments` (شحنة) | 3/3 | 100% |
| `invoices` (فاتورة) | 3/3 | 100% |
| `returns` (مرتجع) | 5/5 | 100% |
| `conversations` (محادثة) | 9/9 | 100% |
| `approvals` (طلب اعتماد) | 3/2 | 150% |
| `knowledge` (مصدر معرفة) | 9/9 | 100% |
| `reviews` (تقييم) | 5/5 | 100% |
| `apps` (تطبيق) | 2/2 | 100% |
| `appInstallations` (تطبيق مثبت) | 4/4 | 100% |
| `settings.general` (إعدادات المتجر العامة) | 1/1 | 100% |
| `settings.payments` (إعدادات الدفع) | 2/2 | 100% |
| `settings.shipping` (إعدادات الشحن) | 2/2 | 100% |
| `settings.taxes` (إعدادات الضريبة) | 2/2 | 100% |
| `settings.notifications` (قالب تنبيه) | 2/2 | 100% |
| `settings.channels` (إعدادات القنوات) | 2/2 | 100% |
| `settings.billing` (فوترة التاجر) | 1/1 | 100% |
| `settings.verification` (توثيق المتجر) | 3/3 | 100% |
| `settings.apiKeys` (مفتاح API) | 3/3 | 100% |
| `settings.webhooks` (اشتراك webhook) | 3/3 | 100% |
| `settings.danger` (منطقة الخطر) | 3/3 | 100% |
| `themes` (ثيم) | 12/11 | 109% |
| `themeShares` (رابط معاينة ثيم) | 4/4 | 100% |
| `pages` (صفحة) | 5/5 | 100% |
| `menus` (قائمة تنقل) | 2/2 | 100% |
| `domains` (نطاق) | 5/5 | 100% |
| `seo` (إعدادات SEO) | 5/5 | 100% |
| `agents` (وكيل) | 7/6 | 117% |
| `platform` (المنصة) | 25/23 | 109% |
| `partner` (بوابة المطورين) | 0/0 | مستبعد |

**العمليات المستبعدة (11):**
- `media.upload` — وسيط binary File — لا يمكن تمثيله في معاملات أداة
- `audit.log` — داخلي — executor يسجل تدقيق تنفيذ الأدوات تلقائياً
- `partner.*` — سطح بوابة المطورين — تطبيق partners بلا copilot ولا سياق تاجر

### قراءة (106)

| الأداة | الصلاحية | تراجع | الوصف |
|---|---|---|---|
| `session.me` | `—` | — | بيانات المستخدم الحالي وصلاحياته الفعلية |
| `stores.list` | `—` | — | عرض قائمة متجر |
| `stores.bySlug` | `—` | — | قراءة متجر بالـ slug |
| `roles.list` | `staff.manage` | — | عرض قائمة دور |
| `roles.get` | `staff.manage` | — | قراءة دور |
| `staff.list` | `staff.manage` | — | عرض قائمة موظف |
| `staff.me` | `staff.manage` | — | الموظف الحالي |
| `staff.roles` | `staff.manage` | — | أدوار الفريق |
| `categories.list` | `products.read` | — | عرض قائمة تصنيف |
| `categories.get` | `products.read` | — | قراءة تصنيف |
| `products.list` | `products.read` | — | عرض قائمة منتج |
| `products.get` | `products.read` | — | قراءة منتج |
| `collections.list` | `products.read` | — | عرض قائمة تشكيلة |
| `collections.get` | `products.read` | — | قراءة تشكيلة |
| `collections.products` | `products.read` | — | منتجات تشكيلة |
| `inventory.levels` | `products.read` | — | مستويات المخزون لكل متغير |
| `inventory.movements` | `products.read` | — | حركات المخزون |
| `inventory.movementsFor` | `products.read` | — | حركات مخزون متغير محدد |
| `inventory.locations` | `products.read` | — | مواقع المخزون |
| `imports.list` | `products.read` | — | عرض قائمة مهمة استيراد |
| `imports.get` | `products.read` | — | قراءة مهمة استيراد |
| `media.list` | `storefront.manage` | — | عرض قائمة وسائط |
| `media.get` | `storefront.manage` | — | قراءة وسائط |
| `customers.list` | `customers.read` | — | عرض قائمة عميل |
| `customers.get` | `customers.read` | — | قراءة عميل |
| `abandonedCarts.list` | `marketing.manage` | — | عرض قائمة سلة متروكة |
| `abandonedCarts.settings` | `marketing.manage` | — | إعدادات استرجاع السلات |
| `abandonedCarts.get` | `marketing.manage` | — | قراءة سلة متروكة |
| `notifications.list` | `—` | — | عرض قائمة تنبيه |
| `backInStock.list` | `products.read` | — | عرض قائمة طلب إشعار توفر |
| `coupons.list` | `marketing.manage` | — | عرض قائمة كوبون |
| `coupons.get` | `marketing.manage` | — | قراءة كوبون |
| `promotions.list` | `marketing.manage` | — | عرض قائمة عرض ترويجي |
| `audit.list` | `audit.read` | — | عرض قائمة سجل تدقيق |
| `copilotTasks.list` | `—` | — | عرض قائمة مهمة مساعد |
| `copilotTasks.get` | `—` | — | قراءة مهمة مساعد |
| `copilotSettings.get` | `—` | — | قراءة إعدادات المساعد |
| `copilotConversations.list` | `—` | — | عرض قائمة محادثة مساعد |
| `copilotConversations.get` | `—` | — | قراءة محادثة مساعد |
| `orders.list` | `orders.read` | — | عرض قائمة طلب |
| `orders.get` | `orders.read` | — | قراءة طلب |
| `orders.payments` | `orders.read` | — | مدفوعات طلب |
| `orders.refunds` | `orders.read` | — | مستردات طلب |
| `shipments.list` | `shipments.manage` | — | عرض قائمة شحنة |
| `shipments.get` | `shipments.manage` | — | قراءة شحنة |
| `invoices.list` | `invoices.read` | — | عرض قائمة فاتورة |
| `invoices.get` | `invoices.read` | — | قراءة فاتورة |
| `returns.list` | `returns.manage` | — | عرض قائمة مرتجع |
| `returns.get` | `returns.manage` | — | قراءة مرتجع |
| `conversations.list` | `conversations.read` | — | عرض قائمة محادثة |
| `conversations.get` | `conversations.read` | — | قراءة محادثة |
| `approvals.list` | `approvals.decide` | — | عرض قائمة طلب اعتماد |
| `knowledge.list` | `agents.read` | — | عرض قائمة مصدر معرفة |
| `knowledge.get` | `agents.read` | — | قراءة مصدر معرفة |
| `knowledge.testQuery` | `agents.read` | — | اختبار استرجاع سؤال من مصدر |
| `reviews.list` | `products.read` | — | كل التقييمات |
| `reviews.listByProduct` | `products.read` | — | تقييمات منتج |
| `apps.list` | `apps.manage` | — | عرض قائمة تطبيق |
| `apps.get` | `apps.manage` | — | قراءة تطبيق |
| `appInstallations.list` | `apps.manage` | — | عرض قائمة تطبيق مثبت |
| `appInstallations.get` | `apps.manage` | — | قراءة تطبيق مثبت |
| `settings.payments.get` | `settings.manage` | — | قراءة إعدادات الدفع |
| `settings.shipping.get` | `settings.manage` | — | قراءة إعدادات الشحن |
| `settings.taxes.get` | `settings.manage` | — | قراءة إعدادات الضريبة |
| `settings.notifications.list` | `settings.manage` | — | عرض قائمة قالب تنبيه |
| `settings.channels.get` | `settings.manage` | — | قراءة إعدادات القنوات |
| `settings.billing.get` | `billing.manage` | — | قراءة فوترة التاجر |
| `settings.verification.get` | `settings.manage` | — | قراءة توثيق المتجر |
| `settings.apiKeys.list` | `developers.manage` | — | عرض قائمة مفتاح API |
| `settings.webhooks.list` | `developers.manage` | — | عرض قائمة اشتراك webhook |
| `settings.danger.exportAll` | `settings.manage` | — | تصدير كل بيانات المتجر |
| `themes.list` | `storefront.manage` | — | عرض قائمة ثيم |
| `themes.get` | `storefront.manage` | — | قراءة ثيم |
| `themeShares.list` | `storefront.manage` | — | عرض قائمة رابط معاينة ثيم |
| `themeShares.resolve` | `storefront.manage` | — | حل رابط معاينة بتوكن |
| `pages.list` | `storefront.manage` | — | عرض قائمة صفحة |
| `pages.get` | `storefront.manage` | — | قراءة صفحة |
| `menus.list` | `storefront.manage` | — | عرض قائمة قائمة تنقل |
| `domains.list` | `storefront.manage` | — | عرض قائمة نطاق |
| `seo.get` | `storefront.manage` | — | قراءة إعدادات SEO |
| `seo.redirects` | `storefront.manage` | — | قائمة التحويلات |
| `agents.list` | `agents.read` | — | عرض قائمة وكيل |
| `agents.get` | `agents.read` | — | قراءة وكيل |
| `platform.tenant` | `platform.read` | — | قراءة متجر مشترك |
| `platform.plan` | `platform.read` | — | قراءة المنصة |
| `platform.tenantStaff` | `platform.read` | — | موظفو متجر مشترك |
| `platform.tenantOrders` | `platform.read` | — | طلبات متجر مشترك |
| `platform.themes` | `platform.read` | — | ثيمات المتاجر على المنصة |
| `platform.appSubmissions` | `platform.read` | — | طلبات نشر التطبيقات |
| `platform.appSubmission` | `platform.read` | — | قراءة المنصة |
| `platform.partners` | `platform.read` | — | قراءة المنصة |
| `platform.providers` | `platform.read` | — | قراءة المنصة |
| `platform.auditLogs` | `platform.read` | — | قراءة المنصة |
| `platform.flags` | `platform.read` | — | أعلام الميزات |
| `platform.team` | `platform.read` | — | فريق المنصة |
| `analytics.home` | `reports.read` | — | بيانات لوحة التقارير الرئيسية |
| `ui.navigate` | `—` | — | التنقل لشاشة داخل اللوحة |
| `ui.highlight` | `—` | — | تسليط الضوء على عنصر في الشاشة |
| `ui.openDialog` | `—` | — | فتح نافذة حوارية |
| `ui.fillForm` | `—` | — | تعبئة نموذج بقيم |
| `platform.summary` | `platform.read` | — | ملخص المنصة (MRR، المتاجر، GMV) |
| `platform.tenants` | `platform.read` | — | قائمة المتاجر المشتركة |
| `platform.usage` | `platform.read` | — | استهلاك الذكاء الاصطناعي لكل متجر |
| `platform.plans` | `platform.read` | — | قائمة الباقات |
| `platform.jobs` | `platform.read` | — | حالة المهام الخلفية |
| `platform.subscriptions` | `platform.read` | — | اشتراكات المتاجر |

### كتابة (107)

| الأداة | الصلاحية | تراجع | الوصف |
|---|---|---|---|
| `roles.create` | `staff.manage` | — | إنشاء دور |
| `roles.update` | `staff.manage` | ✅ | تحديث دور |
| `staff.setStatus` | `staff.manage` | ✅ | تغيير حالة موظف |
| `staff.saveRole` | `staff.manage` | — | إنشاء/تحديث دور صلاحيات |
| `categories.create` | `products.manage` | — | إنشاء/تحديث تصنيف |
| `categories.move` | `products.manage` | ✅ | نقل تصنيف تحت أب آخر |
| `products.create` | `products.manage` | — | إنشاء/تحديث منتج |
| `products.addToCategory` | `products.manage` | — | إضافة منتجات لتصنيف |
| `products.addToCollection` | `products.manage` | — | إضافة منتجات لتشكيلة يدوية |
| `products.addTag` | `products.manage` | — | وسم منتجات |
| `collections.create` | `products.manage` | — | إنشاء/تحديث تشكيلة |
| `inventory.adjust` | `inventory.manage` | — | تسوية مخزون متغير (delta/set + سبب) |
| `imports.create` | `products.manage` | — | إنشاء مهمة استيراد |
| `media.create` | `storefront.manage` | — | إضافة صورة بـ dataURL للمكتبة |
| `media.update` | `storefront.manage` | ✅ | تحديث وسائط |
| `customers.create` | `customers.manage` | — | إنشاء عميل |
| `customers.addAddress` | `customers.manage` | — | تنفيذ عميل |
| `customers.update` | `customers.manage` | ✅ | تحديث عميل |
| `customers.addTag` | `customers.manage` | — | وسم عملاء |
| `abandonedCarts.saveSettings` | `marketing.manage` | ✅ | تنفيذ سلة متروكة |
| `abandonedCarts.sendRecovery` | `marketing.manage` | — | إرسال رسالة استرجاع لسلة |
| `notifications.markRead` | `—` | — | تعليم تنبيه كمقروء (الكل بلا id) |
| `backInStock.subscribe` | `products.manage` | — | تنفيذ طلب إشعار توفر |
| `coupons.create` | `marketing.manage` | — | إنشاء/تحديث كوبون |
| `coupons.setStatus` | `marketing.manage` | ✅ | تفعيل/تعطيل كوبون |
| `promotions.create` | `marketing.manage` | — | إنشاء/تحديث عرض ترويجي |
| `promotions.setStatus` | `marketing.manage` | ✅ | تفعيل/تعطيل عرض |
| `copilotTasks.update` | `—` | ✅ | تحديث مهمة مساعد |
| `copilotSettings.save` | `—` | ✅ | حفظ إعدادات المساعد |
| `copilotConversations.save` | `—` | — | حفظ محادثة مساعد |
| `copilotConversations.pin` | `—` | ✅ | تنفيذ محادثة مساعد |
| `copilotConversations.share` | `—` | ✅ | تنفيذ محادثة مساعد |
| `orders.addNote` | `orders.manage` | — | إضافة ملاحظة داخلية لطلب |
| `orders.fulfill` | `orders.manage` | — | بدء تجهيز طلب |
| `orders.createShipment` | `orders.manage` | — | إنشاء شحنة لطلب |
| `orders.setFulfillment` | `orders.manage` | ✅ | تحديث حالة تجهيز طلبات |
| `orders.addTag` | `orders.manage` | — | وسم طلبات |
| `orders.updateAddress` | `orders.manage` | ✅ | تعديل عنوان شحن طلب |
| `orders.sendPaymentLink` | `orders.manage` | — | إرسال رابط دفع لطلب |
| `orders.create` | `orders.manage` | — | إنشاء طلب يدوي |
| `shipments.setStatus` | `shipments.manage` | ✅ | تغيير حالة شحنة |
| `invoices.resend` | `invoices.read` | — | إعادة إرسال فاتورة مرفوضة لزاتكا |
| `returns.setStatus` | `returns.manage` | ✅ | تغيير حالة مرتجع |
| `returns.approve` | `returns.manage` | — | اعتماد مرتجع (قرار + مبلغ + شحنة إرجاع) |
| `conversations.sendMessage` | `conversations.reply` | — | إرسال رسالة في محادثة |
| `conversations.takeOver` | `conversations.reply` | — | استلام محادثة من الوكيل |
| `conversations.returnToAgent` | `conversations.reply` | — | إرجاع محادثة للوكيل |
| `conversations.setStatus` | `conversations.reply` | ✅ | تغيير حالة محادثة |
| `conversations.assign` | `conversations.reply` | ✅ | إسناد محادثة لموظف |
| `conversations.setPriority` | `conversations.reply` | ✅ | تنفيذ محادثة |
| `conversations.addTag` | `conversations.reply` | — | تنفيذ محادثة |
| `approvals.decide` | `approvals.decide` | — | اعتماد/رفض إجراء وكيل |
| `knowledge.create` | `knowledge.manage` | — | إنشاء مصدر معرفة |
| `knowledge.linkAgent` | `knowledge.manage` | ✅ | ربط مصدر معرفة بوكيل |
| `knowledge.unlinkAgent` | `knowledge.manage` | ✅ | تنفيذ مصدر معرفة |
| `knowledge.setAutoSync` | `knowledge.manage` | ✅ | تنفيذ مصدر معرفة |
| `knowledge.sync` | `knowledge.manage` | — | مزامنة مصدر معرفة |
| `reviews.create` | `products.manage` | — | إنشاء تقييم |
| `reviews.setStatus` | `products.manage` | ✅ | تغيير حالة تقييم |
| `reviews.reply` | `products.manage` | — | رد التاجر على تقييم |
| `appInstallations.install` | `apps.manage` | — | تثبيت تطبيق (id = appId) |
| `settings.general.save` | `settings.manage` | ✅ | حفظ إعدادات المتجر العامة |
| `settings.payments.save` | `settings.manage` | ✅ | حفظ إعدادات الدفع |
| `settings.shipping.save` | `settings.manage` | ✅ | حفظ إعدادات الشحن |
| `settings.taxes.save` | `settings.manage` | ✅ | حفظ إعدادات الضريبة |
| `settings.notifications.save` | `settings.manage` | ✅ | حفظ قالب حدث+قناة |
| `settings.channels.save` | `settings.manage` | ✅ | حفظ إعدادات القنوات |
| `settings.verification.upload` | `settings.manage` | — | تسجيل رفع مستند توثيق |
| `settings.verification.submit` | `settings.manage` | — | إرسال التوثيق للمراجعة |
| `settings.apiKeys.create` | `developers.manage` | — | إنشاء مفتاح API — السر يظهر مرة |
| `settings.webhooks.create` | `developers.manage` | — | إنشاء اشتراك webhook |
| `settings.webhooks.resend` | `developers.manage` | — | إعادة إرسال تسليم webhook |
| `themes.update` | `storefront.manage` | ✅ | تحديث ثيم |
| `themes.schedule` | `storefront.manage` | ✅ | جدولة نشر ثيم |
| `themes.setWindow` | `storefront.manage` | ✅ | نافذة تفعيل مؤقتة لثيم |
| `themes.applyAsDraft` | `storefront.manage` | ✅ | تطبيق ثيم كمسودة |
| `themes.duplicate` | `storefront.manage` | — | نسخ ثيم كمسودة جديدة |
| `themes.rename` | `storefront.manage` | ✅ | تنفيذ ثيم |
| `themes.importTheme` | `storefront.manage` | — | استيراد حزمة ثيم كمسودة |
| `themeShares.create` | `storefront.manage` | — | إنشاء رابط معاينة لثيم (id = themeId) |
| `pages.create` | `storefront.manage` | — | إنشاء صفحة |
| `pages.update` | `storefront.manage` | ✅ | تحديث صفحة |
| `menus.update` | `storefront.manage` | ✅ | تحديث قائمة تنقل |
| `domains.add` | `storefront.manage` | — | تنفيذ نطاق |
| `domains.verify` | `storefront.manage` | — | إعادة تحقق نطاق |
| `domains.setPrimary` | `storefront.manage` | ✅ | تنفيذ نطاق |
| `seo.save` | `storefront.manage` | ✅ | حفظ إعدادات SEO |
| `seo.addRedirect` | `storefront.manage` | — | إضافة تحويل مسار |
| `agents.save` | `agents.manage` | ✅ | حفظ وكيل كاملاً |
| `agents.setStatus` | `agents.manage` | ✅ | تغيير حالة وكيل |
| `agents.publish` | `agents.manage` | — | نشر إصدار وكيل |
| `platform.savePlan` | `platform.tenants.manage` | ✅ | تنفيذ المنصة |
| `platform.reviewApp` | `platform.tenants.manage` | — | اعتماد/رفض تطبيق مرسل |
| `platform.setProvider` | `platform.tenants.manage` | ✅ | تنفيذ المنصة |
| `platform.setFlag` | `platform.tenants.manage` | ✅ | تنفيذ المنصة |
| `products.setStatus` | `products.manage` | ✅ | تغيير حالة منتجات (مسودة/نشط/مؤرشف) |
| `products.adjustPrices` | `products.manage` | ✅ | تعديل أسعار منتجات بنسبة أو مبلغ ثابت |
| `themes.publish` | `storefront.manage` | ✅ | نشر ثيم |
| `themes.applyPreset` | `storefront.manage` | ✅ | تطبيق preset موسمي على الثيم المنشور ونشره |
| `staff.invite` | `staff.manage` | — | دعوة موظف جديد بدور محدد |
| `agents.create` | `agents.manage` | — | إنشاء وكيل فرعي مسودة تحت الوكيل الرئيسي |
| `agents.updateGreeting` | `agents.manage` | ✅ | تحديث رسالة الترحيب لوكيل |
| `marketing.whatsappCampaign` | `marketing.manage` | — | إرسال حملة واتساب لشريحة عملاء (محاكاة) |
| `approvals.request` | `approvals.decide` | — | إرسال طلب موافقة لصفحة الموافقات (استرداد/خصم/إلغاء) |
| `copilotTasks.create` | `—` | ✅ | إنشاء مهمة مجدولة أو تنبيه للمساعد |
| `copilotTasks.runNow` | `—` | — | تشغيل مهمة مجدولة فوراً (محاكاة) |
| `platform.retryJobs` | `platform.jobs.manage` | — | إعادة تشغيل المهام الفاشلة (محاكاة) |

### خطرة (27)

| الأداة | الصلاحية | تراجع | الوصف |
|---|---|---|---|
| `roles.remove` | `staff.manage` | — | حذف دور |
| `staff.remove` | `staff.manage` | — | حذف موظف |
| `products.remove` | `products.manage` | — | حذف منتجات نهائياً |
| `media.remove` | `storefront.manage` | — | حذف وسائط |
| `customers.remove` | `customers.manage` | — | مسح بيانات عميل (خصوصية) |
| `coupons.remove` | `marketing.manage` | — | حذف كوبون |
| `promotions.remove` | `marketing.manage` | — | حذف عرض ترويجي |
| `copilotTasks.remove` | `—` | — | حذف مهمة مساعد |
| `copilotConversations.remove` | `—` | — | حذف محادثة مساعد |
| `orders.cancel` | `orders.manage` | — | إلغاء طلب |
| `orders.refund` | `orders.refund` | — | استرداد مبلغ طلب |
| `returns.refund` | `returns.manage` | — | تنفيذ استرداد مرتجع وإصدار إشعار دائن |
| `knowledge.remove` | `knowledge.manage` | — | حذف مصدر معرفة |
| `appInstallations.uninstall` | `apps.manage` | — | إجراء خطير على تطبيق مثبت |
| `settings.apiKeys.revoke` | `developers.manage` | — | إجراء خطير على مفتاح API |
| `settings.danger.suspend` | `settings.manage` | — | إيقاف المتجر مؤقتاً |
| `settings.danger.remove` | `settings.manage` | — | تعليق المتجر نهائياً |
| `themes.remove` | `storefront.manage` | — | حذف ثيم |
| `themeShares.revoke` | `storefront.manage` | — | إبطال رابط معاينة |
| `pages.remove` | `storefront.manage` | — | حذف صفحة |
| `domains.remove` | `storefront.manage` | — | حذف نطاق |
| `seo.removeRedirect` | `storefront.manage` | — | إجراء خطير على إعدادات SEO |
| `platform.setTenantStatus` | `platform.tenants.manage` | — | تغيير حالة متجر مشترك |
| `products.deleteArchived` | `products.manage` | — | حذف كل المنتجات المؤرشفة نهائياً |
| `orders.bulkCancel` | `orders.manage` | — | إلغاء مجموعة طلبات دفعة واحدة |
| `developers.createWebhook` | `developers.manage` | — | إنشاء webhook جديد — يتطلب confirm=true |
| `platform.suspendStore` | `platform.tenants.manage` | ✅ | إيقاف متجر مشترك — إجراء خطير |

## و. مصفوفة الصلاحيات الفعلية

المصدر: `packages/contracts/src/permissions.ts` (`PERMISSION_GROUPS` + `DEFAULT_ROLES` — 7 أدوار نظام) و `apps/admin/src/lib/route-permissions.ts` (31 مساراً محمياً). حراسات المسارات مركزية عبر `<RouteGuard>` → `errors.403`، والتحقق على مستوى العناصر (`useCan`/`<Can>`) في 47 ملفاً.

**مصفوفة الأدوار × الشاشات** (الصلاحية المطلوبة لكل مسار — ✅ = الدور يفتح الشاشة):

| الشاشة | الصلاحية | owner | admin | catalog | orders | support | marketing | readonly |
|---|---|---|---|---|---|---|---|---|
| `/settings/billing` | `billing.manage` | ✅ | — | — | — | — | — | — |
| `/settings/developers` | `developers.manage` | ✅ | — | — | — | — | — | — |
| `/settings/staff` | `staff.manage` | ✅ | ✅ | — | — | — | — | — |
| `/settings/roles` | `staff.manage` | ✅ | ✅ | — | — | — | — | — |
| `/settings/audit` | `audit.read` | ✅ | ✅ | — | — | — | — | ✅ |
| `/settings` | `settings.manage` | ✅ | ✅ | — | — | — | — | — |
| `/orders` | `orders.read` | ✅ | ✅ | — | ✅ | ✅ | — | ✅ |
| `/returns` | `returns.manage` | ✅ | ✅ | — | ✅ | ✅ | — | — |
| `/abandoned-carts` | `marketing.manage` | ✅ | ✅ | — | — | — | ✅ | — |
| `/customers` | `customers.read` | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| `/products` | `products.read` | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| `/reviews` | `products.read` | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| `/categories` | `products.read` | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| `/collections` | `products.read` | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| `/brands` | `products.read` | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| `/inventory` | `products.read` | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| `/imports` | `products.read` | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| `/inbox` | `conversations.read` | ✅ | ✅ | — | — | ✅ | — | ✅ |
| `/conversations` | `conversations.read` | ✅ | ✅ | — | — | ✅ | — | ✅ |
| `/approvals` | `approvals.decide` | ✅ | ✅ | — | — | ✅ | — | — |
| `/agents` | `agents.read` | ✅ | ✅ | — | — | ✅ | — | ✅ |
| `/knowledge` | `agents.read` | ✅ | ✅ | — | — | ✅ | — | ✅ |
| `/shipments` | `shipments.manage` | ✅ | ✅ | — | ✅ | — | — | — |
| `/shipping` | `settings.manage` | ✅ | ✅ | — | — | — | — | — |
| `/invoices` | `invoices.read` | ✅ | ✅ | — | ✅ | — | — | ✅ |
| `/marketing` | `marketing.manage` | ✅ | ✅ | — | — | — | ✅ | — |
| `/reports` | `reports.read` | ✅ | ✅ | — | — | — | ✅ | ✅ |
| `/storefront` | `storefront.manage` | ✅ | ✅ | — | — | — | — | — |
| `/store-design` | `storefront.manage` | ✅ | ✅ | — | — | — | — | — |
| `/media` | `storefront.manage` | ✅ | ✅ | — | — | — | — | — |
| `/apps` | `apps.manage` | ✅ | ✅ | — | — | — | — | — |

المسارات غير المدرجة مفتوحة لكل الأدوار: `/` (الرئيسية)، `/copilot`، `/onboarding`.

**مصفوفة الأدوار × الصلاحيات:**

| الصلاحية | owner | admin | catalog | orders | support | marketing | readonly |
|---|---|---|---|---|---|---|---|
| `orders.read` | ✅ | ✅ | — | ✅ | ✅ | — | ✅ |
| `orders.manage` | ✅ | ✅ | — | ✅ | — | — | — |
| `orders.refund` | ✅ | ✅ | — | ✅ | — | — | — |
| `prices.update` | ✅ | ✅ | — | ✅ | — | — | — |
| `products.read` | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| `products.manage` | ✅ | ✅ | ✅ | — | — | — | — |
| `inventory.manage` | ✅ | ✅ | ✅ | — | — | — | — |
| `customers.read` | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| `customers.manage` | ✅ | ✅ | — | — | — | — | — |
| `customers.export` | ✅ | ✅ | — | — | — | ✅ | — |
| `conversations.read` | ✅ | ✅ | — | — | ✅ | — | ✅ |
| `conversations.reply` | ✅ | ✅ | — | — | ✅ | — | — |
| `approvals.decide` | ✅ | ✅ | — | — | ✅ | — | — |
| `agents.read` | ✅ | ✅ | — | — | ✅ | — | ✅ |
| `agents.manage` | ✅ | ✅ | — | — | — | — | — |
| `knowledge.manage` | ✅ | ✅ | — | — | — | — | — |
| `shipments.manage` | ✅ | ✅ | — | ✅ | — | — | — |
| `invoices.read` | ✅ | ✅ | — | ✅ | — | — | ✅ |
| `returns.manage` | ✅ | ✅ | — | ✅ | ✅ | — | — |
| `marketing.manage` | ✅ | ✅ | — | — | — | ✅ | — |
| `reports.read` | ✅ | ✅ | — | — | — | ✅ | ✅ |
| `storefront.manage` | ✅ | ✅ | — | — | — | — | — |
| `apps.manage` | ✅ | ✅ | — | — | — | — | — |
| `settings.manage` | ✅ | ✅ | — | — | — | — | — |
| `staff.manage` | ✅ | ✅ | — | — | — | — | — |
| `billing.manage` | ✅ | — | — | — | — | — | — |
| `audit.read` | ✅ | ✅ | — | — | — | — | ✅ |
| `developers.manage` | ✅ | — | — | — | — | — | — |

## ز. كيانات contracts ومهام الـ Backend

| الكيان | الملف | الحقول |
|---|---|---|
| App | `commerce/entities-apps.ts` | 15 (id، name، icon، developer، category، shortDescription، description، screenshots…) |
| AppInstallation | `commerce/entities-apps.ts` | 9 (id، appId، grantedScopes، installedBy، installedAt، lastActivityAt، status، settings…) |
| ApiKey | `commerce/entities-apps.ts` | 7 (id، name، scopes، prefix، createdBy، lastUsedAt، expiresAt) |
| WebhookSubscription | `commerce/entities-apps.ts` | 6 (id، url، events، secret، status، deliveries) |
| Variant | `commerce/entities-catalog.ts` | 12 (id، optionValues، sku، barcode، price، compareAtPrice، cost، weightGrams…) |
| Product | `commerce/entities-catalog.ts` | 22 (id، name، slug، description، shortDescription، type، status، media…) |
| Media | `commerce/entities-catalog.ts` | 9 (id، url، altAr، altEn، width، height، mime، sizeBytes…) |
| Brand | `commerce/entities-catalog.ts` | 8 (id، name، slug، description، logo، website، status، createdAt) |
| ProductQuestion | `commerce/entities-catalog.ts` | 8 (id، productId، authorName، question، answer، answeredBy، status، createdAt) |
| Category | `commerce/entities-catalog.ts` | 8 (id، name، slug، description، image، seo، parentId، sortOrder) |
| Collection | `commerce/entities-catalog.ts` | 10 (id، name، slug، description، image، seo، type، productIds…) |
| Location | `commerce/entities-catalog.ts` | 6 (id، name، city، address، isDefault، status) |
| InventoryLevel | `commerce/entities-catalog.ts` | 6 (variantId، locationId، onHand، reserved، available، lowStockThreshold) |
| InventoryMovement | `commerce/entities-catalog.ts` | 10 (id، variantId، locationId، delta، reason، note، reference، actor…) |
| Customer | `commerce/entities-customer.ts` | 21 (id، name، phone، email، gender، birthDate، addresses، tags…) |
| Address | `commerce/entities-customer.ts` | 14 (id، label، recipientName، phone، city، district، street، buildingNumber…) |
| LoyaltyTier | `commerce/entities-growth.ts` | 4 (key، name، minPoints، perks) |
| LoyaltySettings | `commerce/entities-growth.ts` | 5 (enabled، earnRate، redeemRate، tiers، expiryDays) |
| LoyaltyAccount | `commerce/entities-growth.ts` | 5 (customerId، points، lifetimeEarned، tier، updatedAt) |
| LoyaltyTransaction | `commerce/entities-growth.ts` | 9 (id، customerId، type، points، note، reference، actor، at…) |
| GiftCard | `commerce/entities-growth.ts` | 9 (id، code، initialBalance، balance، customerId، status، expiresAt، issuedBy…) |
| GiftCardTransaction | `commerce/entities-growth.ts` | 9 (id، cardId، type، amount، orderId، note، actor، at…) |
| Affiliate | `commerce/entities-growth.ts` | 8 (id، name، email، code، status، commissionRate، stats، createdAt) |
| AffiliateConversion | `commerce/entities-growth.ts` | 7 (id، affiliateId، orderId، orderNumber، total، commission، at) |
| AffiliatePayout | `commerce/entities-growth.ts` | 7 (id، affiliateId، amount، status، note، createdAt، paidAt) |
| PriceListRule | `commerce/entities-growth.ts` | 4 (id، variantId، percentOff، fixedPrice) |
| PriceList | `commerce/entities-growth.ts` | 6 (id، name، status، customerIds، rules، createdAt) |
| DigitalAsset | `commerce/entities-growth.ts` | 9 (id، productId، variantId، name، kind، mediaId، url، sizeBytes…) |
| DigitalDelivery | `commerce/entities-growth.ts` | 7 (id، orderId، orderItemId، assetId، name، url، deliveredAt) |
| Message | `commerce/entities-inbox.ts` | 9 (id، from، type، content، attachments، toolCalls، deliveryStatus، ref…) |
| Conversation | `commerce/entities-inbox.ts` | 17 (id، channel، customerId، contact، status، currentAgentId، agentPath، assigneeId…) |
| AgentApproval | `commerce/entities-inbox.ts` | 12 (id، agentId، conversationId، action، target، amount، reason، status…) |
| KnowledgeSource | `commerce/entities-inbox.ts` | 11 (id، type، title، file، url، faq، status، chunksCount…) |
| Coupon | `commerce/entities-marketing.ts` | 17 (id، code، type، value، maxDiscount، minOrderAmount، appliesTo، excludeSaleItems…) |
| Promotion | `commerce/entities-marketing.ts` | 10 (id، name، type، status، benefit، config، startsAt، endsAt…) |
| RecoveryAttempt | `commerce/entities-marketing.ts` | 6 (channel، at، agentId، opened، templateId، message) |
| AbandonedCart | `commerce/entities-marketing.ts` | 10 (id، customerId، phone، items، total، abandonedAt، source، recoveryStatus…) |
| RecoveryTemplate | `commerce/entities-marketing.ts` | 5 (id، name، channel، content، enabled) |
| ImportJob | `commerce/entities-marketing.ts` | 11 (id، type، source، fileName، status، rowsSucceeded، rowsFailed، errorFileUrl…) |
| AdminNotification | `commerce/entities-marketing.ts` | 8 (id، event، params، href، ref، at، read، archived) |
| NotificationPreferences | `commerce/entities-marketing.ts` | 1 (matrix) |
| OrderItem | `commerce/entities-order.ts` | 15 (id، variantId، productId، productName، variantLabel، sku، image، quantity…) |
| OrderEvent | `commerce/entities-order.ts` | 6 (id، type، actor، at، data، link) |
| Order | `commerce/entities-order.ts` | 35 (id، number، customerId، channel، agentId، conversationId، affiliateCode، locationId…) |
| ReturnEvent | `commerce/entities-order.ts` | 5 (id، type، actor، at، data) |
| Return | `commerce/entities-order.ts` | 20 (id، number، orderId، customerId، items، reason، customerNote، photos…) |
| Payment | `commerce/entities-order.ts` | 12 (id، orderId، amount، method، status، provider، providerRef، cardBrand…) |
| Refund | `commerce/entities-order.ts` | 14 (id، paymentId، orderId، amount، reason، status، items، restock…) |
| Shipment | `commerce/entities-order.ts` | 17 (id، orderId، customerId، type، carrier، service، trackingNumber، trackingUrl…) |
| Invoice | `commerce/entities-order.ts` | 17 (id، number، type، orderId، returnId، customerId، customer، lines…) |
| Subscription | `commerce/entities-platform.ts` | 6 (planId، status، currentPeriodEnd، usage، addons، invoices) |
| AuditLog | `commerce/entities-platform.ts` | 8 (id، actor، action، target، changes، ip، at، conversationId) |
| CopilotTaskSchedule | `commerce/entities-platform.ts` | 2 (hour، minute) |
| CopilotTask | `commerce/entities-platform.ts` | 10 (id، storeId، kind، title، prompt، schedule، threshold، enabled…) |
| CopilotSettings | `commerce/entities-platform.ts` | 4 (alwaysConfirm، blockedTools، language، dialect) |
| CopilotStoredMessage | `commerce/entities-platform.ts` | 6 (id، role، text، response، refs، createdAt) |
| CopilotConversation | `commerce/entities-platform.ts` | 9 (id، storeId، title، messages، pinned، shared، ownerId، createdAt…) |
| SalesPoint | `commerce/entities-platform.ts` | 3 (date، revenue، orders) |
| DashboardSummary | `commerce/entities-platform.ts` | 10 (revenue، revenueDelta، orders، ordersDelta، averageOrderValue، aovDelta، conversionRate، conversionDelta…) |
| Tenant | `commerce/entities-platform.ts` | 13 (id، name، domain، ownerName، ownerEmail، city، plan، status…) |
| Plan | `commerce/entities-platform.ts` | 8 (id، name، monthlyPrice، aiConversations، staffSeats، transactionFee، features، tenants) |
| PlatformSummary | `commerce/entities-platform.ts` | 12 (mrr، mrrDelta، tenants، tenantsDelta، gmv، gmvDelta، aiConversations، aiDelta…) |
| StoreSubscription | `commerce/entities-platform.ts` | 7 (id، tenantId، plan، status، mrr، currentPeriodEnd، startedAt) |
| StoreUsage | `commerce/entities-platform.ts` | 4 (tenantId، aiMessages، aiTokens، apiCalls) |
| AppSubmission | `commerce/entities-platform.ts` | 14 (id، name، tagline، description، developer، developerEmail، category، scopes…) |
| PlatformPartner | `commerce/entities-platform.ts` | 7 (id، name، company، email، appsCount، status، joinedAt) |
| ProviderIntegration | `commerce/entities-platform.ts` | 6 (id، kind، name، description، enabled، storesCount) |
| PlatformJob | `commerce/entities-platform.ts` | 6 (id، name، status، lastRunAt، durationMs، failures) |
| FeatureFlag | `commerce/entities-platform.ts` | 7 (id، key، name، description، enabled، scope، audience) |
| PlatformStaff | `commerce/entities-platform.ts` | 6 (id، name، email، role، status، lastActiveAt) |
| TenantStaff | `commerce/entities-platform.ts` | 5 (id، name، email، role، status) |
| TenantOrder | `commerce/entities-platform.ts` | 5 (id، number، total، status، at) |
| PartnerApp | `commerce/entities-platform.ts` | 18 (id، name، tagline، category، status، installs، rating، revenue…) |
| PartnerSummary | `commerce/entities-platform.ts` | 9 (installs، installsDelta، revenue، revenueDelta، apiCalls، apiCallsDelta، errorRate، series…) |
| TestStore | `commerce/entities-platform.ts` | 4 (id، name، url، createdAt) |
| PaymentSettings | `commerce/entities-settings.ts` | 5 (providerAccountStatus، methods، cod، bankTransfer، settlement) |
| ShippingRate | `commerce/entities-settings.ts` | 3 (type، conditions، price) |
| ShippingSettings | `commerce/entities-settings.ts` | 6 (pickupAddress، zones، carriers، freeShippingThreshold، fallbackRate، handlingDays) |
| TaxSettings | `commerce/entities-settings.ts` | 5 (vatEnabled، vatRate، pricesIncludeTax، zatcaStatus، egsSerial) |
| NotificationTemplate | `commerce/entities-settings.ts` | 5 (event، channel، enabled، content، whatsappTemplateStatus) |
| ChannelNumber | `commerce/entities-settings.ts` | 6 (id، phone، displayName، status، qualityRating، agentId) |
| SocialChannelConnection | `commerce/entities-settings.ts` | 6 (id، kind، handle، status، agentId، connectedAt) |
| ChannelSettings | `commerce/entities-settings.ts` | 4 (whatsappNumbers، voiceNumbers، webchat، social) |
| MaintenanceSettings | `commerce/entities-settings.ts` | 3 (enabled، message، eta) |
| MerchantBilling | `commerce/entities-settings.ts` | 8 (planId، status، currentPeriodEnd، monthlyPrice، usage، addons، invoices، paymentMethod) |
| ReturnPolicySettings | `commerce/entities-settings.ts` | 5 (windowDays، reasons، nonReturnableProductIds، allowExchange، allowStoreCredit) |
| StoreVerification | `commerce/entities-settings.ts` | 3 (status، rejectionReason، documents) |
| Store | `commerce/entities-store.ts` | 20 (id، name، slug، logo، favicon، industry، contactPhone، contactEmail…) |
| Staff | `commerce/entities-store.ts` | 10 (id، name، email، phone، roleId، status، mfaEnabled، lastLoginAt…) |
| Role | `commerce/entities-store.ts` | 5 (id، name، description، permissions، isSystem) |
| CurrentUser | `commerce/entities-store.ts` | 3 (staff، role، permissions) |
| ThemeSectionVisibility | `commerce/entities-theme.ts` | 3 (mobile، tablet، desktop) |
| ThemeSection | `commerce/entities-theme.ts` | 6 (id، type، hidden، visibility، settings، blocks) |
| ThemeGlobals | `commerce/entities-theme.ts` | 8 (primaryColor، font، headingFont، spacing، radius، logoPosition، announcementBar، logo) |
| ColorScheme | `commerce/entities-theme.ts` | 8 (id، nameAr، nameEn، background، text، buttonBg، buttonText، accent) |
| ThemePreset | `commerce/entities-theme.ts` | 5 (id، nameAr، nameEn، globals، colorSchemeOverrides) |
| ThemeCustomTemplate | `commerce/entities-theme.ts` | 4 (id، nameAr، nameEn، sections) |
| ThemeVersion | `commerce/entities-theme.ts` | 5 (id، at، actor، note، snapshot) |
| ThemeShare | `commerce/entities-theme.ts` | 5 (id، token، themeId، createdAt، expiresAt) |
| ThemeFeatureSettings | `commerce/entities-theme.ts` | 1 (scarcityThreshold) |
| Theme | `commerce/entities-theme.ts` | 14 (id، name، sections، globals، features، featureSettings، colorSchemes، presets…) |
| Page | `commerce/entities-theme.ts` | 8 (id، title، slug، content، seo، status، showInMenu، templateId) |
| MenuItem | `commerce/entities-theme.ts` | 6 (id، label، linkType، targetId، url، children) |
| Menu | `commerce/entities-theme.ts` | 3 (id، location، items) |
| Domain | `commerce/entities-theme.ts` | 7 (id، hostname، type، verificationStatus، sslStatus، dnsRecords، isPrimary) |
| SeoRedirect | `commerce/entities-theme.ts` | 4 (id، from، to، createdAt) |
| StorefrontSeo | `commerce/entities-theme.ts` | 3 (title، description، shareImage) |
| BackInStockSubscription | `commerce/entities-theme.ts` | 5 (id، productId، phone، createdAt، notifiedAt) |
| Review | `commerce/entities-theme.ts` | 10 (id، productId، customerId، rating، text، images، verifiedPurchase، status…) |
| Money | `common.ts` | 2 (amount، currency) |
| LocalizedText | `common.ts` | 2 (ar، en) |
| MediaRef | `common.ts` | 5 (id، url، alt، width، height) |
| ActorRef | `common.ts` | 3 (type، id، name) |
| EntityRef | `common.ts` | 3 (type، id، label) |
| Seo | `common.ts` | 3 (title، description، imageId) |
| AgentPersona | `studio.ts` | 4 (tone، dialect، greeting، language) |
| AgentToolConfig | `studio.ts` | 4 (toolId، enabled، requiresApproval، limit) |
| HandoffRule | `studio.ts` | 5 (id، targetType، targetId، condition، priority) |
| VoiceSettings | `studio.ts` | 7 (voiceId، speed، pitch، interruptible، silenceTimeoutSec، maxCallMinutes، recordCalls) |
| WhatsAppSettings | `studio.ts` | 4 (phoneNumberId، templates، replyDelaySec، sendTypingIndicator) |
| WorkingDay | `studio.ts` | 4 (day، enabled، from، to) |
| AgentStats | `studio.ts` | 5 (conversations، resolutionRate، handoffRate، avgDurationSec، cost) |
| Agent | `studio.ts` | 21 (id، parentId، name، avatar، role، description، channels، persona…) |
| AgentVersion | `studio.ts` | 7 (id، agentId، version، publishedAt، author، note، changes) |
| AgentPerformancePoint | `studio.ts` | 6 (date، conversations، resolutionRate، handoffRate، avgDurationSec، cost) |
| StudioSummary | `studio.ts` | 10 (conversationsToday، conversationsDelta، callsToday، callsDelta، resolutionRate، resolutionDelta، humanHandoffRate، handoffDelta…) |
| TraceStep | `studio.ts` | 9 (id، kind، agentId، targetId، toolId، reason، result، atMs…) |
| SimulatedTurn | `studio.ts` | 3 (reply، path، steps) |
| AgentTestCase | `studio.ts` | 7 (id، question، expected، expectedAgentId، channel، lastResult، lastAnswer) |
| TranscriptLine | `studio.ts` | 5 (id، speaker، agentId، text، atSec) |
| AgentSession | `studio.ts` | 8 (id، channel، customerName، customerPhone، agentPath، startedAt، durationSec، transcript) |
| PhoneNumber | `studio.ts` | 6 (id، number، provider، agentId، status، callsToday) |
| WhatsAppNumber | `studio.ts` | 8 (id، number، displayName، status، quality، agentId، dailyLimit، templates) |

**Hooks المعروضة عبر `@repo/api-client` (mock — كل مجموعة = مهمة ربط Backend):**

- `commerce-hooks.ts` (285): useStoreList، useStoreBySlug، useStaffList، useMe، useCurrentUser، useRoles، useRole، useCategoryList، useProductList، useProductById، useInventoryLevels، useInventoryMovements…
- `platform-hooks.ts` (23): usePlatformSummary، useTenants، useTenant، usePlans، usePlan، usePlatformSubscriptions، usePlatformUsage، usePlatformThemes، useTenantStaff، useTenantOrders، useAppSubmissions، useAppSubmission…
- `studio-hooks.ts` (29): useStudioSummary، useAgents، useAgent، useAgentVersions، useKnowledgeSources، useAgentVoices، useAgentPerformance، useAgentTests، useLiveSessions، useSessionHistory، useSessionRecord، usePhoneNumbers…

## ح. الجودة

| الفحص | النتيجة | المدة |
|---|---|---|
| `pnpm typecheck` | ✅ | 0ث |
| `pnpm lint` | ✅ | 8ث |
| عقود (`tsc --noEmit packages/contracts`) | ✅ | 0ث |
| e2e smoke | 254✅ 1❌ | 254ث |

**مخالفات i18n (مفاتيح ar/en غير المتطابقة):**
- @repo/ui: ar=1235 · en=1235 · ناقص en: 0 · ناقص ar: 0
- apps/admin: ar=4516 · en=4516 · ناقص en: 0 · ناقص ar: 0
- apps/storefront: ar=495 · en=495 · ناقص en: 0 · ناقص ar: 0
- apps/super-admin: ar=252 · en=252 · ناقص en: 0 · ناقص ar: 0
- apps/partners: ar=165 · en=165 · ناقص en: 0 · ناقص ar: 0

**أكبر 10 ملفات:**

- `packages/mocks/src/spec/index.ts` — 790 سطراً
- `packages/api-client/src/commerce/orders.ts` — 734 سطراً
- `packages/mocks/src/data/agents.ts` — 555 سطراً
- `packages/api-client/src/commerce-hooks.ts` — 518 سطراً
- `packages/mocks/src/spec/platform.ts` — 509 سطراً
- `packages/api-client/src/commerce/catalog.ts` — 424 سطراً
- `packages/api-client/src/commerce/db.ts` — 415 سطراً
- `apps/storefront/src/features/checkout/checkout-view.tsx` — 394 سطراً
- `packages/contracts/src/commerce/entities-platform.ts` — 334 سطراً
- `packages/api-client/src/commerce/themes.ts` — 293 سطراً

**ملفات > 250 سطراً (19):**

`packages/mocks/src/spec/index.ts` (790)، `packages/api-client/src/commerce/orders.ts` (734)، `packages/mocks/src/data/agents.ts` (555)، `packages/api-client/src/commerce-hooks.ts` (518)، `packages/mocks/src/spec/platform.ts` (509)، `packages/api-client/src/commerce/catalog.ts` (424)، `packages/api-client/src/commerce/db.ts` (415)، `apps/storefront/src/features/checkout/checkout-view.tsx` (394)، `packages/contracts/src/commerce/entities-platform.ts` (334)، `packages/api-client/src/commerce/themes.ts` (293)، `apps/admin/src/features/catalog/product-editor.tsx` (281)، `apps/admin/src/features/orders/new-order.tsx` (281)، `apps/storefront/src/features/checkout/checkout-steps.tsx` (275)، `packages/storefront-sections/src/schemas.ts` (269)، `apps/admin/src/features/studio/agent-dialogs.tsx` (259)، `apps/admin/src/features/studio/lab/test-cases.tsx` (259)، `apps/admin/src/features/dashboard/home-view.tsx` (253)، `apps/admin/src/features/catalog/products-list.tsx` (252)، `apps/admin/src/features/shipping/shipping-view.tsx` (251)


**حجم JS التقريبي لكل تطبيق** (من `.next/app-build-manifest.json` — يشمل chunks مشتركة):
- admin: غير مقاس (لا manifest أو dev build)
- storefront: غير مقاس (لا manifest أو dev build)
- super-admin: غير مقاس (لا manifest أو dev build)
- partners: غير مقاس (لا manifest أو dev build)

**مقاييس إنتاج مقاسة** (production (next build + next start) — first-load JS من manifest البناء، LCP عبر `PerformanceObserver` — 23‏/11‏/2026، 12:10:47 م):

| المسار | first-load JS | LCP |
|---|---|---|
| المتجر — الرئيسية / | ~803 KB | 0.45 ث |
| المتجر — منتج /p/… | ~841 KB | 0.73 ث |
| المتجر — تصنيف /c/… | ~761 KB | 0.40 ث |
| لوحة التاجر — الرئيسية | ~1209 KB | 0.48 ث |

إعادة القياس: `node scripts/ui-report/measure.mjs` (يتطلب بناء إنتاج وخوادم `next start`).

## ط. النواقص والقرارات والديون

### حرج

- e2e: 1 مساراً فاشلاً

### مهم

- حراسات المسارات تغطي لوحة التاجر فقط — بقية التطبيقات بلا نموذج صلاحيات (super-admin/partners بأدوار منصة منفصلة).
- المسارات الموصوفة المغطاة بـ catch-all في admin (0): 
- مسارات موجودة غير موثقة بالمواصفات: `/[store]/[...rest]`، `/[store]/brands`، `/[store]/collections/new`، `/[store]/copilot/history`، `/[store]/copilot`، `/[store]/copilot/tasks`، `/[store]/inventory/locations`، `/[store]/marketing/affiliates/[id]`، `/[store]/marketing/affiliates`، `/[store]/marketing/gift-cards/[id]`، `/[store]/marketing/gift-cards`، `/[store]/marketing/loyalty`، `/[store]/notifications`، `/[store]/onboarding/[step]`، `/[store]/products/price-lists`
- 19 ملفاً يتجاوز حد الـ 250 سطراً (قاعدة المشروع).

### تحسين

- 2 إشارة TODO/FIXME — أولها: `apps/storefront/src/features/product/delivery-estimate.tsx:39:    /* TODO(geolocation): resolve the visitor's city via geo-IP; until then we`.
- حالات ⚠️ في COVERAGE.md (محاكاة مقيّدة): التقسيط واجهة فقط، «صمم بالـ AI» توليد محلي، محرر القوائم بلا سحب وإفلات، تقدير التوصيل ثابت، روابط المعاينة بكوكي محلي.
- مقاييس §ح أعلاه مأخوذة من بناء إنتاج حقيقي (`next build` + `next start`) — لا dev manifests. أرقام dev تختلف (chunks غير مُحسّنة).

### القرارات الموثقة (من AGENTS.md / COVERAGE.md)

- المنصة **frontend فقط**: كل البيانات mock داخل المتصفح عبر `@repo/api-client` — أي «خادم» محاكى محلياً.
- سطح Copilot المشترك في `packages/copilot/src/ui` لتجنب دورة `ui→copilot`.
- مكوّنات تعتمد طبقة التطبيق (EntityLink، store-link، cart-context…) تبقى في `apps/<app>/src/components` — استثناء موثق.
- سجل/مهام/إعدادات مساعد المنصة ❌ — «نطاق التاجر فقط — لا جدوى لمهام متجر واحد على مستوى المنصة».
- perfume هو الثيم الافتراضي؛ بوابة كتابة التقييمات مبسطة (أي طلب مُوصّل).

### خطوات مقترحة

1. معالجة البنود الحرجة أعلاه (مسارات الـ spec الناقصة، تطابق المفاتيح).
2. تقسيم الملفات > 250 سطراً بدءاً بالأكبر.
3. توسيع نموذج الصلاحيات لبقية التطبيقات أو توثيق قرار «لوحة التاجر فقط».
4. تفعيل e2e في CI مع تشغيل الخوادم (هذا التقرير يتخطاه تلقائياً عند غيابها).
5. تغطية اللقطات الإنجليزية لكل المسارات (حالياً عيّنة فقط — انظر reports/ui/shots).
