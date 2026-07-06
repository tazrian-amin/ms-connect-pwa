import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { APP_VERSION } from "@/lib/pwa/version";
import { AppProviders } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MS Connect",
  description: "Connect and manage Bluetooth devices via Web Bluetooth",
  applicationName: "MS Connect",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MS Connect",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffc500",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <AppProviders>
          <ServiceWorkerRegister />
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <footer className="py-4 text-center text-xs text-zinc-400 dark:text-zinc-600">
            Version {APP_VERSION}
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
