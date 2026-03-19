/**
 * Root Redirector.
 * The main home page logic has been moved to src/app/(public)/page.tsx
 * to ensure it benefits from the WebLayout (Maintenance Mode & Branding).
 * 
 * Note: This file is intentionally left empty/inactive to avoid route collision
 * with the route group version in src/app/(public)/page.tsx.
 */
export default function RootPage() {
  return null;
}
