import { useEffect, useRef, useState, useCallback } from 'react';

export default function usePullToRefresh(onRefresh) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const pulling = useRef(false);

  const THRESHOLD = 60;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPullDistance(0);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    function onTouchStart(e) {
      if (root.scrollTop <= 0 && !refreshing) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    }

    function onTouchMove(e) {
      if (!pulling.current || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && root.scrollTop <= 0) {
        setPullDistance(Math.min(dy * 0.4, 100));
      } else {
        pulling.current = false;
        setPullDistance(0);
      }
    }

    function onTouchEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullDistance >= THRESHOLD) {
        handleRefresh();
      } else {
        setPullDistance(0);
      }
    }

    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: true });
    root.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', onTouchEnd);
    };
  }, [refreshing, pullDistance, handleRefresh]);

  const PullIndicator = () => {
    if (!refreshing && pullDistance <= 5) return null;
    return (
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: refreshing ? 48 : pullDistance }}
      >
        <div className={`w-6 h-6 border-2 border-[#FF9933] border-t-transparent rounded-full ${refreshing ? 'animate-spin' : ''}`}
          style={{ opacity: refreshing ? 1 : Math.min(pullDistance / THRESHOLD, 1), transform: `rotate(${pullDistance * 3}deg)` }}
        />
      </div>
    );
  };

  return { refreshing, PullIndicator };
}
