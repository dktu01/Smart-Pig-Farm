'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground opacity-50">
        <span className="h-4 w-4"></span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-sm font-medium text-muted-foreground hover:text-foreground transition-all shadow-sm"
      title="Toggle theme"
    >
      <span className="flex items-center gap-2">
        {theme === 'light' ? (
          <Sun className="h-4 w-4 text-orange-500 transition-all" />
        ) : (
          <Moon className="h-4 w-4 text-blue-400 transition-all" />
        )}
        <span className="transition-all">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
      </span>
      <div className="w-9 h-5 bg-background border border-border rounded-full relative shadow-inner">
        <div 
          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full shadow-sm transition-all duration-300 ease-in-out ${
            theme === 'light' 
              ? 'left-1 bg-orange-500' 
              : 'left-4 bg-blue-400'
          }`} 
        />
      </div>
    </button>
  );
}
