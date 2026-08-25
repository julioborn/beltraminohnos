import type { Metadata, Viewport } from "next";
import { Archivo, Inter, IBM_Plex_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { PullToRefresh } from "@/components/pull-to-refresh";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "BTM",
  description: "Sistema de notas de pedido de Beltramino Hnos.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BTM",
  },
};

export const viewport: Viewport = {
  themeColor: "#21305d",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${archivo.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-btm-black">
        <PullToRefresh />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
