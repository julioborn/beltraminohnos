"use client";

import { useEffect, useRef, useState } from "react";

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;
const TOP_ZONE_FRACTION = 1 / 3;

export function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const currentPull = useRef(0);
  const isRefreshing = useRef(false);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (isRefreshing.current || window.scrollY > 0) return;
      const y = e.touches[0].clientY;
      if (y > window.innerHeight * TOP_ZONE_FRACTION) return;
      startY.current = y;
      pulling.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!pulling.current || startY.current === null) return;
      const y = e.touches[0].clientY;
      const delta = y - startY.current;
      if (delta <= 0 || window.scrollY > 0) {
        pulling.current = false;
        currentPull.current = 0;
        setPullDistance(0);
        return;
      }
      e.preventDefault();
      const next = Math.min(delta * 0.5, MAX_PULL);
      currentPull.current = next;
      setPullDistance(next);
    }

    function onTouchEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      startY.current = null;
      if (currentPull.current >= PULL_THRESHOLD) {
        isRefreshing.current = true;
        setRefreshing(true);
        window.location.reload();
      } else {
        currentPull.current = 0;
        setPullDistance(0);
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  const visible = pullDistance > 0 || refreshing;
  const indicatorPull = refreshing ? 40 : pullDistance;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 z-[9999] flex justify-center transition-opacity duration-200"
      style={{ top: "env(safe-area-inset-top)", opacity: visible ? 1 : 0 }}
    >
      <div
        className="mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(20,29,58,0.25)]"
        style={{ transform: `translateY(${indicatorPull - 40}px)` }}
      >
        <svg
          className={`h-5 w-5 text-btm-navy ${refreshing ? "animate-spin" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={!refreshing ? { transform: `rotate(${Math.min(pullDistance / PULL_THRESHOLD, 1) * 180}deg)` } : undefined}
        >
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 3v6h-6" />
        </svg>
      </div>
    </div>
  );
}
