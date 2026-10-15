import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Amol Collections | Toys, Gifts & More", description: "Discover toys, gifts and delightful finds at Amol Collections, Gondia." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
