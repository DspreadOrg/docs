#!/usr/bin/env node
/**
 * generate-docs-context.js
 *
 * Reads every .mdx page (excluding _app.mdx) from the pages/ directory,
 * resolves titles from _meta.json files, and writes a compact JSON file
 * to public/docs-context.json that CopilotKitWrapper loads at runtime.
 *
 * Run: node scripts/generate-docs-context.js
 */

const fs = require("fs");
const path = require("path");

const PAGES_DIR = path.resolve(__dirname, "../pages");
const OUT_FILE = path.resolve(__dirname, "../public/docs-context.json");
const DOCS_BASE = "https://dspreadorg.github.io/docs";

// ── helpers ────────────────────────────────────────────────────────────
function loadMeta(dir) {
  const metaPath = path.join(dir, "_meta.json");
  if (fs.existsSync(metaPath)) {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  }
  return {};
}

function titleFromMeta(meta, slug) {
  const entry = meta[slug];
  if (!entry) return slug;
  if (typeof entry === "string") return entry;
  if (typeof entry === "object" && entry.title) return entry.title;
  return slug;
}

function routeFromFile(filePath) {
  let rel = path.relative(PAGES_DIR, filePath).replace(/\\/g, "/");
  // Remove .mdx extension
  rel = rel.replace(/\.mdx$/, "");
  // index → root
  if (rel === "index") return "/";
  if (rel.endsWith("/index")) return "/" + rel.replace(/\/index$/, "");
  return "/" + rel;
}

// ── walk pages/ recursively ────────────────────────────────────────────
function collectPages(dir, results = []) {
  const meta = loadMeta(dir);
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectPages(fullPath, results);
      continue;
    }

    if (!entry.name.endsWith(".mdx")) continue;
    if (entry.name === "_app.mdx") continue;

    const slug = entry.name.replace(/\.mdx$/, "");
    const route = routeFromFile(fullPath);
    const url = `${DOCS_BASE}${route === "/" ? "/" : route + "/"}`;

    // Resolve title: check current dir meta first, then parent
    let title = titleFromMeta(meta, slug);
    if (title === slug) {
      // Fallback: prettify slug
      title = slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }

    // Read raw MDX content
    const raw = fs.readFileSync(fullPath, "utf-8");

    // Strip import/export statements and JSX components for cleaner context,
    // but keep everything else (headings, text, code blocks, lists, etc.)
    const cleaned = raw
      .replace(/^import\s+.*$/gm, "")
      .replace(/^export\s+.*$/gm, "")
      // Remove self-closing JSX tags like <FeatureCards />, <ResponsiveImage ... />
      .replace(/<[A-Z]\w+\s*[^>]*\/>/g, "")
      // Remove JSX opening+closing pairs that span single lines
      .replace(/<[A-Z]\w+[^>]*>.*?<\/[A-Z]\w+>/gs, "")
      // Remove standalone opening/closing JSX tags
      .replace(/<\/?[A-Z]\w+[^>]*>/g, "")
      // Collapse multiple blank lines
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    results.push({
      slug,
      route,
      url,
      title,
      content: cleaned,
    });
  }

  return results;
}

// ── main ───────────────────────────────────────────────────────────────
const pages = collectPages(PAGES_DIR);

// Sort: index first, then alphabetical by route
pages.sort((a, b) => {
  if (a.route === "/") return -1;
  if (b.route === "/") return 1;
  return a.route.localeCompare(b.route);
});

const output = {
  generatedAt: new Date().toISOString(),
  baseUrl: DOCS_BASE,
  pageCount: pages.length,
  pages,
};

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), "utf-8");

console.log(
  `✅ Generated docs-context.json — ${pages.length} pages, ${(
    Buffer.byteLength(JSON.stringify(output)) / 1024
  ).toFixed(1)} KB`
);
