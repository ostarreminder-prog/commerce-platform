import * as React from "react";
import { cn } from "../lib/cn";
import { inputClassName } from "./input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 4, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(inputClassName, "h-auto min-h-20", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";
