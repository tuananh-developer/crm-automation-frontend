import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppQueryProvider } from "@/components/providers/AppQueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
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
  title: "Signal Desk | CRM Operations",
  description: "A focused workspace for lead intelligence, workflow review, meetings, and quotes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
          <body className="min-h-full flex flex-col">
        <AppQueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </AppQueryProvider>
      </body>
    </html>
  );
}
