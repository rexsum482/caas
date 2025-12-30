import { useRef, useState } from "react";

const SWIPE_THRESHOLD = 60;
const MAX_SWIPE = 80;

export default function useSwipeToDelete() {
  const swipeState = useRef({});
  const [, forceRender] = useState(0);

  const getState = (id) => swipeState.current[id] || {};

  const onPointerDown = (id, x) => {
    swipeState.current[id] = {
      startX: x,
      deltaX: 0,
      open: false,
    };
  };

  const onPointerMove = (id, x) => {
    const s = swipeState.current[id];
    if (!s) return;

    const deltaX = Math.min(0, x - s.startX);
    s.deltaX = Math.max(deltaX, -MAX_SWIPE);
    forceRender(n => n + 1);
  };

  const onPointerUp = (id) => {
    const s = swipeState.current[id];
    if (!s) return;

    s.open = Math.abs(s.deltaX) > SWIPE_THRESHOLD;
    s.deltaX = s.open ? -MAX_SWIPE : 0;
    forceRender(n => n + 1);
  };

  const reset = (id) => {
    delete swipeState.current[id];
    forceRender(n => n + 1);
  };

  return {
    getState,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    reset,
    SWIPE_THRESHOLD,
    MAX_SWIPE,
  };
}
