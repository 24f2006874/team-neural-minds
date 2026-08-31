import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const heading = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-heading",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "DRISHTI — Trust-Gated DR Screening",
  description:
    "AI that knows when to trust itself. A trust-gated diabetic retinopathy screening pipeline for rural India — Smart India Hackathon 2026, PS 26038, MathWorks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${heading.variable} ${body.variable} antialiased`}>
        <Navbar />
        <main className="min-h-screen bg-surface text-foreground">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
