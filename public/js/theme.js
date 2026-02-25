// Theme toggle logic for Invento Pro
(function () {
  const THEME_KEY = "invento-theme";
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);

    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.textContent =
        theme === "dark" ? "Light Theme ☀️" : "Dark Theme 🌙 ";
    }
  }

  function initTheme() {
    let stored = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch (e) {

    }

    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const theme = stored || (prefersDark ? "dark" : "light");
    applyTheme(theme);

    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", () => {
        const current = root.getAttribute("data-theme") || "dark";
        const next = current === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch (e) {
          // ignore storage errors
        }
        applyTheme(next);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", initTheme);
})();