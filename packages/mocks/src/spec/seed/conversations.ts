import type { SeedConversation, SeedMessage } from "./types";
import { customers, orders } from "./orders";
import { minutesAgo } from "../../data/seed";

type Line = [sender: SeedMessage["sender"], text: string, minutesAgo: number];

function thread(id: string, lines: Line[]): SeedMessage[] {
  return lines.map(([sender, text, m], i) => ({ id: `${id}_m${i + 1}`, sender, text, at: minutesAgo(m) }));
}

function build(
  index: number,
  meta: Omit<SeedConversation, "id" | "customerId" | "customerName" | "lastMessageAt" | "messages" | "orderId"> & {
    withOrder?: boolean;
  },
  lines: Line[],
): SeedConversation {
  const customer = customers[index];
  if (!customer) throw new Error(`Missing mock customer ${index}`);
  const id = `cnv_${String(index + 1).padStart(3, "0")}`;
  const messages = thread(id, lines);
  const { withOrder, ...rest } = meta;
  return {
    id,
    customerId: customer.id,
    customerName: customer.name,
    orderId: withOrder ? (orders.find((o) => o.customerId === customer.id)?.id ?? null) : null,
    lastMessageAt: messages.at(-1)?.at ?? "",
    messages,
    ...rest,
  };
}

export const conversations: SeedConversation[] = [
  build(
    0,
    { channel: "whatsapp", status: "open", handledBy: "agent", unread: 2, intent: "orderStatus", withOrder: true },
    [
      ["customer", "السلام عليكم، متى يوصل طلبي؟", 18],
      ["agent", "وعليكم السلام نورة 🌿 طلبك تم شحنه مع أرامكس ومتوقع يوصلك بكرة قبل الساعة 6 مساءً.", 17],
      ["customer", "ممكن أغيّر العنوان لبيت أهلي؟", 4],
      ["customer", "نفس الحي بس شارع ثاني", 3],
    ],
  ),
  build(
    1,
    { channel: "instagram", status: "open", handledBy: "staff", unread: 1, intent: "complaint", withOrder: true },
    [
      ["customer", "وصلني الطلب والدلة فيها خدش واضح 😕", 52],
      ["agent", "نعتذر لك جداً فهد. حوّلت المحادثة لفريق خدمة العملاء عشان يخدمونك بشكل أسرع.", 51],
      ["staff", "هلا فهد، نعتذر عن ذلك. ممكن ترسل لنا صورة للخدش؟", 40],
      ["customer", "أرسلتها في الخاص", 12],
    ],
  ),
  build(
    2,
    { channel: "webchat", status: "open", handledBy: "agent", unread: 0, intent: "productQuestion" },
    [
      ["customer", "هل عطر مسك الطهارة مناسب للبشرة الحساسة؟", 95],
      ["agent", "أهلاً سارة! العطر خالٍ من الكحول ومناسب لأغلب أنواع البشرة. ننصح بتجربته على منطقة صغيرة أولاً.", 94],
      ["customer", "طيب فيه حجم أصغر؟", 90],
      ["agent", "حالياً متوفر بحجم 50 مل فقط. أقدر أنبهك إذا توفر حجم أصغر؟", 89],
    ],
  ),
  build(
    3,
    { channel: "whatsapp", status: "waiting", handledBy: "agent", unread: 0, intent: "purchase" },
    [
      ["customer", "أبغى 3 علب تمر سكري هدية، فيه تغليف؟", 180],
      ["agent", "أكيد! نوفر تغليف هدايا مجاني مع بطاقة إهداء. أجهز لك السلة وأرسل رابط الدفع؟", 178],
      ["customer", "إيه تمام", 175],
      ["agent", "هذا رابط الدفع: nakhla.sa/c/8F2K — الإجمالي 267.00 ر.س شامل الضريبة والتوصيل مجاني.", 174],
    ],
  ),
  build(
    4,
    { channel: "whatsapp", status: "open", handledBy: "agent", unread: 3, intent: "return", withOrder: true },
    [
      ["customer", "أبغى أرجع العباية المقاس ما ناسبني", 9],
      ["customer", "كيف الطريقة؟", 8],
      ["customer", "؟", 2],
    ],
  ),
  build(
    5,
    { channel: "instagram", status: "resolved", handledBy: "agent", unread: 0, intent: "productQuestion" },
    [
      ["customer", "كم مدة التوصيل لمكة؟", 600],
      ["agent", "التوصيل لمكة المكرمة خلال 1-2 يوم عمل 🚚", 599],
      ["customer", "شكراً", 590],
    ],
  ),
  build(
    6,
    { channel: "webchat", status: "resolved", handledBy: "staff", unread: 0, intent: "orderStatus", withOrder: true },
    [
      ["customer", "طلبي ما تحدث من يومين", 1500],
      ["agent", "أتحقق لك الآن... الطلب جاهز للشحن وبيطلع اليوم.", 1499],
      ["staff", "تم شحن الطلب ورقم التتبع وصلك برسالة نصية.", 1300],
      ["customer", "وصلني، مشكورين", 1200],
    ],
  ),
  build(
    7,
    { channel: "whatsapp", status: "waiting", handledBy: "staff", unread: 0, intent: "complaint" },
    [
      ["customer", "انخصم المبلغ مرتين من بطاقتي", 320],
      ["agent", "نعتذر عن الإزعاج. حوّلتك لفريق المالية للتحقق من العملية.", 319],
      ["staff", "تم رفع طلب استرداد للعملية المكررة، يظهر خلال 3-5 أيام عمل.", 250],
    ],
  ),
  build(
    8,
    { channel: "instagram", status: "open", handledBy: "agent", unread: 1, intent: "purchase" },
    [
      ["customer", "عندكم كود خصم؟", 35],
      ["agent", "أهلاً هيا! استخدمي كود NAKHLA10 وتحصلين خصم 10% على أول طلب.", 34],
      ["customer", "يشمل العطور؟", 6],
    ],
  ),
  build(
    9,
    { channel: "webchat", status: "resolved", handledBy: "agent", unread: 0, intent: "productQuestion" },
    [
      ["customer", "السماعات تدعم الآيفون؟", 2900],
      ["agent", "نعم، تدعم iPhone وAndroid عبر Bluetooth 5.3.", 2899],
    ],
  ),
  build(
    10,
    { channel: "messenger", status: "open", handledBy: "agent", unread: 1, intent: "purchase" },
    [
      ["customer", "شفت إعلانكم على فيسبوك — التغليف المجاني يشمل الهدايا الكبيرة؟", 65],
      ["agent", "أهلاً جود! نعم، التغليف المجاني يشمل كل المنتجات مهما كان حجمها 🎁", 62],
      ["customer", "تمام، بختار وبطلب", 8],
    ],
  ),
  build(
    11,
    { channel: "tiktok", status: "waiting", handledBy: "agent", unread: 0, intent: "productQuestion" },
    [
      ["customer", "جاني إشعار من الفيديو حقكم — العطر اللي عرضتوه متوفر بالفرع؟", 26],
      ["agent", "أهلاً! متوفر في متجرنا الإلكتروني حالياً، والتوصيل لباب البيت خلال يومين.", 24],
      ["customer", "أبغاه اليوم لو ممكن", 5],
    ],
  ),
  build(
    12,
    { channel: "x", status: "open", handledBy: "agent", unread: 2, intent: "complaint" },
    [
      ["customer", "سلام، راسلتكم على إكس بخصوص الشحنة — وصلتني الطردية مفتوحة!", 40],
      ["agent", "نعتذر بشدة! أرسل لنا صورة الطرد ورقم الطلب ونعوّضك فوراً.", 36],
      ["customer", "أرسلت الصور، رقم الطلب ١٠٤٥٥", 30],
    ],
  ),
  build(
    13,
    { channel: "email", status: "open", handledBy: "agent", unread: 1, intent: "purchase" },
    [
      ["customer", "الموضوع: طلب عرض أسعار — توريد تمر هدايا لشركتنا (50 علبة)", 55],
      ["agent", "أهلاً بندر! وصلنا إيميلك. نقدر نوفر 50 علبة تمر سكري بتغليف هدايا — بأجهز لك عرض السعر وأرسله على نفس الإيميل خلال ساعة.", 48],
      ["customer", "تمام، بانتظار العرض. وإذا ممكن تفاصيل التوصيل للرياض.", 15],
    ],
  ),
].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
