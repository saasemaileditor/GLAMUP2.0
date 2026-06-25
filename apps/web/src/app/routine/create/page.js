"use client";

import { CheckCircle2, XCircle, ChevronLeft, Search, Plus, Trash2, Save, X, List, AlignLeft, GripVertical, Info, ExternalLink, AlertCircle, Pencil, Eye, Package } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation, useMotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import { DraggableScrollDownCircle, useDraggableScroll } from "@/components/ui/DraggableScrollDownCircle";

const ProductIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 -960 960 960" width="100%" fill="currentColor" className={className}>
    <path d="M200-80 40-520l200-120v-240h160v240l200 120L440-80H200Zm480 0q-17 0-28.5-11.5T640-120q0-17 11.5-28.5T680-160h120v-80H680q-17 0-28.5-11.5T640-280q0-17 11.5-28.5T680-320h120v-80H680q-17 0-28.5-11.5T640-440q0-17 11.5-28.5T680-480h120v-80H680q-17 0-28.5-11.5T640-600q0-17 11.5-28.5T680-640h120v-80H680q-17 0-28.5-11.5T640-760q0-17 11.5-28.5T680-800h160q33 0 56.5 23.5T920-720v560q0 33-23.5 56.5T840-80H680Zm-424-80h128l118-326-124-74H262l-124 74 118 326Zm64-200Z"/>
  </svg>
);

const AddImageIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" className={className}>
    <path d="M480-480ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h320v80H200v560h560v-320h80v320q0 33-23.5 56.5T760-120H200Zm40-160h480L570-480 450-320l-90-120-120 160Zm440-320v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z"/>
  </svg>
);

export default function CreateRoutinePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState([1]);
  const [editingId, setEditingId] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [actionTitle, setActionTitle] = useState("");
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productLink, setProductLink] = useState("");
  const [actionDesc, setActionDesc] = useState("");
  const [actionFormat, setActionFormat] = useState("paragraph");
  const [actionPointers, setActionPointers] = useState([""]);
  const [productImage, setProductImage] = useState("");
  
  const [dos, setDos] = useState([""]);
  const [donts, setDonts] = useState([""]);
  const [previewImageOpen, setPreviewImageOpen] = useState(false);

  const [stepData, setStepData] = useState({});
  const [originalData, setOriginalData] = useState({ title: "", stepData: {} });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState(null);

  const [toastMessage, setToastMessage] = useState("");

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerConfig, setViewerConfig] = useState({
    title: "",
    content: "",
    link: "",
    iconType: "",
    desc: ""
  });
  const [viewerSlideIndex, setViewerSlideIndex] = useState(0);
  const [viewerSlideDirection, setViewerSlideDirection] = useState(1);

  const [drafts, setDrafts] = useState({});
  const [unsavedWarningOpen, setUnsavedWarningOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState("");

  const viewportRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // Hook for Modal Add Action Sheet Draggable Scroll Down Circle
  const { isSaveBtnVisible } = useDraggableScroll({
    active: modalOpen,
    scrollAreaRef,
    resetDependency: activeStep,
    shouldScrollToTop: true,
  });

  // Hook for Main Page Draggable Scroll Down Circle (uses window scrolling)
  const { isSaveBtnVisible: isMainSaveBtnVisible } = useDraggableScroll({
    active: true,
    scrollAreaRef: useRef(null), // not used for window
    resetDependency: steps.length,
    shouldScrollToTop: false,
    useMainElement: true,
  });

  // Handle unsaved changes global events
  useEffect(() => {
    // Global click interceptor for Next.js internal links
    const handleAnchorClick = (e) => {
      if (!window.hasUnsavedRoutineChanges) return;
      
      const target = e.target.closest('a');
      if (target && target.href && !target.hasAttribute('download') && target.target !== '_blank') {
        const url = new URL(target.href);
        if (url.origin === window.location.origin) {
          e.preventDefault();
          e.stopPropagation();
          setPendingPath(url.pathname + url.search + url.hash);
          setUnsavedWarningOpen(true);
        }
      }
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    
    // Catch browser reloads/closes
    const handleBeforeUnload = (e) => {
      if (window.hasUnsavedRoutineChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Update global dirty state
    const isDirty = title.trim() !== (originalData.title || "").trim() || JSON.stringify(stepData) !== JSON.stringify(originalData.stepData);
    window.hasUnsavedRoutineChanges = isDirty;

    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.hasUnsavedRoutineChanges = false;
    };
  }, [title, stepData, originalData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewerOpen && Array.isArray(viewerConfig.content)) {
        if (e.key === "ArrowLeft") {
          if (viewerSlideIndex > 0) {
            setViewerSlideDirection(-1);
            setViewerSlideIndex(prev => prev - 1);
          }
        } else if (e.key === "ArrowRight") {
          if (viewerSlideIndex < viewerConfig.content.length - 1) {
            setViewerSlideDirection(1);
            setViewerSlideIndex(prev => prev + 1);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewerOpen, viewerConfig.content, viewerSlideIndex]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const editId = searchParams.get("edit");
      if (editId) {
        setEditingId(editId);
        try {
          const existingRoutines = JSON.parse(localStorage.getItem('routines') || '[]');
          const routineToEdit = existingRoutines.find(r => r.id === editId);
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
      } else {
        setEditingId(null);
        setTitle("");
        setStepData({});
        setSteps([1]);
        setOriginalData({ title: "", stepData: {} });
      }
    }
  }, []);

  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => {
        const textareas = document.querySelectorAll('.sheet-scroll');
        textareas.forEach(t => {
          t.style.height = "auto";
          t.style.height = t.scrollHeight + "px";
        });
      }, 50);
    }
  }, [modalOpen]);

  useEffect(() => {
    if (modalOpen || viewerOpen || deleteConfirmOpen || unsavedWarningOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen, viewerOpen, deleteConfirmOpen, unsavedWarningOpen]);

  const openModal = (step) => {
    setActiveStep(step);
    if (stepData[step]) {
      setActionTitle(stepData[step].actionTitle || "");
      setProductName(stepData[step].productName || "");
      setProductDesc(stepData[step].productDesc || "");
      setProductLink(stepData[step].productLink || "");
      setActionDesc(stepData[step].actionDesc || "");
      setActionFormat(stepData[step].actionFormat || "paragraph");
      setActionPointers(stepData[step].actionPointers || [""]);
      setProductImage(stepData[step].productImage || "");
      setDos([...stepData[step].dos, ""]);
      setDonts([...stepData[step].donts, ""]);
    } else if (drafts[step]) {
      setActionTitle(drafts[step].actionTitle || "");
      setProductName(drafts[step].productName || "");
      setProductDesc(drafts[step].productDesc || "");
      setProductLink(drafts[step].productLink || "");
      setActionDesc(drafts[step].actionDesc || "");
      setActionFormat(drafts[step].actionFormat || "paragraph");
      setActionPointers(drafts[step].actionPointers || [""]);
      setProductImage(drafts[step].productImage || "");
      setDos([...drafts[step].dos, ""]);
      setDonts([...drafts[step].donts, ""]);
    } else {
      setActionTitle("");
      setProductName("");
      setProductDesc("");
      setProductLink("");
      setActionDesc("");
      setActionFormat("paragraph");
      setActionPointers([""]);
      setProductImage("");
      setDos([""]);
      setDonts([""]);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    if (activeStep !== null) {
      setDrafts(prev => ({
        ...prev,
        [activeStep]: {
          actionTitle, productName, productDesc, productLink, actionDesc, actionFormat, actionPointers, productImage, dos: dos.filter(d => d.trim() !== ""), donts: donts.filter(d => d.trim() !== "")
        }
      }));
    }
    setModalOpen(false);
  };

  const handleAutoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const LIST_LIMITS = { actionPointers: 20, dos: 20, donts: 20 };
  const LIST_NAMES = { actionPointers: "action pointers", dos: "do's", donts: "don'ts" };

  const handleListUpdate = (setter, list, index, value, listKey) => {
    let newList = [...list];
    newList[index] = value;
    
    while (newList.length > 0 && newList[newList.length - 1] === "") {
      newList.pop();
    }

    // Enforce limit: don't add a new empty slot if already at max
    const limit = listKey ? LIST_LIMITS[listKey] : 999;
    const filledCount = newList.filter(i => i.trim() !== "").length;
    if (filledCount >= limit) {
      if (listKey) showToast(`Max ${limit} ${LIST_NAMES[listKey]} per step`);
    } else {
      newList.push("");
    }
    
    setter(newList);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      showToast("Image size must be less than 500KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setProductImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const saveAction = () => {
    setStepData(prev => ({
      ...prev,
      [activeStep]: {
        actionTitle,
        actionDesc,
        actionFormat,
        actionPointers: actionPointers.filter(d => d.trim() !== ""),
        productName,
        productDesc,
        productLink,
        productImage,
        dos: dos.filter(d => d.trim() !== ""),
        donts: donts.filter(d => d.trim() !== "")
      }
    }));
    
    setDrafts(prev => {
      const newDrafts = { ...prev };
      delete newDrafts[activeStep];
      return newDrafts;
    });
    setModalOpen(false);
  };

  const executeDelete = (stepParam) => {
    const targetStep = stepParam || stepToDelete;
    if (steps.length === 1) {
      setStepData({});
      setDrafts({});
      setDeleteConfirmOpen(false);
      setStepToDelete(null);
      return;
    }
    
    const newSteps = Array.from({ length: steps.length - 1 }, (_, i) => i + 1);
    
    const newStepData = {};
    const newDrafts = {};
    for (let i = 1; i <= newSteps.length; i++) {
      if (i < targetStep) {
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
    setDeleteConfirmOpen(false);
    setStepToDelete(null);
  };

  const handleDeleteStep = (step, e) => {
    e.stopPropagation();
    if (stepData[step] || drafts[step]) {
      setStepToDelete(step);
      setDeleteConfirmOpen(true);
    } else {
      executeDelete(step);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleCreateRoutine = () => {
    if (!title.trim()) {
      showToast("Please add your routine name");
      return;
    }
    if (Object.keys(stepData).length === 0) {
      showToast("Please add at least one action step");
      return;
    }
    
    try {
      const existingRoutines = JSON.parse(localStorage.getItem('routines') || '[]');
      
      if (editingId) {
        // Update existing routine
        const updatedRoutines = existingRoutines.map(r => {
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
        localStorage.setItem('routines', JSON.stringify(updatedRoutines));
        showToast("Routine updated successfully!");
      } else {
        // Create new routine
        const newRoutine = {
          id: Date.now().toString(),
          title: title.trim(),
          stepsCount: Object.keys(stepData).length,
          stepData: stepData,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('routines', JSON.stringify([newRoutine, ...existingRoutines]));
        showToast("Routine created successfully!");
      }
      
      setOriginalData({ title: title.trim(), stepData });
      
      setTimeout(() => {
        router.push('/routine');
      }, 500);
    } catch (e) {
      showToast("Error saving routine");
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .sheet-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sheet-scroll::-webkit-scrollbar-track {
          background: transparent;
          margin-top: 10px;
          margin-bottom: 10px;
        }
        .sheet-scroll::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 10px;
        }
        .dark .sheet-scroll::-webkit-scrollbar-thumb {
          background-color: #3f3f46;
        }
      `}} />

      <div className="flex flex-col bg-white dark:bg-zinc-950">
        <div className="px-4 pt-4 flex-1 flex flex-col">

          {/* Title Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">
              New Routine Name
            </label>
            <input
              type="text"
              maxLength={50}
              placeholder="e.g. Morning Skincare"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-gray-300 dark:focus:border-zinc-700 focus:ring-0 transition-all text-base font-medium"
            />
          </div>

          {/* Steps List */}
          <div className="flex flex-col gap-3">
            {steps.map((step) => {
              const data = stepData[step];
              return (
              <div key={step} className="flex flex-col group relative">
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                    Step {step}
                  </span>
                  <div className="flex items-center -space-x-1 opacity-100 transition-opacity pr-1">
                    {data && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); openModal(step); }}
                        className="p-2 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Pencil size={14} strokeWidth={2.5} />
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleDeleteStep(step, e)}
                      className="p-2 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Trash2 size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                {data ? (
                  <div 
                    className="w-full rounded-xl border border-solid border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1 gap-2 w-full">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm flex-1">
                        {data.actionTitle || "Action Step"}
                      </h3>
                      {data.actionTitle && data.actionTitle.length > 35 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewerConfig({ title: "ACTION TITLE", content: data.actionTitle, link: "", iconType: "title" });
                            setViewerOpen(true);
                          }}
                          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 dark:bg-zinc-800/80 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <Eye size={12} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 w-full">
                      <p className="text-sm text-gray-600 dark:text-zinc-400 truncate flex-1">
                        {data.actionDesc}
                      </p>
                      {data.actionDesc && data.actionDesc.length > 80 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewerSlideIndex(0);
                            setViewerConfig({ 
                              title: data.actionFormat === "pointers" ? "ACTION POINTERS" : "ACTION DESCRIPTION", 
                              content: data.actionFormat === "pointers" ? data.actionPointers : data.actionDesc, 
                              link: "", 
                              iconType: data.actionFormat === "pointers" ? "action" : "desc" 
                            });
                            setViewerOpen(true);
                          }}
                          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 dark:bg-zinc-800/80 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <Eye size={12} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                    {(data.dos.length > 0 || data.donts.length > 0 || data.productName) && (
                      <div className="mt-3 flex flex-wrap gap-2 items-center">
                        {data.dos.length > 0 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewerSlideIndex(0);
                              setViewerConfig({ title: "DO'S", content: data.dos, link: "", iconType: "do" });
                              setViewerOpen(true);
                            }}
                            className="flex items-center text-[10px] uppercase tracking-wide px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                          >
                            <span>{data.dos.length} Do{data.dos.length > 1 ? "'s" : ""}</span>
                          </button>
                        )}
                        {data.donts.length > 0 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewerSlideIndex(0);
                              setViewerConfig({ title: "DON'TS", content: data.donts, link: "", iconType: "dont" });
                              setViewerOpen(true);
                            }}
                            className="flex items-center text-[10px] uppercase tracking-wide px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold cursor-pointer hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            <span>{data.donts.length} Don't{data.donts.length > 1 ? "s" : ""}</span>
                          </button>
                        )}
                        {data.productName && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewerConfig({ title: "PRODUCT NAME", content: data.productName, desc: data.productDesc || "", link: data.productLink || "", iconType: "product", image: data.productImage || "" });
                              setViewerOpen(true);
                            }}
                            className="flex items-center text-[10px] uppercase tracking-wide px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold max-w-full gap-1 cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                          >
                            <div className="w-3 h-3 shrink-0"><ProductIcon /></div>
                            <span className="truncate max-w-[100px]">{data.productName}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => openModal(step)}
                    className="w-full min-h-[70px] rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-gray-400 dark:text-zinc-500 transition-colors">
                      <Plus size={16} strokeWidth={2.5} />
                      <span className="text-sm font-medium">Add Action</span>
                    </div>
                  </div>
                )}
              </div>
            )})}
          </div>

          {/* Bottom Row: Add another step + Create Routine side by side */}
          <div className="mt-6 mb-0 flex items-center gap-3">
            <button
              onClick={() => setSteps(prev => prev.length < 999 ? [...prev, prev.length + 1] : prev)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 dark:bg-zinc-800 text-sm font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Plus size={15} strokeWidth={2.5} />
              Add step
            </button>

            <button
              onClick={handleCreateRoutine}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-md transition-transform active:scale-[0.98]"
            >
              {editingId ? "Save Changes" : "Create Routine"}
            </button>
          </div>

        </div>
      </div>

      {/* Generic Viewer Modal */}
      <AnimatePresence>
        {viewerOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setViewerOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-[340px] z-10 flex flex-col max-h-[calc(100dvh-10px)] overflow-hidden"
            >
              <div className="overflow-y-auto sheet-scroll p-5 flex flex-col">
                <div className="flex items-center justify-center gap-2 mb-4 shrink-0">
                  {viewerConfig.iconType === "product" && (
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <div className="w-4 h-4">
                        <ProductIcon />
                      </div>
                    </div>
                  )}
                  <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest text-center">
                    {Array.isArray(viewerConfig.content) && viewerConfig.content.length > 0 
                      ? `${viewerSlideIndex + 1} of ${viewerConfig.content.length} ${viewerConfig.title}` 
                      : viewerConfig.title}
                  </h3>
                </div>

                <div className="text-[15px] font-semibold text-gray-900 dark:text-white mb-6 break-words whitespace-pre-wrap text-left shrink-0">
                  {Array.isArray(viewerConfig.content) ? (
                    <div className="flex flex-col gap-3 relative overflow-hidden">
                      {viewerConfig.content.length > 0 && (
                        <AnimatePresence mode="popLayout" custom={viewerSlideDirection}>
                          <motion.div
                            key={viewerSlideIndex}
                            custom={viewerSlideDirection}
                            variants={{
                              enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
                              center: { x: 0, opacity: 1 },
                              exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 })
                            }}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.15}
                            onDragEnd={(e, info) => {
                              if (info.offset.x < -50 && info.velocity.x < -100) {
                                if (viewerSlideIndex < viewerConfig.content.length - 1) {
                                  setViewerSlideDirection(1);
                                  setViewerSlideIndex(prev => prev + 1);
                                }
                              } else if (info.offset.x > 50 && info.velocity.x > 100) {
                                if (viewerSlideIndex > 0) {
                                  setViewerSlideDirection(-1);
                                  setViewerSlideIndex(prev => prev - 1);
                                }
                              }
                            }}
                            className={`w-full border rounded-xl p-4 text-sm leading-relaxed cursor-grab active:cursor-grabbing ${viewerConfig.iconType === "do" ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800/40" : viewerConfig.iconType === "action" ? "bg-purple-50/50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800/40" : "bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800/40"}`}
                          >
                            <span className="text-gray-900 dark:text-zinc-200 break-words">{viewerConfig.content[viewerSlideIndex]}</span>
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </div>
                  ) : viewerConfig.iconType === "desc" ? (
                    <div className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50 rounded-xl p-4 text-sm leading-relaxed text-gray-900 dark:text-zinc-200">
                      {viewerConfig.content}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50 rounded-xl p-4 text-sm leading-relaxed text-gray-900 dark:text-zinc-200 break-words whitespace-pre-wrap">
                        {viewerConfig.content}
                      </div>
                      {viewerConfig.iconType === "product" && viewerConfig.desc && (
                        <div className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50 rounded-xl p-4 text-sm leading-relaxed text-gray-900 dark:text-zinc-200 break-words whitespace-pre-wrap">
                          {viewerConfig.desc}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {viewerConfig.image && (
                  <div className="mb-6 shrink-0 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                    <img src={viewerConfig.image} alt="Product" className="w-full aspect-square object-cover" />
                  </div>
                )}

                {viewerConfig.link && (
                  <div className="mb-6 shrink-0">
                    <a
                      href={viewerConfig.link.startsWith('http') ? viewerConfig.link : `https://${viewerConfig.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700/80 transition-colors"
                    >
                      <span className="truncate font-medium">{viewerConfig.link}</span>
                      <ExternalLink size={16} strokeWidth={2.5} className="shrink-0 text-gray-400" />
                    </a>
                  </div>
                )}
                
                <button
                  onClick={() => setViewerOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md transition-transform active:scale-[0.98] shrink-0 mt-auto"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed top-0 left-0 right-0 z-[160] flex justify-center pointer-events-none mt-[env(safe-area-inset-top,16px)] pt-4">
            <motion.div
              initial={{ opacity: 0, y: -80, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -80, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 200, mass: 0.8 }}
              drag="y"
              dragConstraints={{ top: -100, bottom: 0 }}
              dragElastic={{ top: 1, bottom: 0 }}
              onDragEnd={(e, info) => {
                if (info.offset.y < -20 || info.velocity.y < -300) {
                  setToastMessage("");
                }
              }}
              className="pointer-events-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] text-sm font-semibold whitespace-nowrap border border-gray-800 dark:border-gray-200 cursor-grab active:cursor-grabbing"
            >
              {toastMessage}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unsaved Warning Modal */}
      <AnimatePresence>
        {unsavedWarningOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setUnsavedWarningOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-[320px] p-6 z-10 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 flex items-center justify-center mb-4">
                <AlertCircle size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Unsaved Routine</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
                You have unsaved changes. Do you want to save this routine before leaving?
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => {
                    setUnsavedWarningOpen(false);
                    setDiscardConfirmOpen(true);
                  }}
                  className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={() => {
                    setUnsavedWarningOpen(false);
                    handleCreateRoutine();
                    router.push(pendingPath);
                  }}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
                >
                  Save Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Discard Confirmation Modal */}
      <AnimatePresence>
        {discardConfirmOpen && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDiscardConfirmOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-[320px] p-6 z-10 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 flex items-center justify-center mb-4">
                <AlertCircle size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Discard Changes?</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
                Your recent changes will be trashed and cannot be recovered. Are you sure you want to discard?
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => {
                    setDiscardConfirmOpen(false);
                    setUnsavedWarningOpen(true);
                  }}
                  className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setDiscardConfirmOpen(false);
                    router.push('/routine');
                  }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteConfirmOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl w-full max-w-[340px] z-10"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Step?</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
                Are you sure you want to delete this step? All action data will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeDelete(stepToDelete)}
                  className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Action Modal - Bottom Sheet Style */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* Sheet Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 250, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(e, info) => {
              // Auto close if dragged down more than 100px or with sufficient downward velocity
              if (info.offset.y > 100 || info.velocity.y > 300) {
                closeModal();
              }
            }}
            className="relative w-full h-[90vh] flex flex-col bg-white dark:bg-zinc-900 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-10 mx-auto max-w-[430px] overflow-hidden"
            ref={viewportRef}
          >
            {/* Fixed Handle Area — NOT inside scroll */}
            <div className="shrink-0 w-full pt-4 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-14 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full pointer-events-none" />
            </div>

            {/* Scrollable area — fills rest of modal, scrollbar hugs right wall */}
            <div
              ref={scrollAreaRef}
              className="flex-1 overflow-y-auto overflow-x-hidden sheet-scroll"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* All content has left+right padding INSIDE the scroll div */}
              <div className="px-5 pb-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-3 mt-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Step {activeStep} — Add Action
                  </h2>
                  <button
                    onClick={closeModal}
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Action Title */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Action Title
                  </label>
                  <input
                    type="text"
                    maxLength={99}
                    placeholder="e.g. Apply Vitamin C"
                    value={actionTitle}
                    onChange={(e) => setActionTitle(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-zinc-600 transition-all"
                  />
                </div>

                {/* Action Description */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                      Action Description
                    </label>
                    <button
                      onClick={() => {
                        if (actionFormat === "paragraph") {
                          if (actionDesc.trim() !== "") {
                            setActionPointers([actionDesc.trim(), ""]);
                          } else {
                            setActionPointers([""]);
                          }
                          setActionFormat("pointers");
                        } else {
                          if (actionPointers.length > 0 && actionPointers[0].trim() !== "") {
                            setActionDesc(actionPointers.filter(p => p.trim() !== "").join("\n"));
                          }
                          setActionFormat("paragraph");
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                    >
                      {actionFormat === "paragraph" ? <List size={16} /> : <AlignLeft size={16} />}
                    </button>
                  </div>
                  
                  {actionFormat === "paragraph" ? (
                    <div className="w-full rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                      <textarea
                        maxLength={1000}
                        placeholder="Describe what to do in this step..."
                        value={actionDesc}
                        onInput={handleAutoResize}
                        onChange={(e) => setActionDesc(e.target.value)}
                        className="w-full bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none resize-none overflow-y-auto sheet-scroll block"
                        style={{ minHeight: '66px', maxHeight: '130px' }}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {actionPointers.slice(0, LIST_LIMITS.actionPointers).map((item, index) => (
                        <div key={`ptr-${index}`} className="flex items-start gap-2">
                          <span className="text-gray-400 dark:text-zinc-500 font-semibold text-sm pt-2 w-4 text-right shrink-0">
                            {index + 1}.
                          </span>
                          <div className="w-full rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                            <textarea
                              rows={1}
                              maxLength={1000}
                              placeholder={index === 0 ? "e.g. Apply on damp skin" : "Add another pointer..."}
                              value={item}
                              onInput={handleAutoResize}
                              onChange={(e) => handleListUpdate(setActionPointers, actionPointers, index, e.target.value, "actionPointers")}
                              className="w-full bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none resize-none overflow-y-auto sheet-scroll block"
                              style={{ minHeight: '40px', maxHeight: '130px' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Name */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Product Name <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={99}
                    placeholder="e.g. Glow Recipe Dew Drops"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-zinc-600 transition-all"
                  />
                </div>

                {/* Product Description (Conditionally Rendered) */}
                {productName.trim() !== "" && (
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Product Description <span className="normal-case font-normal">(optional)</span>
                    </label>
                    <textarea
                      maxLength={99}
                      rows={2}
                      placeholder="Short description of the product..."
                      value={productDesc}
                      onInput={handleAutoResize}
                      onChange={(e) => setProductDesc(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-zinc-600 transition-all resize-none overflow-y-auto sheet-scroll block"
                      style={{ minHeight: '66px', maxHeight: '100px' }}
                    />
                  </div>
                )}


                {productName.trim() !== "" && (
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Product Image <span className="normal-case font-normal">(recommended 400x400px)</span>
                    </label>
                    {productImage ? (
                      <div 
                        className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 cursor-pointer"
                        onClick={() => setPreviewImageOpen(true)}
                      >
                        <img src={productImage} alt="Product" className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductImage("");
                          }}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors z-10"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl bg-gray-50/50 dark:bg-zinc-800/30 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors py-6 text-gray-400 dark:text-zinc-500">
                          <AddImageIcon className="w-6 h-6 mb-2" />
                          <span className="text-sm font-medium">Add Image</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Product Link (Conditionally Rendered) */}
                {productName.trim() !== "" && (
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Product Link <span className="normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={productLink}
                      onChange={(e) => setProductLink(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-zinc-600 transition-all"
                    />
                  </div>
                )}

                {/* Do & Don't Auto-lists */}
                <div className="mb-5 flex flex-col gap-5">

                  {/* DO List */}
                  <div>
                    <label className="block text-xs font-semibold text-green-600 dark:text-green-400 mb-2 uppercase tracking-wider">
                      ✓ DO <span className="normal-case font-normal">(optional)</span>
                    </label>
                    <div className="flex flex-col gap-2">
                      {dos.slice(0, LIST_LIMITS.dos).map((item, index) => (
                        <div key={`do-${index}`} className="flex items-start gap-2">
                          <span className="text-green-600/60 dark:text-green-400/60 font-semibold text-sm pt-2 w-4 text-right shrink-0">
                            {index + 1}.
                          </span>
                          <div className="w-full rounded-xl overflow-hidden border border-green-200 dark:border-green-800/40 bg-green-50/50 dark:bg-green-900/10">
                            <textarea
                              rows={1}
                              maxLength={1000}
                              placeholder={index === 0 ? "e.g. Apply on damp skin" : "Add another do..."}
                              value={item}
                              onInput={handleAutoResize}
                              onChange={(e) => handleListUpdate(setDos, dos, index, e.target.value, "dos")}
                              className="w-full bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none resize-none overflow-y-auto sheet-scroll block"
                              style={{ minHeight: '40px', maxHeight: '130px' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DON'T List */}
                  <div>
                    <label className="block text-xs font-semibold text-red-500 dark:text-red-400 mb-2 uppercase tracking-wider">
                      ✕ DON'T <span className="normal-case font-normal">(optional)</span>
                    </label>
                    <div className="flex flex-col gap-2">
                      {donts.slice(0, LIST_LIMITS.donts).map((item, index) => (
                        <div key={`dont-${index}`} className="flex items-start gap-2">
                          <span className="text-red-500/60 dark:text-red-400/60 font-semibold text-sm pt-2 w-4 text-right shrink-0">
                            {index + 1}.
                          </span>
                          <div className="w-full rounded-xl overflow-hidden border border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10">
                            <textarea
                              rows={1}
                              maxLength={1000}
                              placeholder={index === 0 ? "e.g. Avoid eye area" : "Add another don't..."}
                              value={item}
                              onInput={handleAutoResize}
                              onChange={(e) => handleListUpdate(setDonts, donts, index, e.target.value, "donts")}
                              className="w-full bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none resize-none overflow-y-auto sheet-scroll block"
                              style={{ minHeight: '40px', maxHeight: '130px' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Save Action */}
                <button
                  onClick={saveAction}
                  disabled={!actionTitle.trim() || !actionDesc.trim()}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-md transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                >
                  Save Action Step {activeStep}
                </button>

              </div>
            </div>

            {/* Draggable Scroll-Down Circle */}
            <DraggableScrollDownCircle
              scrollAreaRef={scrollAreaRef}
              isSaveBtnVisible={isSaveBtnVisible}
              active={modalOpen}
            />

          </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Preview Modal */}
      <AnimatePresence>
        {previewImageOpen && productImage && (
          <motion.div 
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 cursor-zoom-out" 
            onClick={() => setPreviewImageOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 300 } }}
              exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.2 } }}
              src={productImage}
              alt="Preview"
              className="relative z-10 max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Page Draggable Scroll-Down Circle */}
      <DraggableScrollDownCircle
        isSaveBtnVisible={modalOpen || isMainSaveBtnVisible}
        active={true}
        useMainElement={true}
      />

    </>
  );
}
