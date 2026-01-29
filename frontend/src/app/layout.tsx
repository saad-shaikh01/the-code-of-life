import { ThemeProvider } from "@/modules/theme/contexts/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Code of Life",
  description: "Decode symbols to unlock life lessons - An interactive puzzle game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ThemeProvider defaultTheme="system">
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
