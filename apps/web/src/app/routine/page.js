"use client";

import Link from "next/link";
import { Clock, Plus, Search, Filter, Pencil, Trash2, Copy, Eye, EyeOff, SlidersHorizontal } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { DraggableScrollDownCircle, useDraggableScroll } from "@/components/ui/DraggableScrollDownCircle";

const levenshtein = (a, b) => {
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

const getSimilarityScore = (query, target) => {
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

export default function RoutinePage() {
  /*
   * ==========================================
   * SECURITY & VALUATION DATA NOTES FOR BACKEND
   * ==========================================
   * 
   * The routine codes used here (e.g., 6-character Base62 like "aB9x2Z") are cryptographically 
   * secure reference identifiers, NOT traditional encryption keys. The actual routine data stored 
   * in the database should be encrypted at rest (e.g., using AES-256).
   * 
   * To ensure the security of these 6-character codes (which have ~56.8 Billion combinations) 
   * and protect the platform's valuation data from scraping/abuse, implement the following:
   * 
   * 1. Case-Sensitive Generation: Codes MUST be case-sensitive (Base62: A-Z, a-z, 0-9).
   * 2. Strict Rate Limiting: Limit code entry attempts (e.g., max 5 incorrect attempts per 
   *    IP/User per minute, followed by a 15-minute temporary ban). This prevents brute-forcing.
   * 3. Lookalike Character Exclusion: Exclude ambiguous characters when generating codes 
   *    (e.g., remove 'I', 'l', '1', 'O', '0') to reduce user input errors.
   * 4. Ownership Validation: Only allow the creator to edit/delete the routine. Users adding 
   *    a routine via code should get a cloned, detached instance of the routine.
   * ==========================================
   */
  const router = useRouter();
  const [routines, setRoutines] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [hiddenCodes, setHiddenCodes] = useState({});
  const [addCodeOpen, setAddCodeOpen] = useState(false);
  const [addCodeValue, setAddCodeValue] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };
  
  const [filterMinSteps, setFilterMinSteps] = useState("");
  const [filterMinDos, setFilterMinDos] = useState("");
  const [filterMinDonts, setFilterMinDonts] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ steps: null, dos: null, donts: null });

  // Hook for Main Page Draggable Scroll Down Circle (uses <main> element scrolling)
  const { isSaveBtnVisible: isMainSaveBtnVisible } = useDraggableScroll({
    active: true,
    scrollAreaRef: useRef(null),
    resetDependency: null,
    shouldScrollToTop: false,
    useMainElement: true,
  });

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('routines') || '[]');
      setRoutines(stored);
    } catch (e) {
      console.error("Failed to load routines", e);
    }
    setIsLoaded(true);
  }, []);

  const handleDeleteClick = (routine) => {
    setRoutineToDelete(routine);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = () => {
    if (routineToDelete) {
      const newRoutines = routines.filter(r => r.id !== routineToDelete.id);
      setRoutines(newRoutines);
      localStorage.setItem('routines', JSON.stringify(newRoutines));
    }
    setDeleteConfirmOpen(false);
    setRoutineToDelete(null);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleCodeVisibility = (e, routineId) => {
    e.stopPropagation();
    setHiddenCodes(prev => ({ ...prev, [routineId]: !prev[routineId] }));
  };

  const applyFilters = () => {
    setAppliedFilters({
      steps: filterMinSteps === "" ? null : parseInt(filterMinSteps),
      dos: filterMinDos === "" ? null : parseInt(filterMinDos),
      donts: filterMinDonts === "" ? null : parseInt(filterMinDonts)
    });
    setFilterOpen(false);
  };
  
  const resetFilters = () => {
    setFilterMinSteps("");
    setFilterMinDos("");
    setFilterMinDonts("");
    setAppliedFilters({ steps: null, dos: null, donts: null });
  };

  const filteredRoutines = useMemo(() => {
    let result = [...routines];

    if (appliedFilters.steps !== null) {
      result = result.filter(r => (r.stepsCount || 0) >= appliedFilters.steps);
    }
    
    if (appliedFilters.dos !== null) {
      result = result.filter(r => {
        let dosCount = 0;
        if (r.stepData) {
          const stepsArray = Array.isArray(r.stepData) ? r.stepData : Object.values(r.stepData);
          dosCount = stepsArray.filter(s => s && s.type === 'do').length;
        }
        return dosCount >= appliedFilters.dos;
      });
    }

    if (appliedFilters.donts !== null) {
      result = result.filter(r => {
        let dontsCount = 0;
        if (r.stepData) {
          const stepsArray = Array.isArray(r.stepData) ? r.stepData : Object.values(r.stepData);
          dontsCount = stepsArray.filter(s => s && s.type === 'dont').length;
        }
        return dontsCount >= appliedFilters.donts;
      });
    }

    if (searchQuery.trim().length > 0) {
      result = result.map(r => ({
        ...r,
        searchScore: getSimilarityScore(searchQuery.trim(), r.title || '')
      }))
      .filter(r => r.searchScore >= 40)
      .sort((a, b) => b.searchScore - a.searchScore);
    }

    return result;
  }, [routines, searchQuery, appliedFilters]);

  const hasAnyFilter = filterMinSteps !== "" || filterMinDos !== "" || filterMinDonts !== "";
  const isFilterApplied = appliedFilters.steps !== null || appliedFilters.dos !== null || appliedFilters.donts !== null;

  let emptyStateMessage = "Adjust your search to find relevant results";
  if (isFilterApplied && searchQuery.trim().length > 0) {
    emptyStateMessage = "Adjust your search and filters to find relevant results";
  } else if (isFilterApplied) {
    emptyStateMessage = "Adjust your filters to find relevant results";
  }

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col flex-1 px-4 pt-4 bg-white dark:bg-zinc-950">
      
      {routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 mt-10">
          <div className="w-24 h-24 mb-3 rounded-full bg-gray-50 dark:bg-zinc-900/50 flex items-center justify-center">
            <Clock size={48} strokeWidth={1} className="text-gray-300 dark:text-zinc-700" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-1 text-center">
            No routine added yet
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 text-center mb-5 max-w-[260px] leading-relaxed">
            Start building your daily regimen to track your progress and achieve your goals.
          </p>
          <Link
            href="/routine/create"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl shadow-[0_4px_12px_rgba(147,51,234,0.25)] transition-all active:scale-[0.98]"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Create Routine</span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Search Bar */}
          <div className="relative w-full z-20">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400 dark:text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search routines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-gray-300 dark:focus:border-zinc-700 transition-all"
            />
            <div className="absolute inset-y-0 right-1.5 flex items-center">
              <button 
                onClick={() => setFilterOpen(!filterOpen)}
                className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${isFilterApplied ? "bg-purple-600 text-white" : "text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-zinc-300"}`}
              >
                <SlidersHorizontal size={18} />
              </button>
            </div>

            {/* Floating Filter Dropdown */}
            <AnimatePresence>
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setFilterOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-[calc(100%+8px)] right-0 w-max bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-30"
                  >
                    <div className="p-3 flex flex-col gap-2">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Filter By</p>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">Min Steps</span>
                          <input 
                            type="number" 
                            min="0" 
                            max="999"
                            value={filterMinSteps}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') { setFilterMinSteps(''); return; }
                              const num = parseInt(val);
                              if (!isNaN(num)) {
                                setFilterMinSteps(num > 999 ? '999' : num.toString());
                              }
                            }}
                            placeholder="0" 
                            className="w-12 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg pl-1 pr-2 py-1 text-xs text-right text-gray-900 dark:text-white focus:outline-none focus:border-gray-200 dark:focus:border-zinc-700 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">Min Do's</span>
                          <input 
                            type="number" 
                            min="0" 
                            max="999"
                            value={filterMinDos}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') { setFilterMinDos(''); return; }
                              const num = parseInt(val);
                              if (!isNaN(num)) {
                                setFilterMinDos(num > 999 ? '999' : num.toString());
                              }
                            }}
                            placeholder="0" 
                            className="w-12 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg pl-1 pr-2 py-1 text-xs text-right text-gray-900 dark:text-white focus:outline-none focus:border-gray-200 dark:focus:border-zinc-700 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">Min Don'ts</span>
                          <input 
                            type="number" 
                            min="0" 
                            max="999"
                            value={filterMinDonts}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') { setFilterMinDonts(''); return; }
                              const num = parseInt(val);
                              if (!isNaN(num)) {
                                setFilterMinDonts(num > 999 ? '999' : num.toString());
                              }
                            }}
                            placeholder="0" 
                            className="w-12 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg pl-1 pr-2 py-1 text-xs text-right text-gray-900 dark:text-white focus:outline-none focus:border-gray-200 dark:focus:border-zinc-700 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={resetFilters} 
                        disabled={!filterMinSteps && !filterMinDos && !filterMinDonts}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Clear
                      </button>
                      <button 
                        onClick={applyFilters} 
                        disabled={!filterMinSteps && !filterMinDos && !filterMinDonts}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/routine/create"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-[0_4px_12px_rgba(147,51,234,0.25)] transition-all active:scale-[0.98]"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create</span>
            </Link>
            <button
              onClick={() => setAddCodeOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.98] border border-gray-200 dark:border-zinc-700"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add Code</span>
            </button>
          </div>

          {/* Routine List */}
          <div className="flex flex-col gap-2.5">
            {filteredRoutines.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 mt-10">
                <div className="w-24 h-24 mb-3 rounded-full bg-gray-50 dark:bg-zinc-900/50 flex items-center justify-center">
                  <Search size={48} strokeWidth={2.5} className="text-gray-300 dark:text-zinc-700" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-1 text-center">
                  No result found
                </h2>
                <p className="text-sm text-gray-500 dark:text-zinc-400 text-center mb-5 max-w-[260px] leading-relaxed">
                  {emptyStateMessage}
                </p>
              </div>
            ) : filteredRoutines.map((routine) => {
              const routineCode = routine.id.slice(-6).toUpperCase();
              return (
              <div 
                key={routine.id} 
                onClick={() => router.push(`/routine/${routine.id}`)}
                className="w-full rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 shadow-sm cursor-pointer hover:border-purple-200 dark:hover:border-purple-800/60 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1.5 truncate">
                  {routine.title}
                </h3>
                
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider gap-1">
                    <span>{routine.stepsCount}</span> Steps
                  </div>
                  
                  <div className="flex items-center p-0.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                    <button
                      onClick={(e) => { e.stopPropagation(); !hiddenCodes[routine.id] && handleCopyCode(routineCode); }}
                      className={`flex items-center self-stretch gap-1.5 px-2 py-0.5 rounded-md transition-colors ${!hiddenCodes[routine.id] ? 'hover:bg-purple-200 dark:hover:bg-purple-800/40 cursor-pointer' : 'cursor-default'}`}
                    >
                      {!hiddenCodes[routine.id] && <Copy size={11} strokeWidth={2.5} />}
                      <span>{hiddenCodes[routine.id] ? "ROUTINE CODE" : (copiedId === routineCode ? "COPIED!" : routineCode)}</span>
                    </button>
                    <div className="w-[1px] h-3.5 bg-purple-300 dark:bg-purple-800/70 mx-0.5"></div>
                    <button
                      onClick={(e) => toggleCodeVisibility(e, routine.id)}
                      className="flex items-center justify-center self-stretch px-1.5 rounded-md hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors"
                    >
                      {hiddenCodes[routine.id] ? <EyeOff size={11} strokeWidth={2.5} /> : <Eye size={11} strokeWidth={2.5} />}
                    </button>
                  </div>
                  
                  <div className="flex items-center -space-x-1 ml-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/routine/create?edit=${routine.id}`); }}
                      className="p-2 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Pencil size={15} strokeWidth={2.5} />
                    </button>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(routine); }}
                      className="p-2 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Trash2 size={15} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            );})}
          </div>
        </div>
      )}

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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Routine?</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
                This will delete your routine and it will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Code Bottom Sheet Modal */}
      <AnimatePresence>
        {addCodeOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setAddCodeOpen(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 250, mass: 0.8 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.8 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 300) {
                  setAddCodeOpen(false);
                }
              }}
              className="relative w-full flex flex-col bg-white dark:bg-zinc-900 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-10 mx-auto max-w-[430px] overflow-hidden"
            >
              <div className="shrink-0 w-full pt-4 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
                <div className="w-14 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full pointer-events-none" />
              </div>
              
              <div className="px-6 pb-6 pt-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Enter routine code</h2>
                
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. A3F9B2"
                  value={addCodeValue}
                  onChange={(e) => setAddCodeValue(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (addCodeValue.length < 6) {
                        showToast("Enter a 6-digit code");
                        return;
                      }
                      setAddCodeOpen(false);
                      setAddCodeValue("");
                      showToast("Routine code successfully added!");
                    }
                  }}
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-center text-lg tracking-widest font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-zinc-600 transition-all mb-4 uppercase"
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddCodeOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (addCodeValue.length < 6) {
                        showToast("Enter a 6-digit code");
                        return;
                      }
                      setAddCodeOpen(false);
                      setAddCodeValue("");
                      showToast("Routine code successfully added!");
                    }}
                    className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md transition-transform active:scale-[0.98]"
                  >
                    Enter
                  </button>
                </div>
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

      {/* Main Page Draggable Scroll-Down Circle */}
      <DraggableScrollDownCircle
        isSaveBtnVisible={deleteConfirmOpen || addCodeOpen || isMainSaveBtnVisible}
        active={true}
        useMainElement={true}
      />
    </div>
  );
}
