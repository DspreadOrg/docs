/**
 * fetchGithubContent.js
 *
 * Fetches key files (READMEs, code samples) from Dspread's public GitHub repos
 * using the GitHub raw content API. Results are cached in sessionStorage to
 * avoid redundant network calls.
 *
 * All fetches are best-effort — failures are silently swallowed so the chat
 * assistant always starts up, even if GitHub is unreachable.
 */

const GITHUB_RAW = "https://raw.githubusercontent.com";

/**
 * Official Dspread repositories and the files we want to pull into the
 * AI context. Keep each entry small enough that the combined payload
 * stays well under the CopilotKit context-window budget.
 */
const REPO_FILES = [
  // ── Android SDK ───────────────────────────────────────────────────────
  {
    repo: "DspreadOrg/android",
    branch: "master",
    files: ["README.md"],
    label: "Android SDK repo",
  },
  // ── QPOS Linux Tools ─────────────────────────────────────────────────
  {
    repo: "DspreadOrg/qpos-linux-tools",
    branch: "main",
    files: [
      "README.md",
      "EnvironmentBuilding/DevelopEnvironmentGuide.md",
    ],
    label: "QPOS Linux Tools repo",
  },
  // ── D30 Linux SDK ────────────────────────────────────────────────────
  {
    repo: "DspreadOrg/D30-linux",
    branch: "main",
    files: ["README.md"],
    label: "D30 Linux SDK repo",
  },
  // ── QPOS Linux SDK ──────────────────────────────────────────────────
  {
    repo: "dspreadOrg/qpos-linux",
    branch: "main",
    files: ["README.md"],
    label: "QPOS Linux SDK repo",
  },
  // ── This documentation site ──────────────────────────────────────────
  {
    repo: "DspreadOrg/docs",
    branch: "main",
    files: ["README.md"],
    label: "Documentation repo",
  },
];

const CACHE_KEY = "dspread_github_ctx";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ── helpers ────────────────────────────────────────────────────────────

function rawUrl(repo, branch, filePath) {
  return `${GITHUB_RAW}/${repo}/${branch}/${filePath}`;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  // Hard-cap individual files at ~12 KB to stay within token budget
  return text.length > 12_000 ? text.slice(0, 12_000) + "\n…[truncated]" : text;
}

function tryCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Storage full or unavailable — ignore
  }
}

// ── public API ─────────────────────────────────────────────────────────

/**
 * Fetch all configured repo files and return a combined markdown string
 * ready to be passed to `useCopilotReadable`.
 *
 * @returns {Promise<string>} Combined content from GitHub repos.
 */
export async function fetchAllGithubContent() {
  // Check cache first
  const cached = tryCache(CACHE_KEY);
  if (cached) return cached;

  const sections = [];

  for (const entry of REPO_FILES) {
    const { repo, branch, files, label } = entry;
    const fileContents = await Promise.all(
      files.map(async (fp) => {
        const text = await fetchText(rawUrl(repo, branch, fp));
        if (!text) return null;
        return `### ${fp}\nSource: https://github.com/${repo}/blob/${branch}/${fp}\n\n${text}`;
      })
    );

    const valid = fileContents.filter(Boolean);
    if (valid.length > 0) {
      sections.push(`## ${label} — ${repo}\n\n${valid.join("\n\n---\n\n")}`);
    }
  }

  const result = sections.join("\n\n===\n\n");
  setCache(CACHE_KEY, result);
  return result;
}
