import { Tabs } from 'expo-router';
import { View, Text, Pressable, StyleSheet, Platform, DeviceEventEmitter } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Home, ScanFace, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

let isRoutineCreateDirty = false;
DeviceEventEmitter.addListener('createRoutineDirtyState', (isDirty) => {
  isRoutineCreateDirty = isDirty;
});

function CustomTabBar({ state, descriptors, navigation }: any) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  // Cleaned up the hack since camera is now outside the tabs layout

  return (
    <View style={[
      styles.container, 
      { paddingBottom: insets.bottom },
      isDark ? styles.tabBarDark : styles.tabBarLight
    ]}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          if (!['index', 'scan', 'routine'].includes(route.name)) return null;

          const isFocused = state.index === index;

          const onPress = () => {
            if (!isFocused && isRoutineCreateDirty) {
              DeviceEventEmitter.emit('showUnsavedWarning', { name: route.name, params: route.params });
              return;
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          let Icon = null;
          if (route.name === 'index') Icon = Home;
          else if (route.name === 'scan') Icon = ScanFace;
          else if (route.name === 'routine') Icon = Clock;
          else Icon = Home;

          return (
            <Pressable
              key={route.name}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
            >
              {({ pressed }) => {
                const currentColor = (isFocused || pressed)
                  ? (isDark ? '#ffffff' : '#000000') 
                  : (isDark ? '#71717a' : '#9ca3af');

                return (
                  <>
                    <View style={[
                      styles.iconContainer,
                      isFocused && (isDark ? styles.iconActiveDark : styles.iconActiveLight),
                      pressed && (isDark ? styles.iconPressedDark : styles.iconPressedLight)
                    ]}>
                      {Icon && <Icon size={24} strokeWidth={(isFocused || pressed) ? 2.5 : 2} color={currentColor} />}
                    </View>
                    <Text style={[
                      styles.tabLabel,
                      { color: currentColor }
                    ]}>
                      {label as string}
                    </Text>
                  </>
                );
              }}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 50,
    borderTopWidth: 1,
  },
  tabBar: {
    width: '100%',
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  tabBarLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  tabBarDark: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
  },
  tabItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 72, // Wider to accommodate the 64px pill
    height: '100%',
    gap: 4,
  },
  iconContainer: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconActiveLight: {
    backgroundColor: '#f3e8ff', // subtle purple for active state
  },
  iconActiveDark: {
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
  },
  iconPressedLight: {
    backgroundColor: '#e9d5ff',
  },
  iconPressedDark: {
    backgroundColor: 'rgba(147, 51, 234, 0.3)',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  }
});

export default function AppTabs() {
  return (
    <Tabs
      backBehavior="history"
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="routine" options={{ title: 'Routine' }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
