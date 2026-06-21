'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Home, 
  PiggyBank, 
  Calendar,
  LogOut, 
  Menu,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthSession } from '@/components/auth-session-provider';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Kandang', icon: Home, href: '/dashboard/kandang' },
  { name: 'Data Babi', icon: PiggyBank, href: '/dashboard/babi' },
  { name: 'Jadwal', icon: Calendar, href: '/dashboard/jadwal' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { session, clearSession } = useAuthSession();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    clearSession();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Smart Pig Farm</span>
                  <span className="block font-bold text-lg text-foreground tracking-tight">Dashboard</span>
                </div>
            </Link>
            <button 
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <div className="mx-2 mb-4 rounded-2xl border border-border bg-secondary/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Session</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{session?.name || 'Guest'}</p>
              <p className="text-xs text-muted-foreground break-all">{session?.email || 'Belum login'}</p>
            </div>
            <div className="mb-4 px-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Menu Utama
              </p>
            </div>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-border flex flex-col gap-3">
            <div className="px-3 py-1 w-full">
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-border bg-card flex-shrink-0">
          <button 
            className="text-muted-foreground hover:text-foreground p-2 -ml-2 rounded-lg"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PiggyBank className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Smart Pig Farm</span>
              <span className="block font-bold text-foreground">Dashboard</span>
            </div>
          </div>
          <div className="w-6" /> {/* Spacer for centering */}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-background/50">
          <div className="max-w-7xl mx-auto p-4 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
