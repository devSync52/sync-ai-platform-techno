import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import LayoutProvider from "./LayoutProvider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "SynC AI Platform - Courier Management",
    description: "Courier management dashboard for SLA, KPI, conciliation, claims, carrier integrations, and AI-powered insights.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
            <LayoutProvider>
                <body className="min-h-full flex flex-col">
                    {children}
                    <Toaster position="top-right" />
                </body>
            </LayoutProvider>
        </html>
    );
}
