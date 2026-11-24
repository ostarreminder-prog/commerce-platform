import type { SeedCategory, SeedProduct, SeedProductStatus } from "./types";
import { daysAgo } from "../../data/seed";

export const categories: SeedCategory[] = [
  { id: "cat_coffee", name: { ar: "القهوة والتمور", en: "Coffee & Dates" } },
  { id: "cat_perfume", name: { ar: "العطور والبخور", en: "Perfumes & Incense" } },
  { id: "cat_fashion", name: { ar: "الأزياء", en: "Fashion" } },
  { id: "cat_home", name: { ar: "المنزل", en: "Home" } },
  { id: "cat_care", name: { ar: "العناية الشخصية", en: "Personal Care" } },
  { id: "cat_tech", name: { ar: "الإكسسوارات التقنية", en: "Tech Accessories" } },
];

type Seed = [ar: string, en: string, category: string, priceSar: number, stock: number, hue: number];

const seeds: Seed[] = [
  ["قهوة سعودية بالهيل 500 جم", "Saudi Cardamom Coffee 500g", "cat_coffee", 65, 140, 32],
  ["تمر سكري فاخر 1 كجم", "Premium Sukkari Dates 1kg", "cat_coffee", 89, 85, 28],
  ["تمر عجوة المدينة 1 كجم", "Madinah Ajwa Dates 1kg", "cat_coffee", 120, 6, 18],
  ["دلة قهوة نحاسية", "Copper Dallah Coffee Pot", "cat_coffee", 185, 22, 24],
  ["فناجين قهوة مذهبة (6 قطع)", "Gold-Rimmed Coffee Cups (6 pcs)", "cat_coffee", 79, 48, 40],
  ["قهوة مختصة إثيوبية 250 جم", "Ethiopian Specialty Coffee 250g", "cat_coffee", 58, 0, 20],
  ["دهن عود كمبودي 3 مل", "Cambodian Oud Oil 3ml", "cat_perfume", 450, 12, 22],
  ["بخور معطر فاخر 50 جم", "Luxury Bakhoor 50g", "cat_perfume", 95, 64, 12],
  ["عطر مسك الطهارة 50 مل", "White Musk Perfume 50ml", "cat_perfume", 145, 37, 300],
  ["مبخرة كهربائية محمولة", "Portable Electric Incense Burner", "cat_perfume", 129, 0, 260],
  ["عطر ورد طائفي 100 مل", "Taif Rose Perfume 100ml", "cat_perfume", 320, 18, 345],
  ["عباية كريب سوداء", "Black Crepe Abaya", "cat_fashion", 390, 26, 230],
  ["شماغ أحمر قطني", "Red Cotton Shemagh", "cat_fashion", 110, 70, 0],
  ["ثوب رجالي صيفي", "Men's Summer Thobe", "cat_fashion", 240, 33, 210],
  ["طرحة شيفون", "Chiffon Hijab", "cat_fashion", 55, 120, 280],
  ["حقيبة جلد يدوية", "Handmade Leather Bag", "cat_fashion", 520, 3, 25],
  ["سجادة صلاة مبطنة", "Padded Prayer Rug", "cat_home", 99, 54, 150],
  ["مفرش طاولة مطرز", "Embroidered Table Runner", "cat_home", 145, 15, 45],
  ["فانوس ديكور معدني", "Metal Decorative Lantern", "cat_home", 175, 9, 38],
  ["طقم مباخر خشبية", "Wooden Incense Burner Set", "cat_home", 260, 0, 30],
  ["شمعة معطرة بالعود", "Oud Scented Candle", "cat_home", 85, 42, 15],
  ["زيت أرغان طبيعي 100 مل", "Natural Argan Oil 100ml", "cat_care", 75, 66, 42],
  ["صابون سدر وعسل", "Sidr & Honey Soap", "cat_care", 28, 200, 50],
  ["كريم مرطب بالعسل", "Honey Moisturizing Cream", "cat_care", 89, 31, 46],
  ["مسواك أراك (10 حبات)", "Miswak Sticks (10 pcs)", "cat_care", 19, 300, 90],
  ["حناء طبيعية 200 جم", "Natural Henna 200g", "cat_care", 35, 8, 110],
  ["سماعات لاسلكية", "Wireless Earbuds", "cat_tech", 299, 27, 220],
  ["شاحن سريع 30 واط", "30W Fast Charger", "cat_tech", 89, 95, 200],
  ["حامل جوال للسيارة", "Car Phone Mount", "cat_tech", 59, 0, 190],
  ["باور بانك 20000 مللي أمبير", "20000mAh Power Bank", "cat_tech", 159, 44, 205],
  ["بطاقة هدية إلكترونية 100 ر.س", "Digital Gift Card 100 SAR", "cat_tech", 100, 999, 190],
];

const descriptionAr = (name: string) =>
  `${name} بجودة عالية ومختار بعناية لعملائنا. يصلك مغلفاً بعناية خلال 1-3 أيام عمل داخل المملكة.`;
const descriptionEn = (name: string) =>
  `${name}, high quality and carefully selected for our customers. Delivered within 1-3 business days across the Kingdom.`;

export const products: SeedProduct[] = seeds.map(([ar, en, categoryId, priceSar, stock, hue], i) => {
  const status: SeedProductStatus = i === 19 ? "draft" : i === 28 ? "archived" : i === 5 ? "draft" : "active";
  const digital = categoryId === "cat_tech" && en.toLowerCase().includes("gift card");
  const price = priceSar * 100;
  return {
    id: `prd_${String(i + 1).padStart(3, "0")}`,
    sku: `NK-${categoryId.slice(4, 7).toUpperCase()}-${String(1001 + i)}`,
    name: { ar, en },
    description: { ar: descriptionAr(ar), en: descriptionEn(en) },
    categoryId,
    price,
    compareAtPrice: i % 4 === 1 ? Math.round(price * 1.25) : null,
    cost: Math.round(price * 0.55),
    stock,
    lowStockThreshold: 10,
    status,
    imageHue: hue,
    rating: 3.8 + ((i * 7) % 12) / 10,
    reviewsCount: 4 + ((i * 37) % 180),
    salesCount: 12 + ((i * 53) % 420),
    digital,
    createdAt: daysAgo(30 + i * 5),
  };
});
