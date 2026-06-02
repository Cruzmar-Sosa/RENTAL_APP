'use client';

import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </>
  );
}
