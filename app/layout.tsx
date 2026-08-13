import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "PrePull — Be ready before the pull.", description: "A focused companion for WoW Classic raiders." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
