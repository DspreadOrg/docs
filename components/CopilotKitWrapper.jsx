// CopilotKitWrapper.jsx
// ---------------------------------------------------------------------------
// Feeds REAL documentation content (from build-time generated docs-context.json)
// and GitHub repository code into CopilotKit so the AI assistant answers
// exclusively from official Dspread sources.
// ---------------------------------------------------------------------------
import { CopilotKit, useCopilotReadable } from "@copilotkit/react-core";
import {
  CopilotSidebar,
  useCopilotChatSuggestions,
} from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAllGithubContent } from "../utils/fetchGithubContent";

const DOCS = "https://dspreadorg.github.io/docs";

// Resolve basePath at runtime so the JSON fetch works in both dev & prod.
const BASE_PATH =
  typeof window !== "undefined" && window.__NEXT_DATA__?.basePath
    ? window.__NEXT_DATA__.basePath
    : "";

// ── System prompt ───────────────────────────────────────────────────────
const INSTRUCTIONS = `You are the Dspread Documentation Assistant.

## STRICT RULES — follow every one, no exceptions.

**Rule 1 — Answer ONLY from the provided context.**
You have been given:
  A) DOCUMENTATION CONTENT — the full text of every page on the Dspread docs site.
  B) GITHUB REPO CONTENT — READMEs and key source files from official Dspread repos.
  C) CURRENT PAGE — the page the user is viewing right now; prioritize it.
Use ONLY these three sources. NEVER fabricate, guess, or use outside knowledge.

**Rule 2 — 80 %+ direct quotes with source links.**
At least 80 % of every answer MUST be verbatim quotes (use > blockquote) from the
DOCUMENTATION CONTENT, or code snippets copied exactly from Dspread GitHub repos.
Every quote or code block MUST be followed by a source link.

**Rule 3 — If not covered, say so.**
If the provided context does not cover the topic, reply exactly:
"Official documentation does not cover this topic yet."

## Required response format

> Verbatim quote from documentation…
— [Page Title](${DOCS}/page-path)

(Brief connecting sentence — max 20 %)

\`\`\`language
// Source: repo-url/path/to/file
exact code from official repo or documentation
\`\`\`
— [Source Name](source-url)

📖 References (list every page cited):
- [Page 1](link)
- [Page 2](link)

## Official Code Repositories (use code ONLY from these)
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

  // ─ Contextual suggestions ────────────────────────────────────────────
  useCopilotChatSuggestions({
    instructions: `Based on the CURRENT PAGE the user is viewing, suggest 3-5 short,
relevant questions. If on the overview page, suggest broad questions about
SDK setup, card payments, Linux terminals, EMV testing, key management.
If on a specific page, suggest questions specific to that page's topic.`,
    minSuggestions: 3,
    maxSuggestions: 5,
  });

  return (
    <>
      <CopilotSidebar
        instructions={INSTRUCTIONS}
        labels={{
          title: "Dspread Assistant",
          initial: "How can I help you with Dspread documentation today?",
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
