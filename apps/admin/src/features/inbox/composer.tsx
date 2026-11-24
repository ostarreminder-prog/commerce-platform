"use client";

import * as React from "react";
import { Link2, Package, Paperclip, Send, StickyNote } from "lucide-react";
import { useTranslations } from "next-intl";
import { commerce, useSendConversationMessage, useUploadMedia } from "@repo/api-client";
import type { Conversation, MediaRef } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { cn } from "@repo/ui/lib/cn";
import { ProductPicker } from "./entity-pickers";
import { SmartReply } from "./smart-reply";

const toMediaRef = (m: { id: string; url: string; altAr?: string; altEn?: string; width?: number; height?: number }, fallback: string): MediaRef => ({
  id: m.id,
  url: m.url,
  alt: { ar: m.altAr ?? m.altEn ?? fallback, en: m.altEn },
  width: m.width ?? 0,
  height: m.height ?? 0,
});

/** Thread composer — text/notes/attachments/product-card/payment-link + the smart-reply draft card. */
export function Composer({ c, canReply }: { c: Conversation; canReply: boolean }) {
  const t = useTranslations("inbox");
  const mt = useMsgToast();
  const send = useSendConversationMessage();
  const upload = useUploadMedia();
  const [text, setText] = React.useState("");
  const [note, setNote] = React.useState(false);
  const [productOpen, setProductOpen] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  if (!canReply) return null;

  const sendText = (content: string, internal = note) =>
    send.mutate([c.id, { type: internal ? "internal_note" : "text", content }], {
      onSuccess: () => setText(""),
      onError: () => mt.error("inbox.message.failed", undefined, { retry: () => send.mutate([c.id, { type: internal ? "internal_note" : "text", content }]) }),
    });

  const submit = () => {
    const content = text.trim();
    if (content) sendText(content);
  };

  const onFile = async (file: File) => {
    try {
      const isImage = file.type.startsWith("image/");
      const media = isImage
        ? await upload.mutateAsync([file])
        : await new Promise<{ id: string; url: string; altAr?: string; altEn?: string; width?: number; height?: number }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("read"));
            reader.onload = () =>
              commerce.media
                .create({ url: String(reader.result), altAr: file.name, mime: file.type || undefined })
                .then(resolve)
                .catch(reject);
            reader.readAsDataURL(file);
          });
      send.mutate([c.id, { type: isImage ? "image" : "document", attachments: [toMediaRef(media, file.name)] }], {
        onError: () => mt.error("inbox.message.failed"),
      });
    } catch {
      mt.error("inbox.message.failed");
    }
  };

  return (
    <div className="space-y-2 border-t p-3">
      {c.status === "open_human" || c.status === "waiting_human" ? <SmartReply conversationId={c.id} onSend={(text) => sendText(text, false)} disabled={send.isPending} /> : null}
      <div className={cn("rounded-lg border", note && "border-warning/50 bg-warning/5")}>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={note ? mt.text("inbox.note.placeholder") : t("replyPlaceholder")}
          aria-label={t("replyPlaceholder")}
          rows={2}
          className="resize-none border-0 shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center gap-1 p-2 pt-0">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
              e.target.value = "";
            }}
          />
          <Button variant="ghost" size="icon" aria-label={t("attach")} disabled={upload.isPending} onClick={() => fileRef.current?.click()}>
            <Paperclip className="size-4" />
          </Button>
          <Button variant={note ? "secondary" : "ghost"} size="icon" aria-label={t("internalNote")} onClick={() => setNote(!note)}>
            <StickyNote className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t("sendProduct")} onClick={() => setProductOpen(true)}>
            <Package className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("sendPaymentLink")}
            onClick={() => {
              const orderId = c.relatedOrderIds[0];
              send.mutate([c.id, { type: "payment_link", orderId }], { onSuccess: () => mt.success("orders.paymentLink.sent") });
            }}
          >
            <Link2 className="size-4" />
          </Button>
          <Button className="ms-auto" size="sm" onClick={submit} disabled={send.isPending || !text.trim()}>
            <Send aria-hidden />
            {note ? t("addNote") : t("send")}
          </Button>
        </div>
      </div>
      <ProductPicker
        open={productOpen}
        onOpenChange={setProductOpen}
        onPick={(productId) => send.mutate([c.id, { type: "product_card", productId }], { onError: () => mt.error("inbox.message.failed") })}
      />
    </div>
  );
}
