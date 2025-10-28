import { Tooltip, Typography, TypographyProps } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

interface EllipsisTextProps extends TypographyProps {
  maxWidth?: string;
  disableHoverListener?: boolean;
  delay?: number;
}

export const EllipsisText = ({
  children,
  maxWidth,
  disableHoverListener = false,
  delay = 100,
  ...props
}: EllipsisTextProps) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const currentRef = textRef.current;
    const checkOverflow = () => {
      if (currentRef) {
        setIsOverflowing(currentRef.scrollWidth > currentRef.clientWidth);
      }
    };

    checkOverflow();

    let resizeObserver: ResizeObserver;
    if (currentRef && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(checkOverflow);
      resizeObserver.observe(currentRef);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [children]);

  return (
    <Tooltip
      title={isOverflowing ? children : undefined}
      enterDelay={delay}
      disableHoverListener={disableHoverListener}
      placement="auto"
      slotProps={{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 8],
              },
            },
          ],
        },
      }}
    >
      <Typography
        noWrap
        textOverflow="ellipsis"
        overflow="hidden"
        maxWidth={maxWidth}
        sx={{ ...props.sx }}
        {...props}
        ref={textRef}
      >
        {children}
      </Typography>
    </Tooltip>
  );
};
