import React from 'react';
import { View, Text, StyleSheet, Pressable, Appearance } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeStore } from '@/store/themeStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Sun, Moon, User } from 'lucide-react-native';

export default function Header({ title, showBack = false, onBack }: { title: string, showBack?: boolean, onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const router = useRouter();

  const toggleTheme = () => {
    useThemeStore.getState().setColorScheme(isDark ? 'light' : 'dark');
  };

  return (
    <View style={[
      styles.header, 
      { paddingTop: Math.max(insets.top, 16) },
      isDark ? styles.headerDark : styles.headerLight
    ]}>
      <View style={styles.left}>
        {showBack && (
          <Pressable onPress={() => onBack ? onBack() : router.back()} style={[styles.iconBtn, { marginRight: 8 }]}>
            <ChevronLeft size={24} color={isDark ? "#fff" : "#000"} />
          </Pressable>
        )}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>G</Text>
          </View>
          <Text style={styles.logoText}>GLAMUP</Text>
        </View>
      </View>

      <View style={styles.rightActions}>
        <Pressable onPress={toggleTheme} style={[styles.actionBtn, isDark ? styles.actionBtnDark : styles.actionBtnLight]}>
          {isDark ? (
            <Sun size={18} color="#a1a1aa" />
          ) : (
            <Moon size={18} color="#4b5563" />
          )}
        </Pressable>
        <Pressable onPress={() => router.push('/profile')} style={[styles.actionBtn, isDark ? styles.actionBtnDark : styles.actionBtnLight]}>
          <User size={18} color={isDark ? "#a1a1aa" : "#4b5563"} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  headerLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#f3f4f6',
  },
  headerDark: {
    backgroundColor: '#09090b',
    borderBottomColor: '#27272a',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#9333ea', // purple-600
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold'
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#9333ea',
    letterSpacing: 0.5,
    fontFamily: 'Outfit_800ExtraBold'
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLight: {
    backgroundColor: '#f3f4f6', // gray-100
  },
  actionBtnDark: {
    backgroundColor: '#27272a', // zinc-800
  },
  iconBtn: {
    padding: 4,
    marginRight: -4,
  },
});
