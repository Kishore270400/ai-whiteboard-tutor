import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Whiteboard Tutor",
  description: "Learn anything. See everything.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
