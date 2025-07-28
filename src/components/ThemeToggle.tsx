import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Palette, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const [isColored, setIsColored] = useState(true);

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'monochrome') {
      setIsColored(false);
      applyMonochromeTheme();
    } else {
      setIsColored(true);
      applyColoredTheme();
    }
  }, []);

  const applyColoredTheme = () => {
    const root = document.documentElement;
    root.style.setProperty('--sidebar-bg', '#707070');
    root.style.setProperty('--main-bg', '#99C24D');
    root.style.setProperty('--primary', 'hsl(142.1 76.2% 36.3%)');
    root.style.setProperty('--primary-foreground', 'hsl(355.7 100% 97.3%)');
    root.style.setProperty('--secondary', 'hsl(210 40% 96%)');
    root.style.setProperty('--secondary-foreground', 'hsl(215.4 16.3% 46.9%)');
    root.style.setProperty('--muted', 'hsl(210 40% 96%)');
    root.style.setProperty('--muted-foreground', 'hsl(215.4 16.3% 46.9%)');
    root.style.setProperty('--accent', 'hsl(210 40% 96%)');
    root.style.setProperty('--accent-foreground', 'hsl(215.4 16.3% 46.9%)');
    root.style.setProperty('--destructive', 'hsl(0 84.2% 60.2%)');
    root.style.setProperty('--destructive-foreground', 'hsl(210 40% 98%)');
    root.style.setProperty('--border', 'hsl(214.3 31.8% 91.4%)');
    root.style.setProperty('--input', 'hsl(214.3 31.8% 91.4%)');
    root.style.setProperty('--ring', 'hsl(142.1 76.2% 36.3%)');
    root.style.setProperty('--background', 'hsl(0 0% 100%)');
    root.style.setProperty('--foreground', 'hsl(222.2 84% 4.9%)');
    root.style.setProperty('--card', 'hsl(0 0% 100%)');
    root.style.setProperty('--card-foreground', 'hsl(222.2 84% 4.9%)');
    root.style.setProperty('--popover', 'hsl(0 0% 100%)');
    root.style.setProperty('--popover-foreground', 'hsl(222.2 84% 4.9%)');
    root.style.setProperty('--success', 'hsl(142.1 76.2% 36.3%)');
    root.style.setProperty('--warning', 'hsl(38 92% 50%)');
  };

  const applyMonochromeTheme = () => {
    const root = document.documentElement;
    root.style.setProperty('--sidebar-bg', '#333333');
    root.style.setProperty('--main-bg', '#ffffff');
    root.style.setProperty('--primary', 'hsl(0 0% 0%)');
    root.style.setProperty('--primary-foreground', 'hsl(0 0% 100%)');
    root.style.setProperty('--secondary', 'hsl(0 0% 96%)');
    root.style.setProperty('--secondary-foreground', 'hsl(0 0% 9%)');
    root.style.setProperty('--muted', 'hsl(0 0% 96%)');
    root.style.setProperty('--muted-foreground', 'hsl(0 0% 45%)');
    root.style.setProperty('--accent', 'hsl(0 0% 96%)');
    root.style.setProperty('--accent-foreground', 'hsl(0 0% 9%)');
    root.style.setProperty('--destructive', 'hsl(0 0% 0%)');
    root.style.setProperty('--destructive-foreground', 'hsl(0 0% 100%)');
    root.style.setProperty('--border', 'hsl(0 0% 90%)');
    root.style.setProperty('--input', 'hsl(0 0% 90%)');
    root.style.setProperty('--ring', 'hsl(0 0% 0%)');
    root.style.setProperty('--background', 'hsl(0 0% 100%)');
    root.style.setProperty('--foreground', 'hsl(0 0% 0%)');
    root.style.setProperty('--card', 'hsl(0 0% 100%)');
    root.style.setProperty('--card-foreground', 'hsl(0 0% 0%)');
    root.style.setProperty('--popover', 'hsl(0 0% 100%)');
    root.style.setProperty('--popover-foreground', 'hsl(0 0% 0%)');
    root.style.setProperty('--success', 'hsl(0 0% 0%)');
    root.style.setProperty('--warning', 'hsl(0 0% 0%)');
  };

  const toggleTheme = () => {
    const newTheme = !isColored;
    setIsColored(newTheme);
    
    if (newTheme) {
      applyColoredTheme();
      localStorage.setItem('theme', 'colored');
    } else {
      applyMonochromeTheme();
      localStorage.setItem('theme', 'monochrome');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center gap-2"
    >
      {isColored ? (
        <>
          <Moon className="h-4 w-4" />
          Black & White
        </>
      ) : (
        <>
          <Palette className="h-4 w-4" />
          Colored
        </>
      )}
    </Button>
  );
};

export default ThemeToggle; 