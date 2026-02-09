// CopilotKitWrapper.jsx
// ---------------------------------------------------------------------------
// Feeds REAL documentation content (from build-time generated docs-context.json)
// and GitHub repository code into CopilotKit so the AI assistant answers
// exclusively from official Dspread sources.
// ---------------------------------------------------------------------------
import {
  CopilotKit,
  useCopilotAction,
  useCopilotReadable,
} from "@copilotkit/react-core";
import {
  CopilotSidebar,
  useCopilotChatSuggestions,
} from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { fetchAllGithubContent } from "../utils/fetchGithubContent";

const DOCS = "https://dspreadorg.github.io/docs";

// Resolve basePath at runtime so the JSON fetch works in both dev & prod.
const BASE_PATH =
  typeof window !== "undefined" && window.__NEXT_DATA__?.basePath
    ? window.__NEXT_DATA__.basePath
    : "";

// ── System prompt ───────────────────────────────────────────────────────
const INSTRUCTIONS = `You are the Dspread Documentation Assistant.

## CONVERSATION FLOW — follow this order every time.

### Step 1 — Identify the user's product
Before giving integration advice, ALWAYS ask or confirm which product the user has.
Use this classification:

| Category | Terminal Models | Docs Section |
|----------|----------------|--------------|
| **Smart POS (Android)** | D20, D30, D50, D60, D70, D80, D80K | Android Terminals |
| **mPOS / Mobile Reader** | QPOS mini, QPOS Cute, CR100, QPOS Plus pinpad (Bluetooth/USB paired with phone) | Android Terminals → mPOS section, or mPOS external docs |
| **Linux Terminal** | D30-linux, QPOS-linux (Linux-based POS) | Linux Terminals |
| **Cloud Speaker** | DS10, DS50, DS200 (audio payment notification) | Cloud Speaker |

If the user mentions a specific model (e.g. "D60", "QPOS mini", "CR100", "DS50"), map it
to the right category and proceed.

If the user's question is ambiguous or does not mention a model, ask:
"Could you tell me which terminal model you are using? For example:
- **Smart POS**: D20, D30, D50, D60, D70, D80, D80K
- **Mobile Reader (mPOS)**: QPOS mini, QPOS Cute, CR100, QPOS Plus pinpad
- **Linux Terminal**: D30-linux, QPOS-linux
- **Cloud Speaker**: DS10, DS50, DS200

This helps me give you the most relevant documentation."

### Step 2 — Give targeted advice
Once the product type is known:
- **Smart POS (Android)**: Guide through Android SDK setup → card payment → receipt printing → scanner → customization. Use the navigateToPage action to direct them to the relevant page.
- **mPOS**: Explain Bluetooth/USB connection flow, show mPOS-specific init code. Direct to Accept Card Payment page.
- **Linux Terminal**: Guide through environment setup → SDK clone → transaction flow. Direct to Linux Getting Started.
- **Cloud Speaker**: Guide through build process. Direct to Cloud Speaker page.

### Step 3 — Always use the navigateToPage action
When your answer relates to a specific documentation page, call the **navigateToPage** action to navigate the user's browser to that page. This is MANDATORY — do not just provide links, actively navigate.

## PAGE ROUTE MAP (use these exact routes with navigateToPage):
- Overview: /
- Plan Your Integration: /plan-your-integration
- How Terminal Works: /how-terminal-works
- Android Overview: /android-terminals/overview
- Set Up Integration: /android-terminals/set-up-integration
- Accept Card Payment: /android-terminals/accept-card-payment
- Print Receipt: /android-terminals/print-receipt
- Scanner QR/Bar Code: /android-terminals/scanner-qr-bar-code
- Customize OS: /android-terminals/customize-os
- Linux Getting Started: /linux-terminals/getting-started
- Linux Transaction Flow: /linux-terminals/transaction-flow
- Linux Best Practices: /linux-terminals/best-practices
- Linux Common Issues: /linux-terminals/common-issues
- Linux Additional Resources: /linux-terminals/additional-resources
- Cloud Speaker: /cloud-speaker
- Key Management (AWS): /key-management-aws
- Payment Gateway (AWS): /payment-gateway-aws
- EMV L3 Testing: /emv-l3-testing
- TMS/LarkTMS: /tms-larktms

## ANSWERING RULES

**Rule 1 — Answer ONLY from the provided context.**
You have:
  A) DOCUMENTATION CONTENT — full text of every docs page.
  B) GITHUB REPO CONTENT — READMEs and key files from official repos.
  C) CURRENT PAGE — the page the user is viewing right now; prioritize it.
Use ONLY these sources. NEVER fabricate or guess.

**Rule 2 — 80 %+ direct quotes with source links.**
Most of every answer MUST be verbatim quotes (> blockquote) or exact code from
the documentation/GitHub repos. Every quote MUST include a source link.

**Rule 3 — If not covered, say so.**
If the context doesn't cover the topic: "Official documentation does not cover this topic yet."

**Rule 4 — Navigate proactively.**
After answering, ALWAYS call navigateToPage to send the user to the most relevant
documentation page for their question.

## RESPONSE FORMAT

> Verbatim quote from documentation…
— [Page Title](${DOCS}/page-path)

\`\`\`language
// exact code from official source
\`\`\`
— [Source](url)

📖 References:
- [Page 1](link)

## Official Code Repositories
- Android SDK: https://github.com/DspreadOrg/android
- QPOS Linux Tools: https://github.com/DspreadOrg/qpos-linux-tools
- D30 Linux SDK: https://github.com/DspreadOrg/D30-linux
- QPOS Linux SDK: https://github.com/dspreadOrg/qpos-linux
- Documentation: https://github.com/DspreadOrg/docs`;

// ── Inner component (has access to CopilotKit context) ──────────────────
function AppWithContext({ children }) {
  const router = useRouter();

  // ─ state ─────────────────────────────────────────────────────────────
  const [docsCtx, setDocsCtx] = useState(null);      // parsed docs-context.json
  const [githubCtx, setGithubCtx] = useState("");     // combined GitHub content
  const [currentPath, setCurrentPath] = useState("");

  // ─ track current route ───────────────────────────────────────────────
  useEffect(() => {
    setCurrentPath(router.asPath);
  }, [router.asPath]);

  // ─ fetch docs-context.json (generated at build time) ─────────────────
  useEffect(() => {
    fetch(`${BASE_PATH}/docs-context.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setDocsCtx)
      .catch((err) =>
        console.warn("[CopilotKit] Could not load docs-context.json:", err)
      );
  }, []);

  // ─ fetch GitHub repo content (cached in sessionStorage) ──────────────
  useEffect(() => {
    fetchAllGithubContent()
      .then(setGithubCtx)
      .catch((err) =>
        console.warn("[CopilotKit] GitHub content fetch failed:", err)
      );
  }, []);

  // ─ build the "all pages" text blob ───────────────────────────────────
  const allDocsText = useMemo(() => {
    if (!docsCtx?.pages) return "";
    return docsCtx.pages
      .map(
        (p) =>
          `## ${p.title}\nURL: ${p.url}\nRoute: ${p.route}\n\n${p.content}`
      )
      .join("\n\n---\n\n");
  }, [docsCtx]);

  // ─ find the matching page for the current route ──────────────────────
  const currentPageContent = useMemo(() => {
    if (!docsCtx?.pages || !currentPath) return "";
    // Normalize: strip basePath, trailing slash, hash, query
    const clean = currentPath
      .replace(/^\/docs/, "")
      .replace(/\/+$/, "")
      .replace(/[#?].*$/, "") || "/";
    const page = docsCtx.pages.find((p) => {
      const normRoute = p.route.replace(/\/+$/, "") || "/";
      return normRoute === clean;
    });
    if (!page) return "";
    return `## ${page.title} (CURRENT PAGE)\nURL: ${page.url}\n\n${page.content}`;
  }, [docsCtx, currentPath]);

  // ─ 1. Current page — highest priority ────────────────────────────────
  useCopilotReadable({
    description:
      "CURRENT PAGE the user is viewing — answer about THIS page first when relevant.",
    value: currentPageContent || `User is on: ${currentPath}`,
  });

  // ─ 2. All documentation pages — full original markdown ──────────────
  useCopilotReadable({
    description:
      "COMPLETE DOCUMENTATION — original markdown of every page on the Dspread docs site. " +
      "Quote verbatim from this content. Each section starts with ## Title and URL.",
    value: allDocsText || "Loading documentation…",
  });

  // ─ 3. GitHub repo content ────────────────────────────────────────────
  useCopilotReadable({
    description:
      "GITHUB REPOSITORY CONTENT — READMEs and key files from official Dspread repos. " +
      "Use exact code from this content when users ask about source code.",
    value: githubCtx || "Loading GitHub content…",
  });

  // ─ 4. Product model → category mapping (always available) ────────────
  useCopilotReadable({
    description:
      "PRODUCT MODEL MAPPING — use this to identify which documentation section applies to the user's terminal model.",
    value: `Terminal Model Classification:
Smart POS (Android): D20, D30, D50, D60, D70, D80, D80K → use Android Terminals docs
mPOS / Mobile Reader: QPOS mini, QPOS Cute, CR100, QPOS Plus pinpad → use Android Terminals (mPOS section) or external mPOS docs at https://dspreadorg.github.io/qpos/#/
Linux Terminal: D30-linux, QPOS-linux → use Linux Terminals docs
Cloud Speaker: DS10, DS50, DS200 → use Cloud Speaker docs

Key differences:
- Smart POS runs apps directly on the terminal (UART communication)
- mPOS connects to phone via Bluetooth or USB (external reader)
- Linux terminals use C/C++ SDK with LVGL UI framework
- Cloud Speaker is audio notification device with custom firmware`,
  });

  // ─ Navigation action — AI calls this to jump to a docs page ──────────
  useCopilotAction({
    name: "navigateToPage",
    description:
      "Navigate the user's browser to a specific documentation page. " +
      "Call this EVERY TIME your answer relates to a specific page. " +
      "Use the route from the PAGE ROUTE MAP in your instructions.",
    parameters: [
      {
        name: "route",
        type: "string",
        description:
          'The page route to navigate to, e.g. "/android-terminals/accept-card-payment" or "/linux-terminals/getting-started". Must start with "/".',
        required: true,
      },
      {
        name: "pageTitle",
        type: "string",
        description: "Human-readable title of the page for display.",
        required: true,
      },
    ],
    handler: ({ route, pageTitle }) => {
      if (route && route.startsWith("/")) {
        router.push(route);
        return `Navigated to "${pageTitle}" (${route})`;
      }
      return "Invalid route provided.";
    },
  });

  // ─ Contextual suggestions — smart per-page with navigation intent ────
  useCopilotChatSuggestions({
    instructions: `Generate 3-5 helpful suggestion buttons based on where the user currently is.

IMPORTANT: When a user clicks a suggestion, your response MUST call the navigateToPage action
to take them to the relevant page.

If the user is on the Overview/home page (/), suggest:
- "I have a Smart POS (D20/D30/D60…), how do I start?" → navigate to /android-terminals/overview
- "How do I set up a Linux terminal?" → navigate to /linux-terminals/getting-started
- "What's the difference between Smart POS and mPOS?" → navigate to /how-terminal-works
- "How do I integrate with a payment gateway?" → navigate to /payment-gateway-aws
- "I need help with EMV L3 certification" → navigate to /emv-l3-testing

If on Android pages, suggest:
- "How do I accept card payments?" → navigate to /android-terminals/accept-card-payment
- "How do I print receipts?" → navigate to /android-terminals/print-receipt
- "How to scan QR codes?" → navigate to /android-terminals/scanner-qr-bar-code
- "How do I set up the Android SDK?" → navigate to /android-terminals/set-up-integration

If on Linux pages, suggest:
- "Show me the transaction flow" → navigate to /linux-terminals/transaction-flow
- "What are common issues?" → navigate to /linux-terminals/common-issues
- "Best practices for Linux development" → navigate to /linux-terminals/best-practices

If on payment/encryption pages, suggest:
- "How to decrypt POS data with AWS?" → navigate to /payment-gateway-aws
- "How to manage keys with TR-31?" → navigate to /key-management-aws

Keep suggestions short (under 50 characters) and actionable.`,
    minSuggestions: 3,
    maxSuggestions: 5,
  });

  return (
    <>
      <CopilotSidebar
        instructions={INSTRUCTIONS}
        labels={{
          title: "Dspread Assistant",
          initial:
            "Welcome! I'm your Dspread documentation assistant. 👋\n\n" +
            "To help you best, could you tell me which terminal you're working with?\n\n" +
            "• **Smart POS** — D20, D30, D50, D60, D70, D80, D80K\n" +
            "• **Mobile Reader (mPOS)** — QPOS mini, QPOS Cute, CR100, QPOS Plus\n" +
            "• **Linux Terminal** — D30-linux, QPOS-linux\n" +
            "• **Cloud Speaker** — DS10, DS50, DS200\n\n" +
            "Or just ask any question and I'll guide you!",
        }}
        defaultOpen={true}
        clickOutsideToClose={false}
        className="copilot-sidebar"
      />
      {children}
    </>
  );
}

export default function CopilotKitWrapper({ children }) {
  return (
    <CopilotKit
      publicApiKey="ck_pub_79b8a4d1d6892f3997f82b857495ed8b"
      showDevConsole={false}
    >
      <AppWithContext>{children}</AppWithContext>
    </CopilotKit>
  );
}
