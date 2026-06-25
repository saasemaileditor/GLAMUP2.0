import { Outfit } from "next/font/google";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileTabBar from "@/components/layout/MobileTabBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "GLAMUP — Your Style, Your Story",
  description: "India's premier D2C fashion destination for girls.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="bg-zinc-50 dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 antialiased flex justify-center h-[100dvh] w-full overflow-hidden">
        <ThemeProvider>
          {/* Mobile frame wrapper for all screens */}
          <div className="relative flex flex-col w-full max-w-[430px] h-[100dvh] bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden">
            <MobileHeader />
            <main className="flex-1 overflow-y-auto overscroll-none w-full relative">
              {children}
            </main>
            <MobileTabBar />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
