'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Bike, 
  CalendarRange, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Map,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermissions } from '@/hooks/usePermissions';
import { SidebarSkeleton } from './sidebar-skeleton';

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Reservations', href: '/reservations', icon: CalendarRange }, // Users see their own, Admin sees all
  { name: 'Routes', href: '/routes', icon: Map }, // Future feature
  { name: 'Stations', href: '/stations', icon: MapPin },
  { name: 'Bikes', href: '/bikes', icon: Bike },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Permissions', href: '/permissions', icon: Settings },
];

export function Sidebar() {
  // ⚠️ ALL hooks must be declared before any conditional returns (Rules of Hooks)
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { canView, isLoaded } = usePermissions();
  const { logout, permissions } = useAuthStore();

  // useMemo is a hook — must come BEFORE any conditional early returns
  const filteredItems = React.useMemo(() => {
    if (!isLoaded) return [];

    return sidebarItems.filter(item => {
      switch (item.name) {
        case 'Dashboard': return true;
        case 'Routes': return true;
        case 'Reservations': return canView('RESERVATIONS');
        case 'Stations': return canView('STATIONS');
        case 'Bikes': return canView('BIKES');
        case 'Users': return canView('USERS');
        case 'Permissions': return canView('SETTINGS');
        default: return false;
      }
    });
  }, [isLoaded, permissions]);

  // Conditional returns come AFTER all hooks
  if (pathname === '/login') return null;
  if (!isLoaded) return <SidebarSkeleton />;

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-white border-r transition-all duration-300 ease-in-out z-40',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-6 h-20">
        {!isCollapsed && <span className="text-xl font-bold tracking-tight text-black">eTours León</span>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group',
                isActive 
                  ? 'bg-black text-white shadow-lg shadow-black/10' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-black'
              )}
            >
              <item.icon size={22} className={cn(isActive ? 'text-white' : 'text-gray-400 group-hover:text-black')} />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-4 w-full px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut size={22} />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
