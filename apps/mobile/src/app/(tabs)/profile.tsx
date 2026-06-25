import React from 'react';
import { View, Text, StyleSheet, Pressable, Appearance } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeStore } from '@/store/themeStore';
import Header from '@/components/layout/Header';
import { Moon, Sun, Monitor } from 'lucide-react-native';

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  
  // Track the user's actual selection so the UI highlights properly
  const [selectedTheme, setSelectedTheme] = React.useState<'light' | 'dark' | 'system'>('system');

  const setScheme = (newScheme: 'light' | 'dark' | 'system') => {
    setSelectedTheme(newScheme);
    useThemeStore.getState().setColorScheme(newScheme);
  };

  return (
    <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      <Header title="Profile" showBack />
      
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>
          Appearance
        </Text>
        
        <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
          <Pressable 
            style={styles.option} 
            onPress={() => setScheme('light')}
          >
            <View style={styles.optionLeft}>
              <Sun size={20} color={isDark ? "#a1a1aa" : "#4b5563"} />
              <Text style={[styles.optionText, isDark ? styles.textDark : styles.textLight]}>Light Mode</Text>
            </View>
            <View style={[styles.radio, selectedTheme === 'light' && styles.radioActive]} />
          </Pressable>
          
          <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />
          
          <Pressable 
            style={styles.option} 
            onPress={() => setScheme('dark')}
          >
            <View style={styles.optionLeft}>
              <Moon size={20} color={isDark ? "#a1a1aa" : "#4b5563"} />
              <Text style={[styles.optionText, isDark ? styles.textDark : styles.textLight]}>Dark Mode</Text>
            </View>
            <View style={[styles.radio, selectedTheme === 'dark' && styles.radioActive]} />
          </Pressable>

          <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />
          
          <Pressable 
            style={styles.option} 
            onPress={() => setScheme('system')}
          >
            <View style={styles.optionLeft}>
              <Monitor size={20} color={isDark ? "#a1a1aa" : "#4b5563"} />
              <Text style={[styles.optionText, isDark ? styles.textDark : styles.textLight]}>System Default</Text>
            </View>
            <View style={[styles.radio, selectedTheme === 'system' && styles.radioActive]} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLight: { backgroundColor: '#f9fafb' },
  bgDark: { backgroundColor: '#000000' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, opacity: 0.5 },
  textLight: { color: '#111827' },
  textDark: { color: '#ffffff' },
  card: { borderRadius: 16, overflow: 'hidden' },
  cardLight: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb' },
  cardDark: { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a' },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionText: { fontSize: 16, fontWeight: '500' },
  divider: { height: 1 },
  dividerLight: { backgroundColor: '#e5e7eb' },
  dividerDark: { backgroundColor: '#27272a' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d1d5db' },
  radioActive: { borderColor: '#9333ea', borderWidth: 6 },
});
