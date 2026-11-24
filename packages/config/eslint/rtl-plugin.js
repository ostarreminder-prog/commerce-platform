const PHYSICAL =
  /^-?(m[lr]|p[lr]|left|right|scroll-m[lr]|scroll-p[lr]|border-[lr]|rounded-[lr]|rounded-(tl|tr|bl|br)|text-(left|right)|float-(left|right)|clear-(left|right)|space-x|divide-x-reverse)(-|$)/;

const COLOR_PREFIX =
  "(?:bg|text|border|fill|stroke|from|via|to|ring|ring-offset|divide|accent|caret|decoration|outline|shadow|placeholder|selection|underline-offset)";
const PALETTE =
  "(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)";
const RAW_PALETTE = new RegExp(`^-?${COLOR_PREFIX}-${PALETTE}(?:-\\d{2,3})?(?:\\/\\d{1,3})?$`);
const RAW_NEUTRAL = new RegExp(`^-?${COLOR_PREFIX}-(?:white|black)(?:\\/\\d{1,3})?$`);
const RAW_ARBITRARY = /\[.*?(#[0-9a-fA-F]{3,8}\b|rgba?\()/;

const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const CLASS_FUNCTIONS = new Set(["cn", "cva", "clsx", "twMerge"]);

const LOGICAL_HINT =
  "Use logical utilities instead (ms-/me-/ps-/pe-/start-/end-/border-s/border-e/rounded-s/rounded-e/text-start/text-end/gap).";
const COLOR_HINT =
  "Use design tokens instead (bg-primary, text-muted-foreground, bg-success, text-warning, bg-card…). See packages/config/tailwind/preset.ts.";
const ARABIC_HINT = "Move user-facing text to messages/*.json and render it via t()/useMsg().";

function isClassContext(node) {
  let current = node.parent;
  while (current) {
    if (current.type === "JSXAttribute") {
      const name = current.name && current.name.name;
      return name === "className" || name === "class";
    }
    if (current.type === "CallExpression") {
      const callee = current.callee;
      if (callee.type === "Identifier" && CLASS_FUNCTIONS.has(callee.name)) return true;
    }
    current = current.parent;
  }
  return false;
}

function findPhysical(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.split(":").pop() ?? token)
    .map((token) => token.replace(/^!/, ""))
    .filter((token) => PHYSICAL.test(token));
}

function findRawColor(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.split(":").pop() ?? token)
    .map((token) => token.replace(/^!/, ""))
    .filter((token) => RAW_PALETTE.test(token) || RAW_NEUTRAL.test(token) || RAW_ARBITRARY.test(token));
}

const noPhysicalClasses = {
  meta: {
    type: "problem",
    docs: { description: "Disallow physical (non RTL-safe) Tailwind utilities" },
    schema: [],
    messages: { physical: "Physical utility \"{{token}}\" is not RTL-safe. {{hint}}" },
  },
  create(context) {
    const check = (node, value) => {
      if (!isClassContext(node)) return;
      for (const token of findPhysical(value)) {
        context.report({ node, messageId: "physical", data: { token, hint: LOGICAL_HINT } });
      }
    };
    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked ?? node.value.raw);
      },
    };
  },
};

const noRawColors = {
  meta: {
    type: "problem",
    docs: { description: "Disallow fixed Tailwind palette colors / hex in class names; use design tokens" },
    schema: [],
    messages: { raw: "Fixed color \"{{token}}\" bypasses the design system. {{hint}}" },
  },
  create(context) {
    const check = (node, value) => {
      if (!isClassContext(node)) return;
      for (const token of findRawColor(value)) {
        context.report({ node, messageId: "raw", data: { token, hint: COLOR_HINT } });
      }
    };
    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked ?? node.value.raw);
      },
    };
  },
};

const noHardcodedArabic = {
  meta: {
    type: "problem",
    docs: { description: "Disallow hard-coded Arabic text in JSX; use translation keys" },
    schema: [],
    messages: { arabic: "Hard-coded Arabic text in JSX. {{hint}}" },
  },
  create(context) {
    return {
      JSXText(node) {
        if (ARABIC.test(node.value)) context.report({ node, messageId: "arabic", data: { hint: ARABIC_HINT } });
      },
      JSXAttribute(node) {
        const value = node.value;
        if (value && value.type === "Literal" && typeof value.value === "string" && ARABIC.test(value.value)) {
          context.report({ node: value, messageId: "arabic", data: { hint: ARABIC_HINT } });
        }
      },
    };
  },
};

export default {
  meta: { name: "eslint-plugin-rtl" },
  rules: {
    "no-physical-classes": noPhysicalClasses,
    "no-raw-colors": noRawColors,
    "no-hardcoded-arabic": noHardcodedArabic,
  },
};
