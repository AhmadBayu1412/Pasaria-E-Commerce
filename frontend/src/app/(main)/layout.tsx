/**
 * Main Layout
 *
 * Layout for main pages that need Navbar and Footer.
 * Route group: (main)
 */

import { Navbar, Footer } from "@/components/layout";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
