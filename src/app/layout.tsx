import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';
import { ClientThemeWrapper } from '@/components/shared/ClientThemeWrapper';

export const dynamic = 'force-dynamic';

/**
 * Root Layout
 * Provides core Firebase services, theme management, and global UI components.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <FirebaseClientProvider>
          <ClientThemeWrapper>
            {children}
            <Toaster />
          </ClientThemeWrapper>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
