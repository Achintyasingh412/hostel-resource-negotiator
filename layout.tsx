import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const viewport: Viewport = {
  themeColor: "#0c1110",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Hostel Nexus — Shared living, sorted",
  description:
    "Book shared hostel resources, manage weekly credits, and keep every reservation transparent with Hostel Nexus.",
  applicationName: "Hostel Nexus",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" data-scroll-behavior="smooth">
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
