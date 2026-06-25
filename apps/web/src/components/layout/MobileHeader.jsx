"use client";
import { Bell, User } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import ThemeDropdown from "./ThemeDropdown";

export default function MobileHeader() {
  const pathname = usePathname();
  const isRoutineViewer = pathname.match(/^\/routine\/[^\/]+$/) && !pathname.includes('create');
  if (['/scan', '/profile'].includes(pathname) || isRoutineViewer) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800/80 px-4 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center shadow-sm">
          <span className="text-white font-black text-xs select-none">G</span>
        </div>
        <span className="font-black text-lg bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent select-none">
          GLAMUP
        </span>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-2">
        <ThemeDropdown />
        
        <Link 
          href="/profile"
          className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors duration-150"
          aria-label="Profile"
        >
          <User size={18} />
        </Link>
      </div>
    </header>
  );
}
