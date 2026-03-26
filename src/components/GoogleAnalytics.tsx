import { useEffect, useRef } from 'react';

// Extend Window to include gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

interface GoogleAnalyticsProps {
  measurementId: string | null | undefined;
}

/**
 * Google Analytics 4 (GA4) component.
 * Loads the gtag.js script and configures it with the provided measurement ID.
 * Only loads when a valid measurement ID (starting with "G-") is provided.
 */
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const initialized = useRef(false);

  useEffect(() => {
    // Only load if we have a valid GA4 measurement ID
    if (!measurementId || !measurementId.startsWith('G-') || initialized.current) {
      return;
    }

    // Check if script is already loaded (e.g. from a previous render)
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) {
      initialized.current = true;
      return;
    }

    // Load the gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: true,
    });

    initialized.current = true;
  }, [measurementId]);

  return null;
}

/**
 * Track a virtual page view in a SPA.
 * Call this when the in-app navigation changes.
 */
export function trackPageView(pageTitle: string, pagePath?: string) {
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', 'page_view', {
    page_title: pageTitle,
    page_location: window.location.href,
    page_path: pagePath || window.location.pathname,
  });
}
