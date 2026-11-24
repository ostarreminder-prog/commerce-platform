import type { SeedCustomer, SeedCustomerSegment } from "./types";
import { daysAgo } from "../../data/seed";

type Seed = [name: string, email: string, city: string];

const seeds: Seed[] = [
  ["نورة العتيبي", "noura.otaibi", "الرياض"],
  ["فهد القحطاني", "fahad.q", "الرياض"],
  ["سارة الشهري", "sara.shehri", "جدة"],
  ["عبدالله الدوسري", "a.dosari", "الدمام"],
  ["ريم الزهراني", "reem.z", "جدة"],
  ["محمد الغامدي", "m.ghamdi", "مكة المكرمة"],
  ["لمى الحربي", "lama.harbi", "المدينة المنورة"],
  ["تركي المطيري", "turki.m", "الرياض"],
  ["هيا السبيعي", "haya.s", "الخبر"],
  ["سلطان العنزي", "sultan.anazi", "حائل"],
  ["جود الشمري", "jood.sh", "الرياض"],
  ["ماجد الرشيدي", "majed.r", "القصيم"],
  ["أمل البلوي", "amal.b", "تبوك"],
  ["بندر السهلي", "bandar.s", "الرياض"],
  ["دانة الملحم", "dana.m", "الأحساء"],
  ["يوسف الأحمدي", "yousef.a", "جدة"],
  ["غادة العمري", "ghada.o", "أبها"],
  ["نايف الشهراني", "nayef.sh", "خميس مشيط"],
  ["العنود الفيصل", "anood.f", "الرياض"],
  ["عمر باعشن", "omar.b", "جدة"],
  ["شهد القرني", "shahad.q", "الطائف"],
  ["خالد المالكي", "k.malki", "مكة المكرمة"],
  ["رهف الجهني", "rahaf.j", "ينبع"],
  ["سعود التميمي", "saud.t", "الرياض"],
  ["منيرة الخالدي", "munira.k", "الدمام"],
  ["راكان العسيري", "rakan.a", "أبها"],
  ["لجين الحمدان", "lujain.h", "الرياض"],
  ["حمد السديري", "hamad.s", "الرياض"],
  ["وعد الزهراني", "waad.z", "الباحة"],
  ["زياد الحازمي", "ziad.h", "جازان"],
];

export const districts: Record<string, string[]> = {
  الرياض: ["حي الملقا", "حي النرجس", "حي العليا", "حي الياسمين"],
  جدة: ["حي الروضة", "حي الشاطئ", "حي السلامة"],
  الدمام: ["حي الفيصلية", "حي الشاطئ"],
};

/** Base customer records; order aggregates are filled in by `orders.ts`. */
export const baseCustomers: SeedCustomer[] = seeds.map(([name, email, city], i) => ({
  id: `cus_${String(i + 1).padStart(3, "0")}`,
  name,
  email: `${email}@example.sa`,
  phone: `05${String(50000000 + ((i * 7919) % 49999999)).padStart(8, "0")}`,
  city,
  segment: "new" as SeedCustomerSegment,
  ordersCount: 0,
  totalSpent: 0,
  lastOrderAt: null,
  createdAt: daysAgo(20 + ((i * 41) % 300)),
}));
