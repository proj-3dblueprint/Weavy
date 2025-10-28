import type { SvgComponent } from '@/types/SvgComponent';

export const GlobeIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <g clipPath="url(#clip0_36_501)">
        <path d="M3 12H21" stroke="currentColor" strokeWidth="1.13" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
          stroke="currentColor"
          strokeWidth="1.13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.75 12C15.75 18 12 21 12 21C12 21 8.25 18 8.25 12C8.25 6 12 3 12 3C12 3 15.75 6 15.75 12Z"
          stroke="currentColor"
          strokeWidth="1.13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_36_501">
          <rect width="24" height="24" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};
