import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  Modal, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Clipboard from 'expo-clipboard';
import { Search, SlidersHorizontal, Clock, Plus, Copy, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/layout/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

import { useFocusEffect } from 'expo-router';
import { DraggableScrollDownCircle, useDraggableScroll } from '@/components/ui/draggable-scroll-down-circle';

const levenshtein = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[a.length][b.length];
};

const getSimilarityScore = (query: string, target: string): number => {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return 100;
  
  const qChars = q.split('');
  let matchCount = 0;
  let tTemp = t;
  qChars.forEach(char => {
    if (tTemp.includes(char)) {
      matchCount++;
      tTemp = tTemp.replace(char, '');
    }
  });
  
  const overlapScore = q.length > 0 ? (matchCount / q.length) * 60 : 0; 
  
  const dist = levenshtein(q, t);
  const maxLength = Math.max(q.length, t.length);
  const levScore = maxLength > 0 ? ((maxLength - dist) / maxLength) * 40 : 0;
  
  return overlapScore + levScore;
};

export default function RoutineScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [searchQuery, setSearchQuery] = useState("");
  const [routines, setRoutines] = useState([]);

  // ScrollView tracking for main page to show/hide the scroll down circle
  const mainScrollViewRef = useRef<ScrollView>(null);
  const { scrollHandlers: mainScrollHandlers, isSaveBtnVisible: isMainSaveBtnVisible } = useDraggableScroll({
    modalOpen: true,
    activeStep: null,
    scrollViewRef: mainScrollViewRef,
    shouldScrollToTop: false,
  });

  useFocusEffect(
    React.useCallback(() => {
      const loadRoutines = async () => {
        try {
          const stored = await AsyncStorage.getItem('routines');
          if (stored) {
            setRoutines(JSON.parse(stored));
          }
        } catch (e) {
          console.error("Failed to load routines", e);
        }
      };
      loadRoutines();
    }, [])
  );

  const [hiddenCodes, setHiddenCodes] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleCodeVisibility = (routineId: string) => {
    setHiddenCodes(prev => ({ ...prev, [routineId]: !prev[routineId] }));
  };

  const [addCodeOpen, setAddCodeOpen] = useState(false);
  const [addCodeValue, setAddCodeValue] = useState("");
  
  // Toast State — two separate toasts
  // 1. Error toast: lives INSIDE the modal (above blur), for "Enter a 6-digit code"
  const [toastMessage, setToastMessage] = useState("");
  const toastSlideAnim = React.useRef(new Animated.Value(-80)).current;
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // 2. Success toast: lives OUTSIDE the modal in root View, persists after slide closes
  const [successToastMessage, setSuccessToastMessage] = useState("");
  const successToastSlideAnim = React.useRef(new Animated.Value(-80)).current;
  const successToastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    toastSlideAnim.stopAnimation();
    toastSlideAnim.setValue(-80);
    setToastMessage(msg);
    Animated.spring(toastSlideAnim, {
      toValue: 0,
      damping: 20,
      stiffness: 200,
      mass: 0.8,
      useNativeDriver: true,
    }).start(() => {
      toastTimerRef.current = setTimeout(() => {
        Animated.timing(toastSlideAnim, {
          toValue: -80,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setToastMessage("");
          toastTimerRef.current = null;
        });
      }, 3000);
    });
  };

  const showSuccessToast = (msg: string) => {
    if (successToastTimerRef.current) {
      clearTimeout(successToastTimerRef.current);
      successToastTimerRef.current = null;
    }
    successToastSlideAnim.stopAnimation();
    successToastSlideAnim.setValue(-80);
    setSuccessToastMessage(msg);
    Animated.spring(successToastSlideAnim, {
      toValue: 0,
      damping: 20,
      stiffness: 200,
      mass: 0.8,
      useNativeDriver: true,
    }).start(() => {
      successToastTimerRef.current = setTimeout(() => {
        Animated.timing(successToastSlideAnim, {
          toValue: -80,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setSuccessToastMessage("");
          successToastTimerRef.current = null;
        });
      }, 5000);
    });
  };

  // Swipe-up-to-dismiss for error toast
  const dismissErrorToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    Animated.timing(toastSlideAnim, {
      toValue: -80,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setToastMessage("");
    });
  };

  const errorToastPanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) {
          toastSlideAnim.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -20) {
          dismissErrorToast();
        } else {
          Animated.spring(toastSlideAnim, {
            toValue: 0,
            damping: 20,
            stiffness: 200,
            mass: 0.8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Swipe-up-to-dismiss for success toast
  const dismissSuccessToast = () => {
    if (successToastTimerRef.current) {
      clearTimeout(successToastTimerRef.current);
      successToastTimerRef.current = null;
    }
    Animated.timing(successToastSlideAnim, {
      toValue: -80,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSuccessToastMessage("");
    });
  };

  const successToastPanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) {
          successToastSlideAnim.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -20) {
          dismissSuccessToast();
        } else {
          Animated.spring(successToastSlideAnim, {
            toValue: 0,
            damping: 20,
            stiffness: 200,
            mass: 0.8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;
  
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const translateY = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  React.useEffect(() => {
    if (addCodeOpen) {
      translateY.setValue(SCREEN_HEIGHT);
      Animated.spring(translateY, {
        toValue: 0,
        damping: 28,
        stiffness: 250,
        mass: 0.8,
        useNativeDriver: true,
      } as any).start();
    }
  }, [addCodeOpen]);

  const closeAddCodeWithAnimation = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setAddCodeOpen(false);
      translateY.setValue(SCREEN_HEIGHT);
    });
  };

  const handleEnterCode = () => {
    if (addCodeValue.length === 0) return;
    
    if (addCodeValue.length < 6) {
      // Error: stays inside modal, above blur
      showToast("Enter a 6-digit code");
      return;
    }
    
    // Success: close modal first, then show success toast outside modal
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setAddCodeOpen(false);
      setAddCodeValue("");
      translateY.setValue(SCREEN_HEIGHT);
      showSuccessToast("Routine code successfully added!");
    });
  };

  const addCodePanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 2,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100 || g.vy > 0.3) {
          closeAddCodeWithAnimation();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 28,
            stiffness: 250,
            mass: 0.8,
            useNativeDriver: true,
          } as any).start();
        }
      },
    })
  ).current;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<any>(null);

  const handleDeleteClick = (routine: any) => {
    setRoutineToDelete(routine);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (routineToDelete) {
      const newRoutines = routines.filter((r: any) => r.id !== routineToDelete.id);
      setRoutines(newRoutines);
      try {
        await AsyncStorage.setItem('routines', JSON.stringify(newRoutines));
      } catch (e) {
        console.error("Failed to delete routine", e);
      }
    }
    setDeleteConfirmOpen(false);
    setRoutineToDelete(null);
  };

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterMinSteps, setFilterMinSteps] = useState("");
  const [filterMinDos, setFilterMinDos] = useState("");
  const [filterMinDonts, setFilterMinDonts] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ steps: null, dos: null, donts: null });

  const hasAnyFilter = filterMinSteps !== "" || filterMinDos !== "" || filterMinDonts !== "";
  const isFilterApplied = appliedFilters.steps !== null || appliedFilters.dos !== null || appliedFilters.donts !== null;

  let emptyStateMessage = "Adjust your search to find relevant results";
  if (isFilterApplied && searchQuery.trim().length > 0) {
    emptyStateMessage = "Adjust your search and filters to find relevant results";
  } else if (isFilterApplied) {
    emptyStateMessage = "Adjust your filters to find relevant results";
  }

  const applyFilters = () => {
    setAppliedFilters({
      steps: filterMinSteps === "" ? null : parseInt(filterMinSteps),
      dos: filterMinDos === "" ? null : parseInt(filterMinDos),
      donts: filterMinDonts === "" ? null : parseInt(filterMinDonts),
    });
    setFilterOpen(false);
  };

  const filteredRoutines = React.useMemo(() => {
    let result = [...routines];

    if (appliedFilters.steps !== null) {
      result = result.filter((r: any) => (r.stepsCount || 0) >= appliedFilters.steps!);
    }
    if (appliedFilters.dos !== null) {
      result = result.filter((r: any) => (r.dosCount || 0) >= appliedFilters.dos!);
    }
    if (appliedFilters.donts !== null) {
      result = result.filter((r: any) => (r.dontsCount || 0) >= appliedFilters.donts!);
    }

    if (searchQuery.trim().length > 0) {
      result = result.map((r: any) => ({
        ...r,
        searchScore: getSimilarityScore(searchQuery.trim(), r.title || '')
      }))
      .filter((r: any) => r.searchScore >= 40)
      .sort((a: any, b: any) => b.searchScore - a.searchScore);
    }
    return result;
  }, [routines, searchQuery, appliedFilters]);

  const resetFilters = () => {
    setFilterMinSteps("");
    setFilterMinDos("");
    setFilterMinDonts("");
    setAppliedFilters({ steps: null, dos: null, donts: null });
  };

  const handleStepsChange = (val: string) => {
    if (val === '') { setFilterMinSteps(''); return; }
    const num = parseInt(val);
    if (!isNaN(num)) setFilterMinSteps(num > 999 ? '999' : num.toString());
  };

  const handleDosChange = (val: string) => {
    if (val === '') { setFilterMinDos(''); return; }
    const num = parseInt(val);
    if (!isNaN(num)) setFilterMinDos(num > 999 ? '999' : num.toString());
  };

  const handleDontsChange = (val: string) => {
    if (val === '') { setFilterMinDonts(''); return; }
    const num = parseInt(val);
    if (!isNaN(num)) setFilterMinDonts(num > 999 ? '999' : num.toString());
  };

  return (
    <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      <Header title="Routines" />
      
      <View style={styles.content}>
        {routines.length > 0 ? (
          <>
            {/* Search Bar Container */}
            <View style={[styles.searchContainer, isDark ? styles.searchBgDark : styles.searchBgLight]}>
              <Search size={20} color={isDark ? "#71717a" : "#9ca3af"} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, isDark ? styles.textDark : styles.textLight]}
                placeholder="Search routines..."
                placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Pressable 
                onPress={() => setFilterOpen(true)} 
                style={({ pressed }) => [
                  styles.filterBtn,
                  isFilterApplied 
                    ? { backgroundColor: '#9333ea' } 
                    : (pressed ? (isDark ? { backgroundColor: '#27272a' } : { backgroundColor: '#f3f4f6' }) : null)
                ]}
              >
                <SlidersHorizontal size={18} color={isFilterApplied ? "#ffffff" : (isDark ? "#71717a" : "#9ca3af")} />
              </Pressable>
            </View>

            <View style={styles.actionButtonsContainer}>
              <Pressable style={styles.createBtnMain} onPress={() => router.push('/routine/create')}>
                <Plus size={16} color="#fff" strokeWidth={2.5} />
                <Text style={styles.createBtnMainText}>Create</Text>
              </Pressable>
              <Pressable 
                style={[styles.addCodeBtn, isDark ? styles.addCodeBtnDark : styles.addCodeBtnLight]}
                onPress={() => setAddCodeOpen(true)}
              >
                <Plus size={16} color={isDark ? "#d4d4d8" : "#4b5563"} strokeWidth={2.5} />
                <Text style={[styles.addCodeBtnText, isDark ? styles.textDark : styles.textLight]}>Add Code</Text>
              </Pressable>
            </View>

            {filteredRoutines.length > 0 ? (
              <ScrollView ref={mainScrollViewRef} style={styles.routineList} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false} {...mainScrollHandlers}>
                {filteredRoutines.map((routine: any) => (
                  <Pressable 
                  key={routine.id} 
                  style={[styles.routineCard, isDark ? styles.cardDark : styles.cardLight]}
                  onPress={() => router.push(`/routine/${routine.id}`)}
                >
                  <Text style={[styles.routineTitle, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
                    {routine.title}
                  </Text>
                  
                  <View style={styles.cardFooter}>
                    <View style={styles.badgesRow}>
                      <View style={[styles.badgeBlue, isDark && styles.badgeBlueDark]}>
                        <Text style={[styles.badgeBlueText, isDark && styles.badgeBlueTextDark]}>
                          {routine.stepsCount} STEPS
                        </Text>
                      </View>
                      
                      <View style={[styles.badgePurple, isDark && styles.badgePurpleDark]}>
                        <Pressable
                          style={styles.codeCopyBtn}
                          onPress={() => {
                            if (!hiddenCodes[routine.id]) {
                              const code = routine.id?.slice(-6).toUpperCase() || 'AAAAAA';
                              handleCopyCode(code);
                            }
                          }}
                          disabled={hiddenCodes[routine.id]}
                        >
                          {!hiddenCodes[routine.id] && (
                            <Copy size={13} color={isDark ? "#c084fc" : "#9333ea"} />
                          )}
                          <Text style={[styles.badgePurpleText, isDark && styles.badgePurpleTextDark]}>
                            {hiddenCodes[routine.id]
                              ? 'ROUTINE CODE'
                              : (copiedId === (routine.id?.slice(-6).toUpperCase() || 'AAAAAA')
                                  ? 'COPIED!'
                                  : (routine.id?.slice(-6).toUpperCase() || 'AAAAAA')
                                )
                            }
                          </Text>
                        </Pressable>
                        <View style={[styles.badgeDivider, isDark ? styles.badgeDividerDark : styles.badgeDividerLight]} />
                        <Pressable
                          style={styles.codeEyeBtn}
                          onPress={() => toggleCodeVisibility(routine.id)}
                        >
                          {hiddenCodes[routine.id]
                            ? <EyeOff size={13} color={isDark ? "#c084fc" : "#9333ea"} />
                            : <Eye size={13} color={isDark ? "#c084fc" : "#9333ea"} />
                          }
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.cardActions}>
                      <Pressable 
                        style={({ pressed }) => [
                          styles.cardActionBtn,
                          pressed && (isDark ? { backgroundColor: '#27272a' } : { backgroundColor: '#f3f4f6' })
                        ]} 
                        onPress={() => router.push(`/routine/create?edit=${routine.id}`)}
                      >
                        <Pencil size={18} color={isDark ? "#a1a1aa" : "#6b7280"} strokeWidth={2.5} />
                      </Pressable>
                      <Pressable 
                        style={({ pressed }) => [
                          styles.cardActionBtn,
                          pressed && (isDark ? { backgroundColor: '#27272a' } : { backgroundColor: '#f3f4f6' })
                        ]} 
                        onPress={() => handleDeleteClick(routine)}
                      >
                        <Trash2 size={18} color={isDark ? "#a1a1aa" : "#6b7280"} strokeWidth={2.5} />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              ))}
              </ScrollView>
            ) : (
              <View style={[styles.emptyState, { marginTop: 100, flex: 0 }]}>
                 <View style={[styles.emptyIconBg, isDark ? styles.iconBgDark : styles.iconBgLight]}>
                    <Search size={72} color={isDark ? "#52525b" : "#d1d5db"} strokeWidth={2.5} />
                 </View>
                 <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>
                    No result found
                 </Text>
                 <Text style={[styles.emptySubtitle, isDark ? styles.subtextDark : styles.subtextLight]}>
                    {emptyStateMessage}
                 </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
             <View style={[styles.emptyIconBg, isDark ? styles.iconBgDark : styles.iconBgLight]}>
                <Clock size={72} color={isDark ? "#52525b" : "#d1d5db"} />
             </View>
             <Text style={[styles.emptyTitle, isDark ? styles.textDark : styles.textLight]}>
                No routine added yet
             </Text>
             <Text style={[styles.emptySubtitle, isDark ? styles.subtextDark : styles.subtextLight]}>
                Start building your daily regimen to track your progress and achieve your goals.
             </Text>
             <Pressable style={styles.createBtn} onPress={() => router.push('/routine/create')}>
               <Plus size={16} color="#fff" />
               <Text style={styles.createBtnText}>Create Routine</Text>
             </Pressable>
          </View>
        )}
      </View>

      {/* Main Page Draggable Scroll-Down Circle */}
      <DraggableScrollDownCircle
        scrollViewRef={mainScrollViewRef}
        isSaveBtnVisible={isMainSaveBtnVisible}
        modalOpen={true}
        isDark={isDark}
        isFullScreenModal={false}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmOpen(false)}
      >
        <Pressable style={styles.deleteModalOverlay} onPress={() => setDeleteConfirmOpen(false)}>
          <View style={[styles.deleteModalContent, isDark ? styles.modalBgDark : styles.modalBgLight]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.deleteModalTitle, isDark ? styles.textDark : styles.textLight]}>
              Delete Routine?
            </Text>
            <Text style={[styles.deleteModalDesc, isDark ? styles.subtextDark : styles.subtextLight]}>
              This will delete your routine and it will be permanently deleted.
            </Text>
            <View style={styles.deleteModalActions}>
              <Pressable
                onPress={() => setDeleteConfirmOpen(false)}
                style={[styles.deleteActionBtn, isDark ? styles.inputBgDark : styles.inputBgLight]}
              >
                <Text style={[styles.actionBtnText, isDark ? styles.textDark : styles.textLight]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={executeDelete}
                style={[styles.deleteActionBtn, { backgroundColor: '#ef4444' }]}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
            <Pressable style={[styles.modalContent, isDark ? styles.modalBgDark : styles.modalBgLight]} onPress={(e) => e.stopPropagation()}>
              <Text style={[styles.modalTitle, isDark ? styles.subtextDark : styles.subtextLight]}>
                FILTER BY
              </Text>
              
              <View style={styles.filterRow}>
                <Text style={[styles.filterLabel, isDark ? styles.textDark : styles.textLight]}>Min Steps</Text>
                <TextInput 
                  style={[styles.filterInput, isDark ? styles.inputBgDark : styles.inputBgLight, isDark ? styles.textDark : styles.textLight]}
                  keyboardType="numeric"
                  value={filterMinSteps}
                  onChangeText={handleStepsChange}
                  placeholder="0"
                  placeholderTextColor={isDark ? "#52525b" : "#9ca3af"}
                />
              </View>

              <View style={styles.filterRow}>
                <Text style={[styles.filterLabel, isDark ? styles.textDark : styles.textLight]}>Min Do's</Text>
                <TextInput 
                  style={[styles.filterInput, isDark ? styles.inputBgDark : styles.inputBgLight, isDark ? styles.textDark : styles.textLight]}
                  keyboardType="numeric"
                  value={filterMinDos}
                  onChangeText={handleDosChange}
                  placeholder="0"
                  placeholderTextColor={isDark ? "#52525b" : "#9ca3af"}
                />
              </View>

              <View style={styles.filterRow}>
                <Text style={[styles.filterLabel, isDark ? styles.textDark : styles.textLight]}>Min Don'ts</Text>
                <TextInput 
                  style={[styles.filterInput, isDark ? styles.inputBgDark : styles.inputBgLight, isDark ? styles.textDark : styles.textLight]}
                  keyboardType="numeric"
                  value={filterMinDonts}
                  onChangeText={handleDontsChange}
                  placeholder="0"
                  placeholderTextColor={isDark ? "#52525b" : "#9ca3af"}
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={resetFilters}
                  disabled={!hasAnyFilter}
                  style={[styles.actionBtn, isDark ? styles.inputBgDark : styles.inputBgLight, !hasAnyFilter && styles.disabledBtn]}
                >
                  <Text style={[styles.actionBtnText, isDark ? styles.textDark : styles.textLight, !hasAnyFilter && styles.disabledText]}>Clear</Text>
                </Pressable>
                <Pressable
                  onPress={applyFilters}
                  disabled={!hasAnyFilter}
                  style={[styles.actionBtn, styles.applyBtn, !hasAnyFilter && styles.disabledBtn]}
                >
                  <Text style={[styles.applyBtnText, !hasAnyFilter && styles.disabledText]}>Apply</Text>
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Success Toast — OUTSIDE modal so it persists 5s after slide closes */}
      {successToastMessage ? (
        <Animated.View
          {...successToastPanResponder.panHandlers}
          style={[
            styles.toastContainer,
            isDark ? styles.toastDark : styles.toastLight,
            { transform: [{ translateY: successToastSlideAnim }], top: 50 }
          ]}
        >
          <Text style={isDark ? styles.toastTextDark : styles.toastTextLight}>
            {successToastMessage}
          </Text>
        </Animated.View>
      ) : null}

      {/* Add Code Bottom Sheet Modal */}
      <Modal visible={addCodeOpen} animationType="none" transparent onRequestClose={closeAddCodeWithAnimation}>
        <View style={styles.sheetOverlay}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable style={{ flex: 1 }} onPress={closeAddCodeWithAnimation} />

          {/* Toast — inside modal so it renders above the blur, slides down from top */}
          {toastMessage ? (
            <Animated.View
              {...errorToastPanResponder.panHandlers}
              style={[
                styles.toastContainer,
                isDark ? styles.toastDark : styles.toastLight,
                { transform: [{ translateY: toastSlideAnim }], top: 15 }
              ]}
            >
              <Text style={isDark ? styles.toastTextDark : styles.toastTextLight}>
                {toastMessage}
              </Text>
            </Animated.View>
          ) : null}
          
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetKeyboard}>
            <Animated.View style={[styles.sheetContent, isDark ? styles.bgDark : styles.bgLight, { transform: [{ translateY }] }]}>
              <View style={styles.sheetDragHandleContainer} {...addCodePanResponder.panHandlers}>
                <View style={[styles.sheetDragHandle, isDark ? styles.dragHandleDark : styles.dragHandleLight]} />
              </View>
              
              <View style={styles.sheetInner}>
                <Text style={[styles.sheetTitle, isDark ? styles.textDark : styles.textLight]}>Enter routine code</Text>
                
                <TextInput
                  style={[
                    styles.sheetInput,
                    isDark ? styles.sheetInputDark : styles.sheetInputLight,
                    isDark ? styles.textDark : styles.textLight,
                    addCodeValue.length > 0 ? { letterSpacing: 4 } : { letterSpacing: 0 }
                  ]}
                  placeholder="E.G. A3F9B2"
                  placeholderTextColor={isDark ? "#52525b" : "#9ca3af"}
                  value={addCodeValue}
                  maxLength={6}
                  autoCapitalize="characters"
                  onChangeText={(val) => {
                    const sanitized = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    setAddCodeValue(sanitized);
                  }}
                  onSubmitEditing={handleEnterCode}
                />
                
                <View style={styles.sheetActions}>
                  <Pressable 
                    onPress={closeAddCodeWithAnimation}
                    style={[styles.sheetActionBtn, isDark ? styles.sheetBtnCancelDark : styles.sheetBtnCancelLight]}
                  >
                    <Text style={[styles.sheetBtnCancelText, isDark ? styles.textDark : styles.textLight]}>Cancel</Text>
                  </Pressable>
                  <Pressable 
                    onPress={handleEnterCode}
                    disabled={addCodeValue.length === 0}
                    style={[styles.sheetActionBtn, styles.sheetBtnEnter, addCodeValue.length === 0 && styles.disabledBtn]}
                  >
                    <Text style={styles.sheetBtnEnterText}>Enter</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLight: { backgroundColor: '#ffffff' },
  bgDark: { backgroundColor: '#09090b' },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    zIndex: 10,
  },
  searchBgLight: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  searchBgDark: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  filterBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    borderRadius: 8,
  },
  textLight: { color: '#111827' },
  textDark: { color: '#ffffff' },
  subtextLight: { color: '#6b7280' },
  subtextDark: { color: '#a1a1aa' },
  
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50,
  },
  emptyIconBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconBgLight: { backgroundColor: '#f9fafb' },
  iconBgDark: { backgroundColor: '#18181b' },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
    marginBottom: 24,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9333ea',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  createBtnMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9333ea',
    height: 48,
    borderRadius: 12,
    gap: 6,
  },
  createBtnMainText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  addCodeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  addCodeBtnLight: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  addCodeBtnDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  addCodeBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  routineList: {
    flex: 1,
    marginTop: 16,
  },
  routineCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  cardDark: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeBlue: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  badgeBlueDark: {
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
  },
  badgeBlueText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeBlueTextDark: {
    color: '#60a5fa',
  },
  badgePurple: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    padding: 3,
    borderRadius: 8,
  },
  badgePurpleDark: {
    backgroundColor: 'rgba(88, 28, 135, 0.3)',
  },
  codeCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
  },
  badgePurpleText: {
    color: '#9333ea',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgePurpleTextDark: {
    color: '#c084fc',
  },
  badgeDivider: {
    width: 1,
    height: 14,
    marginHorizontal: 2,
  },
  badgeDividerLight: {
    backgroundColor: '#d8b4fe',
  },
  badgeDividerDark: {
    backgroundColor: 'rgba(107, 33, 168, 0.7)',
  },
  codeEyeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: -4,
  },
  cardActionBtn: {
    padding: 8,
    borderRadius: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent', // Removed dark background
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  keyboardView: {
    flex: 1,
  },
  modalContent: {
    position: 'absolute',
    top: 130,
    right: 16,
    width: 200,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    // shadow
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 8,
  },
  deleteModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
    elevation: 10,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  deleteModalDesc: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBgLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  modalBgDark: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  modalTitle: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 1,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterInput: {
    width: 60,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '500',
    paddingLeft: 4,
    paddingRight: 8,
    paddingTop: 0,
    paddingBottom: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputBgLight: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  inputBgDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  applyBtn: {
    backgroundColor: '#9333ea',
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },

  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetKeyboard: {
    width: '100%',
    alignItems: 'center',
  },
  sheetContent: {
    width: '100%',
    maxWidth: 430,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    boxShadow: '0px -10px 40px rgba(0, 0, 0, 0.15)',
    elevation: 20,
    overflow: 'hidden',
  },
  sheetDragHandleContainer: {
    width: '100%',
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  sheetDragHandle: {
    width: 56,
    height: 6,
    borderRadius: 3,
  },
  dragHandleLight: {
    backgroundColor: '#d1d5db',
  },
  dragHandleDark: {
    backgroundColor: '#3f3f46',
  },
  sheetInner: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  sheetInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  sheetInputLight: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  sheetInputDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  sheetActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnCancelLight: {
    backgroundColor: '#f3f4f6',
  },
  sheetBtnCancelDark: {
    backgroundColor: '#27272a',
  },
  sheetBtnCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sheetBtnEnter: {
    backgroundColor: '#9333ea',
    boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.25)',
    elevation: 4,
  },
  sheetBtnEnterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
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
  toastTextLight: { fontSize: 14, fontWeight: '500', textAlign: 'center', color: '#ffffff' },
  toastTextDark: { fontSize: 14, fontWeight: '500', textAlign: 'center', color: '#111827' }
});
