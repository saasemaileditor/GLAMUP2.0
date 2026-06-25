import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export function useDraggableScroll({
  active,
  scrollAreaRef,
  resetDependency,
  shouldScrollToTop = true,
  useWindow = false,
  useMainElement = false,
}) {
  const [isSaveBtnVisible, setIsSaveBtnVisible] = useState(true);

  const updateSaveBtnVisibility = useCallback(() => {
    let scrollTop = 0;
    let scrollHeight = 0;
    let clientHeight = 0;

    if (useWindow) {
      scrollTop = window.scrollY || document.documentElement.scrollTop;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = document.documentElement.clientHeight;
    } else if (useMainElement) {
      const main = document.querySelector('main');
      if (!main) return true;
      scrollTop = main.scrollTop;
      scrollHeight = main.scrollHeight;
      clientHeight = main.clientHeight;
    } else {
      if (!scrollAreaRef?.current) return true;
      scrollTop = scrollAreaRef.current.scrollTop;
      scrollHeight = scrollAreaRef.current.scrollHeight;
      clientHeight = scrollAreaRef.current.clientHeight;
    }

    if (scrollHeight <= clientHeight) {
      setIsSaveBtnVisible(true);
      return true;
    }
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 80;
    setIsSaveBtnVisible(isAtBottom);
    return isAtBottom;
  }, [scrollAreaRef, useWindow, useMainElement]);

  useEffect(() => {
    if (active) {
      if (shouldScrollToTop) {
        if (useWindow) {
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else if (useMainElement) {
          const main = document.querySelector('main');
          if (main) main.scrollTop = 0;
        } else if (scrollAreaRef?.current) {
          scrollAreaRef.current.scrollTop = 0;
        }
      }
      setIsSaveBtnVisible(true);

      const timer = setTimeout(() => {
        if (shouldScrollToTop) {
          if (useWindow) {
            window.scrollTo({ top: 0, behavior: 'instant' });
          } else if (useMainElement) {
            const main = document.querySelector('main');
            if (main) main.scrollTop = 0;
          } else if (scrollAreaRef?.current) {
            scrollAreaRef.current.scrollTop = 0;
          }
        }
        updateSaveBtnVisibility();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [active, resetDependency, scrollAreaRef, updateSaveBtnVisibility, shouldScrollToTop, useWindow, useMainElement]);

  useEffect(() => {
    if (!active) return;

    if (useWindow) {
      const handleScroll = () => updateSaveBtnVisibility();
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll);

      const observer = new ResizeObserver(() => updateSaveBtnVisibility());
      if (document.body) observer.observe(document.body);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
        observer.disconnect();
      };
    } else if (useMainElement) {
      const mainEl = document.querySelector('main');
      if (!mainEl) return;
      
      const handleScroll = () => updateSaveBtnVisibility();
      mainEl.addEventListener('scroll', handleScroll, { passive: true });

      const observer = new ResizeObserver(() => updateSaveBtnVisibility());
      observer.observe(mainEl);
      if (mainEl.firstElementChild) observer.observe(mainEl.firstElementChild);

      return () => {
        mainEl.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    } else {
      if (!scrollAreaRef?.current) return;
      const scrollEl = scrollAreaRef.current;
      const contentEl = scrollEl.firstElementChild;
      
      const handleScroll = () => updateSaveBtnVisibility();
      scrollEl.addEventListener('scroll', handleScroll, { passive: true });

      const observer = new ResizeObserver(() => updateSaveBtnVisibility());
      observer.observe(scrollEl);
      if (contentEl) observer.observe(contentEl);

      return () => {
        scrollEl.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    }
  }, [active, scrollAreaRef, updateSaveBtnVisibility, useWindow, useMainElement]);

  return {
    isSaveBtnVisible,
    updateSaveBtnVisibility,
  };
}

export function DraggableScrollDownCircle({
  scrollAreaRef,
  isSaveBtnVisible,
  active,
  useWindow = false,
  useMainElement = false,
}) {
  const containerRef = useRef(null);
  const currentSide = useRef('right');
  const yRatio = useRef(1);
  const isDragging = useRef(false);
  const [mainRect, setMainRect] = useState(null);

  const circleX = useMotionValue(0);
  const circleY = useMotionValue(0);
  const circleControls = useAnimation();

  const circleSize = 40;
  const paddingX = 16;
  const paddingY = 24;
  const minY = 48; // Below header/top

  const updatePosition = useCallback(() => {
    let width = 0;
    let height = 0;

    if (useWindow) {
      width = window.innerWidth;
      height = window.innerHeight;
    } else if (useMainElement) {
      const main = document.querySelector('main');
      if (!main) return;
      width = main.clientWidth;
      height = main.clientHeight;
    } else {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;
    }

    const minX = paddingX;
    const maxX = width - circleSize - paddingX;
    const maxY = height - circleSize - paddingY;

    const targetX = currentSide.current === 'left' ? minX : maxX;
    const targetY = minY + yRatio.current * (maxY - minY);

    circleX.set(targetX);
    circleY.set(targetY);
    circleControls.set({ x: targetX, y: targetY });
  }, [circleX, circleY, circleControls, useWindow, useMainElement]);

  useEffect(() => {
    if (active) {
      currentSide.current = 'right';
      yRatio.current = 1;
      updatePosition();
    }
  }, [active, updatePosition]);

  useEffect(() => {
    circleControls.start({
      opacity: isSaveBtnVisible ? 0 : 1,
      transition: { duration: 0.2 }
    });
  }, [isSaveBtnVisible, circleControls]);

  useEffect(() => {
    if (useWindow) {
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    } else if (useMainElement) {
      const main = document.querySelector('main');
      if (!main) return;
      const observer = new ResizeObserver(() => updatePosition());
      observer.observe(main);
      return () => observer.disconnect();
    } else {
      if (!containerRef.current) return;
      const observer = new ResizeObserver(() => updatePosition());
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [updatePosition, useWindow, useMainElement]);

  // Track <main> element's exact position on screen so the wrapper overlays it precisely
  useEffect(() => {
    if (!useMainElement) return;

    const main = document.querySelector('main');
    if (!main) return;

    const updateRect = () => {
      const rect = main.getBoundingClientRect();
      setMainRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };

    updateRect();

    const observer = new ResizeObserver(updateRect);
    observer.observe(main);
    window.addEventListener('resize', updateRect);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateRect);
    };
  }, [useMainElement]);

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = (e, info) => {
    setTimeout(() => {
      isDragging.current = false;
    }, 100);

    let width = 0;
    let height = 0;

    if (useWindow) {
      width = window.innerWidth;
      height = window.innerHeight;
    } else if (useMainElement) {
      const main = document.querySelector('main');
      if (!main) return;
      width = main.clientWidth;
      height = main.clientHeight;
    } else {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;
    }

    const minX = paddingX;
    const maxX = width - circleSize - paddingX;
    const maxY = height - circleSize - paddingY;

    const currentX = circleX.get();
    const currentY = circleY.get();

    const isLeft = currentX < (width / 2) - (circleSize / 2);
    currentSide.current = isLeft ? 'left' : 'right';

    let targetX = isLeft ? minX : maxX;
    let targetY = Math.max(minY, Math.min(maxY, currentY));

    const totalHeightRange = maxY - minY;
    if (totalHeightRange > 0) {
      yRatio.current = (targetY - minY) / totalHeightRange;
    } else {
      yRatio.current = 1;
    }

    circleControls.start({
      x: targetX,
      y: targetY,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    });
  };

  const handleTap = () => {
    if (isDragging.current) return;

    if (useWindow) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    } else if (useMainElement) {
      const main = document.querySelector('main');
      if (main) {
        main.scrollTo({
          top: main.scrollHeight,
          behavior: 'smooth'
        });
      }
    } else if (scrollAreaRef?.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div 
      ref={(useWindow || useMainElement) ? null : containerRef} 
      className={
        useMainElement
          ? "fixed pointer-events-none z-[150]"
          : useWindow
            ? "fixed inset-0 pointer-events-none z-[150]"
            : "absolute inset-0 pointer-events-none z-50"
      }
      style={
        useMainElement && mainRect
          ? { top: mainRect.top, left: mainRect.left, width: mainRect.width, height: mainRect.height }
          : undefined
      }
    >
      <motion.div
        drag
        dragMomentum={false}
        animate={circleControls}
        style={{
          x: circleX,
          y: circleY,
          pointerEvents: isSaveBtnVisible ? 'none' : 'auto'
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onTap={handleTap}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="absolute left-0 top-0 w-10 h-10 rounded-full border-[1.5px] border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        <ChevronDown className="w-5 h-5 text-gray-900 dark:text-white pointer-events-none" />
      </motion.div>
    </div>
  );
}
