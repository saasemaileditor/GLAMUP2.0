import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  Animated, 
  PanResponder, 
  Image, 
  Linking,
  Dimensions
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Clock, ArrowLeft, ArrowRight, ExternalLink, Package } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function RoutineViewerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();

  const [routine, setRoutine] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("action");
  const [loading, setLoading] = useState(true);

  const slideAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const loadRoutine = async () => {
        try {
          const storedRoutinesJson = await AsyncStorage.getItem('routines');
          const storedRoutines = storedRoutinesJson ? JSON.parse(storedRoutinesJson) : [];
          const foundRoutine = storedRoutines.find((r: any) => r.id === id);
          if (foundRoutine) {
            setRoutine(foundRoutine);
          }
        } catch (e) {
          console.error("Error loading routine", e);
        }
        setLoading(false);
      };
      if (id) {
        loadRoutine();
      }
    }, [id])
  );

  const stepsKeys = routine ? Object.keys(routine.stepData).map(k => parseInt(k)).sort((a, b) => a - b) : [];
  const totalSteps = stepsKeys.length;

  if (loading) {
    return (
      <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight, styles.centerAll]}>
        <Text style={isDark ? styles.textDark : styles.textLight}>Loading...</Text>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
        <View style={styles.centerAll}>
          <View style={[styles.emptyIconBg, isDark ? styles.iconBgDark : styles.iconBgLight]}>
            <Clock size={48} color={isDark ? "#52525b" : "#d1d5db"} />
          </View>
          <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>Routine Not Found</Text>
          <Text style={[styles.emptySubtitle, isDark ? styles.subtextDark : styles.subtextLight]}>
            This routine may have been deleted.
          </Text>
          <Pressable style={styles.goBackBtn} onPress={() => router.back()}>
            <Text style={styles.goBackText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const tabs = [
    { id: "action", label: "Action" },
    { id: "dos", label: "Do's" },
    { id: "donts", label: "Don'ts" },
  ];

  return (
    <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      
      <View style={[styles.headerArea, { paddingTop: insets.top + 12 }]}>
        <View style={styles.titleContainer}>
          <Text style={[styles.routineTitle, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
            {routine.title}
          </Text>
        </View>
        <View style={styles.progressRow}>
          {stepsKeys.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressBar,
                index <= currentIndex
                  ? styles.progressActive
                  : (isDark ? styles.progressInactiveDark : styles.progressInactiveLight)
              ]}
            />
          ))}
        </View>
        <Text style={[styles.stepIndicator, isDark ? styles.subtextDark : styles.subtextLight]}>
          Step {currentIndex + 1} of {totalSteps}
        </Text>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          const newIndex = Math.round(offsetX / SCREEN_WIDTH);
          if (newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
            setActiveTab("action");
          }
        }}
        style={{ flex: 1 }}
      >
        {stepsKeys.map((stepKey) => {
          const step = routine.stepData[stepKey];
          return (
            <View key={stepKey} style={{ width: SCREEN_WIDTH, paddingHorizontal: 16, paddingBottom: 16 }}>
              <View style={[styles.slideCard, isDark ? styles.cardDark : styles.cardLight]}>
                <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                  <View style={styles.cardTop}>
                    <Text style={styles.actionLabel}>{step.actionTitle || "ACTION STEP"}</Text>
                    
                    {step.productName ? (
                      <Text style={[styles.productName, isDark ? styles.textDark : styles.textLight]}>
                        {step.productName}
                      </Text>
                    ) : (
                      <View style={styles.noProductRow}>
                        <View style={[styles.noProductIcon, isDark ? styles.iconBgDark : styles.iconBgLight]}>
                          <Package size={16} color={isDark ? "#71717a" : "#9ca3af"} />
                        </View>
                        <Text style={[styles.noProductText, isDark ? styles.subtextDark : styles.subtextLight]}>
                          No product added
                        </Text>
                      </View>
                    )}

                    {step.productDesc ? (
                      <Text style={[styles.productDesc, isDark ? styles.subtextDark : styles.subtextLight]}>
                        {step.productDesc}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.imageContainer}>
                    {step.productImage ? (
                      <Image source={{ uri: step.productImage }} style={styles.productImage} />
                    ) : (
                      <View style={[styles.noImage, isDark ? styles.noImageDark : styles.noImageLight]}>
                        <Text style={[styles.noImageText, isDark ? styles.subtextDark : styles.subtextLight]}>No image added</Text>
                      </View>
                    )}
                  </View>

                  {step.productLink ? (
                    <Pressable
                      style={[styles.linkBtn, isDark ? styles.linkBtnDark : styles.linkBtnLight]}
                      onPress={() => Linking.openURL(step.productLink.startsWith('http') ? step.productLink : `https://${step.productLink}`)}
                    >
                      <Text style={[styles.linkText, isDark ? styles.textDark : styles.textLight]}>View Product</Text>
                      <ExternalLink size={16} color={isDark ? "#a1a1aa" : "#9ca3af"} />
                    </Pressable>
                  ) : null}

                  <View style={styles.tabsContainer}>
                    <View style={[styles.tabsBg, isDark ? styles.tabsBgDark : styles.tabsBgLight]}>
                      {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                          <Pressable
                            key={tab.id}
                            style={[
                              styles.tabBtn,
                              isActive && (isDark ? styles.tabActiveDark : styles.tabActiveLight)
                            ]}
                            onPress={() => setActiveTab(tab.id)}
                          >
                            <Text style={[
                              styles.tabText,
                              isActive ? (isDark ? styles.tabTextActiveDark : styles.tabTextActiveLight) : (isDark ? styles.subtextDark : styles.subtextLight)
                            ]}>
                              {tab.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.tabContent}>
                    <View style={[styles.contentCard, isDark ? styles.contentCardDark : styles.contentCardLight]}>
                      {activeTab === "action" && (
                        <View>
                          {step.actionFormat === "pointers" && step.actionPointers?.length > 0 ? (
                            <View style={styles.listContainer}>
                              {step.actionPointers.map((item: string, i: number) => (
                                <View key={i} style={[styles.listItem, isDark ? styles.listActionDark : styles.listActionLight]}>
                                  <Text style={styles.listNumberAction}>{i + 1}.</Text>
                                  <Text style={[styles.listText, isDark ? styles.textDark : styles.textLight]}>{item}</Text>
                                </View>
                              ))}
                            </View>
                          ) : (
                            <View style={[styles.listItem, isDark ? styles.listActionDark : styles.listActionLight]}>
                              <Text style={[styles.listText, isDark ? styles.textDark : styles.textLight]}>
                                {step.actionDesc || <Text style={styles.italicText}>No instructions provided.</Text>}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {activeTab === "dos" && (
                        <View>
                          {step.dos?.length > 0 ? (
                            <View style={styles.listContainer}>
                              {step.dos.map((item: string, i: number) => (
                                <View key={i} style={[styles.listItem, isDark ? styles.listDosDark : styles.listDosLight]}>
                                  <Text style={styles.listNumberDos}>{i + 1}.</Text>
                                  <Text style={[styles.listText, isDark ? styles.textDark : styles.textLight]}>{item}</Text>
                                </View>
                              ))}
                            </View>
                          ) : (
                            <Text style={[styles.italicText, isDark ? styles.subtextDark : styles.subtextLight]}>No do's added for this step.</Text>
                          )}
                        </View>
                      )}

                      {activeTab === "donts" && (
                        <View>
                          {step.donts?.length > 0 ? (
                            <View style={styles.listContainer}>
                              {step.donts.map((item: string, i: number) => (
                                <View key={i} style={[styles.listItem, isDark ? styles.listDontsDark : styles.listDontsLight]}>
                                  <Text style={styles.listNumberDonts}>{i + 1}.</Text>
                                  <Text style={[styles.listText, isDark ? styles.textDark : styles.textLight]}>{item}</Text>
                                </View>
                              ))}
                            </View>
                          ) : (
                            <Text style={[styles.italicText, isDark ? styles.subtextDark : styles.subtextLight]}>No don'ts added for this step.</Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                  
                </ScrollView>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLight: { backgroundColor: '#ffffff' },
  bgDark: { backgroundColor: '#09090b' },
  centerAll: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  textLight: { color: '#111827' },
  textDark: { color: '#f4f4f5' },
  subtextLight: { color: '#6b7280' },
  subtextDark: { color: '#a1a1aa' },
  italicText: { fontStyle: 'italic', color: '#9ca3af' },

  emptyIconBg: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconBgLight: { backgroundColor: '#f3f4f6' },
  iconBgDark: { backgroundColor: '#18181b' },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  goBackBtn: { backgroundColor: '#9333ea', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  goBackText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  headerArea: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, alignItems: 'center' },
  titleContainer: { width: '100%', overflow: 'hidden', alignItems: 'center', marginBottom: 8 },
  routineTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', width: '100%' },
  progressRow: { flexDirection: 'row', width: '100%', gap: 6, marginBottom: 8 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  progressActive: { backgroundColor: '#9333ea' },
  progressInactiveLight: { backgroundColor: '#f3e8ff' },
  progressInactiveDark: { backgroundColor: '#27272a' },
  stepIndicator: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  cardContainer: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  slideCard: { flex: 1, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  cardLight: { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  cardDark: { backgroundColor: '#18181b', borderColor: '#27272a' },
  scrollArea: { flex: 1 },

  cardTop: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  actionLabel: { fontSize: 10, fontWeight: '700', color: '#9333ea', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  productName: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  noProductRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  noProductIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  noProductText: { fontSize: 14, fontStyle: 'italic' },
  productDesc: { fontSize: 14, marginTop: 6, lineHeight: 20 },

  imageContainer: { marginHorizontal: 20, marginVertical: 12 },
  productImage: { width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: '#f3f4f6' },
  noImage: { width: '100%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  noImageLight: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  noImageDark: { backgroundColor: '#27272a', borderColor: '#3f3f46' },
  noImageText: { fontSize: 13, fontWeight: '500' },

  linkBtn: { marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  linkBtnLight: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  linkBtnDark: { backgroundColor: '#27272a', borderColor: '#3f3f46' },
  linkText: { fontSize: 14, fontWeight: '500' },

  tabsContainer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  tabsBg: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  tabsBgLight: { backgroundColor: '#f3f4f6' },
  tabsBgDark: { backgroundColor: '#27272a' },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tabActiveLight: { backgroundColor: '#ffffff', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  tabActiveDark: { backgroundColor: '#3f3f46' },
  tabText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabTextActiveLight: { color: '#111827' },
  tabTextActiveDark: { color: '#ffffff' },

  tabContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  contentCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  contentCardLight: { backgroundColor: '#f9fafb', borderColor: '#f3f4f6' },
  contentCardDark: { backgroundColor: '#27272a', borderColor: '#3f3f46' },

  listContainer: { gap: 12 },
  listItem: { flexDirection: 'row', padding: 14, borderRadius: 12, borderWidth: 1 },
  listText: { flex: 1, fontSize: 14, lineHeight: 20 },
  listActionLight: { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' },
  listActionDark: { backgroundColor: 'rgba(147, 51, 234, 0.1)', borderColor: 'rgba(147, 51, 234, 0.2)' },
  listNumberAction: { fontWeight: '700', color: '#9333ea', marginRight: 8 },

  listDosLight: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  listDosDark: { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' },
  listNumberDos: { fontWeight: '700', color: '#16a34a', marginRight: 8 },

  listDontsLight: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  listDontsDark: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' },
  listNumberDonts: { fontWeight: '700', color: '#dc2626', marginRight: 8 },

  navRow: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8, gap: 12 },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  navBtnPrev: { borderWidth: 1 },
  navBtnPrevLight: { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  navBtnPrevDark: { backgroundColor: '#18181b', borderColor: '#3f3f46' },
  navBtnText: { fontSize: 14, fontWeight: '600' },
  navBtnNext: { backgroundColor: '#9333ea' },
  navBtnNextText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  navBtnDisabled: { opacity: 0.5 }
});
