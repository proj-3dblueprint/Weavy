import { useEffect, useRef } from 'react';

/** Tracks the mouse position on the screen and returns it as a ref. */
export function useMousePosition() {
  const mousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      mousePosition.current = { x: ev.clientX, y: ev.clientY };
    };

    window.addEventListener('mousemove', updateMousePosition);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return mousePosition;
}
