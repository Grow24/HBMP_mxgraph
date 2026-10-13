import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HBMP Modeling Platform',
  description: 'React Flow editor with mxGraph engine for business process modeling',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function (regs) {
                  regs.forEach(function (reg) { reg.unregister(); });
                });
              }
              if (window.caches) {
                caches.keys().then(function (keys) {
                  keys.forEach(function (key) { caches.delete(key); });
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-background text-foreground">
          {children}
        </div>
      </body>
    </html>
  )
}