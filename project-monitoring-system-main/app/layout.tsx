import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Roboto_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Project Monitoring System | Construction Management",
  description:
    "Comprehensive project monitoring system for construction companies in Zambia. Track progress, manage documents, and streamline approvals.",
  keywords: ["construction", "project management", "monitoring", "Zambia", "progress tracking"],
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E87A1E",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
