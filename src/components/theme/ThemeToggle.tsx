// src/components/theme/ThemeToggle.tsx

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDarkMode } from '@/hooks/useDarkMode';

export function ThemeToggle() {
  const [darkMode, setDarkMode] = useDarkMode();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDarkMode(!darkMode)}
      className="relative w-9 h-9"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// src/components/layout/Navbar.tsx

import { ThemeToggle } from '@/components/theme/ThemeToggle';

// Add to existing Navbar component
<div className="flex items-center space-x-4">
  <ThemeToggle />
  {/* existing navbar items */}
</div>

// src/mobile/components/theme/ThemeToggle.tsx

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function MobileThemeToggle() {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = React.useState(systemTheme);

  React.useEffect(() => {
    AsyncStorage.getItem('theme').then(savedTheme => {
      if (savedTheme) {
        setTheme(savedTheme);
      }
    });
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      className="p-2"
    >
      {theme === 'dark' ? (
        <Moon color="white" size={24} />
      ) : (
        <Sun color="black" size={24} />
      )}
    </TouchableOpacity>
  );
}