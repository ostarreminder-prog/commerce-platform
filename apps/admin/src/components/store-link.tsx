"use client";

import * as React from "react";
import NextLink from "next/link";
import { useStoreHref } from "@/lib/store-route";

type Props = React.ComponentProps<typeof NextLink>;

/** next/link that keeps the current `/[store]` prefix on app-relative hrefs. */
const Link = React.forwardRef<HTMLAnchorElement, Props>(function StoreLink({ href, ...props }, ref) {
  const scope = useStoreHref();
  const scoped = typeof href === "string" ? scope(href) : { ...href, pathname: href.pathname ? scope(href.pathname) : href.pathname };
  return <NextLink ref={ref} href={scoped} {...props} />;
});

export default Link;
