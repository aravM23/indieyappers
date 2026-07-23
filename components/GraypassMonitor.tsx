import Script from "next/script";
import { collectionOpen, graypassConfig } from "@/lib/graypass";

// Injects the GrayPass drop-in SDK in monitor mode for the time-boxed
// research collection window. Renders nothing when GrayPass is not
// configured or the window has closed; the SDK's data-until and the token
// route independently enforce the same cutoff.
export default function GraypassMonitor() {
  const config = graypassConfig();
  if (!config || !collectionOpen(config)) return null;

  return (
    <Script
      src={`${config.apiBase}/gp/graypass.js`}
      strategy="afterInteractive"
      data-pk={config.publishableKey}
      data-api={config.apiBase}
      data-token-url="/api/graypass/token"
      data-mode="monitor"
      data-until={config.collectUntil.toISOString()}
      data-brand="GrayPass"
    />
  );
}
