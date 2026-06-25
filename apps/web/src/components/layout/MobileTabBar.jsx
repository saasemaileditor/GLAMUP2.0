"use client";
import { Home, Scan, Clock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileTabBar() {
  const pathname = usePathname();
  if (pathname === '/scan') return null;

  const handleNavigation = (e, path) => {
    if (typeof window !== 'undefined' && window.hasUnsavedRoutineChanges) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('showUnsavedWarning', { detail: path }));
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#09090b] flex items-center justify-between px-8 h-16 border-t border-gray-200 dark:border-zinc-800 shrink-0 z-50">

      {/* Home Tab */}
      <Link
        href="/"
        onClick={(e) => handleNavigation(e, "/")}
        className="flex flex-col items-center justify-end pb-2 gap-[1px] w-14 h-full"
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden">
          <Home
            size={24}
            strokeWidth={2}
            className={`${pathname === "/" ? "text-black dark:text-white" : "text-gray-400 dark:text-zinc-500"}`}
          />
        </div>
        <span className={`text-xs font-medium ${pathname === "/" ? "text-black dark:text-white" : "text-gray-400 dark:text-zinc-500"}`}>
          Home
        </span>
      </Link>

      {/* Scan Tab */}
      <Link
        href="/scan"
        onClick={(e) => handleNavigation(e, "/scan")}
        className="flex flex-col items-center justify-end pb-2 gap-[1px] w-14 h-full"
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden">
          <Scan
            size={24}
            strokeWidth={2}
            className={`${pathname === "/scan" ? "text-black dark:text-white" : "text-gray-400 dark:text-zinc-500"}`}
          />
        </div>
        <span className={`text-xs font-medium ${pathname === "/scan" ? "text-black dark:text-white" : "text-gray-400 dark:text-zinc-500"}`}>
          Scan
        </span>
      </Link>

      {/* Routine Tab */}
      <Link
        href="/routine"
        onClick={(e) => handleNavigation(e, "/routine")}
        className="flex flex-col items-center justify-end pb-2 gap-[1px] w-14 h-full"
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden">
          <Clock
            size={24}
            strokeWidth={2}
            className={`${pathname === "/routine" ? "text-black dark:text-white" : "text-gray-400 dark:text-zinc-500"}`}
          />
        </div>
        <span className={`text-xs font-medium ${pathname === "/routine" ? "text-black dark:text-white" : "text-gray-400 dark:text-zinc-500"}`}>
          Routine
        </span>
      </Link>

    </div>
  );
}
