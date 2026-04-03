import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rentmies Video Editor",
  description:
    "Professional video editor for YouTube Shorts and standard YouTube videos with AI-powered captioning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-editor-bg">
        {children}
      </body>
    </html>
  );
}
