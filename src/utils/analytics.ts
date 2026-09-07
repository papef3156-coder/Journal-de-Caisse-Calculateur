/**
 * Utilitaire Google Analytics 4 (GA4)
 * Compatible avec GitHub Pages, SPA et tout hébergement web.
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Envoie un affichage de page (page_view) à Google Analytics 4
 * Pratique pour les applications monopages (SPA) quand l'utilisateur change d'onglet ou de vue.
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  try {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
      page_location: window.location.href,
    });
  } catch {
    // Ignorer silencieusement si un bloqueur de pub ou d'analytics est présent
  }
}

/**
 * Envoie un événement personnalisé à Google Analytics 4
 */
export function trackEvent(action: string, category?: string, label?: string, value?: number) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  try {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  } catch {
    // Ignorer silencieusement
  }
}
