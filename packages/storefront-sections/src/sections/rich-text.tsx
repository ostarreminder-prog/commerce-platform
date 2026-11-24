"use client";

import { cn } from "@repo/ui/lib/cn";
import type { ThemeSection } from "../types";
import { SectionBlocks } from "../blocks-render";
import { strSetting } from "./helpers";

/** Block-driven free content (heading/text/button/divider) with an alignment setting. */
export function RichTextSection({ section }: { section: ThemeSection }) {
  const centered = strSetting(section.settings, "alignment", "start") === "center";

  return (
    <section className="sec-pad">
      <div className="container">
        <SectionBlocks
          blocks={section.blocks}
          className={cn("max-w-2xl", centered ? "mx-auto items-center text-center" : "items-start text-start")}
        />
      </div>
    </section>
  );
}
