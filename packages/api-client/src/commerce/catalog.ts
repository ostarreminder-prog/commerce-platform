import type {
  Brand, Category, Collection, CurrentUser, ImportJob, InventoryLevel, InventoryMovement, Location, MovementReason, Product, ProductStatus, Role, Staff, Store, Variant,
} from "@repo/contracts";
import { ALL_PERMISSIONS, money } from "@repo/contracts";
import { spec } from "@repo/mocks";
import type {
  BrandInput, CategoryInput, CollectionInput, ImportInput, ProductInput,
} from "./types";
import { audit, categoryDepth, db, defaultLocation, find, guard, isCategoryDescendant, me, requirePerm, resolveCollectionProducts, respond, slugify, syncRead, uid } from "./db";

/** Valid rows the simulated import file parses to — mirrors the wizard's preview table. */
const IMPORT_PRODUCT_ROWS = [
  { name: "قهوة سعودية فاخرة", sku: "NK-IMP-001", price: 75, stock: 30 },
  { name: "تمر خلاص 1كجم", sku: "NK-IMP-002", price: 95, stock: 12 },
  { name: "عطر مسك", sku: "NK-IMP-004", price: 140, stock: 8 },
];

export const catalogApi = {
  stores: {
    list: () => syncRead<Store[]>(() => db.stores),
    bySlug: (slug: string) => guard<Store>(() => {
      const s = db.stores.find((x) => x.slug === slug);
      if (!s) throw new Error(`store ${slug} not found`);
      return s;
    }),
  },
  /** Current session — staff + resolved role + effective permissions (§4.2). */
  me: () => guard<CurrentUser>(() => {
    const s = spec.currentStaff;
    const role = db.roles.find((r) => r.id === s.roleId);
    if (!role) throw new Error("role_missing");
    return { staff: s, role, permissions: [...role.permissions] };
  }),
  roles: {
    list: () => respond<Role[]>(db.roles),
    get: (id: string) => guard<Role>(() => find(db.roles, id, "role")),
    /** Creates a custom role — permission names validated against the catalog. */
    create: (input: Omit<Role, "id" | "isSystem">) => guard<Role>(() => {
      const bad = input.permissions.find((p) => !ALL_PERMISSIONS.includes(p));
      if (bad) throw new Error(`unknown_permission:${bad}`);
      if (db.roles.some((r) => r.name === input.name)) throw new Error("name_taken");
      const r: Role = { ...input, id: uid("role"), isSystem: false };
      db.roles.push(r);
      return r;
    }),
    update: (id: string, patch: Partial<Omit<Role, "id" | "isSystem">>) => guard<Role>(() => {
      const r = find(db.roles, id, "role");
      if (r.isSystem) throw new Error("system_role");
      if (patch.permissions) {
        const bad = patch.permissions.find((p) => !ALL_PERMISSIONS.includes(p));
        if (bad) throw new Error(`unknown_permission:${bad}`);
        r.permissions = patch.permissions;
      }
      if (patch.name !== undefined) r.name = patch.name;
      if (patch.description !== undefined) r.description = patch.description;
      return r;
    }),
    /** System roles can't be deleted; neither can a role still assigned to staff. */
    remove: (id: string) => guard(() => {
      const r = find(db.roles, id, "role");
      if (r.isSystem) throw new Error("system_role");
      if (db.staff.some((s) => s.roleId === id)) throw new Error("role_in_use");
      db.roles.splice(db.roles.indexOf(r), 1);
      return { ok: true };
    }),
  },
  staff: {
    list: () => respond<Staff[]>(db.staff),
    me: () => respond<Staff>(spec.currentStaff),
    roles: () => respond<Role[]>(db.roles),
    /** Invites a staff member — lands as `invited` until they accept. */
    invite: (input: { name: string; email: string; roleId: string }) => guard<Staff>(() => {
      find(db.roles, input.roleId, "role");
      if (db.staff.some((s) => s.email === input.email)) throw new Error("email_taken");
      const s: Staff = { id: uid("stf"), name: input.name, email: input.email, phone: null, roleId: input.roleId, status: "invited", mfaEnabled: false, lastLoginAt: null };
      db.staff.unshift(s);
      db.audit.unshift({ id: uid("aud"), actor: me(), action: "staff.invited", target: { type: "staff", id: s.id, label: s.name }, changes: [], ip: null, at: new Date().toISOString() });
      return s;
    }),
    setStatus: (id: string, status: Staff["status"]) => guard<Staff>(() => {
      const s = find(db.staff, id, "staff");
      s.status = status;
      return s;
    }),
    remove: (id: string) => guard<string>(() => {
      const s = find(db.staff, id, "staff");
      if (s.roleId === "role_owner") throw new Error("owner");
      db.staff = db.staff.filter((x) => x.id !== id);
      return id;
    }),
    /** Self-service profile update (`/settings/profile`) — edits the signed-in
     * staff row and mirrors onto `spec.currentStaff` which `staff.me` serves. */
    updateProfile: (patch: { name?: string; phone?: string | null; avatar?: Staff["avatar"]; preferredLanguage?: "ar" | "en" | null }) =>
      guard<Staff>(() => {
        const s = db.staff.find((x) => x.id === spec.currentStaff.id);
        if (!s) throw new Error("staff not found");
        if (patch.name !== undefined) { if (!patch.name.trim()) throw new Error("name"); s.name = patch.name.trim(); }
        if (patch.phone !== undefined) s.phone = patch.phone?.trim() || null;
        if (patch.avatar !== undefined) s.avatar = patch.avatar;
        if (patch.preferredLanguage !== undefined) s.preferredLanguage = patch.preferredLanguage;
        /* `staff.me`/`me()` read spec.currentStaff — keep it in sync. */
        Object.assign(spec.currentStaff, { name: s.name, phone: s.phone, avatar: s.avatar, preferredLanguage: s.preferredLanguage });
        audit("staff.profile_updated", { type: "staff", id: s.id, label: s.name }, Object.keys(patch).map((field) => ({ field, from: null, to: "updated" })));
        return s;
      }),
    /** Simulated password change — the mock has no credential store, so this
     * only validates the shape (current non-empty, next ≥ 8 chars) and writes
     * an audit entry. The UI labels it honestly as a simulation. */
    changePassword: (input: { current: string; next: string }) => guard<{ ok: true }>(() => {
      if (!input.current.trim()) throw new Error("current_required");
      if (input.next.length < 8) throw new Error("weak");
      audit("staff.password_changed", { type: "staff", id: spec.currentStaff.id, label: spec.currentStaff.name });
      return { ok: true };
    }),
    /** Legacy alias kept for the settings screens — delegates to `commerce.roles`. */
    saveRole: (input: { id?: string; name: string; description: string; permissions: Role["permissions"] }): Promise<Role> =>
      input.id ? catalogApi.roles.update(input.id, input) : catalogApi.roles.create(input),
  },
  /* Merchant brands — `Product.brand` stays a display string synced to
   * `name.ar` (rename propagates; delete clears it). */
  brands: {
    list: () => guard<Brand[]>(() => { requirePerm("products.read"); return db.brands; }),
    get: (id: string) => guard<Brand>(() => { requirePerm("products.read"); return find(db.brands, id, "brand"); }),
    save: (input: BrandInput) => guard<Brand>(() => {
      requirePerm("products.manage");
      if (!input.name.ar.trim()) throw new Error("name_required");
      const clash = db.brands.find((b) => b.name.ar === input.name.ar.trim() && b.id !== input.id);
      if (clash) throw new Error("name_taken");
      if (input.id) {
        const b = find(db.brands, input.id, "brand");
        const previous = b.name.ar;
        Object.assign(b, {
          name: { ar: input.name.ar.trim(), en: input.name.en?.trim() || undefined },
          description: input.description, logo: input.logo, website: input.website?.trim() || null, status: input.status,
        });
        /* Keep `product.brand` (display string) in sync with the rename. */
        if (previous !== b.name.ar) db.products.forEach((p) => { if (p.brand === previous) p.brand = b.name.ar; });
        audit("brand.updated", { type: "brand", id: b.id, label: b.name.ar });
        return b;
      }
      const b: Brand = {
        id: uid("brn"), name: { ar: input.name.ar.trim(), en: input.name.en?.trim() || undefined },
        slug: slugify(input.name.en ?? input.name.ar), description: input.description, logo: input.logo,
        website: input.website?.trim() || null, status: input.status, createdAt: new Date().toISOString(),
      };
      db.brands.push(b);
      audit("brand.created", { type: "brand", id: b.id, label: b.name.ar });
      return b;
    }),
    /* Products keep living — their `brand` field is cleared, not deleted. */
    remove: (id: string) => guard(() => {
      requirePerm("products.manage");
      const b = find(db.brands, id, "brand");
      db.products.forEach((p) => { if (p.brand === b.name.ar) p.brand = null; });
      db.brands = db.brands.filter((x) => x.id !== id);
      audit("brand.deleted", { type: "brand", id, label: b.name.ar });
      return { ok: true };
    }),
  },
  categories: {
    list: () => respond<Category[]>(db.categories),
    get: (id: string) => guard<Category>(() => find(db.categories, id, "category")),
    save: (input: CategoryInput) => guard(() => {
      if (input.parentId && categoryDepth(input.parentId) >= 4) throw new Error("depth");
      if (input.id) {
        const c = find(db.categories, input.id, "category");
        if (input.parentId && isCategoryDescendant(input.id, input.parentId)) throw new Error("cycle");
        Object.assign(c, { name: input.name, description: input.description, parentId: input.parentId, sortOrder: input.sortOrder, seo: input.seo });
        if (input.image !== undefined) c.image = input.image;
        return c;
      }
      const c: Category = {
        id: uid("cat"), name: input.name, slug: slugify(input.name.en ?? input.name.ar), description: input.description, image: input.image ?? null,
        seo: input.seo, parentId: input.parentId, sortOrder: input.sortOrder,
      };
      db.categories.push(c);
      return c;
    }),
    move: (id: string, parentId: string | null, sortOrder: number) => guard(() => {
      if (parentId && (isCategoryDescendant(id, parentId) || categoryDepth(parentId) >= 4)) throw new Error("move");
      const c = find(db.categories, id, "category");
      c.parentId = parentId;
      c.sortOrder = sortOrder;
      return c;
    }),
    /* Delete cascades softly: children move up to the deleted node's parent
     * and products just lose the category — nothing else is touched. */
    remove: (id: string) => guard(() => {
      const c = find(db.categories, id, "category");
      db.categories.forEach((x) => { if (x.parentId === id) x.parentId = c.parentId; });
      db.products.forEach((p) => { p.categoryIds = p.categoryIds.filter((x) => x !== id); });
      db.categories = db.categories.filter((x) => x.id !== id);
      return { ok: true };
    }),
  },
  products: {
    list: () => respond<Product[]>(db.products),
    get: (id: string) => guard<Product>(() => find(db.products, id, "product")),
    save: (input: ProductInput) => guard(() => {
      const variants: Variant[] = input.variants.map((v, i) => ({ ...v, id: v.id ?? uid(`var${i}`) }));
      const slug = input.slug?.trim() ? slugify(input.slug) : undefined;
      /* `id`/`slug` are handled explicitly — strip them from `rest` so a
       * caller passing `id: undefined` can't clobber the generated values. */
      const { slug: _omit, id: _omitId, ...rest } = input;
      if (input.id) {
        const p = find(db.products, input.id, "product");
        const removed = p.variants.filter((v) => !variants.some((n) => n.id === v.id));
        db.inventoryLevels = db.inventoryLevels.filter((l) => !removed.some((v) => v.id === l.variantId));
        /* `type` follows requiresShipping unless it was explicitly "service". */
        Object.assign(p, { ...rest, slug: slug ?? p.slug, variants, type: input.requiresShipping ? (p.type === "service" ? "service" : "physical") : "digital" });
        return p;
      }
      const p: Product = {
        ...rest,
        id: uid("prd"), slug: slug ?? slugify(input.name.en ?? input.name.ar), type: input.requiresShipping ? "physical" : "digital",
        publishedAt: input.status === "active" ? new Date().toISOString() : null,
        stats: { sold30d: 0, revenue30d: money(0), views30d: 0, conversations30d: 0 },
        rating: 0, reviewsCount: 0,
        variants,
      };
      db.products.unshift(p);
      variants.forEach((v) => db.inventoryLevels.push({ variantId: v.id, locationId: defaultLocation()?.id ?? db.locations[0]?.id ?? "loc_riyadh", onHand: 0, reserved: 0, available: 0, lowStockThreshold: 5 }));
      return p;
    }),
    setStatus: (ids: string[], status: ProductStatus) => guard(() => {
      ids.forEach((id) => { const p = find(db.products, id, "product"); p.status = status; if (status === "active" && !p.publishedAt) p.publishedAt = new Date().toISOString(); });
    }),
    adjustPrices: (ids: string[], mode: "percent" | "fixed", value: number) => guard(() => {
      ids.forEach((id) => find(db.products, id, "product").variants.forEach((v) => {
        const next = mode === "percent" ? Math.round(v.price.amount * (1 + value / 100)) : v.price.amount + value;
        v.price = money(Math.max(0, next));
      }));
    }),
    addToCategory: (ids: string[], categoryId: string) => guard(() => {
      find(db.categories, categoryId, "category");
      ids.forEach((id) => { const p = find(db.products, id, "product"); if (!p.categoryIds.includes(categoryId)) p.categoryIds.push(categoryId); });
    }),
    addToCollection: (ids: string[], collectionId: string) => guard(() => {
      const c = find(db.collections, collectionId, "collection");
      if (c.type !== "manual") throw new Error("automatic");
      ids.forEach((id) => {
        const p = find(db.products, id, "product");
        if (!c.productIds.includes(id)) c.productIds.push(id);
        if (!p.collectionIds.includes(collectionId)) p.collectionIds.push(collectionId);
      });
    }),
    addTag: (ids: string[], tag: string) => guard(() => {
      ids.forEach((id) => { const p = find(db.products, id, "product"); if (!p.tags.includes(tag)) p.tags.push(tag); });
    }),
    remove: (ids: string[]) => guard(() => {
      const variantIds = new Set(ids.flatMap((id) => find(db.products, id, "product").variants.map((v) => v.id)));
      db.products = db.products.filter((p) => !ids.includes(p.id));
      db.inventoryLevels = db.inventoryLevels.filter((l) => !variantIds.has(l.variantId));
      db.collections.forEach((c) => { c.productIds = c.productIds.filter((id) => !ids.includes(id)); });
    }),
  },
  collections: {
    list: () => respond<Collection[]>(db.collections),
    get: (id: string) => guard<Collection>(() => find(db.collections, id, "collection")),
    products: (id: string) => guard<Product[]>(() => resolveCollectionProducts(find(db.collections, id, "collection"), db.products, db.inventoryLevels)),
    save: (input: CollectionInput) => guard(() => {
      if (input.id) {
        const c = find(db.collections, input.id, "collection");
        const removed = c.type === "manual" ? c.productIds.filter((id) => !input.productIds.includes(id)) : [];
        Object.assign(c, { name: input.name, description: input.description, type: input.type, productIds: input.type === "manual" ? input.productIds : [], rules: input.rules, match: input.match, seo: input.seo });
        if (input.image !== undefined) c.image = input.image;
        removed.forEach((pid) => { const p = db.products.find((x) => x.id === pid); if (p) p.collectionIds = p.collectionIds.filter((id) => id !== c.id); });
        input.productIds.forEach((pid) => { const p = db.products.find((x) => x.id === pid); if (p && !p.collectionIds.includes(c.id)) p.collectionIds.push(c.id); });
        return c;
      }
      const c: Collection = {
        id: uid("col"), name: input.name, slug: slugify(input.name.en ?? input.name.ar), description: input.description, image: input.image ?? null,
        seo: input.seo, type: input.type, productIds: input.type === "manual" ? input.productIds : [], rules: input.rules, match: input.match,
      };
      db.collections.push(c);
      return c;
    }),
    /* Products keep living — only the collection link is removed. */
    remove: (id: string) => guard(() => {
      const c = find(db.collections, id, "collection");
      db.products.forEach((p) => { p.collectionIds = p.collectionIds.filter((x) => x !== id); });
      db.collections = db.collections.filter((x) => x.id !== c.id);
      return { ok: true };
    }),
  },
  inventory: {
    levels: () => respond<InventoryLevel[]>(db.inventoryLevels),
    movements: () => respond<InventoryMovement[]>(db.inventoryMovements),
    movementsFor: (variantId: string) => respond<InventoryMovement[]>(db.inventoryMovements.filter((m) => m.variantId === variantId)),
    locations: () => respond<Location[]>(db.locations),
    adjust: (variantId: string, input: { delta?: number; set?: number; reason: MovementReason; note: string; locationId?: string }) => guard(() => {
      requirePerm("inventory.manage");
      const level = db.inventoryLevels.find((l) => l.variantId === variantId && (!input.locationId || l.locationId === input.locationId));
      if (!level) throw new Error(`variant ${variantId} not found`);
      if (input.reason === "adjustment" && !input.note.trim()) throw new Error("note");
      const delta = input.set !== undefined ? input.set - level.onHand : (input.delta ?? 0);
      if (level.onHand + delta < 0) throw new Error("negative");
      level.onHand += delta;
      level.available = level.onHand - level.reserved;
      const m: InventoryMovement = { id: uid("mov"), variantId, locationId: level.locationId, delta, reason: input.reason, note: input.note || null, reference: null, actor: me(), at: new Date().toISOString(), balanceAfter: level.onHand };
      db.inventoryMovements.unshift(m);
      return m;
    }),
    /** Moves stock between two locations — one negative + one positive
     * adjustment movement, linked by the location names in the notes. */
    transfer: (variantId: string, input: { fromLocationId: string; toLocationId: string; quantity: number; note?: string }) => guard(() => {
      requirePerm("inventory.manage");
      if (input.fromLocationId === input.toLocationId) throw new Error("same_location");
      const from = find(db.locations, input.fromLocationId, "location");
      const to = find(db.locations, input.toLocationId, "location");
      if (from.status !== "active" || to.status !== "active") throw new Error("location_inactive");
      if (input.quantity <= 0) throw new Error("quantity");
      const src = db.inventoryLevels.find((l) => l.variantId === variantId && l.locationId === from.id);
      if (!src || src.available < input.quantity) throw new Error("insufficient_stock");
      let dst = db.inventoryLevels.find((l) => l.variantId === variantId && l.locationId === to.id);
      if (!dst) {
        dst = { variantId, locationId: to.id, onHand: 0, reserved: 0, available: 0, lowStockThreshold: src.lowStockThreshold };
        db.inventoryLevels.push(dst);
      }
      const note = input.note?.trim() || null;
      src.onHand -= input.quantity;
      src.available = src.onHand - src.reserved;
      db.inventoryMovements.unshift({ id: uid("mov"), variantId, locationId: from.id, delta: -input.quantity, reason: "adjustment", note: note ?? `تحويل إلى ${to.name}`, reference: null, actor: me(), at: new Date().toISOString(), balanceAfter: src.onHand });
      dst.onHand += input.quantity;
      dst.available = dst.onHand - dst.reserved;
      db.inventoryMovements.unshift({ id: uid("mov"), variantId, locationId: to.id, delta: input.quantity, reason: "adjustment", note: note ?? `تحويل من ${from.name}`, reference: null, actor: me(), at: new Date().toISOString(), balanceAfter: dst.onHand });
      audit("inventory.transfer", { type: "variant", id: variantId }, [
        { field: "from", from: null, to: `${from.name} -${input.quantity}` },
        { field: "to", from: null, to: `${to.name} +${input.quantity}` },
      ]);
      return { from: src, to: dst };
    }),
  },
  /* Warehouse/location management — `/inventory/locations`. */
  locations: {
    list: () => respond<Location[]>(db.locations),
    save: (input: { id?: string; name: string; city: string | null; address: string | null; isDefault: boolean }) => guard<Location>(() => {
      requirePerm("inventory.manage");
      if (!input.name.trim()) throw new Error("name");
      if (input.isDefault) db.locations.forEach((l) => (l.isDefault = false));
      if (input.id) {
        const l = find(db.locations, input.id, "location");
        Object.assign(l, { name: input.name.trim(), city: input.city?.trim() || null, address: input.address?.trim() || null, isDefault: input.isDefault });
        audit("location.updated", { type: "variant", id: l.id, label: l.name });
        return l;
      }
      const l: Location = { id: uid("loc"), name: input.name.trim(), city: input.city?.trim() || null, address: input.address?.trim() || null, isDefault: input.isDefault, status: "active" };
      db.locations.push(l);
      audit("location.created", { type: "variant", id: l.id, label: l.name });
      return l;
    }),
    setStatus: (id: string, status: Location["status"]) => guard<Location>(() => {
      requirePerm("inventory.manage");
      const l = find(db.locations, id, "location");
      if (status === "inactive" && l.isDefault) throw new Error("is_default");
      l.status = status;
      audit(status === "inactive" ? "location.deactivated" : "location.activated", { type: "variant", id: l.id, label: l.name });
      return l;
    }),
    setDefault: (id: string) => guard<Location>(() => {
      requirePerm("inventory.manage");
      const l = find(db.locations, id, "location");
      if (l.status !== "active") throw new Error("location_inactive");
      db.locations.forEach((x) => (x.isDefault = x.id === id));
      audit("location.set_default", { type: "variant", id: l.id, label: l.name });
      return l;
    }),
  },
  imports: {
    list: () => respond<ImportJob[]>(db.imports),
    get: (id: string) => guard<ImportJob>(() => find(db.imports, id, "import")),
    create: (input: ImportInput) => guard(() => {
      const job: ImportJob = { id: uid("imp"), ...input, status: "processing", rowsSucceeded: 0, rowsFailed: 0, errorFileUrl: null, actor: me(), at: new Date().toISOString() };
      db.imports.unshift(job);
      setTimeout(() => {
        if (input.type === "products") {
          /* The mock "file" always parses to these rows (same rows the wizard
           * previews); each valid row creates a real draft product — or updates
           * the existing SKU when `updateExisting` is on. */
          let failed = 0;
          const ids: string[] = [];
          IMPORT_PRODUCT_ROWS.forEach((row, n) => {
            const existing = db.products.find((p) => p.variants.some((v) => v.sku === row.sku));
            if (existing) {
              if (!input.updateExisting) { failed += 1; return; }
              existing.variants.forEach((v) => { if (v.sku === row.sku) v.price = money(row.price * 100); });
              const level = db.inventoryLevels.find((l) => l.variantId === existing.variants.find((v) => v.sku === row.sku)?.id);
              if (level) { level.onHand += row.stock; level.available = level.onHand - level.reserved; }
              ids.push(existing.id);
              return;
            }
            const variantId = uid("var");
            const p: Product = {
              id: uid("prd"), slug: slugify(`${row.name} ${row.sku}`), name: { ar: row.name }, description: { ar: "" }, shortDescription: { ar: "" },
              type: "physical", status: "draft",
              media: [{ id: uid("med"), url: `placeholder:${(n * 45 + 200) % 360}`, alt: { ar: row.name }, width: 800, height: 800 }],
              categoryIds: [], collectionIds: [], brand: null, tags: [], options: [],
              variants: [{ id: variantId, optionValues: [], sku: row.sku, barcode: null, price: money(row.price * 100), compareAtPrice: null, cost: null, weightGrams: 250, dimensionsCm: null, trackInventory: true, allowBackorder: false, imageId: null }],
              seo: { title: row.name, description: "" }, requiresShipping: true, taxable: true, aiNotes: "",
              publishedAt: null, stats: { sold30d: 0, revenue30d: money(0), views30d: 0, conversations30d: 0 }, rating: 0, reviewsCount: 0,
            };
            db.products.unshift(p);
            db.inventoryLevels.push({ variantId, locationId: defaultLocation()?.id ?? db.locations[0]?.id ?? "loc_riyadh", onHand: row.stock, reserved: 0, available: row.stock, lowStockThreshold: 5 });
            ids.push(p.id);
          });
          job.productIds = ids;
          job.rowsSucceeded = ids.length;
          job.rowsFailed = failed + 1; /* +1: the preview's invalid row (empty name / bad price) */
          job.status = "completed";
          job.errorFileUrl = job.rowsFailed ? "#" : null;
        } else {
          const total = input.type === "inventory" ? 45 : 60;
          job.rowsFailed = job.id.endsWith("0") ? 3 : 0;
          job.rowsSucceeded = total - job.rowsFailed;
          job.status = "completed";
          job.errorFileUrl = job.rowsFailed ? "#" : null;
          if (input.type === "inventory") db.inventoryLevels.slice(0, job.rowsSucceeded).forEach((l) => { l.onHand += 1; l.available = l.onHand - l.reserved; });
        }
      }, 3_000);
      return job;
    }),
  },
};
