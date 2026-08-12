import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PushNotificationProvider } from '@/components/shared/PushNotification'
import { PWARegister } from '@/components/shared/PWARegister'

export const metadata: Metadata = {
  title: {
    default: 'Làng Hoa Xuân Quan',
    template: '%s | Xuân Quan',
  },
  description: 'Khám phá và mua hoa tươi từ làng hoa Xuân Quan, Văn Giang. Kết nối trực tiếp với các nhà vườn uy tín.',
  keywords: ['hoa xuân quan', 'làng hoa', 'mua hoa online', 'hoa tươi hà nội', 'văn giang hưng yên'],
  authors: [{ name: 'Xuân Quan App' }],
  creator: 'Xuân Quan',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Xuân Quan',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Làng Hoa Xuân Quan',
    images: [{ url: '/hero-village.jpg', width: 1200, height: 630 }],
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png',  sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2D5A27',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* iOS PWA meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Xuân Quan" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
      </head>
      <body>
        {/* Mobile app container — căn giữa, max 430px */}
        <div className="app-container">
          <PushNotificationProvider>
            {children}
          </PushNotificationProvider>
        </div>
        <PWARegister />
      </body>
    </html>
  )
}
