import React, { useEffect, useState, useRef } from 'react';

export function useContentRect(ref: React.RefObject<Element>) {
  const [dimensions, setDimensions] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const observer = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (ref.current != null) {
      observer.current = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          setDimensions({
            x: entry.contentRect.x,
            y: entry.contentRect.y,
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        });
      });
      observer.current?.observe(ref.current);
    }
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [ref]);

  return dimensions;
}
