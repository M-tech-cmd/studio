import Page from './(public)/page';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

/**
 * Root Route Re-exporter.
 * This file serves the public home page logic while manually wrapping 
 * it in the Header and Footer to ensure layout inheritance consistency
 * between the root route and the (public) route group.
 */
export default function RootPage() {
  return (
    <>
      <Header />
      <Page />
      <Footer />
    </>
  );
}
