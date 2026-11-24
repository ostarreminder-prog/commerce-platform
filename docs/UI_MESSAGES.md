# نصوص الواجهة والرسائل

> المرجع الملزم لكل نص يظهر للمستخدم بعد إجراء: النجاح، الخطأ، التأكيد، التحقق، الحالات الفاضية.
> مكان الملف: `docs/UI_MESSAGES.md` · يُستخدم مع `docs/SCREENS_SPEC.md`
> كل رسالة لها مفتاح ترجمة. ضع النص العربي في `ar.json` كما هو، والإنجليزي يُترجم بنفس المعنى.

---

## 1. قواعد كتابة الرسائل

1. **اللغة:** عربية فصحى مبسطة وودودة، بدون تكلف. نخاطب المستخدم بـ "أنت" المذكر الافتراضي، وبدون "عزيزي".
2. **قصيرة:** العنوان ≤ 6 كلمات، والنص ≤ 20 كلمة.
3. **محددة:** اذكر الشيء باسمه أو رقمه: "تم حفظ المنتج «عطر العود»"، وليس "تم الحفظ بنجاح".
4. **الخطأ يقول السبب والحل:** "ما قدرنا نرسل الرمز. تأكد من الرقم وحاول مرة ثانية" بدل "حدث خطأ".
5. **لا نلوم المستخدم:** "الرقم غير صحيح" بدل "أدخلت رقماً خاطئاً".
6. **الأزرار أفعال واضحة:** "إلغاء الطلب" و"تراجع" بدل "نعم" و"لا".
7. **الإجراء الخطر:** الزر أحمر، ويكرر اسم الإجراء، والنافذة تشرح الأثر وهل يمكن التراجع.
8. **المتغيرات** بين أقواس معقوفة: `{name}`, `{number}`, `{amount}` · المبالغ دائماً عبر `formatMoney`.
9. **الجمع العربي:** استخدم ICU plural في next-intl (صفر، واحد، اثنان، 3–10، 11+): "منتج واحد"، "منتجان"، "3 منتجات"، "11 منتجاً".

---

## 2. أنواع الرسائل وسلوكها

| النوع | متى | الشكل | المدة |
|---|---|---|---|
| **Toast نجاح** | بعد إجراء نجح | زاوية الشاشة، أيقونة ✓ خضراء | 4 ثوانٍ، وتراجع (Undo) لو ممكن 8 ثوانٍ |
| **Toast خطأ** | إجراء فشل | أيقونة حمراء + زر "إعادة المحاولة" | يبقى لين يُغلق |
| **Toast معلومة** | حدث في الخلفية (طلب جديد وصل) | أيقونة زرقاء + رابط | 6 ثوانٍ |
| **نافذة تأكيد** | قبل إجراء ⚠ | عنوان + نص الأثر + زرين (إلغاء، الإجراء) | — |
| **نافذة تأكيد قوية** | حذف نهائي، حذف متجر | + كتابة نص للتأكيد أو OTP | — |
| **خطأ حقل (Inline)** | التحقق | نص أحمر تحت الحقل + إطار أحمر | يظهر عند مغادرة الحقل أو عند الإرسال |
| **ملخص أخطاء** | إرسال نموذج فيه أخطاء | تنبيه أعلى النموذج + روابط للحقول | — |
| **Banner** | حالة مستمرة (متجر غير منشور، تجربة تنتهي) | شريط أعلى الصفحة | لين تتغير الحالة |
| **حالة فاضية** | قائمة بدون بيانات | أيقونة + عنوان + نص + زر الخطوة التالية | — |
| **حالة خطأ صفحة** | فشل تحميل الصفحة | أيقونة + عنوان + "إعادة المحاولة" | — |

**قواعد مهمة:**
- لا تعرض Toast نجاح لعملية واضحة النتيجة بصرياً (مثل تبديل مفتاح)، إلا إذا كان لها أثر خارجي.
- الحذف القابل للاسترجاع (أرشفة، إخفاء) يكون Toast مع "تراجع"، بدون نافذة تأكيد.
- الحذف النهائي = نافذة تأكيد، بدون تراجع.
- لا تُظهر رسالتين لنفس الحدث.

---

## 3. الرسائل العامة (common)

| المفتاح | النص |
|---|---|
| `common.save.success` | تم حفظ التغييرات |
| `common.save.error` | ما قدرنا نحفظ التغييرات. حاول مرة ثانية |
| `common.unsaved.title` | عندك تغييرات ما انحفظت |
| `common.unsaved.body` | إذا طلعت الحين بتضيع التغييرات. |
| `common.unsaved.confirm` | اطلع بدون حفظ |
| `common.unsaved.cancel` | ارجع للتعديل |
| `common.unsavedBar` | تغييرات غير محفوظة |
| `common.network.offline` | ما فيه اتصال بالإنترنت. بنكمل تلقائياً لما يرجع الاتصال |
| `common.network.backOnline` | رجع الاتصال |
| `common.network.error` | تعذر الاتصال بالخادم. تأكد من الإنترنت وحاول مرة ثانية |
| `common.server.error` | صار خلل من جهتنا، وفريقنا تنبّه له. حاول بعد شوي |
| `common.timeout` | الطلب أخذ وقت أطول من المتوقع. حاول مرة ثانية |
| `common.rateLimit` | محاولات كثيرة خلال وقت قصير. انتظر {seconds} ثانية |
| `common.forbidden.title` | ما عندك صلاحية |
| `common.forbidden.body` | هذي الصفحة تحتاج صلاحية {permission}. تواصل مع مالك المتجر |
| `common.notFound.title` | الصفحة غير موجودة |
| `common.notFound.body` | يمكن انحذفت أو الرابط غير صحيح |
| `common.session.expired` | انتهت الجلسة. سجّل دخولك مرة ثانية وبنرجعك لنفس الصفحة |
| `common.conflict` | شخص ثاني عدّل هذا العنصر قبل شوي. حدّث الصفحة عشان تشوف آخر نسخة |
| `common.copy.success` | تم النسخ |
| `common.retry` | إعادة المحاولة |
| `common.undo` | تراجع |
| `common.cancel` | إلغاء |
| `common.close` | إغلاق |
| `common.loading` | جاري التحميل… |
| `common.saving` | جاري الحفظ… |
| `common.export.started` | جاري تجهيز الملف. بنرسل لك إشعار لما يجهز |
| `common.export.ready` | الملف جاهز: {fileName} |
| `common.bulk.success` | تم تطبيق الإجراء على {count, plural, one {عنصر واحد} two {عنصرين} few {# عناصر} many {# عنصراً} other {# عنصر}} |
| `common.bulk.partial` | تم على {success} وفشل {failed}. اعرض التفاصيل |
| `common.upgrade.title` | هذي الميزة في باقة {plan} |
| `common.upgrade.body` | رقّ باقتك عشان تستخدم {feature} |
| `common.limit.reached` | وصلت للحد في باقتك ({used} من {limit}). رقّ الباقة أو اشترِ إضافة |
| `common.limit.near` | استهلكت {percent}% من {metric} هذا الشهر |

---

## 4. رسائل التحقق من الحقول (validation)

| المفتاح | النص |
|---|---|
| `validation.required` | هذا الحقل مطلوب |
| `validation.minLength` | لازم يكون {min} أحرف على الأقل |
| `validation.maxLength` | الحد الأقصى {max} حرف |
| `validation.email` | البريد الإلكتروني غير صحيح |
| `validation.phone` | رقم الجوال غير صحيح. مثال: 05XXXXXXXX |
| `validation.number` | أدخل رقماً |
| `validation.integer` | أدخل رقماً صحيحاً بدون كسور |
| `validation.min` | أقل قيمة مسموحة {min} |
| `validation.max` | أعلى قيمة مسموحة {max} |
| `validation.price.positive` | السعر لازم يكون أكبر من صفر |
| `validation.compareAtPrice` | السعر قبل التخفيض لازم يكون أعلى من السعر الحالي |
| `validation.percentage` | النسبة بين 1 و100 |
| `validation.url` | الرابط غير صحيح. لازم يبدأ بـ https:// |
| `validation.slug` | استخدم حروف إنجليزية صغيرة وأرقام وشرطة (-) فقط |
| `validation.slug.taken` | هذا الرابط مستخدم. جرّب: {suggestions} |
| `validation.sku.taken` | رمز SKU هذا مستخدم في منتج «{product}» |
| `validation.coupon.taken` | فيه كوبون بنفس الكود |
| `validation.email.taken` | هذا البريد مسجل. تبي تسجّل دخول؟ |
| `validation.phone.taken` | هذا الرقم مسجل. تبي تسجّل دخول؟ |
| `validation.vat` | الرقم الضريبي 15 رقماً، يبدأ وينتهي بالرقم 3 |
| `validation.cr` | رقم السجل التجاري 10 أرقام |
| `validation.iban` | الآيبان يبدأ بـ SA ويتكون من 24 خانة |
| `validation.nationalId` | رقم الهوية 10 أرقام |
| `validation.postalCode` | الرمز البريدي 5 أرقام |
| `validation.buildingNumber` | رقم المبنى 4 أرقام |
| `validation.shortAddress` | العنوان المختصر 4 حروف و4 أرقام. مثال: RRRD2929 |
| `validation.dateRange` | تاريخ النهاية لازم يكون بعد تاريخ البداية |
| `validation.date.past` | التاريخ لازم يكون في المستقبل |
| `validation.file.type` | نوع الملف غير مدعوم. المسموح: {types} |
| `validation.file.size` | حجم الملف أكبر من {max} |
| `validation.image.dimensions` | أقل مقاس للصورة {width}×{height} |
| `validation.files.max` | الحد الأقصى {max} ملفات |
| `validation.password.weak` | كلمة المرور لازم تكون 8 أحرف على الأقل وفيها رقم |
| `validation.otp.length` | الرمز 6 أرقام |
| `validation.form.summary` | فيه {count, plural, one {خطأ واحد} two {خطآن} few {# أخطاء} other {# خطأ}} لازم تصلحه قبل الحفظ |

---

## 5. التسجيل والدخول (auth)

| المفتاح | النوع | النص |
|---|---|---|
| `auth.otp.sent` | نص الشاشة | أرسلنا رمز التحقق إلى {phone} |
| `auth.otp.resend.countdown` | نص | تقدر تعيد الإرسال بعد {seconds} ثانية |
| `auth.otp.resent` | Toast نجاح | أرسلنا رمز جديد |
| `auth.otp.viaWhatsapp` | Toast نجاح | أرسلنا الرمز على WhatsApp |
| `auth.otp.invalid` | خطأ حقل | الرمز غير صحيح. باقي {count} محاولات |
| `auth.otp.expired` | خطأ حقل | انتهت صلاحية الرمز. اطلب رمز جديد |
| `auth.otp.locked` | خطأ | محاولات كثيرة. حاول مرة ثانية بعد 15 دقيقة |
| `auth.otp.sendFailed` | Toast خطأ | ما قدرنا نرسل الرمز. تأكد من الرقم أو جرّب WhatsApp |
| `auth.login.failed` | خطأ | البريد أو كلمة المرور غير صحيحة |
| `auth.login.suspended` | خطأ | حسابك موقوف. تواصل مع مالك المتجر |
| `auth.mfa.title` | عنوان | التحقق بخطوتين |
| `auth.mfa.invalid` | خطأ حقل | الرمز غير صحيح |
| `auth.logout.success` | Toast | سجّلت خروجك |
| `auth.forgot.sent` | نص | إذا كان البريد مسجلاً، بيوصلك رابط لإعادة التعيين خلال دقائق |
| `auth.reset.success` | Toast نجاح | تم تغيير كلمة المرور. سجّل دخولك |
| `auth.invite.title` | عنوان | {inviter} دعاك تنضم لمتجر {store} |
| `auth.invite.body` | نص | دورك: {role} |
| `auth.invite.accepted` | Toast نجاح | أهلاً فيك في فريق {store} |
| `auth.invite.expired` | حالة صفحة | انتهت صلاحية الدعوة. اطلب من صاحب المتجر يرسل دعوة جديدة |

---

## 6. إنشاء المتجر والإعداد (onboarding)

| المفتاح | النوع | النص |
|---|---|---|
| `onboarding.slug.available` | نص حقل ✓ | الرابط متاح |
| `onboarding.slug.taken` | خطأ حقل | الرابط مستخدم. اقتراحات: {suggestions} |
| `onboarding.creating.1` | شاشة انتظار | نجهز متجرك… |
| `onboarding.creating.2` | شاشة انتظار | نختار التصميم المناسب لنشاطك… |
| `onboarding.creating.3` | شاشة انتظار | نجهز مساعدك الذكي… |
| `onboarding.welcome` | عنوان | أهلاً {name}، متجرك جاهز 🎉 |
| `onboarding.welcome.body` | نص | باقي خطوات بسيطة وتبدأ تبيع. تقدر تكملها بنفسك أو مع المساعد |
| `onboarding.step.saved` | Toast نجاح | تم حفظ «{step}» |
| `onboarding.step.skip` | زر | تخطَّ الحين |
| `onboarding.ai.cta` | زر | أكمل بالمحادثة مع المساعد |
| `onboarding.products.aiGenerated` | Toast نجاح | جهزنا {count} منتجات من صورك. راجعها قبل النشر |
| `onboarding.publish.blocked.title` | نافذة | باقي {count} خطوات قبل النشر |
| `onboarding.publish.confirm.title` | نافذة تأكيد | تنشر متجرك الحين؟ |
| `onboarding.publish.confirm.body` | نص | بيصير متجرك متاحاً للجميع على {url} |
| `onboarding.publish.confirm.cta` | زر | انشر متجري |
| `onboarding.published.title` | احتفال | متجرك صار متاح للعالم 🎉 |
| `onboarding.published.body` | نص | شارك رابط متجرك مع عملائك |
| `onboarding.share.whatsapp` | زر | شارك على WhatsApp |
| `onboarding.checklist.title` | بطاقة | أكمل إعداد متجرك ({percent}%) |
| `onboarding.checklist.done` | Toast نجاح | خلّصت كل خطوات الإعداد 👏 |

**بوابات "تحتاج تكمل أولاً" (gate):**
| المفتاح | العنوان | النص | الزر |
|---|---|---|---|
| `gate.payments` | فعّل الدفع الإلكتروني | نحتاج نتحقق من نشاطك. ياخذ 5 دقائق تقريباً | ابدأ التحقق |
| `gate.pickupAddress` | أضف عنوان الاستلام | شركة الشحن تحتاجه عشان تستلم الطرود منك | أضف العنوان |
| `gate.whatsapp` | اربط رقم WhatsApp | الوكيل يحتاج رقم عشان يرد على عملائك | اربط الرقم |
| `gate.voiceNumber` | اربط رقم هاتف | الوكيل الصوتي يحتاج رقم يستقبل عليه المكالمات | اربط رقماً |
| `gate.plan` | متاح في باقة {plan} | {feature} غير متوفرة في باقتك الحالية | شوف الباقات |
| `gate.vat` | أكمل بيانات الضريبة | الفواتير الضريبية تحتاج الرقم الضريبي والعنوان الوطني | أكمل البيانات |

---

## 7. التحقق من النشاط والدفع (verification, payments)

| المفتاح | النوع | النص |
|---|---|---|
| `verification.draftSaved` | نص صغير | محفوظ تلقائياً |
| `verification.submit.confirm.title` | نافذة تأكيد | ترسل بياناتك للمراجعة؟ |
| `verification.submit.confirm.body` | نص | ما تقدر تعدّل البيانات لين يجي الرد. تأكد إنها مطابقة للمستندات |
| `verification.submitted` | Toast نجاح | أرسلنا بياناتك. المراجعة تاخذ عادة 1–3 أيام عمل |
| `verification.banner.inReview` | Banner | بيانات نشاطك قيد المراجعة. بنعلمك أول ما تتفعل |
| `verification.banner.rejected` | Banner خطأ | ما تم قبول التحقق: {reason}. عدّل البيانات وأرسلها مرة ثانية |
| `verification.approved` | إشعار + Toast | تم تفعيل الدفع الإلكتروني ✓ صار عملاؤك يقدرون يدفعون بالبطاقات وApple Pay |
| `verification.upload.failed` | خطأ | ما قدرنا نرفع الملف. تأكد إنه PDF أو صورة وحجمه أقل من 10MB |
| `payments.method.enabled` | Toast | تم تفعيل {method} |
| `payments.method.disabled.confirm` | نافذة | توقف {method}؟ — العملاء ما بيشوفونه في صفحة الدفع |
| `payments.cod.lastMethod` | خطأ | لازم تبقى طريقة دفع وحدة مفعلة على الأقل |

---

## 8. الطلبات (orders)

| المفتاح | النوع | النص |
|---|---|---|
| `orders.new.toast` | Toast معلومة | طلب جديد #{number} بقيمة {amount} — عرض |
| `orders.status.updated` | Toast نجاح | تم تحديث الطلب #{number} إلى «{status}» |
| `orders.status.notifyCustomer` | checkbox | أعلم العميل على WhatsApp |
| `orders.note.added` | Toast | تمت إضافة الملاحظة |
| `orders.address.updated` | Toast | تم تحديث عنوان الشحن |
| `orders.address.locked` | تلميح | ما يمكن تعديل العنوان بعد إنشاء الشحنة |
| `orders.cancel.title` | نافذة تأكيد | إلغاء الطلب #{number}؟ |
| `orders.cancel.body` | نص | ما يمكن التراجع عن الإلغاء. اختر وش تبي يصير للمبلغ والمخزون |
| `orders.cancel.refund` | checkbox | استرداد المبلغ المدفوع ({amount}) |
| `orders.cancel.restock` | checkbox | إرجاع المنتجات للمخزون |
| `orders.cancel.notify` | checkbox | إعلام العميل |
| `orders.cancel.cta` | زر أحمر | إلغاء الطلب |
| `orders.cancel.keep` | زر | تراجع |
| `orders.cancel.success` | Toast نجاح | تم إلغاء الطلب #{number} |
| `orders.cancel.shipped` | خطأ | الطلب انشحن. أنشئ طلب إرجاع بدل الإلغاء |
| `orders.refund.title` | نافذة تأكيد | استرداد مبلغ من الطلب #{number} |
| `orders.refund.body` | نص | بيرجع المبلغ لنفس طريقة الدفع خلال 3–14 يوم حسب البنك |
| `orders.refund.max` | خطأ حقل | أقصى مبلغ ممكن استرداده {amount} |
| `orders.refund.cta` | زر أحمر | استرداد {amount} |
| `orders.refund.success` | Toast نجاح | تم استرداد {amount} للطلب #{number} |
| `orders.refund.failed` | Toast خطأ | ما نجح الاسترداد: {reason}. حاول مرة ثانية أو تواصل مع الدعم |
| `orders.refund.cod` | تلميح | الطلب مدفوع عند الاستلام. سجّل الاسترداد بعد ما ترجّع المبلغ للعميل بنفسك |
| `orders.paymentLink.sent` | Toast نجاح | أرسلنا رابط الدفع للعميل على WhatsApp |
| `orders.paymentLink.copied` | Toast | تم نسخ رابط الدفع |
| `orders.manual.created` | Toast نجاح | تم إنشاء الطلب #{number} |
| `orders.duplicate.success` | Toast نجاح | تم إنشاء نسخة من الطلب: #{number} |
| `orders.bulk.print.ready` | Toast | جهزنا {count} بوليصات للطباعة |
| `orders.bulk.print.skipped` | Toast تحذير | تم تخطي {count} طلبات ما لها شحنات |
| `orders.risk.firstOrder` | شارة | أول طلب لهذا العميل |
| `orders.risk.highValue` | شارة | مبلغ أعلى من معدل متجرك |
| `orders.risk.codReturns` | شارة | العميل له {count} مرتجعات سابقة |

---

## 9. الشحن (shipments)

| المفتاح | النوع | النص |
|---|---|---|
| `shipments.create.success` | Toast نجاح | تم إنشاء الشحنة. رقم التتبع: {tracking} |
| `shipments.create.failed` | Toast خطأ | ما قدرنا ننشئ الشحنة مع {carrier}: {reason} |
| `shipments.rates.loading` | نص | نجيب أسعار الشحن… |
| `shipments.rates.failed` | خطأ | ما قدرنا نجيب الأسعار من شركات الشحن. استخدمنا السعر الاحتياطي من إعداداتك |
| `shipments.label.printing` | Toast | نجهز البوليصة… |
| `shipments.pickup.requested` | Toast نجاح | تم طلب الاستلام. المندوب يجيك {date} |
| `shipments.cancel.title` | نافذة تأكيد | إلغاء الشحنة {tracking}؟ |
| `shipments.cancel.body` | نص | بتنلغي البوليصة ويرجع الطلب لحالة «قيد التجهيز» |
| `shipments.cancel.success` | Toast | تم إلغاء الشحنة |
| `shipments.cancel.pickedUp` | خطأ | المندوب استلم الشحنة. ما يمكن إلغاؤها الحين |
| `shipments.customerNotified` | Toast | أرسلنا تحديث الشحنة للعميل |
| `shipments.delayed.banner` | Banner تحذير | {count} شحنات متأخرة أكثر من 3 أيام |

---

## 10. المرتجعات (returns)

| المفتاح | النوع | النص |
|---|---|---|
| `returns.approve.title` | نافذة | قبول طلب الإرجاع؟ |
| `returns.approve.success` | Toast نجاح | تم قبول الإرجاع وأرسلنا التعليمات للعميل |
| `returns.reject.title` | نافذة | رفض طلب الإرجاع |
| `returns.reject.reasonRequired` | خطأ حقل | اكتب سبب الرفض. بيوصل للعميل |
| `returns.reject.success` | Toast | تم رفض الطلب وإعلام العميل |
| `returns.received.success` | Toast نجاح | تم تأكيد استلام المرتجع |
| `returns.restocked` | Toast | رجّعنا {count} منتجات للمخزون |
| `returns.creditNote.issued` | Toast | تم إصدار إشعار دائن {number} |
| `returns.outOfPolicy` | تحذير | الطلب خارج مدة سياسة الإرجاع ({days} يوم) |

---

## 11. المنتجات والمخزون والاستيراد (products, inventory, imports)

| المفتاح | النوع | النص |
|---|---|---|
| `products.created` | Toast نجاح | تمت إضافة «{name}» — عرض في المتجر |
| `products.saved` | Toast نجاح | تم حفظ «{name}» |
| `products.published` | Toast نجاح | «{name}» صار ظاهراً في متجرك |
| `products.draftWarning` | Banner | هذا المنتج مسودة وما يظهر للعملاء |
| `products.archive.success` | Toast + تراجع | تمت أرشفة «{name}» |
| `products.delete.title` | نافذة تأكيد | حذف «{name}» نهائياً؟ |
| `products.delete.body` | نص | الطلبات السابقة تبقى كما هي. إذا تبي تخفيه فقط استخدم الأرشفة |
| `products.delete.hasOrders` | تلميح | للمنتج {count} طلبات سابقة. ننصح بالأرشفة بدل الحذف |
| `products.delete.cta` | زر أحمر | حذف نهائياً |
| `products.delete.success` | Toast | تم حذف المنتج |
| `products.duplicate.success` | Toast | تم إنشاء نسخة: «{name} (نسخة)» |
| `products.ai.generating` | نص | نكتب الوصف… |
| `products.ai.done` | Toast | كتبنا الوصف. راجعه وعدّل اللي تبي |
| `products.ai.failed` | Toast خطأ | ما قدرنا نكتب الوصف الحين. حاول بعد شوي |
| `products.variants.generated` | Toast | أنشأنا {count} تركيبة من الخيارات |
| `products.variants.tooMany` | تحذير | التركيبات تجاوزت 100. قلّل الخيارات |
| `products.media.uploadFailed` | خطأ | ما انرفعت {count} صور. اضغط لإعادة المحاولة |
| `products.media.removeMain` | تلميح | الصورة الأولى هي الرئيسية. اسحب صورة ثانية مكانها |
| `products.bulk.price.title` | نافذة | تعديل أسعار {count} منتجات |
| `products.bulk.price.preview` | نص | مثال: «{name}» من {from} إلى {to} |
| `inventory.adjusted` | Toast نجاح | تم تحديث مخزون «{name}» إلى {qty} |
| `inventory.reasonRequired` | خطأ حقل | اختر سبب التعديل |
| `inventory.negative` | خطأ | الكمية ما تنزل تحت الصفر. المحجوز حالياً {reserved} |
| `inventory.low.toast` | Toast معلومة | «{name}» باقي منه {qty} فقط |
| `imports.started` | Toast | بدأ الاستيراد. تقدر تكمل شغلك وبنعلمك لما يخلص |
| `imports.done` | إشعار | اكتمل الاستيراد: {success} نجح، {failed} فشل |
| `imports.errors.download` | زر | تنزيل ملف الأخطاء |
| `imports.mapping.missing` | خطأ | لازم تربط عمود «{field}» |
| `imports.preview.errors` | تنبيه | فيه {count} صفوف فيها أخطاء وبيتم تخطيها |
| `reviews.approved` | Toast نجاح | نُشر التقييم في المتجر |
| `reviews.hidden` | Toast نجاح | تم إخفاء التقييم من المتجر |
| `reviews.replySaved` | Toast نجاح | ردك صار ظاهر تحت التقييم |
| `reviews.replyRequired` | خطأ حقل | اكتب الرد أولاً |
| `reviews.submitFailed` | Toast خطأ | تعذر الحفظ — حاول مرة أخرى |

---

## 12. العملاء والتسويق (customers, coupons, carts)

| المفتاح | النوع | النص |
|---|---|---|
| `customers.created` | Toast | تمت إضافة العميل {name} |
| `customers.export.title` | نافذة تأكيد | تصدير بيانات العملاء؟ |
| `customers.export.body` | نص | الملف فيه بيانات شخصية. احفظه بمكان آمن ولا تشاركه. العملية تنسجل في سجل العمليات |
| `customers.deleteData.title` | نافذة تأكيد قوية | حذف بيانات {name}؟ |
| `customers.deleteData.body` | نص | بنحذف بياناته الشخصية نهائياً. الطلبات والفواتير تبقى بدون بياناته الشخصية حسب الأنظمة. اكتب «حذف» للتأكيد |
| `customers.deleteData.success` | Toast | تم حذف بيانات العميل |
| `coupons.created` | Toast نجاح | تم إنشاء الكوبون {code} |
| `coupons.preview` | نص | خصم {value} {scope} {condition} |
| `coupons.disable.success` | Toast + تراجع | تم إيقاف الكوبون {code} |
| `coupons.delete.used` | تلميح | الكوبون استُخدم {count} مرة. الأفضل توقفه بدل ما تحذفه |
| `carts.recovery.enabled` | Toast | تم تفعيل استرجاع السلات المتروكة. الوكيل بيتواصل مع العملاء بعد {delay} |
| `carts.recovery.sent` | Toast | أرسلنا رسالة تذكير لـ {name} |
| `carts.recovery.noConsent` | تلميح | العميل ما وافق على الرسائل التسويقية |

---

## 13. المحادثات والموافقات (inbox, approvals)

| المفتاح | النوع | النص |
|---|---|---|
| `inbox.takeover.success` | نص نظام | {staff} استلم المحادثة من الوكيل |
| `inbox.takeover.confirm` | تلميح | الوكيل بيتوقف عن الرد في هذي المحادثة لين ترجعها له |
| `inbox.returnToAgent.success` | نص نظام | رجعت المحادثة للوكيل {agent} |
| `inbox.assigned` | Toast | تم إسناد المحادثة لـ {staff} |
| `inbox.resolved` | Toast + تراجع | تم إغلاق المحادثة |
| `inbox.waiting.badge` | شارة | ينتظر موظف منذ {time} |
| `inbox.window.closed` | Banner | مرّت 24 ساعة على آخر رسالة من العميل. تقدر ترسل قالب معتمد فقط |
| `inbox.message.failed` | خطأ على الرسالة | ما انرسلت. اضغط لإعادة الإرسال |
| `inbox.suggestion.loading` | نص | نجهز رد مقترح… |
| `inbox.note.placeholder` | نص حقل | ملاحظة داخلية (ما يشوفها العميل) |
| `inbox.handoff.event` | نص نظام | حُوّلت المحادثة من {from} إلى {to}: {reason} |
| `approvals.new.toast` | Toast معلومة | {agent} يطلب موافقتك على {action} بقيمة {amount} |
| `approvals.approve.success` | Toast | تمت الموافقة. الوكيل بيكمل مع العميل |
| `approvals.reject.reason` | حقل | سبب الرفض (بيوصل للوكيل عشان يوضح للعميل) |
| `approvals.reject.success` | Toast | تم الرفض |
| `approvals.expired` | شارة | انتهت مهلة الموافقة وتحولت المحادثة لموظف |

---

## 14. الوكلاء والمعرفة (agents, knowledge)

| المفتاح | النوع | النص |
|---|---|---|
| `agents.created` | Toast | تم إنشاء الوكيل «{name}» كمسودة |
| `agents.saved` | Toast | تم حفظ المسودة. انشرها عشان تطبق على العملاء |
| `agents.publish.title` | نافذة تأكيد | تنشر التغييرات على «{name}»؟ |
| `agents.publish.body` | نص | التغييرات بتطبق على كل المحادثات والمكالمات الجديدة فوراً |
| `agents.publish.warnings` | تحذير | فيه {count} ملاحظات على الإعداد. تبي تنشر رغم كذا؟ |
| `agents.published` | Toast نجاح | تم نشر الإصدار {version} من «{name}» |
| `agents.pause.title` | نافذة | إيقاف «{name}»؟ |
| `agents.pause.body.root` | نص | هذا الوكيل الرئيسي. إيقافه يحوّل كل المحادثات الجديدة للموظفين |
| `agents.pause.body.child` | نص | المحادثات اللي كانت بتتحول له بتبقى عند {parent} |
| `agents.delete.title` | نافذة | حذف «{name}»؟ |
| `agents.delete.children` | خيار | تحته {count} وكلاء. وش تبي يصير لهم؟ — انقلهم لـ {parent} / احذفهم معه |
| `agents.delete.success` | Toast | تم حذف الوكيل |
| `agents.move.cycle` | خطأ | ما يمكن نقل الوكيل تحت أحد الوكلاء التابعين له |
| `agents.move.success` | Toast + تراجع | نقلنا «{name}» تحت «{parent}» |
| `agents.rollback.title` | نافذة تأكيد | ترجع للإصدار {version}؟ |
| `agents.rollback.success` | Toast | رجعنا للإصدار {version} ونشرناه |
| `agents.inherited` | تلميح | موروث من «{parent}» |
| `agents.customize` | زر | تخصيص |
| `agents.resetInherit` | زر | رجوع للموروث |
| `agents.warning.noDescription` | تحذير | أضف وصفاً عشان الوكيل الأب يعرف متى يحوّل له |
| `agents.warning.pausedTarget` | تحذير | قاعدة التحويل «{rule}» تحوّل لوكيل موقوف |
| `agents.warning.noNumber` | تحذير | الوكيل الصوتي ما له رقم هاتف |
| `agents.warning.recordingDisclosure` | تحذير | التسجيل مفعّل، أضف تنبيه للعميل في رسالة الترحيب |
| `agents.warning.refundNoApproval` | تحذير | أداة الاسترداد مفعّلة بدون موافقة موظف |
| `agents.test.reset` | Toast | بدأنا محادثة اختبار جديدة |
| `agents.test.saved` | Toast | انحفظ كاختبار |
| `agents.test.results` | نص | نجح {passed} من {total} |
| `agents.live.takeover` | Toast | استلمت المكالمة. العميل يسمعك الحين |
| `knowledge.uploaded` | Toast | رفعنا «{title}». نعالجه الحين… |
| `knowledge.ready` | Toast نجاح | «{title}» جاهز والوكلاء يقدرون يستخدمونه |
| `knowledge.failed` | Toast خطأ | ما قدرنا نقرأ «{title}». تأكد إن الملف نصي وما هو صورة ممسوحة |
| `knowledge.delete.used` | نافذة | يستخدمه {count} وكلاء. حذفه بيأثر على إجاباتهم |

---

## 15. الفواتير والضرائب (invoices, taxes)

| المفتاح | النوع | النص |
|---|---|---|
| `invoices.issued` | Toast | تم إصدار الفاتورة {number} |
| `invoices.zatca.rejected` | Toast خطأ + Banner | رفضت هيئة الزكاة الفاتورة {number}: {reason} |
| `invoices.zatca.resent` | Toast | أعدنا إرسال الفاتورة |
| `invoices.immutable` | تلميح | الفاتورة بعد إصدارها ما تتعدل. للتصحيح أصدر إشعار دائن |
| `taxes.zatca.connected` | Toast نجاح | تم الربط مع منصة فاتورة ✓ |
| `taxes.zatca.failed` | خطأ | ما نجح الربط: {reason} |
| `taxes.notRegistered.info` | تنبيه | فواتيرك بتصدر بدون ضريبة. إذا تجاوزت إيراداتك حد التسجيل لازم تسجل في الضريبة |
| `taxes.pricesIncludeTax.change` | نافذة تأكيد | تغيير طريقة احتساب الضريبة بيأثر على أسعار كل المنتجات المعروضة. نكمل؟ |

---

## 16. المتجر والتصميم والدومينات (storefront)

| المفتاح | النوع | النص |
|---|---|---|
| `editor.draftSaved` | نص صغير | المسودة محفوظة |
| `editor.publish.title` | نافذة تأكيد | تنشر التصميم الجديد؟ |
| `editor.publish.body` | نص | عملاؤك بيشوفون التغييرات فوراً. تقدر ترجع لأي نسخة سابقة |
| `editor.published` | Toast نجاح | تم نشر التصميم — عرض المتجر |
| `editor.section.removed` | Toast + تراجع | تم حذف قسم «{section}» |
| `editor.version.restored` | Toast | رجعنا لنسخة {date} (كمسودة) |
| `themes.apply.title` | نافذة تأكيد | تطبق ثيم «{theme}»؟ |
| `themes.apply.body` | نص | الأقسام والإعدادات الحالية بتنحفظ كنسخة، وتقدر ترجع لها |
| `pages.published` | Toast | الصفحة «{title}» صارت منشورة |
| `menus.saved` | Toast | تم حفظ القائمة |
| `domains.added` | Toast | أضفنا {domain}. أضف السجلات التالية عند مزود الدومين |
| `domains.verifying` | نص | نتحقق من الإعدادات… قد ياخذ حتى 24 ساعة |
| `domains.verified` | Toast نجاح + إشعار | {domain} مربوط ✓ وشهادة الأمان مفعلة |
| `domains.failed` | خطأ | ما لقينا السجلات المطلوبة على {domain}. تأكد منها وأعد التحقق |
| `domains.primary.title` | نافذة تأكيد | تخلي {domain} الدومين الرئيسي؟ |
| `domains.primary.body` | نص | الروابط القديمة بتتحول تلقائياً للدومين الجديد |
| `seo.redirect.added` | Toast | أضفنا التحويل |

---

## 17. التطبيقات والمطورين (apps, developers)

| المفتاح | النوع | النص |
|---|---|---|
| `apps.consent.title` | نافذة | «{app}» يطلب الوصول لمتجرك |
| `apps.consent.body` | نص | بيقدر التطبيق: |
| `apps.consent.cta` | زر | ثبّت ووافق |
| `apps.installed` | Toast نجاح | تم تثبيت «{app}» |
| `apps.newScopes` | Banner | «{app}» يطلب صلاحيات جديدة. راجعها عشان تستمر الميزات الجديدة |
| `apps.uninstall.title` | نافذة تأكيد | إلغاء تثبيت «{app}»؟ |
| `apps.uninstall.body` | نص | بيتوقف وصوله لمتجرك فوراً، وأي أقسام أضافها للمتجر بتنشال |
| `apps.uninstalled` | Toast | تم إلغاء تثبيت «{app}» |
| `apps.suspended` | Banner | أوقفت المنصة تطبيق «{app}» مؤقتاً لأسباب أمنية |
| `developers.apiKey.created.title` | نافذة | انسخ المفتاح الحين |
| `developers.apiKey.created.body` | نص | لأمانك ما بنعرضه مرة ثانية |
| `developers.apiKey.revoke.title` | نافذة تأكيد | إلغاء المفتاح «{name}»؟ |
| `developers.apiKey.revoke.body` | نص | أي نظام يستخدمه بيتوقف فوراً |
| `developers.webhook.created` | Toast | أضفنا الـ webhook. السر يظهر مرة وحدة: انسخه |
| `developers.webhook.test.sent` | Toast | أرسلنا حدث تجريبي. الرد: {status} |
| `developers.webhook.disabled` | Banner خطأ | أوقفنا الـ webhook بعد فشل متكرر. صلح الرابط وفعّله |
| `developers.webhook.resent` | Toast | أعدنا الإرسال |

---

## 18. الإعدادات والموظفين والفوترة (settings)

| المفتاح | النوع | النص |
|---|---|---|
| `staff.invited` | Toast نجاح | أرسلنا الدعوة إلى {email} |
| `staff.invite.resent` | Toast | أعدنا إرسال الدعوة |
| `staff.role.changed` | Toast | صار دور {name}: {role} |
| `staff.suspend.title` | نافذة تأكيد | إيقاف {name}؟ |
| `staff.suspend.body` | نص | بيطلع من كل الأجهزة فوراً وما يقدر يدخل لين تعيد تفعيله |
| `staff.remove.title` | نافذة تأكيد | إزالة {name} من المتجر؟ |
| `staff.owner.cannotRemove` | تلميح | ما يمكن إزالة مالك المتجر. انقل الملكية أولاً |
| `staff.transferOwnership.title` | نافذة تأكيد قوية | نقل ملكية المتجر لـ {name}؟ |
| `staff.transferOwnership.body` | نص | بيصير هو المالك وأنت مدير. يحتاج تأكيد برمز منك ومنه |
| `roles.saved` | Toast | تم حفظ دور «{name}» ({count} صلاحية) |
| `roles.summary` | نص | هذا الدور يقدر: {summary} |
| `roles.delete.inUse` | خطأ | الدور مستخدم من {count} موظفين. غيّر أدوارهم أولاً |
| `roles.system.locked` | تلميح | أدوار النظام ما تنحذف. انسخها وعدّل النسخة |
| `notifications.template.saved` | Toast | تم حفظ القالب |
| `notifications.template.submitted` | Toast | أرسلنا القالب لـ WhatsApp للاعتماد (عادة خلال ساعات) |
| `notifications.template.rejected` | Banner | رفضت WhatsApp القالب «{name}»: {reason} |
| `channels.whatsapp.connected` | Toast نجاح | تم ربط {phone} ✓ |
| `channels.whatsapp.disconnect.title` | نافذة تأكيد | فصل رقم {phone}؟ |
| `channels.whatsapp.disconnect.body` | نص | الوكيل بيتوقف عن الرد على هذا الرقم |
| `billing.upgraded` | Toast نجاح | تمت الترقية إلى {plan} 🎉 |
| `billing.trial.banner` | Banner | تجربتك المجانية تنتهي بعد {days} أيام — اختر باقتك |
| `billing.pastDue.banner` | Banner خطأ | ما نجح تجديد اشتراكك. حدّث طريقة الدفع قبل {date} عشان ما يتوقف متجرك |
| `billing.cancel.title` | نافذة تأكيد | إلغاء الاشتراك؟ |
| `billing.cancel.body` | نص | تقدر تستخدم المتجر لين {date}، بعدها يتحول للباقة المجانية |
| `danger.pause.title` | نافذة تأكيد | إيقاف المتجر مؤقتاً؟ |
| `danger.pause.body` | نص | العملاء بيشوفون رسالة «المتجر غير متاح» والوكلاء بيتوقفون |
| `danger.delete.title` | نافذة تأكيد قوية | حذف المتجر نهائياً؟ |
| `danger.delete.body` | نص | بنحذف كل المنتجات والطلبات والعملاء والمحادثات بعد 30 يوماً. اكتب اسم المتجر «{store}» ثم أدخل رمز التحقق |
| `danger.delete.scheduled` | Banner | المتجر مجدول للحذف في {date} — إلغاء الحذف |
| `audit.exported` | Toast | تم تصدير السجل |

---

## 19. المتجر (واجهة العميل) — storefront

| المفتاح | النوع | النص |
|---|---|---|
| `store.cart.added` | Toast + سلة جانبية | انضاف للسلة — عرض السلة |
| `store.cart.updated` | — | (بدون رسالة، التحديث مرئي) |
| `store.cart.removed` | Toast + تراجع | انشال «{name}» من السلة |
| `store.cart.maxQty` | تلميح | المتوفر {qty} فقط |
| `store.cart.priceChanged` | تنبيه | تغيّر سعر «{name}» من {from} إلى {to} |
| `store.cart.outOfStock` | تنبيه | «{name}» نفذ. شلناه من سلتك |
| `store.cart.freeShipping` | شريط | باقي {amount} وتحصل شحن مجاني |
| `store.cart.freeShipping.reached` | شريط | مبروك! طلبك عليه شحن مجاني |
| `store.coupon.applied` | نجاح حقل | تم تطبيق {code}: وفّرت {amount} |
| `store.coupon.invalid` | خطأ حقل | الكوبون غير صحيح |
| `store.coupon.expired` | خطأ حقل | انتهت صلاحية الكوبون |
| `store.coupon.minOrder` | خطأ حقل | الكوبون يحتاج طلب بقيمة {amount} أو أكثر |
| `store.coupon.notApplicable` | خطأ حقل | الكوبون ما ينطبق على المنتجات في سلتك |
| `store.coupon.usedUp` | خطأ حقل | استخدمت هذا الكوبون قبل |
| `store.checkout.shipping.unavailable` | خطأ | ما نوصّل لمدينة {city} حالياً |
| `store.checkout.paying` | زر | جاري الدفع… |
| `store.checkout.payment.declined` | خطأ | البنك رفض العملية. تأكد من الرصيد أو جرّب بطاقة ثانية |
| `store.checkout.payment.3dsFailed` | خطأ | ما اكتمل التحقق من البنك. حاول مرة ثانية |
| `store.checkout.payment.failed` | خطأ | ما اكتمل الدفع وما انخصم شيء. سلتك محفوظة |
| `store.checkout.cod.fee` | تلميح | رسوم الدفع عند الاستلام {amount} |
| `store.checkout.terms` | checkbox | أوافق على الشروط وسياسة الاسترجاع |
| `store.order.thanks` | عنوان | شكراً لك! استلمنا طلبك #{number} |
| `store.order.whatsappSent` | نص | أرسلنا التفاصيل على WhatsApp |
| `store.notifyMe.success` | Toast | بنرسل لك رسالة أول ما يتوفر |
| `store.return.submitted` | نجاح | استلمنا طلب الإرجاع وبنرد عليك خلال يومين عمل |
| `store.account.deleted` | نجاح | تم حذف حسابك |
| `store.chat.greeting` | الوكيل | (من إعداد الوكيل) |
| `store.chat.offline` | الوكيل | (من afterHoursMessage) |
| `store.chat.error` | خطأ | ما قدرنا نوصل للمساعد. تقدر تكلمنا على WhatsApp |

---

## 20. لوحة مالك المنصة وبوابة المطورين

| المفتاح | النوع | النص |
|---|---|---|
| `admin.store.suspend.title` | نافذة تأكيد | تعليق متجر «{store}»؟ |
| `admin.store.suspend.body` | نص | المتجر والوكلاء بيتوقفون، والمالك بيشوف السبب. اكتب السبب |
| `admin.store.suspended` | Toast | تم تعليق المتجر |
| `admin.support.start.title` | نافذة | دخول دعم على «{store}» |
| `admin.support.start.body` | نص | كل إجراء بيتسجل ويشوفه التاجر في سجل عملياته |
| `admin.support.banner` | Banner أحمر | وضع الدعم — {store} — السبب: {reason} — ينتهي خلال {time} |
| `admin.support.ended` | Toast | انتهت جلسة الدعم |
| `admin.plan.applyExisting` | نافذة تأكيد | تطبق التغييرات على {count} مشترك حالي؟ |
| `admin.provider.failover.title` | نافذة تأكيد | تحويل {type} إلى {provider}؟ |
| `admin.provider.failover.done` | Toast | تم التحويل. كل الطلبات الجديدة تمر عبر {provider} |
| `admin.flag.kill.title` | نافذة تأكيد | إيقاف طارئ لـ «{flag}»؟ |
| `admin.jobs.retried` | Toast | أعدنا تشغيل {count} مهام |
| `admin.app.approved` | Toast | تم اعتماد «{app}» ونشره |
| `admin.app.rejected` | Toast | تم رفض «{app}» وإرسال الملاحظات للمطور |
| `admin.app.suspend.title` | نافذة تأكيد قوية | إيقاف «{app}» على كل المتاجر؟ |
| `admin.app.suspend.body` | نص | بيتم إلغاء وصوله لـ {count} متجر فوراً، وبنعلم التجار والمطور |
| `partners.app.created` | Toast | تم إنشاء «{app}». ابدأ بتجربته في متجر تجريبي |
| `partners.secret.rotate.title` | نافذة تأكيد | تدوير السر؟ |
| `partners.secret.rotate.body` | نص | السر القديم يشتغل 24 ساعة بعدها يتوقف. حدّث تطبيقك قبلها |
| `partners.review.submitted` | Toast | أرسلنا التطبيق للمراجعة. المدة المتوقعة 3–5 أيام عمل |
| `partners.review.changes` | Banner | المراجع طلب تعديلات على {count} بنود |
| `partners.review.approved` | إشعار | 🎉 تم اعتماد «{app}» وصار في متجر التطبيقات |
| `partners.testStore.created` | Toast | جهزنا متجر تجريبي ببيانات كاملة |

---

## 21. الحالات الفاضية (empty)

| المفتاح | العنوان | النص | الزر |
|---|---|---|---|
| `empty.orders` | ما فيه طلبات للحين | أول طلب بيظهر هنا. شارك رابط متجرك عشان تبدأ | نسخ رابط المتجر |
| `empty.orders.filtered` | ما فيه طلبات تطابق الفلتر | جرّب تغيّر الفلاتر | مسح الفلاتر |
| `empty.products` | أضف أول منتج | ارفع صور منتجاتك والمساعد يكمل الباقي | إضافة منتج |
| `empty.customers` | ما فيه عملاء للحين | العملاء ينضافون تلقائياً مع أول طلب أو محادثة | — |
| `empty.inbox` | ما فيه محادثات | لما يراسلك عميل على WhatsApp أو المتجر بتظهر هنا | ربط WhatsApp |
| `empty.inbox.waiting` | ما أحد ينتظرك 👌 | الوكيل ماسك كل المحادثات | — |
| `empty.approvals` | ما فيه طلبات موافقة | — | — |
| `empty.returns` | ما فيه مرتجعات | — | — |
| `empty.carts` | ما فيه سلات متروكة | — | — |
| `empty.shipments` | ما فيه شحنات | الشحنات تظهر هنا لما تشحن طلب | — |
| `empty.coupons` | ما عندك كوبونات | الكوبونات تزيد مبيعاتك في المواسم | إنشاء كوبون |
| `empty.knowledge` | علّم وكيلك عن متجرك | ارفع سياساتك والأسئلة المتكررة عشان يجاوب صح | إضافة مصدر |
| `empty.agents.history` | ما فيه مكالمات أو محادثات للحين | — | اختبر الوكيل |
| `empty.agents.live` | ما فيه مكالمات جارية الحين | — | — |
| `empty.apps` | ما ثبّتت أي تطبيق | وسّع متجرك بتطبيقات معتمدة | تصفح التطبيقات |
| `empty.invoices` | ما فيه فواتير | الفواتير تصدر تلقائياً مع كل طلب مدفوع | — |
| `empty.search` | ما لقينا نتائج لـ «{query}» | جرّب كلمة ثانية | — |
| `empty.notifications` | ما عندك إشعارات جديدة | — | — |
| `empty.reports` | ما فيه بيانات كافية | التقارير تظهر بعد أول طلبات | — |

---

## 22. أخطاء الصفحات (errors)

| المفتاح | العنوان | النص | الأزرار |
|---|---|---|---|
| `errors.load` | ما قدرنا نحمّل البيانات | تأكد من الاتصال وحاول مرة ثانية | إعادة المحاولة |
| `errors.404` | الصفحة غير موجودة | يمكن الرابط غير صحيح أو انحذفت | الرئيسية |
| `errors.403` | ما عندك صلاحية لهذي الصفحة | تواصل مع مالك المتجر إذا تحتاجها | الرئيسية |
| `errors.500` | صار خلل من جهتنا | فريقنا يشتغل عليه. جرّب بعد دقائق | إعادة المحاولة · حالة الخدمة |
| `errors.maintenance` | صيانة مجدولة | نرجع خلال {time} | — |
| `errors.storeSuspended` | متجرك موقوف | {reason}. تواصل مع الدعم | تواصل مع الدعم |

---

## 23. قواعد تنفيذ لـ Devin

1. كل النصوص من `ar.json` / `en.json` بنفس المفاتيح هنا. ممنوع نص مكتوب مباشرة في المكونات.
2. مكونات موحدة: `toast.success(key, params)` · `toast.error(key, params, { retry })` · `<ConfirmDialog titleKey bodyKey confirmKey danger requireText? requireOtp? />` · `<EmptyState key action />` · `<PageError key onRetry />` · `<Banner key variant />`.
3. رسائل التحقق تربط مع zod عبر `errorMap` واحد يرجع المفتاح المناسب.
4. أخطاء الـ API ترجع `code`، ويتحول لمفتاح رسالة عبر خريطة واحدة (`api-error-map.ts`). أي `code` غير معروف = `common.server.error`.
5. أضف صفحة `/dev/messages` (بيئة التطوير فقط) تعرض كل الـ Toasts والنوافذ والحالات الفاضية للمراجعة.

---

## 24. نظام الثيمات والمحرر (msg.*)
> مفاتيح مساحة `msg` في `packages/ui/src/messages` — تُقرأ عبر `useMsg()`/`useMsgToast()`. مسرودة مجمعة حسب العائلة؛ المرجع الكامل هو `ar.json`.

### 24.1 المحرر — `msg.editor.*`
| العائلة | المفاتيح | النص العربي (أمثلة) |
|---|---|---|
| الحالة والنشر | `draftSaved`, `publish.title/body`, `published`, `publishAction`, `scheduled` | «المسودة محفوظة» · «تنشر التصميم الجديد؟» · «تم نشر التصميم — عرض المتجر» · «مجدول للنشر:» |
| الأقسام | `sections`, `addSection`, `library`, `hide`, `show`, `delete`, `reorder`, `emptySections`, `selectSection`, `section.removed` | «الأقسام» · «إضافة قسم» · «مكتبة الأقسام» · «تم حذف قسم «{section}»» |
| البلوكات والحقول | `fields.*` (~80 مفتاحاً — كل حقل إعداد باسمه) · `addItem`, `removeItem`, `moveUp`, `moveDown` | «إعدادات القسم» · «أعلى/أسفل» |
| الجهاز | `device.all/mobile/tablet/desktop`, `deviceHint`, `noDeviceFields` | «كل الأجهزة · جوال · تابلت · كمبيوتر» · «تُحفظ التعديلات هنا كتجاوزات لهذا الجهاز فقط» |
| المعاينة | `preview`, `pickEntity`, `noEntities`, `openPreview`, `persona.{label,guest,customer,with-cart}` | «معاينة» · «معاينة كـ: عميل جديد / عميل مسجل / سلة فيها منتجات» |
| القوالب | `template.{home,product,category,cart,page,add,name,create,deleteTitle,deleteBody}` | «الرئيسية · صفحة المنتج · إضافة قالب · حذف القالب؟» |
| أنظمة الألوان والأنماط | `schemes`, `addScheme`, `removeScheme`, `colorScheme`, `preset`, `applyPreset`, `presetApplied` | «أنظمة الألوان» · «نمط جاهز» · «تم تطبيق النمط «{preset}»» |
| المشاركة | `share.{button,title,hint,create,copy,copied,revoke,expires,expired,empty}` | «مشاركة المعاينة» · «الرابط يفتح المسودة للمعاينة بدون دخول — صالح 7 أيام» · «انحفظ رابط المعاينة بالحافظة» |
| الذكاء الاصطناعي | `ai.{button,title,logo,brief,briefHint,tone,audience,generate,generating,results,back,apply,applied,tones.*,audiences.*}`, `aiWrite` | «صمم لي بالـ AI» · «3 اقتراحات — عاينها وطبّق اللي يعجبك» · «اكتب لي النص» |
| الجودة | `quality.{title,score,fast,medium,slow,clean,issues.{heavy-image,low-contrast,missing-en,missing-alt,empty-section,broken-link,button-no-url}}` | «الجودة» · «مؤشر الأداء» · «ما فيه ملاحظات — التصميم سليم» + نص كل تنبيه |
| الجدولة | `schedule`, `scheduleAt`, `scheduleSave`, `scheduleSaved`, `scheduleClear`, `scheduleCleared` | «جدولة النشر» · «تمت جدولة النشر — {date}» |
| النسخ والحافظة | `version.restored`, `versions`, `restore`, `noVersions`, `undo`, `redo`, `clipboard.{copy,cut,duplicate,paste,copied,cutToast,pasted}` | «النسخ السابقة» · «رجعنا لنسخة {date} (كمسودة)» · «نسخ/قص/لصق القسم» |

### 24.2 مسميات الأقسام والبلوكات — `msg.sectionType.*` / `msg.blockType.*`
| العائلة | العدد | المحتوى |
|---|---|---|
| `sectionType.<type>` | 22 | اسم كل قسم في مكتبة الأقسام — القائمة الكاملة في SCREENS_SPEC §5.22.1 (`header` الهيدر … `recently-viewed` شاهدت مؤخراً) |
| `blockType.<type>` | 24 | اسم كل بلوك: `heading` عنوان · `button` زر · `buy-button` أزرار الشراء · `variant-picker` اختيار الخيارات · `hotspot` نقطة منتج … |

### 24.3 مميزات المتجر — `msg.features.*`
| المفتاح | النص | | المفتاح | النص |
|---|---|---|---|---|
| `title` | مميزات المتجر | | `scarcity` | مؤشرات الندرة |
| `wishlist` | المفضلة | | `viewersNow` | عداد «يشاهده الآن» |
| `compare` | مقارنة المنتجات | | `deliveryEstimate` | تقدير التوصيل حسب المدينة |
| `reviews` | تقييمات المنتجات | | `sizeGuide` | دليل المقاسات |
| `quickView` | العرض السريع | | `backInStock` | أعلمني عند التوفر |
| `quickFilters` | الفلاتر المتقدمة | | `installments` | عرض التقسيط (تابي/تمارا) |
| `recentlyViewed` | شاهدت مؤخراً | | `share` | مشاركة المنتج |
| `stickyBuyBar` | شريط الشراء الثابت (جوال) | | `backToTop` | زر العودة للأعلى |
| `scarcityThreshold` | حد الندرة — أظهر «باقي X» عند مخزون أقل من | | | |

### 24.4 الوسائط — `msg.media.*`
| المفتاح | النص |
|---|---|
| `library`, `selectImage`, `upload`, `uploading` | مكتبة الصور · اختيار من المكتبة · رفع صورة · جاري الرفع… |
| `crop`, `zoom`, `rotate`, `apply`, `remove` | قص · تكبير · تدوير · تطبيق · إزالة |
| `aspect.{free,square,wide,classic}` | حر · 1:1 · 16:9 · 4:3 |
| `altText`, `empty`, `compressed` | النص البديل · «ما فيه صور في المكتبة بعد — ارفع أول صورة» · تم ضغط الصورة |

### 24.5 التقييمات — `msg.reviews.*`
| المفتاح | النوع | النص |
|---|---|---|
| `reviews.approved` | Toast نجاح | نُشر التقييم في المتجر |
| `reviews.hidden` | Toast نجاح | تم إخفاء التقييم من المتجر |
| `reviews.replySaved` | Toast نجاح | ردك صار ظاهر تحت التقييم |
| `reviews.replyRequired` | خطأ حقل | اكتب الرد أولاً |
| `reviews.submitFailed` | Toast خطأ | تعذر الحفظ — حاول مرة أخرى |
## 25. المساعد الذكي — `msg.copilot.*`

### 25.1 النواة (موجودة منذ المرحلة الأولى)
| العائلة | المفاتيح |
|---|---|
| الهوية | `title`, `poweredBy`, `open`, `you`, `thinking`, `error` |
| المؤلف | `placeholder`, `send`, `listen`, `listening`, `micUnavailable`, `refs.*` |
| البطاقات | `execute`, `edit`, `editHint`, `cancel`, `done`, `affected`, `items`, `before`, `after`, `dangerTitle`, `typeToConfirm` |
| الخطط | `runAll`, `runStep`, `stepDone`, `stepFailed`, `planSummary`, `planSummaryFailed` |
| نتائج/تراجع | `undo`, `undoDone`, `undoUnavailable`, `export` |
| الجداول والمحادثات | `showAll`, `showLess`, `clarifyTitle`, `newChat`, `conversations`, `history`, `historySoon`, `contextYou`, `selectedItems` |
| شريط الأمان | `securityBar` (`يعمل بصلاحيات: {user} ({role}) — {store}`) · `securityBarPlatform` (`يعمل بصلاحيات: مالك المنصة — المنصة`) · `platformOwner` |

### 25.2 المهام — `msg.copilot.tasks.*`
| المفتاح | النص |
|---|---|
| `title`, `subtitle` | مهام المساعد · مهام مجدولة وتنبيهات ينفّذها المساعد تلقائياً |
| `new`, `edit`, `save`, `newScheduled`, `newAlert` | مهمة جديدة · تعديل المهمة · حفظ المهمة · مهمة مجدولة · تنبيه جديد |
| `kind.scheduled`, `kind.alert` | مجدولة · تنبيه |
| `colTitle`, `colKind`, `colSchedule`, `colEnabled`, `colLastRun`, `colActions` | رؤوس الجدول |
| `neverRun`, `runNow`, `delete` | لم تُشغّل بعد · شغّل الآن · حذف |
| `deleteTitle`, `deleteBody` | تأكيد حذف المهمة (ConfirmDialog خطر) |
| `saved`, `deleted`, `runResult` | Toast نجاح · Toast نجاح · Toast معلومات بنتيجة التشغيل (`{result}`) |
| `formTitle`, `formPrompt`, `formHour`, `formMinute`, `formThreshold`, `formEnabled` | حقول حوار الإنشاء/التعديل |

### 25.3 السجل — `msg.copilot.historyPage.*` + `msg.copilot.shared*`
| المفتاح | النص |
|---|---|
| `title`, `subtitle`, `search` | سجل محادثات المساعد · … · ابحث في المحادثات… |
| `colTitle`, `colUpdated`, `colMessages`, `colActions` | رؤوس الجدول |
| `open`, `pin`, `unpin`, `share`, `delete` | إجراءات الصف |
| `deleteTitle`, `deleteBody`, `deleted` | تأكيد حذف المحادثة + Toast |
| `shared`, `sharedBadge`, `shareLink` | نُسخ رابط المشاركة · مشتركة · رابط المشاركة: {link} |
| `sharedHint`, `sharedReadOnly` | تلميح الشريط الجانبي · شريط «للعرض فقط» داخل المحادثة |
| `tasksLink` | رابط «مهام المساعد» في الشريط الجانبي |

### 25.4 الإعدادات — `msg.copilot.settings.*`
| المفتاح | النص |
|---|---|
| `title`, `subtitle`, `confirmTitle` | إعدادات المساعد · تحكّم بما يقدر المساعد ينفّذه · بطاقات التأكيد |
| `confirmWrite`/`confirmDangerous`/`confirmBulk` + `*Hint` | مفاتيح التأكيد الدائم الثلاثة مع وصفها |
| `blockedTitle`, `blockedHint` | أدوات ممنوعة — تُرفض من إعدادات المتجر |
| `languageTitle`, `language`, `dialect`, `langAr`, `langEn`, `dialectGulf`, `dialectFusha` | لغة الردود ولهجتها |
| `save`, `saved` | حفظ الإعدادات · Toast نجاح |

### 25.5 الحالات الفاضية — `msg.empty.copilot.*`
| المفتاح | النص |
|---|---|
| `copilot.tasks.{title,body}` | لا مهام بعد — اطلب من المساعد جدولة مهمة أو تنبيه |
| `copilot.history.{title,body}` | لا محادثات محفوظة — تُحفظ تلقائياً بعد كل رد |
| `copilot.historyFiltered.{title,body}` | لا نتائج — جرّب كلمة بحث مختلفة |
