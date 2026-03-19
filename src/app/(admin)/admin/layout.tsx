import { AdminLayoutClient } from "@/components/layout/AdminLayoutClient";

/**
 * Admin Layout (Server Component)
 * Refactored to resolve ChunkLoadError by moving client logic to a child wrapper.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
