import type { SvgComponent } from '@/types/SvgComponent';

export const AngleIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <path
        d="M6.25 9.75C8.63695 9.75 10.9261 10.6982 12.614 12.386C14.3018 14.0739 15.25 16.3631 15.25 18.75"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 3V21H20.5" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
