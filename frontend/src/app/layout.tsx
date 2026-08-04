import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import PushNotificationPrompt from "@/components/ui/PushNotificationPrompt";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "CP Times",
  description: "Track coding contests and problems across all platforms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col overflow-x-hidden w-full bg-[#0A0E17] text-[#E8EAED]">
        <AuthProvider>
          {children}
          <PushNotificationPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
