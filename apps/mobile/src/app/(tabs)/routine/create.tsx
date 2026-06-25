import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
  Image,
  Linking,
  DeviceEventEmitter,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter, useLocalSearchParams, useNavigation, useFocusEffect } from 'expo-router';
import { Plus, Trash2, Pencil, X, List, AlignLeft, Eye, ExternalLink, AlertCircle, Package } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/components/layout/Header';
import * as ImagePicker from 'expo-image-picker';
import { DraggableScrollDownCircle, useDraggableScroll } from '@/components/ui/draggable-scroll-down-circle';


export default function CreateRoutineScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  // Toast sits 16px above the tab bar top: tabBar(64) + safeArea + 16px gap
  const toastBottom = 24;
  const params = useLocalSearchParams();
  const editId = params.edit as string;

  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState([1]);
  const [stepData, setStepData] = useState<Record<number, any>>({});
  const [drafts, setDrafts] = useState<Record<number, any>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState({ title: "", stepData: {} });

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  
  const [actionTitle, setActionTitle] = useState("");
  const [actionDesc, setActionDesc] = useState("");
  const [actionFormat, setActionFormat] = useState<"paragraph" | "pointers">("paragraph");
  const [actionPointers, setActionPointers] = useState<string[]>([""]);
  
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productImage, setProductImage] = useState("");
  const [productLink, setProductLink] = useState("");
  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  
  const [dos, setDos] = useState([""]);
  const [donts, setDonts] = useState([""]);

  // Toast State
  const [toastMessage, setToastMessage] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartXRef = useRef(0);

  // Generic Viewer Modal state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerConfig, setViewerConfig] = useState<{
    title: string;
    content: string | string[];
    link: string;
    iconType: string;
    image?: string;
    desc?: string;
  }>({
    title: "",
    content: "",
    link: "",
    iconType: "",
    desc: ""
  });
  const [viewerSlideIndex, setViewerSlideIndex] = useState(0);

  // Custom Confirmation Dialogs
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<number | null>(null);
  const [unsavedWarningOpen, setUnsavedWarningOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const discardAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (discardConfirmOpen) {
      discardAnim.setValue(0.9);
      Animated.spring(discardAnim, {
        toValue: 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [discardConfirmOpen]);

  const [pendingAction, setPendingAction] = useState<any>(null);
  const isDiscarding = useRef(false);

  // STRICT RULE: Wipe ALL data every time this screen is focused in Create mode (no editId)
  useFocusEffect(
    useCallback(() => {
      if (!editId) {
        setTitle("");
        setStepData({});
        setSteps([1]);
        setOriginalData({ title: "", stepData: {} });
        setDrafts({});
        setActionTitle("");
        setActionDesc("");
        setActionFormat("paragraph");
        setActionPointers([""]);
        setProductName("");
        setProductDesc("");
        setProductImage("");
        setProductLink("");
        setDos([""]);
        setDonts([""]);
        setEditingId(null);
        AsyncStorage.removeItem('routine_drafts').catch(() => {});
      }
    }, [editId])
  );

  // Focus effect for tab interception
  useFocusEffect(
    useCallback(() => {
      const isDirty = JSON.stringify({ title: title.trim(), stepData }) !== JSON.stringify(originalData);
      DeviceEventEmitter.emit('createRoutineDirtyState', isDirty);
      
      const sub = DeviceEventEmitter.addListener('showUnsavedWarning', (targetRoute) => {
        setPendingAction(targetRoute);
        setUnsavedWarningOpen(true);
      });

      return () => {
        DeviceEventEmitter.emit('createRoutineDirtyState', false);
        sub.remove();
      };
    }, [title, stepData, originalData])
  );

  // Global navigation guard for unsaved changes (stack/back button)
  useEffect(() => {
    const isDirty = JSON.stringify({ title: title.trim(), stepData }) !== JSON.stringify(originalData);
    
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty || isDiscarding.current) {
        return;
      }
      e.preventDefault();
      setPendingAction(e.data.action);
      setUnsavedWarningOpen(true);
    });

    return unsubscribe;
  }, [navigation, title, stepData, originalData]);

  // --- Drag-to-dismiss UX for Action Sheet ---
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const scrollWidth = SCREEN_WIDTH * 0.85;
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const viewerScrollRef = useRef<ScrollView>(null);
  const viewerTouchStartX = useRef(0);

  // ScrollView tracking for Modal to show/hide the scroll down circle
  const modalScrollViewRef = useRef<ScrollView>(null);
  const { scrollHandlers, isSaveBtnVisible } = useDraggableScroll({
    modalOpen,
    activeStep,
    scrollViewRef: modalScrollViewRef,
  });

  // ScrollView tracking for main page to show/hide the scroll down circle
  const mainScrollViewRef = useRef<ScrollView>(null);
  const { scrollHandlers: mainScrollHandlers, isSaveBtnVisible: isMainSaveBtnVisible } = useDraggableScroll({
    modalOpen: true,
    activeStep: steps.length,
    scrollViewRef: mainScrollViewRef,
    shouldScrollToTop: false,
  });


  // Hydrate drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const storedDrafts = await AsyncStorage.getItem('routine_drafts');
        if (storedDrafts) {
          setDrafts(JSON.parse(storedDrafts));
        }
      } catch (e) {
        console.error("Failed to load drafts", e);
      }
    };
    loadDrafts();
  }, []);

  // Hydrate routine details if in Edit Mode
  useEffect(() => {
    if (editId) {
      setEditingId(editId);
      const loadRoutineToEdit = async () => {
        try {
          const existingRoutinesJson = await AsyncStorage.getItem('routines');
          const existingRoutines = existingRoutinesJson ? JSON.parse(existingRoutinesJson) : [];
          const routineToEdit = existingRoutines.find((r: any) => r.id === editId);
          if (routineToEdit) {
            setTitle(routineToEdit.title || "");
            setStepData(routineToEdit.stepData || {});
            setOriginalData({ title: routineToEdit.title || "", stepData: routineToEdit.stepData || {} });
            const loadedSteps = Object.keys(routineToEdit.stepData || {}).map(k => parseInt(k));
            if (loadedSteps.length > 0) {
              setSteps(loadedSteps.sort((a, b) => a - b));
            }
          }
        } catch (e) {
          console.error("Error loading routine for edit", e);
        }
      };
      loadRoutineToEdit();
    } else {
      setEditingId(null);
      setTitle("");
      setStepData({});
      setSteps([1]);
      setOriginalData({ title: "", stepData: {} });
    }
  }, [editId]);

  // Reset & spring-enter when action modal opens
  useEffect(() => {
    if (modalOpen) {
      translateY.setValue(SCREEN_HEIGHT);
      Animated.spring(translateY, {
        toValue: 0,
        damping: 28,
        stiffness: 250,
        mass: 0.8,
        useNativeDriver: true,
      } as any).start();
    }
  }, [modalOpen]);

  const showToast = (msg: string) => {
    // Cancel any running dismiss timer so re-triggers reset the 3s window (same as web app)
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    // Stop any in-progress animations and snap to visible
    fadeAnim.stopAnimation();
    slideAnim.stopAnimation();
    fadeAnim.setValue(0);
    slideAnim.setValue(20);

    setToastMessage(msg);

    // Animate IN
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      // Hold for 3000ms — same as web app setTimeout 3000
      toastTimerRef.current = setTimeout(() => {
        // Animate OUT
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 20, duration: 220, useNativeDriver: true }),
        ]).start(() => {
          setToastMessage("");
          toastTimerRef.current = null;
        });
      }, 3000);
    });
  };

  // Swipe-down-to-dismiss for toast (toast comes from bottom, so dismiss = swipe down)
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
        // Only allow downward drag (positive dy = toward bottom)
        if (g.dy > 0) {
          slideAnim.setValue(g.dy);
          // Fade out proportionally
          const opacity = Math.max(0, 1 - (g.dy / 60));
          fadeAnim.setValue(opacity);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 20) {
          dismissToast();
        } else {
          // Snap back
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: 0,
              damping: 20,
              stiffness: 200,
              mass: 0.8,
              useNativeDriver: true,
            }),
            Animated.spring(fadeAnim, {
              toValue: 1,
              damping: 20,
              stiffness: 200,
              mass: 0.8,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const closeWithAnimation = (callback?: () => void) => {
    if (activeStep !== null) {
      // Save state to drafts upon close
      const currentDraft = {
        actionTitle,
        actionDesc,
        actionFormat,
        actionPointers: actionPointers.filter(p => p.trim() !== ""),
        productName,
        productDesc,
        productImage,
        productLink,
        dos: dos.filter(d => d.trim() !== ""),
        donts: donts.filter(d => d.trim() !== "")
      };

      setDrafts(prev => {
        const newDrafts = { ...prev, [activeStep]: currentDraft };
        AsyncStorage.setItem('routine_drafts', JSON.stringify(newDrafts)).catch(err => console.error(err));
        return newDrafts;
      });
    }

    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setModalOpen(false);
      translateY.setValue(SCREEN_HEIGHT);
      callback?.();
    });
  };

  // PanResponder — only on the drag handle
  const panResponder = useRef(
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
          closeWithAnimation();
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

  const openModal = (step: number) => {
    setActiveStep(step);
    const saved = stepData[step];
    const draft = drafts[step];

    if (saved) {
      setActionTitle(saved.actionTitle || "");
      setActionDesc(saved.actionDesc || "");
      setActionFormat(saved.actionFormat || "paragraph");
      setActionPointers(saved.actionPointers?.length > 0 ? [...saved.actionPointers, ""] : [""]);
      setProductName(saved.productName || "");
      setProductDesc(saved.productDesc || "");
      setProductImage(saved.productImage || "");
      setProductLink(saved.productLink || "");
      setDos(saved.dos?.length > 0 ? [...saved.dos, ""] : [""]);
      setDonts(saved.donts?.length > 0 ? [...saved.donts, ""] : [""]);
    } else if (draft) {
      setActionTitle(draft.actionTitle || "");
      setActionDesc(draft.actionDesc || "");
      setActionFormat(draft.actionFormat || "paragraph");
      setActionPointers(draft.actionPointers?.length > 0 ? [...draft.actionPointers, ""] : [""]);
      setProductName(draft.productName || "");
      setProductDesc(draft.productDesc || "");
      setProductImage(draft.productImage || "");
      setProductLink(draft.productLink || "");
      setDos(draft.dos?.length > 0 ? [...draft.dos, ""] : [""]);
      setDonts(draft.donts?.length > 0 ? [...draft.donts, ""] : [""]);
    } else {
      setActionTitle("");
      setActionDesc("");
      setActionFormat("paragraph");
      setActionPointers([""]);
      setProductName("");
      setProductDesc("");
      setProductImage("");
      setProductLink("");
      setDos([""]);
      setDonts([""]);
    }
    setModalOpen(true);
  };

  const LIST_LIMITS = { actionPointers: 20, dos: 20, donts: 20 };
  const LIST_NAMES = { actionPointers: "action pointers", dos: "do's", donts: "don'ts" };

  const handleListUpdate = (setter: any, list: string[], index: number, value: string, listKey?: "actionPointers" | "dos" | "donts") => {
    let newList = [...list];
    newList[index] = value;
    
    while (newList.length > 0 && newList[newList.length - 1] === "") {
      newList.pop();
    }

    const limit = listKey ? LIST_LIMITS[listKey] : 999;
    const filledCount = newList.filter(i => i.trim() !== "").length;
    if (filledCount >= limit) {
      if (listKey) showToast(`Max ${limit} ${LIST_NAMES[listKey]} per step`);
    } else {
      newList.push("");
    }
    setter(newList);
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showToast("Access to photo library is required");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const asset = pickerResult.assets[0];
      if (asset.fileSize && asset.fileSize > 500 * 1024) {
        showToast("Image size must be less than 500KB");
        return;
      }
      setProductImage(asset.uri);
    }
  };

  const saveAction = () => {
    if (activeStep !== null) {
      setStepData(prev => ({
        ...prev,
        [activeStep]: {
          actionTitle,
          actionDesc,
          actionFormat,
          actionPointers: actionPointers.filter(p => p.trim() !== ""),
          productName,
          productDesc,
          productImage,
          productLink,
          dos: dos.filter(d => d.trim() !== ""),
          donts: donts.filter(d => d.trim() !== "")
        }
      }));

      // Flush draft on save
      setDrafts(prev => {
        const newDrafts = { ...prev };
        delete newDrafts[activeStep!];
        AsyncStorage.setItem('routine_drafts', JSON.stringify(newDrafts)).catch(err => console.error(err));
        return newDrafts;
      });
    }

    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setModalOpen(false);
      translateY.setValue(SCREEN_HEIGHT);
      setActiveStep(null);
    });
  };

  const executeDelete = (step: number) => {
    if (steps.length === 1) {
      setStepData({});
      setDrafts({});
      AsyncStorage.removeItem('routine_drafts').catch(err => console.error(err));
      setDeleteConfirmOpen(false);
      setStepToDelete(null);
      return;
    }
    
    const newSteps = Array.from({ length: steps.length - 1 }, (_, i) => i + 1);
    const newStepData: Record<number, any> = {};
    const newDrafts: Record<number, any> = {};
    
    for (let i = 1; i <= newSteps.length; i++) {
      if (i < step) {
        if (stepData[i]) newStepData[i] = stepData[i];
        if (drafts[i]) newDrafts[i] = drafts[i];
      } else {
        if (stepData[i + 1]) newStepData[i] = stepData[i + 1];
        if (drafts[i + 1]) newDrafts[i] = drafts[i + 1];
      }
    }
    
    setSteps(newSteps);
    setStepData(newStepData);
    setDrafts(newDrafts);
    AsyncStorage.setItem('routine_drafts', JSON.stringify(newDrafts)).catch(err => console.error(err));
    setDeleteConfirmOpen(false);
    setStepToDelete(null);
  };

  const handleDeleteStepPress = (step: number) => {
    if (stepData[step]) {
      setStepToDelete(step);
      setDeleteConfirmOpen(true);
    } else {
      executeDelete(step);
    }
  };

  const handleCreateRoutine = async () => {
    if (!title.trim()) {
      showToast("Please add your routine name");
      return;
    }
    if (Object.keys(stepData).length === 0) {
      showToast("Please add at least one action step");
      return;
    }

    try {
      const existingRoutinesJson = await AsyncStorage.getItem('routines');
      const existingRoutines = existingRoutinesJson ? JSON.parse(existingRoutinesJson) : [];
      
      if (editingId) {
        const updatedRoutines = existingRoutines.map((r: any) => {
          if (r.id === editingId) {
            return {
              ...r,
              title: title.trim(),
              stepsCount: Object.keys(stepData).length,
              stepData: stepData,
              updatedAt: new Date().toISOString()
            };
          }
          return r;
        });
        await AsyncStorage.setItem('routines', JSON.stringify(updatedRoutines));
      } else {
        const newRoutine = {
          id: Date.now().toString(),
          title: title.trim(),
          stepsCount: Object.keys(stepData).length,
          stepData: stepData,
          createdAt: new Date().toISOString()
        };
        await AsyncStorage.setItem('routines', JSON.stringify([newRoutine, ...existingRoutines]));
      }

      await AsyncStorage.removeItem('routine_drafts'); // flush all drafts on creation
      // Update the snapshot so dirty check is clean if user re-enters this edit page
      setOriginalData({ title: title.trim(), stepData });
      showToast(editingId ? "Routine updated successfully!" : "Routine created successfully!");
      setTimeout(() => {
        router.push('/routine');
      }, 500);
    } catch (e) {
      showToast("Failed to save routine");
    }
  };

  // handleBackPress removed since beforeRemove listener catches everything

  const openViewer = (title: string, content: string | string[], iconType: string, link: string = "", image: string = "", desc: string = "") => {
    setViewerConfig({ title, content, iconType, link, image, desc });
    setViewerSlideIndex(0);
    setViewerOpen(true);
    setTimeout(() => {
      viewerScrollRef.current?.scrollTo({ x: 0, animated: false });
    }, 50);
  };

  const handleScrollEnd = (e: any) => {
    const contentOffset = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / scrollWidth);
    setViewerSlideIndex(index);
  };

  return (
    <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      <Header title={editingId ? "Edit Routine" : "Create Routine"} />
      
      <ScrollView 
        ref={mainScrollViewRef}
        style={styles.scroll} 
        contentContainerStyle={styles.content}
        {...mainScrollHandlers}
      >
        <Text style={[styles.label, isDark ? styles.textSubDark : styles.textSubLight]}>
          New Routine Name
        </Text>
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
          placeholder="e.g. Morning Skincare"
          placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
          value={title}
          onChangeText={setTitle}
          maxLength={50}
        />

        <View style={styles.stepsContainer}>
          {steps.map(step => {
            const data = stepData[step];
            return (
              <View key={step} style={styles.stepWrapper}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepLabel}>STEP {step}</Text>
                  <View style={styles.stepActions}>
                    {data && (
                      <Pressable 
                        onPress={() => openModal(step)} 
                        style={({ pressed }) => [
                          styles.iconBtn,
                          pressed && (isDark ? { backgroundColor: '#27272a' } : { backgroundColor: '#f3f4f6' })
                        ]}
                      >
                        <Pencil size={18} color={isDark ? "#a1a1aa" : "#6b7280"} />
                      </Pressable>
                    )}
                    <Pressable 
                      onPress={() => handleDeleteStepPress(step)} 
                      style={({ pressed }) => [
                        styles.iconBtn,
                        pressed && (isDark ? { backgroundColor: '#27272a' } : { backgroundColor: '#f3f4f6' })
                      ]}
                    >
                      <Trash2 size={18} color={isDark ? "#a1a1aa" : "#6b7280"} />
                    </Pressable>
                  </View>
                </View>

                {data ? (
                  <View style={[styles.filledCard, isDark ? styles.cardDark : styles.cardLight]}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={[styles.actionTitle, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
                        {data.actionTitle || "Action Step"}
                      </Text>
                      {data.actionTitle && data.actionTitle.length > 25 && (
                        <Pressable 
                          onPress={() => openViewer("ACTION TITLE", data.actionTitle, "title")} 
                          style={[styles.squareEyeBtn, isDark ? styles.squareEyeBtnDark : styles.squareEyeBtnLight]}
                        >
                          <Eye size={14} color={isDark ? "#a1a1aa" : "#6b7280"} />
                        </Pressable>
                      )}
                    </View>
                    
                    <View style={styles.cardHeaderRow}>
                      {data.actionFormat === "pointers" && data.actionPointers?.length > 0 ? (
                        <Text style={[styles.actionDesc, isDark ? styles.textSubDark : styles.textSubLight]} numberOfLines={1}>
                          • {data.actionPointers[0]}
                        </Text>
                      ) : data.actionDesc ? (
                        <Text style={[styles.actionDesc, isDark ? styles.textSubDark : styles.textSubLight]} numberOfLines={1}>
                          {data.actionDesc}
                        </Text>
                      ) : null}

                      {((data.actionFormat === "pointers" && data.actionPointers?.length > 0) || (data.actionFormat !== "pointers" && data.actionDesc?.length > 50)) && (
                        <Pressable 
                          onPress={() => openViewer(
                            data.actionFormat === "pointers" ? "ACTION POINTERS" : "ACTION DESCRIPTION", 
                            data.actionFormat === "pointers" ? data.actionPointers : data.actionDesc, 
                            data.actionFormat === "pointers" ? "action" : "desc"
                          )} 
                          style={[styles.squareEyeBtn, isDark ? styles.squareEyeBtnDark : styles.squareEyeBtnLight]}
                        >
                          <Eye size={14} color={isDark ? "#a1a1aa" : "#6b7280"} />
                        </Pressable>
                      )}
                    </View>
                    
                    <View style={styles.pillsRow}>
                      {data.dos?.length > 0 && (
                        <Pressable onPress={() => openViewer("DO'S", data.dos, "do")} style={[styles.pillGreen, isDark && styles.pillGreenDark]}>
                          <Text style={[styles.pillTextGreen, isDark && styles.pillTextGreenDark]}>{data.dos.length} Do{data.dos.length > 1 ? "'s" : ""}</Text>
                        </Pressable>
                      )}
                      {data.donts?.length > 0 && (
                        <Pressable onPress={() => openViewer("DON'TS", data.donts, "dont")} style={[styles.pillRed, isDark && styles.pillRedDark]}>
                          <Text style={[styles.pillTextRed, isDark && styles.pillTextRedDark]}>{data.donts.length} Don't{data.donts.length > 1 ? "s" : ""}</Text>
                        </Pressable>
                      )}
                      {data.productName ? (
                        <Pressable onPress={() => openViewer("PRODUCT NAME", data.productName, "product", data.productLink, data.productImage, data.productDesc)} style={[styles.pillYellow, isDark && styles.pillYellowDark]}>
                          <Package size={13} color={isDark ? "#fbbf24" : "#b45309"} style={{ marginRight: 2 }} />
                          <Text style={[styles.pillTextYellow, isDark && styles.pillTextYellowDark]} numberOfLines={1}>{data.productName}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ) : (
                  <Pressable 
                    onPress={() => openModal(step)}
                    style={({ pressed }) => [
                      styles.emptyCard,
                      isDark ? styles.emptyCardDark : styles.emptyCardLight,
                      pressed && (isDark ? styles.emptyCardPressedDark : styles.emptyCardPressedLight)
                    ]}
                  >
                    <Plus size={20} color={isDark ? "#a1a1aa" : "#9ca3af"} />
                    <Text style={[styles.emptyCardText, isDark ? styles.textSubDark : styles.textSubLight]}>
                      Add Action
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.bottomRow}>
          <Pressable 
            onPress={() => setSteps(prev => [...prev, prev.length + 1])}
            style={[styles.addStepBtn, isDark ? styles.inputDark : styles.inputLight]}
          >
            <Plus size={16} color={isDark ? "#d4d4d8" : "#4b5563"} />
            <Text style={[styles.addStepText, isDark ? styles.textDark : styles.textLight]}>Add step</Text>
          </Pressable>
          <Pressable onPress={handleCreateRoutine} style={styles.createBtn}>
            <Text style={styles.createBtnText}>{editingId ? "Save Changes" : "Create Routine"}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Main Page Draggable Scroll-Down Circle */}
      <DraggableScrollDownCircle
        scrollViewRef={mainScrollViewRef}
        isSaveBtnVisible={isMainSaveBtnVisible}
        modalOpen={true}
        isDark={isDark}
        isFullScreenModal={false}
      />

      {/* Toast Notification */}
      {toastMessage ? (
        <Animated.View
          {...toastPanResponder.panHandlers}
          style={[
            styles.toastContainer,
            isDark ? styles.toastDark : styles.toastLight,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }], bottom: toastBottom }
          ]}
        >
          <Text style={isDark ? styles.toastTextDark : styles.toastTextLight}>
            {toastMessage}
          </Text>
        </Animated.View>
      ) : null}

      {/* Generic Viewer Modal */}
      <Modal visible={viewerOpen} animationType="fade" transparent onRequestClose={() => setViewerOpen(false)}>
        <View style={styles.viewerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setViewerOpen(false)}>
            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
          
          <View style={[styles.viewerCard, isDark ? styles.viewerCardDark : styles.viewerCardLight]}>
            {/* Scrollable inner content - no fixed heights, grows with content up to maxHeight */}
            <ScrollView
              style={{ width: '100%' }}
              contentContainerStyle={styles.viewerScrollContent}
              showsVerticalScrollIndicator={true}
            >
              {/* Title label - centered, uppercase, small */}
              <View style={[styles.viewerHeader, viewerConfig.iconType === "product" ? { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' } : {}]}>
                {viewerConfig.iconType === "product" && (
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(120, 53, 15, 0.3)' : '#fef3c7', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                    <Package size={16} color={isDark ? "#fbbf24" : "#d97706"} />
                  </View>
                )}
                <Text style={[styles.viewerTitle, isDark ? styles.textSubDark : styles.textSubLight]}>
                  {Array.isArray(viewerConfig.content) 
                    ? `${viewerSlideIndex + 1} of ${viewerConfig.content.length} ${viewerConfig.title}` 
                    : viewerConfig.title}
                </Text>
              </View>

              {/* Content area */}
              {Array.isArray(viewerConfig.content) ? (
                // Lists (DO's, DON'Ts, Pointers) — single item view with swipe detection
                <View
                  onTouchStart={e => { viewerTouchStartX.current = e.nativeEvent.pageX; }}
                  onTouchEnd={e => {
                    const touchEndX = e.nativeEvent.pageX;
                    if (viewerTouchStartX.current - touchEndX > 50) {
                      if (viewerSlideIndex < viewerConfig.content.length - 1) setViewerSlideIndex(v => v + 1);
                    } else if (touchEndX - viewerTouchStartX.current > 50) {
                      if (viewerSlideIndex > 0) setViewerSlideIndex(v => v - 1);
                    }
                  }}
                  style={{ width: '100%', marginBottom: 24 }}
                >
                  {viewerConfig.content.length > 0 && (
                    <View
                      style={[
                        styles.carouselSlideCard,
                        viewerConfig.iconType === "do" 
                          ? (isDark ? styles.slideGreenDark : styles.slideGreen) 
                          : viewerConfig.iconType === "dont" 
                          ? (isDark ? styles.slideRedDark : styles.slideRed) 
                          : (isDark ? styles.slidePurpleDark : styles.slidePurple),
                        { width: '100%', borderWidth: 1 }
                      ]}
                    >
                      <Text style={[styles.carouselSlideText, isDark ? styles.textDark : styles.textLight]}>
                        {viewerConfig.content[viewerSlideIndex]}
                      </Text>
                    </View>
                  )}
                </View>
              ) : viewerConfig.iconType === "product" ? (
                // Product details
                <View style={{ alignItems: 'stretch', width: '100%' }}>
                  <View style={[styles.viewerTextBox, isDark ? styles.viewerTextBoxDark : styles.viewerTextBoxLight]}>
                    <Text style={[styles.viewerTextContent, isDark ? styles.textDark : styles.textLight]}>
                      {viewerConfig.content as string}
                    </Text>
                  </View>
                  {viewerConfig.desc ? (
                    <View style={[styles.viewerTextBox, isDark ? styles.viewerTextBoxDark : styles.viewerTextBoxLight, { marginTop: -12 }]}>
                      <Text style={[styles.viewerTextContent, isDark ? styles.textDark : styles.textLight]}>
                        {viewerConfig.desc}
                      </Text>
                    </View>
                  ) : null}
                  {viewerConfig.image ? (
                    <View style={[styles.viewerProductImageContainer, isDark ? styles.viewerProductImageContainerDark : null]}>
                      <Image source={{ uri: viewerConfig.image }} style={styles.viewerProductImage} />
                    </View>
                  ) : null}
                  {viewerConfig.link ? (
                    <Pressable 
                      onPress={() => Linking.openURL(viewerConfig.link.startsWith('http') ? viewerConfig.link : `https://${viewerConfig.link}`).catch(err => showToast("Could not open URL"))}
                      style={[styles.linkButton, isDark ? styles.linkButtonDark : null]}
                    >
                      <Text style={[styles.linkButtonText, isDark ? styles.linkButtonTextDark : null]} numberOfLines={1}>{viewerConfig.link}</Text>
                      <ExternalLink size={16} color={isDark ? "#9ca3af" : "#6b7280"} strokeWidth={2.5} />
                    </Pressable>
                  ) : null}
                </View>
              ) : viewerConfig.iconType === "desc" ? (
                // Action Description — gray bordered box (same as web app)
                <View style={[styles.viewerTextBox, isDark ? styles.viewerTextBoxDark : styles.viewerTextBoxLight]}>
                  <Text style={[styles.viewerTextContent, isDark ? styles.textDark : styles.textLight]}>
                    {viewerConfig.content as string}
                  </Text>
                </View>
              ) : (
                // Action Title — gray bordered box, same as Action Description (matches web app)
                <View style={[styles.viewerTextBox, isDark ? styles.viewerTextBoxDark : styles.viewerTextBoxLight]}>
                  <Text style={[styles.viewerTextContent, isDark ? styles.textDark : styles.textLight]}>
                    {viewerConfig.content as string}
                  </Text>
                </View>
              )}

              {/* Close button — always at the bottom, full width purple */}
              <Pressable onPress={() => setViewerOpen(false)} style={styles.viewerCloseBtn}>
                <Text style={styles.viewerCloseBtnText}>Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Step Confirmation Modal */}
      <Modal visible={deleteConfirmOpen} animationType="fade" transparent onRequestClose={() => setDeleteConfirmOpen(false)}>
        <View style={styles.dialogOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDeleteConfirmOpen(false)}>
            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
          <View style={[styles.dialogCard, isDark ? styles.dialogCardDark : styles.dialogCardLight]}>
            <Text style={[styles.dialogTitle, isDark ? styles.textDark : styles.textLight]}>Delete Step?</Text>
            <Text style={[styles.dialogDesc, isDark ? styles.textSubDark : styles.textSubLight]}>
              Are you sure you want to delete this step? All action data will be lost.
            </Text>
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setDeleteConfirmOpen(false)} style={[styles.dialogBtn, styles.dialogBtnCancel, isDark ? styles.dialogBtnCancelDark : styles.dialogBtnCancelLight]}>
                <Text style={[styles.dialogBtnText, isDark ? styles.textSubDark : styles.textSubLight]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => stepToDelete !== null && executeDelete(stepToDelete)} style={[styles.dialogBtn, styles.dialogBtnDelete]}>
                <Text style={[styles.dialogBtnText, { color: '#fff' }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Unsaved & Discard Confirmation Modals (Combined for seamless transition) */}
      <Modal visible={unsavedWarningOpen || discardConfirmOpen} animationType="fade" transparent onRequestClose={() => {
        if (discardConfirmOpen) setDiscardConfirmOpen(false);
        else setUnsavedWarningOpen(false);
      }}>
        <View style={styles.dialogOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => {
            if (discardConfirmOpen) setDiscardConfirmOpen(false);
            else setUnsavedWarningOpen(false);
          }}>
            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
          
          {unsavedWarningOpen && !discardConfirmOpen && (
            <View style={[styles.dialogCard, isDark ? styles.dialogCardDark : styles.dialogCardLight, { alignItems: 'center' }]}>
              <View style={[styles.warningIconContainer, isDark ? styles.warningIconContainerDark : styles.warningIconContainerLight]}>
                <AlertCircle size={28} color={isDark ? "#fbbf24" : "#b45309"} />
              </View>
              <Text style={[styles.dialogTitle, isDark ? styles.textDark : styles.textLight]}>Unsaved Routine</Text>
              <Text style={[styles.dialogDesc, isDark ? styles.textSubDark : styles.textSubLight, { textAlign: 'center' }]}>
                You have unsaved changes. Do you want to save this routine before leaving?
              </Text>
              <View style={styles.dialogActions}>
                <Pressable onPress={() => { 
                  setUnsavedWarningOpen(false); 
                  setDiscardConfirmOpen(true);
                }} style={[styles.dialogBtn, styles.dialogBtnCancel, isDark ? styles.dialogBtnCancelDark : styles.dialogBtnCancelLight]}>
                  <Text style={[styles.dialogBtnText, isDark ? styles.textSubDark : styles.textSubLight]}>Discard</Text>
                </Pressable>
                <Pressable onPress={() => { 
                  setUnsavedWarningOpen(false); 
                  isDiscarding.current = true;
                  handleCreateRoutine(); 
                }} style={[styles.dialogBtn, styles.dialogBtnSave]}>
                  <Text style={[styles.dialogBtnText, { color: '#fff' }]}>Save Now</Text>
                </Pressable>
              </View>
            </View>
          )}

          {discardConfirmOpen && (
            <Animated.View style={[styles.dialogCard, isDark ? styles.dialogCardDark : styles.dialogCardLight, { alignItems: 'center', transform: [{ scale: discardAnim }] }]}>
              <View style={[styles.warningIconContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2' }]}>
                <AlertCircle size={28} color={isDark ? "#f87171" : "#ef4444"} />
              </View>
              <Text style={[styles.dialogTitle, isDark ? styles.textDark : styles.textLight]}>Discard Changes?</Text>
              <Text style={[styles.dialogDesc, isDark ? styles.textSubDark : styles.textSubLight, { textAlign: 'center' }]}>
                Your recent changes will be trashed and cannot be recovered. Are you sure you want to discard?
              </Text>
              <View style={styles.dialogActions}>
                <Pressable onPress={() => {
                  setDiscardConfirmOpen(false);
                  setUnsavedWarningOpen(true);
                }} style={[styles.dialogBtn, styles.dialogBtnCancel, isDark ? styles.dialogBtnCancelDark : styles.dialogBtnCancelLight]}>
                  <Text style={[styles.dialogBtnText, isDark ? styles.textSubDark : styles.textSubLight]}>Cancel</Text>
                </Pressable>
                <Pressable onPress={() => {
                  setDiscardConfirmOpen(false);
                  isDiscarding.current = true;
                  router.push('/routine');
                }} style={[styles.dialogBtn, styles.dialogBtnDelete]}>
                  <Text style={[styles.dialogBtnText, { color: '#fff' }]}>Continue</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </View>
      </Modal>

      {/* Add Action Modal */}
      <Modal visible={modalOpen} animationType="none" transparent onRequestClose={() => closeWithAnimation()}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />

          <Pressable style={{ flex: 1 }} onPress={() => closeWithAnimation()} />

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKeyboard}>
            <Animated.View 
              style={[styles.modalContent, isDark ? styles.bgDark : styles.bgLight, { transform: [{ translateY }], maxHeight: SCREEN_HEIGHT - (64 + insets.top) }]}
            >
              <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
                <View style={[styles.dragHandle, isDark ? styles.dragHandleDark : styles.dragHandleLight]} />
              </View>
              
              <ScrollView 
                ref={modalScrollViewRef}
                style={styles.modalScroll} 
                contentContainerStyle={{ paddingBottom: 20 + insets.bottom }}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDark ? 'white' : 'black'}
                {...scrollHandlers}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
                    Step {activeStep} — Add Action
                  </Text>
                  <Pressable onPress={() => closeWithAnimation()} style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]}>
                    <X size={16} color={isDark ? "#a1a1aa" : "#6b7280"} />
                  </Pressable>
                </View>

                {/* Action Title */}
                <Text style={[styles.label, styles.uppercaseLabel, isDark ? styles.textSubDark : styles.textSubLight]}>
                  Action Title
                </Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  placeholder="e.g. Apply Vitamin C"
                  placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                  value={actionTitle}
                  onChangeText={setActionTitle}
                  maxLength={99}
                />

                {/* Action Description Header with format toggle */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[styles.label, styles.uppercaseLabel, isDark ? styles.textSubDark : styles.textSubLight, { marginBottom: 0 }]}>
                    Action Description
                  </Text>
                  <Pressable 
                    onPress={() => {
                      if (actionFormat === "paragraph") {
                        if (actionDesc.trim() !== "") {
                          setActionPointers([actionDesc.trim(), ""]);
                        } else {
                          setActionPointers([""]);
                        }
                        setActionFormat("pointers");
                      } else {
                        const filtered = actionPointers.filter(p => p.trim() !== "");
                        if (filtered.length > 0) {
                          setActionDesc(filtered.join("\n"));
                        }
                        setActionFormat("paragraph");
                      }
                    }}
                    style={{ padding: 4 }}
                  >
                    {actionFormat === "paragraph" ? (
                      <List size={18} color={isDark ? "#a1a1aa" : "#6b7280"} />
                    ) : (
                      <AlignLeft size={18} color={isDark ? "#a1a1aa" : "#6b7280"} />
                    )}
                  </Pressable>
                </View>

                {actionFormat === "paragraph" ? (
                  <TextInput
                    multiline
                    style={[
                      styles.input, 
                      styles.textArea, 
                      isDark ? styles.inputDark : styles.inputLight,
                      { maxHeight: 120 } // Max 5 lines limit
                    ]}
                    placeholder="Describe what to do in this step..."
                    placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                    value={actionDesc}
                    onChangeText={setActionDesc}
                    maxLength={1000}
                  />
                ) : (
                  <View style={{ marginBottom: 12 }}>
                    {actionPointers.slice(0, LIST_LIMITS.actionPointers).map((item, index) => (
                      <View key={`ptr-${index}`} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                        <Text style={{ width: 24, textAlign: 'right', color: isDark ? '#a1a1aa' : '#6b7280', fontWeight: '600', marginTop: 14 }}>
                          {index + 1}.
                        </Text>
                        <TextInput
                          multiline
                          style={[
                            styles.input, 
                            { 
                              height: 'auto', 
                              minHeight: 48, 
                              maxHeight: 120, // Max 5 lines scroll limit
                              paddingTop: 12, 
                              paddingBottom: 12, 
                              flex: 1, 
                              marginBottom: 0 
                            },
                            isDark ? styles.inputDark : styles.inputLight
                          ]}
                          placeholder={index === 0 ? "e.g. Apply on damp skin" : "Add another pointer..."}
                          placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                          value={item}
                          onChangeText={(val) => handleListUpdate(setActionPointers, actionPointers, index, val, "actionPointers")}
                          maxLength={1000}
                        />
                      </View>
                    ))}
                  </View>
                )}

                {/* Product Name */}
                <Text style={[styles.label, styles.uppercaseLabel, isDark ? styles.textSubDark : styles.textSubLight]}>
                  Product Name <Text style={{ textTransform: 'none', fontWeight: '400' }}>(optional)</Text>
                </Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  placeholder="e.g. Glow Recipe Dew Drops"
                  placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                  value={productName}
                  onChangeText={setProductName}
                  maxLength={99}
                />

                {/* Conditionally Rendered Product Fields */}
                {productName.trim() !== "" && (
                  <>
                    <Text style={[styles.label, styles.uppercaseLabel, isDark ? styles.textSubDark : styles.textSubLight]}>
                      Product Description <Text style={{ textTransform: 'none', fontWeight: '400' }}>(optional)</Text>
                    </Text>
                    <TextInput
                      multiline
                      style={[
                        styles.input, 
                        styles.textArea, 
                        isDark ? styles.inputDark : styles.inputLight,
                        { maxHeight: 100 }
                      ]}
                      placeholder="Short description of the product..."
                      placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                      value={productDesc}
                      onChangeText={setProductDesc}
                      maxLength={99}
                    />

                    <Text style={[styles.label, styles.uppercaseLabel, isDark ? styles.textSubDark : styles.textSubLight]}>
                      Product Image <Text style={{ textTransform: 'none', fontWeight: '400' }}>(optional)</Text>
                    </Text>
                    {productImage ? (
                      <Pressable onPress={() => setPreviewImageOpen(true)}>
                        <View style={[styles.imageContainer, { borderColor: isDark ? '#27272a' : '#e5e7eb' }]}>
                          <Image source={{ uri: productImage }} style={styles.imagePreview} />
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              setProductImage("");
                            }}
                            style={styles.removeImageBtn}
                          >
                            <X size={14} color="#fff" />
                          </Pressable>
                        </View>
                      </Pressable>
                    ) : (
                      <Pressable 
                        onPress={handleImagePicker}
                        style={[styles.imagePickerPlaceholder, isDark ? styles.inputDark : styles.inputLight]}
                      >
                        <Plus size={20} color={isDark ? "#a1a1aa" : "#6b7280"} />
                        <Text style={[styles.imagePickerText, isDark ? styles.textSubDark : styles.textSubLight]}>Add Image</Text>
                      </Pressable>
                    )}

                    <Text style={[styles.label, styles.uppercaseLabel, isDark ? styles.textSubDark : styles.textSubLight]}>
                      Product Link <Text style={{ textTransform: 'none', fontWeight: '400' }}>(optional)</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                      placeholder="https://..."
                      placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                      value={productLink}
                      onChangeText={setProductLink}
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </>
                )}

                <View style={{ height: 16 }} />

                {/* DO List */}
                <Text style={[styles.label, styles.uppercaseLabel, { color: '#16a34a' }]}>
                  ✓ DO <Text style={{ textTransform: 'none', fontWeight: '400' }}>(optional)</Text>
                </Text>
                {dos.slice(0, LIST_LIMITS.dos).map((item, index) => (
                  <View key={`do-${index}`} style={{ flexDirection: 'row', gap: 8 }}>
                    <Text style={{ width: 24, textAlign: 'right', color: '#16a34a', fontWeight: '600', marginTop: 14 }}>{index + 1}.</Text>
                    <TextInput
                      multiline
                      style={[
                        styles.input, 
                        { 
                          height: 'auto', 
                          minHeight: 48, 
                          maxHeight: 120, // 5 line scroll limit
                          paddingTop: 12, 
                          paddingBottom: 12, 
                          flex: 1, 
                          marginBottom: 8, 
                          backgroundColor: isDark ? '#14532d15' : '#f0fdf4', 
                          borderColor: isDark ? '#16653450' : '#bbf7d0', 
                          color: isDark ? '#fff' : '#111827' 
                        }
                      ]}
                      placeholder={index === 0 ? "e.g. Apply on damp skin" : "Add another do..."}
                      placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                      value={item}
                      onChangeText={(val) => handleListUpdate(setDos, dos, index, val, "dos")}
                      maxLength={1000}
                    />
                  </View>
                ))}

                <View style={{ height: 16 }} />

                {/* DON'T List */}
                <Text style={[styles.label, styles.uppercaseLabel, { color: '#ef4444' }]}>
                  ✕ DON'T <Text style={{ textTransform: 'none', fontWeight: '400' }}>(optional)</Text>
                </Text>
                {donts.slice(0, LIST_LIMITS.donts).map((item, index) => (
                  <View key={`dont-${index}`} style={{ flexDirection: 'row', gap: 8 }}>
                    <Text style={{ width: 24, textAlign: 'right', color: '#ef4444', fontWeight: '600', marginTop: 14 }}>{index + 1}.</Text>
                    <TextInput
                      multiline
                      style={[
                        styles.input, 
                        { 
                          height: 'auto', 
                          minHeight: 48, 
                          maxHeight: 120, // 5 line scroll limit
                          paddingTop: 12, 
                          paddingBottom: 12, 
                          flex: 1, 
                          marginBottom: 8, 
                          backgroundColor: isDark ? '#7f1d1d15' : '#fef2f2', 
                          borderColor: isDark ? '#991b1b50' : '#fecaca', 
                          color: isDark ? '#fff' : '#111827' 
                        }
                      ]}
                      placeholder={index === 0 ? "e.g. Avoid eye area" : "Add another don't..."}
                      placeholderTextColor={isDark ? "#71717a" : "#9ca3af"}
                      value={item}
                      onChangeText={(val) => handleListUpdate(setDonts, donts, index, val, "donts")}
                      maxLength={1000}
                    />
                  </View>
                ))}

                {/* Save Action Button inside ScrollView */}
                <View style={{ marginTop: 12, marginBottom: 0 }}>
                  <Pressable 
                    onPress={saveAction} 
                    disabled={!actionTitle.trim() || (actionFormat === "paragraph" ? !actionDesc.trim() : actionPointers.filter(p => p.trim() !== "").length === 0)}
                    style={[
                      styles.createBtn, 
                      (!actionTitle.trim() || (actionFormat === "paragraph" ? !actionDesc.trim() : actionPointers.filter(p => p.trim() !== "").length === 0)) && { opacity: 0.5 }
                    ]}
                  >
                    <Text style={styles.createBtnText}>Save Action Step {activeStep}</Text>
                  </Pressable>
                </View>
                
              </ScrollView>
              
              {/* Draggable Scroll-Down Circle */}
              <DraggableScrollDownCircle
                scrollViewRef={modalScrollViewRef}
                isSaveBtnVisible={isSaveBtnVisible}
                modalOpen={modalOpen}
                isDark={isDark}
                isFullScreenModal={true}
              />

            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <Modal visible={previewImageOpen} transparent={true} animationType="fade" onRequestClose={() => setPreviewImageOpen(false)}>
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewImageOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.fullScreenImageContainer}>
            <Image source={{ uri: productImage || '' }} style={styles.fullScreenImage} resizeMode="contain" />
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLight: { backgroundColor: '#ffffff' },
  bgDark: { backgroundColor: '#09090b' },
  scroll: { flex: 1 },
  content: { padding: 16 },
  
  label: { fontSize: 15, fontWeight: '500', marginBottom: 6, marginLeft: 4, fontFamily: 'Outfit_500Medium' },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
    fontFamily: 'Outfit_500Medium'
  },
  textArea: { height: 'auto', minHeight: 66, paddingTop: 12, paddingBottom: 12, textAlignVertical: 'top' },
  inputLight: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#111827' },
  inputDark: { backgroundColor: '#18181b', borderColor: '#27272a', color: '#ffffff' },
  textLight: { color: '#111827' },
  textDark: { color: '#ffffff' },
  textSubLight: { color: '#6b7280' },
  textSubDark: { color: '#a1a1aa' },

  stepsContainer: { gap: 16 },
  stepWrapper: { flex: 1 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingHorizontal: 4 },
  stepLabel: { fontSize: 15, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.5, fontFamily: 'Outfit_700Bold' },
  stepActions: { flexDirection: 'row', gap: 4, marginRight: -8 },
  iconBtn: { padding: 8, borderRadius: 8 },

  emptyCard: {
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyCardLight: { backgroundColor: '#f9fafb', borderColor: '#d1d5db' },
  emptyCardPressedLight: { backgroundColor: '#f3f4f6' },
  emptyCardDark: { backgroundColor: '#18181b', borderColor: '#3f3f46' },
  emptyCardPressedDark: { backgroundColor: '#27272a' },
  emptyCardText: { fontSize: 16, fontWeight: '500', fontFamily: 'Outfit_500Medium' },

  filledCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardDark: { backgroundColor: '#09090b', borderColor: '#27272a' },
  cardLight: { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, width: '100%' },
  actionTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'Outfit_600SemiBold', flex: 1 },
  actionDesc: { fontSize: 14, fontFamily: 'Outfit_400Regular', flex: 1, lineHeight: 18 },

  squareEyeBtn: { 
    width: 24, 
    height: 24, 
    borderRadius: 6, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginLeft: 8,
    flexShrink: 0,
  },
  squareEyeBtnLight: { backgroundColor: '#f3f4f6' },
  squareEyeBtnDark: { backgroundColor: '#27272a' },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  pillGreen: { backgroundColor: '#dcfce7', paddingLeft: 10, paddingRight: 6, paddingVertical: 5, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  pillGreenDark: { backgroundColor: 'rgba(22, 163, 74, 0.15)' },
  pillTextGreen: { color: '#15803d', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  pillTextGreenDark: { color: '#4ade80' },
  pillRed: { backgroundColor: '#fee2e2', paddingLeft: 10, paddingRight: 6, paddingVertical: 5, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  pillRedDark: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  pillTextRed: { color: '#b91c1c', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  pillTextRedDark: { color: '#f87171' },
  pillYellow: { backgroundColor: '#fef3c7', paddingLeft: 10, paddingRight: 6, paddingVertical: 5, borderRadius: 6, maxWidth: 160, flexDirection: 'row', alignItems: 'center', gap: 4 },
  pillYellowDark: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  pillTextYellow: { color: '#b45309', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', flexShrink: 1 },
  pillTextYellowDark: { color: '#fbbf24' },
  pillEye: { padding: 2 },

  bottomRow: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  addStepBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addStepText: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit_600SemiBold' },
  createBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#9333ea', alignItems: 'center', justifyContent: 'center' },
  createBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600', fontFamily: 'Outfit_600SemiBold' },

  modalOverlay: { flex: 1, flexDirection: 'column' },
  modalKeyboard: { justifyContent: 'flex-end', width: '100%' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', flexDirection: 'column', width: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Outfit_700Bold' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeBtnLight: { backgroundColor: '#f3f4f6' },
  closeBtnDark: { backgroundColor: '#27272a' },
  dragHandleContainer: { width: '100%', alignItems: 'center', paddingTop: 16, paddingBottom: 8, flexShrink: 0 },
  dragHandle: { width: 56, height: 6, borderRadius: 999 },
  dragHandleLight: { backgroundColor: '#d1d5db' },
  dragHandleDark: { backgroundColor: '#3f3f46' },
  uppercaseLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  modalScroll: { flexGrow: 1, flexShrink: 1, paddingHorizontal: 20 },

  // Conditional Product Fields specific styles
  imageContainer: {
    width: '100%',
    height: 128,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerPlaceholder: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    marginBottom: 12,
    flexDirection: 'column',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Outfit_500Medium',
  },

  // Generic Viewer Modal Specific styles
  // Card: no fixed height — grows with content, capped at 80% of screen height
  viewerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  viewerCard: { width: '85%', maxHeight: '82%', borderRadius: 20, overflow: 'hidden', boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.3)', elevation: 10 },
  viewerCardLight: { backgroundColor: '#ffffff' },
  viewerCardDark: { backgroundColor: '#18181b' },
  viewerScrollContent: { padding: 20 },
  viewerHeader: { width: '100%', alignItems: 'center', marginBottom: 16 },
  viewerTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  // Carousel for arrays (DO's, DON'Ts, Pointers)
  carouselSlideCard: { borderRadius: 12, padding: 16, justifyContent: 'flex-start', alignItems: 'stretch', marginHorizontal: 4, borderWidth: 1 },
  slideGreen: { backgroundColor: '#f0fdf490', borderColor: '#bbf7d0' },
  slideGreenDark: { backgroundColor: '#14532d15', borderColor: '#16653450' },
  slideRed: { backgroundColor: '#fef2f290', borderColor: '#fecaca' },
  slideRedDark: { backgroundColor: '#7f1d1d15', borderColor: '#991b1b50' },
  slidePurple: { backgroundColor: '#faf5ff90', borderColor: '#e9d5ff' },
  slidePurpleDark: { backgroundColor: '#18181b', borderColor: '#27272a' },
  carouselSlideText: { fontSize: 14, fontWeight: '500', textAlign: 'left', fontFamily: 'Outfit_500Medium', lineHeight: 21 },
  // Plain text content box (Action Title + Action Description) — gray card matching web app
  viewerTextBox: { width: '100%', borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 24 },
  viewerTextBoxLight: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  viewerTextBoxDark: { backgroundColor: 'rgba(39,39,42,0.5)', borderColor: 'rgba(63,63,70,0.5)' },
  viewerTextContent: { fontSize: 15, lineHeight: 22, fontFamily: 'Outfit_400Regular' },
  // Action Title plain text — bold, no box, matches web app
  viewerTitleContent: { fontSize: 15, fontWeight: '600', lineHeight: 22, fontFamily: 'Outfit_600SemiBold', marginBottom: 24 },
  // Product details
  viewerProductTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4, textAlign: 'left', fontFamily: 'Outfit_600SemiBold', width: '100%' },
  viewerProductDesc: { fontSize: 14, textAlign: 'left', marginBottom: 20, fontFamily: 'Outfit_400Regular', width: '100%' },
  viewerProductImageContainer: { width: '100%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 24, backgroundColor: '#f9fafb' },
  viewerProductImageContainerDark: { borderColor: 'rgba(63,63,70,0.5)', backgroundColor: 'rgba(39,39,42,0.5)' },
  viewerProductImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImageContainer: { width: '90%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden' },
  fullScreenImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  linkButton: { width: '100%', height: 48, borderRadius: 12, backgroundColor: '#f9fafb', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 24 },
  linkButtonDark: { backgroundColor: 'rgba(39,39,42,0.5)', borderColor: 'rgba(63,63,70,0.5)' },
  linkButtonText: { fontSize: 14, color: '#374151', fontWeight: '500', flex: 1, marginRight: 8 },
  linkButtonTextDark: { color: '#d1d5db' },
  // Close button — full width purple, same as web (py-2.5 = 10px vertical, mt-auto)
  viewerCloseBtn: { width: '100%', height: 40, borderRadius: 12, backgroundColor: '#9333ea', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  viewerCloseBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600', fontFamily: 'Outfit_600SemiBold' },

  // Custom Confirmation Dialogs
  dialogOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dialogCard: { width: '80%', borderRadius: 20, padding: 24, boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.25)', elevation: 8 },
  dialogCardLight: { backgroundColor: '#ffffff' },
  dialogCardDark: { backgroundColor: '#1c1c1e' },
  dialogTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, fontFamily: 'Outfit_700Bold' },
  dialogDesc: { fontSize: 14, lineHeight: 20, marginBottom: 24, fontFamily: 'Outfit_400Regular' },
  dialogActions: { flexDirection: 'row', gap: 12, width: '100%' },
  dialogBtn: { flex: 1, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dialogBtnCancel: { borderWidth: 1 },
  dialogBtnCancelLight: { backgroundColor: '#f4f4f5', borderColor: '#e4e4e7' },
  dialogBtnCancelDark: { backgroundColor: '#27272a', borderColor: '#3f3f46' },
  dialogBtnDelete: { backgroundColor: '#ef4444' },
  dialogBtnSave: { backgroundColor: '#9333ea' },
  dialogBtnText: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit_600SemiBold' },
  warningIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  warningIconContainerLight: { backgroundColor: '#fef3c7' },
  warningIconContainerDark: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },

  // Custom Toast styling
  toastContainer: {
    position: 'absolute',
    // bottom is set dynamically via inline style (64 tabBar + safeArea + 16 gap)
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.2)',
    elevation: 10,
    borderWidth: 1,
    zIndex: 9999,
  },
  // Light mode: dark bg (gray-900/90) with white text — same as web app
  toastLight: { backgroundColor: '#111827', borderColor: '#374151' },
  // Dark mode: white bg with gray-900 text — same as web app
  toastDark: { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  // Text always contrasts the background
  toastTextLight: { fontSize: 14, fontWeight: '500', fontFamily: 'Outfit_500Medium', textAlign: 'center', color: '#ffffff' },
  toastTextDark: { fontSize: 14, fontWeight: '500', fontFamily: 'Outfit_500Medium', textAlign: 'center', color: '#111827' },
});

