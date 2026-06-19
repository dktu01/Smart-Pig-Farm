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
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      title="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
