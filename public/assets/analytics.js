/** Consent-controlled GA4 traffic measurement for public marketing pages.
 * Customer/account pages do not load this module. No customer data is sent. */
import { ga4MeasurementId } from "./analytics-config.js";

const valid =
  /^G-[A-Z0-9]{6,}$/.test(ga4MeasurementId) &&
  !ga4MeasurementId.includes("REPLACE");
if (valid) {
  const storageKey = "mi.analyticsConsent.v1";
  const policyUrl = new URL("../privacy.html", import.meta.url).href;
  let loaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });

  const readChoice = () => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };
  const saveChoice = (choice) => {
    try {
      localStorage.setItem(storageKey, choice);
    } catch {
      /* Applies for this page only. */
    }
  };
  const loadAnalytics = () => {
    if (loaded) return;
    loaded = true;
    window.gtag("consent", "update", { analytics_storage: "granted" });
    window.gtag("js", new Date());
    window.gtag("config", ga4MeasurementId, {
      send_page_view: true,
      allow_google_signals: false,
      anonymize_ip: true,
    });
    const tag = document.createElement("script");
    tag.async = true;
    tag.src =
      "https://www.googletagmanager.com/gtag/js?id=" +
      encodeURIComponent(ga4MeasurementId);
    document.head.appendChild(tag);
  };

  const openPanel = () => {
    document.querySelector(".mi-consent-panel")?.remove();
    const panel = document.createElement("section");
    panel.className = "mi-consent-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "mi-consent-title");
    panel.innerHTML =
      '<div><strong id="mi-consent-title">Your privacy choices</strong><p>With your permission, MaxImpress uses Google Analytics to measure visits and improve the website. Analytics stays off unless you accept. We do not use this setting for advertising.</p><a href="' +
      policyUrl +
      '">Read the privacy notice</a></div><div class="mi-consent-actions"><button type="button" data-consent="denied">Decline</button><button type="button" class="mi-consent-accept" data-consent="granted">Accept analytics</button></div>';
    panel.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-consent]")?.dataset.consent;
      if (!choice) return;
      saveChoice(choice);
      if (choice === "granted") loadAnalytics();
      else window.gtag("consent", "update", { analytics_storage: "denied" });
      panel.remove();
    });
    document.body.appendChild(panel);
    panel.querySelector("button")?.focus();
  };

  const init = () => {
    const settings = document.createElement("button");
    settings.type = "button";
    settings.className = "mi-consent-settings";
    settings.textContent = "Privacy settings";
    settings.addEventListener("click", openPanel);
    document.body.appendChild(settings);

    const choice = readChoice();
    if (choice === "granted") loadAnalytics();
    else if (choice !== "denied") openPanel();
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
}
