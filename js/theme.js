const STORAGE_KEY = "sc-theme";

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function apply(theme) {
  document.body.setAttribute("data-theme", theme);
  document.getElementById("themeToggleText").textContent = theme === "dark" ? "Modo claro" : "Modo oscuro";
}

export function initTheme() {
  const stored = readStored();
  const preferred = stored === "light" || stored === "dark"
    ? stored
    : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  apply(preferred);

  document.getElementById("themeToggle").addEventListener("click", () => {
    const next = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    apply(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Navegacion privada: el tema no se recuerda, pero funciona
    }
  });
}
