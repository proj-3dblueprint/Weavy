import { useRef, useEffect } from 'react';
import { useCanvas } from '@/components/Recipe/FlowContext';

export function CompositorCanvas() {
  const { canvasRef, setParent, unsetParent } = useCanvas();
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef?.current;
    if (!canvas || !container) return;

    setParent(container);
    return () => {
      unsetParent(container);
    };
  }, [canvasRef, setParent, unsetParent]);

  return <div ref={containerRef} style={{ width: '100%', height: '0px', flex: 1 }}></div>;
}
