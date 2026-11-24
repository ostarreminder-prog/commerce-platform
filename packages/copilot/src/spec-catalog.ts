import { z } from "zod";
import { idsWith, zId, zIds, type GenNsSpec } from "./spec-helpers";

/* Catalog domain: session + stores + roles/staff + catalog entities +
 * inventory/imports + media library. */

export const CATALOG_SPEC: GenNsSpec[] = [
  {
    ns: "session", resolve: (api) => ({ me: api.me }), entityAr: "الجلسة الحالية", entityEn: "current session",
    read: [{ m: "me", descAr: "بيانات المستخدم الحالي وصلاحياته الفعلية", descEn: "current user + effective permissions" }],
  },
  {
    ns: "stores", entityAr: "متجر", entityEn: "store",
    read: [
      { m: "list" },
      { m: "bySlug", args: "custom", schema: z.object({ slug: z.string().min(1) }).strict(), call: (a) => [a.slug], descAr: "قراءة متجر بالـ slug" },
    ],
  },
  {
    ns: "roles", entityAr: "دور", entityEn: "role", readPermission: "staff.manage", writePermission: "staff.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [{ m: "create", args: "input" }, { m: "update", args: "idPatch", undoable: true }],
    danger: [{ m: "remove", args: "id" }],
  },
  {
    ns: "staff", entityAr: "موظف", entityEn: "staff member", readPermission: "staff.manage", writePermission: "staff.manage",
    read: [{ m: "list" }, { m: "me", descAr: "الموظف الحالي" }, { m: "roles", descAr: "أدوار الفريق" }],
    write: [
      { m: "invite", args: "input" }, // name collides with handwritten staff.invite — kept for coverage
      { m: "setStatus", args: "custom", undoable: true,
        schema: z.object({ id: zId, status: z.enum(["invited", "active", "suspended"]) }).strict(), call: (a) => [a.id, a.status] },
      { m: "saveRole", args: "input", descAr: "إنشاء/تحديث دور صلاحيات" },
    ],
    danger: [{ m: "remove", args: "id" }],
  },
  {
    ns: "categories", entityAr: "تصنيف", entityEn: "category", readPermission: "products.read", writePermission: "products.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [
      { m: "save", name: "create", args: "input", descAr: "إنشاء/تحديث تصنيف" },
      { m: "move", args: "custom", undoable: true, descAr: "نقل تصنيف تحت أب آخر",
        schema: z.object({ id: zId, parentId: z.string().nullable().default(null), sortOrder: z.number().int().default(0) }).strict(),
        call: (a) => [a.id, a.parentId, a.sortOrder] },
    ],
  },
  {
    ns: "products", entityAr: "منتج", entityEn: "product", readPermission: "products.read", writePermission: "products.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [
      { m: "save", name: "create", args: "input", descAr: "إنشاء/تحديث منتج" },
      // setStatus + adjustPrices collide with the richer handwritten bulk tools
      { m: "setStatus", args: "custom",
        schema: z.object({ ids: zIds, status: z.enum(["draft", "active", "archived"]) }).strict(), call: (a) => [a.ids, a.status] },
      { m: "adjustPrices", args: "custom",
        schema: z.object({ ids: zIds, mode: z.enum(["percent", "fixed"]), value: z.number() }).strict(), call: (a) => [a.ids, a.mode, a.value] },
      { m: "addToCategory", ...idsWith("categoryId"), descAr: "إضافة منتجات لتصنيف" },
      { m: "addToCollection", ...idsWith("collectionId"), descAr: "إضافة منتجات لتشكيلة يدوية" },
      { m: "addTag", ...idsWith("tag"), descAr: "وسم منتجات" },
    ],
    danger: [{ m: "remove", args: "ids", descAr: "حذف منتجات نهائياً" }],
  },
  {
    ns: "collections", entityAr: "تشكيلة", entityEn: "collection", readPermission: "products.read", writePermission: "products.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }, { m: "products", args: "id", descAr: "منتجات تشكيلة" }],
    write: [{ m: "save", name: "create", args: "input", descAr: "إنشاء/تحديث تشكيلة" }],
  },
  {
    ns: "inventory", entityAr: "مخزون", entityEn: "inventory", readPermission: "products.read", writePermission: "inventory.manage",
    read: [
      { m: "levels", descAr: "مستويات المخزون لكل متغير" },
      { m: "movements", descAr: "حركات المخزون" },
      { m: "movementsFor", args: "id", descAr: "حركات مخزون متغير محدد" },
      { m: "locations", descAr: "مواقع المخزون" },
    ],
    write: [{ m: "adjust", args: "idInput", descAr: "تسوية مخزون متغير (delta/set + سبب)" }],
  },
  {
    ns: "imports", entityAr: "مهمة استيراد", entityEn: "import job", readPermission: "products.read", writePermission: "products.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [{ m: "create", args: "input" }],
  },
  {
    ns: "media", entityAr: "وسائط", entityEn: "media item", readPermission: "storefront.manage", writePermission: "storefront.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [
      { m: "upload", skip: "وسيط binary File — لا يمكن تمثيله في معاملات أداة" },
      { m: "create", args: "input", descAr: "إضافة صورة بـ dataURL للمكتبة" },
      { m: "update", args: "idPatch", undoable: true },
    ],
    danger: [{ m: "remove", args: "id" }],
  },
];
