import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';

interface ThemeState {
  colorScheme: ColorSchemeName;
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  colorScheme: Appearance.getColorScheme() || 'light',
  setColorScheme: (scheme) => {
    const resolvedScheme = scheme === 'system' ? Appearance.getColorScheme() : scheme;
    
    // 1. Update global store instantly for snappy UI updates
    set({ colorScheme: resolvedScheme });
    
    // 2. Sync with React Native's Appearance API in the background
    Appearance.setColorScheme((scheme === 'system' ? 'unspecified' : scheme) as any);
  },
}));

// Listen for system-level theme changes (e.g., user changes iOS settings)
Appearance.addChangeListener(({ colorScheme }) => {
  useThemeStore.setState({ colorScheme });
});
