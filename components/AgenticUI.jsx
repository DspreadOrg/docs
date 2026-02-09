// AgenticUI.jsx
// ---------------------------------------------------------------------------
// Agentic UI components rendered inline in the CopilotKit chat panel.
// These are used via the `render` and `renderAndWaitForResponse` properties
// on useCopilotAction hooks.
// ---------------------------------------------------------------------------
import React from "react";

const DOCS = "https://dspreadorg.github.io/docs";

// ── Route → display metadata ────────────────────────────────────────────
const PAGE_META = {
  "/": { icon: "🏠", label: "Overview" },
  "/plan-your-integration": { icon: "📋", label: "Plan Your Integration" },
  "/how-terminal-works": { icon: "⚙️", label: "How Terminal Works" },
  "/android-terminals/overview": { icon: "📱", label: "Android Overview" },
  "/android-terminals/set-up-integration": { icon: "🔧", label: "Set Up Integration" },
  "/android-terminals/accept-card-payment": { icon: "💳", label: "Accept Card Payment" },
  "/android-terminals/print-receipt": { icon: "🖨️", label: "Print Receipt" },
  "/android-terminals/scanner-qr-bar-code": { icon: "📷", label: "Scanner QR/Bar Code" },
  "/android-terminals/customize-os": { icon: "🎨", label: "Customize OS" },
  "/linux-terminals/getting-started": { icon: "🐧", label: "Linux Getting Started" },
  "/linux-terminals/transaction-flow": { icon: "🔄", label: "Transaction Flow" },
  "/linux-terminals/best-practices": { icon: "✅", label: "Best Practices" },
  "/linux-terminals/common-issues": { icon: "🐛", label: "Common Issues" },
  "/linux-terminals/additional-resources": { icon: "📚", label: "Additional Resources" },
  "/cloud-speaker": { icon: "🔊", label: "Cloud Speaker" },
  "/key-management-aws": { icon: "🔐", label: "Key Management (AWS)" },
  "/payment-gateway-aws": { icon: "🌐", label: "Payment Gateway (AWS)" },
  "/emv-l3-testing": { icon: "🧪", label: "EMV L3 Testing" },
  "/tms-larktms": { icon: "📡", label: "TMS / LarkTMS" },
};

// ── Product category metadata ───────────────────────────────────────────
const PRODUCT_CATEGORIES = [
  {
    id: "smartpos",
    label: "Smart POS (Android)",
    icon: "📱",
    models: "D20, D30, D50, D60, D70, D80, D80K",
    color: "#3b82f6",
    description: "Full Android POS terminals with built-in apps",
  },
  {
    id: "mpos",
    label: "mPOS / Mobile Reader",
    icon: "📲",
    models: "QPOS mini, QPOS Cute, CR100, QPOS Plus",
    color: "#8b5cf6",
    description: "Bluetooth/USB readers paired with phone",
  },
  {
    id: "linux",
    label: "Linux Terminal",
    icon: "🐧",
    models: "D30-linux, QPOS-linux",
    color: "#10b981",
    description: "Linux-based POS with C/C++ SDK",
  },
  {
    id: "cloud-speaker",
    label: "Cloud Speaker",
    icon: "🔊",
    models: "DS10, DS50, DS200",
    color: "#f59e0b",
    description: "Audio payment notification devices",
  },
];

// ═══════════════════════════════════════════════════════════════════════
// NavigationCard — rendered inline when AI navigates to a docs page
// ═══════════════════════════════════════════════════════════════════════
export function NavigationCard({ route, pageTitle, status }) {
  const meta = PAGE_META[route] || { icon: "📄", label: pageTitle || route };
  const isComplete = status === "complete";
  const fullUrl = `${DOCS}${route}`;

  return (
    <div className={`agentic-card agentic-nav-card ${isComplete ? "agentic-card-complete" : "agentic-card-executing"}`}>
      <div className="agentic-card-header">
        <span className="agentic-card-icon">{meta.icon}</span>
        <span className="agentic-card-badge">
          {isComplete ? "✓ Navigated" : "⏳ Navigating…"}
        </span>
      </div>
      <div className="agentic-card-title">{meta.label}</div>
      <div className="agentic-card-route">{route}</div>
      {isComplete && (
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="agentic-card-link"
        >
          Open in new tab →
        </a>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ProductSelector — interactive product type picker (renderAndWaitForResponse)
// ═══════════════════════════════════════════════════════════════════════
export function ProductSelector({ respond, status }) {
  if (status === "complete") {
    return (
      <div className="agentic-card agentic-card-complete">
        <div className="agentic-card-header">
          <span className="agentic-card-icon">✅</span>
          <span className="agentic-card-badge">Product Selected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="agentic-card agentic-product-selector">
      <div className="agentic-card-header">
        <span className="agentic-card-icon">🎯</span>
        <span className="agentic-card-title" style={{ marginLeft: 8 }}>
          Select your product type
        </span>
      </div>
      <p className="agentic-card-subtitle">
        Click a product to get targeted documentation:
      </p>
      <div className="agentic-product-grid">
        {PRODUCT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className="agentic-product-btn"
            style={{ "--product-color": cat.color }}
            onClick={() =>
              respond?.(
                `I'm using a ${cat.label} terminal. Models: ${cat.models}`
              )
            }
          >
            <span className="agentic-product-icon">{cat.icon}</span>
            <span className="agentic-product-label">{cat.label}</span>
            <span className="agentic-product-models">{cat.models}</span>
            <span className="agentic-product-desc">{cat.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RelatedPagesCard — displays a grid of related documentation pages
// ═══════════════════════════════════════════════════════════════════════
export function RelatedPagesCard({ pages, status, onNavigate }) {
  const isComplete = status === "complete";

  // pages is an array of { route, title }
  const displayPages = (pages || []).slice(0, 6);

  if (!displayPages.length) {
    return null;
  }

  return (
    <div className={`agentic-card agentic-related-card ${isComplete ? "agentic-card-complete" : "agentic-card-executing"}`}>
      <div className="agentic-card-header">
        <span className="agentic-card-icon">📚</span>
        <span className="agentic-card-title" style={{ marginLeft: 8 }}>
          Related Documentation
        </span>
      </div>
      <div className="agentic-pages-grid">
        {displayPages.map((page, i) => {
          const meta = PAGE_META[page.route] || { icon: "📄", label: page.title };
          return (
            <button
              key={i}
              className="agentic-page-btn"
              onClick={() => onNavigate?.(page.route)}
            >
              <span className="agentic-page-icon">{meta.icon}</span>
              <span className="agentic-page-label">{meta.label}</span>
              <span className="agentic-page-route">{page.route}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ProgressCard — shows step-by-step progress during multi-step actions
// ═══════════════════════════════════════════════════════════════════════
export function ProgressCard({ title, steps, currentStep, status }) {
  return (
    <div className={`agentic-card agentic-progress-card ${status === "complete" ? "agentic-card-complete" : "agentic-card-executing"}`}>
      <div className="agentic-card-header">
        <span className="agentic-card-icon">
          {status === "complete" ? "✅" : "⚡"}
        </span>
        <span className="agentic-card-title" style={{ marginLeft: 8 }}>
          {title}
        </span>
      </div>
      <div className="agentic-steps">
        {(steps || []).map((step, i) => {
          const isDone = i < currentStep;
          const isCurrent = i === currentStep && status !== "complete";
          return (
            <div
              key={i}
              className={`agentic-step ${isDone ? "agentic-step-done" : ""} ${isCurrent ? "agentic-step-active" : ""}`}
            >
              <span className="agentic-step-indicator">
                {isDone ? "✓" : isCurrent ? "●" : "○"}
              </span>
              <span className="agentic-step-text">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
