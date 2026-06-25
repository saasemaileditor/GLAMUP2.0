import { useEffect, useState } from 'react';

import { useThemeStore } from '@/store/themeStore';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useThemeStore((state) => state.colorScheme);

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
