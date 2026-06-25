import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, PanResponder, Linking } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useCameraPermission } from 'react-native-vision-camera';
import Header from '@/components/layout/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ScanLandingScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hasPermission, requestPermission } = useCameraPermission();

  // Toast State
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    fadeAnim.stopAnimation();
    slideAnim.stopAnimation();
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    setToastMessage(msg);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      toastTimerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 20, duration: 220, useNativeDriver: true }),
        ]).start(() => {
          setToastMessage("");
          toastTimerRef.current = null;
        });
      }, 5000);
    });
  };

  const dismissToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 20, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setToastMessage("");
    });
  };

  const toastPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          slideAnim.setValue(g.dy);
          const opacity = Math.max(0, 1 - (g.dy / 60));
          fadeAnim.setValue(opacity);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 20) {
          dismissToast();
        } else {
          Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          ]).start();
        }
      }
    })
  ).current;

  const [hasDeniedOnce, setHasDeniedOnce] = useState(false);

  const handleScanClick = async () => {
    if (hasPermission) {
      router.push('/camera');
      return;
    }

    if (hasDeniedOnce) {
      // If they already denied it this session, force open OS settings because Android will block the popup
      Linking.openSettings();
      return;
    }

    const granted = await requestPermission();
    if (granted) {
      router.push('/camera');
    } else {
      setHasDeniedOnce(true);
      showToast("Permission denied. Tap again to open Settings.");
    }
  };

  return (
    <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      <Header title="Scan Routine" />
      
      <View style={styles.content}>
        <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>
          Scan your face
        </Text>
        <Text style={styles.subtitle}>
          Analyze your skin and create a personalized routine
        </Text>
        
        <Pressable 
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={handleScanClick}
        >
          <Text style={styles.buttonText}>Scan Now</Text>
        </Pressable>
      </View>

      {toastMessage ? (
        <Animated.View
          {...toastPanResponder.panHandlers}
          style={[
            styles.toastContainer,
            isDark ? styles.toastDark : styles.toastLight,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }], bottom: 24 }
          ]}
        >
          <Text style={isDark ? styles.toastTextDark : styles.toastTextLight}>
            {toastMessage}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLight: { backgroundColor: '#f9fafb' },
  bgDark: { backgroundColor: '#000000' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  textLight: { color: '#111827' },
  textDark: { color: '#ffffff' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 40 },
  button: { backgroundColor: '#9333ea', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 100 },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  
  toastContainer: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.2)',
    elevation: 10,
    borderWidth: 1,
    zIndex: 9999,
  },
  toastLight: { backgroundColor: '#111827', borderColor: '#374151' },
  toastDark: { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  toastTextLight: { fontSize: 14, fontWeight: '500', fontFamily: 'Outfit_500Medium', textAlign: 'center', color: '#ffffff' },
  toastTextDark: { fontSize: 14, fontWeight: '500', fontFamily: 'Outfit_500Medium', textAlign: 'center', color: '#111827' },
});
