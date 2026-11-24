# تقرير التغطية — شاشات ونظام الثيمات

> يغطي كل شاشات `SCREENS_SPEC.md` §5 وبنود `THEME_SYSTEM_SPEC.md` (1–9) بعد المراحل أ–و.
> ✅ منفذ · ⚠️ منفذ جزئياً أو محاكى (القيد موضح) · ❌ غير منفذ
> **ملاحظة عامة:** المنصة frontend فقط — كل البيانات mock داخل المتصفح عبر `@repo/api-client` (react-query + localStorage/cookies)، فأي سلوك «خادم» محاكى محلياً.

---

## 1. لوحة التاجر `apps/admin` (SCREENS_SPEC §5)

| § | الشاشة | الحالة | الملفات | قيود |
|---|---|---|---|---|
| 5.1 | الرئيسية `/[store]` · `/` | ✅ | `apps/admin/src/features/dashboard/` | أرقام وبيانات mock |
| 5.2 | الطلبات `/orders` | ✅ | `features/orders/orders-list.tsx` | شريط إحصاءات (يحتاج إجراء/طلبات وإيرادات اليوم) |
| 5.3 | تفاصيل الطلب `/orders/[id]` | ✅ | `features/orders/order-view.tsx` | تعديل الطلب (orders.edit) + عنوان فوترة + نسخ البيانات + إنشاء مرتجع |
| 5.4 | طلب يدوي `/orders/new` | ✅ | `features/orders/new-order.tsx` | — |
| 5.5 | المرتجعات `/returns` + `[id]` + `/returns/new` | ✅ | `features/orders/returns*`, `new-return.tsx` | قبول جزئي + طلب معلومات + سجل نشاط + سياسة إرجاع بإعدادات الشحن |
| 5.6 | السلات المتروكة `/abandoned-carts` + `[id]` | ✅ | `features/orders/abandoned-carts*` | قوالب استرجاع + تذكير ثانٍ + قواعد استبعاد + مصدر/احتمالية |
| 5.7 | المنتجات `/products` | ✅ | `features/catalog/products-list*`, `products-export.tsx` | شريط إحصاءات (نشط/مسودة/مؤرشف/منخفض-نافد) · بحث اسم/SKU/باركود · تصدير CSV باختيار أعمدة + سطر لكل نسخة (يحترم الفلاتر والتحديد) · `/products?import=<jobId>` يعرض منتجات المهمة فقط |
| 5.8 | المنتج `/products/[id]` + `/new` | ✅ | `features/catalog/product-editor*` | «اكتب بالـ AI» نصوص محلية جاهزة · حذف نهائي بتأكيد · حارس تغييرات غير محفوظة · مسودة `sessionStorage` لمنتج جديد · slug + معاينة SERP ومشاركة اجتماعية · باركود/تكلفة/هامش/صورة لكل نسخة · حذف نسخة بتحذير لو داخلة بطلبات · تعديل جماعي سعر/وزن · تحقق سعر صالح + SKU/باركود مكرر (يمنع النشر الناقص) · نص بديل ar/en للصور · روابط orders/reviews/inbox/inventory بالمنتج |
| 5.9 | التقييمات `/reviews` + `?product=<id>` | ✅ | `features/reviews/reviews-view.tsx` + `review-reply-dialog.tsx` | اعتماد/إخفاء/ردّ على `Review` — pending لا يظهر بالمتجر إلا بعد الاعتماد · فلترة بالمنتج عبر رابط المحرر |
| 5.10 | التصنيفات `/categories` + المجموعات `/collections` | ✅ | `features/catalog/categories-view*`, `features/catalog/collections*` | حذف تصنيف (إعادة تعليق الأبناء + فك المنتجات) · حذف تشكيلة · صورة تشكيلة · إعادة ترتيب منتجات يدوية · حارس تغييرات · `/categories?id=` يفتح المحرر |
| 5.11 | المخزون `/inventory` + `[variantId]` | ✅ | `features/catalog/inventory*` | بحث منتج/SKU/باركود · تعديل بملاحظة إلزامية + منع السالب · سجل حركات |
| 5.12 | الاستيراد `/imports` + `[id]` | ✅ | `features/catalog/imports*` | لا رفع ملف فعلي — سلة/زد موسومة «محاكاة» صراحة · استيراد منتجات ينشئ منتجات حقيقية + `productIds` في المهمة · زر «عرض المستوردة» يفتح قائمة مفلترة · «إعادة الاستيراد» في التفاصيل |
| 5.13 | العملاء `/customers` + `[id]` | ✅ | `features/customers/` | شريط إحصاءات (الكل/VIP/عائد/معرّض للخطر) · حذف/إخفاء هوية بكتابة تأكيد · ملاحظات في حوار التعديل |
| 5.14 | الكوبونات + العروض `/marketing` | ✅ | `features/marketing/` | العروض promotions أولية |
| 5.15 | المحادثات `/inbox` + `/conversations` | ✅ | `features/inbox/` | ردود AI المقترحة نصوص محلية |
| 5.16 | موافقات الوكيل `/approvals` | ✅ | `features/approvals/` | — |
| 5.17 | الوكلاء `/agents` | ✅ | `features/studio/` (detail/lab/ops) | — |
| 5.18 | قاعدة المعرفة `/knowledge` + `[id]` | ✅ | `features/knowledge/` | المعالجة محاكاة فورية |
| 5.19 | الشحنات `/shipments` + `[id]` + `/shipping` | ✅ | `features/shipments/`, `features/shipping/` | أسعار الناقلات ثابتة |
| 5.20 | الفواتير `/invoices` + `[id]` | ✅ | `features/invoices/` | ZATCA محاكى |
| 5.21 | التقارير `/reports` + `[type]` | ✅ | `features/reports/` | — |
| 5.22 | تصميم المتجر — انظر §3 أدناه | ✅ | `features/store-design/`, `features/storefront/` | — |
| 5.23 | التطبيقات `/apps` | ✅ | `features/apps/` | — |
| 5.24 | الإعدادات `/settings` | ✅ | `features/settings/` | — |
| 5.25 | المساعد `/copilot` + لوحة Cmd/Ctrl+J | ✅ | `features/copilot/` + `packages/copilot/src/ui/` | سطح العرض المشترك في `packages/copilot/src/ui` (تجنب دورة `ui→copilot`) — التطبيق يزوّد الموفر والروابط |
| 5.25 | مهام المساعد `/copilot/tasks` | ✅ | `features/copilot/tasks-view.tsx`, `task-dialog.tsx` · `commerce.copilotTasks` | `runNow` محاكى — لا جدولة فعلية |
| 5.25 | سجل المحادثات `/copilot/history` + `?c=<id>` | ✅ | `features/copilot/history-view.tsx`, `copilot-context.tsx`, `copilot-storage.ts` | مشاركة الموظفين الآخرين للعرض فقط؛ التخزين بذاكرة mock |
| 5.25 | إعدادات المساعد `/settings/copilot` | ✅ | `features/settings/copilot-settings.tsx` · `commerce.copilotSettings` | الحظر والتأكيد يُطبقان في `guards.ts`/`scenario-engine.ts` |
| 5.25 | تدقيق Copilot | ✅ | `executor.ts` (`auditToolRun`) · `commerce.audit.log` | الفاعل «🤖 Copilot نيابة عن {user}» + `conversationId` |
| — | مكتبة الوسائط `/media` | ✅ | `features/media/media-library.tsx`, `media-card.tsx` | رفع dataURL محلي؛ الضغط canvas (1600px، jpeg 0.8) |
| — | الدخول `/login` `/signup` `/forgot` `/mfa` `/invite` | ✅ | `features/auth/` | جلسات وهمية — لا تحقق حقيقي |
| — | `/dev/messages` · `/design-system` | ✅ | `app/dev/messages`, `app/design-system` | — |

| — | التهيئة `/onboarding` | ✅ | `features/onboarding/` | معالج 4 خطوات — بيانات محلية |
| — | محرر التصميم `/store-design` | ✅ | `features/store-design/` | — |
| — | إدارة واجهة المتجر `/storefront` | ✅ | `features/storefront/` | صفحات/قوائم/ثيمات/SEO/نطاقات |

## 2. المتجر  `apps/storefront` (واجهة العميل)

| المسار/الميزة | الحالة | الملفات | قيود |
|---|---|---|---|
| `/` رئيسية بأقسام الثيم | ✅ | `features/home/home-view.tsx` + `ThemeTemplateRenderer` | الأقسام من الثيم النشط |
| `/c/[slug]` التصنيف + فلاتر | ✅ | `features/category/category-view.tsx`, `components/filters-ui.tsx`, `product-filters.ts` | — |
| `/p/[slug]` · `/products/[id]` المنتج | ✅ | `features/product/product-detail.tsx` + بقية `features/product/` | — |
| `/search` | ✅ | `features/search/search-view.tsx` | — |
| `/cart` · `/checkout` · `/order/[token]` | ✅ | `features/cart/`, `features/checkout/`, `features/order/` | الدفع محاكى (بطاقة/COD) |
| `/pages/[slug]` صفحات CMS | ✅ | `features/cms/cms-view.tsx` | يعرض `templateId` (قالب أقسام) أو المحتوى النصي |
| `/wishlist` | ✅ | `features/wishlist/wishlist-view.tsx`, `components/wishlist-context.tsx` | localStorage للضيف؛ «ينتقل عند الدخول» غير منفذ (لا حسابات حقيقية) |
| `/compare` | ✅ | `features/compare/compare-view.tsx`, `components/compare-context.tsx`, `compare-bar.tsx` | حتى 4 بنفس التصنيف — مطابق |
| تقييمات المنتج | ✅ | `features/product/product-reviews.tsx`, `review-dialog.tsx` | ⚠️ بوابة الكتابة مبسطة: أي طلب مُوصّل يحوي المنتج (بدون ربط بحساب عميل) |
| العرض السريع | ✅ | `features/product/quick-view-dialog.tsx` | — |
| شاهدت مؤخراً | ✅ | `features/recently-viewed/recently-viewed-strip.tsx`, `lib/recently-viewed` + قسم `recently-viewed` | آخر 10 بـ localStorage |
| شريط شراء ثابت (جوال) | ✅ | `features/product/sticky-buy-bar.tsx` | — |
| مؤشرات الندرة + «يشاهد الآن» | ✅ | `components/scarcity.tsx` | ⚠️ «يشاهد الآن» رقم شبه عشوائي من seed المنتج |
| تقدير التوصيل | ✅ | `features/product/delivery-estimate.tsx` | ⚠️ تقدير ثابت من إعدادات الشحن mock |
| دليل المقاسات | ✅ | `features/product/size-guide.tsx` | جدول ثابت لكل تصنيف |
| أعلمني عند التوفر | ✅ | `features/product/back-in-stock.tsx` | يسجل `BackInStockSubscription` محلياً — لا إشعار فعلي |
| التقسيط (تابي/تمارا) | ⚠️ واجهة فقط | `components/installments.tsx` | نص «4 دفعات بـX» بدون تكامل |
| مشاركة المنتج | ✅ | `features/product/share-menu.tsx` | WhatsApp/X/نسخ الرابط |
| زر العودة للأعلى + breadcrumb + سابق/تالي | ✅ | `components/back-to-top.tsx`, `features/product/product-siblings.tsx` | — |
| `/account` | ✅ | `features/account/` | حساب تجريبي mock |
| `/preview` معاينة المسودة | ✅ | `features/preview/preview-view.tsx` | ⚠️ الروابط تُخزن بكوكي `cp_theme_shares` — لا خادم ولا انتهاء حقيقي إلا بالتاريخ المخزن |
| مفاتيح المميزات `Theme.features` | ✅ | `lib/features.ts` + `useStoreFeatures` | غياب المفتاح = مفعّل |

## 3. نظام الثيمات والمحرر (THEME_SYSTEM_SPEC)

| البند | العنصر | الحالة | الملفات | قيود |
|---|---|---|---|---|
| 1 | نظام البلوكات `BLOCK_REGISTRY` (23 نوعاً) | ✅ | `packages/storefront-sections/src/blocks.ts`, `blocks-render.tsx`, `settings-blocks.tsx` | zod schema + defaults + FieldMeta لكل بلوك |
| 2 | قوالب الصفحات + قوالب هبوط مخصصة | ✅ | `ThemeCustomTemplate` في `packages/contracts/src/commerce.ts` · اختيار `templateId` في `features/storefront/pages/page-editor.tsx` · عرضها `features/cms/` | — |
| 2 | جدولة النشر + ثيم مؤقت | ✅ | `scheduledPublish`/`activeWindow` في contracts · `useScheduleTheme`/`useSetThemeWindow` في `packages/api-client` · نافذة الجدولة `editor-topbar.tsx` | ⚠️ التفعيل «عند القراءة» في الـ mock — لا scheduler حقيقي |
| 3 | الأقسام الجديدة | ✅ | `SECTION_REGISTRY` في `storefront-sections/src/registry.ts` + `sections/` | — |
| 4 | هيدر/فوتر يقرآن القوائم | ✅ | `sections/header.tsx`, `sections/footer.tsx` + `menu-links.ts` + `components/store-header.tsx`, `store-footer.tsx` | — |
| 4 | محرر القوائم | ⚠️ | `features/storefront/menus/menus-view.tsx` | إعادة الترتيب بأزرار أعلى/أسفل — **بدون سحب وإفلات** |
| 5 | أنظمة الألوان `colorSchemes` | ✅ | `ColorScheme` في contracts · `schemes.ts`, `globals-schemes.tsx` · إعداد `colorScheme` لكل قسم | — |
| 5 | إعدادات الثيم العامة (خطوط/زوايا/تباعد) | ✅ | `globals-form.tsx`, `themes/` (3 ثيمات) · `lib/theme-css.ts` (CSS vars) | — |
| 6 | التحكم حسب الجهاز | ✅ | `ThemeSectionVisibility` + تجاوزات `settings.mobile/tablet` · `device.ts` · مفتاح الجهاز `editor-preview.tsx` | — |
| 7.1 | بيانات المعاينة + persona | ✅ | `editor-preview.tsx` (منتج/تصنيف/صفحة + عميل جديد/مسجل/سلة) | — |
| 7.2 | رابط مشاركة المعاينة | ✅ | `share-dialog.tsx` · `themeShares` في api-client · `/preview` | ⚠️ التوكن محلي (كوكي) لا مولّد خادم؛ «7 أيام» بالتاريخ المخزن |
| 7.3 | مكتبة الوسائط | ✅ | `features/media/` + `MediaAdapterProvider` + `image-crop-dialog` في `@repo/ui` | ⚠️ لا تنبيه مستخدم/غير مستخدم فعلي (فلتر heuristic) · الضغط canvas |
| 7.4 | إدارة الثيمات | ✅ | `features/storefront/themes/` (نسخ/تسمية/حذف/تصدير/استيراد + `theme-import.ts` validation) | — |
| 7.5 | Presets | ✅ | `ThemePreset` في contracts · `applyPreset` في `use-editor-mutations.ts` (نسخة تلقائية قبل التطبيق) · presets في `themes/` | — |
| 7.6 | «صمم لي بالـ AI» + «اكتب لي النص» | ⚠️ واجهة فقط | `ai-design-dialog.tsx`, `ai-copy.ts` | الاقتراحات قوالب محلية مولّدة — **لا نموذج AI حقيقي** |
| 7.7 | لوحة جودة التصميم | ✅ | `editor-quality-panel.tsx`, `quality-audit.ts` | ⚠️ مؤشر الأداء تقديري heuristic — **LCP غير مقاس فعلياً** |
| 7.8 | تراجع/إعادة + حفظ تلقائي + تحديد من المعاينة + نسخ/لصق + اختصارات | ✅ | `use-editor-state.ts`, `use-editor-clipboard.ts`, `use-editor-shortcuts.ts`, `use-editor-channel.ts` | — |
| 7.9 | سجل النسخ | ✅ | `ThemeVersion.snapshot` في contracts · `versions-popover.tsx` | نسخ قبل المرحلة د بلا snapshot (لا تُعاين) — موثق بالكود |
| 7.10 | الجدولة | ✅ | كما بند 2 أعلاه | — |
| 8 | مميزات المتجر الـ15 | ✅/⚠️ | `THEME_FEATURES` في contracts · مفتاح التشغيل ببطاقة «مميزات المتجر» · التفاصيل جدول §2 أعلاه | القيود لكل ميزة مذكورة هناك |
| 9 | التوثيق + e2e + هذا التقرير | ✅ | `docs/` + `e2e/tests/{smoke,features}.spec.ts` | — |

## 4. مساعد المنصة `apps/super-admin` (§5.25)

| الميزة | الحالة | الملفات | قيود |
|---|---|---|---|
| `/copilot` + لوحة Cmd/Ctrl+J + عنصر تنقل | ✅ | `features/copilot/{copilot-context,copilot-panel,copilot-page}.tsx`, `components/console-shell.tsx` | نفس `packages/copilot/src/ui` بسياق `actor:"platform"` و`legacyApi.platform` |
| سيناريوهات المنصة | ✅ | `packages/copilot/src/scenarios-platform.ts`, `registry-platform.ts` | إيقاف متجر بطاقة خطرة + كلمة تأكيد؛ إعادة المهام محاكاة |
| سجل/مهام/إعدادات مساعد المنصة | ❌ | — | نطاق التاجر فقط — لا جدوى لمهام متجر واحد على مستوى المنصة |

## 4ب. شاشات المنصة `apps/super-admin`

| المسار | الشاشة | الحالة | الملفات | قيود |
|---|---|---|---|---|
| `/` | نظرة عامة | ✅ | `features/overview/` | مؤشرات المنصة mock |
| `/copilot` | مساعد المنصة | ✅ | `features/copilot/` | — |
| `/stores` · `/stores/[id]` · `/tenants` | المتاجر + تفاصيل المتجر | ✅ | `features/tenants/`, `features/store-detail/` | إيقاف/تفعيل تحديث محلي |
| `/plans` · `/plans/[id]` | الباقات | ✅ | `features/plans/` | — |
| `/subscriptions` | الاشتراكات | ✅ | `features/subscriptions/` | — |
| `/usage` | الاستهلاك | ✅ | `features/usage/` | — |
| `/ai-usage` | استهلاك AI الشاذ | ✅ | `features/ai-usage/` | — |
| `/apps-review` · `/apps-review/[id]` | مراجعة تطبيقات الشركاء | ✅ | `features/apps-review/` | — |
| `/partners` | الشركاء | ✅ | `features/partners/` | — |
| `/providers` | مزودو الخدمة | ✅ | `features/providers/` | — |
| `/jobs` | المهام الخلفية | ✅ | `features/jobs/` | — |
| `/logs` | سجلات التدقيق | ✅ | `features/logs/` | — |
| `/flags` | مفاتيح الميزات | ✅ | `features/flags/` | — |
| `/themes` | مكتبة الثيمات | ✅ | `features/themes/` | — |
| `/team` | فريق المنصة | ✅ | `features/team/` | — |

## 4ج. بوابة المطورين `apps/partners`

| المسار | الشاشة | الحالة | الملفات | قيود |
|---|---|---|---|---|
| `/` | نظرة عامة | ✅ | `features/overview/` | — |
| `/signup` | تسجيل شريك جديد | ✅ | `features/signup/` | جلسة وهمية |
| `/apps` · `/apps/new` · `/apps/[id]` | تطبيقاتي + محرر التطبيق | ✅ | `features/apps/`, `features/app-detail/` | الإرسال للمراجعة تحديث محلي |
| `/test-stores` | متاجر الاختبار | ✅ | `features/test-stores/` | — |
| `/docs` | توثيق الـ API | ✅ | `features/docs/` | — |

## 5. قيود عامة (mock بلا خادم)

- كل الكتابة (نشر، استيراد ثيم، مشاركة، تقييم، رفع وسائط) بذاكرة/تخزين متصفح — تضيع عند مسح التخزين ولا تتزامن بين جلسات.
- لا مصادقة حقيقية: صلاحيات وأدوار معروضة لكنها لا تمنع فعلياً.
- الطلبات/الوكلاء/المدفوعات/الشحن كلها بيانات مولدة في `packages/mocks`.
- «معاينة كـ عميل مسجل/سلة» تبدل بيانات المعاينة فقط ولا تنشئ حالة حقيقية.

## 6. فحوص التغطية البرمجية

| الفحص | الأمر | التغطية |
|---|---|---|
| Smoke كل المسارات | `cd e2e && pnpm test tests/smoke.spec.ts` | كل مسارات admin/storefront/super-admin/partners المعروفة بما فيها `/media`, `/reviews`, `/store-design`, `/login`, صفحات التفاصيل |
| تفاعلات المميزات | `cd e2e && pnpm test tests/features.spec.ts` | مفضلة، عرض سريع، مقارنة، تقييمات PDP، زر الأعلى، /media، /reviews، iframe المحرر |
| دورة حياة المنتج | `cd e2e && pnpm test tests/product-lifecycle.spec.ts` | بحث باركود في المنتجات والمخزون · حارس نشر/حفظ (اسم+سعر) مع إنشاء ناجح · رابط المحرر → `/reviews?product=<id>` |
