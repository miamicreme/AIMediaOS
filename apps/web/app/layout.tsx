import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIMediaOS",
  description: "AI media operating system MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
