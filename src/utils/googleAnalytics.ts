type GtagArguments = [command: string, ...args: unknown[]];

declare global {
  interface Window {
    dataLayer?: GtagArguments[];
    gtag?: (...args: GtagArguments) => void;
  }
}

const GOOGLE_ANALYTICS_SCRIPT_ID = "google-analytics-gtag";

export function initializeGoogleAnalytics(
  measurementId = process.env.REACT_APP_GA_ID
): void {
  const trimmedMeasurementId = measurementId?.trim();

  if (!trimmedMeasurementId || typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    ((...args: GtagArguments) => {
      window.dataLayer?.push(args);
    });

  if (!document.getElementById(GOOGLE_ANALYTICS_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = GOOGLE_ANALYTICS_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      trimmedMeasurementId
    )}`;
    document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("config", trimmedMeasurementId);
}
