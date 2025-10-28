import type { SvgComponent } from '@/types/SvgComponent';

// Default direction is Up
export const ArrowIcon: SvgComponent = ({ title, strokeWidth = '1.125', ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <path
        d="M12 20.25L12 3.75"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.25 10.5L12 3.75L18.75 10.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
