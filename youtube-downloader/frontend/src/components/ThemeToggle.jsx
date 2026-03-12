"use client";

import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      className="card px-3 py-2 text-sm font-semibold inline-flex items-center gap-2"
      onClick={onToggle}
      type="button"
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
      {dark ? "Light" : "Dark"}
    </button>
  );
}
