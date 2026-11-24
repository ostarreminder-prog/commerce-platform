# سجل التطوير الشامل — Commerce Platform

توثيق كل ما أُنجز وعُدّل في المشروع، مرتّباً حسب مراحل العمل.

المشروع: `commerce-platform` — منصة تجارة إلكترونية سعودية متعددة المتاجر،
frontend فقط (pnpm + Turborepo) مع APIs محاكاة داخل المتصفح عبر `@repo/api-client`.

المستودع: https://github.com/ostarreminder-prog/commerce-platform

---

## 1. إعادة الهيكلة وقواعد المشروع

- إعادة هيكلة `apps/admin` إلى `src/features/<feature>/` — صفحة + مكونات + hooks لكل شاشة
- تقسيم كل الملفات المتجاوزة ~250 سطراً (admin + storefront + partners)
- نقل المكونات المشتركة بين شاشتين+ إلى `packages/ui` (أو `api-client` لمنطق البيانات)
- قواعد ESLint إلزامية (`packages/config/eslint/rtl-plugin.js`):
  - `rtl/no-hardcoded-arabic` — ممنوع نص عربي مباشر في JSX
  - `rtl/no-raw-colors` — توكنات تصميم فقط
  - `rtl/no-physical-classes` — كلاسات منطقية (`ms/me/ps/pe`) بدل `ml/mr`
  - `no-restricted-imports` — ممنوع `@repo/mocks` داخل `apps/`
- Storybook لـ `packages/ui` بكل الحالات (RTL/داكن/خطأ/تحميل/معطّل)
- اختبار Playwright smoke لكل الشاشات
- توثيق القواعد في `AGENTS.md`

## 2. منظومة الوكلاء الأذكياء (AI Ecosystem)

- تحقق e2e من السيناريوهات الخمسة: Copilot ← إنشاء وكيل بالاستوديو، رد ذكي بالـ Inbox،
  موافقة تنفّذ استرداداً حقيقياً، مهام مجدولة، معرفة ← اختبار وكيل
- `approvals.decide` ينفّذ العملية الفعلية (استرداد/إلغاء) بدل تسجيل فقط
- undo حقيقي عبر `undoLastAction` بأخذ snapshot
- دمج split-brain بين معرفة الاستوديو والتجارة
- ملفات جديدة: `governance.ts`, `studio-state.ts`, `studio-sim.ts`, `cross-unit.spec.ts`

## 3. دورة العمليات (شحنات / فواتير / زاتكا)

- `SHIPMENT_FLOW` — خريطة انتقالات حالات محكومة
- نقاط `shipments.updateTracking` / `notifyCustomer`
- جدول `zatcaAttempts` جانبي + `IssueStatus` مشتق مستقلاً عن `zatcaStatus`
- طباعة ملصق حقيقية + توليد مستند فاتورة A4 (`invoice-doc.ts`)
- IntegrityAlerts + اختبار `ops-lifecycle.spec.ts` (9 سيناريوهات)
- ملفات: `shipments-utils/columns/bulk`, `shipment-detail/cards/actions`, `invoice-parts/zatca/doc/fields`

## 4. سد الفجوات الإدارية

- **`/notifications`** — إدارة إشعارات كاملة: فلاتر، أرشفة، مصفوفة تفضيلات
  (in-app/واتساب/إيميل/SMS × نوع الحدث)، جرس الهيدر موصول
- **`/brands`** — إدارة براندات: شعارات من الوسائط، عداد منتجات، تحذير استخدام،
  فلتر بالمنتجات
- **`/settings/maintenance`** — وضع صيانة: المتجر `:3001` يعرض صفحة صيانة فعلية
  على كل المسارات + بانر تحذيري بلوحة التاجر + سجل تدقيق
- **قنوات سوشال** — Instagram/Messenger/X/TikTok باستوديو الوكلاء والـ Inbox:
  ربط محاكى بصدق، تعيين وكيل لكل قناة، محادثات مزروعة، فلاتر قنوات

## 5. الميزات التجارية الكبرى (8 ميزات)

| الميزة | المسار | التفاصيل |
|---|---|---|
| الملف الشخصي | `/settings/profile` | بيانات + لغة + جلسة |
| منتجات رقمية | محرر المنتج | ملفات تسليم، طلبات بلا شحن، checkout يتخطى الشحن |
| تعدد مستودعات | `/inventory/locations` | مواقع CRUD + مخزون لكل موقع + تحويل مخزون |
| برنامج ولاء | `/marketing/loyalty` | نقاط كسب/استبدال، 3 مستويات، سجل لكل عميل |
| بطاقات هدايا | `/marketing/gift-cards` | إصدار/رصيد + استبدال جزئي كطريقة دفع |
| أفلييت | `/marketing/affiliates` | روابط + إسناد طلبات + عمولات + مدفوعات |
| أسعار جملة B2B | `/products/price-lists` | قواعد تسعير مخصصة تُحسم بالطلب اليدوي |
| إقليمي | `/settings/regional` | لغات المتجر + افتراضية + منطقة زمنية |

## 6. إصلاحات البنية التحتية (حرجة)

- **next-intl INVALID_KEY**: مفاتيح منقّطة (`"orders.read"`) حُوّلت لكائنات
  متداخلة حقيقية في `messages/{ar,en}.json` — تطابق 4017=4017 مفتاحاً
- **formatMoney**: يرمي على الأجزاء العشرية — صُحّحت 3 مواقع قسمة تناسبية بـ `Math.round`
- **HTTP 431** (ترويسة طلب ضخمة):
  - كوكيز `cp_db_*` قديمة ~105KB غير مضغوطة كانت تُرفض قبل وصول أي كود
  - `middleware.ts` بالمتجر والأدمن: ترويسة >14KB ← حذف `cp_db_*` + redirect نظيف
  - `NODE_OPTIONS=--max-http-header-size=131072` بسكربتات dev/start
  - `pruneStaleCookies` ينظف الكوكيز اليتيمة عند الترطيب
- **مزامنة الكوكيز أسقطت العربي**: التقسيم صار على الحمولة المرمّزة لا JSON الخام
- **ضغط**: gzip+base64 — الجرّ ~7KB بدل ~105KB
- **ثيمات 100KB**: مخطط spec-diff — الثيم المطابق يسافر stub ويُدمج عند القراءة
- ميزانية middleware رُفعت 12←14KB بعد ملاحظة ثيم كامل ~12.5KB

## 7. عمق تجربة المتجر: 17 ← 26 صفحة

صفحات جديدة: `/offers` (عروض بعدّاد)، `/brands` + `[id]`، `/faq` من قاعدة المعرفة،
`/contact` (نموذج ← `conversations.create` فعلي)، `/track` (تتبع ضيوف برقم+جوال)،
`/returns/request` (إرجاع بلا تسجيل)، `/gift-cards` (شراء بطاقة فعلي)،
`/account/rewards` (نقاط وبطاقاتي)، `not-found.tsx` بعلامة المتجر.

تحسينات: صفحة منتج بجدول مواصفات (SKU/باركود/وزن/أبعاد/براند) + أسئلة وأجوبة
(`qa` endpoint) + أكورديون شحن/إرجاع من الإعدادات الفعلية · سلة بملاحظات طلب +
تغليف هدية برسوم (`giftWrapFee` بالعقد) · هيدر بروابط العروض/البراندات + فوتر
بنشرة بريدية حقيقية وروابط اجتماعية وبيانات المتجر · بحث ببحثات سابقة ورقائق براند.

## 8. محرك تجربة التجارة التكيفية (Adaptive Commerce Experience Engine)

إعادة ابتكار العرض — فصل الهوية البصرية (تحكم التاجر) عن محرك التجربة
(كيف تُعرض وتُكتشف المنتجات) عن النواة التجارية.

### البنية
- **`EXPERIENCE_REGISTRY`** (`packages/storefront-sections/src/experiences/`) —
  كل وضع: مكوّن + مخطط zod + defaults + `dataNeeds` + `deviceRules`
- **`SectionCommerceAdapter`** (`commerce-context.ts`) + `SectionCommerceBridge` —
  الأقسام تضيف للسلة/مفضلة/عرض سريع عبر adapter يُحقن من التطبيق
- **حقل `view`** على أقسام المنتجات يبدّل الـrenderer (`optionsSource:"experiences"`)
- **`Theme.pageExperiences`** — نمط صفحة كاملة (product/category) على عقد الثيم

### أوضاع العرض الستة
| الوضع | الوصف |
|---|---|
| `adaptive-grid` | الشبكة القياسية (الافتراضي) |
| `editorial-showcase` | توزيع مجلة غير متماثل: بطل 2×2 + بلاطات متداخلة |
| `immersive-product` | تركيز منتج: معرض + متغيرات + شراء فعلي |
| `visual-discovery` | اكتشاف بالصور: بلاطات تكشف الاسم/السعر بالتمرير |
| `contextual-shopping` | مشهد تسوّق: نقاط ساخنة `hotspot` + بطاقة شراء + «أضف الكل» |
| `comparison` | أعمدة مقارنة تبرز الصفوف المختلفة تلقائياً |

### صفحات المنتج/التصنيف
- PDP: 3 تخطيطات (كلاسيكي/غامر 60% وسائط/تحريري 21:9) — نفس البيانات والأفعال
- PLP: شبكة بفلاتر جانبية / اكتشاف بصري (فلاتر درج + بلاطات أوسع)
- تفكيك `product-detail` إلى `use-product-detail` + `product-buy-panel` + ذيل مشترك

### محرك الاقتراحات
`experience-suggestions.ts` — قواعد صريحة (منتج واحد←غامر، 2-4←تحريري،
خيارات كثيفة←مقارنة، وسائط غنية←اكتشاف…) + بطاقة «تجربة مقترحة» بالمحرر
بزر «تطبيق» — يقترح بسبب والتاجر يتجاوز، بلا AI إجباري.

### المحرر
- `PageExperiencePicker` تحت مبدّل القوالب (product/category فقط)
- مكتبة الأقسام مفلترة بالقالب (header/footer مخفيان، main-product لقالب product)
- `data-experience` على الأقسام والصفحات للاختبار والتحليلات
- block type جديد: `hotspot` (productId + x/y) — النوع 24

## 9. النشر

- `git init` + `.gitignore` (أُضيفت `test-results`/`playwright-report`/`blob-report`)
- فحص أسرار: نظيف
- رفع لـ https://github.com/ostarreminder-prog/commerce-platform (1884 ملفاً)

---

## الإحصائيات النهائية

- مسارات admin: **102** · مسارات المتجر: **26** · تطبيقات: 4 (3000-3003)
- اختبارات e2e: **~250+** مارة · typecheck: 10/10 حزم · lint: 11/11
- تطابق مفاتيح الترجمة ar/en: مُتحقق برمجياً
- أنواع الأقسام: 22 · البلوكات: 24 · أوضاع العرض: 6 + 2 نمطي صفحة

## ما يحتاج Backend حقيقياً (موسوم بصدق)

- تزامن الكتالوج/الطلبات بين التطبيقين (الكوكيز ~14KB سقفها)
- SEO خادمي، تحقق دومين فعلي، OAuth سوشال + webhooks
- تسليم إشعارات خارجية (واتساب/إيميل)، مدفوعات أفلييت خارجية
- تعدد عملات فعلي، توصيات سلوكية حقيقية، شخصنة فعلية
