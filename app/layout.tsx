import React from "react";
import "./globals.css";

export const metadata = {
  title: 'ZapAtende AI',
  description: 'Gerado por Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-neutral-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}