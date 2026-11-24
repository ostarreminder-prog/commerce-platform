import type { ProductQuestion } from "@repo/contracts";
import type { NewsletterInput, NewsletterSubscriber } from "./types";
import { audit, db, find, guard, respond, uid } from "./db";

/* ============================================================================
 * Storefront-only mock "server" — endpoints that exist because a public
 * shopper needs them, not because an admin screen does:
 *   · qa          — product Q&A ("أسئلة وأجوبة") asked on the product page
 *   · newsletter  — footer signup list (recorded, no real delivery yet)
 * Both keep honest semantics: a question lands as `pending` until staff
 * answers, and a subscription is a stored row — nothing pretends to send mail.
 * ========================================================================== */

export const storefrontApi = {
  qa: {
    list: (productId: string) => respond<ProductQuestion[]>(db.productQuestions.filter((q) => q.productId === productId)),
    /* Ask a question — visible immediately as "pending" so the shopper sees
     * their own entry; nothing is auto-answered. */
    ask: (productId: string, input: { name: string; question: string }) => guard<ProductQuestion>(() => {
      find(db.products, productId, "product");
      if (!input.question.trim()) throw new Error("question_required");
      const q: ProductQuestion = {
        id: uid("qa"), productId, authorName: input.name.trim() || "زائر",
        question: input.question.trim(), answer: null, answeredBy: null, status: "pending", createdAt: new Date().toISOString(),
      };
      db.productQuestions.unshift(q);
      audit("product_question.asked", { type: "product", id: productId }, [{ field: "question", from: null, to: "1" }]);
      return q;
    }),
    /* Staff answer — powers the admin side if/when a screen calls it. */
    answer: (id: string, answer: string) => guard<ProductQuestion>(() => {
      const q = find(db.productQuestions, id, "question");
      if (!answer.trim()) throw new Error("answer_required");
      q.answer = answer.trim();
      q.status = "answered";
      q.answeredBy = { type: "staff", id: "stf_khalid", name: "خالد العتيبي" };
      audit("product_question.answered", { type: "product", id: q.productId }, [{ field: "status", from: "pending", to: "answered" }]);
      return q;
    }),
  },
  newsletter: {
    list: () => respond<NewsletterSubscriber[]>(db.newsletterSubscribers),
    /* Footer signup — stored as a real row and deduped per contact; the "send"
     * side honestly doesn't exist yet (no real ESP). */
    subscribe: (input: NewsletterInput) => guard<NewsletterSubscriber>(() => {
      const contact = input.contact.trim();
      if (!contact) throw new Error("contact_required");
      if (input.channel === "email" && !/^\S+@\S+\.\S+$/.test(contact)) throw new Error("invalid_email");
      if (input.channel === "whatsapp" && contact.replace(/\D/g, "").length < 9) throw new Error("invalid_phone");
      const existing = db.newsletterSubscribers.find((s) => s.contact === contact);
      if (existing) return existing;
      const s: NewsletterSubscriber = { id: uid("sub"), contact, channel: input.channel, at: new Date().toISOString() };
      db.newsletterSubscribers.unshift(s);
      return s;
    }),
  },
};
