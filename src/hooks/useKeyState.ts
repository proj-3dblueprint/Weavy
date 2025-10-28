import { useEffect, useState } from 'react';

export function useKeyState(keyCode: string): [isPressed: boolean, setIsPressed: (newValue: boolean) => void] {
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key.toLowerCase() === keyCode.toLowerCase()) {
        setIsPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent): void => {
      if (e.key.toLowerCase() === keyCode.toLowerCase()) {
        setIsPressed(false);
      }
    };

    const handleFocusLoss = (): void => {
      setIsPressed(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('contextmenu', handleFocusLoss);
    window.addEventListener('blur', handleFocusLoss);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('contextmenu', handleFocusLoss);
      window.removeEventListener('blur', handleFocusLoss);
    };
  }, [keyCode]);

  return [isPressed, setIsPressed];
}
