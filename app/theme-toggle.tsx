"use client";

import { useSyncExternalStore } from "react";

const preferenceKey = "talentflow.theme";
let memoryPreference: string | null = null;
let storageUnavailable = false;

function preference() {
  if (storageUnavailable) return memoryPreference;
  try {
    return window.localStorage.getItem(preferenceKey);
  } catch {
    return memoryPreference;
  }
}

function synchronizeTheme() {
  const saved = preference();
  document.documentElement.dataset.theme =
    saved === "light" || saved === "dark"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function subscribe(listener: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const update = () => {
    synchronizeTheme();
    listener();
  };
  window.addEventListener("storage", update);
  window.addEventListener("talentflow-theme-change", update);
  media.addEventListener("change", update);
  synchronizeTheme();
  return () => {
    window.removeEventListener("storage", update);
    window.removeEventListener("talentflow-theme-change", update);
    media.removeEventListener("change", update);
  };
}

const snapshot = () =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, snapshot, () => "light");
  function toggle() {
    memoryPreference = theme === "light" ? "dark" : "light";
    try {
      window.localStorage.setItem(preferenceKey, memoryPreference);
    } catch {
      storageUnavailable = true;
    }
    window.dispatchEvent(new Event("talentflow-theme-change"));
  }
  return (
    <button
      type="button"
      className="theme-toggle icon-button"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      onClick={toggle}
    >
      <span className="theme-moon" aria-hidden="true">
        ☾
      </span>
      <span className="theme-sun" aria-hidden="true">
        ☀
      </span>
    </button>
  );
}
