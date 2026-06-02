'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, CalendarRange, UserCircle, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/ui/header'; // Reutilizamos el Header, tal vez luego se haga uno de user
import { useAuthStore } from '@/store/useAuthStore';

const userNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Explore', href: '/explore', icon: Compass },
  { name: 'My Rides', href: '/my-rides', icon: CalendarRange },
  { name: 'Account', href: '/account', icon: UserCircle },
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoaded } = useAuthStore();

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50/50 w-full">
      {/* Top Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative">
        {children}
      </main>

      {/* Mobile Bottom Navigation (Visible only on mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-gray-200 flex items-center justify-around p-3 pb-safe z-50">
        {userNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-black" : "text-gray-400 hover:text-black"
              )}
            >
              <item.icon size={24} className={cn(isActive && "fill-black/5")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Side Navigation (Optional, or just header) */}
      {/* For tourism app, often top-nav or floating nav is preferred on desktop */}
    </div>
  );
}
