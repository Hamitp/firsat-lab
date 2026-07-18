import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fırsat Lab — Otomasyon Fırsatı Keşif Aracı",
  description: "Günlük işlerinde yazılım ve otomasyon fırsatlarını yakala, puanla ve geliştir.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
