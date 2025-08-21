"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  const showNavbar = !pathname.startsWith("/instructor");

  return (
    <>
      {showNavbar && <Navbar />}
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </>
  );
}
