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
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAllGithubContent } from "../utils/fetchGithubContent";
import {
  NavigationCard,
  ProductSelector,
  RelatedPagesCard,
  ProgressCard,
} from "./AgenticUI";

const DOCS = "https://dspreadorg.github.io/docs";

// Valid routes — used to validate AI navigation and build full URLs.
const VALID_ROUTES = [
  "/",
  "/plan-your-integration",
  "/how-terminal-works",
  "/android-terminals/overview",
  "/android-terminals/set-up-integration",
  "/android-terminals/accept-card-payment",
  "/android-terminals/print-receipt",
  "/android-terminals/scanner-qr-bar-code",
  "/android-terminals/customize-os",
  "/linux-terminals/getting-started",
  "/linux-terminals/transaction-flow",
  "/linux-terminals/best-practices",
  "/linux-terminals/common-issues",
  "/linux-terminals/additional-resources",
  "/cloud-speaker",
  "/key-management-aws",
  "/payment-gateway-aws",
  "/emv-l3-testing",
  "/tms-larktms",
];

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
When your answer relates to a specific documentation page, call the **navigateToPage** action to navigate the user's browser to that page. This is MANDATORY — do not just provide links, actively navigate. A styled navigation card will appear in the chat.

### Step 4 — Use Agentic UI actions for better UX
You have several visual actions that render interactive cards in the chat:

1. **selectProductType** — At the START of a conversation, if the user's product type is unknown, call this action. It shows an interactive product selector card with buttons. Wait for the user's choice before proceeding.

2. **showRelatedPages** — At the END of your answer, call this to show a card with clickable links to related documentation pages. Always include 2-4 relevant pages.

3. **showIntegrationGuide** — When walking a user through a multi-step process (SDK setup, payment flow, certification), call this to show a numbered step-by-step card. Update the currentStep index as you progress.

CRITICAL: These actions render visual UI IN the chat. Use them proactively to create a rich, interactive experience. Don't just use text when a card would be more helpful.

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

**Rule 2 — EVERY paragraph MUST have a clickable source link.**
This is CRITICAL. After EVERY quote, code block, or factual statement, you MUST
insert a clickable markdown link to the source page in this exact format:
  — [Page Title](${DOCS}/page-path/)
The link MUST use the full URL starting with ${DOCS}.
NEVER write a response without source links. If you have 3 paragraphs, you need at least 3 links.

**Rule 3 — If not covered, say so.**
If the context doesn't cover the topic: "Official documentation does not cover this topic yet."

**Rule 4 — Navigate proactively.**
After answering, ALWAYS call navigateToPage to navigate the browser. Use ONLY
routes from the PAGE ROUTE MAP above. NEVER invent routes that are not in the map.

## RESPONSE FORMAT — follow exactly

> Verbatim quote from documentation…

— [Page Title](${DOCS}/page-path/)

\`\`\`language
// exact code from official source
\`\`\`
— [Source](${DOCS}/page-path/)

📖 **References** (MANDATORY — list every page cited with full URL):
- [Page Title 1](${DOCS}/page-path-1/)
- [Page Title 2](${DOCS}/page-path-2/)

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
    // Use router.basePath (reliable) instead of module-scope constant
    const bp = router.basePath || "";
    fetch(`${bp}/docs-context.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setDocsCtx)
      .catch((err) =>
        console.warn("[CopilotKit] Could not load docs-context.json:", err)
      );
  }, [router.basePath]);

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
  const currentPage = useMemo(() => {
    if (!docsCtx?.pages || !currentPath) return null;
    // Normalize: strip basePath, trailing slash, hash, query
    const clean = currentPath
      .replace(/^\/docs/, "")
      .replace(/\/+$/, "")
      .replace(/[#?].*$/, "") || "/";
    return docsCtx.pages.find((p) => {
      const normRoute = p.route.replace(/\/+$/, "") || "/";
      return normRoute === clean;
    }) || null;
  }, [docsCtx, currentPath]);

  const currentPageContent = useMemo(() => {
    if (!currentPage) return "";
    return `## ${currentPage.title} (CURRENT PAGE)\nURL: ${currentPage.url}\n\n${currentPage.content}`;
  }, [currentPage]);

  // Extract headings from current page for suggestion generation
  const currentPageHeadings = useMemo(() => {
    if (!currentPage?.content) return [];
    const matches = currentPage.content.match(/^#{1,3}\s+.+$/gm) || [];
    return matches.map((h) => h.replace(/^#+\s+/, "")).slice(0, 8);
  }, [currentPage]);

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

  // ─ helper for child actions that need to navigate ─────────────────────
  const handleNavigate = useCallback(
    (route) => {
      const normalized = (route || "").replace(/\/+$/, "") || "/";
      if (VALID_ROUTES.includes(normalized)) {
        router.push(normalized);
      }
    },
    [router],
  );

  // ─ Navigation action — AI calls this to jump to a docs page ──────────
  // Now with AGENTIC UI: renders a styled card inline in the chat.
  useCopilotAction({
    name: "navigateToPage",
    description:
      "Navigate the user's browser to a specific documentation page. " +
      "Call this EVERY TIME your answer relates to a specific page. " +
      "ONLY use routes from the PAGE ROUTE MAP. Valid routes: " +
      VALID_ROUTES.join(", "),
    parameters: [
      {
        name: "route",
        type: "string",
        description:
          'The page route to navigate to. MUST be one of the valid routes from the PAGE ROUTE MAP. Example: "/android-terminals/accept-card-payment"',
        required: true,
        enum: VALID_ROUTES,
      },
      {
        name: "pageTitle",
        type: "string",
        description: "Human-readable title of the page for display.",
        required: true,
      },
    ],
    handler: ({ route, pageTitle }) => {
      // Normalize: strip trailing slash for comparison
      const normalized = (route || "").replace(/\/+$/, "") || "/";
      if (!VALID_ROUTES.includes(normalized)) {
        // Find closest match
        const match = VALID_ROUTES.find((r) =>
          r.includes(normalized.split("/").pop())
        );
        if (match) {
          router.push(match);
          return `Navigated to "${pageTitle}" (${match}) [auto-corrected from ${route}]`;
        }
        return `Invalid route "${route}". Valid routes: ${VALID_ROUTES.join(", ")}`;
      }
      router.push(normalized);
      return `Navigated to "${pageTitle}" (${normalized})`;
    },
    // ── Agentic UI: show navigation card in chat ──
    render: ({ args, status }) => (
      <NavigationCard
        route={args?.route || "/"}
        pageTitle={args?.pageTitle || ""}
        status={status}
      />
    ),
  });

  // ─ Product selector action — interactive product type picker ──────────
  // Uses renderAndWaitForResponse: the AI pauses while user picks a product.
  useCopilotAction({
    name: "selectProductType",
    description:
      "Show an interactive product type selector card. Call this when you need " +
      "the user to choose their product type (Smart POS, mPOS, Linux, Cloud Speaker) " +
      "and you want to present a visual picker instead of asking via text. " +
      "ONLY call this once at the start of a conversation when the product type is unknown.",
    parameters: [],
    renderAndWaitForResponse: ({ respond, status }) => (
      <ProductSelector respond={respond} status={status} />
    ),
  });

  // ─ Show related pages action — displays a grid of related pages ───────
  useCopilotAction({
    name: "showRelatedPages",
    description:
      "Show a card with related documentation pages. Call this when you want to " +
      "recommend multiple pages to the user, for example at the end of an answer. " +
      "Pass an array of pages with route and title.",
    parameters: [
      {
        name: "pages",
        type: "object[]",
        description: "Array of related pages to display",
        attributes: [
          {
            name: "route",
            type: "string",
            description: "Page route (must be a valid route from PAGE ROUTE MAP)",
            required: true,
          },
          {
            name: "title",
            type: "string",
            description: "Human-readable page title",
            required: true,
          },
        ],
        required: true,
      },
    ],
    handler: ({ pages }) => {
      return `Showing ${(pages || []).length} related pages.`;
    },
    render: ({ args, status }) => (
      <RelatedPagesCard
        pages={args?.pages || []}
        status={status}
        onNavigate={handleNavigate}
      />
    ),
  });

  // ─ Progress/guide action — shows step-by-step integration guide ───────
  useCopilotAction({
    name: "showIntegrationGuide",
    description:
      "Show a step-by-step progress card for integration guidance. " +
      "Use this when walking a user through a multi-step process like " +
      "SDK setup, payment integration, or certification. " +
      "Provide the list of steps and the current step index (0-based).",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "Title of the integration guide. E.g. 'Android SDK Setup'",
        required: true,
      },
      {
        name: "steps",
        type: "string[]",
        description: "List of step descriptions in order.",
        required: true,
      },
      {
        name: "currentStep",
        type: "number",
        description: "The index of the current step being worked on (0-based).",
        required: true,
      },
    ],
    handler: ({ title, steps, currentStep }) => {
      return `Integration guide: "${title}" — step ${currentStep + 1} of ${(steps || []).length}`;
    },
    render: ({ args, status }) => (
      <ProgressCard
        title={args?.title || "Guide"}
        steps={args?.steps || []}
        currentStep={args?.currentStep ?? 0}
        status={status}
      />
    ),
  });

  // ─ Dynamic suggestion instructions based on current page ──────────────
  const suggestionInstructions = useMemo(() => {
    const pageTitle = currentPage?.title || "Overview";
    const route = currentPage?.route || "/";
    const headings = currentPageHeadings.length > 0
      ? `\nThis page has these sections: ${currentPageHeadings.join(", ")}`
      : "";

    // Determine which sibling/related pages to suggest
    let relatedSuggestions = "";
    if (route === "/" || !currentPage) {
      relatedSuggestions = `
Suggest these topics (pick 3-5):
- "I have a Smart POS (D30/D60), how do I start?"
- "How do I set up a Linux terminal?"
- "What's the difference between Smart POS and mPOS?"
- "How do I integrate with a payment gateway?"
- "I need help with EMV L3 certification"
- "How does the Cloud Speaker work?"`;
    } else if (route.startsWith("/android-terminals")) {
      relatedSuggestions = `
The user is reading Android terminal docs. Suggest questions about:
- Accepting card payments (if not on that page)
- Printing receipts (if not on that page)
- Scanning QR/Bar codes (if not on that page)
- Setting up the SDK (if not on that page)
- Customizing the OS
Also suggest 1-2 questions SPECIFIC to this page's content based on the headings.`;
    } else if (route.startsWith("/linux-terminals")) {
      relatedSuggestions = `
The user is reading Linux terminal docs. Suggest questions about:
- Getting started with Linux SDK (if not on that page)
- Transaction flow details (if not on that page)
- Common issues and troubleshooting
- Best practices
Also suggest 1-2 questions SPECIFIC to this page's content based on the headings.`;
    } else if (route === "/cloud-speaker") {
      relatedSuggestions = `
The user is reading Cloud Speaker docs. Suggest questions about:
- How to compile and build firmware
- OTA update process
- Device type configuration
- How to set up the development environment`;
    } else if (route.includes("payment-gateway") || route.includes("key-management")) {
      relatedSuggestions = `
The user is reading payment/encryption docs. Suggest questions about:
- Decrypting POS terminal data with AWS
- DUKPT key management
- TR-31 key export/import
- How to send encrypted data from the terminal`;
    } else if (route === "/emv-l3-testing") {
      relatedSuggestions = `
The user is reading EMV L3 testing docs. Suggest questions about:
- Which countries are supported for L3 certification
- How to download test configurations for a specific country
- What terminal models are supported
- Firmware download for certification`;
    } else {
      relatedSuggestions = `
Suggest 3-5 questions relevant to "${pageTitle}" based on the page content and headings.`;
    }

    return `The user is currently on the "${pageTitle}" page (route: ${route}).${headings}

Generate 3-5 short suggestion buttons (under 50 characters each) that are SPECIFIC to this page's content.

IMPORTANT: When the user clicks a suggestion, your response MUST:
1. Answer the question using content from the documentation
2. Call the navigateToPage action if the answer relates to a different page
${relatedSuggestions}

Make sure each suggestion is a natural question a developer would ask while reading this specific page.`;
  }, [currentPage, currentPageHeadings]);

  // ─ Contextual suggestions — dynamically generated per page ───────────
  useCopilotChatSuggestions(
    {
      instructions: suggestionInstructions,
      minSuggestions: 3,
      maxSuggestions: 5,
    },
    [currentPath],
  );

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
