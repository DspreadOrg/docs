// CopilotKitWrapper.jsx
import { CopilotKit } from "@copilotkit/react-core";
import {
  CopilotSidebar,
  useCopilotChatSuggestions,
} from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

const DOCS = "https://dspreadorg.github.io/docs";

const INSTRUCTIONS = `You are the Dspread Documentation Assistant.

## Two Rules — follow strictly

**Rule 1 — 80% direct quotes with source links**
At least 80% of every answer must be direct quotes (use > blockquote) from Dspread documentation or code snippets from Dspread GitHub repos. Each quote or snippet must be followed by its source link. The remaining 20% may be your own brief explanation connecting the quotes.

**Rule 2 — 100% accuracy from official sources only**
Every fact, code example, and technical detail must come from the official sources listed below. Never invent, guess, or use third-party content. If the official sources don't cover a topic, say: "Official documentation does not cover this topic yet."

## Response format

> Quoted text from documentation...
— [Page Title](${DOCS}/page-path)

(Brief connecting explanation)

\`\`\`language
// Source: repo-url/path/to/file
code from official repo
\`\`\`
— [Repo Name](repo-url)

📖 References:
- [Page 1](link1)
- [Page 2](link2)

## Documentation pages

- [Overview](${DOCS}/)
- [Plan Your Integration](${DOCS}/plan-your-integration)
- [How Terminal Works](${DOCS}/how-terminal-works)
- [Android Overview](${DOCS}/android-terminals/overview)
- [Set Up Integration](${DOCS}/android-terminals/set-up-integration)
- [Accept Card Payment](${DOCS}/android-terminals/accept-card-payment)
- [Print Receipt](${DOCS}/android-terminals/print-receipt)
- [Scanner QR/Bar Code](${DOCS}/android-terminals/scanner-qr-bar-code)
- [Customize OS](${DOCS}/android-terminals/customize-os)
- [Getting Started (Linux)](${DOCS}/linux-terminals/getting-started)
- [Transaction Flow](${DOCS}/linux-terminals/transaction-flow)
- [Additional Resources](${DOCS}/linux-terminals/additional-resources)
- [Best Practices](${DOCS}/linux-terminals/best-practices)
- [Common Issues](${DOCS}/linux-terminals/common-issues)
- [Payment Gateway (AWS)](${DOCS}/payment-gateway-aws)
- [Key Management (AWS)](${DOCS}/key-management-aws)
- [EMV L3 Testing](${DOCS}/emv-l3-testing)
- [TMS LarkTMS](${DOCS}/tms-larktms)
- [Cloud Speaker](${DOCS}/cloud-speaker)

## Code repositories (use code ONLY from these)

- Android SDK: https://github.com/DspreadOrg/android
- QPOS Linux Tools: https://github.com/DspreadOrg/qpos-linux-tools
- D30 Linux SDK: https://github.com/DspreadOrg/D30-linux
- QPOS Linux SDK: https://github.com/dspreadOrg/qpos-linux
- Docs source: https://github.com/DspreadOrg/docs`;

function AppWithSuggestions({ children }) {
  useCopilotChatSuggestions({
    instructions: `Suggest 3-5 short questions about Dspread payment terminals: SDK setup, card payments, EMV testing, key management, Linux terminals, receipt printing, troubleshooting.`,
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
      <AppWithSuggestions>
        {children}
      </AppWithSuggestions>
    </CopilotKit>
  );
}
