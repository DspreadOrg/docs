// CopilotKitWrapper.jsx
import { CopilotKit, useCopilotReadable } from "@copilotkit/react-core";
import {
  CopilotSidebar,
  useCopilotChatSuggestions,
} from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const DOCS = "https://dspreadorg.github.io/docs";

// ── Two-rule system prompt ──────────────────────────────────────────────
const INSTRUCTIONS = `You are the Dspread Documentation Assistant.

## TWO RULES — follow strictly, no exceptions.

**Rule 1 — 80 % direct quotes with source links.**
At least 80 % of every answer MUST be verbatim quotes (use > blockquote) from the DOCUMENTATION CONTENT provided below, or code snippets copied exactly from Dspread GitHub repos.
Every quote or code block MUST be followed by a source link.
Your own words (connecting sentences, summaries) may NOT exceed 20 %.

**Rule 2 — 100 % accuracy from official sources only.**
Every fact, code example, and technical detail MUST come from the DOCUMENTATION CONTENT below or the listed GitHub repos. NEVER invent, guess, or use third-party content.
If the provided documentation does not cover the topic, reply exactly:
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

// ── Full documentation content (the AI reads this to quote from) ────────
const DOC_CONTENT = {
  "overview": {
    title: "Overview",
    url: `${DOCS}/`,
    content: `Welcome to our website, your one-stop destination for all things SmartPOS, MiniPOS, and VoiceBox terminals. Discover essential product details, comprehensive user guides, and in-depth SDK integration documentation. We also answer common questions to ensure you maximize our technologies.`
  },
  "plan-your-integration": {
    title: "Plan Your Integration",
    url: `${DOCS}/plan-your-integration`,
    content: `Plan your integration — step-by-step:
1. Creating your payment app (1 week) — Add smart pos payment SDK into your project.
2. Integrate with your payment gateway (1-2 weeks) — Submit card data to the payment gateway endpoint for processing and authorization.
3. Certify with your payment acquirer (1-2 weeks) — Submit your app and terminal for EMV L3 certification with your acquirer. Make sure the whole payment solution is compliance with PCI security.
4. Customize with your own brand (1 week) — Provide the OS design files for your own brand.
5. Prepare for production — Provide SBOM (Software Bill Of Materials) for production according to the template.`
  },
  "how-terminal-works": {
    title: "How Terminal Works",
    url: `${DOCS}/how-terminal-works`,
    content: `Dspread Terminal deployment consists of four main components:
- Your mobile payment app
- Your backend
- Dspread pos terminal
- Dspread pos SDK

The SDK facilitates communication between your payment application and terminal so you can accept in-person card payments and Tap to Pay iPhone and android devices.`
  },
  "android-overview": {
    title: "Android Terminals Overview",
    url: `${DOCS}/android-terminals/overview`,
    content: `SDK Compatibility for Smart Terminals and mPOS Terminals.
Our single SDK seamlessly supports both smart terminals and mPOS terminals, with varying operational prototypes.

- Smart POS: These are highly integrated devices, allowing developers to run their apps directly on the terminal.
- mPOS: These terminals require connectivity with a merchant's smartphone via Bluetooth or USB to function.

Despite these operational differences, the SDK remains consistent across both types. Please see detailed implementation for different terminal types in the Accept Card Payment guide.`
  },
  "android-setup": {
    title: "Set Up Integration",
    url: `${DOCS}/android-terminals/set-up-integration`,
    content: `Development Environment:
Good to know: For development convenience, our terminals come in debug mode by default, with:
- ADB enabled: ADB commands help developers install or debug apps, which is not secure for payment terminals. We disable ADB on release version devices for security, and apps can only be installed by OTA with TMS.
- Debug watermark: This helps avoid developer misuse of development samples and production devices. The debug watermark will be removed on release production devices.
- Keystore: The purpose of the keystore file is to prevent unknown apps from being installed and breaking device security. You need to use the Dspread keystore file to sign your app to install it on a debug device. For production devices, we will use your own keystore signature extracted from your signed APK. Download keystore: https://github.com/DspreadOrg/android/blob/master/pos_android_studio_demo/pos_android_app/app.keystore

Smart POS SDK:
| Module | Download | Description |
| Payment | dspread_pos_sdk.jar (https://github.com/DspreadOrg/android/releases) | Handles card reading and pinpad functionalities |
| Printer | dspread_print_sdk.aar (https://github.com/DspreadOrg/android/releases) | Prints receipts |
| Scanner | Refer to scanner intent service | - |

build.gradle dependencies:
  implementation 'com.dspread.print:dspread_print_sdk:1.3.9-beta'
  implementation 'com.dspread.library:dspread_pos_sdk:7.0.7'

Sample Code and Demo:
- Demo APK download: https://github.com/DspreadOrg/android/releases
- Demo source code: https://github.com/DspreadOrg/android`
  },
  "android-payment": {
    title: "Accept Card Payment",
    url: `${DOCS}/android-terminals/accept-card-payment`,
    content: `Step-by-step card payment flow:

1. Initialize SDK:
SmartPOS:
  registerConnectionCallback(callback);
  posType = POS_TYPE.UART;
  initMode(QPOSService.CommunicationMode.UART);
  pos.openUart();

mPOS:
  registerConnectionCallback(callback);
  if(deviceAddress.contains(":")){
    posType = POS_TYPE.BLUETOOTH;
    initMode(QPOSService.CommunicationMode.BLUETOOTH);
    pos.setDeviceAddress("AA:BB:CC:DD:EE:FF");
    pos.connectBluetoothDevice(true, 25, deviceAddress);
  } else {
    posType = POS_TYPE.USB;
    UsbDevice usbDevice = USBClass.getMdevices().get(deviceAddress);
    initMode(QPOSService.CommunicationMode.USB_OTG_CDC_ACM);
    pos.openUsb(usbDevice);
  }

2. Start Payment:
  pos.setAmount(amount, cashbackAmount, "156", TransactionType.GOODS);
  pos.doTrade(60);

3. onDoTradeResult:
CHIP: if (result == DoTradeResult.ICC) { pos.doEmvApp(EmvOption.START); }
NFC: if (result == DoTradeResult.NFC_ONLINE || result == DoTradeResult.NFC_OFFLINE) — returns formatID, maskedPAN, expiryDate, cardHolderName, encTracks, encTrack1, encTrack2, pinKsn, trackksn, pinBlock, encPAN etc.
MSR: if (result == DoTradeResult.MSR) — returns same fields as NFC.

4. EMV Application Selection:
  onRequestSelectEmvApp(ArrayList<String> appList) { pos.selectEmvApp(position); }

5. PIN Entry:
SmartPOS: onQposRequestPinResult — uses MyKeyboardView with pos.pinMapSync(value, 20) and random keyboard.
mPOS: onRequestDisplay — shows "Inputting pin" alert dialog.
CR100: onRequestSetPin — uses PinPadDialog with QPOSUtil.buildCvmPinBlock for ISO format4 pin block, pos.sendCvmPin(pinBlock, true).

6. Online Authorization:
  onRequestOnlineProcess(String tlv) {
    response = sendTlvToServer();
    pos.sendOnlineProcessResult(response);
    // response should contain tag 8A (Authorisation Response Code) and tag 91 (Issuer Authentication Data)
  }

7. Confirm Payment:
  onRequestTransactionResult(TransactionResult transactionResult) — handles APPROVED, TERMINATED, DECLINED, CANCEL, CAPK_FAIL, NOT_ICC, SELECT_APP_FAIL, DEVICE_ERROR, CARD_NOT_SUPPORTED, MISSING_MANDATORY_DATA, CARD_BLOCKED_OR_NO_EMV_APPS, INVALID_ICC_DATA.

8. Reversal Handling:
If the EMV chip card refuses the transaction, but the transaction was approved by the issuer, a reversal procedure should be initiated by the mobile app. onReturnReversalData(String tlv) provides reversal data.

9. Error codes:
TIMEOUT, COM_NOT_AVAILABLE, DEVICE_RESET, DEVICE_BUSY, INPUT_OUT_OF_RANGE, INPUT_INVALID_FORMAT, INPUT_INVALID, AMOUNT_OUT_OF_LIMIT, MAC_ERROR.`
  },
  "android-print": {
    title: "Print Receipt",
    url: `${DOCS}/android-terminals/print-receipt`,
    content: `Print Receipt:
Download printer SDK API document (PDF): https://github.com/DspreadOrg/android/blob/master/QPOS-Android-PrinterSDK-Userguid-en-detail.pdf

build.gradle: implementation 'com.dspread.print:dspread_print_sdk:1.3.9-beta'

PrintTicketActivity handles receipt printing for POS. Flow:
1. Start print: Intent with terAmount, maskedPAN, terminalTime, transactionTime extras.
2. Receipt Generation: Data Collection → Bitmap Generation → Display/Print.
3. Normal devices: preview shown, user clicks "Print Ticket", calls viewModel.printTicket(mBitmap).
4. Small devices (320x240 or smaller): Auto-prints without preview.
5. Print Results: onReturnPrintResult(boolean isSuccess, String status, PrinterDevice.ResultType resultType)
   Success: "Print Successful" dialog, navigates to MainActivity after 3 seconds.
   Failures: NOPAPER, LOWERBATTERY, OVERHEATING.
6. Animation: startPrintAnimation() moves receipt image upward with fade effect.
7. Resource Management: Bitmaps properly recycled in onDestroy().`
  },
  "android-scanner": {
    title: "Scanner QR/Bar Code",
    url: `${DOCS}/android-terminals/scanner-qr-bar-code`,
    content: `Scanner QR/Bar Code:
We provide the QR/Bar code payment function in the form of a service.

Code to start scanning service:
  Intent intent = new Intent();
  ComponentName comp = new ComponentName("com.dspread.components.scan.service", "com.dspread.components.scan.service.ScanActivity");
  intent.putExtra("amount", "CHARGE ￥1");
  intent.setComponent(comp);
  launcher.launch(intent);`
  },
  "android-customize-os": {
    title: "Customize OS",
    url: `${DOCS}/android-terminals/customize-os`,
    content: `Customize OS: This page explains how to customize the OS. See the customization form at: https://f.wps.cn/g/jFd4K6Fu/`
  },
  "linux-getting-started": {
    title: "Getting Started (Linux)",
    url: `${DOCS}/linux-terminals/getting-started`,
    content: `Getting Started with Linux Terminals:

Preparation - Install development environment:
Follow instructions at: https://github.com/DspreadOrg/qpos-linux-tools/blob/main/EnvironmentBuilding/DevelopEnvironmentGuide.md
  git clone https://github.com/DspreadOrg/qpos-linux-tools.git

Clone Linux SDK and Demo:
D30: git clone https://github.com/DspreadOrg/D30-linux.git
QPOS Plus: git clone https://github.com/dspreadOrg/qpos-linux.git

Project Structure:
qpos-linux-main/app_demo/linux_pos_app/src/ contains:
- common_api/
- custom_app/ with http/, ota/, setting/, trans/ (app_trans.c, app_trans.h, ui_card.c, ui_card.h, ui_emvSelectMultiApp.c)
- project/ with lvgl_porting.c, proj_cfg.h, task_handle.c, ui_main.c

Essential PKG commands in VSCode:
PKG-STOP APP, PKG-RUN APP, PKG-UNINSTALL APP, PKG-INSTALL APP, PKG-CLEAN, PKG-PACKAGE, PKG-RECOMPILE, PKG-COMPILE.

Debugging and Deployment:
Install: adb install -r linux_pos_app\\release\\linux_pos_app.apk
Run: adb shell am start -n linux_pos_app/linux_pos_app
Logs: adb logcat -s linux_pos_app`
  },
  "linux-transaction-flow": {
    title: "Transaction Flow (Linux)",
    url: `${DOCS}/linux-terminals/transaction-flow`,
    content: `Transaction Flow for Linux terminals:

Application Flow Overview:
1. Initialization: UI components created using LVGL, Transaction buffer initialized, Supported card types configured.
2. Payment Initiation:
  void Trans_Payment() {
    if(g_pTransBuffer) { free(g_pTransBuffer); g_pTransBuffer=NULL; }
    g_pTransBuffer=malloc(TRANS_POOL_MAX);
    glb_trans_type = REQ_TRANS_SALE;
    PaymentInit(g_pTransBuffer);
    Enter_Amount();
  }

Payment Transaction Flow:
1. Amount Entry — Payment_cb callback, LV_KEY_ENTER triggers FormatAmount and EventRegister(EVENT_PAYMENT).
2. Card Detection — StartTrading(g_pTransBuffer) begins card detection, setTransInitData sets supported card types.
3. Transaction Processing — emvOnlineProcess handles:
   CALLBACK_TRANS_MAG (magnetic stripe): online_common()
   CALLBACK_TRANS_ICC_ONLINE (EMV chip): online_common() → success/fail display
4. Result Handling — emvTransResult:
   APP_RC_COMPLETED → LCD_DISP_TRADE_SUCCESS
   APP_RC_CANCEL → LCD_DISP_CANCEL
   APP_RC_EMV_DENAIL → LCD_DISP_DECLINED_DISP

Key Components:
- Transaction Buffer (g_pTransBuffer): Stores all transaction data in TLV format.
- Card Types: TRANS_CARD_MAG=0x01 (Magnetic), TRANS_CARD_ICC (EMV Chip), TRANS_CARD_CTLS (Contactless).
- UI Integration: LVGL for all UI, event-driven architecture.`
  },
  "linux-resources": {
    title: "Additional Resources (Linux)",
    url: `${DOCS}/linux-terminals/additional-resources`,
    content: `Additional Resources:
- QPOS Linux Repository: https://gitlab.com/dspread/qpos-linux
- QPOS Linux Tools Repository: https://gitlab.com/dspread/qpos-linux-tools
- Development Environment Guide: https://gitlab.com/dspread/qpos-linux-tools/-/blob/main/EnvironmentBuilding/DevelopEnvironmentGuide.md`
  },
  "linux-best-practices": {
    title: "Best Practices (Linux)",
    url: `${DOCS}/linux-terminals/best-practices`,
    content: `Best Practices:
1. Follow C/C++ best practices for memory management.
2. Implement proper error handling for SDK function calls.
3. Test thoroughly on target hardware.
4. Use version control for your application code.`
  },
  "linux-common-issues": {
    title: "Common Issues (Linux)",
    url: `${DOCS}/linux-terminals/common-issues`,
    content: `Common Issues:
1. Compilation Errors: Check if environment variables are correctly configured and if the cross-compilation toolchain is properly installed.
2. Installation Failures: Ensure the device is properly connected and ADB can recognize the device.
3. Runtime Crashes: Check logs, may be due to missing necessary permissions or library files.`
  },
  "payment-gateway-aws": {
    title: "Payment Gateway (AWS)",
    url: `${DOCS}/payment-gateway-aws`,
    content: `Payment Gateway (AWS) — Decrypt POS terminal data using AWS Payment Cryptography Data Plane API.

Prerequisites:
- AWS Account & Payment Cryptography key with KeyModesOfUse set to allow decryption.
- AWS SDK for Java v2.
- POS Terminal encrypted data (ciphertext) as hex string.

Example: Decrypt Track 2 Data and PIN Block using DUKPT.
Test data:
  encryptedTrack2 = "153CEE49576C0B709515946D991CB48368FEA0375837ECA6"
  trackKsn = "00000332100300E00002"
  encryptedPinBlock = "377D28B8C7EF080A"
  pinKsn = "00000332100300E000C6"

Java code uses PaymentCryptographyDataClient.create(), builds EncryptionDecryptionAttributes with .dukpt(b -> b.keySerialNumber(ksn)), then DecryptDataRequest with keyIdentifier (ARN), cipherText, and decryptionAttributes.

Sample output:
  Decrypted Track 2 Data (hex): 323246423245393331...
  Decrypted PIN Block (hex): 041127ADEDAFEFFF

Explanation:
1. Client Creation using default configuration (requires AWS credentials and region).
2. Decryption Attributes specifying DUKPT with key serial number.
3. Request built with key ARN, ciphertext, and decryption attributes.
4. Response contains decrypted plaintext as hex string.

Additional Considerations:
- If POS uses DUKPT derived keys, use appropriate Dukpt decryption attributes.
- Ciphertext must be in hex string format.
- Customize client for region, endpoint, credentials as needed.`
  },
  "key-management-aws": {
    title: "Key Management (AWS)",
    url: `${DOCS}/key-management-aws`,
    content: `Key Management (AWS) — Export symmetric keys using a pre-established key exchange key (TR-31).

When exchanging multiple keys or supporting key rotation, you typically first exchange an initial key encryption key (KEK) using paper key components or, with AWS Payment Cryptography, using TR-34. After establishing a KEK, you can use it to transport subsequent keys using ANSI TR-31, widely supported by HSM vendors.

Steps:
1. Set up your Key Encryption Key (KEK) — Make sure you have already exchanged your KEK and have the keyARN (or keyAlias) available.
2. Create your key on AWS Payment Cryptography — or create on your other system and use import command.
3. Export your key from AWS Payment Cryptography in TR-31 format:
  aws payment-cryptography export-key \\
    --key-material='{"Tr31KeyBlock": {"WrappingKeyIdentifier": "arn:aws:payment-cryptography:us-east-2:111122223333:key/ov6icy4ryas4zcza"}}' \\
    --export-key-identifier arn:aws:payment-cryptography:us-east-2:111122223333:key/5rplquuwozodpwsp

  Response:
  { "WrappedKey": { "KeyCheckValue": "73C263", "KeyCheckValueAlgorithm": "ANSI_X9_24", "KeyMaterial": "D0144K0AB00E0000...", "WrappedKeyMaterialFormat": "TR31_KEY_BLOCK" } }

4. Import the key to your system:
  pos.sendTR31Key(tr31KeyBlock);`
  },
  "emv-l3-testing": {
    title: "EMV L3 Testing",
    url: `${DOCS}/emv-l3-testing`,
    content: `EMV L3 Testing:
The following are the EMV configuration and firmware generated based on test cases of each country for L3 certification.

Supported countries: MEXICO, INDIA, NIGERIA, USA, RUSSIA, JAPAN, COLUMBIA.
For each country, downloads are available for:
- QPOS mini XML config
- QPOS cute/CR100/D20/D30/D60 XML config
- TPP File (Certification.tpp)
- Firmware

All files are available via Google Drive links. Terminal models covered: QPOS mini, QPOS cute, CR100, D20, D30, D60.`
  },
  "tms-larktms": {
    title: "TMS/LarkTMS",
    url: `${DOCS}/tms-larktms`,
    content: `TMS/LarkTMS — Terminal Management System.
Download the LarkTMS user manual (PDF) to learn how to use the Terminal Management System: /files/larkTMS_userManual_en_US.pdf`
  },
  "cloud-speaker": {
    title: "Cloud Speaker",
    url: `${DOCS}/cloud-speaker`,
    content: `Cloud Speaker:
Installation: Download Cloud Speaker code from the official repository. Steps: 1. Clone the repository. 2. Install dependencies. 3. Configure environment variables.

Compile and build: Run project_build.bat and choose options in order: 1(build clean) → 2(build app) → 3(packet firmware zip file).
Other options: 4(packet APP OTA file), 5(packet DIFF SYS OTA file), 6(packet DIFF APP SYS OTA file), 7(set device type), 8(quit).`
  }
};

// Build a single string of all documentation for useCopilotReadable
const ALL_DOC_TEXT = Object.values(DOC_CONTENT)
  .map(d => `## ${d.title}\nURL: ${d.url}\n${d.content}`)
  .join("\n\n---\n\n");

// ── Component ───────────────────────────────────────────────────────────
function AppWithSuggestions({ children }) {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    setCurrentPath(router.asPath);
  }, [router.asPath]);

  // Feed the FULL documentation content into the AI context
  useCopilotReadable({
    description: "Complete Dspread documentation content — use this as the ONLY source for answering questions. Quote verbatim from this content.",
    value: ALL_DOC_TEXT,
  });

  // Feed current page context
  useCopilotReadable({
    description: "The documentation page the user is currently viewing",
    value: currentPath,
  });

  useCopilotChatSuggestions({
    instructions: `Suggest 3-5 short questions about Dspread: SDK setup, card payments, EMV testing, key management, Linux terminals, receipt printing, troubleshooting.`,
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
