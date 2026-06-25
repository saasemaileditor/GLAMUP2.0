"use client";
import React from "react";
import { useTheme } from "../ThemeProvider";

// Custom SVG Icons based on user guidelines
export const DarkIcon = ({ className = "w-6 h-6", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" className={className} {...props}>
    <path d="M484-80q-84 0-157.5-32t-128-86.5Q144-253 112-326.5T80-484q0-146 93-257.5T410-880q-18 99 11 193.5T521-521q71 71 165.5 100T880-410q-26 144-138 237T484-80Zm0-80q88 0 163-44t118-121q-86-8-163-43.5T464-465q-61-61-97-138t-43-163q-77 43-120.5 118.5T160-484q0 135 94.5 229.5T484-160Zm-20-305Z"/>
  </svg>
);

export const LightIcon = ({ className = "w-6 h-6", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" className={className} {...props}>
    <path d="M440-760v-160h80v160h-80Zm266 110-55-55 112-115 56 57-113 113Zm54 210v-80h160v80H760ZM440-40v-160h80v160h-80ZM254-652 140-763l57-56 113 113-56 54Zm508 512L651-255l54-54 114 110-57 59ZM40-440v-80h160v80H40Zm157 300-56-57 112-112 29 27 29 28-114 114Zm113-170q-70-70-70-170t70-170q70-70 170-70t170 70q70 70 70 170t-70 170q-70 70-170 70t-170-70Zm283-57q47-47 47-113t-47-113q-47-47-113-47t-113 47q-47 47-47 113t47 113q47 47 113 47t113-47ZM480-480Z"/>
  </svg>
);

export default function ThemeDropdown() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center cursor-pointer text-gray-600 dark:text-zinc-300 focus:outline-none hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <DarkIcon className="w-5 h-5 text-gray-600 dark:text-zinc-300" />
      ) : (
        <LightIcon className="w-5 h-5 text-gray-600 dark:text-zinc-300" />
      )}
    </button>
  );
}
