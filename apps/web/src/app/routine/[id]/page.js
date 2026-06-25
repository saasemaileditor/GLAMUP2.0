"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, ExternalLink, ArrowLeft, ArrowRight, ImageOff } from "lucide-react";

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

export default function RoutineViewerPage() {
  const router = useRouter();
  const params = useParams();
  const [routine, setRoutine] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("action");
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      try {
        const storedRoutines = JSON.parse(localStorage.getItem("routines") || "[]");
        const foundRoutine = storedRoutines.find((r) => r.id === params.id);
        if (foundRoutine) {
          setRoutine(foundRoutine);
        }
      } catch (e) {
        console.error("Error loading routine", e);
      }
    }
    setLoading(false);
  }, [params.id]);

  const stepsKeys = routine ? Object.keys(routine.stepData).map(k => parseInt(k)).sort((a, b) => a - b) : [];
  const totalSteps = stepsKeys.length;
  const currentStepNum = stepsKeys[currentIndex];
  const step = routine ? routine.stepData[currentStepNum] : null;

  const goNext = () => {
    if (currentIndex < totalSteps - 1) {
      setDirection(1);
      setActiveTab("action");
      setCurrentIndex(i => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setActiveTab("action");
      setCurrentIndex(i => i - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "ArrowRight") {
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, totalSteps]);

  if (loading) {
    return (
      <div className="absolute inset-0 bg-white dark:bg-zinc-950 flex items-center justify-center z-50">
        <div className="w-14 h-14 border-[5px] border-purple-200 dark:border-purple-900 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="flex-1 w-full bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 mb-4 rounded-full bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <Clock size={48} className="text-gray-300 dark:text-zinc-700" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Routine Not Found</h2>
        <p className="text-gray-500 dark:text-zinc-400 text-center mb-6">This routine may have been deleted or the link is invalid.</p>
        <button
          onClick={() => router.push("/routine")}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-md transition-transform active:scale-[0.98]"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Always show all 3 tabs
  const tabs = [
    { id: "action", label: "Action" },
    { id: "dos", label: "Do's" },
    { id: "donts", label: "Don'ts" },
  ];

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-950 min-h-0">

      {/* Header & Progress Bar */}
      <div className="px-6 pt-1 pb-3 flex flex-col items-center shrink-0 w-full overflow-hidden">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1.5 text-center w-full truncate px-2">
          {routine.title}
        </h1>
        <div className="w-full flex gap-1.5 mb-0.5">
          {stepsKeys.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full flex-1 transition-colors duration-300 ${
                index <= currentIndex
                  ? "bg-purple-600 dark:bg-purple-500"
                  : "bg-purple-100 dark:bg-zinc-800"
              }`}
            />
          ))}
        </div>
        <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
          Step {currentIndex + 1} of {totalSteps}
        </span>
      </div>

      {/* Slide Card */}
      <div className="px-4 pb-4 flex-1 overflow-hidden relative flex flex-col">
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={currentStepNum}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(e, info) => {
              if (info.offset.x < -50 && info.velocity.x < -100) {
                goNext();
              } else if (info.offset.x > 50 && info.velocity.x > 100) {
                goPrev();
              }
            }}
            className="w-full h-full rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-y-auto overflow-x-hidden cursor-grab active:cursor-grabbing"
          >
            {/* Card Top: Action Title label */}
            <div className="px-5 pt-5 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-2">
                {step.actionTitle}
              </p>

              {/* Product Name */}
              {step.productName ? (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  {step.productName}
                </h2>
              ) : (
                <div className="flex items-center gap-2.5 py-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <div className="w-4 h-4 text-gray-400 dark:text-zinc-500"><ProductIcon /></div>
                  </div>
                  <span className="text-sm text-gray-400 dark:text-zinc-500 italic">No product added</span>
                </div>
              )}

              {/* Product Description */}
              {step.productDesc && (
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  {step.productDesc}
                </p>
              )}
            </div>

            {/* Product Image */}
            <div className="mx-5 my-3">
              {step.productImage ? (
                <div className="rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/50">
                  <img
                    src={step.productImage}
                    alt={step.productName || "Product"}
                    className="w-full aspect-square object-cover"
                  />
                </div>
              ) : (
                <div className="w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/30 flex flex-col items-center justify-center py-8 text-gray-400 dark:text-zinc-500">
                  <AddImageIcon className="w-6 h-6 mb-1.5 opacity-60" />
                  <span className="text-xs font-medium">No image added</span>
                </div>
              )}
            </div>

            {/* Product Link */}
            {step.productLink && (
              <div className="mx-5 mb-3">
                <a
                  href={step.productLink.startsWith("http") ? step.productLink : `https://${step.productLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700/80 transition-colors"
                >
                  <span className="truncate font-medium text-xs">View Product</span>
                  <ExternalLink size={14} strokeWidth={2.5} className="shrink-0 text-gray-400" />
                </a>
              </div>
            )}

            {/* Tabs: Action / Do's / Don'ts — always all three */}
            <div className="flex items-center justify-center px-5 pt-2 pb-1">
              <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 w-full">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      activeTab === tab.id
                        ? "bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                        : "text-gray-500 dark:text-zinc-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content — inside a card */}
            <div className="px-5 pt-2 pb-4">
              <div className="rounded-xl bg-gray-50/70 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-700/40 p-4">
                {activeTab === "action" && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    {step.actionFormat === "pointers" && step.actionPointers?.length > 0 ? (
                      <ul className="flex flex-col gap-3 w-full">
                        {step.actionPointers.map((item, i) => (
                          <li key={i} className="border rounded-xl p-3.5 text-sm leading-relaxed bg-purple-50/50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800/40 w-full break-words overflow-hidden" style={{ wordBreak: 'break-word' }}>
                            <span className="font-bold mr-1.5 text-purple-600 dark:text-purple-400">{i + 1}.</span>
                            <span className="text-gray-800 dark:text-zinc-200">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="border rounded-xl p-3.5 text-sm leading-relaxed bg-purple-50/50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800/40 w-full break-words overflow-hidden" style={{ wordBreak: 'break-word' }}>
                        <span className="text-gray-800 dark:text-zinc-200 whitespace-pre-wrap">
                          {step.actionDesc || <span className="text-gray-400 italic">No instructions provided.</span>}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "dos" && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    {step.dos?.length > 0 ? (
                      <ul className="flex flex-col gap-3 w-full">
                        {step.dos.map((item, i) => (
                          <li key={i} className="border rounded-xl p-3.5 text-sm leading-relaxed bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800/40 w-full break-words overflow-hidden" style={{ wordBreak: 'break-word' }}>
                            <span className="font-bold mr-1.5 text-green-600 dark:text-green-400">{i + 1}.</span>
                            <span className="text-gray-800 dark:text-zinc-200">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-zinc-500 italic">No do's added for this step.</p>
                    )}
                  </motion.div>
                )}

                {activeTab === "donts" && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    {step.donts?.length > 0 ? (
                      <ul className="flex flex-col gap-3 w-full">
                        {step.donts.map((item, i) => (
                          <li key={i} className="border rounded-xl p-3.5 text-sm leading-relaxed bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800/40 w-full break-words overflow-hidden" style={{ wordBreak: 'break-word' }}>
                            <span className="font-bold mr-1.5 text-red-600 dark:text-red-400">{i + 1}.</span>
                            <span className="text-gray-800 dark:text-zinc-200">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-zinc-500 italic">No don'ts added for this step.</p>
                    )}
                  </motion.div>
                )}
              </div>
            </div>



          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
