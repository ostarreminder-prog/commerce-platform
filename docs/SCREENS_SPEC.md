# مواصفات الشاشات والحقول والروابط

> المرجع الملزم لبناء الواجهات. كل شاشة تُبنى بالحقول والأعمدة والروابط المذكورة هنا بالضبط.
> أي حقل أو رابط غير موجود هنا يُسأل عنه قبل إضافته.
> مكان الملف في المشروع: `docs/SCREENS_SPEC.md`

---

## 0. طريقة القراءة

- **الكيانات (القسم 4)** تعرّف كل حقل مرة واحدة: الاسم البرمجي، النوع، إلزامي أو لا، التحقق، القيمة الافتراضية.
- **الشاشات (القسم 5)** تشير للحقول بأسمائها البرمجية، وتحدد: الأعمدة، الفلاتر، الإجراءات، الروابط الخارجة والداخلة.
- **الرموز:** `*` = إلزامي · `🔗` = رابط لشاشة أخرى · `⚠` = إجراء حساس يحتاج تأكيد · `(MVP)` أو `(لاحقاً)`.
- كل الحقول تُعرّف في `packages/contracts` بنفس الأسماء البرمجية هنا.

---

## 1. قواعد الربط بين أجزاء المشروع (إلزامية)

1. **كل إشارة لكيان = رابط.** أي مكان يظهر فيه رقم طلب أو اسم عميل أو منتج أو محادثة أو وكيل أو شحنة أو فاتورة، يكون رابطاً لصفحته، عبر مكوّن واحد: `<EntityLink type="order" id="..." />`.
2. **معاينة سريعة:** المرور على `EntityLink` (hover) أو الضغط مع Shift يفتح بطاقة معاينة (Popover) فيها أهم 4 معلومات، بدون مغادرة الصفحة.
3. **الفلاتر في الرابط:** كل فلتر أو بحث أو تبويب أو ترتيب ينعكس في الـ URL (`/orders?status=unpaid&channel=whatsapp`). أي رقم في الرئيسية أو التقارير رابط لقائمة مفلترة بنفس الشرط.
4. **مسار التنقل (Breadcrumb)** في كل شاشة تفاصيل: `الطلبات ← #1042`، `العملاء ← محمد العتيبي ← الطلب #1042`.
5. **الرجوع يحفظ الحالة:** الرجوع من التفاصيل للقائمة يرجّع نفس الفلاتر والصفحة ومكان التمرير.
6. **مصدر بيانات واحد:** كل شاشة تقرأ من نفس الـ hooks. تعديل كيان في شاشة يحدّث كل الشاشات اللي تعرضه (invalidate بمفاتيح موحدة: `['orders', id]`).
7. **الخط الزمني الموحد:** كل كيان رئيسي (طلب، عميل، محادثة، منتج) له خط زمني يجمع الأحداث من كل الأجزاء: دفع، شحن، رسالة، تعديل موظف، إجراء وكيل، تطبيق.
8. **الفاعل دائماً ظاهر:** كل حدث أو تعديل يبيّن من سواه: موظف 👤، وكيل 🤖 (باسم الوكيل)، تطبيق 🧩 (باسم التطبيق)، النظام ⚙، العميل.
9. **الإشعارات روابط:** كل إشعار يفتح الشاشة المعنية مباشرة (deep link)، مع تمييز العنصر المقصود.
10. **البحث الشامل (Cmd+K):** يبحث في الطلبات (بالرقم أو الجوال)، والعملاء، والمنتجات (بالاسم أو SKU)، والمحادثات، والشاشات والإعدادات نفسها ("إعدادات الشحن").
11. **الإنشاء من السياق:** من صفحة العميل "طلب جديد لهذا العميل"، ومن المحادثة "أرسل رابط دفع لهذا المنتج"، ومن المنتج "أضفه لعرض". الحقول المرتبطة تتعبأ تلقائياً.
12. **"اعرض في المتجر":** كل منتج وتصنيف وصفحة في اللوحة فيه زر يفتح نفس العنصر في المتجر (والعكس للموظف المسجل: شريط علوي في المتجر "تعديل في اللوحة").
13. **المتجر الحالي في كل مكان:** كل الشاشات تحت `/[storeSlug]/...` ولا تعرض بيانات من متجر آخر أبداً.
14. **الصلاحيات تتحكم في الروابط أيضاً:** رابط لكيان ما عنده المستخدم صلاحية قراءته يظهر كنص عادي بدون رابط.

---

## 2. خريطة المسارات (Routes)

### لوحة التاجر `apps/admin`

| المسار | الشاشة |
|---|---|
| `/login` · `/signup` · `/forgot` · `/invite/[token]` · `/mfa` | الدخول |
| `/[store]/onboarding` | معالج الإعداد |
| `/[store]` | الرئيسية |
| `/[store]/orders` · `/[store]/orders/[id]` · `/[store]/orders/new` | الطلبات |
| `/[store]/returns` · `/[store]/returns/[id]` | المرتجعات |
| `/[store]/abandoned-carts` · `/[store]/abandoned-carts/[id]` | السلات المتروكة |
| `/[store]/products` · `/[store]/products/new` · `/[store]/products/[id]` | المنتجات |
| `/[store]/reviews` | التقييمات |
| `/[store]/categories` · `/[store]/collections` · `/[store]/collections/[id]` | التصنيفات والمجموعات |
| `/[store]/inventory` · `/[store]/inventory/[variantId]` | المخزون |
| `/[store]/imports` · `/[store]/imports/[id]` | الاستيراد والتصدير |
| `/[store]/customers` · `/[store]/customers/[id]` | العملاء |
| `/[store]/marketing` · `/[store]/marketing/coupons` · `/[store]/marketing/coupons/[id]` · `/[store]/marketing/promotions` | التسويق |
| `/[store]/inbox` · `/[store]/inbox/[conversationId]` · `/[store]/conversations` | المحادثات |
| `/[store]/approvals` | موافقات الوكيل |
| `/[store]/agents` · `/[store]/agents/[id]` · `/[store]/agents/test` · `/[store]/agents/live` · `/[store]/agents/history` · `/[store]/agents/history/[id]` · `/[store]/agents/channels` | الوكلاء |
| `/[store]/knowledge` · `/[store]/knowledge/[id]` | قاعدة المعرفة |
| `/[store]/shipments` · `/[store]/shipments/[id]` · `/[store]/shipping` | الشحنات والشحن |
| `/[store]/invoices` · `/[store]/invoices/[id]` | الفواتير |
| `/[store]/reports` · `/[store]/reports/[type]` | التقارير |
| `/[store]/store-design` (المحرر) · `/[store]/storefront/themes` · `/[store]/storefront/pages` · `/[store]/storefront/pages/[id]` · `/[store]/storefront/menus` · `/[store]/storefront/domains` · `/[store]/storefront/seo` · `/[store]/media` (مكتبة الوسائط) | المتجر والتصميم |
| `/[store]/apps` · `/[store]/apps/store` · `/[store]/apps/store/[appId]` · `/[store]/apps/[installationId]` | التطبيقات |
| `/[store]/settings/{general,payments,shipping,taxes,notifications,channels,staff,roles,audit,billing,developers,danger}` | الإعدادات |

### المتجر `apps/storefront`
`/` · `/c/[slug]` · `/p/[slug]` · `/products/[id]` · `/search` · `/cart` · `/checkout` · `/order/[token]` (تأكيد وتتبع) · `/pages/[slug]` · `/wishlist` · `/compare` · `/preview` (معاينة مسودة ثيم عبر `?share=<token>`) · `/account/login` · `/account/orders` · `/account/orders/[id]` · `/account/addresses` · `/account/profile`

### مالك المنصة `apps/super-admin`
`/` · `/stores` · `/stores/[id]` · `/plans` · `/plans/[id]` · `/subscriptions` · `/usage` · `/apps-review` · `/apps-review/[id]` · `/partners` · `/providers` · `/jobs` · `/logs` · `/flags` · `/themes` · `/team`

### بوابة المطورين `apps/partners`
`/signup` · `/apps` · `/apps/new` · `/apps/[id]` · `/apps/[id]/{settings,scopes,webhooks,listing,review,analytics}` · `/test-stores` · `/docs`

---

## 3. الأنواع المشتركة

| النوع | الشكل | العرض | التحقق |
|---|---|---|---|
| `Money` | `{ amount: int (هللة), currency: 'SAR' }` | `1,250.00 ر.س` | ≥ 0 |
| `Phone` | نص E.164 | `+966 5X XXX XXXX` | جوال سعودي `^\+9665\d{8}$` افتراضياً، ودولي اختياري |
| `Email` | نص | — | صيغة بريد |
| `LocalizedText` | `{ ar: string, en?: string }` | حسب لغة الواجهة | `ar` إلزامي |
| `Slug` | نص | — | `^[a-z0-9-]+$`، فريد داخل المتجر، يتولد من الاسم |
| `DateTime` | ISO 8601 UTC | بتوقيت المتجر: `22 نوفمبر 2026، 3:15 م` + "منذ 5 دقائق" | — |
| `Address` | انظر 4.8 | سطرين | — |
| `MediaRef` | `{ id, url, alt: LocalizedText, width, height }` | صورة مصغرة | jpg/png/webp، ≤ 10MB |
| `Status` | enum لكل كيان | Badge ملوّن موحد (القسم 6) | — |
| `ActorRef` | `{ type: 'staff'|'agent'|'app'|'system'|'customer', id, name }` | أيقونة + اسم + 🔗 | — |

---

## 4. الكيانات وحقولها

### 4.1 المتجر `Store`
| الحقل | النوع | ملاحظات |
|---|---|---|
| `name`* | LocalizedText | 2–60 حرف |
| `slug`* | Slug | يُستخدم في الـ subdomain |
| `logo` | MediaRef | |
| `favicon` | MediaRef | |
| `industry`* | enum: `perfumes, fashion, electronics, beauty, food, gifts, home, other` | |
| `contactPhone`* | Phone | |
| `contactEmail`* | Email | |
| `whatsappNumber` | Phone | يظهر في المتجر |
| `socialLinks` | `{ instagram?, x?, tiktok?, snapchat? }` | روابط |
| `defaultLanguage`* | `ar` \| `en` | افتراضي `ar` |
| `languages`* | array | افتراضي `['ar']` |
| `currency`* | `SAR` | ثابت في MVP |
| `timezone`* | IANA | افتراضي `Asia/Riyadh` |
| `commercialRegistration` | نص 10 أرقام | |
| `vatNumber` | نص 15 رقماً يبدأ وينتهي بـ 3 | |
| `legalName` | نص | الاسم في الفواتير |
| `nationalAddress` | Address | |
| `status` | `draft, live, paused, suspended` | |
| `plan` | 🔗 Plan | |

### 4.2 الموظف والدور `Staff` / `Role`
| الحقل | النوع | ملاحظات |
|---|---|---|
| `name`* | نص | |
| `email`* | Email | فريد |
| `phone` | Phone | |
| `roleId`* | 🔗 Role | |
| `status` | `invited, active, suspended` | |
| `mfaEnabled` | boolean | |
| `lastLoginAt` | DateTime | |
| `Role.name`* | نص | فريد داخل المتجر |
| `Role.description` | نص | |
| `Role.permissions`* | string[] | من كتالوج الصلاحيات |
| `Role.isSystem` | boolean | الأدوار الجاهزة لا تُحذف |

### 4.3 المنتج `Product`
| الحقل | النوع | ملاحظات |
|---|---|---|
| `name`* | LocalizedText | 2–120 |
| `slug`* | Slug | |
| `description` | LocalizedText (rich text) | |
| `shortDescription` | LocalizedText | ≤ 200 |
| `type`* | `physical, digital, service` | MVP: physical |
| `status`* | `draft, active, archived` | |
| `media` | MediaRef[] | الأولى = الرئيسية، ترتيب بالسحب، ≤ 15 |
| `categoryIds` | 🔗 Category[] | |
| `collectionIds` | 🔗 Collection[] | |
| `brand` | نص | |
| `tags` | string[] | |
| `options` | `{ name: LocalizedText, values: LocalizedText[] }[]` | ≤ 3 خيارات (مثل الحجم، اللون) |
| `variants`* | Variant[] | منتج بدون خيارات = variant واحد |
| `seo` | `{ title, description, imageId }` | عنوان ≤ 60، وصف ≤ 160 |
| `requiresShipping` | boolean | افتراضي true |
| `taxable` | boolean | افتراضي true |
| `aiNotes` | نص | معلومات إضافية للوكيل فقط، لا تظهر للعميل |
| `publishedAt` | DateTime | |
| `stats` (قراءة) | `{ sold30d, revenue30d, views30d, conversations30d }` | |

**Variant**
| الحقل | النوع | ملاحظات |
|---|---|---|
| `optionValues` | string[] | |
| `sku` | نص | فريد داخل المتجر |
| `barcode` | نص | |
| `price`* | Money | |
| `compareAtPrice` | Money | > price |
| `cost` | Money | للتقارير فقط |
| `weightGrams`* | int | للشحن |
| `dimensionsCm` | `{ l, w, h }` | |
| `trackInventory` | boolean | افتراضي true |
| `allowBackorder` | boolean | افتراضي false |
| `imageId` | MediaRef | |

### 4.4 التصنيف والمجموعة `Category` / `Collection`
| الحقل | النوع | ملاحظات |
|---|---|---|
| `name`* · `slug`* · `description` · `image` · `seo` | | |
| `Category.parentId` | 🔗 Category | شجرة، عمق ≤ 4 |
| `Category.sortOrder` | int | |
| `Collection.type`* | `manual, automatic` | |
| `Collection.productIds` | 🔗 Product[] | للـ manual |
| `Collection.rules` | `{ field: price|tag|category|brand|stock, op, value }[]` + `match: all|any` | للـ automatic |

### 4.5 المخزون `InventoryLevel` / `InventoryMovement`
| الحقل | النوع | ملاحظات |
|---|---|---|
| `variantId`* | 🔗 Variant | |
| `locationId`* | 🔗 Location | MVP: موقع واحد |
| `onHand` | int | |
| `reserved` | int | قراءة: محجوز في سلات الدفع |
| `available` | int | قراءة = onHand − reserved |
| `lowStockThreshold` | int | افتراضي 5 |
| `Movement.delta`* | int | |
| `Movement.reason`* | `sale, return, adjustment, import, cancellation, damage` | |
| `Movement.note` | نص | إلزامي لو reason = adjustment |
| `Movement.reference` | 🔗 Order / Return / Import | |
| `Movement.actor` | ActorRef | |

### 4.6 العميل `Customer`
| الحقل | النوع | ملاحظات |
|---|---|---|
| `name` | نص | |
| `phone`* | Phone | فريد داخل المتجر |
| `email` | Email | |
| `gender` | `male, female, unspecified` | |
| `birthDate` | Date | |
| `addresses` | Address[] | |
| `tags` | string[] | |
| `notes` | نص | داخلي |
| `marketingConsent` | `{ whatsapp: bool, sms: bool, email: bool, updatedAt }` | |
| `source` | `storefront, whatsapp, voice, manual, import, app` | |
| `stats` (قراءة) | `{ ordersCount, totalSpent, avgOrder, lastOrderAt, firstOrderAt, returnsCount }` | |
| `segment` (قراءة) | `new, returning, vip, at_risk` | |

### 4.7 العنوان `Address`
| الحقل | النوع | ملاحظات |
|---|---|---|
| `label` | نص | البيت، العمل |
| `recipientName`* | نص | |
| `phone`* | Phone | |
| `city`* | enum مدن المملكة | قائمة بحث |
| `district`* | نص | الحي |
| `street` | نص | |
| `buildingNumber` | 4 أرقام | العنوان الوطني |
| `additionalNumber` | 4 أرقام | |
| `postalCode` | 5 أرقام | |
| `shortAddress` | `^[A-Z]{4}\d{4}$` | يعبّي الباقي تلقائياً (لاحقاً) |
| `location` | `{ lat, lng }` | اختيار من خريطة |
| `notes` | نص | تعليمات التوصيل |
| `isDefault` | boolean | |

### 4.8 الطلب `Order`
| الحقل | النوع | ملاحظات |
|---|---|---|
| `number` | int | تسلسلي لكل متجر، يُعرض `#1042` |
| `customerId`* | 🔗 Customer | |
| `channel`* | `storefront, whatsapp, voice, manual, app` | |
| `agentId` | 🔗 Agent | لو أنشأه وكيل |
| `conversationId` | 🔗 Conversation | |
| `items`* | OrderItem[] | ≥ 1 |
| `shippingAddress`* | Address | snapshot |
| `shippingMethod` | `{ carrier, service, price: Money, etaDays }` | |
| `couponCode` | نص | |
| `subtotal` · `discountTotal` · `shippingTotal` · `taxTotal` · `total` | Money | قراءة، من محرك التسعير |
| `pricesIncludeTax` | boolean | snapshot من الإعدادات |
| `paymentMethod`* | `card, mada, apple_pay, stc_pay, cod, bank_transfer, payment_link` | |
| `paymentStatus` | `pending, authorized, paid, partially_refunded, refunded, failed, cod_pending, cod_collected` | |
| `fulfillmentStatus` | `unfulfilled, processing, shipped, delivered, returned, cancelled` | |
| `status` (محسوبة) | `needs_action, in_progress, completed, cancelled` | للتبويبات |
| `customerNote` | نص | من العميل |
| `internalNotes` | `{ text, actor, at }[]` | |
| `tags` | string[] | |
| `invoiceId` | 🔗 Invoice | |
| `shipmentIds` | 🔗 Shipment[] | |
| `returnIds` | 🔗 Return[] | |
| `events` | OrderEvent[] | الخط الزمني |
| `createdAt` · `paidAt` · `cancelledAt` | DateTime | |
| `cancelReason` | `customer_request, out_of_stock, fraud, payment_failed, other` + نص | ⚠ |

**OrderItem:** `variantId` 🔗 · `productName` (snapshot) · `variantLabel` · `sku` · `image` · `quantity`* (≥1) · `unitPrice` · `discount` · `tax` · `lineTotal` · `fulfilledQty` · `returnedQty`

**OrderEvent:** `type` (created, paid, payment_failed, status_changed, shipment_created, shipment_updated, delivered, refunded, note_added, invoice_issued, message_sent, return_requested, cancelled, edited) · `actor` ActorRef · `at` · `data` · `link` (🔗 للكيان المرتبط)

### 4.9 المرتجع `Return`
| الحقل | النوع | ملاحظات |
|---|---|---|
| `orderId`* | 🔗 Order | |
| `items`* | `{ orderItemId, quantity, reason }[]` | |
| `reason`* | `damaged, wrong_item, not_as_described, size_issue, changed_mind, other` | |
| `customerNote` · `photos` | نص · MediaRef[] | |
| `status` | `requested, approved, rejected, in_transit, received, refunded, closed` | |
| `resolution` | `refund, exchange, store_credit` | |
| `refundAmount` | Money | ≤ المدفوع |
| `restock` | boolean | يرجّع للمخزون عند الاستلام |
| `returnShipmentId` | 🔗 Shipment | |
| `rejectionReason` | نص | إلزامي عند الرفض |

### 4.10 الدفع والاسترداد `Payment` / `Refund`
`Payment`: `orderId` 🔗 · `amount` · `method` · `status` (pending, authorized, captured, failed, voided) · `provider` · `providerRef` · `cardBrand` · `cardLast4` · `failureReason` · `createdAt`
`Refund`: `paymentId` 🔗 · `amount`* (≤ المتبقي) · `reason`* · `status` (pending, succeeded, failed) · `actor` · `approvedBy` (لو أنشأه وكيل) · `createdAt`

### 4.11 الشحنة `Shipment`
| الحقل | النوع | ملاحظات |
|---|---|---|
| `orderId`* | 🔗 Order | |
| `type` | `outbound, return` | |
| `carrier`* · `service` | نص | |
| `trackingNumber` · `trackingUrl` | نص | |
| `labelUrl` | رابط PDF | |
| `items` | `{ orderItemId, quantity }[]` | دعم الشحن الجزئي |
| `packages` | `{ weightGrams, dimensionsCm }[]` | |
| `codAmount` | Money | |
| `status` | `label_created, picked_up, in_transit, out_for_delivery, delivered, failed_attempt, returned, cancelled` | |
| `events` | `{ status, location, description, at }[]` | |
| `estimatedDelivery` | Date | |
| `cost` | Money | |

### 4.12 الفاتورة `Invoice`
`number` (تسلسل غير قابل للتعديل) · `type` (simplified, standard, credit_note) · `orderId` 🔗 · `returnId` 🔗 (لإشعار دائن) · `customer` (snapshot: الاسم، الرقم الضريبي للـ B2B) · `lines` · `subtotal` · `vatAmount` · `total` · `issuedAt` · `qrCode` · `pdfUrl` · `zatcaStatus` (pending, reported, cleared, rejected) · `zatcaErrors` · `relatedInvoiceId` 🔗

### 4.13 الكوبون والعرض `Coupon` / `Promotion`
| الحقل | النوع | ملاحظات |
|---|---|---|
| `code`* | نص | أحرف إنجليزية كبيرة وأرقام، فريد |
| `type`* | `percentage, fixed, free_shipping` | |
| `value`* | number / Money | نسبة 1–100 |
| `maxDiscount` | Money | للنسبة |
| `minOrderAmount` | Money | |
| `appliesTo` | `all, products, categories, collections` + ids 🔗 | |
| `excludeSaleItems` | boolean | |
| `usageLimit` · `usageLimitPerCustomer` | int | |
| `customerEligibility` | `all, new, specific` + customerIds 🔗 | |
| `startsAt`* · `endsAt` | DateTime | |
| `status` (محسوبة) | `scheduled, active, expired, disabled` | |
| `stats` | `{ uses, revenue, discountGiven }` | |
| `Promotion.type` | `buy_x_get_y, bundle, tiered` | (لاحقاً) |

### 4.14 السلة المتروكة `AbandonedCart`
`customerId` 🔗 · `phone` · `items` · `total` · `abandonedAt` · `recoveryStatus` (not_contacted, message_sent, recovered, lost) · `recoveryAttempts` `{ channel, at, agentId 🔗, opened }[]` · `recoveredOrderId` 🔗

### 4.15 المحادثة والرسالة `Conversation` / `Message`
| الحقل | النوع | ملاحظات |
|---|---|---|
| `channel`* | `whatsapp, webchat, voice, instagram` | |
| `customerId` | 🔗 Customer | |
| `contact` | `{ phone, name }` | لو العميل غير مسجل |
| `status` | `open_ai, waiting_human, open_human, resolved, closed` | |
| `currentAgentId` | 🔗 Agent | |
| `agentPath` | 🔗 Agent[] | الوكلاء اللي مرت عليهم |
| `assigneeId` | 🔗 Staff | |
| `priority` | `low, normal, high, urgent` | |
| `tags` | string[] | |
| `sentiment` | `positive, neutral, negative` | قراءة |
| `aiSummary` | نص | قراءة |
| `relatedOrderIds` | 🔗 Order[] | |
| `waitingSince` | DateTime | |
| `rating` | 1–5 | |
| `Message.from` | ActorRef | |
| `Message.type` | `text, image, audio, document, product_card, payment_link, order_card, template, system, internal_note` | |
| `Message.content` · `attachments` · `toolCalls` (للعرض) · `deliveryStatus` (sent, delivered, read, failed) | | |

### 4.16 موافقة الوكيل `AgentApproval`
`agentId` 🔗 · `conversationId` 🔗 · `action` (cancel_order, refund, discount_above_limit) · `target` 🔗 (Order) · `amount` · `reason` (من الوكيل) · `status` (pending, approved, rejected, expired) · `decidedBy` 🔗 Staff · `decidedAt` · `expiresAt`

### 4.17 الوكيل `Agent`
كما في برومت استوديو الوكلاء، مع الروابط: `parentId` 🔗 · `knowledgeSourceIds` 🔗 · `whatsapp.phoneNumberId` 🔗 Channel · `voice.phoneNumberId` 🔗 Channel

### 4.18 مصدر المعرفة `KnowledgeSource`
`type` (file, faq, url, policy, product_catalog) · `title`* · `file` · `url` · `faq` `{ q, a }[]` · `status` (processing, ready, failed) · `chunksCount` · `usedByAgentIds` 🔗 · `lastSyncedAt` · `autoSync` (للروابط والكتالوج)

### 4.19 المتجر والتصميم `Theme` / `Page` / `Menu` / `Domain` / `Review`
- `Theme`: `name` · `sections` (`Record<ThemeTemplate, ThemeSection[]>` — القوالب الأساسية: home, product, category, cart, page) · `globals` `{ primaryColor, font, headingFont, spacing (compact|normal|relaxed), radius, logoPosition, announcementBar, logo }` · `features` (مفاتيح تشغيل مميزات المتجر — انظر 5.22.2؛ غياب المفتاح = مفعّل) · `featureSettings` `{ scarcityThreshold }` · `colorSchemes` `{ id, nameAr, nameEn, background, text, buttonBg, buttonText, accent }[]` (أنظمة ألوان يختارها القسم عبر إعداد `colorScheme`) · `presets` `{ id, nameAr, nameEn, globals, colorSchemeOverrides }[]` (أنماط جاهزة — ألوان/خطوط فقط) · `customTemplates` `{ id, nameAr, nameEn, sections }[]` (قوالب هبوط تربطها الصفحات عبر `Page.templateId`) · `scheduledPublish` `{ at } | null` (نشر مجدول) · `activeWindow` `{ from, to } | null` (ثيم مؤقت يرجع بعدها للأساسي تلقائياً) · `status` (draft, published) · `versions` · `publishedAt`
- `ThemeSection`: `id` · `type` (من `SECTION_TYPES` — جدول 5.22.1) · `hidden` · `visibility` `{ mobile, tablet, desktop }` · `settings` (مفاتيح مسطحة + `mobile`/`tablet` تجاوزات جهاز تُدمج وقت العرض) · `blocks` `{ id, type, settings }[]` (من `BLOCK_REGISTRY`)
- `ThemeVersion`: `at` · `actor` ActorRef · `note` · `snapshot` (نسخة Theme كاملة عند النشر/التطبيق — نسخ قديمة قد تفتقدها فلا تُعاين ولا تُستعاد)
- `ThemeShare`: `token` · `themeId` 🔗 · `createdAt` · `expiresAt` (صالح 7 أيام — يفتح المسودة على `/preview?share=<token>` بدون دخول)
- `Page`: `title`* · `slug`* · `content` (rich text أو sections) · `seo` · `status` · `showInMenu` · `templateId` 🔗 customTemplate (قالب أقسام بدل المحتوى النصي)
- `Menu`: `location` (header, footer) · `items` `{ label, linkType: page|category|collection|product|url, targetId 🔗, children }[]` (عمق ≤ 2)
- `Domain`: `hostname`* · `type` (subdomain, custom) · `verificationStatus` (pending, verified, failed) · `sslStatus` (pending, active, failed) · `dnsRecords` `{ type, name, value }[]` · `isPrimary`
- `Review`: `productId` 🔗 · `customerId` 🔗 · `rating` (1–5) · `text` · `images` (≤ 5) · `verifiedPurchase` · `status` (pending, approved, hidden — يظهر في المتجر `approved` فقط) · `merchantReply` `{ text, at }` (يظهر تحت التقييم للجميع) · `createdAt`
- `BackInStockSubscription`: `productId` 🔗 · `phone` · `createdAt` · `notifiedAt` (null = بانتظار الإشعار)

### 4.20 الإعدادات
- **الدفع:** `providerAccountStatus` (not_started, pending_kyc, active, rejected) · `methods` `{ method, enabled }[]` · `cod` `{ enabled, fee: Money, maxOrder: Money, cities[] }` · `bankTransfer` `{ enabled, iban, bankName, instructions }` · `settlement` (قراءة)
- **الشحن:** `pickupAddress`* Address · `zones` `{ name, cities[], rates: { type: flat|weight|price, conditions, price }[] }[]` · `carriers` `{ carrierId, enabled }[]` · `freeShippingThreshold` Money · `fallbackRate` Money · `handlingDays` int
- **الضرائب:** `vatEnabled` · `vatRate` (افتراضي 15) · `pricesIncludeTax` · `zatcaStatus` (not_connected, onboarding, connected, error) · `egsSerial`
- **الإشعارات:** `templates` `{ event, channel, enabled, content: LocalizedText, whatsappTemplateStatus }[]`. الأحداث: order_confirmed, payment_failed, shipped, out_for_delivery, delivered, cart_abandoned, return_update, otp
- **القنوات:** `whatsappNumbers` `{ phone, displayName, status, qualityRating, agentId 🔗 }[]` · `voiceNumbers` (نفس الشكل) · `webchat` `{ enabled, position, color, greeting, agentId 🔗 }`

### 4.21 التطبيقات والمطورين `App` / `AppInstallation` / `ApiKey` / `WebhookSubscription`
- `App`: `name` · `icon` · `developer` · `category` · `shortDescription` · `description` · `screenshots` · `scopes` · `pricing` `{ type: free|monthly|usage|one_time, price }` · `rating` · `installsCount` · `status` (draft, in_review, approved, rejected, suspended) · `supportEmail` · `privacyUrl`
- `AppInstallation`: `appId` 🔗 · `grantedScopes` · `installedBy` 🔗 Staff · `installedAt` · `lastActivityAt` · `status` (active, suspended, uninstalled)
- `ApiKey`: `name`* · `scopes`* · `prefix` (يُعرض أول 8 أحرف فقط) · `createdBy` · `lastUsedAt` · `expiresAt`
- `WebhookSubscription`: `url`* (https فقط) · `events`* · `secret` (يُعرض مرة واحدة) · `status` (active, disabled_failing) · `deliveries` `{ event, status, httpCode, attempt, at, durationMs }[]`

### 4.22 الاشتراك والسجل `Subscription` / `AuditLog`
- `Subscription`: `planId` 🔗 · `status` (trialing, active, past_due, cancelled) · `currentPeriodEnd` · `usage` `{ metric, used, limit }[]` · `addons` · `invoices`
- `AuditLog`: `actor` ActorRef · `action` · `target` 🔗 · `changes` `{ field, from, to }[]` · `ip` · `at`

---

## 5. الشاشات بالتفصيل (لوحة التاجر)

> لكل شاشة: **الأعمدة/الحقول** · **الفلاتر** · **الإجراءات** · **روابط خارجة 🔗→** · **روابط داخلة ←🔗**

### 5.1 الرئيسية `/[store]`
- **البطاقات:** مبيعات اليوم (مقارنة بأمس) · طلبات اليوم · متوسط الطلب · زوار اليوم · نسبة التحويل
- **قوائم:** طلبات تحتاج إجراء (5) · محادثات بانتظار موظف (5) · موافقات وكيل معلقة · منتجات قاربت تخلص (5) · آخر الطلبات
- **رسوم:** المبيعات آخر 30 يوم · الطلبات حسب القناة (متجر/WhatsApp/مكالمة)
- **أداء الوكلاء:** محادثات اليوم · نسبة الحل · مبيعات عبر الوكيل
- **قائمة الإعداد** (تختفي بعد الاكتمال): أضف منتجات · فعّل الدفع · فعّل الشحن · اربط WhatsApp · اربط الدومين · انشر المتجر
- 🔗→ كل بطاقة ورقم = قائمة مفلترة: مبيعات اليوم → `/reports/sales?range=today` · طلبات تحتاج إجراء → `/orders?status=needs_action` · بانتظار موظف → `/inbox?status=waiting_human` · قاربت تخلص → `/inventory?stock=low` · كل عنصر إعداد → شاشته

### 5.2 الطلبات `/[store]/orders`
- **التبويبات:** الكل · تحتاج إجراء · قيد التنفيذ · مكتملة · ملغاة · غير مدفوعة
- **الأعمدة:** ☐ · `#number` 🔗 · التاريخ · العميل 🔗 (اسم + جوال) · القناة (أيقونة، والوكيل 🔗 لو موجود) · عدد المنتجات · `total` · `paymentStatus` · `fulfillmentStatus` · الشحنة (رقم تتبع 🔗) · الوسوم
- **الفلاتر:** الفترة · حالة الدفع · حالة الشحن · طريقة الدفع · القناة · الوكيل · المدينة · المبلغ (من–إلى) · كوبون · وسم
- **البحث:** رقم الطلب · جوال · اسم · SKU · رقم تتبع
- **إجراءات جماعية:** إنشاء شحنات · طباعة بوليصات · تغيير الحالة · إضافة وسم · تصدير CSV/Excel
- **إجراءات:** طلب يدوي جديد
- ←🔗 الرئيسية · ملف العميل (طلباته) · المنتج (طلباته) · الكوبون (استخداماته) · الوكيل (طلباته) · التقارير

### 5.3 تفاصيل الطلب `/[store]/orders/[id]`
- **الرأس:** `#number` · الحالتين · القناة · التاريخ · أزرار: إنشاء شحنة · استرداد ⚠ · إلغاء ⚠ · طباعة (فاتورة، بوليصة) · المزيد (تكرار، إرسال رابط دفع)
- **العمود الرئيسي:**
  - المنتجات: صورة · الاسم 🔗 المنتج · الخيار · SKU · الكمية · السعر · الخصم · الإجمالي · حالة التنفيذ لكل سطر
  - الملخص: `subtotal` · `discountTotal` (+ الكوبون 🔗) · `shippingTotal` · `taxTotal` · `total` · المدفوع · المسترد · المتبقي
  - الدفعات: الطريقة · المبلغ · الحالة · البطاقة (••••1234) · المرجع · التاريخ
  - الشحنات: الناقل · رقم التتبع 🔗 الشحنة · الحالة · آخر تحديث
  - المرتجعات 🔗 · الفاتورة 🔗 + حالة ZATCA
  - الخط الزمني الموحد (كل OrderEvent بالفاعل)
- **العمود الجانبي:**
  - العميل 🔗: الاسم · الجوال (زر WhatsApp يفتح المحادثة 🔗 داخل الـ Inbox) · عدد طلباته 🔗 · إجمالي مشترياته
  - عنوان الشحن (تعديل قبل الشحن) · ملاحظة العميل · ملاحظات داخلية (إضافة) · الوسوم
  - المحادثة المرتبطة 🔗 + الوكيل 🔗 (لو من وكيل)
  - المخاطر: مؤشرات (أول طلب، مبلغ عالي، دفع عند الاستلام لعميل له مرتجعات)
- **نافذة الاسترداد ⚠:** المنتجات والكميات · المبلغ (محسوب، قابل للتعديل ≤ المتبقي) · السبب* · إرجاع للمخزون ☐ · إشعار العميل ☐
- **نافذة الإلغاء ⚠:** السبب* · استرداد المدفوع ☐ · إرجاع للمخزون ☐ · إشعار العميل ☐
- **نافذة إنشاء الشحنة:** المنتجات والكميات · الطرود (الوزن والأبعاد، معبأة من المنتجات) · الناقل والخدمة (أسعار مقارنة) · مبلغ COD (تلقائي) · تاريخ الاستلام

### 5.4 طلب يدوي `/[store]/orders/new`
العميل* (بحث أو إنشاء سريع: الاسم، الجوال) · المنتجات* (بحث + كمية + تعديل السعر بصلاحية `prices.update`) · العنوان* (من عناوين العميل أو جديد) · الشحن · كوبون · الخصم اليدوي · طريقة الدفع (رابط دفع، COD، تحويل، مدفوع خارجياً) · ملاحظة · إرسال تأكيد للعميل ☐ · الملخص المباشر
- ←🔗 ملف العميل ("طلب جديد") · المحادثة ("إنشاء طلب من المحادثة" يعبّي العميل والمنتجات المذكورة)

### 5.5 المرتجعات `/[store]/returns` و`/[id]`
- **الأعمدة:** الرقم · الطلب 🔗 · العميل 🔗 · المنتجات · السبب · `status` · `refundAmount` · التاريخ
- **الفلاتر:** الحالة · السبب · الفترة
- **التفاصيل:** المنتجات والصور · السبب والملاحظة · الطلب الأصلي 🔗 · شحنة الإرجاع 🔗 · أزرار: قبول (الحل، المبلغ، إرجاع للمخزون، إنشاء شحنة إرجاع) · رفض (السبب*) · تأكيد الاستلام · استرداد ⚠ · إشعار دائن 🔗

### 5.6 السلات المتروكة
- **الأعمدة:** العميل 🔗 أو الجوال · المنتجات (صور مصغرة) · القيمة · وقت الترك · حالة الاسترجاع · المحاولات · الطلب الناتج 🔗
- **الإعدادات (أعلى الصفحة):** الاسترجاع التلقائي ☐ · التوقيت (بعد ساعة، 24 ساعة) · الوكيل المسؤول 🔗 · كوبون تحفيزي اختياري 🔗
- **الإجراءات:** إرسال يدوي · فتح المحادثة 🔗

### 5.7 المنتجات `/[store]/products`
- **الأعمدة:** ☐ · الصورة · الاسم 🔗 · الحالة · المخزون المتاح (مجموع، أحمر لو منخفض) · السعر (أو نطاق) · التصنيفات · المبيعات 30 يوم · المحادثات عنه
- **الفلاتر:** الحالة · التصنيف · المجموعة · المخزون (متوفر، منخفض، نافد) · السعر · الوسم · الماركة
- **إجراءات جماعية:** تفعيل/أرشفة · تعديل الأسعار (نسبة أو مبلغ) · إضافة لتصنيف/مجموعة · وسوم · تصدير · حذف ⚠
- **إجراءات:** منتج جديد · استيراد 🔗 `/imports`
- ←🔗 التصنيف · المجموعة · المخزون · التقارير

### 5.8 المنتج `/[store]/products/[id]`
- **العمود الرئيسي:** `name` (تبويب ar/en) · `description` (محرر + زر "اكتب بالـ AI": يولّد من الاسم والصور) · `media` (سحب وإفلات، ترتيب، نص بديل) · الخيارات والـ variants (جدول: الخيار · `price` · `compareAtPrice` · `sku` · `weightGrams` · المخزون 🔗 · صورة) مع "تعديل جماعي" · `seo` (معاينة نتيجة Google) · `aiNotes` ("معلومات للوكيل")
- **العمود الجانبي:** `status` · `categoryIds` · `collectionIds` · `brand` · `tags` · `requiresShipping` · `taxable` · إحصائيات (مبيعات، إيراد، مشاهدات) · "اعرض في المتجر" 🔗 · "الطلبات اللي فيها المنتج" 🔗 `/orders?product=id` · "المحادثات عنه" 🔗 `/inbox?product=id`
- **شريط الحفظ:** تغييرات غير محفوظة · حفظ · إلغاء

### 5.9 التقييمات `/[store]/reviews`
- **الأعمدة:** المنتج 🔗 · العميل 🔗 · التقييم (نجوم) · نص المراجعة (صور مصغّرة إن وُجدت · «مشتري موثّق» · «تم الرد») · `status` · التاريخ
- **الفلاتر:** الحالة (بانتظار الاعتماد · معتمد · مخفي) · بحث باسم المنتج أو نص التقييم
- **الإجراءات (قائمة كل صف):** اعتماد · إخفاء · ردّ — نافذة تُظهر التقييم والرد الحالي وتحفظ `merchantReply` فيظهر للجميع تحت التقييم في صفحة المنتج
- تقييمات العملاء الجديدة تدخل `pending` ولا تظهر في صفحة المنتج إلا بعد الاعتماد
- ←🔗 المنتج 🔗 · العميل 🔗 · صفحة المنتج في المتجر

### 5.10 التصنيفات والمجموعات
- **التصنيفات:** شجرة بالسحب · لكل عقدة: الاسم · عدد المنتجات 🔗 · الحالة · إضافة فرعي · تعديل (اللوحة الجانبية: الحقول من 4.4) · "اعرض في المتجر" 🔗
- **المجموعات:** الأعمدة: الاسم 🔗 · النوع · عدد المنتجات · الحالة. التفاصيل: الحقول + منتجات يدوية (بحث وإضافة) أو محرر قواعد مع معاينة مباشرة للمنتجات المطابقة

### 5.11 المخزون `/[store]/inventory`
- **الأعمدة:** المنتج 🔗 · الخيار · SKU · `onHand` (تعديل مباشر في الخلية) · `reserved` · `available` · `lowStockThreshold` · آخر حركة
- **الفلاتر:** متوفر · منخفض · نافد · تصنيف
- **التعديل:** الكمية الجديدة أو الفرق · السبب* · ملاحظة
- **سجل الحركات (`/[variantId]`):** التاريخ · الفرق · السبب · المرجع 🔗 (طلب، مرتجع، استيراد) · الفاعل · الرصيد بعد

### 5.12 الاستيراد والتصدير
- **الخطوات:** النوع (منتجات، عملاء، مخزون) · المصدر (ملف، سلة، زد) · رفع · مطابقة الأعمدة (قائمة لكل عمود) · المعاينة (أول 20 صف + الأخطاء لكل صف) · خيارات (تحديث الموجود بالـ SKU، تخطي) · بدء
- **السجل:** النوع · الملف · الحالة · الصفوف (نجح/فشل) · ملف الأخطاء · الفاعل · التاريخ
- 🔗→ المنتجات المستوردة `/products?import=id`

### 5.13 العملاء `/[store]/customers`
- **الأعمدة:** الاسم 🔗 · الجوال · المدينة · `ordersCount` · `totalSpent` · `lastOrderAt` · الشريحة · المصدر · موافقة التسويق
- **الفلاتر:** الشريحة · المدينة · عدد الطلبات · إجمالي الشراء · آخر طلب · المصدر · وسم · موافقة WhatsApp
- **إجراءات:** عميل جديد · تصدير ⚠ · إضافة وسم
- **ملف العميل `/[id]`:**
  - الرأس: الاسم · الجوال (زر "مراسلة" 🔗 المحادثة) · الشريحة · منذ متى عميل
  - الإحصائيات: الطلبات 🔗 `/orders?customer=id` · الإجمالي · المتوسط · المرتجعات 🔗
  - التبويبات: الطلبات · المحادثات 🔗 · السلات المتروكة · المرتجعات · العناوين · الخط الزمني
  - جانبي: البيانات (تعديل) · الموافقات · الوسوم · الملاحظات
  - إجراءات: طلب جديد 🔗 · إرسال كوبون · تصدير بياناته ⚠ · حذف بياناته ⚠ (PDPL)

### 5.14 الكوبونات
- **الأعمدة:** الكود 🔗 · النوع والقيمة · الاستخدام (12 / 100) · الإيراد الناتج 🔗 `/orders?coupon=code` · الفترة · الحالة
- **النموذج:** كل حقول 4.13 بأقسام: الخصم · الشروط · العملاء · المدة · الاستخدام. معاينة جانبية: "خصم 15% حتى 50 ر.س على العطور للطلبات فوق 200 ر.س"

### 5.15 المحادثات (Inbox) `/[store]/inbox`
- **العمود 1 (القائمة):** تبويبات: بانتظاري · مع الوكيل · بانتظار موظف · محلولة. لكل محادثة: القناة · الاسم · آخر رسالة · الوقت · مؤشر مشاعر · شارة "بانتظار موظف منذ X" · الموظف المسؤول
- **الفلاتر:** القناة · الوكيل · الموظف · الأولوية · الوسم · منتج مذكور
- **العمود 2 (المحادثة):** الرسائل مع الفاعل لكل رسالة (وكيل باسمه، موظف) · بطاقات المنتجات والطلبات وروابط الدفع داخل الرسائل 🔗 · ملاحظات داخلية (خلفية صفراء) · أحداث النظام ("حُوّلت من: المبيعات ← الطلبات الكبيرة") · مربع الكتابة: نص · مرفق · منتج (بحث) · رابط دفع · قالب · ملاحظة داخلية · "اقتراح رد" AI
- **الرأس:** مسار الوكلاء 🔗 · الحالة · استلام من الوكيل · إرجاع للوكيل · إسناد لموظف · الأولوية · إغلاق
- **العمود 3 (السياق):** العميل 🔗 + إحصائياته · الطلبات المفتوحة 🔗 · السلة الحالية · ملخص AI · المشاعر · الوسوم · "إنشاء طلب" 🔗 `/orders/new?conversation=id`
- ←🔗 الرئيسية · تفاصيل الطلب · ملف العميل · الإشعارات · المراقبة المباشرة

### 5.16 موافقات الوكيل `/[store]/approvals`
- **الأعمدة:** الإجراء · الوكيل 🔗 · العميل 🔗 · الطلب 🔗 · المبلغ · سبب الوكيل · المحادثة 🔗 · الوقت المتبقي
- **الإجراءات:** موافقة · رفض (سبب يُرسل للوكيل) · فتح المحادثة
- الشارة في القائمة الجانبية بعدد المعلقة

### 5.17 الوكلاء
حسب برومت استوديو الوكلاء، مع الروابط: الوكيل 🔗→ محادثاته `/inbox?agent=id` · طلباته `/orders?agent=id` · مصادر المعرفة 🔗 · الرقم المربوط 🔗 · الوكيل الأب والأبناء 🔗

### 5.18 قاعدة المعرفة `/[store]/knowledge`
- **الأعمدة:** العنوان 🔗 · النوع · الحالة · الأجزاء · الوكلاء المستخدمين 🔗 · آخر مزامنة
- **إضافة:** ملف (PDF/Word/TXT) · سؤال وجواب · رابط · سياسة (من صفحات المتجر 🔗) · الكتالوج (تلقائي)
- **التفاصيل:** المحتوى المستخرج · "اختبر سؤال" (يبيّن الأجزاء المسترجعة) · ربطه بوكلاء

### 5.19 الشحنات `/[store]/shipments`
- **الأعمدة:** رقم التتبع 🔗 · الطلب 🔗 · العميل 🔗 · الناقل · المدينة · الحالة · COD · آخر تحديث · التأخير (تمييز أحمر)
- **الفلاتر:** الحالة · الناقل · المدينة · متأخرة · COD
- **إجراءات جماعية:** طباعة بوليصات · طلب استلام
- **التفاصيل:** الخط الزمني للشحنة · الطرود · البوليصة · الطلب 🔗 · "أرسل التحديث للعميل"

### 5.20 الفواتير `/[store]/invoices`
- **الأعمدة:** الرقم 🔗 · النوع · الطلب 🔗 · العميل 🔗 · المبلغ · الضريبة · التاريخ · حالة ZATCA
- **الفلاتر:** النوع · حالة ZATCA · الفترة
- **التفاصيل:** معاينة PDF · QR · الأخطاء (لو مرفوضة) · إعادة الإرسال · الفاتورة المرتبطة 🔗

### 5.21 التقارير `/[store]/reports/[type]`
| التقرير | المحتوى | يرتبط بـ |
|---|---|---|
| المبيعات | الإيراد، الطلبات، المتوسط، حسب اليوم والقناة والمدينة | كل رقم 🔗 الطلبات المفلترة |
| المنتجات | الأكثر مبيعاً، الأكثر إرجاعاً، الأكثر سؤالاً عنه | 🔗 المنتج |
| العملاء | الجدد مقابل العائدين، الشرائح | 🔗 العملاء المفلترين |
| الوكلاء | المحادثات، الحل، التحويل، المبيعات، التكلفة لكل وكيل | 🔗 الوكيل |
| التسويق | أداء الكوبونات، استرجاع السلات | 🔗 الكوبون |
| الضريبة | ضريبة القيمة المضافة حسب الفترة | 🔗 الفواتير |
- كل تقرير: الفترة · المقارنة بالفترة السابقة · تصدير

### 5.22 تصميم المتجر
- **الثيمات:** الثيم الحالي (معاينة، تخصيص 🔗 المحرر) · ثيمات متاحة (معاينة، تطبيق ⚠)
- **المحرر:** يمين: قالب الصفحة (الرئيسية، المنتج، التصنيف، السلة) + قائمة الأقسام (سحب، إخفاء، حذف، إضافة) · وسط: معاينة حية (جوال/كمبيوتر) · يسار: إعدادات القسم المحدد (نصوص، صور، اختيار منتجات أو تصنيف 🔗، ألوان) · إعدادات عامة (`globals`) · أعلى: مسودة · حفظ · نشر ⚠ · النسخ السابقة
- **الصفحات:** العنوان 🔗 · الرابط · الحالة · في القائمة. النموذج: حقول 4.19 + محرر نصوص
- **القوائم:** محرر شجرة (عمق 2) · كل عنصر: النص + النوع + الهدف (بحث في الصفحات/التصنيفات/المنتجات)
- **الدومينات:** الدومين الحالي · إضافة دومين: الإدخال · سجلات DNS للنسخ · حالة التحقق وSSL (تحديث تلقائي) · تعيين كرئيسي
- **SEO:** عنوان ووصف الرئيسية · صورة المشاركة · الـ redirects (من، إلى) · رابط sitemap

#### 5.22.1 أدوات المحرر الجديدة
> المحرر `/[store]/store-design`: أقسام يميناً، معاينة حية (iframe) وسطاً، إعدادات يساراً. التفاصيل الكاملة في `docs/THEME_SYSTEM_SPEC.md` — البنود 5–7.

| # | الأداة | الوظيفة |
|---|---|---|
| 1 | بيانات المعاينة | منسدلة اختيار منتج/تصنيف/صفحة/مجموعة + «معاينة كـ» (عميل جديد · مسجل · سلة فيها منتجات) |
| 2 | مشاركة المعاينة | رابط `ThemeShare` صالح 7 أيام يفتح المسودة على `/preview?share=<token>` بدون دخول + شريط «معاينة — غير منشور» + زر إلغاء الرابط |
| 3 | مكتبة الوسائط `/[store]/media` | رفع متعدد بالسحب · بحث · فلاتر (الكل/صور/فيديو/مستخدم/غير مستخدم) · قص بنسب جاهزة + نقطة تركيز · نص بديل ar/en · تنبيه وضغط للملفات >500KB |
| 4 | إدارة الثيمات `/storefront/themes` | نسخ · إعادة تسمية · حذف (غير المنشور) · تصدير/استيراد JSON مع تحقق schema ورسائل أخطاء |
| 5 | Presets | أنماط جاهزة لكل ثيم (افتراضي، رمضان، اليوم الوطني…) — تغيّر الألوان/الخطوط/الصور الافتراضية فقط + حفظ نسخة تلقائياً قبل التطبيق |
| 6 | «صمم لي بالـ AI» | واجهة فقط: شعار اختياري + وصف النشاط + الطابع + الجمهور → 3 اقتراحات (ألوان+خطوط+ترتيب+نصوص) تُطبق كمسودة · زر «اكتب لي النص» بجانب الحقول النصية |
| 7 | لوحة جودة التصميم | تنبيهات: صورة ثقيلة، تباين ضعيف، إنجليزي ناقص، بلا نص بديل، قسم فاضي، رابط مكسور، زر بلا رابط — كل تنبيه يحدد القسم + مؤشر أداء تقديري (سريع/متوسط/بطيء) |
| 8 | التعديل والتنقل | تراجع/إعادة · حفظ تلقائي «المسودة محفوظة ✓» · تحديد قسم/بلوك من المعاينة · نسخ/قص/لصق قسم بين القوالب · اختصارات (Delete، Ctrl+D تكرار، Esc إلغاء تحديد) |
| 9 | سجل النسخ | كل نشر = `ThemeVersion` بـ `snapshot` (تاريخ/ناشر/ملاحظة) + معاينة واستعادة كمسودة |
| 10 | الجدولة | `scheduledPublish` نشر بتاريخ/وقت + `activeWindow` ثيم مؤقت (بداية/نهاية) يرجع تلقائياً |
| — | التحكم حسب الجهاز | إظهار/إخفاء لكل قسم + تجاوزات حقول مختارة لكل جهاز (`settings.mobile`/`tablet`) — مفتاح الجهاز فوق المعاينة |
| — | أنظمة الألوان | `colorSchemes` على مستوى الثيم؛ كل قسم يختار نظاماً من إعداد `colorScheme` |

**أنواع الأقسام (`SECTION_REGISTRY` — 22 نوعاً):**

| النوع | الاسم | | النوع | الاسم |
|---|---|---|---|---|
| `header` | الهيدر | | `rich-text` | نص منسق |
| `footer` | الفوتر | | `video` | فيديو |
| `hero` | الواجهة الرئيسية | | `collage` | كولاج |
| `slider` | السلايدر | | `logo-list` | شعارات |
| `categories` | التصنيفات | | `contact-form` | نموذج تواصل |
| `featured-products` | منتجات مميزة | | `map` | خريطة |
| `banner` | شريط إعلاني | | `countdown` | عدّ تنازلي |
| `image-text` | صورة ونص | | `tabs` | تبويبات |
| `testimonials` | آراء العملاء | | `recently-viewed` | شاهدت مؤخراً |
| `features` | المزايا | | `main-product` | قسم المنتج |
| `faq` | الأسئلة الشائعة | | `newsletter` | النشرة البريدية |

**أشكال الهيدر:** إعداد `headerVariant` في قسم `header` — `default` (شعار + تنقل + أيقونات) · `centered` (الشعار بالوسط والتنقل في صف تحته) · `search-prominent` (شعار | بحث بارز | أيقونات، وصف تصنيفات تحته — نمط سلة/نون).

**أنواع البلوكات (`BLOCK_REGISTRY` — 23 نوعاً):** عامة (`heading`, `text`, `button`, `image`, `icon-item`, `badge`, `divider`) · خاصة بأقسام (`slide`, `testimonial`, `qa`, `feature`, `logo`, `tab`, `promo-card`, `product-card`, `social-link`) · بلوكات `main-product` (`title`, `price`, `variant-picker`, `quantity`, `buy-button`, `description`, `accordion`). كل بلوك: zod schema + defaults + حقول FieldMeta تولّد نموذج الإعدادات.

#### 5.22.2 مميزات المتجر (Theme.features)
مفاتيح تشغيل تظهر في بطاقة «مميزات المتجر» بإعدادات الثيم العامة — غياب المفتاح = مفعّل. كل ميزة لها مفتاح في `THEME_FEATURES`: `wishlist` (قلب على البطاقة/المنتج + `/wishlist` + عداد الهيدر) · `compare` (حتى 4 منتجات بنفس التصنيف، شريط سفلي، `/compare`) · `reviews` (نجوم + قسم تقييمات في صفحة المنتج + كتابة بعد التوصيل + رد التاجر + إدارة `/reviews`) · `quickView` (عرض سريع من البطاقة) · `quickFilters` (فلاتر التصنيف/البحث بشرائح قابلة للحذف) · `recentlyViewed` (آخر 10 — قسم `recently-viewed` + شريط صفحة المنتج) · `stickyBuyBar` (زر شراء ثابت على الجوال) · `scarcity` («باقي X» حتى `featureSettings.scarcityThreshold`) · `viewersNow` («X يشاهد الآن») · `deliveryEstimate` (تقدير التوصيل حسب المدينة) · `sizeGuide` (دليل مقاسات) · `backInStock` («أعلمني عند التوفر» → `BackInStockSubscription`) · `installments` («4 دفعات بـX» — واجهة تابي/تمارا) · `share` (WhatsApp/X/نسخ الرابط) · `backToTop` (زر العودة للأعلى)

### 5.23 التطبيقات
- **متجر التطبيقات:** تصنيفات · بحث · بطاقة: أيقونة، اسم، وصف قصير، تقييم، سعر
- **صفحة التطبيق:** الوصف · الصور · المطور · الصلاحيات المطلوبة (بلغة بسيطة) · السعر · الدعم · تثبيت
- **شاشة الموافقة ⚠:** "التطبيق X يطلب:" قائمة الصلاحيات مع شرح · السعر · موافقة/إلغاء
- **المثبتة:** الأيقونة · الاسم 🔗 · الصلاحيات الممنوحة · آخر نشاط · فتح · إلغاء التثبيت ⚠
- **تفاصيل التثبيت:** الصلاحيات · سجل نشاط التطبيق (من AuditLog 🔗) · الفوترة · إلغاء

### 5.24 الإعدادات
| الشاشة | الحقول | روابط |
|---|---|---|
| عامة | حقول Store من 4.1 | 🔗 الضرائب (الرقم الضريبي) |
| الدفع | حقول 4.20 الدفع + حالة KYC وخطواتها | 🔗 الطلبات المدفوعة |
| الشحن | حقول 4.20 الشحن + محرر المناطق | 🔗 الشحنات |
| الضرائب وZATCA | حقول 4.20 الضرائب + خطوات الربط | 🔗 الفواتير المرفوضة |
| الإشعارات | جدول القوالب لكل حدث وقناة + محرر + متغيرات ({customer_name}, {order_number}, {tracking_url}) + معاينة | — |
| القنوات | أرقام WhatsApp والصوت + Web Chat | 🔗 الوكيل المربوط |
| الموظفون | الأعمدة: الاسم، البريد، الدور 🔗، الحالة، آخر دخول، MFA · دعوة (البريد*، الدور*) | 🔗 سجل العمليات `/audit?actor=id` |
| الأدوار | قائمة الأدوار + محرر: الاسم، الوصف، مربعات الصلاحيات مجمعة حسب القسم، ملخص "هذا الدور يقدر..." | 🔗 الموظفين بهذا الدور |
| سجل العمليات | الأعمدة: الوقت، الفاعل 🔗، الإجراء، الهدف 🔗، التغييرات (قبل/بعد) · فلاتر: الفاعل، النوع، الفترة | — |
| الباقة والفوترة | الباقة، الاستهلاك مقابل الحدود (أشرطة)، الإضافات، الفواتير، طريقة الدفع | — |
| المطورين | مفاتيح API (حقول 4.21) · الـ webhooks (إضافة، سجل التسليم، إعادة إرسال) · تطبيقات خاصة · 🔗 التوثيق | — |
| المنطقة الخطرة | تصدير كل البيانات · إيقاف المتجر ⚠ · حذف المتجر ⚠ (كتابة اسم المتجر + OTP) | — |

### 5.25 المساعد الذكي (Copilot)

| الشاشة | الحقول | روابط |
|---|---|---|
| اللوحة `/[store]/copilot` | شريط صلاحيات (الهوية + المتجر) · شريط سياق التحديد · قائمة محادثات محفوظة (تثبيت 📌 / مشتركة 🔒) · محادثة (نص، جدول، رسم، بطاقة إجراء/خطة/توضيح) · مؤلف بإشارات `#/@//` للكيانات + إملاء صوتي · زر محادثة جديدة | 🔗 مهام المساعد · 🔗 سجل المحادثات |
| اللوحة العائمة (Cmd/Ctrl+J) | نفس المكوّنات بصيغة Sheet من الجانب + شارة الإجراءات المعلّقة على زر الشرارة | — |
| المهام `/[store]/copilot/tasks` | جدول `CopilotTask`: العنوان، النوع (مجدولة/تنبيه badge)، الجدولة (ساعة:دقيقة)، مفعّلة (Switch)، آخر تشغيل · إجراءات: شغّل الآن، تعديل (حوار: العنوان*، الطلب*، الساعة، الدقيقة، الحد للتنبيه، مفعّلة)، حذف (ConfirmDialog خطر) | 🔗 `/copilot` |
| السجل `/[store]/copilot/history` | بحث · جدول `CopilotConversation`: العنوان (أول رسالة)، المشاركة 🔒/التثبيت 📌، آخر تحديث، عدد الرسائل · إجراءات: فتح `/copilot?c=id`، تثبيت، نسخ رابط المشاركة، حذف | 🔗 `/copilot?c=<id>` |
| الإعدادات `/[store]/settings/copilot` | مفاتيح تأكيد دائم (تعديل/خطير/جماعي) · مربعات حظر أدوات الكتابة والخطرة من `TOOL_REGISTRY` · لغة الرد (عربي/English) ولهجة (خليجي/فصحى) · زر حفظ | 🔗 مهام المساعد |
| المنصة `/copilot` (super-admin) | نفس السطح المشترك بسياق `platform`: شريط «يعمل بصلاحيات: مالك المنصة — المنصة» · سيناريوهات المنصة (متاجر جديدة، استهلاك AI الشاذ، إيقاف متجر ⚠ بكلمة تأكيد، إعادة مهام فاشلة، تقرير شهري) · لوحة Cmd/Ctrl+J + عنصر تنقل | 🔗 المتاجر/المهام/الاشتراكات |

**القواعد الأمنية:** الأدوات المحظورة من الإعدادات تُرفض برسالة «ممنوع من إعدادات المتجر» · كل تنفيذ write/dangerous يسجّل سطر تدقيق بالفاعل «🤖 Copilot نيابة عن {user}» مع رابط المحادثة `conversationId` · المحادثة المشتركة من موظف آخر للعرض فقط.

---

## 6. الحالات والألوان الموحدة (Badges)

| اللون | الحالات |
|---|---|
| أخضر | paid, delivered, active, resolved, verified, cleared, ready, approved, live |
| أزرق | in_progress, processing, shipped, in_transit, open_ai |
| برتقالي | pending, needs_action, waiting_human, partially_refunded, scheduled, draft, in_review |
| أحمر | failed, cancelled, rejected, out_of_stock, suspended, urgent |
| رمادي | archived, closed, expired, disabled, uninstalled, hidden |

مكوّن واحد `<StatusBadge entity="order" field="paymentStatus" value="paid" />` يعرف النص العربي واللون لكل حالة.

---

## 7. خريطة الترابط بين الكيانات

| الكيان | يظهر/يرتبط في |
|---|---|
| **الطلب** | الرئيسية · العميل · المنتج · المحادثة · الشحنة · الفاتورة · المرتجع · الكوبون · السلة المتروكة (المسترجعة) · الوكيل · التقارير · سجل المخزون · الموافقات · الإشعارات |
| **العميل** | الطلب · المحادثة · المرتجع · السلة المتروكة · الفاتورة · الشحنة · الكوبون (المؤهلين) · التقارير |
| **المنتج** | الطلب (السطور) · المخزون · التصنيف · المجموعة · الكوبون · المحادثة (بطاقات) · السلة المتروكة · محرر الثيم · القوائم · قاعدة المعرفة (الكتالوج) · التقارير |
| **المحادثة** | العميل · الطلب · الوكيل · الموافقات · المراقبة المباشرة · السلة المتروكة (محاولات الاسترجاع) · الإشعارات |
| **الوكيل** | المحادثة · الطلب · الموافقات · قاعدة المعرفة · القنوات · السلات المتروكة · التقارير · سجل العمليات |
| **الشحنة** | الطلب · المرتجع · العميل · الإشعارات |
| **الفاتورة** | الطلب · المرتجع (إشعار دائن) · العميل · الضرائب |
| **الموظف** | سجل العمليات · المحادثة (المسؤول) · الموافقات (المقرر) · الأدوار · التطبيقات (من ثبّت) |
| **التطبيق** | سجل العمليات · الخط الزمني للطلب (لو عدّل) · المطورين · الـ webhooks |

---

## 8. الإشعارات داخل اللوحة

| الحدث | النص | يفتح |
|---|---|---|
| طلب جديد | طلب جديد #1042 بقيمة 350 ر.س | `/orders/1042` |
| فشل دفع | فشل دفع الطلب #1042 | `/orders/1042` |
| محادثة بانتظار موظف | محمد ينتظر موظف منذ 3 دقائق | `/inbox/[id]` |
| موافقة وكيل | وكيل المرتجعات يطلب استرداد 120 ر.س | `/approvals?highlight=id` |
| مخزون منخفض | عطر العود 100مل باقي 3 | `/inventory/[variantId]` |
| شحنة متأخرة | 5 شحنات متأخرة أكثر من 3 أيام | `/shipments?delayed=true` |
| فاتورة مرفوضة | فاتورة #INV-220 رفضتها فاتورة | `/invoices/[id]` |
| طلب إرجاع | طلب إرجاع جديد على #1042 | `/returns/[id]` |
| تطبيق جديد مثبت | ثبّت أحمد تطبيق X | `/apps/[installationId]` |
| اقتراب الحد | استهلكت 80% من محادثات الوكيل | `/settings/billing` |

---

## 9. الربط بين التطبيقات الأربعة

- **اللوحة ↔ المتجر:** "اعرض في المتجر" من أي منتج/تصنيف/صفحة · المحرر يعرض المتجر الحقيقي في المعاينة · طلب من المتجر يظهر فوراً في الطلبات والرئيسية والإشعارات (محاكاة بحدث وهمي) · شريط "تعديل في اللوحة" في المتجر للموظف المسجل.
- **المتجر ↔ المحادثة:** ويدجت المحادثة في المتجر = نفس المحادثة في الـ Inbox · "أضف للسلة" من بطاقة الوكيل يضيف لنفس السلة.
- **Super Admin ↔ اللوحة:** تفاصيل المتجر في Super Admin تعرض نفس البيانات · "دخول دعم" يفتح لوحة التاجر بشريط أحمر ثابت: "أنت في وضع الدعم على متجر X — ينتهي خلال 58 دقيقة" · تعليق متجر يظهر للتاجر كشريط تحذير.
- **بوابة المطورين ↔ اللوحة:** التطبيق المعتمد يظهر في متجر التطبيقات · تثبيت تطبيق في متجر تجريبي يفتح لوحة تاجر تجريبية · تحليلات المطور تعكس التثبيتات الفعلية.
- **بيانات وهمية متسقة:** نفس العميل ونفس الطلب لهم نفس المعرّف في كل التطبيقات والشاشات. الطلب #1042 في الطلبات هو نفسه في ملف العميل والمحادثة والشحنة والفاتورة.

---

## 10. قائمة التحقق لكل شاشة

- [ ] كل الحقول والأعمدة من هذا الملف موجودة بنفس الأسماء البرمجية
- [ ] كل إشارة لكيان آخر `EntityLink` يعمل
- [ ] الفلاتر والتبويبات في الـ URL
- [ ] الحالات الأربع (تحميل، فاضية، خطأ، بيانات)
- [ ] الروابط الداخلة من الشاشات الأخرى تفتح بنفس الفلتر المقصود
- [ ] الإجراءات الحساسة ⚠ بنافذة تأكيد
- [ ] الصلاحيات تخفي الإجراءات والروابط غير المسموحة
- [ ] RTL وLTR والوضع الداكن والجوال
