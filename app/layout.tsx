import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthModal } from "@/components/auth/AuthModal";

export const metadata: Metadata = {
  title: "Pickle — Process is Progress",
  description: "A creative platform celebrating the depth of process and craft, not just final polish.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-[#171512] text-[#EDE6DD] selection:bg-[#A3E635]/30 selection:text-[#EDE6DD]">
        <ConvexClientProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 pb-20 sm:pb-8">{children}</main>
            <BottomNav />
            <AuthModal />
          </AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
