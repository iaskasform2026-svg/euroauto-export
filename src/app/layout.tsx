import type { Metadata } from "next";
import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const source = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

const libre = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EuropAuto Export — Véhicules européens à l’export",
  description:
    "Recherche, proposition commerciale, accompagnement et livraison de véhicules européens destinés à l’exportation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${source.variable} ${libre.variable} font-sans min-h-screen`}>{children}</body>
    </html>
  );
}
