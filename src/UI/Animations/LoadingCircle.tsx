import { motion } from 'motion/react';

type LoadingCircleProps = {
  size?: number;
  strokeWidth?: number;
  color?: string;
};

export const LoadingCircle = ({ size = 16, strokeWidth = 0.753333, color = 'currentColor' }: LoadingCircleProps) => {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.path
        d="M14.2009 9.17644C14.0003 10.3138 13.479 11.3702 12.6983 12.2213C11.9176 13.0724 10.9101 13.6828 9.79421 13.9807C8.25714 14.3925 6.61941 14.1769 5.2413 13.3813C3.8632 12.5856 2.8576 11.2751 2.44575 9.73804C2.03389 8.20097 2.2495 6.56323 3.04515 5.18513C3.8408 3.80702 5.15131 2.80143 6.68839 2.38957C7.80368 2.08961 8.98144 2.11446 10.0831 2.4612C11.1847 2.80794 12.1644 3.46214 12.9068 4.34681"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          transformOrigin: 'center',
        }}
      />
    </svg>
  );
};
